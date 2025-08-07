import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'

// Store active Claude Code sessions
const activeSessions = new Map<string, {
  process: any
  status: 'active' | 'busy' | 'error'
  lastActivity: number
}>()

// Cleanup inactive sessions every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of activeSessions) {
    if (now - session.lastActivity > 600000) { // 10 minutes
      try {
        session.process?.kill()
      } catch (e) {
        console.warn(`Failed to kill inactive Claude Code session ${sessionId}:`, e)
      }
      activeSessions.delete(sessionId)
    }
  }
}, 600000)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      message, 
      sessionId = 'default', 
      workingDirectory = process.cwd(),
      context = {} 
    } = body

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({
        error: 'Message is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create readable stream for streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        let isControllerClosed = false
        
        const cleanup = () => {
          if (!isControllerClosed) {
            isControllerClosed = true
            try {
              controller.close()
            } catch (e) {
              // Controller already closed
            }
          }
        }

        const safeEnqueue = (data: string) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(encoder.encode(data))
              return true
            } catch (e) {
              cleanup()
              return false
            }
          }
          return false
        }

        try {
          // Start Claude Code process
          const claudeProcess = spawn('claude', ['code'], {
            cwd: workingDirectory,
            env: {
              ...process.env,
              CLAUDE_CODE_SESSION_ID: sessionId,
              // Pass context as environment variables if needed
              CLAUDE_CODE_CONTEXT: JSON.stringify(context)
            },
            stdio: ['pipe', 'pipe', 'pipe']
          })

          // Track session
          activeSessions.set(sessionId, {
            process: claudeProcess,
            status: 'active',
            lastActivity: Date.now()
          })

          // Send initial message
          safeEnqueue(`data: ${JSON.stringify({
            type: 'status',
            message: 'Claude Code session started',
            sessionId
          })}\n\n`)

          // Send the user's message to Claude Code
          claudeProcess.stdin?.write(message + '\n')

          // Handle stdout (Claude's responses)
          claudeProcess.stdout?.on('data', (data: Buffer) => {
            const text = data.toString()
            safeEnqueue(`data: ${JSON.stringify({
              type: 'response',
              content: text,
              timestamp: Date.now()
            })}\n\n`)
            
            // Update last activity
            const session = activeSessions.get(sessionId)
            if (session) {
              session.lastActivity = Date.now()
            }
          })

          // Handle stderr (errors and status messages)
          claudeProcess.stderr?.on('data', (data: Buffer) => {
            const text = data.toString()
            safeEnqueue(`data: ${JSON.stringify({
              type: 'error',
              content: text,
              timestamp: Date.now()
            })}\n\n`)
          })

          // Handle process completion
          claudeProcess.on('close', (code: number) => {
            safeEnqueue(`data: ${JSON.stringify({
              type: 'completed',
              exitCode: code,
              message: code === 0 ? 'Claude Code session completed successfully' : `Claude Code session ended with code ${code}`,
              timestamp: Date.now()
            })}\n\n`)
            
            // Clean up session
            activeSessions.delete(sessionId)
            cleanup()
          })

          // Handle process errors
          claudeProcess.on('error', (error: Error) => {
            safeEnqueue(`data: ${JSON.stringify({
              type: 'error',
              content: `Process error: ${error.message}`,
              timestamp: Date.now()
            })}\n\n`)
            
            activeSessions.delete(sessionId)
            cleanup()
          })

          // Handle client disconnect
          return () => {
            try {
              claudeProcess.kill()
            } catch (e) {
              console.warn(`Failed to kill Claude Code process for session ${sessionId}:`, e)
            }
            activeSessions.delete(sessionId)
          }

        } catch (error) {
          safeEnqueue(`data: ${JSON.stringify({
            type: 'error',
            content: `Failed to start Claude Code: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: Date.now()
          })}\n\n`)
          cleanup()
        }
      },
      cancel() {
        console.log(`Claude Code stream cancelled for session: ${sessionId}`)
      }
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Claude Code API error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Get session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const session = activeSessions.get(sessionId)
      return new Response(JSON.stringify({
        exists: !!session,
        status: session?.status || 'not_found',
        lastActivity: session?.lastActivity,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return all sessions
    const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      status: session.status,
      lastActivity: session.lastActivity
    }))

    return new Response(JSON.stringify({
      sessions,
      count: sessions.length,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Claude Code status error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to get session status',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Clean up session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'Session ID is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const session = activeSessions.get(sessionId)
    if (session) {
      try {
        session.process?.kill()
      } catch (e) {
        console.warn(`Failed to kill Claude Code process for session ${sessionId}:`, e)
      }
      activeSessions.delete(sessionId)
    }

    return new Response(JSON.stringify({
      message: 'Session cleaned up',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Claude Code cleanup error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to cleanup session',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}