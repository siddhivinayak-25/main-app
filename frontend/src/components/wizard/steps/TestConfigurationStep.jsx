import { useState } from 'react';
import {
  Bold,
  Italic,
  List,
  Link,
  Code,
  FileText,
  Terminal,
  FolderOpen,
  FlaskConical,
  Plus,
} from 'lucide-react';

const SUB_TABS = [
  { key: 'instructions', label: 'Instructions', icon: FileText },
  { key: 'codeEditor', label: 'Code Editor', icon: Terminal },
  { key: 'resources', label: 'Resources', icon: FolderOpen },
  { key: 'testCases', label: 'Test Cases', icon: FlaskConical },
];

const TOOLBAR_BUTTONS = [
  { icon: Bold, label: 'Bold' },
  { icon: Italic, label: 'Italic' },
  { icon: List, label: 'List' },
  { icon: Link, label: 'Link' },
  { icon: Code, label: 'Code' },
];

/* ── Sub-tab content panels ─────────────────────────────── */

function InstructionsPanel({ formData, updateFormData }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="font-display font-semibold text-ink text-sm mb-1">
        Test Instructions
      </h3>
      <p className="text-xs text-muted mb-3">
        Write the instructions candidates will see before starting the test
      </p>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border border-surface-border rounded-t-lg bg-surface px-2 py-1.5">
        {TOOLBAR_BUTTONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-hover transition-colors"
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Rich-text-style textarea */}
      <textarea
        value={formData.instructions || ''}
        onChange={(e) => updateFormData({ instructions: e.target.value })}
        placeholder="Enter detailed instructions for the candidate…"
        className="flex-1 min-h-[240px] w-full bg-surface-card border border-t-0 border-surface-border rounded-b-lg px-4 py-3 text-sm text-ink leading-relaxed placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 resize-none transition-colors"
      />
    </div>
  );
}

function CodeEditorPanel({ formData, updateFormData }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="font-display font-semibold text-ink text-sm mb-1">
        Starter Code
      </h3>
      <p className="text-xs text-muted mb-3">
        Provide the initial code scaffold candidates will begin with
      </p>

      {/* Fake editor chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg" style={{ background: '#1E1B2E' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        <span className="ml-3 text-[11px] text-violet-300/60 font-mono">main.js</span>
      </div>

      {/* Code textarea */}
      <textarea
        value={formData.starterCode || ''}
        onChange={(e) => updateFormData({ starterCode: e.target.value })}
        placeholder={'// Write your starter code here\nfunction solve(input) {\n  \n}'}
        spellCheck={false}
        className="flex-1 min-h-[240px] w-full rounded-b-lg px-4 py-3 font-mono text-sm leading-relaxed text-green-300 placeholder:text-violet-400/40 focus:outline-none resize-none"
        style={{ background: '#1E1B2E' }}
      />
    </div>
  );
}

function ResourcesPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-violet-light flex items-center justify-center mb-4">
        <FolderOpen size={24} className="text-brand-violet" />
      </div>
      <h3 className="font-display font-semibold text-ink text-sm mb-1">
        No resources added yet
      </h3>
      <p className="text-xs text-muted max-w-[240px] mb-4">
        Attach files, datasets, or reference materials for candidates to use during the test
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

function TestCasesPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-violet-light flex items-center justify-center mb-4">
        <FlaskConical size={24} className="text-brand-violet" />
      </div>
      <h3 className="font-display font-semibold text-ink text-sm mb-1">
        No test cases added yet
      </h3>
      <p className="text-xs text-muted max-w-[240px] mb-4">
        Define input/output pairs to automatically validate candidate submissions
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-surface-border text-sm font-medium text-muted hover:text-brand-violet hover:border-brand-violet/40 transition-colors"
      >
        <Plus size={14} /> Add Test Case
      </button>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */

export default function TestConfigurationStep({ formData, updateFormData, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState('instructions');

  const panels = {
    instructions: <InstructionsPanel formData={formData} updateFormData={updateFormData} />,
    codeEditor: <CodeEditorPanel formData={formData} updateFormData={updateFormData} />,
    resources: <ResourcesPanel />,
    testCases: <TestCasesPanel />,
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-6 pt-6 pb-0">
        <h2 className="font-display font-semibold text-ink text-lg">Test Configuration</h2>
        <p className="text-sm text-muted mt-1 mb-5">
          Set up the problem statement, starter code, resources, and test cases
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-[400px]">
        {/* Left sub-nav */}
        <nav className="w-[200px] shrink-0 border-r border-surface-border px-3 py-3 space-y-1">
          {SUB_TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-brand-violet-light text-brand-violet-dark'
                    : 'text-muted hover:text-ink hover:bg-surface-hover'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right content */}
        <div className="flex-1 p-6">
          {panels[activeTab]}
        </div>
      </div>

      {/* Footer */}
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
