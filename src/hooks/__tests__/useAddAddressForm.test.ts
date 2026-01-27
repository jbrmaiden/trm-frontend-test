import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook, clearTestAddresses, setTestAddresses, getTestAddresses } from '@/test/test-utils';
import { useAddAddressForm } from '../useAddAddressForm';

const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';
const VALID_ADDRESS_MIXED_CASE = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
const INVALID_ADDRESS_NO_PREFIX = '1234567890123456789012345678901234567890';
const INVALID_ADDRESS_SHORT = '0x12345';
const INVALID_ADDRESS_LONG = '0x12345678901234567890123456789012345678901234567890';
const INVALID_ADDRESS_CHARS = '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG';

// Helper to create a mock form event
const createMockEvent = () => ({ preventDefault: () => {} } as React.FormEvent);

describe('useAddAddressForm', () => {
  beforeEach(() => {
    clearTestAddresses();
  });

  describe('Initial State', () => {
    it('has empty address and no error initially', () => {
      const { result } = renderHook(() => useAddAddressForm());

      expect(result.current.address).toBe('');
      expect(result.current.error).toBeNull();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Validation Tests', () => {
    it('returns error for empty input', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('Enter a valid Ethereum address starting with 0x');
      expect(result.current.isOpen).toBe(true);
    });

    it('returns error for address without 0x prefix', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setAddress(INVALID_ADDRESS_NO_PREFIX);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('Enter a valid Ethereum address starting with 0x');
    });

    it('returns error for address that is too short', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setAddress(INVALID_ADDRESS_SHORT);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('Enter a valid Ethereum address starting with 0x');
    });

    it('returns error for address exceeding 42 characters', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setAddress(INVALID_ADDRESS_LONG);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('Address must be exactly 42 characters');
    });

    it('returns error for address with invalid characters', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setAddress(INVALID_ADDRESS_CHARS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('Enter a valid Ethereum address starting with 0x');
    });

    it('accepts valid Ethereum address (lowercase)', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isOpen).toBe(false);

      // Verify address was added to store (normalized to lowercase)
      const storedAddresses = getTestAddresses();
      expect(storedAddresses).toContain(VALID_ADDRESS.toLowerCase());
    });

    it('accepts valid Ethereum address (mixed case)', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS_MIXED_CASE);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isOpen).toBe(false);

      // Verify address was added to store (normalized to lowercase)
      const storedAddresses = getTestAddresses();
      expect(storedAddresses).toContain(VALID_ADDRESS_MIXED_CASE.toLowerCase());
    });
  });

  describe('Duplicate Detection Tests', () => {
    it('returns error when address already exists in store', async () => {
      setTestAddresses([VALID_ADDRESS.toLowerCase()]);
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('This address is already being monitored');
      expect(result.current.isOpen).toBe(true);
    });

    it('performs case-insensitive duplicate check (0xABC... equals 0xabc...)', async () => {
      setTestAddresses([VALID_ADDRESS_MIXED_CASE.toLowerCase()]);
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS_MIXED_CASE.toUpperCase().replace('0X', '0x'));
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBe('This address is already being monitored');
    });
  });

  describe('Address Normalization Tests', () => {
    it('stores address in lowercase regardless of input case', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS_MIXED_CASE);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      const storedAddresses = getTestAddresses();
      expect(storedAddresses).toContain(VALID_ADDRESS_MIXED_CASE.toLowerCase());
      expect(storedAddresses).not.toContain(VALID_ADDRESS_MIXED_CASE);
    });
  });

  describe('Error Clearing Tests', () => {
    it('clears error when setAddress is called with new value', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      // First, trigger an error
      act(() => {
        result.current.setAddress('invalid');
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).not.toBeNull();

      // Now type a new value - error should clear
      act(() => {
        result.current.setAddress('0x');
      });

      expect(result.current.error).toBeNull();
    });

    it('error does not persist after successful submission', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      // First submit with error
      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress('invalid');
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).not.toBeNull();

      // Fix the address and submit successfully
      act(() => {
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('State Management Tests', () => {
    it('setAddress updates input value and clears any existing error', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      // Set an error first
      act(() => {
        result.current.setAddress('bad');
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).not.toBeNull();

      // Update address - error should clear
      act(() => {
        result.current.setAddress('0x1234');
      });

      expect(result.current.address).toBe('0x1234');
      expect(result.current.error).toBeNull();
    });

    it('handleSubmit calls addAddress with normalized address on valid input', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      const addresses = getTestAddresses();
      expect(addresses).toContain(VALID_ADDRESS.toLowerCase());
    });

    it('handleSubmit sets error and keeps dialog open on invalid input', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress('invalid');
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.isOpen).toBe(true);
    });

    it('handleSubmit closes dialog and resets form on success', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.address).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('handleCancel resets form state and closes dialog', () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress('some-address');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.address).toBe('some-address');

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.address).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('isSubmitting is false after submission completes', async () => {
      const { result } = renderHook(() => useAddAddressForm());

      act(() => {
        result.current.setIsOpen(true);
        result.current.setAddress(VALID_ADDRESS);
      });

      await act(async () => {
        await result.current.handleSubmit(createMockEvent());
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
