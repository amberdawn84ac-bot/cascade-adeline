'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            background: '#FFFEF7',
            border: '2px solid #BD6809',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            maxWidth: 600,
            margin: '20px auto',
          }}
        >
          <AlertTriangle
            style={{
              width: 48,
              height: 48,
              color: '#BD6809',
              margin: '0 auto 16px',
            }}
          />
          <h3
            style={{
              color: '#2F4731',
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Adeline is fixing her notes...
          </h3>
          <p
            style={{
              color: '#4B3424',
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Something unexpected happened with this challenge. Please refresh to try again.
          </p>
          <Button
            onClick={this.handleReset}
            style={{
              background: '#BD6809',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Refresh Challenge
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: 20,
                textAlign: 'left',
                background: '#F5F5F0',
                padding: 12,
                borderRadius: 8,
                fontSize: '0.85rem',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Error Details (Dev Only)
              </summary>
              <pre
                style={{
                  marginTop: 8,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: '#BD6809',
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
