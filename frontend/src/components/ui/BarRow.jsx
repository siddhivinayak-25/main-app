export default function BarRow({ label, value, max, color = 'bg-brand-violet' }) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 text-sm text-muted shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 text-right text-sm font-medium text-ink">{value.toLocaleString()}</span>
    </div>
  );
}