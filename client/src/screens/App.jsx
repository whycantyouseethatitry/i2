import { useRecoilState } from 'recoil';
import { uiState } from '../state/atoms.js';
import Home from './Home.jsx';
import Quiz from './Quiz.jsx';
import Result from './Result.jsx';

export default function App() {
  const [ui] = useRecoilState(uiState);
  return (
    <div className="min-h-screen">
      {ui.step === 1 && <Home />}
      {ui.step === 2 && <Quiz />}
      {ui.step === 3 && <Result />}
    </div>
  );
}
