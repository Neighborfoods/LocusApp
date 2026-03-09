import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination({ initialPage = 1, pageSize = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
  }, [initialPage]);

  const loadNextPage = useCallback(async (fetchFn: (page: number) => Promise<unknown[]>) => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const results = await fetchFn(page + 1);
      if (results.length < pageSize) setHasMore(false);
      if (results.length > 0) setPage((p) => p + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page, pageSize]);

  return { page, hasMore, isLoadingMore, loadNextPage, reset };
}
