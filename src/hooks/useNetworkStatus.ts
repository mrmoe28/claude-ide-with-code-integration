'use client'

import { useState, useEffect, useCallback } from 'react'
import { isOnline, getConnectionType } from '@/lib/network-utils'

interface NetworkStatus {
  isOnline: boolean
  connectionType: string
  isSlowConnection: boolean
  lastOfflineTime: number | null
  reconnectAttempts: number
}

interface UseNetworkStatusReturn extends NetworkStatus {
  refresh: () => void
  resetReconnectAttempts: () => void
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'unknown',
    isSlowConnection: false,
    lastOfflineTime: null,
    reconnectAttempts: 0
  })

  const updateNetworkStatus = useCallback(() => {
    const online = isOnline()
    const connectionType = getConnectionType()
    const isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g'

    setStatus(prev => ({
      ...prev,
      isOnline: online,
      connectionType,
      isSlowConnection,
      lastOfflineTime: online ? null : (prev.lastOfflineTime || Date.now()),
      reconnectAttempts: online ? 0 : prev.reconnectAttempts
    }))
  }, [])

  const handleOnline = useCallback(() => {
    console.log('Network: Back online')
    updateNetworkStatus()
  }, [updateNetworkStatus])

  const handleOffline = useCallback(() => {
    console.log('Network: Gone offline')
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      lastOfflineTime: Date.now(),
      reconnectAttempts: prev.reconnectAttempts + 1
    }))
  }, [])

  const resetReconnectAttempts = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      reconnectAttempts: 0
    }))
  }, [])

  const refresh = useCallback(() => {
    updateNetworkStatus()
  }, [updateNetworkStatus])

  useEffect(() => {
    // Initial check
    updateNetworkStatus()

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection periodically when offline
    const intervalId = setInterval(() => {
      if (!status.isOnline) {
        updateNetworkStatus()
      }
    }, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [handleOnline, handleOffline, updateNetworkStatus, status.isOnline])

  return {
    ...status,
    refresh,
    resetReconnectAttempts
  }
}