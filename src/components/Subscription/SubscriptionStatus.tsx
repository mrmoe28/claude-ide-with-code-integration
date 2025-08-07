'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Crown, Settings, CreditCard, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function SubscriptionStatus() {
  const { hasActiveSubscription, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleManageBilling = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create billing portal session')
      }
      
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasActiveSubscription) {
    return (
      <div className="flex items-center gap-3">
        {/* Pro Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
          <Crown className="h-4 w-4" />
          Pro
        </div>
        
        {/* Billing Management Button */}
        <button
          onClick={handleManageBilling}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1 text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50"
          title="Manage billing"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Billing</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Free Tier Badge */}
      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
        <AlertCircle className="h-4 w-4" />
        Free
      </div>
      
      {/* Upgrade Button */}
      <Link
        href="/pricing"
        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        <Crown className="h-4 w-4" />
        <span className="hidden sm:inline">Upgrade</span>
      </Link>
    </div>
  )
}