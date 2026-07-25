import { Search, Bell } from 'lucide-react';
import AvatarMenu from './AvatarMenu';

export default function TopBar() {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-3.5 glass border-b border-surface-border/60">
      <div className="relative w-96 max-w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search candidates, tests, skills..."
          className="w-full bg-white/70 border border-surface-border rounded-xl pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/10 transition-all"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative p-2 text-muted hover:text-brand-violet hover:bg-surface-hover rounded-xl transition-all"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-violet border border-white" />
        </button>
        <div className="h-6 w-px bg-surface-border" />
        <AvatarMenu />
      </div>
    </div>
  );
}
