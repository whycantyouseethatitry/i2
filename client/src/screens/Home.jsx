import { useRecoilState } from 'recoil';
import { topicState, uiState, questionsState, answersState, feedbackState } from '../state/atoms.js';
import TopBar from '../components/TopBar.jsx';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Home() {
  const [topic, setTopic] = useRecoilState(topicState);
  const [ui, setUi] = useRecoilState(uiState);
  const [, setQuestions] = useRecoilState(questionsState);
  const [, setAnswers] = useRecoilState(answersState);
  const [, setFeedback] = useRecoilState(feedbackState);

  const presetTopics = ['Wellness', 'Tech Trends', 'Space Exploration', 'Sustainability', 'World History'];

  async function startQuiz(selectedTopic) {
    setTopic(selectedTopic);
    setAnswers({});
    setFeedback(null);
    setUi({ ...ui, loading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE}/api/quiz/generate`, { topic: selectedTopic, numQuestions: 5, difficulty: 'medium' });
      setQuestions(res.data.questions);
      setUi({ step: 2, loading: false, error: null, currentIndex: 0 });
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setUi({ ...ui, loading: false, error: msg });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <TopBar />

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div className="card">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white">Master new topics with AI</h1>
          <p className="mt-4 text-slate-300">Pick a topic and let Gemini craft a crisp 5-question quiz. Navigate smoothly, track progress, and get personalized feedback at the end.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {presetTopics.map((t) => (
              <button key={t} onClick={() => startQuiz(t)} className="btn-secondary">
                {t}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <label className="block text-slate-300 mb-2">Or enter your own topic</label>
            <div className="flex gap-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quantum Computing"
                className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button onClick={() => startQuiz(topic || 'General Knowledge')} className="btn-primary">Generate Quiz</button>
            </div>
          </div>
          {ui.loading && (
            <div className="mt-6 text-slate-300 animate-pulse">Generating questions with Gemini…</div>
          )}
          {ui.error && (
            <div className="mt-4 text-red-400">{ui.error}</div>
          )}
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-brand-500/30 to-emerald-400/30 blur-3xl" />
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1526378722370-8e62f7b04a97?q=80&w=1200&auto=format&fit=crop" alt="Hero" className="rounded-xl opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
}
