import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Optional Gemini client (paid/credentialed). We'll prefer free local models via Ollama when available.
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Ollama config for free local LLMs (e.g. llama3.1, mistral, qwen2.5)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

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

const questionsZ = z.object({
  topic: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(5),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3)
    })
  ).length(5)
});

export async function generateQuestionsWithAI({ topic, numQuestions = 5, difficulty = 'medium' }) {
  const basePrompt = [
    'You are a quiz generator that ALWAYS returns strict JSON that matches the provided schema. No preface, only JSON.',
    'Constraints:',
    `- Exactly ${numQuestions} multiple-choice questions`,
    '- Each with exactly 4 options',
    '- Include "correctIndex" as an integer (0-3)',
    '- Keep questions clear and unambiguous',
    `- Level: ${difficulty}`,
    '\nSchema:',
    QUESTIONS_JSON_SCHEMA,
    '\nExample minimal JSON:',
    '{"topic":"Example","questions":[{"id":"q1","text":"Q?","options":["A","B","C","D"],"correctIndex":0},{"id":"q2","text":"Q2?","options":["A","B","C","D"],"correctIndex":1},{"id":"q3","text":"Q3?","options":["A","B","C","D"],"correctIndex":2},{"id":"q4","text":"Q4?","options":["A","B","C","D"],"correctIndex":3},{"id":"q5","text":"Q5?","options":["A","B","C","D"],"correctIndex":0}]}',
    `\nTask: Generate for topic: ${topic}`
  ].join('\n');

  // Helper: robustly parse model output into JSON
  function tryParseJsonStrict(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      // Attempt to extract the first {...} block
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const slice = text.slice(start, end + 1);
        return JSON.parse(slice);
      }
      throw new Error('Invalid JSON output');
    }
  }

  // 1) Prefer free local model via Ollama when reachable
  async function tryOllama() {
    // Use generate endpoint with format json to force valid JSON
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: basePrompt,
        stream: false,
        format: 'json'
      })
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const raw = data?.response || '';
    const obj = tryParseJsonStrict(raw);
    const parsed = questionsZ.parse(obj);
    return parsed;
  }

  // 2) Fallback to Gemini if configured
  async function tryGemini() {
    if (!gemini) throw new Error('Gemini not configured');
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // Retry up to 2 times for malformed JSON
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await model.generateContent(basePrompt);
        const text = result.response.text();
        const json = tryParseJsonStrict(text);
        const parsed = questionsZ.parse(json);
        return parsed;
      } catch (err) {
        lastError = err;
        // eslint-disable-next-line no-console
        console.warn(`Gemini parse attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 2) break;
      }
    }
    throw new Error(`Failed to generate valid questions via Gemini: ${lastError?.message || 'unknown error'}`);
  }

  // Overall retry strategy: try Ollama first for up to 3 attempts, then Gemini (if available)
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await tryOllama();
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`Ollama attempt ${attempt + 1} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  // If Ollama not reachable or keeps failing, attempt Gemini if configured
  if (gemini) {
    return tryGemini();
  }

  throw new Error(`Failed to generate valid questions (no free/local model available): ${lastError?.message || 'unknown error'}`);
}

export async function generateFeedbackWithAI({ topic, score, total }) {
  const basePrompt = [
    'You are a coach. Output STRICT JSON only matching this schema:',
    FEEDBACK_JSON_SCHEMA,
    'Guidelines:',
    '- Encourage the user with a short, actionable message (<= 60 words).',
    '- Tailor to the topic and score.',
    `- Topic: ${topic}, Score: ${score}/${total}`
  ].join('\n');

  const feedbackZ = z.object({ message: z.string().min(5) });

  function tryParseJsonStrict(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        return JSON.parse(text.slice(s, e + 1));
      }
      throw new Error('Invalid JSON output');
    }
  }

  // Prefer free local model via Ollama
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: basePrompt,
          stream: false,
          format: 'json'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.response || '';
        const obj = tryParseJsonStrict(raw);
        const parsed = feedbackZ.parse(obj);
        return parsed.message;
      }
      // eslint-disable-next-line no-console
      console.warn(`Ollama feedback HTTP ${res.status}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Ollama feedback parse attempt ${attempt + 1} failed:`, err.message);
    }
  }

  // Fallback to Gemini if configured
  if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await model.generateContent(basePrompt);
        const text = result.response.text();
        const json = tryParseJsonStrict(text);
        const parsed = feedbackZ.parse(json);
        return parsed.message;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`Gemini feedback parse attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 2) throw new Error('Failed to generate feedback');
      }
    }
  }

  throw new Error('Failed to generate feedback with any provider');
}
