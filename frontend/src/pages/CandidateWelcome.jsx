import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Code, Shield, CheckCircle, Play, AlertCircle, Loader2 } from 'lucide-react';

import { useTestInvitation } from '../hooks/useTestInvitation.js';
import BrandLogo from '../components/brand/BrandLogo.jsx';
import TopographicBackground from '../components/visual/TopographicBackground.jsx';

const LANG_LABEL = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  go: 'Go',
  cpp: 'C++',
  rust: 'Rust',
};

export default function CandidateWelcome() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const { data, loading, error } = useTestInvitation(token);
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    if (!data) return;
    setStarting(true);
    const { invitation } = data;
    navigate(`/test/${invitation.testId}?token=${token}`);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface relative flex items-center justify-center p-6">
        <TopographicBackground className="opacity-70" />
        <div className="relative text-center space-y-3 max-w-md">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-ink text-lg font-semibold">Missing Invitation Token</h2>
          <p className="text-muted text-sm">You need a valid invitation link to access this assessment.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface relative flex items-center justify-center p-6">
        <TopographicBackground className="opacity-70" />
        <div className="relative flex items-center gap-3 text-muted">
          <Loader2 size={20} className="animate-spin" />
          Loading your invitation…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface relative flex items-center justify-center p-6">
        <TopographicBackground className="opacity-70" />
        <div className="relative text-center space-y-3 max-w-md">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-ink text-lg font-semibold">Invalid or Expired Link</h2>
          <p className="text-muted text-sm">{error || 'This invitation is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  const { test, invitation } = data;
  const language = test?.language || 'python';
  const timeLimit = test?.timeLimit || 90;

  return (
    <div className="min-h-screen bg-surface relative flex flex-col">
      <TopographicBackground className="opacity-70" />

      {/* Header */}
      <header className="relative z-10 px-6 py-5">
        <BrandLogo size="md" to="/" />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl card-elevated bg-surface-raised rounded-2xl p-8 md:p-10 shadow-glow">
          {/* Greeting */}
          <div className="mb-8">
            <p className="text-sm text-muted mb-2">Hi {invitation.candidateName || 'there'},</p>
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink leading-tight">
              You’re invited to the <span className="text-brand-violet">{test?.name || 'Assessment'}</span>
            </h1>
            {test?.role && <p className="text-muted mt-2">{test.role}</p>}
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-violet-light text-brand-violet-dark text-xs font-medium">
              <Code size={14} />
              {LANG_LABEL[language] || language}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border text-muted text-xs font-medium">
              <Clock size={14} />
              {timeLimit} minutes
            </span>
            {invitation.expiresAt && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border text-muted text-xs font-medium">
                <AlertCircle size={14} />
                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Instructions */}
          {test?.testConfig?.instructions && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-3">Instructions</h2>
              <div className="bg-surface border border-surface-border rounded-xl p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {test.testConfig.instructions}
              </div>
            </div>
          )}

          {/* What to expect */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-3">What to expect</h2>
            <ul className="space-y-3">
              {[
                'A browser-based IDE with Monaco editor and a real terminal.',
                'An AI assistant panel to help you write, debug, and improve your solution.',
                'Your code runs in a real sandbox via the Piston API.',
                'Your session is scored on prompt quality, error recovery, code quality, correctness, and efficiency.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted">
                  <CheckCircle size={16} className="text-brand-violet shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Integrity notice */}
          <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Integrity monitoring is active</p>
                <p className="text-xs text-amber-700 mt-1">
                  Tab switching, copy-paste events, and focus loss are logged for recruiter review. Please stay in the test window once you start.
                </p>
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full flex items-center justify-center gap-2 bg-brand-violet hover:bg-brand-violet-dark text-white font-medium py-3.5 rounded-xl transition-all shadow-glow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {starting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play size={18} />
                Start Assessment
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted mt-4">
            Once you start, the timer will begin. You have {timeLimit} minutes to complete the assessment.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted">
        Powered by hiresprint — Agentic Hiring Intelligence
      </footer>
    </div>
  );
}
