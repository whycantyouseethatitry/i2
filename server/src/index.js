import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import quizRouter from './routes/quiz.js';
import sessionRouter from './routes/session.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/quiz', quizRouter);
app.use('/api/session', sessionRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || 'ai_quiz' });
      // eslint-disable-next-line no-console
      console.log('Connected to MongoDB');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('MongoDB connection failed:', err.message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('MONGODB_URI not set. Persistence will be disabled.');
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start();
