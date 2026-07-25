import { NavLink } from 'react-router-dom';
import { LayoutGrid, Workflow, ClipboardList, Users, BarChart3, Settings, Mail } from 'lucide-react';
import BrandLogo from '../brand/BrandLogo';

const navItems = [
  { to: '/dashboard',             label: 'Command Center', icon: LayoutGrid, end: true },
  { to: '/dashboard/pipeline',    label: 'Pipeline',       icon: Workflow },
  { to: '/dashboard/tests',       label: 'Tests',          icon: ClipboardList },
  { to: '/dashboard/invitations', label: 'Invitations',    icon: Mail },
  { to: '/dashboard/candidates',  label: 'Candidates',     icon: Users },
  { to: '/dashboard/analytics',   label: 'Analytics',      icon: BarChart3 },
  { to: '/dashboard/settings',    label: 'Settings',       icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-sidebar overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-violet via-violet-400 to-brand-violet-dark" />

      <div className="px-5 py-6 mb-4">
        <BrandLogo to="/dashboard" size="md" variant="light" showText />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-violet text-white shadow-glow'
                  : 'text-violet-200/70 hover:text-white hover:bg-sidebar-hover'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom brand pill */}
      <div className="px-5 py-4">
        <div className="rounded-xl bg-gradient-to-br from-[#2A1B47] to-[#1B1130] border border-white/5 p-3">
          <p className="text-[11px] text-violet-200/60 uppercase tracking-wider font-semibold mb-1">
            Agentic Hiring
          </p>
          <p className="text-xs text-violet-100/80 leading-relaxed">
            Evaluate candidates with real AI agents in live sandboxes.
          </p>
        </div>
      </div>
    </aside>
  );
}
