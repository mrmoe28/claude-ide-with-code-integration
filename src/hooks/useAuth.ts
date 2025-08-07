'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const hasActiveSubscription = session?.user?.hasActiveSubscription || false

  return {
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      hasActiveSubscription
    } : null,
    isLoading,
    isAuthenticated,
    hasActiveSubscription,
    session,
    status
  }
}