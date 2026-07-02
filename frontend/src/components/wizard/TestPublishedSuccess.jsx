import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Paperclip,
  Link as LinkIcon,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

function slugify(text) {
  return (text || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SHARE_OPTIONS = [
  { icon: Mail, label: 'Email' },
  { icon: Paperclip, label: 'Attach' },
  { icon: LinkIcon, label: 'Copy Link' },
  { icon: MessageSquare, label: 'Slack' },
];

export default function TestPublishedSuccess({ formData }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const slug = slugify(formData.testTitle);
  const testLink = `https://arena.yourcompany.com/tests/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(testLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: ignore */
    }
  }

  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-lg text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-brand-violet/20 flex items-center justify-center bg-brand-violet-light">
              <CheckCircle2 size={40} className="text-brand-violet" strokeWidth={1.8} />
            </div>
            {/* Subtle animated ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-brand-violet/10 animate-ping" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-display font-bold text-ink mb-2">
          Test Published Successfully!
        </h1>
        <p className="text-sm text-muted mb-8">
          <span className="font-medium text-ink">{formData.testTitle || 'Your test'}</span>{' '}
          is now live.
        </p>

        {/* Test Link card */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm mb-6 text-left">
          <label className="block text-xs font-medium text-muted mb-2">Test Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-ink font-mono truncate select-all">
              {testLink}
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                copied
                  ? 'bg-brand-violet-light border-brand-violet/30 text-brand-violet'
                  : 'border-surface-border text-muted hover:text-ink hover:border-brand-violet/30'
              }`}
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-brand-violet mt-1.5 animate-fade-in">
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Share via */}
        <div className="mb-8">
          <p className="text-xs font-medium text-muted mb-3">Share via</p>
          <div className="flex items-center justify-center gap-3">
            {SHARE_OPTIONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                title={label}
                className="w-11 h-11 rounded-xl border border-surface-border bg-surface-card flex items-center justify-center text-muted hover:text-brand-violet hover:border-brand-violet/30 hover:bg-brand-violet-light transition-all"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/dashboard/tests')}
          className="w-full flex items-center justify-center gap-2 bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
        >
          Go to Active Tests
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
