// Load Testing Script for Checkout Process
// Run with: k6 run tests/load/checkout-load-test.js

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const checkoutDuration = new Trend('checkout_duration')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up to 10 users
    { duration: '1m', target: 50 },    // Ramp-up to 50 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 50 },    // Ramp-down to 50 users
    { duration: '30s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.1'],              // Custom error rate below 10%
    checkout_duration: ['p(99)<5000'], // 99% of checkouts below 5s
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Test data
const testProducts = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
]

export default function () {
  const startTime = Date.now()

  // 1. Browse products
  const productsResponse = http.get(`${BASE_URL}/api/products?limit=10`)
  check(productsResponse, {
    'products loaded successfully': (r) => r.status === 200,
    'products response time OK': (r) => r.timings.duration < 1000,
  })

  if (productsResponse.status !== 200) {
    errorRate.add(1)
    return
  }

  sleep(1)

  // 2. View product detail
  const productId = testProducts[Math.floor(Math.random() * testProducts.length)]
  const productResponse = http.get(`${BASE_URL}/api/products/${productId}`)
  check(productResponse, {
    'product detail loaded': (r) => r.status === 200,
  })

  sleep(2)

  // 3. Add to cart
  const addToCartResponse = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify({
      productId,
      quantity: 1,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  check(addToCartResponse, {
    'product added to cart': (r) => r.status === 200 || r.status === 201,
  })

  if (addToCartResponse.status >= 400) {
    errorRate.add(1)
  }

  sleep(1)

  // 4. View cart
  const cartResponse = http.get(`${BASE_URL}/api/cart`)
  check(cartResponse, {
    'cart loaded': (r) => r.status === 200,
  })

  sleep(2)

  // 5. Checkout (simulation - don't actually process payment)
  const checkoutResponse = http.post(
    `${BASE_URL}/api/checkout/preview`,
    JSON.stringify({
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345',
        country: 'US',
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const checkoutSuccess = check(checkoutResponse, {
    'checkout preview successful': (r) => r.status === 200,
    'checkout response time OK': (r) => r.timings.duration < 3000,
  })

  if (!checkoutSuccess) {
    errorRate.add(1)
  }

  // Record checkout duration
  const duration = Date.now() - startTime
  checkoutDuration.add(duration)

  sleep(3)
}

// Setup function - runs once per VU
export function setup() {
  console.log('Starting load test...')
  console.log(`Target URL: ${BASE_URL}`)
  console.log('Test will simulate user browsing and checkout flow')
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Load test completed!')
}
