import { useState } from 'react';
import {
  Bold, Italic, List, Link, Code,
  FileText, Terminal, FolderOpen, FlaskConical,
  Plus, Trash2, Eye, EyeOff, ChevronDown,
} from 'lucide-react';

const SUB_TABS = [
  { key: 'instructions', label: 'Instructions', icon: FileText },
  { key: 'codeEditor',   label: 'Starter Code', icon: Terminal },
  { key: 'testCases',    label: 'Test Cases',   icon: FlaskConical },
  { key: 'resources',    label: 'Resources',    icon: FolderOpen },
];

const TOOLBAR_BUTTONS = [
  { icon: Bold, label: 'Bold' }, { icon: Italic, label: 'Italic' },
  { icon: List, label: 'List' }, { icon: Link,   label: 'Link'  },
  { icon: Code, label: 'Code' },
];

const LANGUAGES = [
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
  { value: 'ruby',       label: 'Ruby' },
  { value: 'php',        label: 'PHP' },
  { value: 'csharp',     label: 'C#' },
];

const STARTER_PLACEHOLDERS = {
  python:     '# Write your starter code here\ndef solve(input_data):\n    pass\n',
  javascript: '// Write your starter code here\nfunction solve(inputData) {\n  \n}\n',
  typescript: '// Write your starter code here\nfunction solve(inputData: string): string {\n  \n}\n',
  java:       'public class Solution {\n    public static String solve(String input) {\n        return "";\n    }\n}\n',
  cpp:        '#include <iostream>\nusing namespace std;\n\nstring solve(string input) {\n    return "";\n}\n',
  go:         'package main\n\nfunc solve(input string) string {\n    return ""\n}\n',
  rust:       'fn solve(input: &str) -> String {\n    String::new()\n}\n',
  ruby:       'def solve(input)\n  \nend\n',
  php:        '<?php\nfunction solve($input) {\n    return "";\n}\n',
  csharp:     'public class Solution {\n    public string Solve(string input) {\n        return "";\n    }\n}\n',
};

/* ── Instructions panel ─────────────────────────────── */
function InstructionsPanel({ formData, updateFormData }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="font-display font-semibold text-ink text-sm mb-1">Problem Statement</h3>
      <p className="text-xs text-muted mb-3">
        Write the problem candidates will solve. Markdown is supported.
      </p>
      <div className="flex items-center gap-1 border border-surface-border rounded-t-lg bg-surface px-2 py-1.5">
        {TOOLBAR_BUTTONS.map(({ icon: Icon, label }) => (
          <button key={label} type="button" title={label}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-hover transition-colors">
            <Icon size={15} />
          </button>
        ))}
      </div>
      <textarea
        value={formData.instructions || ''}
        onChange={(e) => updateFormData({ instructions: e.target.value })}
        placeholder={`## Problem\n\nGiven an array of integers, return the two numbers that add up to a target sum.\n\n## Input\nA list of integers and a target integer.\n\n## Output\nIndices of the two numbers.`}
        className="flex-1 min-h-[240px] w-full bg-surface-card border border-t-0 border-surface-border rounded-b-lg px-4 py-3 text-sm text-ink leading-relaxed placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 resize-none transition-colors"
      />
    </div>
  );
}

