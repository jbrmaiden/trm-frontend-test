import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  render,
  setTestAddresses,
  getTestAddresses,
  server,
  mockEtherscanApi,
} from '@/test/test-utils';
import ExposurePage from '../ExposurePage';

const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';

// Helper functions for common actions
function getTriggerButton() {
  return screen.getByRole('button', { name: /add new ethereum address to watchlist/i });
}

async function openAddAddressDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getTriggerButton());
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

function getAddressInput() {
  const dialog = screen.getByRole('dialog');
  return within(dialog).getByRole('textbox');
}

function getSubmitButton() {
  const dialog = screen.getByRole('dialog');
  return within(dialog).getByRole('button', { name: /add address to watchlist/i });
}

describe('ExposurePage - Full User Flow Tests', () => {
  beforeEach(() => {
    // Reset MSW handlers to default
    server.resetHandlers();
  });

  describe('Adding New Address Flow', () => {
    it('successfully adds a new address and displays it in the grid', async () => {
      const user = userEvent.setup();
      const EXISTING_ADDRESS = '0x1111111111111111111111111111111111111111';
      const NEW_ADDRESS = '0x2222222222222222222222222222222222222222';

      // Start with one address
      setTestAddresses([EXISTING_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [EXISTING_ADDRESS.toLowerCase()]: '1000000000000000000', // 1 ETH
            [NEW_ADDRESS.toLowerCase()]: '2000000000000000000', // 2 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for initial page load
      await waitFor(
        () => {
          expect(screen.getByText(EXISTING_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify only 1 address initially
      expect(getTestAddresses()).toHaveLength(1);

      // Open dialog and add new address
      await openAddAddressDialog(user);
      await user.type(getAddressInput(), NEW_ADDRESS);
      await user.click(getSubmitButton());

      // Dialog should close after successful submission
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify new address was added to store
      expect(getTestAddresses()).toHaveLength(2);
      expect(getTestAddresses()).toContain(NEW_ADDRESS.toLowerCase());

      // Verify new address appears in the UI
      await waitFor(
        () => {
          expect(screen.getByText(NEW_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify both addresses are displayed
      expect(screen.getByText(EXISTING_ADDRESS.toLowerCase())).toBeInTheDocument();
      expect(screen.getByText(NEW_ADDRESS.toLowerCase())).toBeInTheDocument();
    });

    it('successfully adds first address when starting from empty state', async () => {
      const user = userEvent.setup();
      const NEW_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      // Start with empty address list
      setTestAddresses([]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [NEW_ADDRESS.toLowerCase()]: '3000000000000000000', // 3 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load (should show empty state)
      await waitFor(() => {
        expect(screen.getByText(/no addresses monitored/i)).toBeInTheDocument();
      });

      // Verify empty state
      expect(getTestAddresses()).toHaveLength(0);

      // Open dialog and add new address
      await openAddAddressDialog(user);
      await user.type(getAddressInput(), NEW_ADDRESS);
      await user.click(getSubmitButton());

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify address was added to store
      expect(getTestAddresses()).toHaveLength(1);
      expect(getTestAddresses()).toContain(NEW_ADDRESS.toLowerCase());

      // Verify address appears in the UI and empty state is gone
      await waitFor(
        () => {
          expect(screen.getByText(NEW_ADDRESS.toLowerCase())).toBeInTheDocument();
          expect(screen.queryByText(/no addresses monitored/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify balance displays
      await waitFor(
        () => {
          expect(screen.getByText(/3\.000000/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows error when trying to add duplicate address', async () => {
      const user = userEvent.setup();

      // Start with one address already in store
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load (with balance data)
      await waitFor(
        () => {
          expect(screen.getByText(VALID_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Try to add the same address again
      await openAddAddressDialog(user);
      await user.type(getAddressInput(), VALID_ADDRESS);
      await user.click(getSubmitButton());

      // Error message should appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const alert = within(dialog).getByRole('alert');
        expect(alert).toHaveTextContent(/already being monitored/i);
      });

      // Dialog should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Store should still have only one address
      expect(getTestAddresses()).toHaveLength(1);
    });

    it('shows error when adding invalid address and dialog stays open', async () => {
      const user = userEvent.setup();

      // Start with one address to avoid hook ordering issues
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load
      await waitFor(
        () => {
          expect(screen.getByText(VALID_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Try to add invalid address
      await openAddAddressDialog(user);
      const input = getAddressInput();
      await user.type(input, 'invalid-address');
      await user.click(getSubmitButton());

      // Error should appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('alert')).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('cancel button does not add address and closes dialog', async () => {
      const user = userEvent.setup();

      // Start with one address
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load
      await waitFor(
        () => {
          expect(screen.getByText(VALID_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const initialCount = getTestAddresses().length;

      // Open dialog and type a new address
      await openAddAddressDialog(user);
      await user.type(getAddressInput(), '0xabcdef1234567890abcdef1234567890abcdef12');

      // Click cancel
      const dialog = screen.getByRole('dialog');
      const cancelButton = within(dialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Address should NOT be added
      expect(getTestAddresses()).toHaveLength(initialCount);
    });
  });

  describe('Escape Key Behavior', () => {
    it('pressing Escape closes dialog without adding address', async () => {
      const user = userEvent.setup();

      // Start with one address
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      await waitFor(
        () => {
          expect(screen.getByText(VALID_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Open dialog
      await openAddAddressDialog(user);

      // Type something
      await user.type(getAddressInput(), '0xabcdef1234567890abcdef1234567890abcdef12');

      // Press Escape
      await user.keyboard('{Escape}');

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // New address should NOT be added
      expect(getTestAddresses()).not.toContain('0xabcdef1234567890abcdef1234567890abcdef12');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('header layout has responsive classes', async () => {
      // Start with one address to render the full page
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load
      await waitFor(
        () => {
          expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // The header container should have responsive classes
      const header = screen.getByRole('heading', { level: 1 }).parentElement?.parentElement;
      expect(header).toHaveClass('flex', 'flex-col');
      expect(header).toHaveClass('sm:flex-row');
    });
  });

  describe('Balance Display with Existing Addresses', () => {
    it('displays balance for pre-loaded addresses', async () => {
      // Start with addresses already in store
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      // Setup MSW with specific balance - 5 ETH
      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '5000000000000000000', // 5 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for the balance to load and display
      await waitFor(
        () => {
          // Look for balance text (5 ETH formatted)
          expect(screen.getByText(/5\.000000/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows address count badge', async () => {
      // Start with two addresses
      setTestAddresses([
        VALID_ADDRESS.toLowerCase(),
        '0x0000000000000000000000000000000000000001',
      ]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
            '0x0000000000000000000000000000000000000001': '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load
      await waitFor(
        () => {
          expect(screen.getByText(/2 Addresses/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Error Clearing Behavior', () => {
    it('error clears when user starts typing again', async () => {
      const user = userEvent.setup();

      // Start with one address
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [VALID_ADDRESS.toLowerCase()]: '1000000000000000000',
          },
        })
      );

      render(<ExposurePage />);

      // Wait for page to load
      await waitFor(
        () => {
          expect(screen.getByText(VALID_ADDRESS.toLowerCase())).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Open dialog and trigger error
      await openAddAddressDialog(user);
      const input = getAddressInput();
      await user.type(input, 'bad');
      await user.click(getSubmitButton());

      // Error should appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('alert')).toBeInTheDocument();
      });

      // Type more characters - error should clear
      await user.type(input, '0x');

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Remove Address Flow', () => {
    it('removes address when delete button is clicked', async () => {
      const user = userEvent.setup();
      const ADDR1 = '0x1111111111111111111111111111111111111111';
      const ADDR2 = '0x2222222222222222222222222222222222222222';

      // Start with two addresses
      setTestAddresses([ADDR1, ADDR2]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [ADDR1]: '1000000000000000000', // 1 ETH
            [ADDR2]: '2000000000000000000', // 2 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for both addresses to load
      await waitFor(
        () => {
          expect(screen.getByText(ADDR1)).toBeInTheDocument();
          expect(screen.getByText(ADDR2)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify we have 2 addresses
      expect(getTestAddresses()).toHaveLength(2);

      // Click delete on first address
      const deleteButtons = screen.getAllByRole('button', { name: /remove address/i });
      expect(deleteButtons).toHaveLength(2);
      await user.click(deleteButtons[0]);

      // Address should be removed from store
      await waitFor(() => {
        expect(getTestAddresses()).toHaveLength(1);
      });

      // First address should no longer be in the document
      await waitFor(() => {
        expect(screen.queryByText(ADDR1)).not.toBeInTheDocument();
      });

      // Second address should still be visible
      expect(screen.getByText(ADDR2)).toBeInTheDocument();
    });

    it('shows empty state when last address is removed', async () => {
      const user = userEvent.setup();
      const ADDR1 = '0x1111111111111111111111111111111111111111';

      // Start with one address
      setTestAddresses([ADDR1]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [ADDR1]: '1000000000000000000', // 1 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for address to load
      await waitFor(
        () => {
          expect(screen.getByText(ADDR1)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify we have 1 address
      expect(getTestAddresses()).toHaveLength(1);

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /remove address/i });
      await user.click(deleteButton);

      // Address should be removed from store
      await waitFor(() => {
        expect(getTestAddresses()).toHaveLength(0);
      });

      // Empty state should appear
      await waitFor(() => {
        expect(screen.getByText(/no addresses monitored/i)).toBeInTheDocument();
      });
    });

    it('updates address count badge after removing address', async () => {
      const user = userEvent.setup();
      const ADDR1 = '0x1111111111111111111111111111111111111111';
      const ADDR2 = '0x2222222222222222222222222222222222222222';

      // Start with two addresses
      setTestAddresses([ADDR1, ADDR2]);

      server.use(
        mockEtherscanApi({
          price: '2000.00',
          balances: {
            [ADDR1]: '1000000000000000000', // 1 ETH
            [ADDR2]: '2000000000000000000', // 2 ETH
          },
        })
      );

      render(<ExposurePage />);

      // Wait for both addresses to load and verify badge shows 2
      await waitFor(
        () => {
          expect(screen.getByText(/2 Addresses/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Remove first address
      const deleteButtons = screen.getAllByRole('button', { name: /remove address/i });
      await user.click(deleteButtons[0]);

      // Badge should update to show 1 Address
      await waitFor(() => {
        expect(screen.getByText(/1 Addresses/i)).toBeInTheDocument();
      });

      // Verify store was updated
      expect(getTestAddresses()).toHaveLength(1);
    });
  });
});
