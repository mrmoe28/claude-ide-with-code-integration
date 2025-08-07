'use client'

import { Suspense, ReactNode } from 'react'
import { LoadingSpinner, EditorLoading, TerminalLoading, ChatLoading, FileExplorerLoading } from './LoadingSpinner'

interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  type?: 'editor' | 'terminal' | 'chat' | 'fileexplorer' | 'default'
}

export function SuspenseWrapper({ children, fallback, type = 'default' }: SuspenseWrapperProps) {
  const getFallback = () => {
    if (fallback) return fallback
    
    switch (type) {
      case 'editor':
        return <EditorLoading />
      case 'terminal':
        return <TerminalLoading />
      case 'chat':
        return <ChatLoading />
      case 'fileexplorer':
        return <FileExplorerLoading />
      default:
        return <LoadingSpinner className="h-full" />
    }
  }

  return (
    <Suspense fallback={getFallback()}>
      {children}
    </Suspense>
  )
}

// Specialized Suspense wrappers
export const EditorSuspense = ({ children }: { children: ReactNode }) => (
  <SuspenseWrapper type="editor">{children}</SuspenseWrapper>
)

export const TerminalSuspense = ({ children }: { children: ReactNode }) => (
  <SuspenseWrapper type="terminal">{children}</SuspenseWrapper>
)

export const ChatSuspense = ({ children }: { children: ReactNode }) => (
  <SuspenseWrapper type="chat">{children}</SuspenseWrapper>
)

export const FileExplorerSuspense = ({ children }: { children: ReactNode }) => (
  <SuspenseWrapper type="fileexplorer">{children}</SuspenseWrapper>
)