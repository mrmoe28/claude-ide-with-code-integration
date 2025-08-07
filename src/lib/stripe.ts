import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  : null

export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_ID || 'price_1RtcNFEUI4iqGSxZeBA6PGt6',
  currency: 'usd',
  subscriptionName: 'Claude Code IDE Pro',
  trialPeriodDays: 0, // No free trial
}

// Stripe webhook events
export const STRIPE_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'checkout.session.completed',
] as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number]

// Utility functions
export async function createCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'claude-code-ide',
    },
  })
}

export async function createCheckoutSession(customerId: string, successUrl: string, cancelUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_CONFIG.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: {
      source: 'claude-code-ide',
    },
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// Webhook signature verification
export function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// Subscription status mapping
export function mapStripeStatusToDbStatus(stripeStatus: string): 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'unpaid':
      return 'unpaid'
    default:
      return 'inactive'
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

// Get subscription price details
export async function getPriceDetails(priceId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  try {
    const price = await stripe.prices.retrieve(priceId)
    return {
      id: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count,
      formattedAmount: price.unit_amount ? formatCurrency(price.unit_amount, price.currency) : null,
    }
  } catch (error) {
    console.error('Error getting price details:', error)
    return null
  }
}
