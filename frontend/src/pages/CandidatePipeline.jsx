import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import CandidateTable from '../components/candidate/CandidateTable';
import CandidateDrawer from '../components/candidate/CandidateDrawer';
import Skeleton from '../components/ui/Skeleton';
import { usePipelineData } from '../hooks/usePipelineData';

export default function CandidatePipeline() {
  const { data, loading, error, refetch } = usePipelineData();
  const [selectedId, setSelectedId] = useState(null);

  const candidates = data?.candidates ?? [];
  const stats      = data?.stats      ?? [];
  const selected   = candidates.find((c) => c.id === selectedId) || null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Candidate Pipeline" subtitle="Track candidates across all stages" />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Failed to load pipeline data. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : stats.map((s) => (
              <div key={s.key} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 shadow-sm">
                <p className="text-xs text-muted mb-1">{s.label}</p>
                <p className="text-xl font-display font-semibold text-ink">{s.count.toLocaleString()}</p>
              </div>
            ))}
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <CandidateTable
            candidates={candidates}
            onSelect={(c) => setSelectedId(c.id)}
            onStatusUpdated={refetch}
          />
        )}
      </div>

      {selected && (
        <CandidateDrawer
          candidate={selected}
          onClose={() => setSelectedId(null)}
          onStatusUpdated={refetch}
        />
      )}
    </div>
  );
}
