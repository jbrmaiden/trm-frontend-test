import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, server } from '@/test/test-utils';
import { usePrice } from '../usePrice';
import { ApiError } from '@/types';

const API_BASE_URL = 'https://api.etherscan.io/v2/api';

// NOTE: These tests use the REAL appConfig (no mocking)
// Real config: retryAttempts: 3, retryDelay: 1000 (exponential backoff: 1s, 2s, 4s)
// Tests that involve retries will take longer (~7 seconds for full retry cycle)


describe('usePrice', () => {
  describe('Success Cases', () => {
    it('returns correct numeric price from API', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2500.00',
              ethusd_timestamp: String(Date.now()),
            },
          })
        )
      );

      const { result } = renderHook(() => usePrice());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(2500);
    });

    it('handles decimal price values correctly', async () => {
      server.use(
        http.get(API_BASE_URL, () =>
          HttpResponse.json({
            status: '1',
            message: 'OK',
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2345.67',
              ethusd_timestamp: String(Date.now()),
            },
          })
        )
      );

      const { result } = renderHook(() => usePrice());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(2345.67);
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
              message: 'Rate limit exceeded',
              result: null,
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        // Wait for all retries to complete
        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.message).toBe('Rate limit exceeded');
        expect(result.current.error?.code).toBe('API_ERROR');
        // Verify retries happened: 1 initial + 3 retries = 4
        expect(requestCount).toBe(4);
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

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.message).toBe('Failed to fetch ETH price');
        expect(result.current.error?.code).toBe('API_ERROR');
        expect(requestCount).toBe(4);
      },
      20000
    );
  });

  describe('Invalid Data', () => {
    it(
      'throws INVALID_DATA error when result object is missing (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: null,
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('INVALID_DATA');
        expect(result.current.error?.message).toBe(
          'Invalid price data received from API'
        );
        expect(requestCount).toBe(4); // 1 initial + 3 retries
      },
      20000
    );

    it(
      'throws INVALID_DATA error when ethusd field is missing (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: {
                ethbtc: '0.05',
                ethbtc_timestamp: String(Date.now()),
                // ethusd is missing
              },
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('INVALID_DATA');
        expect(requestCount).toBe(4);
      },
      20000
    );

    it(
      'throws INVALID_PRICE error when ethusd is non-numeric (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: {
                ethbtc: '0.05',
                ethbtc_timestamp: String(Date.now()),
                ethusd: 'invalid',
                ethusd_timestamp: String(Date.now()),
              },
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('INVALID_PRICE');
        expect(result.current.error?.message).toBe(
          'Invalid price value received from API'
        );
        expect(requestCount).toBe(4);
      },
      20000
    );

    it(
      'throws INVALID_PRICE error when ethusd is zero (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: {
                ethbtc: '0.05',
                ethbtc_timestamp: String(Date.now()),
                ethusd: '0',
                ethusd_timestamp: String(Date.now()),
              },
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('INVALID_PRICE');
        expect(requestCount).toBe(4);
      },
      20000
    );

    it(
      'throws INVALID_PRICE error when ethusd is negative (after retries)',
      async () => {
        let requestCount = 0;
        server.use(
          http.get(API_BASE_URL, () => {
            requestCount++;
            return HttpResponse.json({
              status: '1',
              message: 'OK',
              result: {
                ethbtc: '0.05',
                ethbtc_timestamp: String(Date.now()),
                ethusd: '-100',
                ethusd_timestamp: String(Date.now()),
              },
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isError).toBe(true),
          { timeout: 15000 }
        );
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error?.code).toBe('INVALID_PRICE');
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

        const { result } = renderHook(() => usePrice());

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

        const { result } = renderHook(() => usePrice());

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

  describe('Retry Logic', () => {
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

      const { result } = renderHook(() => usePrice());

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
              result: {
                ethbtc: '0.05',
                ethbtc_timestamp: String(Date.now()),
                ethusd: '2500.00',
                ethusd_timestamp: String(Date.now()),
              },
            });
          })
        );

        const { result } = renderHook(() => usePrice());

        await waitFor(
          () => expect(result.current.isSuccess).toBe(true),
          { timeout: 15000 }
        );

        expect(requestCount).toBe(3); // 2 failures + 1 success
        expect(result.current.data).toBe(2500);
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
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2500.00',
              ethusd_timestamp: String(Date.now()),
            },
          });
        })
      );

      const { result } = renderHook(() => usePrice());

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
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2500.00',
              ethusd_timestamp: String(Date.now()),
            },
          });
        })
      );

      const { result } = renderHook(() => usePrice());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('module')).toBe('stats');
      expect(capturedUrl!.searchParams.get('action')).toBe('ethprice');
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
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2500.00',
              ethusd_timestamp: String(Date.now()),
            },
          });
        })
      );

      const { result } = renderHook(() => usePrice());

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
            result: {
              ethbtc: '0.05',
              ethbtc_timestamp: String(Date.now()),
              ethusd: '2500.00',
              ethusd_timestamp: String(Date.now()),
            },
          })
        )
      );

      const { result } = renderHook(() => usePrice());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Eventually succeeds
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(2500);
    });
  });
});
