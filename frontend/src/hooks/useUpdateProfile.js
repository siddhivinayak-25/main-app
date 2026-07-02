import { useState, useCallback } from 'react';
import { updateProfile as updateProfileApi } from '../api/userService';

// On-demand mutation hook (same pattern as useCreateTest) —
// only fires when the user submits the profile form.
export function useUpdateProfile() {
  const [state, setState] = useState({ updating: false, error: null });

  const updateProfile = useCallback(async (data) => {
    setState({ updating: true, error: null });
    try {
      const updated = await updateProfileApi(data);
      setState({ updating: false, error: null });
      return updated;
    } catch (err) {
      setState({ updating: false, error: err });
      throw err;
    }
  }, []);

  return { updateProfile, ...state };
}
