'use client'

import { Crown, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

interface PaywallProps {
  feature?: string
  description?: string
  showFeatures?: boolean
}

export function Paywall({ 
  feature = "This Feature", 
  description = "You need a Pro subscription to access this feature.",
  showFeatures = true 
}: PaywallProps) {
  const features = [
    "AI-powered code assistance",
    "Full terminal access", 
    "Advanced file management",
    "GitHub integration",
    "Priority support"
  ]

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Upgrade Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </p>

          {/* Features List (if enabled) */}
          {showFeatures && (
            <div className="text-left mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Pro includes:
              </h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              $29<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No free trial • Cancel anytime
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2 group"
            >
              <Crown className="h-5 w-5" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            
            <Link
              href="/dashboard"
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors inline-block text-center"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Security note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}