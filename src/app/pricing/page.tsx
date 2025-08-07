'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Check, Zap, Code, Terminal, Github, Crown } from 'lucide-react'
import { getStripeClient } from '@/lib/stripe'

function PricingContent() {
  const { isAuthenticated, hasActiveSubscription } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  const cancelled = searchParams.get('cancelled')
  const required = searchParams.get('required')

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (hasActiveSubscription) {
      router.push('/dashboard')
      return
    }

    setIsLoading(true)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await getStripeClient()
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start subscription process')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Unlock the Full Power of Claude Code IDE
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get unlimited access to all features with our Pro plan. No free trial, just powerful coding.
          </p>
        </div>

        {/* Alerts */}
        {cancelled && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
            <p className="text-yellow-800">
              Subscription cancelled. You can always come back when you're ready!
            </p>
          </div>
        )}
        
        {required && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
            <p className="text-blue-800">
              A Pro subscription is required to access this feature.
            </p>
          </div>
        )}

        {hasActiveSubscription && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <p className="text-green-800 flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              You already have an active Pro subscription!
            </p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-blue-500 relative">
            {/* Popular badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>

            <div className="px-8 py-12">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Pro Plan
                </h3>
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  $29
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">No free trial • Cancel anytime</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Full IDE Access</strong> - Complete coding environment
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Claude AI Integration</strong> - AI-powered coding assistance
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Terminal Access</strong> - Full command line interface
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>GitHub Integration</strong> - Seamless repository management
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>File Management</strong> - Advanced file operations
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Priority Support</strong> - Get help when you need it
                  </span>
                </li>
              </ul>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                         text-white font-semibold py-4 px-6 rounded-lg transition-colors
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : hasActiveSubscription ? (
                  <>
                    <Crown className="h-5 w-5" />
                    Go to Dashboard
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Subscribe Now
                  </>
                )}
              </button>

              {!hasActiveSubscription && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Secure payment powered by Stripe
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-4">
              <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Coding</h3>
            <p className="text-gray-600 dark:text-gray-400">AI-powered code completion and suggestions</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-4">
              <Terminal className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Full Terminal</h3>
            <p className="text-gray-600 dark:text-gray-400">Complete command line access and tools</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-4">
              <Github className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Git Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">Seamless version control and collaboration</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg mx-auto mb-4">
              <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">Optimized performance for smooth coding</p>
          </div>
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to supercharge your development?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of developers who are coding faster with Claude Code IDE Pro.
          </p>
          
          {!isAuthenticated && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Don't have an account yet?
              </p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up to get started →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}