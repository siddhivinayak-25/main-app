import { useAsync } from './useAsync';
import { getDashboardStats, getHiringFunnel, getRecentActiveTests, getTopCandidates } from '../api/dashboardService';

export function useDashboardData() {
  return useAsync(async () => {
    const [stats, funnel, recentTests, topCandidates] = await Promise.all([
      getDashboardStats(),
      getHiringFunnel(),
      getRecentActiveTests(),
      getTopCandidates(),
    ]);
    return { stats, funnel, recentTests, topCandidates };
  }, []);
}
