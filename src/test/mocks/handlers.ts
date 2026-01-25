import { http, HttpResponse, delay } from 'msw';
import type {
  EtherscanBalanceResponse,
  EtherscanPriceResponse,
} from '@/types';

const API_BASE_URL = 'https://api.etherscan.io/v2/api';

// Default mock values
const DEFAULT_ETH_PRICE = '2500.00';
const DEFAULT_WEI_BALANCE = '1000000000000000000'; // 1 ETH in Wei

/**
 * Creates a successful ETH price response
 */
function createPriceResponse(ethusd: string): EtherscanPriceResponse {
  return {
    status: '1',
    message: 'OK',
    result: {
      ethbtc: '0.05',
      ethbtc_timestamp: String(Date.now()),
      ethusd,
      ethusd_timestamp: String(Date.now()),
    },
  };
}

/**
 * Creates a successful balance response
 */
function createBalanceResponse(wei: string): EtherscanBalanceResponse {
  return {
    status: '1',
    message: 'OK',
    result: wei,
  };
}

/**
 * Creates an error response matching Etherscan's format
 */
function createErrorResponse(message: string) {
  return {
    status: '0',
    message,
    result: null,
  };
}

/**
 * Default handlers that return successful responses
 */
export const handlers = [
  http.get(API_BASE_URL, ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');
    const address = url.searchParams.get('address');

    // Handle ETH price request
    if (module === 'stats' && action === 'ethprice') {
      return HttpResponse.json(createPriceResponse(DEFAULT_ETH_PRICE));
    }

    // Handle balance request
    if (module === 'account' && action === 'balance' && address) {
      return HttpResponse.json(createBalanceResponse(DEFAULT_WEI_BALANCE));
    }

    // Unknown request
    return HttpResponse.json(createErrorResponse('Invalid request'), {
      status: 400,
    });
  }),
];

// ============================================
// Per-test override handlers
// ============================================

/**
 * Mock handler for successful ETH price response
 * @param price - ETH price in USD as string (e.g., "2500.00")
 */
export function mockPriceSuccess(price: string = DEFAULT_ETH_PRICE) {
  return http.get(API_BASE_URL, ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');

    if (module === 'stats' && action === 'ethprice') {
      return HttpResponse.json(createPriceResponse(price));
    }

    // Pass through to default handler for other requests
    return undefined;
  });
}

/**
 * Mock handler for ETH price error
 * @param message - Error message
 * @param httpStatus - HTTP status code (default 400 to prevent retries)
 */
export function mockPriceError(
  message: string = 'API rate limit exceeded',
  httpStatus: number = 400
) {
  return http.get(API_BASE_URL, ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');

    if (module === 'stats' && action === 'ethprice') {
      return HttpResponse.json(createErrorResponse(message), {
        status: httpStatus,
      });
    }

    return undefined;
  });
}

/**
 * Mock handler for successful balance response
 * @param addressBalances - Map of address to Wei balance
 */
export function mockBalanceSuccess(
  addressBalances: Record<string, string> = {}
) {
  return http.get(API_BASE_URL, ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');
    const address = url.searchParams.get('address');

    if (module === 'account' && action === 'balance' && address) {
      const wei = addressBalances[address] ?? DEFAULT_WEI_BALANCE;
      return HttpResponse.json(createBalanceResponse(wei));
    }

    return undefined;
  });
}

/**
 * Mock handler for balance error for specific addresses
 * @param errorAddresses - Array of addresses that should return errors
 * @param successBalances - Map of address to Wei balance for successful responses
 * @param httpStatus - HTTP status code for errors (default 400 to prevent retries)
 */
export function mockBalanceError(
  errorAddresses: string[],
  successBalances: Record<string, string> = {},
  httpStatus: number = 400
) {
  return http.get(API_BASE_URL, ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');
    const address = url.searchParams.get('address');

    if (module === 'account' && action === 'balance' && address) {
      if (errorAddresses.includes(address)) {
        return HttpResponse.json(createErrorResponse('Failed to fetch balance'), {
          status: httpStatus,
        });
      }

      const wei = successBalances[address] ?? DEFAULT_WEI_BALANCE;
      return HttpResponse.json(createBalanceResponse(wei));
    }

    return undefined;
  });
}

/**
 * Mock handler that adds delay to price requests (for testing loading states)
 * @param delayMs - Delay in milliseconds
 */
export function mockPriceWithDelay(delayMs: number = 1000) {
  return http.get(API_BASE_URL, async ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');

    if (module === 'stats' && action === 'ethprice') {
      await delay(delayMs);
      return HttpResponse.json(createPriceResponse(DEFAULT_ETH_PRICE));
    }

    return undefined;
  });
}

/**
 * Mock handler that adds delay to balance requests (for testing loading states)
 * @param delayMs - Delay in milliseconds
 */
export function mockBalanceWithDelay(delayMs: number = 1000) {
  return http.get(API_BASE_URL, async ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');

    if (module === 'account' && action === 'balance') {
      await delay(delayMs);
      return HttpResponse.json(createBalanceResponse(DEFAULT_WEI_BALANCE));
    }

    return undefined;
  });
}

/**
 * Combined handler for full control over both price and balance responses
 */
export function mockEtherscanApi(options: {
  price?: string;
  priceError?: boolean;
  balances?: Record<string, string>;
  balanceErrors?: string[];
  priceDelayMs?: number;
  balanceDelayMs?: number;
  errorHttpStatus?: number;
}) {
  const {
    price = DEFAULT_ETH_PRICE,
    priceError = false,
    balances = {},
    balanceErrors = [],
    priceDelayMs = 0,
    balanceDelayMs = 0,
    errorHttpStatus = 400, // Default to 400 to prevent retries
  } = options;

  return http.get(API_BASE_URL, async ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const action = url.searchParams.get('action');
    const address = url.searchParams.get('address');

    // Handle ETH price request
    if (module === 'stats' && action === 'ethprice') {
      if (priceDelayMs > 0) await delay(priceDelayMs);

      if (priceError) {
        return HttpResponse.json(createErrorResponse('Price fetch failed'), {
          status: errorHttpStatus,
        });
      }
      return HttpResponse.json(createPriceResponse(price));
    }

    // Handle balance request
    if (module === 'account' && action === 'balance' && address) {
      if (balanceDelayMs > 0) await delay(balanceDelayMs);

      if (balanceErrors.includes(address)) {
        return HttpResponse.json(createErrorResponse('Failed to fetch balance'), {
          status: errorHttpStatus,
        });
      }

      const wei = balances[address] ?? DEFAULT_WEI_BALANCE;
      return HttpResponse.json(createBalanceResponse(wei));
    }

    return HttpResponse.json(createErrorResponse('Invalid request'), {
      status: 400,
    });
  });
}
