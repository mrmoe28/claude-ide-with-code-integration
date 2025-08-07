import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing database...')
    
    const success = await db.initializeDatabase()
    
    if (success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Database initialized successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to initialize database'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const testQuery = await db.getUserById('test')
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}