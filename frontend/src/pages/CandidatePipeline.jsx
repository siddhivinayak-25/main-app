import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import CandidateTable from '../components/candidate/CandidateTable';
import CandidateDrawer from '../components/candidate/CandidateDrawer';
import Skeleton from '../components/ui/Skeleton';
import { usePipelineData } from '../hooks/usePipelineData';

export default function CandidatePipeline() {
  const { data, loading, refetch } = usePipelineData();
  const [selectedId, setSelectedId] = useState(null);

  const selected = data?.candidates?.find((c) => c.id === selectedId) || null;

  function handleStatusUpdated() {
    refetch();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Candidate Pipeline" subtitle="Track candidates across all stages" />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : data.stats.map((s) => (
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
            candidates={data.candidates}
            onSelect={(c) => setSelectedId(c.id)}
            onStatusUpdated={handleStatusUpdated}
          />
        )}
      </div>

      {selected && (
        <CandidateDrawer
          candidate={selected}
          onClose={() => setSelectedId(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}