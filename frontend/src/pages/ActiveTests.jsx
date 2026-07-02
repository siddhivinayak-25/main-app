import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { useTests } from '../hooks/useTests';

const tabs = ['All Tests', 'Live', 'Draft', 'Completed'];

export default function ActiveTests() {
  const { data: tests, loading } = useTests();
  const [tab, setTab] = useState('All Tests');
  const navigate = useNavigate();

  const filtered = !tests ? [] : tab === 'All Tests' ? tests : tests.filter((t) => t.status === tab);
  const counts = tests
    ? {
        Live: tests.filter((t) => t.status === 'Live').length,
        Draft: tests.filter((t) => t.status === 'Draft').length,
        Completed: tests.filter((t) => t.status === 'Completed').length,
      }
    : {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Active Tests"
        subtitle="Manage and monitor all active hiring tests"
        action={
          <button
            onClick={() => navigate('/dashboard/tests/new')}
            className="flex items-center gap-2 bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Create New Test
          </button>
        }
      />

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-brand-violet-light text-brand-violet-dark' : 'text-muted hover:text-ink'
                }`}
              >
                {t} {counts[t] ? <span className="text-muted">{counts[t]}</span> : null}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search tests..."
              className="w-full bg-surface border border-surface-border rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-surface-border">
                <th className="font-medium px-5 py-3">Test Name</th>
                <th className="font-medium px-5 py-3">Role</th>
                <th className="font-medium px-5 py-3">Candidates</th>
                <th className="font-medium px-5 py-3">Progress</th>
                <th className="font-medium px-5 py-3">Status</th>
                <th className="font-medium px-5 py-3">Created On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/dashboard/tests/${t.id}`)}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 text-ink font-medium">{t.name}</td>
                  <td className="px-5 py-4 text-muted">{t.role}</td>
                  <td className="px-5 py-4 text-muted">{t.candidates}</td>
                  <td className="px-5 py-4 w-40">
                    <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                      <div className="h-full bg-brand-violet rounded-full" style={{ width: `${t.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge status={t.status} /></td>
                  <td className="px-5 py-4 text-muted">{t.createdOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}