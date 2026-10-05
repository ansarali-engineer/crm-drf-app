import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListParams, PaginatedResponse } from '@/types';

interface UseResourceListOptions {
  initialParams?: ListParams;
  pageSize?: number;
  deps?: unknown[];
}

interface UseResourceListResult<T> {
  data: T[];
  count: number;
  loading: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  setPage: (page: number) => void;
  setParams: (params: Record<string, string | number | boolean | undefined>) => void;
  reload: () => void;
}

export function useResourceList<T>(
  fetchFn: (params: ListParams) => Promise<PaginatedResponse<T>>,
  options: UseResourceListOptions = {},
): UseResourceListResult<T> {
  const { initialParams = {}, pageSize = 10, deps = [] } = options;
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [extraParams, setExtraParams] = useState<Record<string, string | number | boolean | undefined>>({});
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;
  const initialParamsRef = useRef(initialParams);
  initialParamsRef.current = initialParams;
  const pageRef = useRef(page);
  pageRef.current = page;
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const setParams = useCallback((params: Record<string, string | number | boolean | undefined>) => {
    setExtraParams(params);
    setPage(1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFnRef
      .current({ page: pageRef.current, page_size: pageSize, ...initialParamsRef.current, ...extraParamsRef.current })
      .then((res) => {
        if (cancelled) return;
        // Defensively handle both paginated { results, count } and plain array responses
        const raw = res as unknown;
        if (raw && typeof raw === 'object' && 'results' in raw) {
          const paginated = raw as { results: T[]; count?: number };
          setData(paginated.results);
          setCount(paginated.count ?? paginated.results.length);
        } else if (Array.isArray(raw)) {
          setData(raw as T[]);
          setCount((raw as T[]).length);
        } else {
          setData([]);
          setCount(0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        setError(msg);
        setData([]);
        setCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, reloadKey, JSON.stringify(extraParams), ...deps]);

  return {
    data: data as T[],
    count,
    loading,
    error,
    page,
    hasNext: page * pageSize < count,
    hasPrev: page > 1,
    setPage,
    setParams,
    reload,
  };
}
