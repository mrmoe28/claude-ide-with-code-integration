'use client'

import { useState, useEffect, useCallback } from 'react'

interface EnvironmentConfig {
  OPENAI_API_KEY: string
}

interface UseEnvironmentConfigReturn {
  config: EnvironmentConfig | null
  isConfigured: boolean
  isLoading: boolean
  error: string | null
  updateConfig: (newConfig: EnvironmentConfig) => void
  clearConfig: () => void
  checkServerConfig: () => Promise<boolean>
}

const CONFIG_STORAGE_KEY = 'claude_env_config'

export function useEnvironmentConfig(): UseEnvironmentConfigReturn {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load config from localStorage on mount
  useEffect(() => {
    loadConfigFromStorage()
  }, [])

  const loadConfigFromStorage = () => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig)
        setConfig(parsed)
      }
    } catch (err) {
      console.warn('Failed to load environment config from storage:', err)
      setError('Failed to load saved configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = useCallback((newConfig: EnvironmentConfig) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
      setError(null)
    } catch (err) {
      console.error('Failed to save environment config:', err)
      setError('Failed to save configuration')
    }
  }, [])

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY)
      setConfig(null)
      setError(null)
    } catch (err) {
      console.error('Failed to clear environment config:', err)
      setError('Failed to clear configuration')
    }
  }, [])

  const checkServerConfig = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/environment-check')
      if (response.ok) {
        const data = await response.json()
        return data.configured
      }
      return false
    } catch (err) {
      console.error('Failed to check server config:', err)
      return false
    }
  }, [])

  const isConfigured = !!(config?.OPENAI_API_KEY)

  return {
    config,
    isConfigured,
    isLoading,
    error,
    updateConfig,
    clearConfig,
    checkServerConfig
  }
}