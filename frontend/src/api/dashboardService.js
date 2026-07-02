import { request } from './client';
import {
  dashboardStats,
  hiringFunnel,
  recentActiveTests,
  topCandidates,
  candidates,
  CANDIDATE_STAGES,
  REJECTED_STAGE,
} from '../data/mockData';

export const getDashboardStats = () =>
  request(() => {
    return dashboardStats.map((stat) => {
      if (stat.label === 'Hires') {
        return {
          ...stat,
          value: candidates.filter((c) => c.status === 'Hired').length,
        };
      }
      if (stat.label === 'Candidates') {
        return {
          ...stat,
          value: candidates.length,
        };
      }
      return stat;
    });
  });

export const getHiringFunnel = () => request(() => hiringFunnel);
export const getRecentActiveTests = () => request(() => recentActiveTests);
export const getTopCandidates = () => request(() => topCandidates);

export const getPipelineStats = () =>
  request(() => {
    const stages = [...CANDIDATE_STAGES, REJECTED_STAGE];
    return stages.map((stage) => {
      const key = stage.toLowerCase() === 'in progress' ? 'inProgress' : stage.toLowerCase();
      return {
        key,
        label: stage,
        count: candidates.filter((c) => c.status === stage).length,
      };
    });
  });