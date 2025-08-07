import { NextRequest } from 'next/server'
import { constructWebhookEvent, mapStripeStatusToDbStatus } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({
      error: 'No signature provided'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new Response(JSON.stringify({
      error: 'Invalid signature'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await db.getSubscriptionByStripeId(session.subscription as string)
          
          if (!subscription) {
            // Create new subscription record
            const user = await db.getUserByEmail(session.customer_details?.email || '')
            
            if (user) {
              await db.createSubscription({
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: user.id,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                stripe_price_id: session.line_items?.data[0]?.price?.id,
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                cancel_at_period_end: false,
              })
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const existingSubscription = await db.getSubscriptionByStripeId(subscription.id)
        
        if (existingSubscription) {
          // Update existing subscription
          await db.updateSubscription(existingSubscription.id, {
            status: mapStripeStatusToDbStatus(subscription.status),
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          })
        } else {
          // Create new subscription record
          const customer = await db.getUserByEmail(subscription.customer as string)
          
          if (customer) {
            await db.createSubscription({
              id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: customer.id,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              status: mapStripeStatusToDbStatus(subscription.status),
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const existingSubscription = await db.getSubscriptionByStripeId(subscription.id)
        
        if (existingSubscription) {
          await db.updateSubscription(existingSubscription.id, {
            status: 'canceled',
            cancel_at_period_end: true,
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const existingSubscription = await db.getSubscriptionByStripeId(invoice.subscription as string)
          
          if (existingSubscription) {
            await db.updateSubscription(existingSubscription.id, {
              status: 'active',
              current_period_start: new Date(invoice.period_start * 1000),
              current_period_end: new Date(invoice.period_end * 1000),
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const existingSubscription = await db.getSubscriptionByStripeId(invoice.subscription as string)
          
          if (existingSubscription) {
            await db.updateSubscription(existingSubscription.id, {
              status: 'past_due',
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(JSON.stringify({
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({
    message: 'Webhook endpoint - POST only'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}