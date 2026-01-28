import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * State interface for sanctioned addresses store
 */
export interface SanctionedState {
  addresses: string[];
  lastSaved: number | null;
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
 * localStorage key for persisted state
 */
export const STORAGE_KEY = 'sanctioned-addresses';

/**
 * Zustand store for managing sanctioned addresses.
 * Uses persist middleware to automatically save/load from localStorage.
 */
export const useSanctionedStore = create<SanctionedState>()(
  persist(
    (set) => ({
      addresses: DEFAULT_ADDRESSES,
      lastSaved: null,
      addAddress: (address: string) =>
        set((state) => ({
          addresses: [...state.addresses, address],
          lastSaved: Date.now(),
        })),
      removeAddress: (address: string) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a !== address),
          lastSaved: Date.now(),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    }
  )
);

/**
 * Get the initial/default state for testing purposes
 */
export const getDefaultState = (): Pick<SanctionedState, 'addresses' | 'lastSaved'> => ({
  addresses: DEFAULT_ADDRESSES,
  lastSaved: null,
});
