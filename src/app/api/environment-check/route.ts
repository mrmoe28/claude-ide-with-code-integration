import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY

    return new Response(JSON.stringify({
      configured: hasOpenAIKey,
      services: {
        openai: hasOpenAIKey
      },
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Environment check error:', error)
    return new Response(JSON.stringify({
      configured: false,
      error: 'Failed to check environment configuration',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}