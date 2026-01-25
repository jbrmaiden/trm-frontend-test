import { create } from 'zustand';

/**
 * State interface for sanctioned addresses store
 */
export interface SanctionedState {
  addresses: string[];
  addAddress: (address: string) => void;
  removeAddress: (address: string) => void;
}

/**
 * Default sanctioned addresses for initial state
 */
const DEFAULT_ADDRESSES = [
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002',
  '0x0000000000000000000000000000000000000003',
  '0x0000000000000000000000000000000000000004',
  '0x0000000000000000000000000000000000000005',
];

/**
 * Zustand store for managing sanctioned addresses.
 * Extracted to separate file for better testability.
 */
export const useSanctionedStore = create<SanctionedState>((set) => ({
  addresses: DEFAULT_ADDRESSES,
  addAddress: (address: string) =>
    set((state) => ({
      addresses: [...state.addresses, address],
    })),
  removeAddress: (address: string) =>
    set((state) => ({
      addresses: state.addresses.filter((a) => a !== address),
    })),
}));

/**
 * Get the initial/default state for testing purposes
 */
export const getDefaultState = (): Pick<SanctionedState, 'addresses'> => ({
  addresses: DEFAULT_ADDRESSES,
});
