import { useState, useCallback } from 'react';
import { updatePassword as updatePasswordApi } from '../api/userService';

// On-demand mutation hook for password changes.
// Exposes `success` as a boolean for showing a confirmation message,
// since there's no data to display after a password change.
export function useUpdatePassword() {
  const [state, setState] = useState({
    updating: false,
    error: null,
    success: false,
  });

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setState({ updating: true, error: null, success: false });
    try {
      await updatePasswordApi({ currentPassword, newPassword });
      setState({ updating: false, error: null, success: true });
    } catch (err) {
      setState({ updating: false, error: err, success: false });
      throw err;
    }
  }, []);

  return { changePassword, ...state };
}
