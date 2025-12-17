
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary component to catch rendering errors in its child component tree.
 */
// Fix: Directly extend Component and provide props/state types to fix 'props' and 'setState' missing errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Initialize state in constructor
    this.state = {
      hasError: false,
      error: undefined
    };
  }

  /**
   * Static method to update state when an error is encountered.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  /**
   * Lifecycle method to log error information.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  /**
   * Resets the error state to allow the app to attempt recovery.
   */
  handleRetry = () => {
    // Fix: setState is correctly inherited from React.Component
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    // Check internal state to determine if fallback UI should be shown
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-gray-800 border border-red-500/30 rounded-lg text-center my-6 shadow-xl max-w-2xl mx-auto">
          <div className="bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">We couldn't render this section due to an unexpected error.</p>
          
          <button
            onClick={this.handleRetry}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors font-medium shadow-sm"
          >
            Try Again
          </button>
          
           {/* Display error details if present in state */}
           {this.state.error && (
            <details className="mt-8 text-left text-xs text-gray-500 border-t border-gray-700 pt-4">
              <summary className="cursor-pointer hover:text-gray-300 font-medium">View Technical Details</summary>
              <pre className="mt-2 p-3 bg-black/50 rounded overflow-auto whitespace-pre-wrap font-mono">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Fix: Access children via this.props which is correctly inherited
    return this.props.children;
  }
}

export default ErrorBoundary;
