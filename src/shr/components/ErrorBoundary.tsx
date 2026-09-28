import { Component, type ReactNode, type ErrorInfo } from 'react';
import ErrorFallback from './ErrorFallback';
import { logError } from '../../cor/logger/logger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: { componentStack?: string }, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string };
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: {} };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // لاگ خطا
    logError({
      type: 'React Error Boundary',
      message: error.message,
      stack: error.stack || '',
      componentStack: errorInfo.componentStack || ''
    });

    // ذخیره در state
    this.setState({
      errorInfo: { componentStack: errorInfo.componentStack || undefined }
    });

    // لاگ در console
    try {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, errorInfo);
    } catch { /* ignore */ }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: {} });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error !== null) {
      // اگر fallback سفارشی داده شده
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleReset);
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}
