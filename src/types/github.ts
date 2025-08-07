export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  updated_at: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  visibility?: 'public' | 'private'
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubContent {
  name: string
  path: string
  sha?: string
  size?: number
  url?: string
  html_url?: string | null
  git_url?: string | null
  download_url?: string | null
  type: 'file' | 'dir' | 'submodule' | 'symlink'
}

export interface GitHubFileContent {
  content: string
  sha: string
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileTreeNode[]
  expanded?: boolean
}