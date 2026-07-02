import { useState } from 'react';
import { FileCode, FilePlus, Trash2, ChevronRight, FolderOpen } from 'lucide-react';

const EXT_ICONS = {
  py:   '🐍', js: '🟨', ts: '🔷', java: '☕', go: '🐹',
  cpp:  '⚙️', rs: '🦀', rb: '💎', php: '🐘', sh: '🖥️',
};

function fileIcon(name) {
  const ext = name.split('.').pop();
  return EXT_ICONS[ext] || '📄';
}

export default function FileTree({ files, activeFile, onSelect, onNewFile, onDelete, language }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const extMap = { python:'py', javascript:'js', typescript:'ts', java:'java', go:'go', cpp:'cpp', rust:'rs', ruby:'rb' };
  const defaultExt = extMap[language] || 'py';

  function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim() || `file.${defaultExt}`;
    onNewFile(name.includes('.') ? name : `${name}.${defaultExt}`);
    setNewName('');
    setAdding(false);
  }

  return (
    <div className="flex flex-col h-full bg-[#12121f] border-r border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium uppercase tracking-wider">
          <FolderOpen size={12} />
          Files
        </div>
        <button
          onClick={() => setAdding(true)}
          className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white/70 transition-colors"
          title="New file"
        >
          <FilePlus size={13} />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {Object.keys(files).map(name => (
          <div
            key={name}
            onClick={() => onSelect(name)}
            className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs transition-colors ${
              name === activeFile
                ? 'bg-brand-violet/20 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white/90'
            }`}
          >
            <span className="text-base leading-none">{fileIcon(name)}</span>
            <span className="flex-1 truncate font-mono">{name}</span>
            {Object.keys(files).length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(name); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}

        {/* New file input */}
        {adding && (
          <form onSubmit={handleAdd} className="px-2 py-1">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={() => setAdding(false)}
              placeholder={`name.${defaultExt}`}
              className="w-full bg-white/10 border border-brand-violet/40 rounded px-2 py-1 text-xs text-white placeholder-white/30 outline-none"
            />
          </form>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-white/5">
        <p className="text-white/20 text-[10px]">
          <ChevronRight size={9} className="inline" /> Cmd+S to save
        </p>
      </div>
    </div>
  );
}
