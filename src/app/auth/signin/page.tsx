'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, Eye, EyeOff } from 'lucide-react'

export default function SignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Simple validation - in a real app, this would be server-side
    if (username.trim() && password.trim()) {
      // Store user session in localStorage
      localStorage.setItem('user', JSON.stringify({
        username,
        id: Date.now().toString(),
        signedInAt: new Date().toISOString()
      }))
      
      router.push('/')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Welcome to Claude Code IDE
          </h2>
          <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            Sign in to start coding with Claude
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full pl-10 px-3 py-3 
                         bg-light-bg-secondary dark:bg-dark-bg-secondary
                         border border-light-border-primary dark:border-dark-border-primary
                         placeholder-light-text-muted dark:placeholder-dark-text-muted
                         text-light-text-primary dark:text-dark-text-primary
                         focus:outline-none focus:ring-2 focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary
                         focus:border-transparent sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-10 px-3 py-3 
                         bg-light-bg-secondary dark:bg-dark-bg-secondary
                         border border-light-border-primary dark:border-dark-border-primary
                         placeholder-light-text-muted dark:placeholder-dark-text-muted
                         text-light-text-primary dark:text-dark-text-primary
                         focus:outline-none focus:ring-2 focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary
                         focus:border-transparent sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted hover:text-light-text-secondary dark:hover:text-dark-text-secondary" />
                ) : (
                  <Eye className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted hover:text-light-text-secondary dark:hover:text-dark-text-secondary" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-3 px-4 
                       bg-light-accent-primary dark:bg-dark-accent-primary
                       hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium rounded-md
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary
                       transition-colors duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-light-text-muted dark:text-dark-text-muted">
          <p>Use any username and password to sign in</p>
        </div>
      </div>
    </div>
  )
}