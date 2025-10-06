# AI-Assisted Knowledge Quiz (MERN + Recoil + Gemini)

An AI-powered quiz app that generates topic-based MCQs using Gemini, provides a smooth multi-screen experience, and delivers personalized feedback based on your score. Built with MERN, React + Recoil, Tailwind, and Google Gemini API.

## 1) Project Setup & Demo

Web (Local):

```bash
# in one terminal
cd server
cp .env.example .env # add your GEMINI_API_KEY
npm install
npm run dev

# in another terminal
cd ../client
npm install
npm run dev
```

Then open http://localhost:5173.

Hosted demo: <provide_link_here>

Free Model Setup (No Paid APIs):

```bash
# Use Ollama locally (recommended)
brew install ollama # or see https://ollama.com for your OS
ollama serve &
ollama pull llama3.1

# Configure server
cd server
cp .env.example .env
# Ensure OLLAMA_BASE_URL and OLLAMA_MODEL are set in .env
npm run dev
```

Fallback to Gemini (optional): add `GEMINI_API_KEY` to `server/.env`. The server prefers Ollama first and falls back to Gemini when configured.

## 2) Problem Understanding

- Generate 5 MCQs via AI for a selected topic.
- Display questions one-by-one with Previous/Next and a progress bar.
- On completion, generate a tailored feedback message from AI based on score.
- Must handle malformed AI output with retries and strict JSON validation.
- Build a reusable Question component and a polished UI with loading/error states.

Assumptions:
- Exactly 5 questions per quiz, 4 options each, single correct answer represented by `correctIndex` (0-3).
- Server validates AI output and returns normalized JSON.
- MongoDB persistence is optional; app runs fine without it.

## 3) AI Prompts & Iterations

Question generation prompt (server, enforced JSON + retries):

```
You are a quiz generator that ALWAYS returns strict JSON that matches the provided schema. No preface, only JSON.
Constraints:
- Exactly 5 multiple-choice questions
- Each with exactly 4 options
- Include "correctIndex" as an integer (0-3)
- Keep question clear and unambiguous
- Level: <difficulty>

Schema:
{"topic": string, "questions": [{"id": string, "text": string, "options": string[4], "correctIndex": number}]}

Example minimal JSON:
{"topic":"Example","questions":[{"id":"q1","text":"Q?","options":["A","B","C","D"],"correctIndex":0},{"id":"q2","text":"Q2?","options":["A","B","C","D"],"correctIndex":1},{"id":"q3","text":"Q3?","options":["A","B","C","D"],"correctIndex":2},{"id":"q4","text":"Q4?","options":["A","B","C","D"],"correctIndex":3},{"id":"q5","text":"Q5?","options":["A","B","C","D"],"correctIndex":0}]}

Task: Generate for topic: <topic>
```

Feedback prompt:

```
You are a coach. Output STRICT JSON only matching this schema: {"message": string}
Guidelines:
- Encourage the user with a short, actionable message (<= 60 words).
- Tailor to the topic and score.
- Topic: <topic>, Score: <score>/<total>
```

Refinements made:
- Added minimal example JSON to reduce markdown in responses.
- Enforced "No preface, only JSON" and added retries.
- Validated with Zod before returning to client.

## 4) Architecture & Code Structure

- `server/src/index.js`: Express app, health route, Mongo connection, routers.
- `server/src/routes/quiz.js`: Endpoints `POST /api/quiz/generate` and `POST /api/quiz/feedback`.
- `server/src/services/aiService.js`: Gemini client, prompts, retries, Zod validation.
 - `server/src/services/aiService.js`: Prefers free local Ollama; falls back to Gemini. Strict prompts, JSON-only, retries, and Zod validation.
- `server/src/validation.js`: Zod schemas for strict data shape.
- `server/src/storage/QuizSession.js`: Optional Mongo persistence model.

- `client/src/screens/App.jsx`: Step router (Home -> Quiz -> Result).
- `client/src/screens/Home.jsx`: Topic selection, API call, error/loading.
- `client/src/screens/Quiz.jsx`: Question navigation, progress, submission.
- `client/src/screens/Result.jsx`: Score and AI feedback.
- `client/src/components/QuestionCard.jsx`: Reusable MCQ renderer.
- `client/src/components/ProgressBar.jsx`: Progress UI.
- `client/src/state/atoms.js`: Recoil atoms for topic, questions, answers, UI, feedback.

State Management (Recoil):
- `uiState`: `{ step, loading, error, currentIndex }` controls flow and UX states.
- `topicState`, `questionsState`, `answersState`, `feedbackState` capture core data.

## 5) Screenshots / Screen Recording

- Add screenshots of `Home`, `Quiz`, and `Result` screens here.
- Or attach a short screen recording demonstrating the full flow.

## 6) Known Issues / Improvements

- Could add answer review screen with correct answers highlighted.
- Add difficulty selector and timer per question.
- Add skeleton loaders and micro-interactions.
- Persist sessions and analytics in Mongo (currently optional).
- Add i18n and accessibility refinements (ARIA labels, focus states).
- Rate-limit API and add request auth if hosting publicly.
- Add streaming UI updates for model progress when using Ollama.

## 7) Bonus Work

- Gradient glassmorphism theme, Inter + Space Grotesk typography.
- Animated progress bar and polished button states.
- Friendly TopBar with quick links.
