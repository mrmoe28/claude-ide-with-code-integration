import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

export async function GET() {
  try {
    // Basic health checks
    const healthChecks = {
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      environment: process.env.NODE_ENV,
      status: 'healthy',
      uptime: process.uptime(),
      services: {
        database: await checkDatabase(),
        auth: checkAuthConfig(),
        stripe: checkStripeConfig(),
      }
    }

    const allServicesHealthy = Object.values(healthChecks.services).every(
      service => service.status === 'healthy'
    )

    return NextResponse.json(
      healthChecks,
      { 
        status: allServicesHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        version: packageJson.version,
        environment: process.env.NODE_ENV,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function checkDatabase() {
  try {
    // Check if database environment variables are configured
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      return {
        status: 'warning',
        message: 'Database URL not configured'
      }
    }

    // Try to import and test database connection
    const { sql } = await import('@vercel/postgres')
    await sql`SELECT 1`
    
    return {
      status: 'healthy',
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

function checkAuthConfig() {
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  )

  if (missingVars.length > 0) {
    return {
      status: 'unhealthy',
      message: `Missing auth environment variables: ${missingVars.join(', ')}`
    }
  }

  return {
    status: 'healthy',
    message: 'Auth configuration complete'
  }
}

function checkStripeConfig() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!stripeKey || !stripePublishableKey) {
    return {
      status: 'warning',
      message: 'Stripe configuration incomplete'
    }
  }

  return {
    status: 'healthy',
    message: 'Stripe configuration complete'
  }
}