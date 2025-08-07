'use client'

import { useState, useEffect } from 'react'

interface User {
  username: string
  id: string
  signedInAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const signOut = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/auth/signin'
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut
  }
}