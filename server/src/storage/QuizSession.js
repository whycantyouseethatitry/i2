import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    answers: [
      {
        questionId: String,
        selectedIndex: Number,
        correctIndex: Number
      }
    ],
    score: Number,
    total: Number
  },
  { timestamps: true }
);

export const QuizSession = mongoose.connection.readyState ? mongoose.model('QuizSession', quizResultSchema) : null;
