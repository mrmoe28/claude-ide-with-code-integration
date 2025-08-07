'use client'

import React from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { FileIcon } from './FileIcon'
import { FileTreeNode } from '@/types/github'

interface FileTreeItemProps {
  node: FileTreeNode
  level: number
  onFileSelect: (path: string) => void
  onToggleExpand: (path: string) => void
  selectedFile?: string
}

export function FileTreeItem({ 
  node, 
  level, 
  onFileSelect, 
  onToggleExpand,
  selectedFile 
}: FileTreeItemProps) {
  const isSelected = selectedFile === node.path
  const hasChildren = node.children && node.children.length > 0

  const handleClick = () => {
    if (node.type === 'file') {
      onFileSelect(node.path)
    } else {
      onToggleExpand(node.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary
          text-sm transition-colors duration-150
          ${isSelected ? 'bg-light-accent-hover dark:bg-dark-accent-hover' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Expand/Collapse Arrow for directories */}
        {node.type === 'dir' && (
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              node.expanded ? 
                <ChevronDown size={12} className="text-light-text-secondary dark:text-dark-text-secondary" /> :
                <ChevronRight size={12} className="text-light-text-secondary dark:text-dark-text-secondary" />
            )}
          </div>
        )}
        
        {/* Icon */}
        <FileIcon 
          name={node.name} 
          type={node.type} 
          expanded={node.expanded} 
        />
        
        {/* File/Directory Name */}
        <span className={`
          truncate text-light-text-primary dark:text-dark-text-primary
          ${isSelected ? 'font-medium' : ''}
        `}>
          {node.name}
        </span>
      </div>

      {/* Render children if expanded */}
      {node.type === 'dir' && node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onToggleExpand={onToggleExpand}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}