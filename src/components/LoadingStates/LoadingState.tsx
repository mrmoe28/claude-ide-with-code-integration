'use client'

import React from 'react'
import { RefreshCw, Code, Terminal, MessageSquare, FolderOpen, FileText } from 'lucide-react'

interface LoadingStateProps {
  type?: 'default' | 'code' | 'terminal' | 'chat' | 'files' | 'editor'
  message?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSpinner?: boolean
}

const typeConfig = {
  default: {
    icon: RefreshCw,
    color: 'text-blue-500',
    message: 'Loading...',
    description: 'Please wait while we load your content'
  },
  code: {
    icon: Code,
    color: 'text-green-500',
    message: 'Loading Code Editor...',
    description: 'Preparing your development environment'
  },
  terminal: {
    icon: Terminal,
    color: 'text-purple-500',
    message: 'Initializing Terminal...',
    description: 'Setting up your command line interface'
  },
  chat: {
    icon: MessageSquare,
    color: 'text-orange-500',
    message: 'Connecting to Claude...',
    description: 'Establishing AI assistant connection'
  },
  files: {
    icon: FolderOpen,
    color: 'text-blue-500',
    message: 'Loading File Explorer...',
    description: 'Reading your project structure'
  },
  editor: {
    icon: FileText,
    color: 'text-indigo-500',
    message: 'Opening File...',
    description: 'Loading file content and syntax highlighting'
  }
}

const sizeConfig = {
  sm: {
    iconSize: 'w-6 h-6',
    containerPadding: 'p-4',
    messageSize: 'text-sm',
    descriptionSize: 'text-xs'
  },
  md: {
    iconSize: 'w-8 h-8',
    containerPadding: 'p-6',
    messageSize: 'text-base',
    descriptionSize: 'text-sm'
  },
  lg: {
    iconSize: 'w-12 h-12',
    containerPadding: 'p-8',
    messageSize: 'text-lg',
    descriptionSize: 'text-base'
  }
}

export function LoadingState({ 
  type = 'default',
  message,
  description,
  size = 'md',
  className = '',
  showSpinner = true
}: LoadingStateProps) {
  const config = typeConfig[type]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  const displayMessage = message || config.message
  const displayDescription = description || config.description

  return (
    <div className={`flex flex-col items-center justify-center ${sizeStyles.containerPadding} ${className}`}>
      <div className={`${config.color} ${sizeStyles.iconSize} ${showSpinner ? 'animate-spin' : ''} mb-4`}>
        <Icon className="w-full h-full" />
      </div>
      
      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${sizeStyles.messageSize} mb-2 text-center`}>
        {displayMessage}
      </h3>
      
      {displayDescription && (
        <p className={`text-gray-600 dark:text-gray-400 ${sizeStyles.descriptionSize} text-center max-w-sm`}>
          {displayDescription}
        </p>
      )}
    </div>
  )
}

// Specialized loading states for common scenarios
export const CodeEditorLoading: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingState 
    type="code" 
    size="lg"
    className={className}
    description="Loading Monaco editor and syntax highlighting..."
  />
)

export const TerminalLoading: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingState 
    type="terminal" 
    size="md"
    className={className}
    description="Connecting to terminal session..."
  />
)

export const ChatLoading: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingState 
    type="chat" 
    size="md"
    className={className}
    description="Establishing connection with Claude AI..."
  />
)

export const FileExplorerLoading: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingState 
    type="files" 
    size="md"
    className={className}
    description="Scanning project files and folders..."
  />
)

// Skeleton loaders for specific UI elements
export const SkeletonLoader: React.FC<{ 
  lines?: number
  className?: string 
}> = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <div 
        key={i} 
        className={`bg-gray-200 dark:bg-gray-700 rounded mb-2 ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
        style={{ height: '1rem' }}
      />
    ))}
  </div>
)

export const FileTreeSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`space-y-1 ${className}`}>
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex items-center space-x-2 animate-pulse">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div 
          className="bg-gray-200 dark:bg-gray-700 rounded h-4"
          style={{ width: `${Math.random() * 60 + 40}%` }}
        />
      </div>
    ))}
  </div>
)

export const MessageSkeleton: React.FC<{ 
  isUser?: boolean
  className?: string 
}> = ({ isUser = false, className = '' }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
    <div className={`max-w-xs ${isUser ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3 animate-pulse`}>
      <div className="space-y-2">
        <div className="bg-gray-300 dark:bg-gray-600 rounded h-3 w-full" />
        <div className="bg-gray-300 dark:bg-gray-600 rounded h-3 w-4/5" />
        <div className="bg-gray-300 dark:bg-gray-600 rounded h-3 w-2/3" />
      </div>
    </div>
  </div>
)