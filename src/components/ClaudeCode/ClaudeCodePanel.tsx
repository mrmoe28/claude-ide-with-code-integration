'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, RotateCcw, Terminal, Code, FileText } from 'lucide-react'

interface ClaudeCodeMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: number
  metadata?: {
    exitCode?: number
    sessionId?: string
    files?: string[]
  }
}

interface ClaudeCodePanelProps {
  workingDirectory?: string
  currentFile?: { path: string; content: string }
  onFileChange?: (path: string, content: string) => void
  className?: string
}

export function ClaudeCodePanel({ 
  workingDirectory, 
  currentFile,
  onFileChange,
  className = '' 
}: ClaudeCodePanelProps) {
  const [messages, setMessages] = useState<ClaudeCodeMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(7)}`)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [eventSource])

  const addMessage = useCallback((message: Omit<ClaudeCodeMessage, 'id'>) => {
    const newMessage: ClaudeCodeMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }, [])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
      timestamp: Date.now()
    })

    try {
      // Close any existing event source
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      // Prepare context
      const context = {
        currentFile: currentFile ? {
          path: currentFile.path,
          content: currentFile.content.substring(0, 10000) // Limit content size
        } : undefined,
        workingDirectory,
        timestamp: Date.now()
      }

      // Send request to Claude Code API
      const response = await fetch('/api/claude-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          workingDirectory: workingDirectory || process.cwd(),
          context
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let currentAssistantMessageId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              switch (data.type) {
                case 'status':
                  addMessage({
                    type: 'system',
                    content: data.message,
                    timestamp: data.timestamp || Date.now(),
                    metadata: { sessionId: data.sessionId }
                  })
                  break

                case 'response':
                  if (!currentAssistantMessageId) {
                    currentAssistantMessageId = addMessage({
                      type: 'assistant',
                      content: data.content,
                      timestamp: data.timestamp || Date.now()
                    })
                  } else {
                    // Append to existing message
                    setMessages(prev => prev.map(msg => 
                      msg.id === currentAssistantMessageId 
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    ))
                  }
                  break

                case 'error':
                  addMessage({
                    type: 'error',
                    content: data.content,
                    timestamp: data.timestamp || Date.now()
                  })
                  break

                case 'completed':
                  addMessage({
                    type: 'system',
                    content: data.message,
                    timestamp: data.timestamp || Date.now(),
                    metadata: { exitCode: data.exitCode }
                  })
                  break

                default:
                  console.log('Unknown Claude Code response type:', data.type)
              }
            } catch (e) {
              console.error('Failed to parse Claude Code response:', e)
            }
          }
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addMessage({
          type: 'system',
          content: 'Request cancelled',
          timestamp: Date.now()
        })
      } else {
        addMessage({
          type: 'error',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
    setIsLoading(false)
  }

  const clearChat = () => {
    setMessages([])
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderMessage = (message: ClaudeCodeMessage) => {
    const getMessageIcon = () => {
      switch (message.type) {
        case 'user':
          return <div className="w-2 h-2 rounded-full bg-blue-500" />
        case 'assistant':
          return <Code className="w-4 h-4 text-green-500" />
        case 'system':
          return <Terminal className="w-4 h-4 text-yellow-500" />
        case 'error':
          return <div className="w-2 h-2 rounded-full bg-red-500" />
        default:
          return <FileText className="w-4 h-4 text-gray-500" />
      }
    }

    const getMessageStyles = () => {
      switch (message.type) {
        case 'user':
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        case 'assistant':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        case 'system':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        case 'error':
          return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        default:
          return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      }
    }

    return (
      <div
        key={message.id}
        className={`p-3 rounded-lg border ${getMessageStyles()} mb-3`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getMessageIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {message.type === 'user' ? 'You' : message.type === 'assistant' ? 'Claude Code' : message.type}
              <span className="ml-2 text-xs">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono text-sm">
              {message.content}
            </div>
            {message.metadata && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {message.metadata.exitCode !== undefined && (
                  <span>Exit code: {message.metadata.exitCode}</span>
                )}
                {message.metadata.sessionId && (
                  <span className="ml-2">Session: {message.metadata.sessionId.substring(0, 8)}...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Claude Code
          </h2>
          {workingDirectory && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {workingDirectory.split('/').pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                     hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {isLoading && (
            <button
              onClick={stopGeneration}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 
                       rounded-md transition-colors duration-200"
              title="Stop generation"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Code className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Welcome to Claude Code!</p>
            <p className="text-sm mt-2">
              Ask me to help with coding tasks, debugging, refactoring, or any development work.
            </p>
            {currentFile && (
              <p className="text-sm mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                Context: {currentFile.path}
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Claude Code is thinking...
                </span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude Code to help with your project..."
            className="flex-1 min-h-[60px] max-h-32 p-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg resize-none bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     dark:focus:ring-blue-400 dark:focus:border-blue-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                     transition-colors duration-200 self-end"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Session: {sessionId.substring(0, 8)}...</span>
        </div>
      </div>
    </div>
  )
}