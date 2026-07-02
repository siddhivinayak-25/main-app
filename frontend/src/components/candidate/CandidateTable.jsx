import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import StageActionMenu from './StageActionMenu';

// Used by both CandidatePipeline (all candidates) and TestDetail
// (candidates filtered to one test). Same row, same "View" action,
// same drawer opens either way — onSelect is the only contract.
export default function CandidateTable({
  candidates,
  onSelect,
  showRole = true,
  emptyTitle = 'No candidates yet',
  emptyDescription = 'Candidates will appear here once they start this test.',
  onStatusUpdated,
}) {
  if (!candidates.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted border-b border-surface-border">
          <th className="font-medium px-5 py-3">Candidate Name</th>
          {showRole && <th className="font-medium px-5 py-3">Role</th>}
          <th className="font-medium px-5 py-3">Agentic Score</th>
          <th className="font-medium px-5 py-3">Status</th>
          <th className="font-medium px-5 py-3">Last Activity</th>
          <th className="font-medium px-5 py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((c) => (
          <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size="sm" />
                <span className="text-ink font-medium">{c.name}</span>
              </div>
            </td>
            {showRole && <td className="px-5 py-4 text-muted">{c.role}</td>}
            <td className="px-5 py-4 text-brand-violet font-semibold">{c.score}</td>
            <td className="px-5 py-4"><Badge status={c.status} /></td>
            <td className="px-5 py-4 text-muted">{c.lastActivity}</td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelect(c)}
                  className="border border-brand-violet/40 text-brand-violet text-xs font-medium px-3 py-1.5 rounded-md hover:bg-brand-violet-light transition-colors"
                >
                  View
                </button>
                <StageActionMenu candidate={c} onStatusUpdated={onStatusUpdated} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}