// API Stress Testing Script
// Run with: k6 run tests/load/api-stress-test.js

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp-up to 100 RPS
    { duration: '3m', target: 500 },   // Ramp-up to 500 RPS
    { duration: '5m', target: 1000 },  // Sustained load at 1000 RPS
    { duration: '2m', target: 1500 },  // Spike to 1500 RPS
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'],  // 99% below 3s
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
    errors: ['rate<0.05'],              // Less than 5% custom errors
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

const scenarios = [
  { weight: 40, path: '/api/products', method: 'GET' },
  { weight: 20, path: '/api/products?limit=20&page=2', method: 'GET' },
  { weight: 15, path: '/api/categories', method: 'GET' },
  { weight: 10, path: '/api/search/autocomplete?q=test', method: 'GET' },
  { weight: 10, path: '/api/cart', method: 'GET' },
  { weight: 5, path: '/api/orders', method: 'GET' },
]

export default function () {
  // Weighted random scenario selection
  const random = Math.random() * 100
  let cumulative = 0
  let selectedScenario

  for (const scenario of scenarios) {
    cumulative += scenario.weight
    if (random < cumulative) {
      selectedScenario = scenario
      break
    }
  }

  // Execute request
  const response = http.request(
    selectedScenario.method,
    `${BASE_URL}${selectedScenario.path}`
  )

  // Validation
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has content': (r) => r.body.length > 0,
  })

  if (!success) {
    errorRate.add(1)
  }

  // Random think time (0.1-1s)
  sleep(Math.random() * 0.9 + 0.1)
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, options) {
  const indent = options.indent || ''
  const enableColors = options.enableColors || false

  let summary = `\n${indent}Load Test Summary:\n`
  summary += `${indent}==================\n\n`

  // Requests
  const httpReqs = data.metrics.http_reqs.values.count
  const httpReqDuration = data.metrics.http_req_duration.values
  summary += `${indent}Total Requests: ${httpReqs}\n`
  summary += `${indent}Request Duration:\n`
  summary += `${indent}  - Avg: ${httpReqDuration.avg.toFixed(2)}ms\n`
  summary += `${indent}  - P95: ${httpReqDuration['p(95)'].toFixed(2)}ms\n`
  summary += `${indent}  - P99: ${httpReqDuration['p(99)'].toFixed(2)}ms\n\n`

  // Error rate
  const errorRate = data.metrics.http_req_failed.values.rate
  summary += `${indent}Error Rate: ${(errorRate * 100).toFixed(2)}%\n\n`

  // Pass/Fail
  const thresholdsPassed = Object.values(data.metrics)
    .filter(m => m.thresholds)
    .every(m => Object.values(m.thresholds).every(t => t.ok))

  summary += `${indent}Test Result: ${thresholdsPassed ? '✅ PASSED' : '❌ FAILED'}\n`

  return summary
}
