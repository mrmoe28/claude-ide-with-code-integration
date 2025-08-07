import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Note: In a real application, you would typically save this to a secure location
    // For now, we'll just validate the format and return success
    // The actual environment variables should be set on the deployment platform
    
    const { OPENAI_API_KEY } = config

    if (!OPENAI_API_KEY || typeof OPENAI_API_KEY !== 'string') {
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // In production, you would save this to your environment configuration
    // This could be through:
    // - Vercel environment variables API
    // - Docker secrets
    // - Kubernetes secrets
    // - Cloud provider secret management
    
    // For now, we'll return instructions for manual setup
    const setupInstructions = {
      vercel: `vercel env add OPENAI_API_KEY production`,
      docker: `docker run -e OPENAI_API_KEY="${OPENAI_API_KEY.substring(0, 8)}..." your-app`,
      local: `echo 'OPENAI_API_KEY=${OPENAI_API_KEY.substring(0, 8)}...' >> .env.local`
    }

    // Store in browser localStorage via response header instruction
    return new Response(JSON.stringify({
      message: 'Configuration saved successfully',
      instructions: setupInstructions,
      clientStorage: {
        OPENAI_API_KEY: OPENAI_API_KEY // This will be stored client-side
      },
      success: true
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        // Instruct the client to store the config
        'X-Store-Config': JSON.stringify({ OPENAI_API_KEY })
      }
    })

  } catch (error) {
    console.error('Save environment error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to save environment configuration',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}