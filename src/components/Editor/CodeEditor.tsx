'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FileIcon } from '@/components/FileExplorer/FileIcon'
import { WelcomeScreen } from '@/components/Welcome/WelcomeScreen'

const Editor = dynamic(
  () => import('@monaco-editor/react'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent-primary dark:border-dark-accent-primary"></div>
      </div>
    )
  }
)

interface CodeEditorProps {
  file?: {
    path: string
    content: string
  }
  onFileChange?: (content: string) => void
  workingDirectory?: string
  onOpenFolder?: () => void
  onNewFile?: () => void
}

export function CodeEditor({ 
  file, 
  onFileChange, 
  workingDirectory, 
  onOpenFolder, 
  onNewFile 
}: CodeEditorProps) {
  const [content, setContent] = useState(file?.content || '')
  const [language, setLanguage] = useState('plaintext')

  // Determine language from file extension
  useEffect(() => {
    if (file?.path) {
      const extension = file.path.split('.').pop()?.toLowerCase()
      const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'rb': 'ruby',
        'sh': 'shell',
        'bash': 'shell',
        'zsh': 'shell',
        'sql': 'sql',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'toml': 'toml',
        'ini': 'ini',
        'conf': 'ini',
        'dockerfile': 'dockerfile'
      }
      setLanguage(languageMap[extension || ''] || 'plaintext')
    }
  }, [file?.path])

  useEffect(() => {
    setContent(file?.content || '')
  }, [file?.content])

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    onFileChange?.(newContent)
  }

  if (!file) {
    return (
      <WelcomeScreen
        workingDirectory={workingDirectory}
        onOpenFolder={onOpenFolder}
        onNewFile={onNewFile}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Tab */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary">
        <FileIcon name={file.path.split('/').pop() || file.path} type="file" />
        <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
          {file.path.split('/').pop()}
        </span>
        <span className="text-xs text-light-text-muted dark:text-dark-text-muted ml-auto">
          {language}
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            selectOnLineNumbers: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            quickSuggestions: true,
            parameterHints: {
              enabled: true
            },
            hover: {
              enabled: true
            },
            contextmenu: true,
            mouseWheelZoom: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true
          }}
          loading={
            <div className="h-full flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent-primary dark:border-dark-accent-primary"></div>
            </div>
          }
        />
      </div>
    </div>
  )
}