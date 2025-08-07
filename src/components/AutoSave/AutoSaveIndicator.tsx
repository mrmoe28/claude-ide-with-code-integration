'use client'

import React from 'react'
import { Save, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface AutoSaveIndicatorProps {
  lastSaved: number | null
  isAutoSaving: boolean
  isDirty: boolean
  onSaveNow?: () => void
  className?: string
  showTimestamp?: boolean
  compact?: boolean
}

export function AutoSaveIndicator({
  lastSaved,
  isAutoSaving,
  isDirty,
  onSaveNow,
  className = '',
  showTimestamp = true,
  compact = false
}: AutoSaveIndicatorProps) {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) { // Less than 1 minute
      return 'just now'
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    } else {
      return new Date(timestamp).toLocaleDateString()
    }
  }

  const getStatus = () => {
    if (isAutoSaving) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-700',
        message: 'Saving...',
        animate: true
      }
    }

    if (isDirty) {
      return {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-700',
        message: 'Unsaved changes',
        animate: false
      }
    }

    if (lastSaved) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-700',
        message: 'Saved',
        animate: false
      }
    }

    return {
      icon: Clock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-600',
      message: 'Not saved',
      animate: false
    }
  }

  const status = getStatus()
  const Icon = status.icon

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Icon 
          className={`w-4 h-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`} 
        />
        {!isAutoSaving && isDirty && onSaveNow && (
          <button
            onClick={onSaveNow}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            title="Save now"
          >
            Save
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.bgColor} ${status.borderColor} ${className}`}>
      <Icon 
        className={`w-4 h-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`} 
      />
      
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${status.color}`}>
          {status.message}
        </span>
        
        {showTimestamp && lastSaved && !isAutoSaving && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimestamp(lastSaved)}
          </span>
        )}
      </div>

      {!isAutoSaving && isDirty && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Save now (Cmd+S)"
        >
          <Save className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// Recovery component for restoring from backups
interface BackupRecoveryProps {
  backups: Array<{
    content: string
    metadata: {
      timestamp: number
      version: number
      filePath?: string
      size: number
    }
  }>
  onRestore: (content: string, backupIndex: number) => void
  onClose: () => void
  className?: string
}

export function BackupRecovery({ 
  backups, 
  onRestore, 
  onClose, 
  className = '' 
}: BackupRecoveryProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (backups.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Backups Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Auto-save will create backups as you work on your files.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Backup Recovery
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a backup to restore. This will replace your current content.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {backups.slice().reverse().map((backup, index) => {
            const actualIndex = backups.length - 1 - index
            return (
              <div 
                key={actualIndex}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Version {backup.metadata.version}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(backup.metadata.timestamp)} • {formatFileSize(backup.metadata.size)}
                  </div>
                </div>
                
                <button
                  onClick={() => onRestore(backup.content, actualIndex)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Restore
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}