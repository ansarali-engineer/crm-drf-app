import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Page error:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-base font-semibold text-slate-900 mb-1">Something went wrong</p>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
