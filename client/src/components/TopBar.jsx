export default function TopBar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-emerald-400" />
        <div>
          <div className="font-display text-white text-xl font-bold">NovaQuiz</div>
          <div className="text-xs text-slate-400">AI-Assisted Knowledge Quiz</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-slate-400">
        <a className="hover:text-white transition" href="https://ai.google.dev" target="_blank" rel="noreferrer">Gemini</a>
        <span>•</span>
        <a className="hover:text-white transition" href="https://recoiljs.org/" target="_blank" rel="noreferrer">Recoil</a>
        <span>•</span>
        <a className="hover:text-white transition" href="https://tailwindcss.com" target="_blank" rel="noreferrer">Tailwind</a>
      </div>
    </div>
  );
}
