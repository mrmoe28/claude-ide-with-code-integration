'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFileSystem } from '@/hooks/useFileSystem'
import { Header } from './Header'
import { WindowManager } from './WindowManager'

export function MainLayout() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { directoryName } = useFileSystem()
  const [currentFile, setCurrentFile] = useState<{ path: string; content: string } | undefined>()
  
  // Window management state
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [claudeCodeMode, setClaudeCodeMode] = useState(false)
  const [terminalType, setTerminalType] = useState<'mac' | 'webcontainer'>('mac')

  const handleFileSelect = (path: string, content: string) => {
    // Decode base64 content if it's encoded (from old GitHub API format)
    let decodedContent = content
    try {
      // Try to decode as base64, if it fails, assume it's plain text
      decodedContent = atob(content)
    } catch {
      // Content is already plain text
      decodedContent = content
    }
    
    setCurrentFile({ path, content: decodedContent })
  }

  // Keyboard shortcuts for window toggles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Mac (metaKey) or Windows/Linux (ctrlKey)
      const isModifierPressed = event.metaKey || event.ctrlKey

      if (!isModifierPressed) return

      switch (event.code) {
        case 'KeyB':
          // Cmd/Ctrl + B: Toggle File Explorer
          event.preventDefault()
          setShowSidebar(prev => !prev)
          break
        case 'KeyJ':
          // Cmd/Ctrl + J: Toggle Terminal
          event.preventDefault()
          setShowTerminal(prev => !prev)
          break
        case 'KeyC':
          // Cmd/Ctrl + Shift + C: Toggle Chat
          if (event.shiftKey) {
            event.preventDefault()
            setShowChat(prev => !prev)
          }
          break
        case 'KeyK':
          // Cmd/Ctrl + K: Toggle Claude Code Mode
          event.preventDefault()
          setClaudeCodeMode(prev => !prev)
          // Auto-show chat panel if hidden when switching to Claude Code
          if (!claudeCodeMode && !showChat) {
            setShowChat(true)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [claudeCodeMode, showChat])

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent-primary dark:border-dark-accent-primary mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Welcome to Claude Code IDE
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Please sign in to get started
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 
                     bg-light-accent-primary dark:bg-dark-accent-primary
                     hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus
                     text-white rounded-md transition-colors duration-200"
          >
            Sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-light-bg-primary dark:bg-dark-bg-primary overflow-hidden">
      <Header 
        showSidebar={showSidebar}
        showTerminal={showTerminal}
        showChat={showChat}
        claudeCodeMode={claudeCodeMode}
        terminalType={terminalType}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onToggleChat={() => setShowChat(!showChat)}
      />
      <div className="flex-1 w-full overflow-hidden">
        <WindowManager 
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
          workingDirectory={directoryName}
          showSidebar={showSidebar}
          showTerminal={showTerminal}
          showChat={showChat}
          claudeCodeMode={claudeCodeMode}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          onToggleChat={() => setShowChat(!showChat)}
          onToggleClaudeCodeMode={() => setClaudeCodeMode(!claudeCodeMode)}
        />
      </div>
    </div>
  )
}