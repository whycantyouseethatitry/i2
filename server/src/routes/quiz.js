import { Router } from 'express';
import { generateQuestionsWithAI, generateFeedbackWithAI } from '../services/aiService.js';
import { questionsSchema, feedbackSchema } from '../validation.js';

const router = Router();

router.post('/generate', async (req, res) => {
  const { topic, numQuestions = 5, difficulty = 'medium' } = req.body || {};
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Invalid topic' });
  }

  try {
    const result = await generateQuestionsWithAI({ topic, numQuestions, difficulty });
    const parse = questionsSchema.safeParse(result);
    if (!parse.success) {
      return res.status(502).json({ error: 'AI returned malformed data', details: parse.error.issues });
    }
    return res.json(parse.data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

router.post('/feedback', async (req, res) => {
  const { topic, score, total } = req.body || {};
  if (typeof topic !== 'string' || typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const message = await generateFeedbackWithAI({ topic, score, total });
    const parse = feedbackSchema.safeParse({ message });
    if (!parse.success) {
      return res.status(502).json({ error: 'AI returned malformed feedback' });
    }
    return res.json(parse.data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Feedback failed' });
  }
});

export default router;
