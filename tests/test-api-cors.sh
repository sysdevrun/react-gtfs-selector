#!/usr/bin/env bash
# Test: Verify that api.mobilitydatabase.org allows CORS from any origin
# This confirms we can call the API directly from the browser without a proxy.

set -uo pipefail

API_URL="https://api.mobilitydatabase.org/v1/gtfs_feeds?limit=1&offset=0"
PASS=0
FAIL=0

get_headers() {
  curl -s -o /dev/null -D - -X OPTIONS \
    "$API_URL" \
    -H "Origin: $1" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    2>/dev/null
}

extract_header() {
  # Extract last occurrence of a header (to skip HTTP/1.1 upgrade response)
  echo "$1" | grep -i "$2" | tail -1 | tr -d '\r' | sed 's/^[^:]*: //'
}

test_cors_origin() {
  local origin="$1"
  local label="$2"
  local headers
  headers=$(get_headers "$origin")

  local allow_origin
  allow_origin=$(extract_header "$headers" "access-control-allow-origin")

  if [ "$allow_origin" = "$origin" ]; then
    echo "PASS [$label]: Origin '$origin' is allowed (reflected back)"
    ((PASS++))
  else
    echo "FAIL [$label]: Expected '$origin', got '$allow_origin'"
    ((FAIL++))
  fi
}

test_cors_credentials() {
  local headers
  headers=$(get_headers "http://localhost:3000")

  local creds
  creds=$(extract_header "$headers" "access-control-allow-credentials")

  if [ "$creds" = "true" ]; then
    echo "PASS [credentials]: Access-Control-Allow-Credentials is 'true'"
    ((PASS++))
  else
    echo "FAIL [credentials]: Expected 'true', got '$creds'"
    ((FAIL++))
  fi
}

test_cors_methods() {
  local headers
  headers=$(get_headers "http://localhost:3000")

  local methods
  methods=$(extract_header "$headers" "access-control-allow-methods")

  if echo "$methods" | grep -q "GET"; then
    echo "PASS [methods]: GET is in allowed methods ($methods)"
    ((PASS++))
  else
    echo "FAIL [methods]: GET not found in '$methods'"
    ((FAIL++))
  fi
}

echo "=== Mobility Database API CORS Tests ==="
echo ""

# Test various origins to confirm the API reflects any origin
test_cors_origin "http://localhost:3000" "localhost"
test_cors_origin "http://localhost:5173" "vite-dev"
test_cors_origin "https://example.com" "example.com"
test_cors_origin "https://arbitrary-domain.test" "arbitrary"

# Test that credentials are allowed
test_cors_credentials

# Test that GET method is allowed
test_cors_methods

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
