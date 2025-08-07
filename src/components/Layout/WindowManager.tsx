'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { EnhancedSidebar } from '@/components/FileExplorer/EnhancedSidebar'
import { CodeEditor } from '@/components/Editor/CodeEditor'
import { ChatPanel } from '@/components/Chat/ChatPanel'
import { ClaudeCodePanel } from '@/components/ClaudeCode/ClaudeCodePanel'
import { TerminalIcon, MessageSquare, X, Minimize2, Square, Code, Bot } from 'lucide-react'
import { 
  EditorErrorBoundary,
  TerminalErrorBoundary,
  ChatErrorBoundary,
  FileExplorerErrorBoundary
} from '@/components/ComponentErrorBoundary'
import {
  EditorSuspense,
  TerminalSuspense,
  ChatSuspense,
  FileExplorerSuspense
} from '@/components/SuspenseWrapper'

const UnifiedTerminal = dynamic(
  () => import('@/components/Terminal/UnifiedTerminal').then(mod => ({ default: mod.UnifiedTerminal })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    )
  }
)

interface WindowManagerProps {
  currentFile?: {
    path: string
    content: string
  }
  onFileSelect: (path: string, content: string) => void
  workingDirectory?: string
  showSidebar?: boolean
  showTerminal?: boolean
  showChat?: boolean
  claudeCodeMode?: boolean
  onToggleSidebar?: () => void
  onToggleTerminal?: () => void
  onToggleChat?: () => void
  onToggleClaudeCodeMode?: () => void
}

