'use client'

import React from 'react'
import { 
  FileText, 
  FolderOpen, 
  Clock, 
  Zap,
  Keyboard,
  BookOpen,
  Code,
  Terminal,
  MessageSquare,
  Settings,
  ArrowRight
} from 'lucide-react'

interface WelcomeScreenProps {
  onOpenFolder?: () => void
  onNewFile?: () => void
  recentFiles?: string[]
  workingDirectory?: string
}

export function WelcomeScreen({ 
  onOpenFolder, 
  onNewFile, 
  recentFiles = [], 
  workingDirectory 
}: WelcomeScreenProps) {
  
  const quickActions = [
    {
      icon: FileText,
      title: 'New File',
      description: 'Create a new file',
      shortcut: '⌘N',
      onClick: onNewFile,
      color: 'text-blue-500'
    },
    {
      icon: FolderOpen,
      title: 'Open Folder',
      description: 'Open a project folder',
      shortcut: '⌘O',
      onClick: onOpenFolder,
      color: 'text-green-500'
    },
    {
      icon: Terminal,
      title: 'Terminal',
      description: 'Open terminal panel',
      shortcut: '⌘J',
      onClick: () => {}, // Will be handled by parent
      color: 'text-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Get help from Claude',
      shortcut: '⌘⇧C',
      onClick: () => {}, // Will be handled by parent
      color: 'text-orange-500'
    }
  ]

  const keyboardShortcuts = [
    { key: '⌘B', description: 'Toggle File Explorer' },
    { key: '⌘J', description: 'Toggle Terminal' },
    { key: '⌘⇧C', description: 'Toggle AI Assistant' },
    { key: '⌘S', description: 'Save File' },
    { key: '⌘F', description: 'Find in File' },
    { key: '⌘⇧F', description: 'Find in Files' }
  ]

  return (
    <div className="h-full w-full flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary p-8 overflow-auto">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Code className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Welcome to Claude Code IDE
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
            A modern development environment powered by Claude AI. 
            {workingDirectory ? 
              ` Currently in: ${workingDirectory}` : 
              ' Select a file to start coding or open a folder to explore your project.'
            }
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.onClick}
              className="group bg-light-bg-secondary dark:bg-dark-bg-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start">
                <div className={`p-3 rounded-lg bg-light-bg-primary dark:bg-dark-bg-primary mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                  {action.description}
                </p>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-light-text-muted dark:text-dark-text-muted font-mono bg-light-bg-primary dark:bg-dark-bg-primary px-2 py-1 rounded">
                    {action.shortcut}
                  </span>
                  <ArrowRight className="w-4 h-4 text-light-text-muted dark:text-dark-text-muted group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Files */}
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border-primary dark:border-dark-border-primary rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-blue-500 mr-3" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Recent Files
              </h3>
            </div>
            {recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.slice(0, 5).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary cursor-pointer transition-colors duration-150"
                  >
                    <FileText className="w-4 h-4 text-light-text-muted dark:text-dark-text-muted mr-3" />
                    <span className="text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                      {file}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                No recent files. Start coding to see your file history here.
              </p>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border-primary dark:border-dark-border-primary rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Keyboard className="w-5 h-5 text-purple-500 mr-3" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {shortcut.description}
                  </span>
                  <kbd className="text-xs font-mono bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-muted dark:text-dark-text-muted px-2 py-1 rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border-primary dark:border-dark-border-primary rounded-xl p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-green-500 mr-3" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Getting Started
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Open a project folder
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Browse and edit files in your workspace
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Use the terminal
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Run commands in the integrated terminal
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Ask Claude for help
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Get AI assistance with your code
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-light-border-primary dark:border-dark-border-primary">
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Ready to code? Start by opening a file or folder from the explorer panel.
          </p>
        </div>
      </div>
    </div>
  )
}