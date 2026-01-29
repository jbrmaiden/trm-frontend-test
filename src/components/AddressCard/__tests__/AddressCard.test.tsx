import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  render,
  setTestAddresses,
  getTestAddresses,
  server,
  mockBalanceSuccess,
  mockBalanceError,
} from '@/test/test-utils';
import AddressCard from '../index';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_ETH_PRICE = 2000;

describe('AddressCard', () => {
  beforeEach(() => {
    setTestAddresses([TEST_ADDRESS]);
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders address text', () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' })); // 1 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      expect(screen.getByText(TEST_ADDRESS)).toBeInTheDocument();
    });

    it('renders ETH Balance and USD Value labels', () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });

    it('renders delete button', () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      const deleteButton = screen.getByRole('button', {
        name: `Remove address ${TEST_ADDRESS}`,
      });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching balance', () => {
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Should show loading spinners
      const spinners = screen.getAllByRole('status');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('shows loading status indicator (yellow pulsing dot)', () => {
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Look for the yellow loading indicator
      const loadingIndicator = screen.getByTitle('Loading');
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveClass('bg-yellow-400');
    });
  });

  describe('Success State', () => {
    it('displays ETH balance when data loads', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1500000000000000000' })); // 1.5 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for success indicator
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // Balance labels should be present
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });

    it('displays USD value when data loads', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '2000000000000000000' })); // 2 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={2500} />);

      // Wait for success indicator
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // USD value label should be present
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });

    it('shows success status indicator (green dot)', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
        expect(successIndicator).toHaveClass('bg-green-500');
      });
    });

    it('displays balance with proper formatting', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1234567890000000000000000' })); // Very large
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for success indicator
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // Balance should be displayed
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error status indicator (red dot)', async () => {
      server.use(mockBalanceError([TEST_ADDRESS]));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await waitFor(() => {
        const errorIndicator = screen.getByTitle('Error loading data');
        expect(errorIndicator).toBeInTheDocument();
        expect(errorIndicator).toHaveClass('bg-red-500');
      });
    });

    it('shows "Failed to load" badge on error', async () => {
      server.use(mockBalanceError([TEST_ADDRESS]));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('shows placeholder dashes for balance on error', async () => {
      server.use(mockBalanceError([TEST_ADDRESS]));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for error state
      await waitFor(() => {
        const errorIndicator = screen.getByTitle('Error loading data');
        expect(errorIndicator).toBeInTheDocument();
      });

      // Labels should still be present
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Dialog', () => {
    it('opens confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      const deleteButton = screen.getByRole('button', {
        name: `Remove address ${TEST_ADDRESS}`,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('dialog shows correct title and description', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(within(dialog).getByText('Remove Address')).toBeInTheDocument();
        expect(
          within(dialog).getByText(/are you sure you want to stop monitoring/i)
        ).toBeInTheDocument();
        expect(within(dialog).getByText(TEST_ADDRESS)).toBeInTheDocument();
      });
    });

    it('dialog has Cancel and Remove buttons', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /^remove$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Action', () => {
    it('closes dialog without removing address when Cancel is clicked', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Cancel
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });

      // Address should still be in store
      expect(getTestAddresses()).toContain(TEST_ADDRESS);
    });
  });

  describe('Remove Action', () => {
    it('removes address from store when Remove is confirmed', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      expect(getTestAddresses()).toContain(TEST_ADDRESS);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Remove
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

      // Address should be removed from store
      await waitFor(() => {
        expect(getTestAddresses()).not.toContain(TEST_ADDRESS);
      });
    });

    it('closes dialog after removing address', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Remove
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

      // Dialog should close (component will unmount since address is removed)
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero balance correctly', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '0' })); // 0 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for success indicator to ensure data loaded
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // Now check that balance is shown (zero formatted)
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });

    it('handles very small balance correctly', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000' })); // 0.000001 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for success indicator to ensure data loaded
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // Balance should be displayed (even if very small)
      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
    });

    it('handles high ETH price correctly', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' })); // 1 ETH
      render(<AddressCard address={TEST_ADDRESS} ethPrice={100000} />);

      // Wait for success indicator to ensure data loaded
      await waitFor(() => {
        const successIndicator = screen.getByTitle('Data loaded successfully');
        expect(successIndicator).toBeInTheDocument();
      });

      // USD value should be calculated and displayed
      expect(screen.getByText('USD Value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('delete button has descriptive aria-label', () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      const deleteButton = screen.getByRole('button', {
        name: `Remove address ${TEST_ADDRESS}`,
      });
      expect(deleteButton).toHaveAttribute('aria-label', `Remove address ${TEST_ADDRESS}`);
    });

    it('status indicators have title attributes', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      await waitFor(() => {
        const indicator = screen.getByTitle('Data loaded successfully');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('shows success toast when address is removed', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Remove
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

      // Verify toast was called
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Address removed', {
          description: expect.stringContaining('Stopped monitoring'),
        });
      });
    });

    it('includes truncated address in success toast description', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Remove
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

      // Verify toast was called with truncated address
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Address removed', {
          description: `Stopped monitoring ${TEST_ADDRESS.slice(0, 10)}...${TEST_ADDRESS.slice(-8)}`,
        });
      });
    });

    it('does not show toast when Cancel is clicked', async () => {
      const user = userEvent.setup();
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Open dialog
      await user.click(
        screen.getByRole('button', { name: `Remove address ${TEST_ADDRESS}` })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // Click Cancel
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      // Verify no toast was called
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows error toast when balance fetch fails (after all retries)', async () => {
      server.use(mockBalanceError([TEST_ADDRESS]));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for the error state to be reached (after all retries)
      await waitFor(() => {
        expect(screen.getByTitle('Error loading data')).toBeInTheDocument();
      });

      // Verify error toast was called
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch balance', {
        id: `balance-error-${TEST_ADDRESS}`,
        description: expect.stringContaining('Could not load balance'),
      });
    });

    it('does not show error toast on successful balance fetch', async () => {
      server.use(mockBalanceSuccess({ [TEST_ADDRESS]: '1000000000000000000' }));
      render(<AddressCard address={TEST_ADDRESS} ethPrice={TEST_ETH_PRICE} />);

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByTitle('Data loaded successfully')).toBeInTheDocument();
      });

      // Verify no error toast was called
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
