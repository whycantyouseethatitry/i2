import { useRecoilState } from 'recoil';
import { uiState, questionsState, answersState, topicState, feedbackState } from '../state/atoms.js';
import TopBar from '../components/TopBar.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Quiz() {
  const [ui, setUi] = useRecoilState(uiState);
  const [questions] = useRecoilState(questionsState);
  const [answers, setAnswers] = useRecoilState(answersState);
  const [topic] = useRecoilState(topicState);
  const [, setFeedback] = useRecoilState(feedbackState);

  const current = questions[ui.currentIndex];
  const selected = answers[current?.id];

  function select(idx) {
    setAnswers({ ...answers, [current.id]: idx });
  }

  function next() {
    if (ui.currentIndex < questions.length - 1) setUi({ ...ui, currentIndex: ui.currentIndex + 1 });
  }

  function prev() {
    if (ui.currentIndex > 0) setUi({ ...ui, currentIndex: ui.currentIndex - 1 });
  }

  async function submit() {
    const total = questions.length;
    const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
    setUi({ ...ui, loading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE}/api/quiz/feedback`, { topic, score, total });
      setFeedback(res.data.message);
      setUi({ step: 3, loading: false, error: null, currentIndex: 0 });
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setUi({ ...ui, loading: false, error: msg });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <TopBar />

      <div className="card">
        <div className="flex items-center justify-between">
          <div className="text-slate-300">Topic: <span className="text-white font-semibold">{topic}</span></div>
          <div className="w-64"><ProgressBar current={ui.currentIndex + 1} total={questions.length} /></div>
        </div>

        <div className="mt-6">
          {current && (
            <QuestionCard
              question={current}
              selectedIndex={selected}
              onSelect={select}
            />
          )}
        </div>

        {ui.error && <div className="text-red-400 mt-4">{ui.error}</div>}

        <div className="mt-6 flex items-center justify-between">
          <button className="btn-secondary" onClick={prev} disabled={ui.currentIndex === 0}>Previous</button>

          {ui.currentIndex < questions.length - 1 ? (
            <button className="btn-primary" onClick={next} disabled={typeof selected !== 'number'}>Next</button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={Object.keys(answers).length !== questions.length}>
              {ui.loading ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
