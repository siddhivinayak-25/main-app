import { useAsync } from './useAsync';
import { getTestById, getCandidatesByTestId } from '../api/testsService';

// Powers the Test Detail screen: the test itself + everyone who's taken it.
export function useTestDetail(testId) {
  return useAsync(async () => {
    const [test, candidates] = await Promise.all([
      getTestById(testId),
      getCandidatesByTestId(testId),
    ]);
    return { test, candidates };
  }, [testId]);
}