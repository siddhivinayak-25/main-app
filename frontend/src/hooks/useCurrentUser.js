import { useAsync } from './useAsync';
import { getCurrentUser } from '../api/userService';

export function useCurrentUser() {
  return useAsync(getCurrentUser, []);
}
