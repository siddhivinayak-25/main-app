import { useState } from 'react';
import { Clock, Shield, ShieldAlert, ShieldCheck, Send, Loader2, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { value: 'python',     label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java',       label: 'Java' },
  { value: 'go',         label: 'Go' },
  { value: 'cpp',        label: 'C++' },
  { value: 'rust',       label: 'Rust' },
];

export default function WorkspaceHeader({
  testName, timeLeft, securityScore, onSubmit, submitting, language, onLanguageChange,
}) {
  const [langOpen, setLangOpen] = useState(false);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${String(Math.floor(mins / 60)).padStart(2,'0')}:${String(mins % 60).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const isLow = timeLeft < 600; // < 10 min

  const SecurityIcon = securityScore >= 90 ? ShieldCheck : securityScore >= 60 ? Shield : ShieldAlert;
  const secColor = securityScore >= 90 ? 'text-emerald-400' : securityScore >= 60 ? 'text-yellow-400' : 'text-red-400';

  const currentLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  return (
    <header className="h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center px-4 gap-4 shrink-0 z-20">
      {/* Logo + Test name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-brand-violet flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className="text-white/90 font-medium text-sm truncate max-w-[200px]">{testName}</span>
      </div>

      <div className="flex-1" />

      {/* Language selector */}
      <div className="relative">
        <button
          onClick={() => setLangOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 transition-colors"
        >
          {currentLang.label}
          <ChevronDown size={12} />
        </button>
        {langOpen && (
          <div className="absolute top-full mt-1 right-0 bg-[#1e1e3a] border border-white/10 rounded-lg overflow-hidden shadow-xl z-50 min-w-[140px]">
            {LANGUAGES.map(l => (
              <button
                key={l.value}
                onClick={() => { onLanguageChange(l.value); setLangOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  l.value === language ? 'bg-brand-violet/20 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Security badge */}
      <div className={`flex items-center gap-1.5 text-xs ${secColor}`}>
        <SecurityIcon size={14} />
        <span className="font-mono">{securityScore}%</span>
      </div>

      {/* Timer */}
      <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg ${
        isLow ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white/80'
      }`}>
        <Clock size={14} />
        {timeStr}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="flex items-center gap-2 px-4 py-1.5 bg-brand-violet hover:bg-brand-violet/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </header>
  );
}
