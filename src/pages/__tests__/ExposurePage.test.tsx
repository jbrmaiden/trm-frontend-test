import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  render,
  screen,
  waitFor,
  server,
  mockPriceError,
  mockPriceWithDelay,
  mockEtherscanApi,
} from '@/test/test-utils';
import ExposurePage from '../ExposurePage';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

// Test addresses (valid Ethereum address format)
const TEST_ADDRESSES = [
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
];

const SINGLE_ADDRESS = ['0x1234567890123456789012345678901234567890'];

describe('ExposurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('shows loading spinner when price is loading', async () => {
      // Add delay to price request so we can see loading state
      server.use(mockPriceWithDelay(5000));

      render(<ExposurePage />, { initialAddresses: SINGLE_ADDRESS });

      // Should show loading spinner with text
      expect(screen.getByText('Loading ETH price...')).toBeInTheDocument();
    });

    it('shows loading indicators for individual balance cards', async () => {
      // Price loads fast, but balances are delayed
      server.use(
        mockEtherscanApi({
          price: '2500.00',
          balanceDelayMs: 5000,
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for price to load (so we're past the initial loading screen)
      await waitFor(() => {
        expect(
          screen.queryByText('Loading ETH price...')
        ).not.toBeInTheDocument();
      });

      // Balance cards should show loading indicators (yellow dots)
      const loadingIndicators = document.querySelectorAll(
        '.bg-yellow-400.animate-pulse'
      );
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('shows error alert when price fetch fails', async () => {
      server.use(mockPriceError('API rate limit exceeded'));

      render(<ExposurePage />, { initialAddresses: SINGLE_ADDRESS });

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error Loading Price')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Unable to fetch ETH price. Please try again later.')
      ).toBeInTheDocument();
    });

    it('shows error toast when price fetch fails', async () => {
      server.use(mockPriceError('API rate limit exceeded'));

      render(<ExposurePage />, { initialAddresses: SINGLE_ADDRESS });

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error Loading Price')).toBeInTheDocument();
      });

      // Verify error toast was called
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch ETH price', {
        id: 'price-error',
        description: 'Could not load current ETH price',
      });
    });

    it('does not show error toast when price fetch succeeds', async () => {
      server.use(
        mockEtherscanApi({
          price: '2500.00',
        })
      );

      render(<ExposurePage />, { initialAddresses: SINGLE_ADDRESS });

      // Wait for successful load
      await waitFor(() => {
        expect(screen.getByText(/ETH Price:/)).toBeInTheDocument();
      });

      // Verify no error toast was called
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows error badge when individual balance fetch fails', async () => {
      const errorAddress = TEST_ADDRESSES[0];

      server.use(
        mockEtherscanApi({
          price: '2500.00',
          balanceErrors: [errorAddress],
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for data to load
      await waitFor(
        () => {
          expect(screen.getByText('Failed to load')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should show red error indicator dot
      const errorIndicator = document.querySelector('.bg-red-500');
      expect(errorIndicator).toBeInTheDocument();
    });
  });

  describe('Success States', () => {
    it('renders addresses with balances and USD values', async () => {
      // 1 ETH = 1000000000000000000 Wei
      const oneEthInWei = '1000000000000000000';

      server.use(
        mockEtherscanApi({
          price: '2500.00',
          balances: {
            [TEST_ADDRESSES[0]]: oneEthInWei,
            [TEST_ADDRESSES[1]]: oneEthInWei,
          },
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for data to load
      await waitFor(
        () => {
          // Check that addresses are displayed
          expect(screen.getByText(TEST_ADDRESSES[0])).toBeInTheDocument();
          expect(screen.getByText(TEST_ADDRESSES[1])).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check ETH balance is displayed (1.000000 ETH)
      const ethBalances = screen.getAllByText(/1\.000000 ETH/);
      expect(ethBalances.length).toBe(2);

      // Check USD value is displayed ($2,500.00)
      const usdValues = screen.getAllByText(/\$2,500\.00/);
      expect(usdValues.length).toBeGreaterThanOrEqual(2);

      // Check ETH price badge
      expect(screen.getByText(/ETH Price: \$2,500 USD/)).toBeInTheDocument();

      // Check address count badge
      expect(screen.getByText('2 Addresses')).toBeInTheDocument();
    });

    it('displays header and page title correctly', async () => {
      server.use(
        mockEtherscanApi({
          price: '2500.00',
        })
      );

      render(<ExposurePage />, { initialAddresses: SINGLE_ADDRESS });

      await waitFor(() => {
        expect(
          screen.getByText('Sanctioned Address Exposure')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Monitor ETH balances and USD exposure across sanctioned addresses'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Total Exposure')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('handles empty address list gracefully', async () => {
      server.use(
        mockEtherscanApi({
          price: '2500.00',
        })
      );

      render(<ExposurePage />, { initialAddresses: [] });

      // Wait for price to load
      await waitFor(() => {
        expect(
          screen.queryByText('Loading ETH price...')
        ).not.toBeInTheDocument();
      });

      // Should show $0.00 total exposure
      expect(screen.getByText('$0.00')).toBeInTheDocument();

      // Should show 0 addresses badge
      expect(screen.getByText('0 Addresses')).toBeInTheDocument();

      // Should not show any address cards
      const cards = document.querySelectorAll('.font-mono.break-all');
      expect(cards.length).toBe(0);
    });
  });

  describe('Calculations', () => {
    it('correctly calculates total USD exposure', async () => {
      // Set up different balances for each address
      // Address 1: 2 ETH, Address 2: 3 ETH
      // Price: $1000/ETH
      // Total: 5 ETH * $1000 = $5,000
      const twoEthInWei = '2000000000000000000';
      const threeEthInWei = '3000000000000000000';

      server.use(
        mockEtherscanApi({
          price: '1000.00',
          balances: {
            [TEST_ADDRESSES[0]]: twoEthInWei,
            [TEST_ADDRESSES[1]]: threeEthInWei,
          },
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for all data to load
      await waitFor(
        () => {
          // Check total exposure
          const totalExposure = screen.getByText('$5,000.00');
          expect(totalExposure).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify individual balances
      expect(screen.getByText('2.000000 ETH')).toBeInTheDocument();
      expect(screen.getByText('3.000000 ETH')).toBeInTheDocument();
    });

    it('shows success indicators (green dots) for loaded balances', async () => {
      server.use(
        mockEtherscanApi({
          price: '2500.00',
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for data to load
      await waitFor(
        () => {
          const successIndicators = document.querySelectorAll('.bg-green-500');
          expect(successIndicators.length).toBe(2);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Mixed States', () => {
    it('handles mix of successful and failed balance fetches', async () => {
      // First address succeeds, second address fails
      const successAddress = TEST_ADDRESSES[0];
      const errorAddress = TEST_ADDRESSES[1];
      const oneEthInWei = '1000000000000000000';

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [successAddress]: oneEthInWei,
          },
          balanceErrors: [errorAddress],
        })
      );

      render(<ExposurePage />, { initialAddresses: TEST_ADDRESSES });

      // Wait for data to load
      await waitFor(
        () => {
          // Success address should show balance
          expect(screen.getByText('1.000000 ETH')).toBeInTheDocument();
          expect(screen.getAllByText('$2,000.00').length).toBeGreaterThan(0);

          // Error address should show error badge
          expect(screen.getByText('Failed to load')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should have one green indicator (success) and one red indicator (error)
      const successIndicators = document.querySelectorAll('.bg-green-500');
      const errorIndicators = document.querySelectorAll('.bg-red-500');
      expect(successIndicators.length).toBe(1);
      expect(errorIndicators.length).toBe(1);

      // Total should only include successful address ($2,000.00)
      // Use getAllByText since the value appears in both total and individual card
      const usdValues = screen.getAllByText('$2,000.00');
      expect(usdValues.length).toBe(2); // One in total card, one in address card
    });

    it('calculates total excluding failed balances', async () => {
      // 3 addresses: 2 succeed with 1 ETH each, 1 fails
      const threeAddresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ];

      const oneEthInWei = '1000000000000000000';

      server.use(
        mockEtherscanApi({
          price: '1500.00',
          balances: {
            [threeAddresses[0]]: oneEthInWei,
            [threeAddresses[1]]: oneEthInWei,
          },
          balanceErrors: [threeAddresses[2]],
        })
      );

      render(<ExposurePage />, { initialAddresses: threeAddresses });

      // Wait for data to load
      await waitFor(
        () => {
          // Total should be 2 ETH * $1500 = $3,000
          expect(screen.getByText('$3,000.00')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should show 3 addresses badge
      expect(screen.getByText('3 Addresses')).toBeInTheDocument();
    });
  });
});
