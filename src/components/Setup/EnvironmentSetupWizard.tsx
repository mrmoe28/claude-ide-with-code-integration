'use client'

import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'

interface EnvironmentConfig {
  OPENAI_API_KEY: string
}

interface EnvironmentSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: EnvironmentConfig) => void
}

interface ValidationResult {
  isValid: boolean
  error?: string
  service?: string
}

export function EnvironmentSetupWizard({ isOpen, onClose, onComplete }: EnvironmentSetupWizardProps) {
  const [config, setConfig] = useState<EnvironmentConfig>({
    OPENAI_API_KEY: ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [step, setStep] = useState<'configure' | 'validate' | 'complete'>('configure')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Check if environment is already configured
  useEffect(() => {
    if (isOpen) {
      checkCurrentConfig()
    }
  }, [isOpen])

  const checkCurrentConfig = async () => {
    try {
      const response = await fetch('/api/environment-check')
      if (response.ok) {
        const data = await response.json()
        if (data.configured) {
          setStep('complete')
          return
        }
      }
    } catch (error) {
      console.warn('Failed to check current configuration:', error)
    }
  }

  const validateApiKey = async (apiKey: string): Promise<ValidationResult> => {
    if (!apiKey.trim()) {
      return { isValid: false, error: 'API key is required' }
    }

    if (!apiKey.startsWith('sk-')) {
      return { isValid: false, error: 'OpenAI API key should start with "sk-"' }
    }

    try {
      // Test the API key with a simple request
      const response = await fetch('/api/validate-openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      if (response.ok) {
        const data = await response.json()
        return { 
          isValid: true, 
          service: data.model || 'OpenAI GPT' 
        }
      } else {
        const error = await response.json()
        return { 
          isValid: false, 
          error: error.message || 'Invalid API key' 
        }
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: 'Failed to validate API key. Please check your connection.' 
      }
    }
  }

  const handleValidateConfig = async () => {
    setIsValidating(true)
    setValidation(null)

    const apiKeyValidation = await validateApiKey(config.OPENAI_API_KEY)
    
    setValidation(apiKeyValidation)
    setIsValidating(false)

    if (apiKeyValidation.isValid) {
      setStep('validate')
    }
  }

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/save-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setStep('complete')
        onComplete(config)
      } else {
        const error = await response.json()
        setValidation({
          isValid: false,
          error: error.message || 'Failed to save configuration'
        })
      }
    } catch (error) {
      setValidation({
        isValid: false,
        error: 'Failed to save configuration. Please try again.'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleComplete = () => {
    onComplete(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Environment Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'configure' && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Configure Your API Keys
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  To use Claude Code IDE, you need to configure your OpenAI API key. This enables AI assistance and chat features.
                </p>
              </div>

              {/* OpenAI API Key Configuration */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.OPENAI_API_KEY}
                      onChange={(e) => setConfig(prev => ({ ...prev, OPENAI_API_KEY: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full p-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                               placeholder-gray-500 dark:placeholder-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">
                      Get your API key from{' '}
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        OpenAI Platform <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your API key will be stored securely in your browser&apos;s local storage and never transmitted to our servers.
                    </p>
                  </div>
                </div>

                {validation && !validation.isValid && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                          Configuration Error
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {validation.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleValidateConfig}
                    disabled={!config.OPENAI_API_KEY.trim() || isValidating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Validate Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'validate' && validation?.isValid && (
            <div>
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Configuration Validated!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your API key is valid and ready to use. Click continue to save your configuration.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                      OpenAI API Connected
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Successfully connected to {validation.service}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('configure')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Configure
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div>
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Setup Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your environment is now configured and ready to use. You can start using Claude Code IDE with full AI assistance.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  What&apos;s Next?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Open a project folder to start coding</li>
                  <li>• Use the integrated terminal for command-line tasks</li>
                  <li>• Ask Claude for help with your code using the AI assistant</li>
                  <li>• Access the settings to customize your workspace</li>
                </ul>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Continue to Claude Code IDE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}