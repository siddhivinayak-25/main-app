import { useReducer, useEffect, useCallback, useState } from 'react';

const initialState = { data: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: null };
    case 'success':
      return { data: action.payload, loading: false, error: null };
    case 'error':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

// Generic async-state hook. Every data hook in this app is a thin
// wrapper around this — same {data, loading, error} shape everywhere.
export function useAsync(fetcher, deps = []) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefetchIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'start' });

    fetcher()
      .then((data) => { if (!cancelled) dispatch({ type: 'success', payload: data }); })
      .catch((error) => { if (!cancelled) dispatch({ type: 'error', payload: error }); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex]);

  return { ...state, refetch };
}
