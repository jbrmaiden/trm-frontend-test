import React from 'react';
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
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
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/**
 * Test wrapper component that provides all necessary context providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that includes providers
 */
const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { initialAddresses, ...renderOptions } = options ?? {};

  // Set initial Zustand state if provided
  if (initialAddresses !== undefined) {
    useSanctionedStore.setState({ addresses: initialAddresses });
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
  useSanctionedStore.setState({ addresses });
}

/**
 * Helper to clear all addresses in the sanctioned store
 */
export function clearTestAddresses() {
  useSanctionedStore.setState({ addresses: [] });
}

/**
 * Helper to get current addresses from the store (for assertions)
 */
export function getTestAddresses(): string[] {
  return useSanctionedStore.getState().addresses;
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

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