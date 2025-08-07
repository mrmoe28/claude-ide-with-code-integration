'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileTreeItem } from './FileTreeItem'
import { FileTreeNode } from '@/types/github'
import { useFileSystem } from '@/hooks/useFileSystem'
import { Loader2 } from 'lucide-react'
import '@/types/filesystem'

interface FileTreeProps {
  directoryHandle: FileSystemDirectoryHandle | null
  onFileSelect: (path: string, content: string) => void
  selectedFile?: string
}

interface FileSystemTreeNode extends FileTreeNode {
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
}

export function FileTree({ directoryHandle, onFileSelect, selectedFile }: FileTreeProps) {
  const [treeData, setTreeData] = useState<FileSystemTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const { getDirectoryContents, getFileContent } = useFileSystem()

  const buildFileTree = useCallback(async (
    handle: FileSystemDirectoryHandle, 
    basePath = ''
  ): Promise<FileSystemTreeNode[]> => {
    const children: FileSystemTreeNode[] = []

    try {
      for await (const [name, childHandle] of handle.entries()) {
        // Skip hidden files and common build/cache directories
        if (name.startsWith('.') || 
            name === 'node_modules' || 
            name === 'dist' || 
            name === 'build' || 
            name === '.git') {
          continue
        }

        const path = basePath ? `${basePath}/${name}` : name
        
        children.push({
          name,
          path,
          type: childHandle.kind === 'directory' ? 'dir' : 'file',
          handle: childHandle as FileSystemFileHandle | FileSystemDirectoryHandle,
          children: childHandle.kind === 'directory' ? [] : undefined,
          expanded: false
        })
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

  const updateNodeChildren = (nodes: FileSystemTreeNode[], targetPath: string, children: FileSystemTreeNode[]): FileSystemTreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, children, expanded: true }
      }
      if (node.children) {
        return { ...node, children: updateNodeChildren(node.children, targetPath, children) }
      }
      return node
    })
  }

  const toggleNodeExpansion = (nodes: FileSystemTreeNode[], targetPath: string): FileSystemTreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, expanded: !node.expanded }
      }
      if (node.children) {
        return { ...node, children: toggleNodeExpansion(node.children, targetPath) }
      }
      return node
    })
  }

  const handleToggleExpand = async (path: string) => {
    const node = findNode(treeData, path)
    
    if (node && node.type === 'dir' && node.handle?.kind === 'directory') {
      if (!node.expanded && (!node.children || node.children.length === 0)) {
        // Load children for the first time
        const children = await buildFileTree(node.handle as FileSystemDirectoryHandle, path)
        setTreeData(prev => updateNodeChildren(prev, path, children))
      } else {
        // Just toggle expansion
        setTreeData(prev => toggleNodeExpansion(prev, path))
      }
    }
  }

  const findNode = (nodes: FileSystemTreeNode[], targetPath: string): FileSystemTreeNode | null => {
    for (const node of nodes) {
      if (node.path === targetPath) return node
      if (node.children) {
        const found = findNode(node.children, targetPath)
        if (found) return found
      }
    }
    return null
  }

  const handleFileSelect = async (path: string) => {
    try {
      const node = findNode(treeData, path)
      if (node && node.handle?.kind === 'file') {
        const file = await (node.handle as FileSystemFileHandle).getFile()
        const content = await file.text()
        onFileSelect(path, content)
      }
    } catch (err) {
      console.error('Error reading file:', err)
    }
  }

  useEffect(() => {
    const initializeTree = async () => {
      if (!directoryHandle) return
      
      setLoading(true)
      try {
        const rootContents = await buildFileTree(directoryHandle)
        setTreeData(rootContents)
      } catch (err) {
        console.error('Error initializing file tree:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeTree()
  }, [directoryHandle, buildFileTree])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" size={20} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {treeData.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          level={0}
          onFileSelect={handleFileSelect}
          onToggleExpand={handleToggleExpand}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  )
}