import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('inventiq-auth');
      sessionStorage.removeItem('inventiq-auth');
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Something went wrong</h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                The application encountered an unexpected display issue. Your inventory data is safe in the database.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-left text-[11px] font-mono text-red-600 overflow-x-auto border border-gray-100">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 rounded-xl"
              >
                <RefreshCw size={14} />
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 btn-outline text-xs py-2.5 flex items-center justify-center gap-1.5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogIn size={14} />
                Re-login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
