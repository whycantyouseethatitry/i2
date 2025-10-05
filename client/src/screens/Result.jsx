import { useRecoilState } from 'recoil';
import { uiState, feedbackState, questionsState, answersState, topicState } from '../state/atoms.js';
import TopBar from '../components/TopBar.jsx';

export default function Result() {
  const [ui, setUi] = useRecoilState(uiState);
  const [feedback] = useRecoilState(feedbackState);
  const [questions] = useRecoilState(questionsState);
  const [answers] = useRecoilState(answersState);
  const [topic] = useRecoilState(topicState);

  const total = questions.length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);

  function restart() {
    setUi({ step: 1, loading: false, error: null, currentIndex: 0 });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <TopBar />

      <div className="card">
        <div className="text-slate-300">Topic: <span className="text-white font-semibold">{topic}</span></div>
        <h2 className="font-display text-3xl font-bold text-white mt-3">Your Score: {score}/{total}</h2>
        <p className="mt-4 text-slate-200">{feedback || 'Great effort! Keep going and try another topic.'}</p>

        <div className="mt-6">
          <button onClick={restart} className="btn-primary">Try Another Topic</button>
        </div>
      </div>
    </div>
  );
}
