import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
  if (!gemini) throw new Error('GEMINI_API_KEY not configured');

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = [
    'You are a quiz generator that ALWAYS returns strict JSON that matches the provided schema. No preface, only JSON. ',
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
    '\nTask: Generate for topic: ', topic
  ].join('\n');

  // Retry up to 2 times for malformed JSON
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const json = JSON.parse(text);
      const parsed = questionsZ.parse(json);
      return parsed;
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`Gemini parse attempt ${attempt + 1} failed:`, err.message);
      if (attempt === 2) break;
    }
  }
  throw new Error(`Failed to generate valid questions: ${lastError?.message || 'unknown error'}`);
}

export async function generateFeedbackWithAI({ topic, score, total }) {
  if (!gemini) throw new Error('GEMINI_API_KEY not configured');
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = [
    'You are a coach. Output STRICT JSON only matching this schema:',
    FEEDBACK_JSON_SCHEMA,
    'Guidelines:',
    '- Encourage the user with a short, actionable message (<= 60 words).',
    '- Tailor to the topic and score.',
    `- Topic: ${topic}, Score: ${score}/${total}`
  ].join('\n');

  // Retry for malformed JSON
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const json = JSON.parse(text);
      const msg = z.object({ message: z.string().min(5) }).parse(json).message;
      return msg;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Gemini feedback parse attempt ${attempt + 1} failed:`, err.message);
      if (attempt === 2) throw new Error('Failed to generate feedback');
    }
  }
}
