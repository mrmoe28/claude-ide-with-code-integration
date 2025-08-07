import Stripe from 'stripe'

// Initialize Stripe with API key
// Using lazy initialization to avoid cold start issues in serverless
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
      // Optimize for serverless environments
      maxNetworkRetries: 2,
      timeout: 30000 // 30 seconds
    })
  }
  
  return stripeInstance
}

// Client-side Stripe - only initialize when needed
export async function getStripeClient() {
  if (typeof window === 'undefined') {
    throw new Error('getStripeClient can only be called on the client side')
  }
  
  const { loadStripe } = await import('@stripe/stripe-js')
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Stripe webhook signature verification
export function verifyStripeWebhook(
  body: string | Buffer,
  signature: string,
  endpointSecret: string
): Stripe.Event {
  const stripe = getStripe()
  
  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

// Common Stripe operations optimized for serverless
export async function createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  const stripe = getStripe()
  
  try {
    return await stripe.customers.create({
      email,
      name,
      metadata
    })
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const stripe = getStripe()
  
  try {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: false, // No free trials
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      // Optimize for better UX
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Ensure subscription starts immediately
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe()
  
  try {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw error
  }
}

export async function getSubscription(subscriptionId: string) {
  const stripe = getStripe()
  
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

export async function getCustomer(customerId: string) {
  const stripe = getStripe()
  
  try {
    return await stripe.customers.retrieve(customerId)
  } catch (error) {
    console.error('Error retrieving customer:', error)
    throw error
  }
}

// Utility function to format currency
export function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Stripe amounts are in cents
}

// Check if subscription is active and not expired
export function isSubscriptionActive(subscription: {
  status: string
  current_period_end: Date | string | null
}): boolean {
  if (subscription.status !== 'active') {
    return false
  }
  
  if (!subscription.current_period_end) {
    return false
  }
  
  const endDate = typeof subscription.current_period_end === 'string' 
    ? new Date(subscription.current_period_end)
    : subscription.current_period_end
    
  return endDate > new Date()
}