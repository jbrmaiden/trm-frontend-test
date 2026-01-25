import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { appConfig, isDevelopment } from '@/config/env';
import App from './App';
import './index.css';

// Initialize React Query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.refreshInterval,
      retry: appConfig.retryAttempts,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error handler for ErrorBoundary
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  if (isDevelopment) {
    console.error('Application Error:', error, errorInfo);
  }
  // In production, you would send this to your error reporting service
  // trackError(error, errorInfo);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);