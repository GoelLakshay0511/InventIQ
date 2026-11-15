import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for InventIQ PWA.
 * Exported so auth transitions (login/logout/switch) can clear cached query data.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 1 minute before background refetch
      staleTime: 60 * 1000,
      // Retry failed requests up to 2 times with exponential back-off
      retry: 2,
      // Don't refetch just because window regains focus
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
