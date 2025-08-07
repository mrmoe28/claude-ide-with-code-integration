'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: ''
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Date.now().toString()
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId: Date.now().toString()
    })

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary text-center mb-2">
              Something went wrong
            </h1>
            
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-center mb-6">
              We encountered an unexpected error. Don&apos;t worry, it&apos;s not your fault.
            </p>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  Error Details (Development Only)
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center px-4 py-2 bg-light-accent-primary dark:bg-dark-accent-primary hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus text-white rounded-md transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary hover:bg-light-border-secondary dark:hover:bg-dark-border-secondary text-light-text-primary dark:text-dark-text-primary rounded-md transition-colors duration-200 border border-light-border-primary dark:border-dark-border-primary"
              >
                <Home className="w-4 h-4 mr-2" />
                Reload Page
              </button>
            </div>

            <div className="mt-6 text-xs text-light-text-muted dark:text-dark-text-muted text-center">
              Error ID: {this.state.errorId}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for triggering errors manually (useful for testing)
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}