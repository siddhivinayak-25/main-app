import { useAsync } from './useAsync';
import { getCandidates } from '../api/candidatesService';
import { getPipelineStats } from '../api/dashboardService';

const STAGE_LABELS = {
  invited:     'Invited',
  in_progress: 'In Progress',
  completed:   'Completed',
  reviewed:    'Reviewed',
  hired:       'Hired',
  rejected:    'Rejected',
};

export function usePipelineData() {
  return useAsync(async () => {
    const [candidates, pipeline] = await Promise.all([getCandidates(), getPipelineStats()]);
    // Transform pipeline stages into { key, label, count } shape for the UI
    const stats = (pipeline || []).map(s => ({
      key:   s.stage,
      label: STAGE_LABELS[s.stage] || s.stage,
      count: s.count ?? 0,
    }));
    return { candidates: candidates || [], stats };
  }, []);
}
