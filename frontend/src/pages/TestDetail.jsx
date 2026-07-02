import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import CandidateTable from '../components/candidate/CandidateTable';
import CandidateDrawer from '../components/candidate/CandidateDrawer';
import InviteCandidateModal from '../components/candidate/InviteCandidateModal';
import { useTestDetail } from '../hooks/useTestDetail';

export default function TestDetail() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { data, loading, refetch } = useTestDetail(testId);
  const [selectedId, setSelectedId] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const selected = data?.candidates?.find((c) => c.id === selectedId) || null;

  function handleStatusUpdated() {
    refetch();
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate('/dashboard/tests')}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-brand-violet transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back to Tests
      </button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-40" />
        </div>
      ) : !data.test ? (
        <p className="text-muted">Test not found.</p>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-display font-semibold text-ink">{data.test.name}</h1>
                <Badge status={data.test.status} />
              </div>
              <p className="text-sm text-muted">{data.test.role} · Created {data.test.createdOn}</p>
            </div>
            
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-violet hover:bg-brand-violet-light text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus size={16} />
              Invite Candidates
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-muted mb-2">Candidates</p>
              <span className="text-2xl font-display font-semibold text-ink">{data.candidates.length}</span>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-muted mb-2">Completion Progress</p>
              <span className="text-2xl font-display font-semibold text-ink">{data.test.progress}%</span>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-muted mb-2">Avg. Agentic Score</p>
              <span className="text-2xl font-display font-semibold text-ink">
                {data.candidates.length
                  ? Math.round(data.candidates.reduce((sum, c) => sum + c.score, 0) / data.candidates.length)
                  : '—'}
              </span>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm">
            <CandidateTable
              candidates={data.candidates}
              onSelect={(c) => setSelectedId(c.id)}
              showRole={false}
              emptyTitle="No candidates yet"
              emptyDescription="This test is still in draft — candidates will show up here once it goes live and people start taking it."
              onStatusUpdated={handleStatusUpdated}
            />
          </div>
        </>
      )}

      {selected && (
        <CandidateDrawer
          candidate={selected}
          onClose={() => setSelectedId(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      <InviteCandidateModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        testId={Number(testId)}
      />
    </div>
  );
}