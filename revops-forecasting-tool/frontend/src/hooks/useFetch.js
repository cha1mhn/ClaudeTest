import { useState, useEffect, useRef } from 'react';

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((result) => {
        if (!abortRef.current) setData(result);
      })
      .catch((err) => {
        if (!abortRef.current) setError(err.message);
      })
      .finally(() => {
        if (!abortRef.current) setLoading(false);
      });

    return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
