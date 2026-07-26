import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutGrid, Users, Building2, FileCode, BarChart3, ShieldAlert, Activity,
  LogOut, Search, ExternalLink, Play, Eye, Clock, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Shield, Mail
} from 'lucide-react';

import { useAdminAuth } from '../context/AdminAuthContext';
import {
  getAdminStats, getAdminCompanies, getAdminCandidates, getAdminTests,
  getAdminSessions, getAdminSecurityEvents, getAdminActivities, adminTakeTest
} from '../api/adminService.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import BrandLogo from '../components/brand/BrandLogo.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'tests', label: 'Tests & Links', icon: FileCode },
  { id: 'sessions', label: 'Sessions', icon: Activity },
  { id: 'security', label: 'Security Events', icon: ShieldAlert },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  return `${minutes} min`;
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [takingTestId, setTakingTestId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [s, co, ca, t, se, ev, a] = await Promise.all([
          getAdminStats(),
          getAdminCompanies(),
          getAdminCandidates(),
          getAdminTests(),
          getAdminSessions(),
          getAdminSecurityEvents(),
          getAdminActivities(),
        ]);
        if (cancelled) return;
        setStats(s.stats);
        setCompanies(co);
        setCandidates(ca);
        setTests(t);
        setSessions(se);
        setSecurityEvents(ev);
        setActivities(a);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load admin data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const handleTakeTest = async (testId) => {
    setTakingTestId(testId);
    try {
      const result = await adminTakeTest(testId);
      window.open(result.welcomeLink, '_blank');
    } catch (err) {
      alert('Could not create admin invitation: ' + err.message);
    } finally {
      setTakingTestId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  const filteredCandidates = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.test_name?.toLowerCase().includes(q) ||
      c.recruiter_name?.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const filteredTests = useMemo(() => {
    const q = search.toLowerCase();
    return tests.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q) ||
      t.recruiter_name?.toLowerCase().includes(q)
    );
  }, [tests, search]);

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter(s =>
      s.candidate_name?.toLowerCase().includes(q) ||
      s.test_name?.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const filteredSecurity = useMemo(() => {
    const q = search.toLowerCase();
    return securityEvents.filter(e =>
      e.candidate_name?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  }, [securityEvents, search]);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 shrink-0 h-screen sticky top-0 bg-sidebar text-white flex flex-col border-r border-surface-border">
        <div className="px-5 py-6 mb-2">
          <BrandLogo to="/" size="md" variant="light" showText />
        </div>

        <div className="px-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-violet flex items-center justify-center text-white font-semibold text-sm">
              SA
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{admin?.name}</p>
              <p className="text-xs text-violet-200/60 truncate">Supreme Authority</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-brand-violet text-white shadow-glow'
                  : 'text-violet-200/70 hover:text-white hover:bg-sidebar-hover'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-violet-200/70 hover:text-white text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-20 glass border-b border-surface-border/60 px-6 py-3.5 flex items-center justify-between gap-4">
          <h1 className="text-lg font-display font-semibold text-ink">
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search current tab..."
              className="w-full bg-white/70 border border-surface-border rounded-xl pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/10 transition-all"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-brand-violet/20 border-t-brand-violet rounded-full animate-spin"></div>
              <span className="text-sm text-muted">Loading platform intelligence...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && activeTab === 'overview' && (
            <OverviewTab stats={stats} companies={companies} candidates={candidates} tests={tests} activities={activities} />
          )}
          {!loading && !error && activeTab === 'companies' && (
            <CompaniesTable companies={filteredCompanies} />
          )}
          {!loading && !error && activeTab === 'candidates' && (
            <CandidatesTable candidates={filteredCandidates} />
          )}
          {!loading && !error && activeTab === 'tests' && (
            <TestsTable tests={filteredTests} onTakeTest={handleTakeTest} takingTestId={takingTestId} />
          )}
          {!loading && !error && activeTab === 'sessions' && (
            <SessionsTable sessions={filteredSessions} />
          )}
          {!loading && !error && activeTab === 'security' && (
            <SecurityTable events={filteredSecurity} />
          )}
        </div>
      </main>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ───────────────────────────────────────────────────────────────────────────────
function OverviewTab({ stats, companies, candidates, tests, activities }) {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hiring Companies" value={stats.companies} />
        <StatCard label="Candidates" value={stats.candidates} />
        <StatCard label="Tests Created" value={stats.tests} />
        <StatCard label="Avg Score" value={stats.averageScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-4">Candidate Status Breakdown</h3>
          <div className="space-y-3">
            {['invited', 'in_progress', 'completed', 'reviewed', 'hired', 'rejected'].map(status => {
              const count = stats.candidateStatus[status] || 0;
              const pct = stats.candidates > 0 ? (count / stats.candidates) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-muted capitalize">{status.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                    <div className="h-full bg-brand-violet rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-ink font-medium text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-4">Platform Volume</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Sessions</span>
              <span className="text-lg font-semibold text-ink">{stats.sessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Invitations</span>
              <span className="text-lg font-semibold text-ink">{stats.invitations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Security Events</span>
              <span className="text-lg font-semibold text-ink">{stats.securityEvents}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Recent Activity (Last 7 Days)</h3>
          <span className="text-xs text-muted">{activities.length} events</span>
        </div>
        {activities.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No recent activity" description="Candidate activity will appear here as it happens." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {activities.slice(0, 10).map(a => (
                  <tr key={a.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
                    <td className="px-5 py-3">
                      <span className="font-medium text-ink">{a.candidate_name || 'Unknown'}</span>
                      <p className="text-xs text-muted">{a.test_name || 'No test'} • {a.recruiter_name || '—'}</p>
                    </td>
                    <td className="px-5 py-3"><Badge status={a.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted max-w-xs truncate">{a.note}</td>
                    <td className="px-5 py-3 text-xs text-muted text-right">{formatDate(a.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Companies Table
// ───────────────────────────────────────────────────────────────────────────────
function CompaniesTable({ companies }) {
  if (!companies.length) return <EmptyState title="No companies yet" description="Recruiter accounts will appear here." />;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border bg-surface-hover/50">
              <th className="font-medium px-5 py-3">Company / Recruiter</th>
              <th className="font-medium px-5 py-3">Contact</th>
              <th className="font-medium px-5 py-3">Tests</th>
              <th className="font-medium px-5 py-3">Candidates</th>
              <th className="font-medium px-5 py-3">Completed</th>
              <th className="font-medium px-5 py-3">Avg Score</th>
              <th className="font-medium px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-xs text-muted">{c.job_title || '—'}{c.department && ` • ${c.department}`}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink text-xs">{c.email}</div>
                  <div className="text-muted text-xs">{c.phone || '—'}</div>
                </td>
                <td className="px-5 py-4 text-ink font-medium">{c.test_count}</td>
                <td className="px-5 py-4 text-ink font-medium">{c.candidate_count}</td>
                <td className="px-5 py-4 text-ink font-medium">{c.completed_count}</td>
                <td className="px-5 py-4 text-brand-violet font-medium">{c.avg_score ?? '—'}</td>
                <td className="px-5 py-4 text-muted text-xs">{formatDate(c.joined_on)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Candidates Table
// ───────────────────────────────────────────────────────────────────────────────
function CandidatesTable({ candidates }) {
  if (!candidates.length) return <EmptyState title="No candidates yet" description="Candidates will appear once invitations are sent." />;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border bg-surface-hover/50">
              <th className="font-medium px-5 py-3">Candidate</th>
              <th className="font-medium px-5 py-3">Test</th>
              <th className="font-medium px-5 py-3">Recruiter</th>
              <th className="font-medium px-5 py-3">Score</th>
              <th className="font-medium px-5 py-3">Status</th>
              <th className="font-medium px-5 py-3">Sessions</th>
              <th className="font-medium px-5 py-3">Security Events</th>
              <th className="font-medium px-5 py-3">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-xs text-muted">{c.email}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink text-xs font-medium">{c.test_name || '—'}</div>
                  <div className="text-muted text-xs">{c.role || '—'}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink text-xs">{c.recruiter_name || '—'}</div>
                  <div className="text-muted text-xs">{c.recruiter_email || '—'}</div>
                </td>
                <td className="px-5 py-4 text-brand-violet font-semibold">{c.score ?? '—'}</td>
                <td className="px-5 py-4"><Badge status={c.status} /></td>
                <td className="px-5 py-4 text-ink text-xs">{c.session_count}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium ${c.security_event_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {c.security_event_count}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted text-xs">{formatDate(c.last_activity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Tests Table
// ───────────────────────────────────────────────────────────────────────────────
function TestsTable({ tests, onTakeTest, takingTestId }) {
  if (!tests.length) return <EmptyState title="No tests yet" description="Tests will appear here as recruiters create them." />;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border bg-surface-hover/50">
              <th className="font-medium px-5 py-3">Test</th>
              <th className="font-medium px-5 py-3">Recruiter</th>
              <th className="font-medium px-5 py-3">Language</th>
              <th className="font-medium px-5 py-3">Time</th>
              <th className="font-medium px-5 py-3">Candidates</th>
              <th className="font-medium px-5 py-3">Completion</th>
              <th className="font-medium px-5 py-3">Public Link</th>
              <th className="font-medium px-5 py-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{t.name}</div>
                  <div className="text-xs text-muted">{t.role || '—'}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink text-xs">{t.recruiter_name}</div>
                  <div className="text-muted text-xs">{t.recruiter_email}</div>
                </td>
                <td className="px-5 py-4 text-xs text-ink capitalize">{t.language}</td>
                <td className="px-5 py-4 text-xs text-ink">{formatDuration(t.time_limit)}</td>
                <td className="px-5 py-4 text-ink font-medium">{t.candidate_count}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-surface-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-violet rounded-full" style={{ width: `${t.completionRate}%` }} />
                    </div>
                    <span className="text-xs text-ink font-medium">{t.completionRate}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {t.latest_invitation_token ? (
                    <a
                      href={t.welcomeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-violet hover:underline"
                    >
                      Open Link <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-xs text-muted">No invitation yet</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => onTakeTest(t.id)}
                    disabled={takingTestId === t.id}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-brand-violet hover:bg-brand-violet-dark text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-60"
                  >
                    {takingTestId === t.id ? '...' : <><Play size={12} /> Take Test</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Sessions Table
// ───────────────────────────────────────────────────────────────────────────────
function SessionsTable({ sessions }) {
  if (!sessions.length) return <EmptyState title="No sessions yet" description="Candidate evaluation sessions will appear here." />;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border bg-surface-hover/50">
              <th className="font-medium px-5 py-3">Candidate</th>
              <th className="font-medium px-5 py-3">Test</th>
              <th className="font-medium px-5 py-3">Recruiter</th>
              <th className="font-medium px-5 py-3">Status</th>
              <th className="font-medium px-5 py-3">Started</th>
              <th className="font-medium px-5 py-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{s.candidate_name}</div>
                  <div className="text-xs text-muted">{s.candidate_email}</div>
                </td>
                <td className="px-5 py-4 text-ink text-xs">{s.test_name}</td>
                <td className="px-5 py-4 text-muted text-xs">{s.recruiter_name}</td>
                <td className="px-5 py-4"><Badge status={s.status} /></td>
                <td className="px-5 py-4 text-muted text-xs">{formatDate(s.started_at)}</td>
                <td className="px-5 py-4 text-muted text-xs">{formatDate(s.completed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Security Events Table
// ───────────────────────────────────────────────────────────────────────────────
function SecurityTable({ events }) {
  if (!events.length) return <EmptyState title="No security events" description="Integrity events will appear here when triggered." />;

  const severityColor = {
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border bg-surface-hover/50">
              <th className="font-medium px-5 py-3">Event</th>
              <th className="font-medium px-5 py-3">Candidate</th>
              <th className="font-medium px-5 py-3">Severity</th>
              <th className="font-medium px-5 py-3">Test</th>
              <th className="font-medium px-5 py-3">Time</th>
              <th className="font-medium px-5 py-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{e.event_type}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink text-xs">{e.candidate_name || '—'}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${severityColor[e.severity] || severityColor.info}`}>
                    {e.severity}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted text-xs">{e.test_name || '—'}</td>
                <td className="px-5 py-4 text-muted text-xs">{formatDate(e.ts)}</td>
                <td className="px-5 py-4">
                  <pre className="text-[10px] text-muted bg-surface border border-surface-border rounded p-2 max-w-xs overflow-x-auto">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
