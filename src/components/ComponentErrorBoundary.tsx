'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ErrorBoundary } from './ErrorBoundary'

interface ComponentErrorBoundaryProps {
  children: React.ReactNode
  componentName: string
  fallbackMessage?: string
}

export function ComponentErrorBoundary({
  children,
  componentName,
  fallbackMessage
}: ComponentErrorBoundaryProps) {
  const handleRetry = () => {
    window.location.reload()
  }

  const fallback = (
    <div className="flex flex-col items-center justify-center p-6 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg border border-light-border-primary dark:border-dark-border-primary">
      <AlertCircle className="w-8 h-8 text-orange-500 mb-3" />
      <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
        {componentName} Error
      </h3>
      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center mb-4 max-w-sm">
        {fallbackMessage || `The ${componentName} component encountered an error. Please try refreshing the page.`}
      </p>
      <button
        onClick={handleRetry}
        className="flex items-center px-3 py-2 bg-light-accent-primary dark:bg-dark-accent-primary hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus text-white rounded-md transition-colors duration-200 text-sm"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  )

  return (
    <ErrorBoundary 
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName}:`, error, errorInfo)
        // In production, log to error reporting service
        // logComponentError(componentName, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Specialized error boundaries for different component types
export const EditorErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComponentErrorBoundary
    componentName="Code Editor"
    fallbackMessage="The code editor encountered an error. Your work is safe, but you may need to refresh to continue editing."
  >
    {children}
  </ComponentErrorBoundary>
)

export const TerminalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComponentErrorBoundary
    componentName="Terminal"
    fallbackMessage="The terminal encountered an initialization error. This may be due to browser compatibility or timing issues. Please refresh the page to retry."
  >
    {children}
  </ComponentErrorBoundary>
)

export const ChatErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComponentErrorBoundary
    componentName="AI Chat"
    fallbackMessage="The AI chat encountered an error. Please check your API configuration and try again."
  >
    {children}
  </ComponentErrorBoundary>
)

export const FileExplorerErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComponentErrorBoundary
    componentName="File Explorer"
    fallbackMessage="The file explorer encountered an error. You can try refreshing to restore file navigation."
  >
    {children}
  </ComponentErrorBoundary>
)