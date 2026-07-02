export default function StatCard({ label, value, delta }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-glow hover:border-brand-violet/30 transition-all">
      <p className="text-sm text-muted mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-display font-semibold text-ink">{value}</span>
        {delta && <span className="text-xs font-medium text-emerald-600 mb-1">{delta} vs last week</span>}
      </div>
    </div>
  );
}