import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, clearTestAddresses, getTestAddresses } from '@/test/test-utils';
import { AddAddressDialog } from '../index';

const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';

// Helper to get the trigger button (uses specific aria-label)
function getTriggerButton() {
  return screen.getByRole('button', { name: /add new ethereum address to watchlist/i });
}

// Helper to get the input inside the dialog
function getAddressInput() {
  const dialog = screen.getByRole('dialog');
  return within(dialog).getByRole('textbox');
}

// Helper to get the submit button inside the dialog
function getSubmitButton() {
  const dialog = screen.getByRole('dialog');
  return within(dialog).getByRole('button', { name: /add address to watchlist/i });
}

// Helper to get the cancel button inside the dialog
function getCancelButton() {
  const dialog = screen.getByRole('dialog');
  return within(dialog).getByRole('button', { name: /cancel/i });
}

describe('AddAddressDialog', () => {
  beforeEach(() => {
    clearTestAddresses();
  });

  describe('Rendering Tests', () => {
    it('renders trigger button with correct text', () => {
      render(<AddAddressDialog />);

      const triggerButton = getTriggerButton();
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveTextContent('Add Address');
    });

    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('dialog contains expected elements (title, description, input, buttons)', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        // Title
        expect(within(dialog).getByText('Add New Address')).toBeInTheDocument();
        // Description
        expect(
          within(dialog).getByText(/enter an ethereum address to monitor/i)
        ).toBeInTheDocument();
        // Input
        expect(within(dialog).getByRole('textbox')).toBeInTheDocument();
        // Cancel button
        expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        // Submit button
        expect(
          within(dialog).getByRole('button', { name: /add address to watchlist/i })
        ).toBeInTheDocument();
      });
    });

    it('input receives autoFocus when dialog opens', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        const input = getAddressInput();
        expect(input).toHaveFocus();
      });
    });
  });

  describe('User Interaction Tests', () => {
    it('user can type in the input field', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const input = getAddressInput();
      await user.type(input, '0x123');

      expect(input).toHaveValue('0x123');
    });

    it('cancel button closes dialog and resets form', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      // Open dialog
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type something
      const input = getAddressInput();
      await user.type(input, '0x123');

      // Click cancel
      await user.click(getCancelButton());

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Reopen dialog - form should be reset
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(getAddressInput()).toHaveValue('');
      });
    });

    it('submit with valid address closes dialog and adds to store', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      // Open dialog
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type valid address
      const input = getAddressInput();
      await user.type(input, VALID_ADDRESS);

      // Submit
      await user.click(getSubmitButton());

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Address should be in store (normalized to lowercase)
      const addresses = getTestAddresses();
      expect(addresses).toContain(VALID_ADDRESS.toLowerCase());
    });

    it('submit with invalid address shows error message and keeps dialog open', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      // Open dialog
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type invalid address
      const input = getAddressInput();
      await user.type(input, 'invalid');

      // Submit
      await user.click(getSubmitButton());

      // Error message should appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const alert = within(dialog).getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/enter a valid ethereum address/i);
      });

      // Dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('error clears when user starts typing again', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      // Open dialog
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type invalid address and submit
      const input = getAddressInput();
      await user.type(input, 'bad');
      await user.click(getSubmitButton());

      // Error should appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('alert')).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await user.type(input, '0x');

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
      });
    });

  });

  describe('Accessibility Tests', () => {
    it('escape key closes dialog', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      // Open dialog
      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('input has proper label association', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const input = within(dialog).getByRole('textbox');
        expect(input).toHaveAttribute('id', 'eth-address');
        
        const label = within(dialog).getByText('Ethereum Address');
        expect(label.tagName.toLowerCase()).toBe('label');
        expect(label).toHaveAttribute('for', 'eth-address');
      });
    });

    it('trigger button has aria-label', () => {
      render(<AddAddressDialog />);

      const triggerButton = getTriggerButton();
      expect(triggerButton).toHaveAttribute('aria-label', 'Add new Ethereum address to watchlist');
    });

    it('cancel button has aria-label', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        const cancelButton = getCancelButton();
        expect(cancelButton).toHaveAttribute('aria-label', 'Cancel adding address');
      });
    });

    it('add button has aria-label', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        const addButton = getSubmitButton();
        expect(addButton).toHaveAttribute('aria-label', 'Add address to watchlist');
      });
    });

    it('error message has role="alert" for screen reader announcement', async () => {
      const user = userEvent.setup();
      render(<AddAddressDialog />);

      await user.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type invalid and submit
      const input = getAddressInput();
      await user.type(input, 'bad');
      await user.click(getSubmitButton());

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const alert = within(dialog).getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert.tagName.toLowerCase()).toBe('p');
      });
    });
  });
});
