import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new Response(JSON.stringify({
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { returnUrl } = await request.json()

    if (!returnUrl) {
      return new Response(JSON.stringify({
        error: 'returnUrl is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user and subscription
    const user = await db.getUserByEmail(session.user.email)
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const subscription = await db.getSubscriptionByUserId(user.id)
    
    if (!subscription?.stripe_customer_id) {
      return new Response(JSON.stringify({
        error: 'No subscription found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create portal session
    const portalSession = await createPortalSession(subscription.stripe_customer_id, returnUrl)

    // Log usage
    await db.logUsage(user.id, 'portal_session_created', {
      sessionId: portalSession.id,
      customerId: subscription.stripe_customer_id,
    })

    return new Response(JSON.stringify({
      url: portalSession.url,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Portal session creation error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to create portal session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({
    message: 'POST to create portal session'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}