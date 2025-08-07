'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Monitor, Cpu, HardDrive, Wifi, Globe, Shield } from 'lucide-react'

interface SystemRequirement {
  name: string
  description: string
  required: boolean
  status: 'checking' | 'passed' | 'warning' | 'failed'
  message?: string
  value?: string
  icon: React.ComponentType<{ className?: string }>
}

interface SystemRequirementsCheckProps {
  onComplete?: (results: SystemRequirement[]) => void
  showDetails?: boolean
  className?: string
}

const INITIAL_REQUIREMENTS: SystemRequirement[] = [
  {
    name: 'Browser Compatibility',
    description: 'Modern browser with ES2020 support',
    required: true,
    status: 'checking',
    icon: Globe
  },
  {
    name: 'JavaScript Enabled',
    description: 'JavaScript must be enabled for the IDE to function',
    required: true,
    status: 'checking',
    icon: Cpu
  },
  {
    name: 'Local Storage',
    description: 'Browser local storage for settings and auto-save',
    required: true,
    status: 'checking',
    icon: HardDrive
  },
  {
    name: 'WebAssembly Support',
    description: 'Required for code execution and Monaco editor',
    required: true,
    status: 'checking',
    icon: Cpu
  },
  {
    name: 'Network Connectivity',
    description: 'Internet connection for AI features and updates',
    required: false,
    status: 'checking',
    icon: Wifi
  },
  {
    name: 'Secure Context (HTTPS)',
    description: 'Required for advanced browser features',
    required: false,
    status: 'checking',
    icon: Shield
  },
  {
    name: 'Screen Resolution',
    description: 'Minimum 1024x768 resolution recommended',
    required: false,
    status: 'checking',
    icon: Monitor
  }
]

