/**
 * CandidateWorkspace — Full IDE sandbox for hiresprint test sessions
 *
 * Layout (3-panel):
 * ┌──────────────────────────────────────────────────────────────┐
 * │  HEADER: test name | language | security | timer | submit    │
 * ├──────────┬───────────────────────────────┬───────────────────┤
 * │ LEFT     │ CENTER                        │ RIGHT             │
 * │ FileTree │ Monaco Editor (full height)   │ Problem / Tests   │
 * │ (200px)  │                               │ (320px)           │
 * ├──────────┤                               ├───────────────────┤
 * │ AIPanel  │                               │ Terminal (bottom) │
 * │ (flex-1) │                               │ (240px)           │
 * └──────────┴───────────────────────────────┴───────────────────┘
 *
 * Security monitor: floating camera overlay bottom-right
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

import { useTestInvitation } from '../hooks/useTestInvitation.js';
import { sandboxService }    from '../api/sandboxService.js';
import { post }              from '../api/client.js';

import WorkspaceHeader  from '../components/workspace/WorkspaceHeader.jsx';
import FileTree         from '../components/workspace/FileTree.jsx';
import CodeEditor       from '../components/workspace/CodeEditor.jsx';
import AIPanel          from '../components/workspace/AIPanel.jsx';
import Terminal         from '../components/workspace/Terminal.jsx';
import TestPanel        from '../components/workspace/TestPanel.jsx';
import SecurityMonitor  from '../components/workspace/SecurityMonitor.jsx';

// ─── Default starter code per language ───────────────────────────────────

const STARTER = {
  python: `# Write your solution here
# Use the AI panel on the left to generate code
# Type 'run main.py' in the terminal below to execute

def main():
    pass

if __name__ == '__main__':
    main()
`,
  javascript: `// Write your solution here
// Type 'run main.js' in the terminal to execute

function main() {
  // your code here
}

main();
`,
  typescript: `// Write your solution here

function main(): void {
  // your code here
}

main();
`,
  java: `public class Main {
    public static void main(String[] args) {
        // your code here
    }
}
`,
  go: `package main

import "fmt"

func main() {
    // your code here
    fmt.Println("Hello")
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // your code here
    return 0;
}
`,
};

const EXT = { python:'py', javascript:'js', typescript:'ts', java:'java', go:'go', cpp:'cpp', rust:'rs' };

function defaultFilename(lang) {
  const ext = EXT[lang] || 'py';
  return lang === 'java' ? 'Main.java' : `main.${ext}`;
}

// ─── Session bootstrap ────────────────────────────────────────────────────

async function startSession(candidateId, testId, invitationId) {
  const res = await post('/evaluation/sessions', { candidateId, testId, invitationId });
  return res.sessionId;
}

// ─── Autosave debounce ─────────────────────────────────────────────────────

function useAutosave(token, files, delay = 8000) {
  const timerRef = useRef(null);
  const save = useCallback(() => {
    sandboxService.snapshot(token, files).catch(() => {});
  }, [token, files]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);
    return () => clearTimeout(timerRef.current);
  }, [files, save, delay]);
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function CandidateWorkspace() {
  const [params]      = useSearchParams();
  const token         = params.get('token');

  const { data, loading, error } = useTestInvitation(token);

  // Session state
  const [sessionId,   setSessionId]   = useState(null);
  const [language,    setLanguage]    = useState('python');
  const [files,       setFiles]       = useState({});       // { filename: { content, language } }
  const [activeFile,  setActiveFile]  = useState('');
  const [testResults, setTestResults] = useState([]);
  const [secScore,    setSecScore]    = useState(100);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const timerRef = useRef(null);

  // Terminal ref (for file syncing)
  const terminalRef = useRef(null);

  // Ref to submit function so the timer interval avoids stale closures
  const handleSubmitRef = useRef(() => {});

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (submitting || submitted || !sessionId) return;
    if (!confirm('Submit your solution? You cannot make changes after submission.')) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await sandboxService.submit({
        sessionId,
        candidateId: data.invitation.candidateId,
        testId:      data.invitation.testId,
        files,
        invitationId: data.invitation.id,
      });
      setSubmitted(true);
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Keep the ref current without triggering a render
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  // ── Init session when invitation loads ──────────────────────────────────
  useEffect(() => {
    if (!data) return;
    let mounted = true;
    (async () => {
      const { invitation, test } = data;
      const lang = test?.language || 'python';
      const fname = defaultFilename(lang);
      const starterContent = test?.starterCode || STARTER[lang] || `# Write your solution here\n`;

      let sid;
      try {
        sid = await startSession(invitation.candidateId, invitation.testId, invitation.id);
      } catch (err) {
        if (mounted) console.warn('Session start:', err.message);
        return;
      }
      if (!mounted) return;

      setLanguage(lang);
      setFiles({ [fname]: { content: starterContent, language: lang } });
      setActiveFile(fname);
      setTimeLeft((test?.timeLimit || 90) * 60);
      setSessionId(sid);
    })();
    return () => { mounted = false; };
  }, [data]);

  // ── Timer countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!data || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) { handleSubmitRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [data, submitted]);

  // ── Autosave ─────────────────────────────────────────────────────────────
  useAutosave(token, files);

  // ── File operations ──────────────────────────────────────────────────────
  function handleFileChange(content) {
    setFiles(f => ({ ...f, [activeFile]: { ...f[activeFile], content } }));
    // Sync to terminal WebSocket
    terminalRef.current?.syncFile(activeFile, content);
  }

  function handleNewFile(name) {
    const content = STARTER[language] || `# ${name}\n`;
    setFiles(f => ({ ...f, [name]: { content, language } }));
    setActiveFile(name);
  }

  function handleDeleteFile(name) {
    if (Object.keys(files).length <= 1) return; // keep at least one file
    setFiles(f => {
      const next = { ...f };
      delete next[name];
      return next;
    });
    if (activeFile === name) setActiveFile(Object.keys(files)[0]);
  }

  // ── AI Accept / Reject / Modify ───────────────────────────────────────────
  function handleAIAccept(code, filename) {
    setFiles(f => ({ ...f, [filename || activeFile]: { ...f[filename || activeFile], content: code } }));
  }

  function handleAIModify(code, filename) {
    // Insert generated code alongside existing (place in editor, candidate decides)
    const existing = files[filename || activeFile]?.content || '';
    const merged   = `${existing}\n\n# --- AI Suggestion ---\n${code}`;
    setFiles(f => ({ ...f, [filename || activeFile]: { ...f[filename || activeFile], content: merged } }));
  }

  // ── Language switch ──────────────────────────────────────────────────────
  function handleLanguageChange(lang) {
    setLanguage(lang);
    const fname = defaultFilename(lang);
    if (!files[fname]) {
      setFiles(f => ({ ...f, [fname]: { content: STARTER[lang] || '', language: lang } }));
    }
    setActiveFile(fname);
  }

  // ── Test results ─────────────────────────────────────────────────────────
  function handleTestResults(results) {
    setTestResults(results);
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <h2 className="text-white text-lg font-semibold">Missing Invitation Token</h2>
          <p className="text-white/40 text-sm">You need a valid invitation link to access this test.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <Loader2 size={20} className="animate-spin" />
          Setting up your sandbox environment…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <h2 className="text-white text-lg font-semibold">Invalid or Expired Link</h2>
          <p className="text-white/40 text-sm">{error || 'This invitation is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-white text-2xl font-bold">Submitted!</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your solution is being evaluated by the hiresprint AI engine across 5 dimensions.
            The recruiter will be notified with your results.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-wider">What&apos;s being scored</p>
            {['Prompt Quality', 'Error Recovery', 'Output Correctness', 'Code Quality', 'Execution Efficiency'].map(d => (
              <div key={d} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-violet" />
                <span className="text-white/60 text-sm">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { test, invitation } = data;
  const currentFileContent = files[activeFile]?.content || '';

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] overflow-hidden select-none">
      {/* ── Header ── */}
      <WorkspaceHeader
        testName={test?.name || 'hiresprint Test'}
        timeLeft={timeLeft}
        securityScore={secScore}
        onSubmit={handleSubmit}
        submitting={submitting}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* ── 3-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: File tree (top) + AI panel (bottom) */}
        <div className="w-[220px] shrink-0 flex flex-col border-r border-white/5">
          {/* File tree — fixed height */}
          <div className="h-48 shrink-0 border-b border-white/5">
            <FileTree
              files={files}
              activeFile={activeFile}
              language={language}
              onSelect={setActiveFile}
              onNewFile={handleNewFile}
              onDelete={handleDeleteFile}
            />
          </div>
          {/* AI panel — flex */}
          <div className="flex-1 overflow-hidden">
            <AIPanel
              token={token}
              currentCode={currentFileContent}
              language={language}
              activeFile={activeFile}
              sessionId={sessionId}
              onAccept={handleAIAccept}
              onReject={() => {}}
              onModify={handleAIModify}
            />
          </div>
        </div>

        {/* CENTER: Monaco editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={currentFileContent}
            onChange={handleFileChange}
            language={language}
            filename={activeFile}
          />
        </div>

        {/* RIGHT: Problem/Tests (top) + Terminal (bottom) */}
        <div className="w-[340px] shrink-0 flex flex-col border-l border-white/5">
          {/* Problem + tests — takes remaining space above terminal */}
          <div className="flex-1 overflow-hidden border-b border-white/5">
            <TestPanel
              test={test}
              invitation={invitation}
              token={token}
              currentCode={currentFileContent}
              language={language}
              testResults={testResults}
              onTestResults={handleTestResults}
              sessionId={sessionId}
            />
          </div>
          {/* Terminal — fixed height */}
          <div className="h-56 shrink-0">
            {sessionId && (
              <Terminal
                ref={terminalRef}
                sessionId={sessionId}
                token={token}
                candidateId={invitation?.candidateId}
                language={language}
                onTestResults={r => setTestResults(r.results || [])}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Security Monitor (floating) ── */}
      {sessionId && (
        <SecurityMonitor
          sessionId={sessionId}
          candidateId={invitation?.candidateId}
          onScoreChange={setSecScore}
        />
      )}
    </div>
  );
}
