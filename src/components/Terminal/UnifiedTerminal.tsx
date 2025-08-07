'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { shouldUseWebContainer, shouldUseNodePty, getEnvironmentInfo } from '@/lib/environment'
import { LoadingSpinner } from '@/components/LoadingSpinner'

// Dynamically import terminal components to avoid SSR issues
const MacTerminal = dynamic(
  () => import('./MacTerminal').then(mod => ({ default: mod.MacTerminal })),
  {
    ssr: false,
    loading: () => <TerminalLoading message="Loading Local Terminal..." />
  }
)

const WebContainerTerminal = dynamic(
  () => import('./WebContainerTerminal').then(mod => ({ default: mod.WebContainerTerminal })),
  {
    ssr: false,
    loading: () => <TerminalLoading message="Loading WebContainer Terminal..." />
  }
)

interface UnifiedTerminalProps {
  workingDirectory?: string
  className?: string
}

function TerminalLoading({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
      <div className="text-center">
        <LoadingSpinner />
        <div className="mt-4 text-sm text-gray-400">{message}</div>
      </div>
    </div>
  )
}

function TerminalEnvironmentInfo() {
  const [envInfo, setEnvInfo] = useState<any>(null)

  useEffect(() => {
    setEnvInfo(getEnvironmentInfo())
  }, [])

  if (!envInfo) return null

  return (
    <div className="p-4 bg-[#1e1e1e] text-white text-sm">
      <div className="mb-2 font-semibold">🔧 Terminal Environment Info:</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div>Environment: {envInfo.isLocal ? 'Local Development' : envInfo.isVercel ? 'Vercel Serverless' : 'Unknown'}</div>
        <div>Node ENV: {envInfo.nodeEnv}</div>
        <div>Vercel ENV: {envInfo.vercelEnv || 'Not Vercel'}</div>
        <div>Terminal Type: {shouldUseWebContainer() ? 'WebContainer' : shouldUseNodePty() ? 'Node PTY' : 'Auto-detect'}</div>
      </div>
    </div>
  )
}

export function UnifiedTerminal({ workingDirectory, className }: UnifiedTerminalProps) {
  const [terminalType, setTerminalType] = useState<'webcontainer' | 'nodepty' | 'loading'>('loading')
  const [showEnvInfo, setShowEnvInfo] = useState(false)

  useEffect(() => {
    // Determine which terminal to use based on environment
    const determineTerminalType = () => {
      if (shouldUseWebContainer()) {
        setTerminalType('webcontainer')
      } else if (shouldUseNodePty()) {
        setTerminalType('nodepty')
      } else {
        // Fallback to WebContainer for broader compatibility
        setTerminalType('webcontainer')
      }
    }

    // Add small delay to avoid hydration mismatches
    const timer = setTimeout(determineTerminalType, 100)
    return () => clearTimeout(timer)
  }, [])

  if (terminalType === 'loading') {
    return <TerminalLoading message="Determining Terminal Type..." />
  }

  return (
    <div className={`h-full relative ${className}`}>
      {/* Environment toggle button (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowEnvInfo(!showEnvInfo)}
            className="px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors"
            title="Toggle environment info"
          >
            🔧
          </button>
        </div>
      )}

      {/* Environment info panel */}
      {showEnvInfo && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur">
          <TerminalEnvironmentInfo />
          <button
            onClick={() => setShowEnvInfo(false)}
            className="absolute top-2 right-2 text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Terminal component based on environment */}
      {terminalType === 'webcontainer' ? (
        <WebContainerTerminal 
          workingDirectory={workingDirectory}
          className="h-full"
        />
      ) : (
        <MacTerminal 
          workingDirectory={workingDirectory}
          className="h-full"
        />
      )}
    </div>
  )
}