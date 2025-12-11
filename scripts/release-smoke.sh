#!/bin/bash
# ===========================================
# RepairFlow Release Smoke Test Script
# ===========================================
# Usage: ./scripts/release-smoke.sh [BASE_URL]
# Example: ./scripts/release-smoke.sh http://localhost:3000

set -e

BASE_URL=${1:-"http://localhost:3000"}
FAILED=0
PASSED=0

echo "🔍 Running Release Smoke Tests"
echo "   Target: $BASE_URL"
echo "   Time: $(date)"
echo "========================================"

# Helper function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status" = "$expected_code" ]; then
        echo "✅ PASS: $name (HTTP $status)"
        ((PASSED++))
    else
        echo "❌ FAIL: $name (Expected $expected_code, got $status)"
        ((FAILED++))
    fi
}

# Helper function to check JSON response
check_json() {
    local name=$1
    local url=$2
    local json_field=$3
    local expected_value=$4
    
    local response=$(curl -s "$url")
    local actual_value=$(echo "$response" | grep -o "\"$json_field\":\"[^\"]*\"" | cut -d'"' -f4)
    
    if [ "$actual_value" = "$expected_value" ]; then
        echo "✅ PASS: $name ($json_field=$actual_value)"
        ((PASSED++))
    else
        echo "❌ FAIL: $name (Expected $json_field=$expected_value, got $actual_value)"
        ((FAILED++))
    fi
}

echo ""
echo "📡 Health Endpoints"
echo "----------------------------------------"
check_endpoint "Health Check" "$BASE_URL/api/health"
check_endpoint "Readiness Probe" "$BASE_URL/api/ready"
check_endpoint "Liveness Probe" "$BASE_URL/api/live"

echo ""
echo "🔐 Authentication"
echo "----------------------------------------"
check_endpoint "Login Page Loads" "$BASE_URL/login"

echo ""
echo "📋 Core Pages"
echo "----------------------------------------"
check_endpoint "Dashboard Redirect" "$BASE_URL/" "200"
check_endpoint "Tickets Page" "$BASE_URL/tickets"

echo ""
echo "🌍 Translations"
echo "----------------------------------------"
check_endpoint "English Translations" "$BASE_URL/locales/en.json"
check_endpoint "French Translations" "$BASE_URL/locales/fr.json"
check_endpoint "Arabic Translations" "$BASE_URL/locales/ar.json"

echo ""
echo "🖥️ Static Assets"
echo "----------------------------------------"
check_endpoint "PWA Manifest" "$BASE_URL/manifest.json"

echo ""
echo "========================================"
echo "📊 Results: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Smoke tests FAILED"
    exit 1
else
    echo "✅ All smoke tests PASSED"
    exit 0
fi
