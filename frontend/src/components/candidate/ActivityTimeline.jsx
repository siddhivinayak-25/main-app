import { formatRelativeTime } from '../../utils/time';

export default function ActivityTimeline({ activityLog = [] }) {
  if (!activityLog || activityLog.length === 0) {
    return <p className="text-sm text-muted italic">No activity recorded yet.</p>;
  }

  // Render most recent first
  const sortedLog = [...activityLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="relative pl-6 border-l-2 border-surface-border space-y-6">
      {sortedLog.map((entry) => (
        <div key={entry.id} className="relative">
          {/* Violet Dot centered on the border line */}
          <div className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-violet ring-4 ring-surface-raised" />
          
          <div>
            <span className="text-sm font-semibold text-ink block">{entry.status}</span>
            <span className="text-[11px] text-muted block mt-0.5">
              {formatRelativeTime(entry.timestamp)}
            </span>
            {entry.note && (
              <p className="text-xs text-muted italic mt-1 bg-surface/40 px-2.5 py-1.5 rounded-md border border-surface-border inline-block max-w-full">
                {entry.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
