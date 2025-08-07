# ⚡ Quick Deploy Guide - Automated Subscription Setup

Deploy your Claude Code IDE with $29/month subscriptions in **5-10 minutes** using our automated scripts!

## 🎯 One-Command Deployment

### Prerequisites (One-time setup)
1. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
2. **Stripe Account**: [Sign up at stripe.com](https://stripe.com)
3. **GitHub**: Push your code to a GitHub repository

### 🚀 Automated Deployment

1. **Run the deployment script:**
   ```bash
   cd /Users/ekodevapps/Desktop/claude-ide-with-code-integration-main
   ./scripts/deploy-subscription.sh
   ```

2. **Follow the prompts:**
   - Login to Vercel when prompted
   - Login to Stripe CLI when prompted (optional but recommended)
   - Add your Stripe keys in Vercel dashboard when prompted

3. **Test your deployment:**
   ```bash
   ./scripts/test-deployment.sh https://your-app.vercel.app
   ```

That's it! 🎉

---

## 🛠️ What the Script Does Automatically

### ✅ Vercel Setup
- Deploys your app to Vercel
- Creates PostgreSQL database
- Sets up all environment variables
- Configures proper function timeouts

### ✅ Stripe Integration  
- Creates "$29/month" product (if Stripe CLI available)
- Sets up webhook endpoints
- Configures subscription pricing
- Handles all API integrations

### ✅ Database Configuration
- Initializes database schema
- Creates all necessary tables
- Sets up connection pooling
- Tests database connectivity

### ✅ Security & Performance
- Configures security headers
- Sets up authentication secrets
- Optimizes for serverless functions
- Implements proper error handling

---

## 🎪 Manual Steps (Only if needed)

If Stripe CLI isn't available, you'll need to manually:

### 1. Create Stripe Product
- Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
- Click "Add product"
- Name: "Claude Code IDE Pro"
- Price: $29.00/month, recurring
- ⚠️ **Uncheck "Offer a free trial"**

### 2. Set up Webhook
- Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- Add endpoint: `https://your-app.vercel.app/api/stripe/webhooks`
- Select events: `customer.subscription.*`, `invoice.payment.*`

### 3. Add Environment Variables
Add these to Vercel dashboard:
```
STRIPE_SECRET_KEY=sk_test_... (your secret key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (your publishable key)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook settings)
STRIPE_PRICE_ID=price_... (from product creation)
```

---

## 🧪 Testing Your Deployment

### Automated Testing
```bash
./scripts/test-deployment.sh https://your-app.vercel.app
```

### Manual Testing Checklist
- [ ] Visit your app URL
- [ ] Create a user account
- [ ] Navigate to pricing page
- [ ] Test subscription with card `4242 4242 4242 4242`
- [ ] Verify access to protected features
- [ ] Test billing portal access

---

## 🚨 Troubleshooting

### Common Issues

**"Database connection failed"**
```bash
# Check database setup
curl https://your-app.vercel.app/api/db/init
```

**"Stripe checkout failed"**
- Verify Stripe keys are added to Vercel
- Check webhook endpoint is accessible
- Ensure Price ID is correct

**"Authentication not working"**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain

### Get Help
- Run the test script for detailed diagnostics
- Check Vercel function logs in dashboard
- Review webhook delivery in Stripe dashboard

---

## 🚀 Going Live (Production)

When ready for real payments:

1. **Switch to Stripe Live Mode**
   ```bash
   # Update environment variables in Vercel dashboard
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Update webhook endpoint** in Stripe dashboard
3. **Test with real payment methods**
4. **Monitor in production** via Vercel Analytics

---

## 📊 Success Metrics

After deployment, you should see:
- ✅ App loads at your Vercel URL
- ✅ User registration/login works
- ✅ Pricing page shows $29/month
- ✅ Subscription flow completes
- ✅ Protected features are gated
- ✅ Billing portal accessible

---

## 🎉 You're Done!

Your Claude Code IDE with subscription functionality is now live and ready to accept payments!

**Key URLs:**
- 🌐 **App**: https://your-app.vercel.app  
- 💳 **Pricing**: https://your-app.vercel.app/pricing
- 🏠 **Dashboard**: https://your-app.vercel.app/dashboard

**Next Steps:**
- Share with beta users
- Monitor usage and errors
- Scale as needed
- Add more features!

---

*Need help? The automated scripts include detailed logging and error messages to guide you through any issues.*