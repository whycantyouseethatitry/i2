import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const userPreferredModel = process.env.GEMINI_MODEL?.trim();
const MODEL_CANDIDATES = [
  userPreferredModel,
  'gemini-1.5-flash-002',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-pro',
].filter(Boolean);

const QUESTIONS_JSON_SCHEMA = `{
  "topic": string,
  "questions": Array<{
    "id": string,
    "text": string,
    "options": string[4],
    "correctIndex": number // 0-3
  }>
}`;

const FEEDBACK_JSON_SCHEMA = `{
  "message": string
}`;

const makeQuestionsZ = (count) => z.object({
  topic: z.string(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(5),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
      })
    )
    .length(count),
});

function stripCodeFences(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.startsWith('```')) {
    // Remove leading ``` or ```json and trailing ```
    return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
}

function extractJsonObject(text) {
  // Try direct parse first
  const direct = stripCodeFences(text);
  try {
    return JSON.parse(direct);
  } catch {}

  // Fallback: find first balanced { ... } block
  const s = direct;
  let start = -1;
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = s.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {}
      }
    }
  }
  throw new Error('AI response was not valid JSON.');
}

async function generateWithFallback(prompt) {
  let lastErr = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // eslint-disable-next-line no-console
      console.log(`[Gemini] Using model: ${modelName}`);
      return text;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '');
      const isNotFound = msg.includes('not found') || msg.includes('404');
      const isNotSupported = msg.includes('not supported for generateContent');
      if (!(isNotFound || isNotSupported)) {
        // Other errors (auth, quota, etc.) -> fail fast
        throw err;
      }
      // Try next model candidate
      // eslint-disable-next-line no-console
      console.warn(`Model ${modelName} failed: ${msg}. Trying next candidate...`);
    }
  }
  throw new Error(`All Gemini model candidates failed. Last error: ${lastErr?.message || 'unknown'}`);
}

export async function generateQuestionsWithAI({ topic, numQuestions = 5, difficulty = 'medium' }) {
  if (!gemini) throw new Error('GEMINI_API_KEY not configured');

  const prompt = [
    'You are a quiz generator that ALWAYS returns strict JSON that matches the provided schema. No preface, only JSON.',
    'Constraints:',
    `- Exactly ${numQuestions} multiple-choice questions`,
    '- Each with exactly 4 options',
    '- Include "correctIndex" as an integer (0-3)',
    '- Keep question clear and unambiguous',
    '- Level: ' + difficulty,
    '\nSchema:',
    QUESTIONS_JSON_SCHEMA,
    '\nExample minimal JSON:',
    '{"topic":"Example","questions":[{"id":"q1","text":"Q?","options":["A","B","C","D"],"correctIndex":0},{"id":"q2","text":"Q2?","options":["A","B","C","D"],"correctIndex":1},{"id":"q3","text":"Q3?","options":["A","B","C","D"],"correctIndex":2},{"id":"q4","text":"Q4?","options":["A","B","C","D"],"correctIndex":3},{"id":"q5","text":"Q5?","options":["A","B","C","D"],"correctIndex":0}]}',
    '\nTask: Generate for topic: ',
    topic,
  ].join('\n');

  // Retry malformed JSON up to 3 attempts
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const text = await generateWithFallback(prompt);
      const json = extractJsonObject(text);
      const parsed = makeQuestionsZ(numQuestions).parse(json);
      return parsed;
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`Gemini parse attempt ${attempt + 1} failed:`, err.message);
    }
  }
  throw new Error(`Failed to generate valid questions: ${lastError?.message || 'unknown error'}`);
}

export async function generateFeedbackWithAI({ topic, score, total }) {
  if (!gemini) throw new Error('GEMINI_API_KEY not configured');
  const prompt = [
    'You are a coach. Output STRICT JSON only matching this schema:',
    FEEDBACK_JSON_SCHEMA,
    'Guidelines:',
    '- Encourage the user with a short, actionable message (<= 60 words).',
    '- Tailor to the topic and score.',
    `- Topic: ${topic}, Score: ${score}/${total}`,
  ].join('\n');

  // Retry malformed JSON up to 3 attempts
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const text = await generateWithFallback(prompt);
      const json = extractJsonObject(text);
      const msg = z.object({ message: z.string().min(5) }).parse(json).message;
      return msg;
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`Gemini feedback parse attempt ${attempt + 1} failed:`, err.message);
    }
  }
  throw new Error(`Failed to generate feedback: ${lastError?.message || 'unknown error'}`);
}
