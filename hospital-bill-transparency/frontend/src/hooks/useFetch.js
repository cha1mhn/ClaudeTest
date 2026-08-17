import { useEffect, useState, useCallback } from 'react';

export default function useFetch(fetcher, deps = [], { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    if (skip) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { data, loading, error, refetch: run };
}
