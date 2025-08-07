'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface MacTerminalProps {
  workingDirectory?: string
  className?: string
}

export function MacTerminal({ workingDirectory, className = '' }: MacTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))

  // Connection management
  const connectionStateRef = useRef<{
    isConnected: boolean
    connectionId: string | null
    reconnectAttempts: number
    reconnectTimer: NodeJS.Timeout | null
    eventSource: EventSource | null
  }>({
    isConnected: false,
    connectionId: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    eventSource: null
  })

  // Terminal initialization effect (runs once)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Ensure terminal ref is ready
    if (!terminalRef.current) {
      console.warn('Terminal ref not ready, skipping initialization')
      return
    }

    let isComponentMounted = true

    // Create terminal instance with Mac-like theme
    const terminal = new Terminal({
      theme: {
        background: '#1d1f21',
        foreground: '#c5c8c6',
        cursor: '#c5c8c6',
        black: '#282a2e',
        red: '#a54242',
        green: '#8c9440',
        yellow: '#de935f',
        blue: '#5f819d',
        magenta: '#85678f',
        cyan: '#5e8d87',
        white: '#707880',
        brightBlack: '#373b41',
        brightRed: '#cc6666',
        brightGreen: '#b5bd68',
        brightYellow: '#f0c674',
        brightBlue: '#81a2be',
        brightMagenta: '#b294bb',
        brightCyan: '#8abeb7',
        brightWhite: '#c5c8c6'
      },
      fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: false,
      rows: 24,
      cols: 120,
      scrollback: 1000
    })

    // Create and attach addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    // Open terminal in the container with safety checks
    try {
      terminal.open(terminalRef.current)
      
      // Store references only after successful open
      xtermRef.current = terminal
      fitAddonRef.current = fitAddon

      // Fit terminal to container with dimension check
      setTimeout(() => {
        if (isComponentMounted && fitAddon && terminal.element && terminal.element.offsetWidth > 0) {
          try {
            fitAddon.fit()
          } catch (error) {
            console.warn('Failed to fit terminal on initial load:', error)
          }
        }
      }, 100)
    } catch (error) {
      console.error('Failed to open terminal:', error)
      return
    }

    // Send input to terminal
    const sendInput = async (data: string) => {
      try {
        await fetch('/api/terminal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            input: data
          })
        })
      } catch (error) {
        console.error('Failed to send input to terminal:', error)
      }
    }

    // Send resize command to terminal
    const resizeTerminal = async (cols: number, rows: number) => {
      try {
        await fetch('/api/terminal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            cols,
            rows
          })
        })
      } catch (error) {
        console.error('Failed to resize terminal:', error)
      }
    }

    // Connect to terminal streaming API with reconnection logic
    const connectToTerminal = () => {
      const state = connectionStateRef.current
      
      // Clean up existing connection
      if (state.eventSource) {
        state.eventSource.close()
        state.eventSource = null
      }

      try {
        const eventSource = new EventSource(`/api/terminal?sessionId=${sessionId}`)
        state.eventSource = eventSource
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          state.isConnected = true
          state.reconnectAttempts = 0
          setIsConnected(true)
          terminal.write('\r\n\x1b[32mConnected to real Mac terminal\x1b[0m\r\n')
          
          // Initialize terminal with working directory if provided
          if (workingDirectory) {
            sendInput(`cd "${workingDirectory}"\r`)
          }
        }

        eventSource.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'output') {
              terminal.write(message.data)
            } else if (message.type === 'connected') {
              state.connectionId = message.connectionId
              console.log('Terminal session connected:', message.sessionId, message.connectionId)
            }
          } catch (error) {
            console.error('Failed to parse terminal message:', error)
          }
        }

        eventSource.onerror = () => {
          state.isConnected = false
          setIsConnected(false)
          eventSource.close()
          state.eventSource = null
          
          terminal.write('\r\n\x1b[31mTerminal connection lost.\x1b[0m\r\n')
          
          // Attempt reconnection with exponential backoff
          if (isComponentMounted && state.reconnectAttempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000)
            state.reconnectAttempts++
            
            terminal.write(`\r\n\x1b[33mReconnecting in ${delay/1000}s... (attempt ${state.reconnectAttempts}/5)\x1b[0m\r\n`)
            
            state.reconnectTimer = setTimeout(() => {
              if (isComponentMounted) {
                connectToTerminal()
              }
            }, delay)
          } else {
            terminal.write('\r\n\x1b[31mMax reconnection attempts reached. Please refresh to reconnect.\x1b[0m\r\n')
          }
        }

      } catch (error) {
        console.error('Failed to create EventSource connection:', error)
        connectionStateRef.current.isConnected = false
        setIsConnected(false)
        terminal.write('\r\n\x1b[31mFailed to connect to terminal backend.\x1b[0m\r\n')
      }
    }

    // Handle input from terminal
    terminal.onData((data) => {
      if (connectionStateRef.current.isConnected) {
        sendInput(data)
      }
    })

    // Connect to terminal
    connectToTerminal()

    // Handle resize with proper checks and debouncing
    let resizeTimeout: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (!isComponentMounted) return
      
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      resizeTimeout = setTimeout(() => {
        if (fitAddon && terminal.element && terminal.element.offsetWidth > 0) {
          try {
            fitAddon.fit()
            
            if (connectionStateRef.current.isConnected) {
              resizeTerminal(terminal.cols, terminal.rows)
            }
          } catch (error) {
            console.warn('Failed to resize terminal:', error)
          }
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      isComponentMounted = false
      const state = connectionStateRef.current
      
      window.removeEventListener('resize', handleResize)
      
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer)
        state.reconnectTimer = null
      }
      
      if (state.eventSource) {
        state.eventSource.close()
        state.eventSource = null
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      if (terminal) {
        try {
          terminal.dispose()
        } catch (error) {
          console.warn('Error disposing terminal:', error)
        }
      }
      
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [workingDirectory, sessionId]) // Removed isConnected from dependencies

  return (
    <div className={`h-full w-full ${className}`}>
      {!isConnected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Connecting...
          </div>
        </div>
      )}
      {isConnected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Real Terminal
          </div>
        </div>
      )}
      <div 
        ref={terminalRef} 
        className="h-full w-full"
        style={{ 
          minHeight: '200px',
          background: '#1d1f21'
        }}
      />
    </div>
  )
}