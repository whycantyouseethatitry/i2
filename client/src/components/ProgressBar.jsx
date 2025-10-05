export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-xs text-slate-300">
        <span>Progress</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-brand-400 to-emerald-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
