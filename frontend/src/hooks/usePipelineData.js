import { useAsync } from './useAsync';
import { getCandidates } from '../api/candidatesService';
import { getPipelineStats } from '../api/dashboardService';

export function usePipelineData() {
  return useAsync(async () => {
    const [candidates, stats] = await Promise.all([getCandidates(), getPipelineStats()]);
    return { candidates, stats };
  }, []);
}