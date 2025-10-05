import { z } from 'zod';

export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3)
});

export const questionsSchema = z.object({
  topic: z.string(),
  questions: z.array(questionSchema).length(5)
});

export const feedbackSchema = z.object({
  message: z.string()
});
