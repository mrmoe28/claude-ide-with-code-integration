'use client'

import { useState } from 'react'
import { FileTree } from './FileTree'
import { Search, FolderOpen, Folder, AlertCircle, X } from 'lucide-react'
import { useFileSystem } from '@/hooks/useFileSystem'

interface SidebarProps {
  currentRepo?: {
    owner: string
    name: string
  }
  onFileSelect: (path: string, content: string) => void
  selectedFile?: string
}

export function Sidebar({ currentRepo, onFileSelect, selectedFile }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { 
    selectedDirectory, 
    directoryName, 
    loading, 
    error, 
    isFileSystemSupported,
    selectDirectory,
    clearDirectory 
  } = useFileSystem()

  const handleSelectFolder = async () => {
    try {
      await selectDirectory()
    } catch (err) {
      // Error is already handled in the hook
    }
  }

  const handleDoubleClick = () => {
    if (!selectedDirectory) {
      handleSelectFolder()
    }
  }

  // If no directory is selected, show the folder picker UI
  if (!selectedDirectory) {
    return (
      <div className="w-full bg-light-sidebar dark:bg-dark-sidebar h-full flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary">
          <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            File Explorer
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Browse local files and folders
          </p>
        </div>

        {/* Main content */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
          onDoubleClick={handleDoubleClick}
        >
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
                Double-click here or use the button below to open a folder from your computer
              </p>
              
              {error && (
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleSelectFolder}
                disabled={loading || !isFileSystemSupported}
                className="flex items-center gap-2 mx-auto px-4 py-2 
                         bg-light-accent-primary dark:bg-dark-accent-primary
                         hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-sm rounded-md transition-colors duration-200"
              >
                <Folder size={16} />
                {loading ? 'Opening...' : 'Choose Folder'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Directory is selected, show the file tree
  return (
    <div className="w-full bg-light-sidebar dark:bg-dark-sidebar h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">
              {directoryName}
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Local folder
            </p>
          </div>
          <button
            onClick={clearDirectory}
            className="ml-2 p-1 rounded hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                     text-light-text-muted dark:text-dark-text-muted hover:text-light-text-primary dark:hover:text-dark-text-primary
                     transition-colors"
            title="Close folder"
          >
            <X size={14} />
          </button>
        </div>
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