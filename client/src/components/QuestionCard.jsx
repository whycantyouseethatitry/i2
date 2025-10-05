export default function QuestionCard({ question, selectedIndex, onSelect }) {
  return (
    <div className="card">
      <h3 className="font-display text-2xl font-bold mb-4 text-white">{question.text}</h3>
      <div className="grid gap-3">
        {question.options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`text-left rounded-xl px-4 py-3 border transition-all ${
                isSelected
                  ? 'bg-brand-600/30 border-brand-400 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)]'
                  : 'bg-slate-900/60 border-white/10 hover:bg-slate-800'
              }`}
            >
              <span className="text-slate-100">{String.fromCharCode(65 + idx)}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
