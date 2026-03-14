"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FFFEF7', padding: '2rem',
    }}>
      <div style={{
        maxWidth: 480, width: '100%', background: '#fff',
        border: '2px solid #f59e0b44', borderRadius: 24,
        padding: '2.5rem 2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          <AlertTriangle style={{ color: '#f59e0b', width: 48, height: 48, margin: '0 auto' }} />
        </div>
        <h2 style={{ color: '#2F4731', fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
          Something went wrong
        </h2>
        <p style={{ color: '#4a6155', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {error.message ?? 'An unexpected error occurred loading your dashboard.'}
          {error.digest && (
            <span style={{ display: 'block', opacity: 0.5, fontSize: 11, marginTop: 4 }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2F4731', color: '#fff', border: 'none',
            borderRadius: 12, padding: '10px 24px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </div>
  );
}
