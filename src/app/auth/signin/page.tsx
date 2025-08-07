'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { User, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        action: isSignUp ? 'signup' : 'signin',
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        // Redirect to dashboard on successful auth
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            {isSignUp ? 'Sign up for Claude Code IDE' : 'Sign in to start coding with Claude'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full pl-10 px-3 py-3 
                         bg-light-bg-secondary dark:bg-dark-bg-secondary
                         border border-light-border-primary dark:border-dark-border-primary
                         placeholder-light-text-muted dark:placeholder-dark-text-muted
                         text-light-text-primary dark:text-dark-text-primary
                         focus:outline-none focus:ring-2 focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary
                         focus:border-transparent sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              disabled={isLoading || !email.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-3 px-4 
                       bg-light-accent-primary dark:bg-dark-accent-primary
                       hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium rounded-md
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary
                       transition-colors duration-200"
            >
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign in')}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-light-text-muted dark:text-dark-text-muted">
          <p>
            {isSignUp ? 'Already have an account?' : "Don&apos;t have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-light-accent-primary dark:text-dark-accent-primary hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}