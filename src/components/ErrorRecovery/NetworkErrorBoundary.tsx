'use client'

import React, { useState, useCallback } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Settings, Clock } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { formatNetworkError, type NetworkError } from '@/lib/network-utils'

interface NetworkErrorBoundaryProps {
  children: React.ReactNode
  error?: NetworkError | null
  onRetry?: () => void
  onConfigure?: () => void
  showNetworkStatus?: boolean
}

export function NetworkErrorBoundary({ 
  children, 
  error, 
  onRetry, 
  onConfigure,
  showNetworkStatus = true 
}: NetworkErrorBoundaryProps) {
  const networkStatus = useNetworkStatus()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return
    
    setIsRetrying(true)
    try {
      await onRetry()
      networkStatus.resetReconnectAttempts()
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, isRetrying, networkStatus])

  const formatOfflineTime = (lastOfflineTime: number | null) => {
    if (!lastOfflineTime) return ''
    
    const duration = Date.now() - lastOfflineTime
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Show network status indicator when online but with slow connection or recent issues
  if (!error && networkStatus.isOnline && showNetworkStatus) {
    if (networkStatus.isSlowConnection || networkStatus.reconnectAttempts > 0) {
      return (
        <>
          {children}
          <div className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
              networkStatus.isSlowConnection 
                ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
                : 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
            }`}>
              <Wifi className="w-4 h-4" />
              <span>
                {networkStatus.isSlowConnection ? 'Slow connection' : 'Connection restored'}
              </span>
            </div>
          </div>
        </>
      )
    }
    
    return <>{children}</>
  }

  // Show offline status
  if (!networkStatus.isOnline && !error) {
    return (
      <>
        {children}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-red-500 text-white px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>
                You&apos;re offline
                {networkStatus.lastOfflineTime && (
                  <span className="ml-2 text-red-200">
                    ({formatOfflineTime(networkStatus.lastOfflineTime)})
                  </span>
                )}
              </span>
              {networkStatus.reconnectAttempts > 0 && (
                <span className="ml-2 text-red-200">
                  • Checking connection...
                </span>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Show error recovery UI
  if (error) {
    const isNetworkRelated = error.isNetworkError || error.isTimeout || !networkStatus.isOnline
    const errorMessage = formatNetworkError(error)

    return (
      <div className="flex items-center justify-center min-h-[200px] p-6">
        <div className="max-w-md w-full text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isNetworkRelated 
              ? 'bg-orange-100 dark:bg-orange-900/20' 
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {isNetworkRelated ? (
              <WifiOff className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {isNetworkRelated ? 'Connection Issue' : 'Request Failed'}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorMessage}
          </p>

          {/* Network Status Info */}
          {isNetworkRelated && (
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  {networkStatus.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span>{networkStatus.isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                {networkStatus.connectionType !== 'unknown' && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">
                      {networkStatus.connectionType.toUpperCase()}
                    </span>
                  </div>
                )}

                {networkStatus.lastOfflineTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatOfflineTime(networkStatus.lastOfflineTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || (!networkStatus.isOnline && isNetworkRelated)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}

            {onConfigure && (error.status === 401 || error.status === 403) && (
              <button
                onClick={onConfigure}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configure Settings
              </button>
            )}
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">
                {JSON.stringify({
                  message: error.message,
                  status: error.status,
                  code: error.code,
                  networkError: error.isNetworkError,
                  timeout: error.isTimeout,
                  serverError: error.isServerError,
                  stack: error.stack?.split('\n').slice(0, 3).join('\n')
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}