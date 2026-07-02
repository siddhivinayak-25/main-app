import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Check, X, Pencil, Loader2, ChevronDown, History } from 'lucide-react';
import { sandboxService } from '../../api/sandboxService.js';

const ACTIONS = [
  { value: 'generate', label: 'Generate' },
  { value: 'modify',   label: 'Modify current file' },
  { value: 'explain',  label: 'Explain & improve' },
  { value: 'debug',    label: 'Debug this error' },
];

export default function AIPanel({ token, currentCode, language, activeFile, onAccept, onReject, onModify, sessionId }) {
  const [prompt, setPrompt]     = useState('');
  const [action, setAction]     = useState('generate');
  const [loading, setLoading]   = useState(false);
  const [pending, setPending]   = useState(null); // { code, prompt }
  const [history, setHistory]   = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError]       = useState(null);
  const textareaRef             = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [prompt]);

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    const p = prompt.trim();
    setPrompt('');

    try {
      const res = await sandboxService.aiPrompt(token, {
        prompt: p,
        currentCode,
        language,
        action,
        context: `File: ${activeFile}`,
      });

      const entry = { prompt: p, code: res.code, action, ts: Date.now() };
      setHistory(h => [entry, ...h.slice(0, 19)]);
      setPending(entry);
    } catch (err) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!pending) return;
    onAccept(pending.code, activeFile);
    await sandboxService.logAiAction(token, 'CODE_ACCEPTED', activeFile);
    setPending(null);
  }

  async function handleReject() {
    if (!pending) return;
    await sandboxService.logAiAction(token, 'CODE_REJECTED', activeFile);
    setPending(null);
  }

  async function handleModify() {
    if (!pending) return;
    onModify(pending.code, activeFile);
    await sandboxService.logAiAction(token, 'CODE_MODIFIED', activeFile);
    setPending(null);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] border-r border-white/5">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
          <Sparkles size={13} className="text-brand-violet" />
          AI Assistant
        </div>
        <button
          onClick={() => setShowHistory(h => !h)}
          className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60 transition-colors"
          title="Prompt history"
        >
          <History size={13} />
        </button>
      </div>

      {showHistory ? (
        /* History panel */
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 && (
            <p className="text-white/20 text-xs text-center pt-4">No history yet</p>
          )}
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setPrompt(h.prompt); setAction(h.action); setShowHistory(false); }}
              className="w-full text-left p-2 rounded hover:bg-white/5 group"
            >
              <p className="text-white/60 text-xs truncate">{h.prompt}</p>
              <p className="text-white/20 text-[10px] mt-0.5">{h.action}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Pending generated code — Accept / Reject / Modify */}
          {pending && (
            <div className="mx-2 mt-2 bg-[#1a1a2e] border border-brand-violet/30 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-white/60 text-xs font-mono truncate">{activeFile}</span>
                <span className="text-white/30 text-[10px]">{pending.code.split('\n').length} lines</span>
              </div>
              <pre className="p-3 text-xs text-white/80 font-mono overflow-x-auto max-h-40 overflow-y-auto leading-relaxed">
                {pending.code.slice(0, 800)}{pending.code.length > 800 ? '\n…' : ''}
              </pre>
              <div className="flex border-t border-white/5">
                <button onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-emerald-400 hover:bg-emerald-400/10 text-xs font-medium transition-colors border-r border-white/5">
                  <Check size={12} /> Accept
                </button>
                <button onClick={handleModify}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-yellow-400 hover:bg-yellow-400/10 text-xs font-medium transition-colors border-r border-white/5">
                  <Pencil size={12} /> Modify
                </button>
                <button onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-red-400 hover:bg-red-400/10 text-xs font-medium transition-colors">
                  <X size={12} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Scrollable history mini-feed */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1.5">
            {history.slice(0, 6).map((h, i) => (
              <div key={i} className="rounded px-2 py-1.5 bg-white/3">
                <p className="text-white/40 text-[10px] uppercase tracking-wide mb-0.5">{h.action}</p>
                <p className="text-white/50 text-xs leading-snug line-clamp-2">{h.prompt}</p>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-2 border-t border-white/5 space-y-2">
            {/* Action selector */}
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 outline-none focus:border-brand-violet/50 cursor-pointer"
            >
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>

            {/* Prompt textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Describe what you want to build…"
                rows={3}
                className="w-full bg-white/5 border border-white/10 focus:border-brand-violet/50 rounded px-3 py-2 text-xs text-white/80 placeholder-white/25 outline-none resize-none transition-colors"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-brand-violet hover:bg-brand-violet/90 disabled:opacity-40 text-white text-xs font-medium rounded transition-colors"
            >
              {loading
                ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                : <><Send size={12} /> Send  <span className="text-white/40 text-[10px]">⌘↵</span></>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
