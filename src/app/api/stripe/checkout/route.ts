import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, createCustomer, createCheckoutSession } from '@/lib/stripe'
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

    const { successUrl, cancelUrl } = await request.json()

    if (!successUrl || !cancelUrl) {
      return new Response(JSON.stringify({
        error: 'successUrl and cancelUrl are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get or create user in database
    let user = await db.getUserByEmail(session.user.email)
    
    if (!user) {
      user = await db.createUser({
        id: session.user.id || session.user.email,
        email: session.user.email,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        email_verified: session.user.emailVerified ? new Date() : undefined,
      })
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Failed to create user'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.getSubscriptionByUserId(user.id)
    
    if (existingSubscription?.status === 'active') {
      return new Response(JSON.stringify({
        error: 'User already has an active subscription'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create or get Stripe customer
    let customerId: string
    
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      const customer = await createCustomer(session.user.email, session.user.name || undefined)
      customerId = customer.id
      
      // Update subscription record with customer ID
      if (existingSubscription) {
        await db.updateSubscription(existingSubscription.id, {
          stripe_customer_id: customerId
        })
      }
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(customerId, successUrl, cancelUrl)

    // Log usage
    await db.logUsage(user.id, 'checkout_session_created', {
      sessionId: checkoutSession.id,
      customerId,
      amount: checkoutSession.amount_total,
      currency: checkoutSession.currency,
    })

    return new Response(JSON.stringify({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({
    message: 'POST to create checkout session'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}