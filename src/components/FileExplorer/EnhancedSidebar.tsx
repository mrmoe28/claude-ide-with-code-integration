'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import { FileTree } from './FileTree'
import { 
  Search, 
  FolderOpen, 
  Folder, 
  AlertCircle, 
  X, 
  Home,
  Clock,
  Plus,
  ChevronRight,
  Upload,
  FolderPlus
} from 'lucide-react'
import { useFileSystemEnhanced } from '@/hooks/useFileSystemEnhanced'

interface EnhancedSidebarProps {
  onFileSelect: (path: string, content: string) => void
  selectedFile?: string
}

export function EnhancedSidebar({ onFileSelect, selectedFile }: EnhancedSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  
  const { 
    selectedDirectory,
    directoryName,
    loading, 
    error, 
    isFileSystemSupported,
    selectDirectory,
    openDesktopFolder,
    clearDirectory,
    folderTabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    recentFolders,
    clearRecentFolders
  } = useFileSystemEnhanced()

  const handleSelectFolder = useCallback(async () => {
    try {
      await selectDirectory()
    } catch (err) {
      // Error is already handled in the hook
    }
  }, [selectDirectory])

  const handleOpenDesktop = async () => {
    try {
      await openDesktopFolder()
    } catch (err) {
      // Error is already handled in the hook
    }
  }

  const handleDoubleClick = () => {
    if (!selectedDirectory) {
      handleSelectFolder()
    }
  }

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    
    if (e.dataTransfer?.items) {
      const hasFolder = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file' && item.webkitGetAsEntry?.()?.isDirectory
      )
      if (hasFolder) {
        setIsDragging(true)
      }
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (!isFileSystemSupported) {
      console.error('File System API not supported')
      return
    }

    // Get the first directory from dropped items
    const items = e.dataTransfer?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry?.()
          if (entry?.isDirectory) {
            // Note: We can't directly open the dropped folder due to security restrictions
            // Instead, we'll prompt the user to select it
            alert('Folder detected! Click "Choose Folder" to select it from the file picker.')
            handleSelectFolder()
            break
          }
        }
      }
    }
  }, [isFileSystemSupported, handleSelectFolder])

  // Breadcrumb navigation
  const getBreadcrumbs = () => {
    if (!directoryName) return []
    
    const parts = directoryName.split('/')
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/')
    }))
  }

  // If no tabs are open, show the folder picker UI
  if (folderTabs.length === 0) {
    return (
      <div 
        className="w-full bg-light-sidebar dark:bg-dark-sidebar h-full flex flex-col"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary">
          <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            File Explorer
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Enhanced with tabs, drag & drop, and quick access
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-3 space-y-2 border-b border-light-border-primary dark:border-dark-border-primary">
          <button
            onClick={handleOpenDesktop}
            className="w-full flex items-center gap-2 px-3 py-2 
                     bg-blue-50 dark:bg-blue-900/20
                     hover:bg-blue-100 dark:hover:bg-blue-900/30
                     border border-blue-200 dark:border-blue-800
                     text-blue-700 dark:text-blue-300
                     text-sm rounded-md transition-colors duration-200"
          >
            <Home size={16} />
            Quick Open Desktop
          </button>
          
          <button
            onClick={handleSelectFolder}
            className="w-full flex items-center gap-2 px-3 py-2 
                     bg-light-accent-primary dark:bg-dark-accent-primary
                     hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus
                     text-white text-sm rounded-md transition-colors duration-200"
          >
            <FolderPlus size={16} />
            Browse for Folder
          </button>
        </div>

        {/* Recent Folders */}
        {recentFolders.length > 0 && (
          <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
                <Clock size={12} />
                Recent Folders
              </h4>
              <button
                onClick={clearRecentFolders}
                className="text-xs text-light-text-muted dark:text-dark-text-muted hover:text-light-text-primary dark:hover:text-dark-text-primary"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {recentFolders.map((folder, index) => (
                <button
                  key={index}
                  onClick={handleSelectFolder}
                  className="w-full text-left px-2 py-1 text-xs
                           hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                           text-light-text-primary dark:text-dark-text-primary
                           rounded transition-colors truncate"
                  title={folder.name}
                >
                  <Folder size={12} className="inline mr-1" />
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content - Drag & Drop Zone */}
        <div 
          className={`flex-1 flex flex-col items-center justify-center p-6 cursor-pointer 
                     transition-all duration-200
                     ${isDragging 
                       ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-600' 
                       : 'hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary'}`}
          onDoubleClick={handleDoubleClick}
        >
          {isDragging ? (
            <>
              <Upload className="mx-auto mb-4 text-blue-500 animate-bounce" size={48} />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Drop folder here to open
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Release to select folder
              </p>
            </>
          ) : (
            <>
              <FolderOpen 
                className="mx-auto mb-4 text-light-text-muted dark:text-dark-text-muted" 
                size={48} 
              />
              
              {!isFileSystemSupported ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="mr-2 text-yellow-500" size={20} />
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Browser Not Supported
                    </p>
                  </div>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-4 max-w-xs">
                    File System Access API is not available. Please use Chrome, Edge, or another Chromium-based browser.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-2">
                    No folder selected
                  </p>
                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted mb-4 max-w-xs">
                    Double-click, drag & drop, or use the buttons above to open a folder
                  </p>
                  
                  {error && (
                    <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Folders are open, show tabs and file tree
  return (
    <div className="w-full bg-light-sidebar dark:bg-dark-sidebar h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-light-border-primary dark:border-dark-border-primary">
        {/* Tab Bar */}
        <div className="flex items-center bg-light-bg-secondary dark:bg-dark-bg-secondary">
          <div className="flex-1 flex items-center min-w-0 overflow-x-auto">
            {folderTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center min-w-0 border-r border-light-border-primary dark:border-dark-border-primary
                         ${activeTabId === tab.id 
                           ? 'bg-light-sidebar dark:bg-dark-sidebar' 
                           : 'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary'}`}
              >
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-xs truncate max-w-[150px]
                           ${activeTabId === tab.id 
                             ? 'text-light-text-primary dark:text-dark-text-primary font-medium' 
                             : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                  title={tab.name}
                >
                  <Folder size={12} />
                  {tab.name}
                </button>
                <button
                  onClick={() => closeTab(tab.id)}
                  className="p-1 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary
                           text-light-text-muted dark:text-dark-text-muted 
                           hover:text-light-text-primary dark:hover:text-dark-text-primary"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add Tab Button */}
          <button
            onClick={handleSelectFolder}
            className="p-2 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary
                     text-light-text-muted dark:text-dark-text-muted"
            title="Open new folder"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Breadcrumb Path */}
        {activeTabId && directoryName && (
          <div className="px-3 py-1 flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary
                        bg-light-bg-primary dark:bg-dark-bg-primary border-t border-light-border-primary dark:border-dark-border-primary">
            <Home size={10} />
            {getBreadcrumbs().map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                <ChevronRight size={10} />
                <span className="hover:text-light-text-primary dark:hover:text-dark-text-primary cursor-pointer">
                  {crumb.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-2 border-b border-light-border-primary dark:border-dark-border-primary">
        <div className="relative">
          <Search 
            size={14} 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-light-text-muted dark:text-dark-text-muted" 
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs 
                     bg-light-input dark:bg-dark-input
                     border border-light-border-primary dark:border-dark-border-primary
                     rounded text-light-text-primary dark:text-dark-text-primary
                     placeholder-light-text-muted dark:placeholder-dark-text-muted
                     focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-hidden">
        {selectedDirectory && (
          <FileTree
            directoryHandle={selectedDirectory}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        )}
      </div>
    </div>
  )
}