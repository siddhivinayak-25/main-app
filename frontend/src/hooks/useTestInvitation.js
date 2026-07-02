import { useState, useEffect } from 'react';
import { getInvitationByToken } from '../api/invitationService';

export function useTestInvitation(token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    getInvitationByToken(token)
      .then((res) => {
        if (mounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load invitation');
          setData(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return { data, loading, error };
}
