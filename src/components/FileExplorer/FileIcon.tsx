import { 
  FileText, 
  FolderClosed, 
  FolderOpen, 
  Code, 
  Database,
  Image,
  Settings,
  Package,
  GitBranch,
  Hash,
  File
} from 'lucide-react'

interface FileIconProps {
  name: string
  type: 'file' | 'dir'
  expanded?: boolean
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'vue':
    case 'svelte':
      return Code
    case 'json':
    case 'xml':
      return Database
    case 'md':
    case 'mdx':
    case 'txt':
      return FileText
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return Image
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'env':
      return Settings
    default:
      if (fileName === 'package.json') return Package
      if (fileName === '.gitignore') return GitBranch
      if (fileName.startsWith('#')) return Hash
      return File
  }
}

export function FileIcon({ name, type, expanded = false }: FileIconProps) {
  if (type === 'dir') {
    const FolderIcon = expanded ? FolderOpen : FolderClosed
    return <FolderIcon size={16} className="text-light-accent-primary dark:text-dark-accent-primary flex-shrink-0" />
  }

  const IconComponent = getFileIcon(name)
  return <IconComponent size={16} className="text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0" />
}