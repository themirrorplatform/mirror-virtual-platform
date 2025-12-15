import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-8">
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-red-500/20">
                <AlertTriangle size={56} className="text-red-400" />
              </div>
            </div>

            {/* Error message */}
            <div className="text-center space-y-4">
              <h2 className="text-red-400 text-2xl">Something broke</h2>
              <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                The Mirror encountered an error. Your reflections are safe—this is just a 
                temporary interface issue.
              </p>
            </div>

            {/* Error details */}
            {this.state.error && (
              <div className="p-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
                <h4 className="text-sm text-[var(--color-text-muted)] mb-3">Error details</h4>
                <code className="text-sm text-red-400 block overflow-x-auto leading-[1.6]">
                  {this.state.error.message}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/30 transition-colors shadow-ambient-sm"
              >
                <RefreshCw size={20} />
                Try again
              </button>

              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)] transition-colors shadow-ambient-sm"
              >
                <Home size={20} />
                Reload Mirror
              </button>
            </div>

            {/* Support note */}
            <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
              <p className="text-sm text-[var(--color-text-muted)] leading-[1.7]">
                If this keeps happening, your local storage might be corrupted. You can 
                export your data from Self → Data before clearing storage.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}