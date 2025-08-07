'use client'

import React from 'react'
import { 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Terminal,
  Code,
  Search,
  AlertCircle,
  Plus,
  Upload,
  GitBranch,
  Settings,
  HelpCircle
} from 'lucide-react'

interface EmptyStateProps {
  type?: 'files' | 'editor' | 'chat' | 'terminal' | 'search' | 'error' | 'welcome'
  title?: string
  description?: string
  actions?: Array<{
    label: string
    onClick: () => void
    primary?: boolean
    icon?: React.ComponentType<{ className?: string }>
  }>
  illustration?: React.ReactNode
  className?: string
}

const typeConfig = {
  files: {
    icon: FolderOpen,
    title: 'No Project Open',
    description: 'Open a folder to start exploring your project files and begin development.',
    color: 'text-blue-500'
  },
  editor: {
    icon: FileText,
    title: 'No File Selected',
    description: 'Select a file from the explorer or create a new file to start coding.',
    color: 'text-green-500'
  },
  chat: {
    icon: MessageSquare,
    title: 'Start a Conversation',
    description: 'Ask Claude for help with your code, debugging, or any development questions.',
    color: 'text-orange-500'
  },
  terminal: {
    icon: Terminal,
    title: 'Terminal Ready',
    description: 'Your terminal is ready for commands. Start typing to execute shell commands.',
    color: 'text-purple-500'
  },
  search: {
    icon: Search,
    title: 'No Results Found',
    description: 'Try adjusting your search terms or check your spelling.',
    color: 'text-gray-500'
  },
  error: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    description: 'We encountered an error while loading this content.',
    color: 'text-red-500'
  },
  welcome: {
    icon: Code,
    title: 'Welcome to Claude Code IDE',
    description: 'A modern development environment powered by Claude AI.',
    color: 'text-blue-500'
  }
}

export function EmptyState({ 
  type = 'welcome',
  title,
  description,
  actions = [],
  illustration,
  className = ''
}: EmptyStateProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  const displayTitle = title || config.title
  const displayDescription = description || config.description

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : (
        <div className={`w-16 h-16 ${config.color} mb-6 opacity-60`}>
          <Icon className="w-full h-full" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {displayTitle}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {displayDescription}
      </p>

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {actions.map((action, index) => {
            const ActionIcon = action.icon
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  action.primary 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Specialized empty states for common scenarios
export const NoProjectEmptyState: React.FC<{ 
  onOpenFolder: () => void
  onCreateProject: () => void
  className?: string 
}> = ({ onOpenFolder, onCreateProject, className }) => (
  <EmptyState
    type="files"
    className={className}
    actions={[
      { label: 'Open Folder', onClick: onOpenFolder, primary: true, icon: FolderOpen },
      { label: 'New Project', onClick: onCreateProject, icon: Plus }
    ]}
  />
)

export const NoFileSelectedEmptyState: React.FC<{ 
  onCreateFile: () => void
  onOpenFile: () => void
  className?: string 
}> = ({ onCreateFile, onOpenFile, className }) => (
  <EmptyState
    type="editor"
    className={className}
    actions={[
      { label: 'Create New File', onClick: onCreateFile, primary: true, icon: Plus },
      { label: 'Open File', onClick: onOpenFile, icon: Upload }
    ]}
  />
)

export const EmptyChatState: React.FC<{ 
  onStartChat: () => void
  onShowExamples: () => void
  className?: string 
}> = ({ onStartChat, onShowExamples, className }) => (
  <EmptyState
    type="chat"
    title="Chat with Claude"
    description="Get help with coding, debugging, code reviews, and development best practices."
    className={className}
    actions={[
      { label: 'Start Conversation', onClick: onStartChat, primary: true, icon: MessageSquare },
      { label: 'View Examples', onClick: onShowExamples, icon: HelpCircle }
    ]}
  />
)

export const EmptySearchState: React.FC<{ 
  query: string
  onClearSearch: () => void
  onShowHelp: () => void
  className?: string 
}> = ({ query, onClearSearch, onShowHelp, className }) => (
  <EmptyState
    type="search"
    title="No Results Found"
    description={`No files or content found matching "${query}". Try different search terms or check your filters.`}
    className={className}
    actions={[
      { label: 'Clear Search', onClick: onClearSearch, primary: true, icon: Search },
      { label: 'Search Help', onClick: onShowHelp, icon: HelpCircle }
    ]}
  />
)

export const RepositoryEmptyState: React.FC<{ 
  onConnectRepo: () => void
  onCreateRepo: () => void
  className?: string 
}> = ({ onConnectRepo, onCreateRepo, className }) => (
  <EmptyState
    type="files"
    title="No Repository Connected"
    description="Connect to an existing repository or create a new one to start version control."
    className={className}
    actions={[
      { label: 'Connect Repository', onClick: onConnectRepo, primary: true, icon: GitBranch },
      { label: 'Create New', onClick: onCreateRepo, icon: Plus }
    ]}
  />
)

export const ConfigurationEmptyState: React.FC<{ 
  onConfigure: () => void
  onViewDocs: () => void
  className?: string 
}> = ({ onConfigure, onViewDocs, className }) => (
  <EmptyState
    type="error"
    title="Configuration Required"
    description="This feature requires additional configuration to function properly."
    className={className}
    actions={[
      { label: 'Configure Now', onClick: onConfigure, primary: true, icon: Settings },
      { label: 'View Documentation', onClick: onViewDocs, icon: HelpCircle }
    ]}
  />
)