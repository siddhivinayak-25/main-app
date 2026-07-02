import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, Clock, FileText, Terminal, FlaskConical } from 'lucide-react';
import { sandboxService } from '../../api/sandboxService.js';

export default function TestPanel({ test, invitation, token, currentCode, language, testResults, onTestResults, sessionId }) {
  const [tab, setTab] = useState('problem');
  const [running, setRunning] = useState(false);

  async function handleRunTests() {
    if (!currentCode?.trim()) return;
    setRunning(true);
    try {
      const res = await sandboxService.runTests(token, { code: currentCode, language });
      onTestResults?.(res.results, res.passed, res.total);
      setTab('tests');
    } catch (err) {
      console.error('Test run failed:', err);
    } finally {
      setRunning(false);
    }
  }

  const testCases = test?.testConfig?.testCases || [];
  const passed = (testResults || []).filter(r => r.passed).length;

  const tabs = [
    { id: 'problem', label: 'Problem', icon: FileText },
    { id: 'tests',   label: `Tests ${testResults?.length ? `${passed}/${testResults.length}` : ''}`, icon: FlaskConical },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/5 px-2 gap-1 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-violet text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <t.icon size={11} />
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleRunTests}
          disabled={running || !currentCode?.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 mb-1 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
        >
          {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {running ? 'Running…' : 'Run Tests'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'problem' && (
          <div className="p-4 space-y-5">
            {/* Candidate info */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-[10px] uppercase tracking-wider">Candidate</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  invitation?.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {invitation?.status || 'in_progress'}
                </span>
              </div>
              <p className="text-white/70 text-sm font-medium">{invitation?.candidateName}</p>
              <p className="text-white/30 text-xs">{invitation?.candidateEmail}</p>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">Instructions</h3>
              <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                {test?.instructions || test?.testConfig?.instructions || 'No instructions provided.'}
              </div>
            </div>

            {/* Test case preview (visible only) */}
            {testCases.length > 0 && (
              <div>
                <h3 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">
                  Sample Cases ({testCases.filter(tc => !tc.isHidden && !tc.is_hidden).length} visible)
                </h3>
                <div className="space-y-2">
                  {testCases.filter(tc => !tc.isHidden && !tc.is_hidden).slice(0, 3).map((tc, i) => (
                    <div key={i} className="bg-white/3 border border-white/5 rounded-lg p-3 font-mono text-xs">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-white/30 text-[9px] uppercase mb-1">Input</p>
                          <p className="text-white/70">{tc.input || '—'}</p>
                        </div>
                        <div className="w-px bg-white/5" />
                        <div className="flex-1">
                          <p className="text-white/30 text-[9px] uppercase mb-1">Expected</p>
                          <p className="text-white/70">{tc.expectedOutput || tc.expected_output || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'tests' && (
          <div className="p-4 space-y-2">
            {!testResults?.length && (
              <div className="text-center py-8">
                <FlaskConical size={28} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-xs">Run tests to see results</p>
              </div>
            )}
            {(testResults || []).map((r, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
              }`}>
                {r.passed
                  ? <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle    size={14} className="text-red-400 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.name || `Test ${i + 1}`}
                  </p>
                  {!r.passed && (
                    <div className="mt-1 space-y-1 font-mono text-[10px]">
                      {r.actualOutput !== undefined && (
                        <p className="text-white/40">Got: <span className="text-red-300">{r.actualOutput || '(empty)'}</span></p>
                      )}
                      {r.expectedOutput !== undefined && (
                        <p className="text-white/40">Expected: <span className="text-white/60">{r.expectedOutput}</span></p>
                      )}
                      {r.stderr && (
                        <p className="text-red-300/70 truncate">{r.stderr.slice(0, 120)}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-white/20 text-[10px] shrink-0">
                  <Clock size={9} />
                  {r.time || 0}ms
                </div>
              </div>
            ))}

            {testResults?.length > 0 && (
              <div className={`mt-2 p-3 rounded-lg text-center text-sm font-medium ${
                passed === testResults.length
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}>
                {passed}/{testResults.length} tests passed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
