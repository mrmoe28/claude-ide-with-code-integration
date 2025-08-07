#!/bin/bash

# Automated Testing Script for Subscription Deployment
# Tests all critical endpoints and functionality after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get deployment URL
if [ -z "$1" ]; then
    log_error "Usage: $0 <deployment-url>"
    echo "Example: $0 https://your-app.vercel.app"
    exit 1
fi

DEPLOYMENT_URL="$1"
FAILED_TESTS=0
TOTAL_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Testing: $test_name"
    
    if eval "$test_command"; then
        log_success "✓ $test_name"
        return 0
    else
        log_error "✗ $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# HTTP test helper
test_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$DEPLOYMENT_URL$endpoint")
    
    if [ "$response_code" = "$expected_status" ]; then
        return 0
    else
        log_warning "Expected $expected_status, got $response_code for $endpoint"
        return 1
    fi
}

# Test with JSON data
test_endpoint_with_json() {
    local endpoint="$1"
    local json_data="$2"
    local expected_status="${3:-200}"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$json_data" \
        "$DEPLOYMENT_URL$endpoint")
    
    if [ "$response_code" = "$expected_status" ]; then
        return 0
    else
        log_warning "Expected $expected_status, got $response_code for $endpoint"
        return 1
    fi
}

# Main testing suite
main() {
    log_info "🧪 Starting deployment tests for: $DEPLOYMENT_URL"
    echo ""
    
    # Test 1: Basic app availability
    run_test "App Homepage" "test_endpoint '/'"
    
    # Test 2: Auth pages
    run_test "Sign-in Page" "test_endpoint '/auth/signin'"
    run_test "Pricing Page" "test_endpoint '/pricing'"
    run_test "Dashboard Page" "test_endpoint '/dashboard'"
    
    # Test 3: API Health Checks
    run_test "NextAuth API" "test_endpoint '/api/auth/providers'"
    run_test "Database Init Endpoint (GET)" "test_endpoint '/api/db/init'"
    
    # Test 4: Stripe API Endpoints (should return 401/400 without auth)
    run_test "Stripe Checkout Endpoint" "test_endpoint '/api/stripe/checkout' 'POST' '401'"
    run_test "Stripe Portal Endpoint" "test_endpoint '/api/stripe/portal' 'POST' '401'"
    run_test "Stripe Webhooks Endpoint" "test_endpoint '/api/stripe/webhooks'"
    
    # Test 5: Database Connection
    log_info "Testing database connection..."
    DB_TEST_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/db/init")
    if echo "$DB_TEST_RESPONSE" | grep -q "success.*true\|connection.*successful"; then
        log_success "✓ Database Connection"
    else
        log_error "✗ Database Connection"
        log_warning "Response: $DB_TEST_RESPONSE"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 6: Environment Variables Check
    log_info "Testing environment configuration..."
    ENV_ISSUES=0
    
    # Check if app loads without errors (indicates env vars are set)
    HOMEPAGE_CONTENT=$(curl -s "$DEPLOYMENT_URL/")
    if echo "$HOMEPAGE_CONTENT" | grep -q "error\|Error\|500"; then
        log_warning "Homepage shows errors - check environment variables"
        ENV_ISSUES=$((ENV_ISSUES + 1))
    fi
    
    # Check pricing page for dynamic content
    PRICING_CONTENT=$(curl -s "$DEPLOYMENT_URL/pricing")
    if echo "$PRICING_CONTENT" | grep -q "\$29"; then
        log_success "✓ Pricing configuration loaded"
    else
        log_warning "Pricing page may not be loading correctly"
        ENV_ISSUES=$((ENV_ISSUES + 1))
    fi
    
    if [ $ENV_ISSUES -eq 0 ]; then
        log_success "✓ Environment Configuration"
    else
        log_error "✗ Environment Configuration ($ENV_ISSUES issues)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 7: Security Headers
    log_info "Testing security headers..."
    SECURITY_HEADERS=$(curl -I -s "$DEPLOYMENT_URL/")
    SECURITY_ISSUES=0
    
    if ! echo "$SECURITY_HEADERS" | grep -iq "x-frame-options"; then
        log_warning "Missing X-Frame-Options header"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if ! echo "$SECURITY_HEADERS" | grep -iq "x-content-type-options"; then
        log_warning "Missing X-Content-Type-Options header"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if [ $SECURITY_ISSUES -eq 0 ]; then
        log_success "✓ Security Headers"
    else
        log_error "✗ Security Headers ($SECURITY_ISSUES missing)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 8: Performance Check
    log_info "Testing page load performance..."
    LOAD_TIME=$(curl -w "%{time_total}" -o /dev/null -s "$DEPLOYMENT_URL/")
    LOAD_TIME_MS=$(echo "$LOAD_TIME * 1000" | bc | cut -d. -f1)
    
    if [ "$LOAD_TIME_MS" -lt 3000 ]; then
        log_success "✓ Page Load Performance (${LOAD_TIME_MS}ms)"
    elif [ "$LOAD_TIME_MS" -lt 5000 ]; then
        log_warning "⚠ Page Load Performance (${LOAD_TIME_MS}ms - acceptable but could be faster)"
    else
        log_error "✗ Page Load Performance (${LOAD_TIME_MS}ms - too slow)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 9: Mobile Responsiveness
    log_info "Testing mobile responsiveness..."
    MOBILE_CONTENT=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" "$DEPLOYMENT_URL/")
    if echo "$MOBILE_CONTENT" | grep -q "viewport"; then
        log_success "✓ Mobile Responsiveness"
    else
        log_warning "⚠ Mobile viewport meta tag may be missing"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Results Summary
    echo ""
    echo "================================"
    echo "🧪 TEST RESULTS SUMMARY"
    echo "================================"
    
    PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: $SUCCESS_RATE%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "🎉 All tests passed! Deployment is ready."
        echo ""
        echo "✅ DEPLOYMENT CHECKLIST:"
        echo "  - App is accessible"
        echo "  - Database is connected"
        echo "  - API endpoints are responding"
        echo "  - Security headers are configured"
        echo "  - Performance is acceptable"
        echo ""
        echo "🔧 NEXT STEPS:"
        echo "  1. Test user registration and login"
        echo "  2. Test subscription flow with Stripe test cards"
        echo "  3. Verify webhook handling"
        echo "  4. Monitor error logs in Vercel dashboard"
        echo ""
        return 0
    else
        log_error "❌ $FAILED_TESTS tests failed. Please review and fix issues."
        echo ""
        echo "🔧 TROUBLESHOOTING TIPS:"
        
        if echo "$DB_TEST_RESPONSE" | grep -q "error\|Error"; then
            echo "  - Database: Check connection strings in Vercel env vars"
        fi
        
        if [ $ENV_ISSUES -gt 0 ]; then
            echo "  - Environment: Verify all required env vars are set in Vercel"
        fi
        
        echo "  - Check Vercel function logs for detailed error messages"
        echo "  - Ensure all dependencies are installed correctly"
        echo "  - Verify domain and SSL certificate are working"
        echo ""
        return 1
    fi
}

# Run the tests
main