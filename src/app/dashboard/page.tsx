'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { 
  Crown, 
  Settings, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  LogOut
} from 'lucide-react'

function DashboardContent() {
  const { user, hasActiveSubscription, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingLoading, setBillingLoading] = useState(false)
  
  const success = searchParams.get('success')
  const sessionId = searchParams.get('session_id')

  const handleManageBilling = async () => {
    setBillingLoading(true)
    
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
      setBillingLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent-primary dark:border-dark-accent-primary"></div>
      </div>
    )
  }

  // If user has active subscription, show the full IDE
  if (hasActiveSubscription) {
    return <MainLayout />
  }

  // Otherwise show the subscription prompt dashboard
  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-light-border-primary dark:border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-light-accent-primary dark:bg-dark-accent-primary rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                Claude Code IDE
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Welcome, {user?.name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1 text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-green-700 mb-4">
                  Your subscription is being activated. This may take a few moments.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-6">
            <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Subscription Required
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
            You need a Pro subscription to access the full Claude Code IDE experience. 
            Upgrade now to unlock all features.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-light-border-primary dark:border-dark-border-primary">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              🤖 AI-Powered Coding
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Get intelligent code suggestions and assistance from Claude AI.
            </p>
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Pro Feature
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-light-border-primary dark:border-dark-border-primary">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              💻 Full Terminal Access
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Complete command line interface for all your development needs.
            </p>
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Pro Feature
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-light-border-primary dark:border-dark-border-primary">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              📁 Advanced File Management
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Full file system operations and project management tools.
            </p>
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Pro Feature
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-light-border-primary dark:border-dark-border-primary">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              🚀 GitHub Integration
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Seamless version control and repository management.
            </p>
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Pro Feature
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
              Ready to unlock the full experience?
            </h2>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              $29/month
            </div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              No free trial • Cancel anytime
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <Crown className="h-5 w-5" />
                Upgrade to Pro
              </button>
              
              <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
                Secure payment powered by Stripe
              </div>
            </div>
          </div>

          {/* Alternative actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <button
              onClick={() => router.push('/pricing')}
              className="text-light-accent-primary dark:text-dark-accent-primary hover:underline"
            >
              View detailed pricing
            </button>
            <span className="hidden sm:inline text-light-text-muted dark:text-dark-text-muted">•</span>
            <button
              onClick={handleSignOut}
              className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent-primary dark:border-dark-accent-primary"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}