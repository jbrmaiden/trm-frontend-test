import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';
import { useSanctionedStore, getDefaultState } from '@/stores/sanctionedStore';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers and cleanup after each test
afterEach(() => {
  // Reset MSW handlers to default
  server.resetHandlers();

  // Reset Zustand store to default state
  useSanctionedStore.setState(getDefaultState());

  // Clean up React Testing Library
  cleanup();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
}); 