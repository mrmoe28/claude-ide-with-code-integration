'use client'

import { useState, useCallback } from 'react'
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

export function useFileSystem() {
  const [selectedDirectory, setSelectedDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [directoryName, setDirectoryName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFileSystemSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
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

      const dirHandle = await (window as any).showDirectoryPicker()

      setSelectedDirectory(dirHandle)
      setDirectoryName(dirHandle.name)
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
  }, [isFileSystemSupported])

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

  const clearDirectory = useCallback(() => {
    setSelectedDirectory(null)
    setDirectoryName('')
    setError(null)
  }, [])

  return {
    selectedDirectory,
    directoryName,
    loading,
    error,
    isFileSystemSupported: isFileSystemSupported(),
    selectDirectory,
    getDirectoryContents,
    getFileContent,
    writeFileContent,
    clearDirectory
  }
}