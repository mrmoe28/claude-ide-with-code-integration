import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return new Response(JSON.stringify({
        error: 'API key is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!apiKey.startsWith('sk-')) {
      return new Response(JSON.stringify({
        error: 'Invalid API key format. OpenAI keys should start with "sk-"',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Test the API key with a minimal request
    try {
      const openai = new OpenAI({
        apiKey: apiKey
      })

      // Make a simple API call to validate the key
      const models = await openai.models.list()
      
      // Find a suitable model to confirm access
      const gptModel = models.data.find(model => 
        model.id.includes('gpt') && !model.id.includes('instruct')
      )

      return new Response(JSON.stringify({
        valid: true,
        model: gptModel?.id || 'OpenAI API',
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (openaiError: any) {
      let errorMessage = 'Invalid API key or insufficient permissions'
      
      if (openaiError.status === 401) {
        errorMessage = 'Invalid API key. Please check your key and try again.'
      } else if (openaiError.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (openaiError.status === 403) {
        errorMessage = 'Insufficient permissions. Make sure your API key has the required access.'
      } else if (openaiError.message) {
        errorMessage = openaiError.message
      }

      return new Response(JSON.stringify({
        error: errorMessage,
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('API key validation error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to validate API key',
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