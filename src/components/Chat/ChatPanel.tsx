'use client'

import { useState, useRef, useEffect, memo, useMemo } from 'react'
import { Message } from './Message'
import { ChatInput } from './ChatInput'
import { useOpenAI } from '@/hooks/useOpenAI'
import { MessageSquare, Loader2, Settings, Trash2 } from 'lucide-react'

interface ChatPanelProps {
  currentFile?: {
    path: string
    content: string
  }
  workingDirectory?: string
}

export const ChatPanel = memo(function ChatPanel({ currentFile, workingDirectory }: ChatPanelProps) {
  const { messages, isLoading, sendMessage, clearHistory } = useOpenAI()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = useMemo(() => async (content: string) => {
    // Build context from current file and working directory
    let contextualMessage = content
    
    if (currentFile) {
      contextualMessage = `File: ${currentFile.path}
\`\`\`${getLanguageFromPath(currentFile.path)}
${currentFile.content}
\`\`\`

${content}`
    }

    if (workingDirectory && !currentFile) {
      contextualMessage = `Working directory: ${workingDirectory}

${content}`
    }

    await sendMessage(contextualMessage)
  }, [currentFile, workingDirectory, sendMessage])

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'zsh'
    }
    return langMap[ext || ''] || 'text'
  }

  return (
    <div className="h-full flex flex-col bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                AI Assistant Settings
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-light-text-muted dark:text-dark-text-muted hover:text-light-text-primary dark:hover:text-dark-text-primary"
              >
                Done
              </button>
            </div>
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 
                '✅ API Key configured' : 
                '❌ Set AI_API_KEY in environment'
              }
            </div>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 size={12} />
              Clear conversation
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-light-border-primary dark:border-dark-border-primary">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-light-accent-primary dark:text-dark-accent-primary" />
          <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            AI Assistant
          </span>
          {isLoading && (
            <Loader2 size={12} className="animate-spin text-light-text-muted dark:text-dark-text-muted" />
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 rounded hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
        >
          <Settings size={14} className="text-light-text-muted dark:text-dark-text-muted" />
        </button>
      </div>

      {/* Context Info */}
      {(currentFile || workingDirectory) && (
        <div className="p-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
          <div className="text-xs text-light-text-muted dark:text-dark-text-muted">
            Context: {currentFile ? (
              <span className="font-mono">{currentFile.path}</span>
            ) : workingDirectory ? (
              <span className="font-mono">{workingDirectory}</span>
            ) : 'None'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-xs">
              <MessageSquare className="mx-auto mb-3 text-light-text-muted dark:text-dark-text-muted" size={32} />
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                AI Assistant Ready
              </h3>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">
                Ask questions about your code, get suggestions, or request help with debugging.
              </p>
              {!process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Configure AI API key to get started
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-light-border-primary dark:border-dark-border-primary">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading || !process.env.NEXT_PUBLIC_OPENAI_API_KEY}
          placeholder={
            !process.env.NEXT_PUBLIC_OPENAI_API_KEY 
              ? "Configure AI API key to chat..." 
              : "Ask about your code..."
          }
        />
      </div>
    </div>
  )
})