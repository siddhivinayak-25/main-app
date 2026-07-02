import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { useUpdateCandidateStatus } from '../../hooks/useUpdateCandidateStatus';
import { CANDIDATE_STAGES, REJECTED_STAGE } from '../../data/mockData';

export default function StageActionMenu({ candidate, onStatusUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { updateStatus, updating } = useUpdateCandidateStatus();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentIdx = CANDIDATE_STAGES.indexOf(candidate.status);
  const nextStage =
    currentIdx !== -1 && currentIdx < CANDIDATE_STAGES.length - 1
      ? CANDIDATE_STAGES[currentIdx + 1]
      : null;

  const showShortlist = candidate.status !== 'Shortlisted' && candidate.status !== 'Hired' && candidate.status !== REJECTED_STAGE;
  const showHire = candidate.status !== 'Hired' && candidate.status !== REJECTED_STAGE;
  const showReject = candidate.status !== REJECTED_STAGE;

  async function handleStatusChange(newStatus, note = '') {
    setIsOpen(false);
    try {
      const updated = await updateStatus(candidate.id, newStatus, note);
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => !updating && setIsOpen(!isOpen)}
        disabled={updating}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
      >
        {updating ? (
          <Loader2 size={16} className="animate-spin text-brand-violet" />
        ) : (
          <MoreVertical size={16} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-surface-raised border border-surface-border rounded-xl shadow-lg py-1 z-50 animate-fade-in">
          {nextStage && (
            <button
              onClick={() => handleStatusChange(nextStage, `Advanced candidate to ${nextStage}`)}
              className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Advance to {nextStage}
            </button>
          )}

          {showShortlist && (
            <button
              onClick={() => handleStatusChange('Shortlisted', 'Shortlisted candidate')}
              className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Shortlist
            </button>
          )}

          {showHire && (
            <button
              onClick={() => handleStatusChange('Hired', 'Hired candidate')}
              className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Mark as Hired
            </button>
          )}

          {showReject && (
            <>
              <div className="border-t border-surface-border my-1"></div>
              <button
                onClick={() => handleStatusChange(REJECTED_STAGE, 'Candidate rejected')}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Reject Candidate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
