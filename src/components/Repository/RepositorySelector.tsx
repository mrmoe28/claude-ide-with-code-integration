'use client'

import { useState, useEffect } from 'react'
import { Search, Star, GitFork, Clock, ChevronDown } from 'lucide-react'
import { useGitHub } from '@/hooks/useGitHub'
import { GitHubRepository } from '@/types/github'

interface RepositorySelectorProps {
  onSelectRepository: (repo: { owner: string; name: string }) => void
  currentRepo?: { owner: string; name: string }
}

export function RepositorySelector({ onSelectRepository, currentRepo }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { getRepositories, loading } = useGitHub()

  useEffect(() => {
    const loadRepositories = async () => {
      const repos = await getRepositories()
      if (repos) {
        setRepositories(repos as GitHubRepository[])
        setFilteredRepos(repos as GitHubRepository[])
      }
    }

    loadRepositories()
  }, [getRepositories])

  useEffect(() => {
    const filtered = repositories.filter(repo =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredRepos(filtered)
  }, [searchQuery, repositories])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const handleSelectRepo = (repo: GitHubRepository) => {
    onSelectRepository({
      owner: repo.owner.login,
      name: repo.name
    })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Current Repository Display / Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 text-left border border-light-border-primary dark:border-dark-border-primary
                 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary
                 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary
                 transition-colors duration-150 flex items-center justify-between"
      >
        <div className="flex-1 min-w-0">
          {currentRepo ? (
            <>
              <div className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                {currentRepo.name}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {currentRepo.owner}
              </div>
            </>
          ) : (
            <div className="text-light-text-muted dark:text-dark-text-muted">
              Select a repository
            </div>
          )}
        </div>
        <ChevronDown 
          className={`ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} 
          size={16} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 
                      bg-light-bg-primary dark:bg-dark-bg-primary
                      border border-light-border-primary dark:border-dark-border-primary
                      rounded-md shadow-lg max-h-96 flex flex-col">
          
          {/* Search */}
          <div className="p-3 border-b border-light-border-primary dark:border-dark-border-primary">
            <div className="relative">
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-muted dark:text-dark-text-muted" 
              />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2
                         bg-light-input dark:bg-dark-input
                         border border-light-border-primary dark:border-dark-border-primary
                         rounded text-light-text-primary dark:text-dark-text-primary
                         placeholder-light-text-muted dark:placeholder-dark-text-muted
                         focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Repository List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-light-text-muted dark:text-dark-text-muted">
                Loading repositories...
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="p-4 text-center text-light-text-muted dark:text-dark-text-muted">
                No repositories found
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="w-full p-3 text-left hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                           transition-colors duration-150 border-b border-light-border-primary dark:border-dark-border-primary
                           last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                          {repo.name}
                        </span>
                        {repo.visibility === 'private' && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 
                                         text-yellow-800 dark:text-yellow-200 rounded">
                            Private
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 mb-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-light-text-muted dark:text-dark-text-muted">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-light-accent-primary dark:bg-dark-accent-primary"></span>
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star size={12} />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork size={12} />
                          {repo.forks_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(repo.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}