import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { useSanctionedStore, getDefaultState, STORAGE_KEY } from '@/stores/sanctionedStore';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Clear localStorage before each test to ensure clean state
beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

// Reset handlers and cleanup after each test
afterEach(() => {
  // Reset MSW handlers to default
  server.resetHandlers();

  // Reset Zustand store to default state (includes lastSaved: null)
  useSanctionedStore.setState(getDefaultState());

  // Clear localStorage to prevent state leakage between tests
  localStorage.removeItem(STORAGE_KEY);

  // Clean up React Testing Library
  cleanup();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
}); 