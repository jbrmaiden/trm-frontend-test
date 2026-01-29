import React from 'react';
import type { ReactElement } from 'react';
import {
  render,
  renderHook as rtlRenderHook,
  type RenderOptions,
  type RenderHookOptions,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useSanctionedStore } from '@/stores/sanctionedStore';

/**
 * Extended render options with Zustand state configuration
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial addresses to populate in the sanctioned store */
  initialAddresses?: string[];
}

/**
 * Create a new QueryClient for each test to avoid state leakage
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchInterval: false,
      },
    },
  });
};

/**
 * Test wrapper component that provides all necessary context providers
 * Uses useState to keep QueryClient stable across re-renders
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = React.useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that includes providers
 */
const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { initialAddresses, ...renderOptions } = options ?? {};

  // Set initial Zustand state if provided
  if (initialAddresses !== undefined) {
    useSanctionedStore.setState({ addresses: initialAddresses, lastSaved: null });
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

/**
 * For interaction testing, install @testing-library/user-event:
 * npm install -D @testing-library/user-event
 * 
 * Then import and use like:
 * import userEvent from '@testing-library/user-event'
 * const user = userEvent.setup()
 * await user.click(button)
 */ 
 

/**
 * Helper to set addresses in the sanctioned store for testing
 * @param addresses - Array of Ethereum addresses
 */
export function setTestAddresses(addresses: string[]) {
  useSanctionedStore.setState({ addresses, lastSaved: null });
}

/**
 * Helper to clear all addresses in the sanctioned store
 */
export function clearTestAddresses() {
  useSanctionedStore.setState({ addresses: [], lastSaved: null });
}

/**
 * Helper to get current addresses from the store (for assertions)
 */
export function getTestAddresses(): string[] {
  return useSanctionedStore.getState().addresses;
}

/**
 * Custom renderHook function that includes providers
 * @param callback - Hook to render
 * @param options - Optional render hook options
 */
export const customRenderHook = <TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>
) => {
  return rtlRenderHook(callback, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { customRenderHook as renderHook };

// Re-export server for convenience in tests
export { server } from './mocks/server';
export {
  mockPriceSuccess,
  mockPriceError,
  mockBalanceSuccess,
  mockBalanceError,
  mockPriceWithDelay,
  mockBalanceWithDelay,
  mockEtherscanApi,
} from './mocks/handlers'; 