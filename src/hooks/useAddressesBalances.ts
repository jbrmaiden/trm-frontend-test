import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { appConfig } from '@/config/env';
import type { ApiError, EtherscanBalanceResponse } from '@/types';
import { ApiError as ApiErrorClass } from '@/types';

/**
 * Shared query function for fetching balance. Used by both useBalance and useAddressesBalances.
 */
async function fetchBalance(address: string, signal?: AbortSignal): Promise<string> {
  try {
    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ApiErrorClass('Invalid Ethereum address format', 400, 'INVALID_ADDRESS');
    }

    const params: Record<string, string> = {
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      chainid: '1',
    };

    // Only add API key if available
    if (appConfig.etherscanApiKey) {
      params.apikey = appConfig.etherscanApiKey;
    }

    const response = await axios.get<EtherscanBalanceResponse>(appConfig.apiBaseUrl, {
      params,
      signal, // Support request cancellation
      timeout: 10000, // 10 second timeout
    });

    // Handle API errors
    if (response.data.status === '0') {
      throw new ApiErrorClass(
        response.data.message || 'Failed to fetch balance',
        response.status,
        'API_ERROR'
      );
    }

    // Convert Wei to ETH with precision handling
    const weiBalance = response.data.result;
    if (!weiBalance || weiBalance === '0') {
      return '0.000000';
    }

    return new BigNumber(weiBalance).dividedBy(new BigNumber(10).pow(18)).toFixed(6);
  } catch (error) {
    // Re-throw AbortError to handle query cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    // Handle network errors
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new ApiErrorClass(
        `Network error: ${message}`,
        error.response?.status || 500,
        'NETWORK_ERROR'
      );
    }

    // Re-throw ApiError instances
    if (error instanceof ApiErrorClass) {
      throw error;
    }

    // Handle unexpected errors
    throw new ApiErrorClass(
      'An unexpected error occurred while fetching balance',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Hook to fetch balances for multiple Ethereum addresses.
 * Uses TanStack Query's useQueries to maintain consistent hook calls regardless of array length.
 *
 * The query keys match those used by individual useBalance hooks, so data is shared
 * via TanStack Query's cache (no duplicate network requests).
 *
 * @param addresses - Array of Ethereum addresses to fetch balances for
 * @returns Array of query results with balance data
 */
export function useAddressesBalances(
  addresses: string[]
): UseQueryResult<string, ApiError>[] {
  const queries = useQueries({
    queries: addresses.map((address) => ({
      queryKey: ['balance', address],
      queryFn: ({ signal }) => fetchBalance(address, signal),
      retry: (failureCount: number, error: ApiError) => {
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
      retryDelay: (attemptIndex: number) => {
        // Exponential backoff: 1s, 2s, 4s, etc.
        return Math.min(appConfig.retryDelay * Math.pow(2, attemptIndex), 30000);
      },
      staleTime: appConfig.refreshInterval,
      gcTime: appConfig.refreshInterval * 2, // Keep in cache longer than stale time
      refetchOnWindowFocus: false, // Don't refetch on window focus for this use case
    })),
  });

  return queries;
}

export { fetchBalance };
