import { Clock, Send } from 'lucide-react';

export default function CandidateTestLayout({ children, title, timerText, onSubmit, disableSubmit }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 flex-shrink-0 bg-surface-card border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-brand-violet rounded flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg leading-none">A</span>
          </div>
          <div className="h-4 w-px bg-surface-border hidden sm:block"></div>
          <h1 className="text-base font-medium text-ink truncate max-w-[200px] sm:max-w-md">
            {title || 'Loading Test...'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {timerText && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted bg-surface py-1.5 px-3 rounded-md border border-surface-border">
              <Clock size={14} className="text-brand-violet" />
              <span className="font-mono">{timerText}</span>
            </div>
          )}
          <button 
            onClick={onSubmit}
            disabled={disableSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink-light text-surface font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
