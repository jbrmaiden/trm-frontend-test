import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { appConfig } from '@/config/env';
import type { ApiError } from '@/types';
import { ApiError as ApiErrorClass } from '@/types';
import { fetchBalance } from './useAddressesBalances';

/**
 * Hook to fetch ETH balance for an address with retry logic and error handling.
 * @param address - Ethereum address to fetch balance for
 * @returns Query result with balance in ETH as a string with 6 decimals
 */
export function useBalance(address: string): UseQueryResult<string, ApiError> {
  return useQuery<string, ApiError>({
    queryKey: ['balance', address],
    queryFn: ({ signal }) => fetchBalance(address, signal),
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx) or validation errors
      if (
        error instanceof ApiErrorClass &&
        (error.status === 400 || error.code === 'INVALID_ADDRESS')
      ) {
        return false;
      }
      // Retry up to configured attempts for other errors
      return failureCount < appConfig.retryAttempts;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, etc.
      return Math.min(appConfig.retryDelay * Math.pow(2, attemptIndex), 30000);
    },
    staleTime: appConfig.refreshInterval,
    gcTime: appConfig.refreshInterval * 2, // Keep in cache longer than stale time
    refetchOnWindowFocus: false, // Don't refetch on window focus for this use case
  });
}