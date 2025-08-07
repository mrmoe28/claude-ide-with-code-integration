'use client'

import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSendMessage, disabled = false, placeholder = "Ask Claude about your code..." }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-light-border-primary dark:border-dark-border-primary">
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          disabled={disabled}
          className="p-2 text-light-text-secondary dark:text-dark-text-secondary 
                   hover:text-light-text-primary dark:hover:text-dark-text-primary
                   hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary
                   rounded-md transition-colors duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip size={18} />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 pr-10
                     bg-light-input dark:bg-dark-input
                     border border-light-border-primary dark:border-dark-border-primary
                     rounded-md resize-none max-h-32
                     text-light-text-primary dark:text-dark-text-primary
                     placeholder-light-text-muted dark:placeholder-dark-text-muted
                     focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '40px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 128) + 'px'
            }}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="absolute right-2 bottom-2 p-1.5
                     text-light-text-muted dark:text-dark-text-muted
                     hover:text-light-accent-primary dark:hover:text-dark-accent-primary
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors duration-150"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-light-text-muted dark:text-dark-text-muted">
        Press <kbd className="px-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-xs">Enter</kbd> to send, 
        <kbd className="px-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-xs ml-1">Shift+Enter</kbd> for new line
      </div>
    </form>
  )
}