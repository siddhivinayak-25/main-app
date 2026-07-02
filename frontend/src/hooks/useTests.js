import { useAsync } from './useAsync';
import { getTests } from '../api/testsService';

export function useTests() {
  return useAsync(getTests, []);
}