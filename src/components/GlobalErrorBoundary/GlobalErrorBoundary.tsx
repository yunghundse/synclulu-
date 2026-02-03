/**
 * GlobalErrorBoundary.tsx
 * 👑 SOVEREIGN DISCOVERY - Crash Prevention System
 *
 * Verhindert, dass die App abstürzt wenn ein API-Call verzögert ist
 * oder eine Komponente einen Fehler wirft.
 *
 * @version 23.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRIES = 3;
const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    console.error('🚨 GlobalErrorBoundary caught error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send to error tracking service
    // logErrorToService(error, errorInfo);
  }

  private handleRetry = (): void => {
    const { retryCount } = this.state;

    if (retryCount < MAX_RETRIES) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  private handleGoHome = (): void => {
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 safe-top safe-bottom">
          {/* Background Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)]" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md"
          >
            {/* Error Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
              {/* Icon */}
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <AlertTriangle size={40} className="text-red-400" />
              </motion.div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Etwas ist schiefgelaufen
              </h1>

              <p className="text-white/60 mb-6">
                Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, deine Daten sind sicher.
              </p>

              {/* Error Details (Collapsible in Production) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-red-400" />
                    <p className="text-red-400 text-sm font-mono">
                      {error.name}
                    </p>
                  </div>
                  <p className="text-red-300/80 text-xs font-mono break-all">
                    {error.message}
                  </p>
                </div>
              )}

              {/* Retry Count */}
              {retryCount > 0 && (
                <p className="text-amber-400/80 text-sm mb-4">
                  Versuch {retryCount} von {MAX_RETRIES}
                </p>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {retryCount < MAX_RETRIES ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleRetry}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Nochmal versuchen
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleReload}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Seite neu laden
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleGoHome}
                  className="w-full p-4 rounded-2xl bg-white/10 text-white/80 font-semibold flex items-center justify-center gap-2"
                >
                  <Home size={20} />
                  Zurück zur Startseite
                </motion.button>
              </div>
            </div>

            {/* Cloud Logo */}
            <div className="mt-8 text-center">
              <span className="text-4xl">☁️</span>
              <p className="text-white/30 text-xs mt-2">Delulu v23.0</p>
            </div>
          </motion.div>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// HOOK FOR FUNCTIONAL COMPONENTS
// ============================================================================

/**
 * useErrorHandler - Hook to manually trigger error boundary
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// ============================================================================
// ASYNC ERROR BOUNDARY WRAPPER
// ============================================================================

interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * AsyncErrorBoundary - Wraps async operations with error handling
 */
export const AsyncErrorBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  loadingFallback,
  errorFallback,
}) => {
  return (
    <GlobalErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={loadingFallback || <LoadingFallback />}>
        {children}
      </React.Suspense>
    </GlobalErrorBoundary>
  );
};

/**
 * Default Loading Fallback
 */
const LoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="text-6xl"
    >
      ☁️
    </motion.div>
  </div>
);

export default GlobalErrorBoundary;
