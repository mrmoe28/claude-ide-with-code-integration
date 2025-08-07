'use client'

import { useState, useEffect } from 'react'
import { X, Download, CheckCircle, AlertCircle, Terminal, RefreshCw, Copy, ExternalLink } from 'lucide-react'

interface SetupStatus {
  claude: {
    installed: boolean
    path?: string
    error?: string
  }
  npm: {
    available: boolean
    npmPath?: string
    npmVersion?: string
    nodeVersion?: string
    globalPrefix?: string
    error?: string
  }
  system: {
    platform: string
    arch: string
    nodeVersion: string
  }
}

interface ClaudeSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ClaudeSetupModal({ isOpen, onClose, onSuccess }: ClaudeSetupModalProps) {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installOutput, setInstallOutput] = useState<string>('')
  const [installError, setInstallError] = useState<string>('')
  const [step, setStep] = useState<'checking' | 'ready' | 'installing' | 'success' | 'error'>('checking')
  
  // Check setup status
  const checkSetup = async () => {
    try {
      setStep('checking')
      const response = await fetch('/api/setup-claude?action=check')
      const data = await response.json()
      
      if (data.success) {
        setSetupStatus(data)
        if (data.claude.installed) {
          setStep('success')
        } else {
          setStep('ready')
        }
      } else {
        setStep('error')
        setInstallError(data.message || 'Failed to check setup status')
      }
    } catch (error) {
      setStep('error')
      setInstallError(error instanceof Error ? error.message : 'Failed to check setup')
    }
  }
  
  // Auto-install Claude CLI
  const installClaude = async () => {
    try {
      setIsInstalling(true)
      setStep('installing')
      setInstallOutput('Starting Claude CLI installation...')
      setInstallError('')
      
      const response = await fetch('/api/setup-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'install' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setInstallOutput(result.output || 'Installation completed successfully!')
        setStep('success')
        
        // Refresh setup status
        setTimeout(() => {
          checkSetup()
        }, 1000)
      } else {
        setStep('error')
        setInstallError(result.message || 'Installation failed')
        setInstallOutput(result.output || '')
      }
    } catch (error) {
      setStep('error')
      setInstallError(error instanceof Error ? error.message : 'Installation failed')
    } finally {
      setIsInstalling(false)
    }
  }
  
  // Copy command to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }
  
  // Handle success and close
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }
  
  // Check setup on mount
  useEffect(() => {
    if (isOpen) {
      checkSetup()
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Claude Code Setup
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
          {step === 'checking' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Checking Setup
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Verifying Claude CLI installation...
              </p>
            </div>
          )}
          
          {step === 'ready' && setupStatus && (
            <div>
              <div className="text-center mb-6">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Claude CLI Required
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Claude Code needs the Claude CLI to function. We can install it automatically for you.
                </p>
              </div>
              
              {/* System Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">System Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {setupStatus.system.platform} ({setupStatus.system.arch})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Node.js:</span>
                    <span className="text-gray-900 dark:text-gray-100">{setupStatus.system.nodeVersion}</span>
                  </div>
                  {setupStatus.npm.available && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">npm:</span>
                        <span className="text-gray-900 dark:text-gray-100">{setupStatus.npm.npmVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Global Prefix:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                          {setupStatus.npm.globalPrefix}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Installation Options */}
              <div className="space-y-4">
                {setupStatus.npm.available ? (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Automatic Installation</h4>
                    <button
                      onClick={installClaude}
                      disabled={isInstalling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Install Claude CLI Automatically
                    </button>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      This will run: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npm install -g @anthropic-ai/claude</code>
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          npm Not Available
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Automatic installation requires npm. Please install npm first or use manual installation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Manual Installation</h4>
                  <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Terminal Command:</span>
                      <button
                        onClick={() => copyToClipboard('npm install -g @anthropic-ai/claude')}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <code className="text-green-400 font-mono">npm install -g @anthropic-ai/claude</code>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    After manual installation, click &quot;Refresh&quot; to verify.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={checkSetup}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <a
                    href="https://docs.anthropic.com/claude/docs/install-the-cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Documentation
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {step === 'installing' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Installing Claude CLI
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please wait while we install the Claude CLI...
              </p>
              
              {installOutput && (
                <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <pre className="text-green-400 text-sm text-left whitespace-pre-wrap">
                    {installOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {step === 'success' && setupStatus?.claude.installed && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Setup Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Claude CLI is now installed and ready to use.
              </p>
              
              {setupStatus.claude.path && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Installation Path:</strong>
                  </p>
                  <code className="text-green-700 dark:text-green-300 font-mono text-sm">
                    {setupStatus.claude.path}
                  </code>
                </div>
              )}
              
              <button
                onClick={handleSuccess}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Continue to Claude Code
              </button>
            </div>
          )}
          
          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Setup Error
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {installError}
              </p>
              
              {installOutput && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                  <pre className="text-red-800 dark:text-red-300 text-sm text-left whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {installOutput}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={checkSetup}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setStep('ready')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Back to Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}