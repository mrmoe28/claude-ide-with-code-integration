'use client'

import { useState, useCallback } from 'react'

// Mock file system data for demo purposes
const mockFiles = [
  { path: 'src/app/page.tsx', content: 'export default function Home() {\n  return <div>Hello World</div>\n}' },
  { path: 'src/app/layout.tsx', content: 'export default function Layout({ children }) {\n  return <html><body>{children}</body></html>\n}' },
  { path: 'package.json', content: '{\n  "name": "my-app",\n  "version": "1.0.0"\n}' },
  { path: 'README.md', content: '# My App\n\nThis is a sample application.' },
  { path: 'src/components/Button.tsx', content: 'export function Button({ children }) {\n  return <button>{children}</button>\n}' }
]

export function useGitHub() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAction = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await action()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getRepositories = useCallback(async () => {
    return executeAction(async () => {
      // Return mock repositories
      await new Promise(resolve => setTimeout(resolve, 500))
      return [
        { id: 1, name: 'sample-project', owner: { login: 'user' }, description: 'A sample project' },
        { id: 2, name: 'my-website', owner: { login: 'user' }, description: 'Personal website' }
      ]
    })
  }, [executeAction])

  const getRepositoryContents = useCallback(async (owner: string, repo: string, path?: string) => {
    return executeAction(async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Return mock file structure
      if (!path || path === '') {
        return [
          { name: 'src', path: 'src', type: 'dir' as const },
          { name: 'package.json', path: 'package.json', type: 'file' as const },
          { name: 'README.md', path: 'README.md', type: 'file' as const }
        ]
      } else if (path === 'src') {
        return [
          { name: 'app', path: 'src/app', type: 'dir' as const },
          { name: 'components', path: 'src/components', type: 'dir' as const }
        ]
      } else if (path === 'src/app') {
        return [
          { name: 'page.tsx', path: 'src/app/page.tsx', type: 'file' as const },
          { name: 'layout.tsx', path: 'src/app/layout.tsx', type: 'file' as const }
        ]
      } else if (path === 'src/components') {
        return [
          { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file' as const }
        ]
      }
      return []
    })
  }, [executeAction])

  const getFileContent = useCallback(async (owner: string, repo: string, path: string) => {
    return executeAction(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const file = mockFiles.find(f => f.path === path)
      if (file) {
        return {
          content: btoa(file.content), // Base64 encode like GitHub API
          sha: 'mock-sha-' + Date.now(),
          path: file.path
        }
      }
      throw new Error('File not found')
    })
  }, [executeAction])

  const updateFile = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string
  ) => {
    return executeAction(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Update mock file
      const fileIndex = mockFiles.findIndex(f => f.path === path)
      if (fileIndex !== -1) {
        mockFiles[fileIndex].content = atob(content) // Decode from base64
      }
      
      return {
        content: { sha: 'new-sha-' + Date.now() },
        commit: { message, sha: 'commit-sha-' + Date.now() }
      }
    })
  }, [executeAction])

  return {
    isAuthenticated: true, // Always authenticated in demo mode
    loading,
    error,
    getRepositories,
    getRepositoryContents,
    getFileContent,
    updateFile,
  }
}