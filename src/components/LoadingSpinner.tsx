'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  className?: string
  message?: string
}

export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 16, 
  className = '',
  message 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 
          size={size} 
          className="animate-spin text-light-accent-primary dark:text-dark-accent-primary" 
        />
        {message && (
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            {message}
          </span>
        )}
      </div>
    </div>
  )
})

// Specialized loading components
export const EditorLoading = memo(function EditorLoading() {
  return (
    <LoadingSpinner 
      size={32} 
      message="Loading editor..."
      className="h-full"
    />
  )
})

export const TerminalLoading = memo(function TerminalLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-900 text-white">
      <LoadingSpinner 
        size={24} 
        message="Initializing terminal..."
        className="text-white"
      />
    </div>
  )
})

export const ChatLoading = memo(function ChatLoading() {
  return (
    <LoadingSpinner 
      size={20} 
      message="Loading AI assistant..."
      className="h-full"
    />
  )
})

export const FileExplorerLoading = memo(function FileExplorerLoading() {
  return (
    <LoadingSpinner 
      size={18} 
      message="Loading files..."
      className="h-full"
    />
  )
})