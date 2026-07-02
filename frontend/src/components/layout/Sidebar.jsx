import { NavLink } from 'react-router-dom';
import { LayoutGrid, Workflow, ClipboardList, Users, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutGrid, end: true },
  { to: '/dashboard/pipeline', label: 'Pipeline', icon: Workflow },
  { to: '/dashboard/tests', label: 'Tests', icon: ClipboardList },
  { to: '/dashboard/candidates', label: 'Candidates', icon: Users },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-sidebar h-screen sticky top-0 flex flex-col py-6">
      <div className="px-6 mb-8">
        <span className="text-lg font-display font-bold text-white">HireOS</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-violet text-white' : 'text-violet-200/70 hover:text-white hover:bg-sidebar-hover'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}