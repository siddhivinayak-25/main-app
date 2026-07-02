import { Search, Bell } from 'lucide-react';
import AvatarMenu from './AvatarMenu';

export default function TopBar() {
  return (
    <div className="flex items-center justify-between px-8 py-4 bg-surface-raised border-b border-surface-border">
      <div className="relative w-96 max-w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search candidates, tests, skills..."
          className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-brand-violet/50"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-muted hover:text-brand-violet transition-colors">
          <Bell size={18} />
        </button>
        <AvatarMenu />
      </div>
    </div>
  );
}