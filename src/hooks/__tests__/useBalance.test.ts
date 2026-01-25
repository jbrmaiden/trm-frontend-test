import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, server } from '@/test/test-utils';
import { useBalance } from '../useBalance';
import { ApiError } from '@/types';

const API_BASE_URL = 'https://api.etherscan.io/v2/api';
const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';

// NOTE: These tests use the REAL appConfig (no mocking)
// Real config: retryAttempts: 3, retryDelay: 1000 (exponential backoff: 1s, 2s, 4s)
// Tests that involve retries will take longer (~7 seconds for full retry cycle)

describe('useBalance', () => {
  describe('Success Cases', () => {
    it('converts Wei to ETH with 6 decimal precision (1 ETH)', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000', // 1 ETH in Wei
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe('1.000000');
    });

    it('converts Wei to ETH with correct decimal precision (rounds to 6 decimals)', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1234567890123456789', // ~1.234567890... ETH, rounds to 1.234568
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // toFixed(6) rounds, so 1.234567890... becomes 1.234568
      expect(result.current.data).toBe('1.234568');
    });

    it('returns "0.000000" for zero balance', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe('0.000000');
    });

    it('returns "0.000000" for empty string balance', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '',
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe('0.000000');
    });

    it('uses correct query key structure with address', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(API_BASE_URL, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('address')).toBe(VALID_ADDRESS);
    });
  });

  describe('Address Validation (Client-Side)', () => {
    it('rejects address that is too short and does not make API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          });
        })
      );

      const { result } = renderHook(() => useBalance('0x123'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.code).toBe('INVALID_ADDRESS');
      expect(result.current.error?.message).toBe(
        'Invalid Ethereum address format'
      );
      // Verify no API call was made
      expect(requestCount).toBe(0);
    });

    it('rejects address without 0x prefix and does not make API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          });
        })
      );

      const { result } = renderHook(() =>
        useBalance('1234567890123456789012345678901234567890')
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.code).toBe('INVALID_ADDRESS');
      expect(requestCount).toBe(0);
    });

    it('rejects address with invalid hex characters and does not make API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          });
        })
      );

      const { result } = renderHook(() =>
        useBalance('0xGGGG567890123456789012345678901234567890')
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.code).toBe('INVALID_ADDRESS');
      expect(requestCount).toBe(0);
    });

    it('rejects address that is too long and does not make API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          });
        })
      );

      const { result } = renderHook(() =>
        useBalance('0x12345678901234567890123456789012345678901234567890')
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.code).toBe('INVALID_ADDRESS');
      expect(requestCount).toBe(0);
    });

    it('accepts valid lowercase address and makes API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() =>
        useBalance('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(requestCount).toBe(1);
    });

    it('accepts valid uppercase address and makes API call', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() =>
        useBalance('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(requestCount).toBe(1);
    });
  });

  describe('API Response Errors (status: "0")', () => {
    it(
      'throws ApiError with custom message when API returns status "0" (after retries)',
      async () => {
        let requestCount = 0;
        // Use HTTP 200 so Axios processes the response body (not throw on HTTP error)
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '0',
              message: 'Error! Invalid address format',
              result: null,
            });
          })
        );

        const { result } = renderHook(() => useBalance(VALID_ADDRESS));

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.message).toBe(
          'Error! Invalid address format'
        );
        expect(result.current.error?.code).toBe('API_ERROR');
        expect(requestCount).toBe(4); // 1 initial + 3 retries
      },
      20000
    );

    it(
      'uses default error message when API returns status "0" with empty message (after retries)',
      async () => {
        let requestCount = 0;
        // Use HTTP 200 so Axios processes the response body (not throw on HTTP error)
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '0',
              message: '',
              result: null,
            });
          })
        );

        const { result } = renderHook(() => useBalance(VALID_ADDRESS));

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.message).toBe('Failed to fetch balance');
        expect(result.current.error?.code).toBe('API_ERROR');
        expect(requestCount).toBe(4);
      },
      20000
    );
  });

  describe('Network Errors', () => {
    it(
      'throws NETWORK_ERROR when network request fails (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.error();
          })
        );

        const { result } = renderHook(() => useBalance(VALID_ADDRESS));

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('NETWORK_ERROR');
        expect(result.current.error?.message).toContain('Network error');
        expect(requestCount).toBe(4); // 1 initial + 3 retries
      },
      20000
    );

    it(
      'throws NETWORK_ERROR with status when server returns HTTP 500 (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json(
              { message: 'Internal Server Error' },
              { status: 500 }
            );
          })
        );

        const { result } = renderHook(() => useBalance(VALID_ADDRESS));

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('NETWORK_ERROR');
        expect(result.current.error?.status).toBe(500);
        expect(requestCount).toBe(4);
      },
      20000
    );
  });

  describe('BigNumber Precision Tests', () => {
    it('handles very small Wei value (1 Wei) correctly', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1', // 1 Wei = 0.000000000000000001 ETH
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // Should round to 0.000000 (6 decimal places)
      expect(result.current.data).toBe('0.000000');
    });

    it('handles large Wei value (1 million ETH) correctly', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000000000', // 1,000,000 ETH in Wei
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe('1000000.000000');
    });

    it('handles fractional ETH values with precision (rounds correctly)', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '123456789012345678', // 0.123456789... ETH, rounds to 0.123457
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // toFixed(6) rounds, so 0.123456789... becomes 0.123457
      expect(result.current.data).toBe('0.123457');
    });

    it('handles balance with many decimal places correctly (rounds up)', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '9999999999999999999', // 9.999999999... ETH, rounds to 10.000000
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // toFixed(6) rounds, so 9.999999999... becomes 10.000000
      expect(result.current.data).toBe('10.000000');
    });
  });

  describe('Retry Logic', () => {
    it('does NOT retry on INVALID_ADDRESS validation error (no API call)', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '0',
          });
        })
      );

      const { result } = renderHook(() => useBalance('invalid'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.code).toBe('INVALID_ADDRESS');
      // No API calls should be made for validation errors
      expect(requestCount).toBe(0);
    });

    it('does NOT retry on HTTP 400 client error', async () => {
      let requestCount = 0;

      server.use(
        http.get(API_BASE_URL, () => {
          requestCount++;
          return HttpResponse.json(
            {
              status: '0',
              message: 'Bad request',
              result: null,
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isError).toBe(true));
      // Should only make 1 request (no retries for 400 errors)
      expect(requestCount).toBe(1);
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.status).toBe(400);
    });

    it(
      'succeeds after transient failures (fails twice, then succeeds)',
      async () => {
        let requestCount = 0;

        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            // Fail first 2 requests, succeed on 3rd
            if (requestCount <= 2) {
              return HttpResponse.json({
                status: '0',
                message: 'Temporary error',
                result: null,
              });
            }
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: '5000000000000000000', // 5 ETH
            });
          })
        );

        const { result } = renderHook(() => useBalance(VALID_ADDRESS));

        await waitFor(
          () => expect(result.current.isSuccess).toBe(true),
          { timeout: 15000 }
        );

        expect(requestCount).toBe(3); // 2 failures + 1 success
        expect(result.current.data).toBe('5.000000');
      },
      20000
    );
  });

  describe('Configuration', () => {
    it('includes chainid parameter in request', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(API_BASE_URL, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('chainid')).toBe('1');
    });

    it('includes module and action parameters in request', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(API_BASE_URL, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('module')).toBe('account');
      expect(capturedUrl!.searchParams.get('action')).toBe('balance');
    });

    it('includes tag parameter set to "latest" in request', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(API_BASE_URL, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('tag')).toBe('latest');
    });
  });

  describe('Loading States', () => {
    it('starts in loading state', () => {
      server.use(
        http.get(API_BASE_URL, async () => {
          // Delay to keep loading state
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          });
        })
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('transitions from loading to success', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: '1000000000000000000',
          })
        )
      );

      const { result } = renderHook(() => useBalance(VALID_ADDRESS));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Eventually succeeds
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('1.000000');
    });
  });

  describe('Different Valid Addresses', () => {
    it('fetches balance for different addresses independently', async () => {
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      server.use(
        http.get(API_BASE_URL, ({ request }) => {
          const url = new URL(request.url);
          const address = url.searchParams.get('address');

          if (address === address1) {
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: '1000000000000000000', // 1 ETH
            });
          }
          if (address === address2) {
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: '2000000000000000000', // 2 ETH
            });
          }
          return HttpResponse.json({
            status: '0',
            message: 'Unknown address',
            result: null,
          });
        })
      );

      const { result: result1 } = renderHook(() => useBalance(address1));
      const { result: result2 } = renderHook(() => useBalance(address2));

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      expect(result1.current.data).toBe('1.000000');
      expect(result2.current.data).toBe('2.000000');
    });
  });
});
