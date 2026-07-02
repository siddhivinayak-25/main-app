import { useState, useCallback } from 'react';
import { updateCandidateStatus as updateStatusApi } from '../api/candidatesService';

export function useUpdateCandidateStatus() {
  const [state, setState] = useState({ updating: false, error: null });

  const updateStatus = useCallback(async (candidateId, newStatus, note = '') => {
    setState({ updating: true, error: null });
    try {
      const updated = await updateStatusApi(candidateId, newStatus, note);
      setState({ updating: false, error: null });
      return updated;
    } catch (err) {
      setState({ updating: false, error: err });
      throw err;
    }
  }, []);

  return { updateStatus, ...state };
}