export function SystemRequirementsCheck({ 
  onComplete, 
  showDetails = true, 
  className = '' 
}: SystemRequirementsCheckProps) {
  const [requirements, setRequirements] = useState<SystemRequirement[]>([])
  const [isChecking, setIsChecking] = useState(true)

  const checkBrowserCompatibility = (): { status: SystemRequirement['status'], message: string, value: string } => {
    const userAgent = navigator.userAgent
    const isModernBrowser = 
      'fetch' in window &&
      'Promise' in window &&
      'const' in window &&
      'let' in window &&
      'arrow functions' in eval('(() => true)')

    let browserName = 'Unknown'
    let version = 'Unknown'

    if (userAgent.includes('Chrome/')) {
      browserName = 'Chrome'
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.includes('Firefox/')) {
      browserName = 'Firefox'
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      browserName = 'Safari'
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.includes('Edge/')) {
      browserName = 'Edge'
      version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown'
    }

    const value = `${browserName} ${version}`

    if (!isModernBrowser) {
      return {
        status: 'failed',
        message: 'Browser lacks modern JavaScript features',
        value
      }
    }

    const chromeVersion = parseInt(version)
    if (browserName === 'Chrome' && chromeVersion < 80) {
      return {
        status: 'warning',
        message: 'Chrome version may have compatibility issues',
        value
      }
    }

    return {
      status: 'passed',
      message: 'Browser supports all required features',
      value
    }
  }

  const checkJavaScript = (): { status: SystemRequirement['status'], message: string } => {
    try {
      // If we can run this code, JavaScript is enabled
      const testFeatures = {
        classes: class TestClass {},
        asyncAwait: async () => await Promise.resolve(true),
        destructuring: (() => { const [a] = [1]; return a === 1 })(),
        templateLiterals: `template literals work`
      }
      
      return {
        status: 'passed',
        message: 'JavaScript is enabled with modern features'
      }
    } catch (error) {
      return {
        status: 'failed',
        message: 'JavaScript features not available'
      }
    }
  }

  const checkLocalStorage = (): { status: SystemRequirement['status'], message: string, value: string } => {
    try {
      const testKey = 'claude_storage_test'
      const testValue = 'test'
      
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      if (retrieved === testValue) {
        const quota = (navigator as any).storage?.estimate?.()
        return {
          status: 'passed',
          message: 'Local storage is available and working',
          value: quota ? 'Available' : 'Available (quota unknown)'
        }
      } else {
        return {
          status: 'failed',
          message: 'Local storage is not functioning correctly',
          value: 'Not working'
        }
      }
    } catch (error) {
      return {
        status: 'failed',
        message: 'Local storage is not available (may be disabled)',
        value: 'Disabled'
      }
    }
  }

  const checkWebAssembly = (): { status: SystemRequirement['status'], message: string } => {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      return {
        status: 'passed',
        message: 'WebAssembly is supported'
      }
    } else {
      return {
        status: 'failed',
        message: 'WebAssembly is not supported'
      }
    }
  }

  const checkNetworkConnectivity = (): { status: SystemRequirement['status'], message: string, value: string } => {
    const isOnline = navigator.onLine
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    let connectionType = 'Unknown'
    if (connection) {
      connectionType = connection.effectiveType || connection.type || 'Unknown'
    }

    if (isOnline) {
      if (connectionType === 'slow-2g' || connectionType === '2g') {
        return {
          status: 'warning',
          message: 'Slow network connection detected',
          value: connectionType.toUpperCase()
        }
      }
      return {
        status: 'passed',
        message: 'Network connection is available',
        value: connectionType.toUpperCase()
      }
    } else {
      return {
        status: 'failed',
        message: 'No network connection detected',
        value: 'Offline'
      }
    }
  }

  const checkSecureContext = (): { status: SystemRequirement['status'], message: string, value: string } => {
    const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
    
    if (isSecure) {
      return {
        status: 'passed',
        message: 'Running in secure context',
        value: location.protocol.toUpperCase()
      }
    } else {
      return {
        status: 'warning',
        message: 'Not running in secure context (some features may be limited)',
        value: location.protocol.toUpperCase()
      }
    }
  }

  const checkScreenResolution = (): { status: SystemRequirement['status'], message: string, value: string } => {
    const width = screen.width
    const height = screen.height
    const value = `${width}x${height}`

    if (width < 1024 || height < 768) {
      return {
        status: 'warning',
        message: 'Screen resolution is below recommended minimum',
        value
      }
    } else {
      return {
        status: 'passed',
        message: 'Screen resolution is adequate',
        value
      }
    }
  }

  useEffect(() => {
    const runChecks = async () => {
      setIsChecking(true)
      
      const checkFunctions = [
        checkBrowserCompatibility,
        checkJavaScript,
        checkLocalStorage,
        checkWebAssembly,
        checkNetworkConnectivity,
        checkSecureContext,
        checkScreenResolution
      ]

      const results = INITIAL_REQUIREMENTS.map((req, index) => {
        try {
          const checkResult = checkFunctions[index]()
          return {
            ...req,
            ...checkResult
          }
        } catch (error) {
          return {
            ...req,
            status: 'failed' as const,
            message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      })

      setRequirements(results)
      setIsChecking(false)
      onComplete?.(results)
    }

    // Add a small delay to show the checking state
    setTimeout(runChecks, 500)
  }, [onComplete])

  const getStatusIcon = (status: SystemRequirement['status']) => {
    switch (status) {
      case 'checking':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: SystemRequirement['status']) => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 dark:border-blue-700'
      case 'passed':
        return 'border-green-200 dark:border-green-700'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-700'
      case 'failed':
        return 'border-red-200 dark:border-red-700'
    }
  }

  const criticalIssues = requirements.filter(req => req.required && req.status === 'failed')
  const warnings = requirements.filter(req => req.status === 'warning')
  const allPassed = requirements.every(req => req.status === 'passed' || (!req.required && req.status !== 'failed'))

  return (
    <div className={`bg-white dark:bg-gray-900 ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            System Requirements Check
          </h2>
        </div>

        {/* Overall Status */}
        {!isChecking && (
          <div className={`p-4 rounded-lg border mb-6 ${
            criticalIssues.length > 0 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              : warnings.length > 0
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
          }`}>
            <div className="flex items-center gap-3">
              {criticalIssues.length > 0 ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : warnings.length > 0 ? (
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              
              <div>
                <h3 className={`font-medium ${
                  criticalIssues.length > 0
                    ? 'text-red-800 dark:text-red-200'
                    : warnings.length > 0
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {criticalIssues.length > 0
                    ? 'System requirements not met'
                    : warnings.length > 0
                    ? 'System compatible with warnings'
                    : 'System fully compatible'
                  }
                </h3>
                <p className={`text-sm ${
                  criticalIssues.length > 0
                    ? 'text-red-700 dark:text-red-300'
                    : warnings.length > 0
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  {criticalIssues.length > 0
                    ? `${criticalIssues.length} critical issue${criticalIssues.length > 1 ? 's' : ''} found`
                    : warnings.length > 0
                    ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`
                    : 'All requirements satisfied'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requirements List */}
        {showDetails && (
          <div className="space-y-3">
            {requirements.map((req, index) => {
              const Icon = req.icon
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${getStatusColor(req.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {req.name}
                        </h4>
                        {req.required && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {req.description}
                      </p>
                      
                      {req.message && (
                        <p className={`text-sm ${
                          req.status === 'failed' 
                            ? 'text-red-600 dark:text-red-400'
                            : req.status === 'warning'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {req.message}
                        </p>
                      )}
                      
                      {req.value && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                          {req.value}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {getStatusIcon(req.status)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}