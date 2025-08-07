'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

export interface AutoSaveConfig {
  enabled: boolean
  interval: number // milliseconds
  debounceTime: number // milliseconds
  maxBackups: number
  storageKey: string
  onSave?: (content: string, metadata: AutoSaveMetadata) => Promise<void>
  onError?: (error: Error) => void
}

export interface AutoSaveMetadata {
  timestamp: number
  version: number
  filePath?: string
  size: number
  checksum?: string
}

export interface AutoSaveState {
  lastSaved: number | null
  isAutoSaving: boolean
  isDirty: boolean
  version: number
  backups: Array<{
    content: string
    metadata: AutoSaveMetadata
  }>
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  debounceTime: 2000, // 2 seconds after last change
  maxBackups: 10,
  storageKey: 'claude_autosave'
}

export function useAutoSave(
  content: string,
  filePath?: string,
  config: Partial<AutoSaveConfig> = {}
) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  
  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    isAutoSaving: false,
    isDirty: false,
    version: 0,
    backups: []
  })

  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const intervalTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastContentRef = useRef<string>(content)
  const lastSavePromiseRef = useRef<Promise<void> | null>(null)

  // Calculate content checksum for change detection
  const calculateChecksum = useCallback((text: string): string => {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }, [])

  // Load existing backups from storage
  const loadBackups = useCallback(() => {
    try {
      const stored = localStorage.getItem(`${finalConfig.storageKey}_${filePath || 'untitled'}`)
      if (stored) {
        const backups = JSON.parse(stored)
        setState(prev => ({ ...prev, backups }))
      }
    } catch (error) {
      console.warn('Failed to load auto-save backups:', error)
    }
  }, [finalConfig.storageKey, filePath])

  // Save backups to storage
  const saveBackups = useCallback((backups: AutoSaveState['backups']) => {
    try {
      localStorage.setItem(
        `${finalConfig.storageKey}_${filePath || 'untitled'}`,
        JSON.stringify(backups.slice(-finalConfig.maxBackups))
      )
    } catch (error) {
      console.warn('Failed to save auto-save backups:', error)
      finalConfig.onError?.(error as Error)
    }
  }, [finalConfig, filePath])

  // Perform auto-save
  const performAutoSave = useCallback(async () => {
    if (!finalConfig.enabled || state.isAutoSaving) {
      return
    }

    const currentContent = lastContentRef.current
    if (!currentContent.trim()) {
      return // Don't save empty content
    }

    setState(prev => ({ ...prev, isAutoSaving: true }))

    try {
      const metadata: AutoSaveMetadata = {
        timestamp: Date.now(),
        version: state.version + 1,
        filePath,
        size: currentContent.length,
        checksum: calculateChecksum(currentContent)
      }

      // Call custom save handler if provided
      if (finalConfig.onSave) {
        await finalConfig.onSave(currentContent, metadata)
      }

      // Create backup
      const backup = {
        content: currentContent,
        metadata
      }

      setState(prev => {
        const newBackups = [...prev.backups, backup].slice(-finalConfig.maxBackups)
        saveBackups(newBackups)
        
        return {
          ...prev,
          lastSaved: Date.now(),
          isDirty: false,
          version: metadata.version,
          backups: newBackups,
          isAutoSaving: false
        }
      })

    } catch (error) {
      console.error('Auto-save failed:', error)
      finalConfig.onError?.(error as Error)
      setState(prev => ({ ...prev, isAutoSaving: false }))
    }
  }, [finalConfig, state.isAutoSaving, state.version, filePath, calculateChecksum, saveBackups])

  // Trigger auto-save after debounce delay
  const triggerAutoSave = useCallback(() => {
    if (!finalConfig.enabled) return

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performAutoSave()
    }, finalConfig.debounceTime)
  }, [finalConfig.enabled, finalConfig.debounceTime, performAutoSave])

  // Manual save function
  const saveNow = useCallback(async () => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Wait for any ongoing save to complete
    if (lastSavePromiseRef.current) {
      await lastSavePromiseRef.current
    }

    // Perform save
    lastSavePromiseRef.current = performAutoSave()
    await lastSavePromiseRef.current
    lastSavePromiseRef.current = null
  }, [performAutoSave])

  // Restore from backup
  const restoreFromBackup = useCallback((backupIndex: number): string | null => {
    if (backupIndex >= 0 && backupIndex < state.backups.length) {
      return state.backups[backupIndex].content
    }
    return null
  }, [state.backups])

  // Clear all backups
  const clearBackups = useCallback(() => {
    try {
      localStorage.removeItem(`${finalConfig.storageKey}_${filePath || 'untitled'}`)
      setState(prev => ({ ...prev, backups: [] }))
    } catch (error) {
      console.warn('Failed to clear backups:', error)
    }
  }, [finalConfig.storageKey, filePath])

  // Detect content changes
  useEffect(() => {
    const hasChanged = content !== lastContentRef.current
    lastContentRef.current = content

    if (hasChanged && finalConfig.enabled) {
      setState(prev => ({ ...prev, isDirty: true }))
      triggerAutoSave()
    }
  }, [content, finalConfig.enabled, triggerAutoSave])

  // Set up periodic auto-save
  useEffect(() => {
    if (!finalConfig.enabled) return

    intervalTimerRef.current = setInterval(() => {
      if (state.isDirty) {
        performAutoSave()
      }
    }, finalConfig.interval)

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [finalConfig.enabled, finalConfig.interval, state.isDirty, performAutoSave])

  // Load backups on mount or when file path changes
  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [])

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isDirty && finalConfig.enabled) {
        // Attempt synchronous save (limited time)
        try {
          performAutoSave()
        } catch (error) {
          console.warn('Failed to auto-save on page unload:', error)
        }
        
        // Show browser warning
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return event.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.isDirty, finalConfig.enabled, performAutoSave])

  return {
    ...state,
    saveNow,
    restoreFromBackup,
    clearBackups,
    config: finalConfig
  }
}