'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { ErrorDisplay } from './ErrorDisplay';

type Props = {
  children: React.ReactNode;
};

export function ChatErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorDisplay
          error={error instanceof Error ? error : new Error(String(error))}
          onRetry={resetErrorBoundary}
          onClear={() => {
            resetErrorBoundary();
          }}
        />
      )}
      onError={(error) => {
        console.error('[ChatErrorBoundary]', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
