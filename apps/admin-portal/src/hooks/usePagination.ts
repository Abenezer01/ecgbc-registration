import { useState, useCallback } from "react";

export interface UsePaginationProps {
  initialPage?: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function usePagination({
  initialPage = 1,
  pageSize,
  onPageChange,
}: UsePaginationProps): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);

  const setPage = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      setPageState(newPage);
      onPageChange?.(newPage);
    },
    [onPageChange]
  );

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const previousPage = useCallback(() => {
    setPage(page - 1);
  }, [page, setPage]);

  return {
    page,
    pageSize,
    totalPages: 0, // Will be calculated based on total from API
    setPage,
    nextPage,
    previousPage,
    canGoNext: false, // Will be updated based on total
    canGoPrevious: page > 1,
  };
}
