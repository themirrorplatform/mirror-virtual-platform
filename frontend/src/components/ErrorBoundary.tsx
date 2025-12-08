/**
 * ErrorBoundary - React error boundary component
 * Catches JavaScript errors anywhere in the child component tree
 */
import React from "react";

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, info);
    
    // Optional: Send to error tracking service
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="text-6xl">🪞💥</div>
            <h1 className="text-2xl font-semibold">The Mirror Cracked</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Something broke while trying to reflect. This isn't your fault—it's ours.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="block mx-auto text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-zinc-500 cursor-pointer">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-zinc-900 p-3 rounded overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
