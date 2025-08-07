# Subscription Deployment Guide for Vercel

This guide will help you deploy the Claude Code IDE with subscription functionality to Vercel.

## Prerequisites

1. **Vercel Account** - Create account at [vercel.com](https://vercel.com)
2. **Stripe Account** - Create account at [stripe.com](https://stripe.com)
3. **Database** - We'll use Vercel PostgreSQL

## Step 1: Set up Vercel PostgreSQL Database

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new PostgreSQL database
4. Copy all the database environment variables provided by Vercel

## Step 2: Configure Stripe

### Create Product and Price
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Claude Code IDE Pro"
4. Pricing: $29.00 monthly, recurring
5. **Important**: Uncheck "Offer a free trial"
6. Save and copy the Price ID (starts with `price_`)

### Set up Webhook Endpoint
1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-vercel-domain.vercel.app/api/stripe/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook signing secret (starts with `whsec_`)

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

### Database (from Vercel PostgreSQL)
```
# Recommended for most uses
DATABASE_URL=postgres://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Parameters for constructing your own connection string
PGHOST=ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech
PGHOST_UNPOOLED=ep-wild-dew-adq7m58t.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_OzG3NqM6RXDd

# Parameters for Vercel Postgres Templates
POSTGRES_URL=postgres://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_OzG3NqM6RXDd
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_OzG3NqM6RXDd@ep-wild-dew-adq7m58t-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=06bbc6db-989b-4309-9ead-bb96cb15ee6d
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_545z1hyp086z3b4phzvrydt047fd12ctnrv81fnd0p1ng
STACK_SECRET_SERVER_KEY=ssk_g6ehjra38q2pv58p5wg26mcz687fk7wejz06m0676efw0
```

### Authentication
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
```

### Stripe (Replace with your actual Stripe keys)
```
STRIPE_SECRET_KEY=sk_test_... (use sk_live_ for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (use pk_live_ for production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### AI Configuration (existing)
```
AI_PROVIDER=perplexity
AI_MODEL=llama-3.1-sonar-small-128k-online
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_API_KEY=pplx-...
PERPLEXITY_BASE_URL=https://api.perplexity.ai
```

### App Configuration
```
NEXT_PUBLIC_APP_NAME=Claude Code IDE
NEXT_PUBLIC_SUBSCRIPTION_PRICE=29.00
NEXT_PUBLIC_SUBSCRIPTION_CURRENCY=USD
```

### Authentication
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
```

### Stripe
```
STRIPE_SECRET_KEY=sk_test_... (use sk_live_ for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (use pk_live_ for production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### AI Configuration (existing)
```
AI_PROVIDER=perplexity
AI_MODEL=llama-3.1-sonar-small-128k-online
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_API_KEY=pplx-...
PERPLEXITY_BASE_URL=https://api.perplexity.ai
```

### App Configuration
```
NEXT_PUBLIC_APP_NAME=Claude Code IDE
NEXT_PUBLIC_SUBSCRIPTION_PRICE=29.00
NEXT_PUBLIC_SUBSCRIPTION_CURRENCY=USD
```

## Step 4: Deploy to Vercel

### Option A: Deploy from GitHub
1. Push your code to GitHub
2. Connect GitHub repository to Vercel
3. Deploy will start automatically

### Option B: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

## Step 5: Initialize Database

After deployment, initialize the database by visiting:
```
https://your-vercel-domain.vercel.app/api/db/init
```

Or make a POST request:
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/db/init
```

## Step 6: Update Stripe Webhook URL

1. Go back to Stripe Dashboard → Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://your-vercel-domain.vercel.app/api/stripe/webhooks`
4. Save changes

## Step 7: Test the Integration

### Test in Development Mode (Stripe Test Mode)
1. Create a test user account
2. Go to pricing page
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout process
5. Verify subscription status updates

### Test Webhook Handling
Use Stripe CLI to test webhooks:
```bash
stripe listen --forward-to https://your-vercel-domain.vercel.app/api/stripe/webhooks
stripe trigger checkout.session.completed
```

## Step 8: Production Checklist

Before going live with real payments:

### Stripe Configuration
- [ ] Switch to Stripe Live mode
- [ ] Update `STRIPE_SECRET_KEY` to live key (`sk_live_...`)
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key (`pk_live_...`)
- [ ] Update webhook endpoint URL to production domain
- [ ] Test with real payment methods

### Security Review
- [ ] Verify all environment variables are set correctly
- [ ] Test webhook signature verification
- [ ] Verify HTTPS is enforced
- [ ] Test subscription cancellation flow
- [ ] Test payment failure scenarios

### Monitoring
- [ ] Set up Vercel analytics
- [ ] Monitor Stripe webhook delivery
- [ ] Set up error tracking (optional)

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify all database environment variables are correct
- Ensure database is accessible from Vercel

**Webhook Verification Failed**
- Check webhook signing secret matches Stripe dashboard
- Verify webhook URL is correct
- Check Vercel function logs

**Checkout Session Creation Failed**
- Verify Stripe keys are correct
- Check Price ID exists in Stripe
- Verify customer creation

**Authentication Issues**
- Verify `NEXTAUTH_SECRET` is set and long enough
- Check `NEXTAUTH_URL` matches your domain

### Debug Commands

Check API endpoints:
```bash
# Health checks
curl https://your-domain.vercel.app/api/stripe/checkout
curl https://your-domain.vercel.app/api/stripe/portal  
curl https://your-domain.vercel.app/api/stripe/webhooks

# Database initialization
curl -X POST https://your-domain.vercel.app/api/db/init
```

### Vercel Function Logs
Monitor logs in Vercel dashboard → Functions tab to debug issues.

## Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **NextAuth**: [next-auth.js.org](https://next-auth.js.org)

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** to prevent fake events
3. **Use HTTPS** for all webhook endpoints
4. **Implement rate limiting** for API endpoints (optional)
5. **Monitor for suspicious activity** in Stripe dashboard

---

Your Claude Code IDE with subscription functionality is now ready for production! 🚀