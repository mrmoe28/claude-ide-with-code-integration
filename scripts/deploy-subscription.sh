#!/bin/bash

# Automated Subscription Deployment Script for Claude Code IDE
# This script automates the deployment process using Vercel CLI, Stripe CLI, and Desktop Commander

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Main deployment function
deploy_subscription_system() {
    log_info "🚀 Starting automated subscription deployment..."
    
    # Step 1: Check prerequisites
    log_info "📋 Checking prerequisites..."
    
    if ! check_command "vercel"; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    if ! check_command "stripe"; then
        log_warning "Stripe CLI not found. Install from: https://stripe.com/docs/stripe-cli"
        log_warning "You'll need to set up Stripe products manually or install Stripe CLI"
    fi
    
    if ! check_command "curl"; then
        log_error "curl is required but not installed."
        exit 1
    fi
    
    # Step 2: Vercel login check
    log_info "🔐 Checking Vercel authentication..."
    if ! vercel whoami &> /dev/null; then
        log_info "Please log in to Vercel:"
        vercel login
    fi
    log_success "Vercel authentication confirmed"
    
    # Step 3: Deploy to Vercel
    log_info "🚀 Deploying to Vercel..."
    DEPLOYMENT_URL=$(vercel --prod --confirm | tail -1)
    if [ -z "$DEPLOYMENT_URL" ]; then
        log_error "Failed to get deployment URL"
        exit 1
    fi
    log_success "Deployed to: $DEPLOYMENT_URL"
    
    # Step 4: Set up Vercel Postgres database
    log_info "🗄️ Setting up Vercel Postgres database..."
    if vercel storage create database claude-ide-db --accept-terms; then
        log_success "Database created successfully"
        
        # Get database environment variables
        log_info "Retrieving database connection strings..."
        vercel env pull .env.production
        
        if [ -f .env.production ]; then
            log_success "Database environment variables retrieved"
        else
            log_warning "Could not retrieve database environment variables automatically"
            log_warning "Please add them manually from the Vercel dashboard"
        fi
    else
        log_warning "Database creation failed or already exists"
        log_info "Please check your Vercel dashboard and ensure database is created"
    fi
    
    # Step 5: Generate and set authentication secrets
    log_info "🔒 Setting up authentication secrets..."
    NEXTAUTH_SECRET=$(generate_secret)
    
    vercel env add NEXTAUTH_SECRET "$NEXTAUTH_SECRET" production
    vercel env add NEXTAUTH_URL "$DEPLOYMENT_URL" production
    
    log_success "Authentication secrets configured"
    
    # Step 6: Set up Stripe (if CLI available)
    if command -v stripe &> /dev/null; then
        log_info "💳 Setting up Stripe configuration..."
        
        # Check Stripe login
        if ! stripe config --list | grep -q "test_mode = true\|live_mode = false"; then
            log_info "Please log in to Stripe CLI:"
            stripe login
        fi
        
        # Create product
        log_info "Creating Stripe product..."
        PRODUCT_ID=$(stripe products create \
            --name "Claude Code IDE Pro" \
            --description "Professional subscription for Claude Code IDE" \
            --format json | jq -r '.id' 2>/dev/null || echo "")
        
        if [ -n "$PRODUCT_ID" ]; then
            log_success "Product created: $PRODUCT_ID"
            
            # Create price
            log_info "Creating price ($29/month)..."
            PRICE_ID=$(stripe prices create \
                --unit-amount 2900 \
                --currency usd \
                --recurring interval=month \
                --product "$PRODUCT_ID" \
                --format json | jq -r '.id' 2>/dev/null || echo "")
            
            if [ -n "$PRICE_ID" ]; then
                log_success "Price created: $PRICE_ID"
                vercel env add STRIPE_PRICE_ID "$PRICE_ID" production
            else
                log_error "Failed to create Stripe price"
            fi
        else
            log_error "Failed to create Stripe product"
        fi
        
        # Set up webhook endpoint
        log_info "Creating webhook endpoint..."
        WEBHOOK_ENDPOINT_ID=$(stripe webhook_endpoints create \
            --url "$DEPLOYMENT_URL/api/stripe/webhooks" \
            --enabled-events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed,checkout.session.completed \
            --format json | jq -r '.id' 2>/dev/null || echo "")
        
        if [ -n "$WEBHOOK_ENDPOINT_ID" ]; then
            log_success "Webhook endpoint created: $WEBHOOK_ENDPOINT_ID"
            
            # Get webhook secret
            WEBHOOK_SECRET=$(stripe webhook_endpoints retrieve "$WEBHOOK_ENDPOINT_ID" --format json | jq -r '.secret' 2>/dev/null || echo "")
            if [ -n "$WEBHOOK_SECRET" ]; then
                vercel env add STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET" production
                log_success "Webhook secret configured"
            fi
        else
            log_warning "Failed to create webhook endpoint automatically"
        fi
        
    else
        log_warning "Stripe CLI not available - you'll need to configure Stripe manually"
        log_info "Please follow these steps in the Stripe dashboard:"
        echo "  1. Create product 'Claude Code IDE Pro' at $29/month"
        echo "  2. Create webhook endpoint: $DEPLOYMENT_URL/api/stripe/webhooks"
        echo "  3. Add required events: customer.subscription.*, invoice.payment_*"
        echo "  4. Copy Price ID and Webhook Secret to Vercel environment variables"
    fi
    
    # Step 7: Set up remaining environment variables
    log_info "⚙️ Setting up remaining environment variables..."
    
    # App configuration
    vercel env add NEXT_PUBLIC_APP_NAME "Claude Code IDE" production
    vercel env add NEXT_PUBLIC_SUBSCRIPTION_PRICE "29.00" production
    vercel env add NEXT_PUBLIC_SUBSCRIPTION_CURRENCY "USD" production
    
    # Prompt for Stripe keys (these need to be entered manually for security)
    echo ""
    log_warning "⚠️ MANUAL INPUT REQUIRED:"
    echo "Please add these environment variables manually in the Vercel dashboard:"
    echo "  - STRIPE_SECRET_KEY (from Stripe dashboard)"
    echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (from Stripe dashboard)"
    echo ""
    read -p "Press Enter after you've added the Stripe keys to continue..."
    
    # Step 8: Redeploy with new environment variables
    log_info "🔄 Redeploying with updated environment variables..."
    vercel --prod --confirm > /dev/null
    log_success "Redeployment completed"
    
    # Step 9: Initialize database
    log_info "🗄️ Initializing database schema..."
    sleep 10  # Wait for deployment to propagate
    
    if curl -X POST "$DEPLOYMENT_URL/api/db/init" -f -s > /dev/null; then
        log_success "Database initialized successfully"
    else
        log_warning "Database initialization may have failed. Please check manually:"
        echo "  Visit: $DEPLOYMENT_URL/api/db/init"
    fi
    
    # Step 10: Run health checks
    log_info "🏥 Running health checks..."
    
    # Test API endpoints
    endpoints=("/api/stripe/checkout" "/api/stripe/portal" "/api/stripe/webhooks")
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$DEPLOYMENT_URL$endpoint" > /dev/null; then
            log_success "✓ $endpoint"
        else
            log_warning "✗ $endpoint (may need authentication)"
        fi
    done
    
    # Step 11: Final success message and next steps
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 DEPLOYMENT SUMMARY:"
    echo "  🌐 App URL: $DEPLOYMENT_URL"
    echo "  💾 Database: Initialized"
    echo "  🔐 Auth: Configured"
    echo "  💳 Stripe: $([ -n "$PRICE_ID" ] && echo "Automated" || echo "Manual setup required")"
    echo ""
    echo "🔧 NEXT STEPS:"
    echo "  1. Visit $DEPLOYMENT_URL to test the application"
    echo "  2. Create a test user account"
    echo "  3. Test the subscription flow"
    if [ -z "$PRICE_ID" ]; then
        echo "  4. Complete Stripe setup manually (see instructions above)"
    fi
    echo "  5. Switch to Stripe live mode when ready for production"
    echo ""
    log_info "📚 For troubleshooting, check: $DEPLOYMENT_URL/SUBSCRIPTION_DEPLOYMENT.md"
}

# Run the deployment
deploy_subscription_system