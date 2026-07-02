import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const LANG_MAP = {
  python: 'python', javascript: 'javascript', typescript: 'typescript',
  java: 'java', go: 'go', cpp: 'cpp', rust: 'rust', ruby: 'ruby',
  php: 'php', bash: 'shell',
};

export default function CodeEditor({ value, onChange, language, filename, readOnly = false }) {
  const editorRef = useRef(null);

  function handleMount(editor, monaco) {
    editorRef.current = editor;

    // Custom theme matching our dark palette
    monaco.editor.defineTheme('hireos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a6a8a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'bd93f9' },
        { token: 'string',  foreground: 'f1fa8c' },
        { token: 'number',  foreground: 'ff79c6' },
        { token: 'type',    foreground: '8be9fd' },
      ],
      colors: {
        'editor.background':           '#0f0f1e',
        'editor.foreground':           '#e2e2f0',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorLineNumber.foreground': '#3a3a5c',
        'editorLineNumber.activeForeground': '#7c7caa',
        'editor.selectionBackground':  '#bd93f940',
        'editorCursor.foreground':     '#bd93f9',
        'editorIndentGuide.background1': '#1e1e3a',
        'editor.inactiveSelectionBackground': '#bd93f920',
      },
    });
    monaco.editor.setTheme('hireos-dark');

    // Cmd/Ctrl+S → trigger save (handled by parent via onChange)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.trigger('keyboard', 'editor.action.formatDocument', {});
    });
  }

  function handleChange(newValue) {
    onChange(newValue || '');
  }

  return (
    <div className="h-full w-full overflow-hidden">
      {/* Tab bar */}
      {filename && (
        <div className="bg-[#0f0f1e] border-b border-white/5 px-4 py-1.5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#1a1a2e] border border-white/10 rounded px-3 py-0.5 text-xs text-white/70 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-violet/60" />
            {filename}
          </div>
        </div>
      )}

      <Editor
        height={filename ? 'calc(100% - 32px)' : '100%'}
        language={LANG_MAP[language] || 'python'}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          fontSize:            14,
          fontFamily:          '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontLigatures:       true,
          lineNumbers:         'on',
          minimap:             { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap:            'on',
          tabSize:             4,
          insertSpaces:        true,
          readOnly,
          automaticLayout:     true,
          padding:             { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking:      'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling:     true,
          contextmenu:         true,
          formatOnPaste:       true,
          formatOnType:        false,
          suggest:             { showWords: false },
          quickSuggestions:    { other: true, comments: false, strings: false },
        }}
        loading={
          <div className="h-full flex items-center justify-center bg-[#0f0f1e]">
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <div className="w-4 h-4 border border-white/20 border-t-brand-violet rounded-full animate-spin" />
              Loading editor…
            </div>
          </div>
        }
      />
    </div>
  );
}
