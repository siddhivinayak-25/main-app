import { useState, useEffect, useCallback } from 'react';

// Generic async-state hook. Every data hook in this app is a thin
// wrapper around this — same {data, loading, error} shape everywhere.
export function useAsync(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefetchIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: prev.data, loading: true, error: null }));

    fetcher()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, loading: false, error }); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex]);

  return { ...state, refetch };
}