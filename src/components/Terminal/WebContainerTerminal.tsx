'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebContainer } from '@webcontainer/api'
import { WebContainerService } from '@/services/webcontainer'
import '@xterm/xterm/css/xterm.css'

interface WebContainerTerminalProps {
  workingDirectory?: string
  className?: string
}

export function WebContainerTerminal({ workingDirectory, className = '' }: WebContainerTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const webcontainerRef = useRef<WebContainer | null>(null)
  const shellProcessRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isBooting, setIsBooting] = useState(true)

  // Terminal initialization effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!terminalRef.current) return

    let isComponentMounted = true

    const initializeTerminal = async () => {
      try {
        // Create terminal instance with modern theme
        const terminal = new Terminal({
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#ffffff',
            selectionBackground: '#264f78',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5'
          },
          fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", "Monaco", "Consolas", monospace',
          fontSize: 14,
          fontWeight: 'normal',
          lineHeight: 1.2,
          letterSpacing: 0,
          cursorBlink: true,
          cursorStyle: 'block',
          scrollback: 10000,
          tabStopWidth: 4,
          allowProposedApi: true,
          // Ensure terminal can receive input
          disableStdin: false,
          convertEol: true,
          windowsMode: false
        })

        const fitAddon = new FitAddon()
        const webLinksAddon = new WebLinksAddon()

        terminal.loadAddon(fitAddon)
        terminal.loadAddon(webLinksAddon)

        xtermRef.current = terminal
        fitAddonRef.current = fitAddon

        // Open terminal in the DOM
        if (terminalRef.current) {
          terminal.open(terminalRef.current)
          // Ensure terminal is focused and can receive input
          setTimeout(() => {
            terminal.focus()
          }, 100)
        }

        // Boot WebContainer
        terminal.write('\\r\\n\\x1b[36m🚀 Initializing WebContainer environment...\\x1b[0m\\r\\n')
        
        try {
          const webcontainer = await WebContainerService.getInstance().boot()
          webcontainerRef.current = webcontainer

          terminal.write('\\x1b[32m✅ WebContainer ready!\\x1b[0m\\r\\n')
          
          // Start shell process with proper shell
          const shellProcess = await webcontainer.spawn('sh', {
            terminal: {
              cols: terminal.cols,
              rows: terminal.rows,
            },
            env: {
              TERM: 'xterm-256color',
              PATH: '/usr/local/bin:/usr/bin:/bin',
            }
          })

          shellProcessRef.current = shellProcess

          // Handle shell output
          shellProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                if (isComponentMounted) {
                  terminal.write(data)
                }
              },
            })
          )

          // Handle terminal input with proper error handling
          terminal.onData((data) => {
            if (shellProcess.input && shellProcess.input.locked === false) {
              try {
                const writer = shellProcess.input.getWriter()
                writer.write(data)
                writer.releaseLock()
              } catch (error) {
                console.warn('Failed to write to shell input:', error)
              }
            }
          })

          // Handle terminal resize
          terminal.onResize(({ cols, rows }) => {
            shellProcess.resize({
              cols,
              rows,
            })
          })

          setIsConnected(true)
          setIsBooting(false)

          // Change to working directory if specified
          if (workingDirectory) {
            const writer = shellProcess.input.getWriter()
            writer.write(`cd "${workingDirectory}"\\r`)
            writer.releaseLock()
          }

        } catch (error) {
          console.error('Failed to initialize WebContainer:', error)
          terminal.write('\\r\\n\\x1b[31m❌ Failed to initialize WebContainer. Please refresh the page.\\x1b[0m\\r\\n')
          setIsBooting(false)
        }

        // Fit terminal to container
        setTimeout(() => {
          if (isComponentMounted && fitAddon && terminal.element && terminal.element.offsetWidth > 0) {
            try {
              fitAddon.fit()
            } catch (error) {
              console.warn('Failed to fit terminal:', error)
            }
          }
        }, 100)

        // Handle window resize
        const handleResize = () => {
          if (fitAddon && terminal.element && terminal.element.offsetWidth > 0) {
            try {
              fitAddon.fit()
            } catch (error) {
              console.warn('Failed to fit terminal on resize:', error)
            }
          }
        }

        window.addEventListener('resize', handleResize)

        // Cleanup function
        return () => {
          isComponentMounted = false
          window.removeEventListener('resize', handleResize)
          
          if (shellProcessRef.current) {
            try {
              shellProcessRef.current.kill()
            } catch (error) {
              console.warn('Failed to kill shell process:', error)
            }
          }
          
          if (terminal) {
            try {
              terminal.dispose()
            } catch (error) {
              console.warn('Failed to dispose terminal:', error)
            }
          }
        }

      } catch (error) {
        console.error('Failed to initialize terminal:', error)
        setIsBooting(false)
      }
    }

    initializeTerminal()

    return () => {
      isComponentMounted = false
    }
  }, [workingDirectory])

  return (
    <div className={`relative h-full w-full bg-[#1e1e1e] ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="flex items-center space-x-2">
          {/* Terminal window buttons */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <span className="text-sm text-[#cccccc] font-medium ml-4">
            Terminal
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : isBooting ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-[#8c8c8c]">
            {isBooting ? 'Starting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div 
        ref={terminalRef} 
        className="h-[calc(100%-48px)] w-full cursor-text"
        onClick={() => {
          if (xtermRef.current) {
            xtermRef.current.focus()
          }
        }}
      />
    </div>
  )
}