import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--momento-bg)] flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-md w-full space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-2xl">
              !
            </div>
            <h1 className="text-xl font-bold text-white">Something went wrong.</h1>
            <p className="text-sm text-gray-400 break-words">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[var(--momento-accent)] text-white rounded-xl font-medium hover:bg-[var(--momento-accent-hover)] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
