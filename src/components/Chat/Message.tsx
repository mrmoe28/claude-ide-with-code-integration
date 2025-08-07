'use client'

import { memo, useMemo } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export const Message = memo(function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user'
  
  const formattedTime = useMemo(() => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [timestamp])

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-light-bg-secondary dark:bg-dark-bg-secondary' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser 
          ? 'bg-light-accent-primary dark:bg-dark-accent-primary text-white' 
          : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary'
        }
      `}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            {isUser ? 'You' : 'Claude'}
          </span>
          <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
            {formattedTime}
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-light-text-primary dark:text-dark-text-primary">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }: React.ComponentProps<'code'>) {
                const inline = !className
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''

                if (inline) {
                  return (
                    <code 
                      className="bg-light-bg-tertiary dark:bg-dark-bg-tertiary px-1 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }

                return (
                  <pre className="bg-light-bg-tertiary dark:bg-dark-bg-tertiary p-4 rounded-md overflow-x-auto my-2">
                    <code className="text-sm font-mono">
                      {String(children).replace(/\n$/, '')}
                    </code>
                  </pre>
                )
              },
              pre({ children }) {
                return <div className="my-2">{children}</div>
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
})