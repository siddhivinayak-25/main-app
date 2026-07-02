import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import BarRow from '../components/ui/BarRow';
import Skeleton from '../components/ui/Skeleton';
import { useDashboardData } from '../hooks/useDashboardData';

export default function CommandCenter() {
  const { data, loading } = useDashboardData();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Recruiter Command Center" subtitle="Welcome back, Alex — here's your hiring intelligence overview" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : data.stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display font-semibold text-ink mb-5">Hiring Funnel</h2>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4" />)}</div>
          ) : (
            <div className="space-y-4">
              {data.funnel.map((f) => <BarRow key={f.stage} label={f.stage} value={f.count} max={data.funnel[0].count} />)}
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display font-semibold text-ink mb-5">Recent Active Tests</h2>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : (
            <div className="space-y-4">
              {data.recentTests.map((t) => (
                <div key={t.id}>
                  <p className="text-sm text-ink font-medium leading-snug">{t.name}</p>
                  <p className="text-xs text-muted mt-0.5">{t.completed} completed</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display font-semibold text-ink mb-5">Top Performing Candidates</h2>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : (
            <div className="space-y-4">
              {data.topCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{c.name}</span>
                  <span className="text-brand-violet font-semibold text-sm">{c.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}