export function WindowManager({ 
  currentFile, 
  onFileSelect, 
  workingDirectory,
  showSidebar: propShowSidebar,
  showTerminal: propShowTerminal,
  showChat: propShowChat,
  claudeCodeMode: propClaudeCodeMode,
  onToggleSidebar,
  onToggleTerminal,
  onToggleChat,
  onToggleClaudeCodeMode
}: WindowManagerProps) {
  // Use props if provided, otherwise use internal state
  const [internalShowSidebar, setInternalShowSidebar] = useState(true)
  const [internalShowTerminal, setInternalShowTerminal] = useState(false)
  const [internalShowChat, setInternalShowChat] = useState(true)
  const [internalClaudeCodeMode, setInternalClaudeCodeMode] = useState(false)
  
  const showSidebar = propShowSidebar !== undefined ? propShowSidebar : internalShowSidebar
  const showTerminal = propShowTerminal !== undefined ? propShowTerminal : internalShowTerminal
  const showChat = propShowChat !== undefined ? propShowChat : internalShowChat
  const claudeCodeMode = propClaudeCodeMode !== undefined ? propClaudeCodeMode : internalClaudeCodeMode
  
  const [terminalMinimized, setTerminalMinimized] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)

  const toggleSidebar = onToggleSidebar || (() => setInternalShowSidebar(!showSidebar))
  const toggleTerminal = onToggleTerminal || (() => setInternalShowTerminal(!showTerminal))
  const toggleChat = onToggleChat || (() => setInternalShowChat(!showChat))
  const toggleClaudeCodeMode = onToggleClaudeCodeMode || (() => setInternalClaudeCodeMode(!claudeCodeMode))

  // Calculate center panel size based on visible panels and content state
  const getCenterPanelSize = () => {
    const hasFile = !!currentFile
    
    if (!showSidebar && !showChat) return 100
    if (!showSidebar) return hasFile ? 75 : 70
    if (!showChat) return hasFile ? 80 : 75
    
    // When no file is selected, give more space to side panels for better balance
    return hasFile ? 60 : 50
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Main Content Area */}
      <PanelGroup direction="horizontal" className="flex-1 w-full">
        {/* Left Panel - File Explorer */}
        {showSidebar && (
          <>
            <Panel defaultSize={15} minSize={10} maxSize={30}>
              <div className="h-full border-r border-light-border-primary dark:border-dark-border-primary">
                <div className="flex items-center justify-between p-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
                  <h3 className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                    EXPLORER
                  </h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={toggleSidebar}
                      className="p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                      title="Hide Sidebar"
                    >
                      <X size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                    </button>
                  </div>
                </div>
                <FileExplorerErrorBoundary>
                  <FileExplorerSuspense>
                    <EnhancedSidebar
                      onFileSelect={onFileSelect}
                      selectedFile={currentFile?.path}
                    />
                  </FileExplorerSuspense>
                </FileExplorerErrorBoundary>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-light-border-primary dark:bg-dark-border-primary hover:bg-blue-500 transition-colors" />
          </>
        )}

        {/* Center Panel - Code Editor */}
        <Panel defaultSize={getCenterPanelSize()} minSize={30}>
          <div className="h-full">
            <div className="flex items-center justify-between p-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                  {currentFile?.path || 'No file selected'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleTerminal}
                  className={`p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary ${
                    showTerminal ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                  title="Toggle Terminal"
                >
                  <TerminalIcon size={14} className="text-light-text-muted dark:text-dark-text-muted" />
                </button>
                <button 
                  onClick={toggleChat}
                  className={`p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary ${
                    showChat ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                  title="Toggle Chat"
                >
                  <MessageSquare size={14} className="text-light-text-muted dark:text-dark-text-muted" />
                </button>
              </div>
            </div>
            
            {showTerminal ? (
              <PanelGroup direction="vertical">
                <Panel defaultSize={terminalMinimized ? 90 : 65} minSize={30}>
                  <EditorErrorBoundary>
                    <CodeEditor 
                      file={currentFile}
                      workingDirectory={workingDirectory}
                      onFileChange={(content) => {
                        if (currentFile) {
                          onFileSelect(currentFile.path, content)
                        }
                      }}
                    />
                  </EditorErrorBoundary>
                </Panel>
                
                <PanelResizeHandle className="h-1 bg-light-border-primary dark:bg-dark-border-primary hover:bg-blue-500 transition-colors" />
                
                <Panel defaultSize={terminalMinimized ? 10 : 35} minSize={10}>
                  <div className="h-full">
                    <div className="flex items-center justify-between p-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                          TERMINAL
                        </h3>
                        <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                          Auto-detected
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setTerminalMinimized(!terminalMinimized)}
                          className="p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                        >
                          {terminalMinimized ? (
                            <Square size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                          ) : (
                            <Minimize2 size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                          )}
                        </button>
                        <button 
                          onClick={toggleTerminal}
                          className="p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                        >
                          <X size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                        </button>
                      </div>
                    </div>
                    {!terminalMinimized && (
                      <TerminalErrorBoundary>
                        <UnifiedTerminal workingDirectory={workingDirectory} />
                      </TerminalErrorBoundary>
                    )}
                  </div>
                </Panel>
              </PanelGroup>
            ) : (
              <EditorErrorBoundary>
                <CodeEditor 
                  file={currentFile}
                  workingDirectory={workingDirectory}
                  onFileChange={(content) => {
                    if (currentFile) {
                      onFileSelect(currentFile.path, content)
                    }
                  }}
                />
              </EditorErrorBoundary>
            )}
          </div>
        </Panel>

        {/* Right Panel - Chat */}
        {showChat && (
          <>
            <PanelResizeHandle className="w-1 bg-light-border-primary dark:bg-dark-border-primary hover:bg-blue-500 transition-colors" />
            <Panel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full border-l border-light-border-primary dark:border-dark-border-primary">
                <div className="flex items-center justify-between p-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                      {claudeCodeMode ? 'CLAUDE CODE' : 'AI ASSISTANT'}
                    </h3>
                    <button
                      onClick={toggleClaudeCodeMode}
                      className={`p-1 rounded text-xs transition-colors ${
                        claudeCodeMode 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-muted dark:text-dark-text-muted'
                      }`}
                      title={claudeCodeMode ? 'Switch to Chat Mode (⌘K)' : 'Switch to Claude Code Mode (⌘K)'}
                    >
                      {claudeCodeMode ? <Code size={12} /> : <Bot size={12} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setChatMinimized(!chatMinimized)}
                      className="p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                    >
                      {chatMinimized ? (
                        <Square size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                      ) : (
                        <Minimize2 size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                      )}
                    </button>
                    <button 
                      onClick={toggleChat}
                      className="p-1 rounded hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                    >
                      <X size={12} className="text-light-text-muted dark:text-dark-text-muted" />
                    </button>
                  </div>
                </div>
                {!chatMinimized && (
                  <ChatErrorBoundary>
                    {claudeCodeMode ? (
                      <ClaudeCodePanel 
                        currentFile={currentFile}
                        workingDirectory={workingDirectory}
                        onFileChange={(path, content) => onFileSelect(path, content)}
                      />
                    ) : (
                      <ChatPanel 
                        currentFile={currentFile}
                        workingDirectory={workingDirectory}
                      />
                    )}
                  </ChatErrorBoundary>
                )}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  )
}