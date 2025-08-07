'use client'

import { useState, useCallback, useEffect } from 'react'
import '@/types/filesystem'

interface FileSystemNode {
  name: string
  path: string
  type: 'file' | 'dir'
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
  children?: FileSystemNode[]
  expanded?: boolean
}

interface FileContent {
  content: string
  path: string
}

interface FolderTab {
  id: string
  name: string
  handle: FileSystemDirectoryHandle
  path?: string
  fullPath?: string // Full system path for terminal navigation
}

interface RecentFolder {
  name: string
  timestamp: number
}

const MAX_RECENT_FOLDERS = 5

export function useFileSystemEnhanced() {
  const [folderTabs, setFolderTabs] = useState<FolderTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get active folder handle
  const selectedDirectory = activeTabId 
    ? folderTabs.find(tab => tab.id === activeTabId)?.handle || null
    : null
    
  const directoryName = activeTabId 
    ? folderTabs.find(tab => tab.id === activeTabId)?.name || ''
    : ''

  // Load recent folders from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentFolders')
      if (stored) {
        try {
          setRecentFolders(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse recent folders:', e)
        }
      }
    }
  }, [])

  // Save recent folders to localStorage
  const saveRecentFolder = useCallback((name: string) => {
    setRecentFolders(prev => {
      const filtered = prev.filter(f => f.name !== name)
      const updated = [{ name, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_FOLDERS)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentFolders', JSON.stringify(updated))
      }
      
      return updated
    })
  }, [])

  const isFileSystemSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }, [])

  // Helper to get full path from handle (best effort)
  const getFullPath = useCallback(async (handle: FileSystemDirectoryHandle): Promise<string> => {
    try {
      // Try to get the path using various methods
      // Note: Full path access is limited by browser security
      // We'll construct a path based on the folder name and context
      
      // For Desktop folders, we can make educated guesses
      const name = handle.name
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/Users/' + (process.env.USER || 'user')
      
      // Common desktop paths
      if (name.toLowerCase() === 'desktop') {
        return `${homeDir}/Desktop`
      }
      
      // For other folders, try to determine if they're on Desktop
      // This is a best-effort approach
      return `${homeDir}/Desktop/${name}`
    } catch (error) {
      console.warn('Could not determine full path:', error)
      return handle.name
    }
  }, [])

  const selectDirectory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isFileSystemSupported()) {
        throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.')
      }

      if (typeof window === 'undefined') {
        throw new Error('Window is not available')
      }

      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'desktop'
      })

      const fullPath = await getFullPath(dirHandle)
      const tabId = `tab-${Date.now()}`
      const newTab: FolderTab = {
        id: tabId,
        name: dirHandle.name,
        handle: dirHandle,
        fullPath
      }

      setFolderTabs(prev => [...prev, newTab])
      setActiveTabId(tabId)
      saveRecentFolder(dirHandle.name)
      
      return dirHandle
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled the picker
        return null
      }
      const errorMessage = err.message || 'Failed to select directory'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isFileSystemSupported, saveRecentFolder, getFullPath])

  const openDesktopFolder = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isFileSystemSupported()) {
        throw new Error('File System Access API is not supported')
      }

      // Try to open Desktop folder directly
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'desktop' // This hints to start at desktop
      })

      const tabId = `tab-${Date.now()}`
      const newTab: FolderTab = {
        id: tabId,
        name: dirHandle.name,
        handle: dirHandle,
        path: 'Desktop'
      }

      setFolderTabs(prev => [...prev, newTab])
      setActiveTabId(tabId)
      saveRecentFolder(dirHandle.name)
      
      return dirHandle
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null
      }
      setError(err.message || 'Failed to open Desktop folder')
      throw err
    } finally {
      setLoading(false)
    }
  }, [isFileSystemSupported, saveRecentFolder])

  const buildFileTree = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    basePath = ''
  ): Promise<FileSystemNode[]> => {
    const children: FileSystemNode[] = []

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        // Skip hidden files and common build/cache directories
        if (name.startsWith('.') || 
            name === 'node_modules' || 
            name === 'dist' || 
            name === 'build' || 
            name === '.git') {
          continue
        }

        const path = basePath ? `${basePath}/${name}` : name
        
        if (handle.kind === 'directory') {
          children.push({
            name,
            path,
            type: 'dir',
            handle: handle as FileSystemDirectoryHandle,
            children: [], // Will be loaded on demand
            expanded: false
          })
        } else {
          children.push({
            name,
            path,
            type: 'file',
            handle: handle as FileSystemFileHandle
          })
        }
      }
    } catch (err) {
      console.warn('Error reading directory:', err)
    }

    // Sort: directories first, then files, both alphabetically
    return children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [])

  const getDirectoryContents = useCallback(async (
    dirHandle?: FileSystemDirectoryHandle,
    path?: string
  ) => {
    const targetHandle = dirHandle || selectedDirectory
    if (!targetHandle) return []

    if (path) {
      // Navigate to subdirectory
      const pathParts = path.split('/').filter(Boolean)
      let currentHandle = targetHandle
      
      for (const part of pathParts) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part)
        } catch (err) {
          console.error('Failed to navigate to directory:', path, err)
          return []
        }
      }
      
      return buildFileTree(currentHandle, path)
    }

    return buildFileTree(targetHandle)
  }, [selectedDirectory, buildFileTree])

  const readFileContent = useCallback(async (
    fileHandle: FileSystemFileHandle
  ): Promise<FileContent | null> => {
    try {
      const file = await fileHandle.getFile()
      
      // Check file size (limit to 10MB for safety)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is too large to read (max 10MB)')
      }

      const content = await file.text()
      return {
        content,
        path: fileHandle.name
      }
    } catch (err) {
      console.error('Error reading file:', err)
      throw err
    }
  }, [])

  const getFileContent = useCallback(async (path: string): Promise<FileContent | null> => {
    if (!selectedDirectory) return null

    try {
      const pathParts = path.split('/').filter(Boolean)
      let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = selectedDirectory
      
      // Navigate to the file
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i]
        const isLastPart = i === pathParts.length - 1
        
        if (isLastPart) {
          // Get the file handle
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(part)
        } else {
          // Navigate to directory
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(part)
        }
      }

      if (currentHandle.kind === 'file') {
        const result = await readFileContent(currentHandle as FileSystemFileHandle)
        return result ? { ...result, path } : null
      }
      
      return null
    } catch (err) {
      console.error('Error getting file content:', err)
      return null
    }
  }, [selectedDirectory, readFileContent])

  const writeFileContent = useCallback(async (
    path: string, 
    content: string
  ): Promise<boolean> => {
    if (!selectedDirectory) return false

    try {
      const pathParts = path.split('/').filter(Boolean)
      const fileName = pathParts.pop()
      if (!fileName) return false

      let currentHandle = selectedDirectory

      // Navigate to directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part)
      }

      // Get or create file handle
      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      return true
    } catch (err) {
      console.error('Error writing file:', err)
      return false
    }
  }, [selectedDirectory])

  const closeTab = useCallback((tabId: string) => {
    setFolderTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId)
      
      // If closing active tab, switch to another tab
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      } else if (filtered.length === 0) {
        setActiveTabId(null)
      }
      
      return filtered
    })
  }, [activeTabId])

  const clearDirectory = useCallback(() => {
    setFolderTabs([])
    setActiveTabId(null)
    setError(null)
  }, [])

  const clearRecentFolders = useCallback(() => {
    setRecentFolders([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentFolders')
    }
  }, [])

  return {
    // Original API compatibility
    selectedDirectory,
    directoryName,
    loading,
    error,
    isFileSystemSupported: isFileSystemSupported(),
    selectDirectory,
    getDirectoryContents,
    getFileContent,
    writeFileContent,
    clearDirectory,
    
    // Enhanced features
    folderTabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    openDesktopFolder,
    recentFolders,
    clearRecentFolders
  }
}