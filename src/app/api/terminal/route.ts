import { NextRequest } from 'next/server'
import * as pty from 'node-pty'

// Store terminal sessions
const terminals = new Map<string, pty.IPty>()

// Store active connections for proper cleanup
const activeConnections = new Map<string, Set<() => void>>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId') || 'default'
  
  // Get or create terminal session
  let terminal = terminals.get(sessionId)
  if (!terminal) {
    // Determine shell based on platform
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'
    
    terminal = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: process.env
    })

    terminals.set(sessionId, terminal)
    
    // Clean up on terminal exit
    terminal.onExit(() => {
      terminals.delete(sessionId)
      // Clean up all connections for this session
      const connections = activeConnections.get(sessionId)
      if (connections) {
        connections.forEach(cleanup => cleanup())
        activeConnections.delete(sessionId)
      }
    })
  }

  // Create connection ID for this specific stream
  const connectionId = `${sessionId}-${Date.now()}-${Math.random()}`

  // Create a readable stream for terminal output
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Atomic state management
      const state = {
        closed: false,
        controller,
        keepAliveInterval: null as NodeJS.Timeout | null,
        dataDisposable: null as { dispose(): void } | null
      }
      
      const safeEnqueue = (data: Uint8Array): boolean => {
        // Double-check state atomically
        if (state.closed) return false
        
        try {
          // Verify controller is still writable
          if (controller.desiredSize === null) {
            // Controller is closed, mark state and return
            state.closed = true
            return false
          }
          
          controller.enqueue(data)
          return true
        } catch (error) {
          console.error('Terminal stream controller error:', error)
          cleanup()
          return false
        }
      }
      
      const cleanup = () => {
        // Atomic cleanup to prevent double-close
        if (state.closed) return
        state.closed = true
        
        // Clear interval first
        if (state.keepAliveInterval) {
          clearInterval(state.keepAliveInterval)
          state.keepAliveInterval = null
        }
        
        // Dispose data listener
        if (state.dataDisposable) {
          state.dataDisposable.dispose()
          state.dataDisposable = null
        }
        
        // Close controller safely
        try {
          if (controller.desiredSize !== null) {
            controller.close()
          }
        } catch (e) {
          // Controller already closed or in invalid state
        }
        
        // Remove from active connections
        const connections = activeConnections.get(sessionId)
        if (connections) {
          connections.delete(cleanup)
          if (connections.size === 0) {
            activeConnections.delete(sessionId)
          }
        }
      }
      
      // Register cleanup for this connection
      if (!activeConnections.has(sessionId)) {
        activeConnections.set(sessionId, new Set())
      }
      activeConnections.get(sessionId)!.add(cleanup)
      
      // Setup data listener with error handling
      const dataListener = (data: string) => {
        // Check if connection is still valid before enqueueing
        if (!state.closed) {
          safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'output', data })}\n\n`))
        }
      }
      
      state.dataDisposable = terminal.onData(dataListener)

      // Send initial connection message
      if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId, connectionId })}\n\n`))) {
        cleanup()
        return cleanup
      }

      // Keep connection alive with connection validation
      state.keepAliveInterval = setInterval(() => {
        if (!state.closed) {
          if (!safeEnqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`))) {
            cleanup()
          }
        } else {
          // Clear interval if connection is closed
          if (state.keepAliveInterval) {
            clearInterval(state.keepAliveInterval)
            state.keepAliveInterval = null
          }
        }
      }, 30000) // Reduced to 30 seconds for better responsiveness

      // Return cleanup function
      return cleanup
    },
    cancel() {
      console.log(`Terminal stream cancelled for session: ${sessionId}`)
    }
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId = 'default', input, cols, rows } = await request.json()
    
    const terminal = terminals.get(sessionId)
    if (!terminal) {
      return new Response(JSON.stringify({
        error: 'Terminal session not found',
        message: 'Please refresh to create a new session'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (input) {
      // Send input to terminal
      terminal.write(input)
    }

    if (cols && rows) {
      // Resize terminal
      terminal.resize(cols, rows)
    }
    
    return new Response(JSON.stringify({
      success: true,
      sessionId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Terminal POST error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to process terminal request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}