/* ── Starter Code panel ─────────────────────────────── */
function CodeEditorPanel({ formData, updateFormData }) {
  const lang = formData.language || 'python';
  const placeholder = STARTER_PLACEHOLDERS[lang] || STARTER_PLACEHOLDERS.python;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-ink text-sm mb-0.5">Starter Code</h3>
          <p className="text-xs text-muted">Code scaffold candidates begin with in the sandbox</p>
        </div>
        {/* Language selector */}
        <div className="relative">
          <select
            value={lang}
            onChange={(e) => {
              updateFormData({ language: e.target.value, starterCode: '' });
            }}
            className="appearance-none bg-surface border border-surface-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Fake editor chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg" style={{ background: '#1E1B2E' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        <span className="ml-3 text-[11px] text-violet-300/60 font-mono">
          {lang === 'python' ? 'main.py' : lang === 'javascript' ? 'main.js' : lang === 'typescript' ? 'main.ts' : lang === 'java' ? 'Solution.java' : lang === 'go' ? 'main.go' : lang === 'rust' ? 'main.rs' : lang === 'cpp' ? 'main.cpp' : 'main.' + lang}
        </span>
      </div>
      <textarea
        value={formData.starterCode || ''}
        onChange={(e) => updateFormData({ starterCode: e.target.value })}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 min-h-[240px] w-full rounded-b-lg px-4 py-3 font-mono text-sm leading-relaxed text-green-300 placeholder:text-violet-400/40 focus:outline-none resize-none"
        style={{ background: '#1E1B2E' }}
      />
    </div>
  );
}

/* ── Test Cases panel ───────────────────────────────── */
function TestCasesPanel({ formData, updateFormData }) {
  const testCases = formData.testCases || [];

  function addCase() {
    updateFormData({
      testCases: [...testCases, { name: `Case ${testCases.length + 1}`, input: '', expectedOutput: '', isHidden: false, weight: 1 }],
    });
  }

  function removeCase(idx) {
    updateFormData({ testCases: testCases.filter((_, i) => i !== idx) });
  }

  function updateCase(idx, field, value) {
    const updated = testCases.map((tc, i) =>
      i === idx ? { ...tc, [field]: value } : tc
    );
    updateFormData({ testCases: updated });
  }

  function toggleHidden(idx) {
    updateCase(idx, 'isHidden', !testCases[idx].isHidden);
  }

  if (!testCases.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-violet-light flex items-center justify-center mb-4">
          <FlaskConical size={24} className="text-brand-violet" />
        </div>
        <h3 className="font-display font-semibold text-ink text-sm mb-1">No test cases yet</h3>
        <p className="text-xs text-muted max-w-[260px] mb-4">
          Define input/output pairs to automatically score candidate submissions
        </p>
        <button
          type="button"
          onClick={addCase}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={14} /> Add First Test Case
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-ink text-sm mb-0.5">Test Cases</h3>
          <p className="text-xs text-muted">{testCases.length} case{testCases.length !== 1 ? 's' : ''} · Hidden cases are not shown to candidates</p>
        </div>
        <button
          type="button"
          onClick={addCase}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-surface-border text-xs font-medium text-muted hover:text-brand-violet hover:border-brand-violet/40 transition-colors"
        >
          <Plus size={13} /> Add Case
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
        {testCases.map((tc, idx) => (
          <div key={idx} className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tc.name}
                onChange={(e) => updateCase(idx, 'name', e.target.value)}
                placeholder={`Case ${idx + 1}`}
                className="flex-1 bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => toggleHidden(idx)}
                title={tc.isHidden ? 'Hidden from candidate' : 'Visible to candidate'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  tc.isHidden
                    ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'border-surface-border text-muted hover:text-ink hover:bg-surface-hover'
                }`}
              >
                {tc.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <input
                type="number"
                value={tc.weight}
                onChange={(e) => updateCase(idx, 'weight', Number(e.target.value))}
                title="Weight (score multiplier)"
                min={0.1}
                max={10}
                step={0.1}
                className="w-16 bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-xs text-center text-ink focus:outline-none focus:border-brand-violet/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => removeCase(idx)}
                className="p-1.5 rounded-lg border border-surface-border text-muted hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Input */}
            <div>
              <label className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Input</label>
              <textarea
                rows={2}
                value={tc.input}
                onChange={(e) => updateCase(idx, 'input', e.target.value)}
                placeholder="e.g. [2, 7, 11, 15]\n9"
                spellCheck={false}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none"
              />
            </div>

            {/* Expected output */}
            <div>
              <label className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Expected Output</label>
              <textarea
                rows={2}
                value={tc.expectedOutput}
                onChange={(e) => updateCase(idx, 'expectedOutput', e.target.value)}
                placeholder="e.g. [0, 1]"
                spellCheck={false}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none"
              />
            </div>

            {tc.isHidden && (
              <p className="text-[11px] text-amber-400 flex items-center gap-1">
                <EyeOff size={11} /> Hidden — candidate won't see this case or its result
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Resources panel ────────────────────────────────── */
function ResourcesPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-violet-light flex items-center justify-center mb-4">
        <FolderOpen size={24} className="text-brand-violet" />
      </div>
      <h3 className="font-display font-semibold text-ink text-sm mb-1">No resources added</h3>
      <p className="text-xs text-muted max-w-[240px] mb-4">
        Attach files, datasets, or reference materials for candidates
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-surface-border text-sm font-medium text-muted hover:text-brand-violet hover:border-brand-violet/40 transition-colors"
      >
        <Plus size={14} /> Add Resource
      </button>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────── */
export default function TestConfigurationStep({ formData, updateFormData, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState('instructions');

  const panels = {
    instructions: <InstructionsPanel formData={formData} updateFormData={updateFormData} />,
    codeEditor:   <CodeEditorPanel   formData={formData} updateFormData={updateFormData} />,
    testCases:    <TestCasesPanel    formData={formData} updateFormData={updateFormData} />,
    resources:    <ResourcesPanel />,
  };

  // Badge counts
  const testCaseCount = (formData.testCases || []).length;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-0">
        <h2 className="font-display font-semibold text-ink text-lg">Test Configuration</h2>
        <p className="text-sm text-muted mt-1 mb-5">
          Write the problem, set up starter code, and define automated test cases
        </p>
      </div>

      <div className="flex min-h-[480px]">
        {/* Left sub-nav */}
        <nav className="w-[200px] shrink-0 border-r border-surface-border px-3 py-3 space-y-1">
          {SUB_TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-brand-violet-light text-brand-violet-dark'
                    : 'text-muted hover:text-ink hover:bg-surface-hover'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} />
                  {label}
                </span>
                {key === 'testCases' && testCaseCount > 0 && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-brand-violet/20 text-brand-violet-dark' : 'bg-surface-hover text-muted'
                  }`}>
                    {testCaseCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right content */}
        <div className="flex-1 p-6 overflow-auto">
          {panels[activeTab]}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm font-medium text-muted hover:text-ink hover:border-brand-violet/30 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
