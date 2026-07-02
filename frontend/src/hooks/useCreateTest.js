import { useState, useCallback } from 'react';
import { createTest as createTestApi } from '../api/testsService';

// Unlike the useAsync-on-mount hooks, this exposes an imperative
// createTest(data) that only fires when called (e.g. on Publish click).
export function useCreateTest() {
  const [state, setState] = useState({ loading: false, error: null });

  const createTest = useCallback(async (formData) => {
    setState({ loading: true, error: null });
    try {
      const created = await createTestApi(formData);
      setState({ loading: false, error: null });
      return created;
    } catch (err) {
      setState({ loading: false, error: err });
      throw err;
    }
  }, []);

  return { createTest, ...state };
}
