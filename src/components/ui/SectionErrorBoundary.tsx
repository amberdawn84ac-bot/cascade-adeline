"use client";

import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function Fallback({ error, resetErrorBoundary, label }: { error: unknown; resetErrorBoundary: () => void; label?: string }) {
  const message = error instanceof Error ? error.message : 'Something went wrong loading this section.';
  return (
    <div style={{
      background: '#FFF8F0', border: '1px solid #f59e0b33',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontSize: 12, fontWeight: 700 }}>
        <AlertTriangle size={13} />
        {label ?? 'Widget'} unavailable
      </div>
      <p style={{ color: '#92400e', opacity: 0.7, fontSize: 11, margin: 0 }}>
        {message}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: '1px solid #f59e0b66',
          borderRadius: 8, padding: '5px 10px',
          color: '#92400e', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  label?: string;
}

export function SectionErrorBoundary({ children, label }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <Fallback error={error} resetErrorBoundary={resetErrorBoundary} label={label} />
      )}
      onError={(error) => console.error(`[ErrorBoundary:${label}]`, error)}
    >
      {children}
    </ErrorBoundary>
  );
}
