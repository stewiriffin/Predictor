import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * Prevents the entire app from crashing when a component fails
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-6 m-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-red-400 font-mono">
              SIMULATION ERROR
            </h2>
          </div>

          <p className="text-red-300 text-sm mb-4 font-mono">
            Something went wrong while processing the prediction. This could be due to:
          </p>

          <ul className="list-disc list-inside text-red-300 text-sm space-y-1 mb-4 font-mono">
            <li>Missing or incomplete match data</li>
            <li>API connection issues</li>
            <li>Invalid team statistics</li>
          </ul>

          {this.state.error && (
            <details className="mt-4 p-3 bg-black/30 rounded border border-red-500/30">
              <summary className="text-xs text-red-400 cursor-pointer font-mono">
                Technical Details (Click to expand)
              </summary>
              <pre className="mt-2 text-xs text-red-300 overflow-x-auto font-mono">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-mono border border-red-500/50 transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
