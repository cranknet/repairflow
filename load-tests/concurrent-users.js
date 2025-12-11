/**
 * RepairFlow Load Test - Concurrent Users
 * 
 * k6 script for testing application under load.
 * 
 * Installation: 
 *   brew install k6  (macOS)
 *   choco install k6 (Windows)
 *   
 * Usage:
 *   k6 run load-tests/concurrent-users.js
 *   k6 run --vus 50 --duration 5m load-tests/concurrent-users.js
 *   
 * Environment Variables:
 *   BASE_URL - Target URL (default: http://localhost:3000)
 *   
 * Reports:
 *   k6 run --out json=results.json load-tests/concurrent-users.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const ticketCreationDuration = new Trend('ticket_creation_duration');
const healthCheckDuration = new Trend('health_check_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test scenarios
export const options = {
    scenarios: {
        // Scenario 1: Baseline health checks
        health_checks: {
            executor: 'constant-vus',
            vus: 5,
            duration: '2m',
            exec: 'healthCheck',
            tags: { scenario: 'health' },
        },

        // Scenario 2: Concurrent users accessing tickets
        concurrent_users: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 10 },  // Ramp up to 10 users
                { duration: '3m', target: 25 },  // Ramp up to 25 users
                { duration: '2m', target: 50 },  // Peak at 50 concurrent users
                { duration: '2m', target: 25 },  // Ramp down
                { duration: '1m', target: 0 },   // Complete ramp down
            ],
            exec: 'userJourney',
            tags: { scenario: 'concurrent_users' },
        },

        // Scenario 3: Spike test
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '10m',  // Start after main test
            stages: [
                { duration: '10s', target: 100 }, // Sudden spike
                { duration: '1m', target: 100 },  // Hold spike
                { duration: '10s', target: 0 },   // Quick drop
            ],
            exec: 'spikeLoad',
            tags: { scenario: 'spike' },
        },
    },

    thresholds: {
        // Response time thresholds
        http_req_duration: ['p(95)<500', 'p(99)<1000'],

        // Error rate threshold
        errors: ['rate<0.05'], // Less than 5% error rate

        // Custom metric thresholds
        health_check_duration: ['p(95)<100'],
        ticket_creation_duration: ['p(95)<2000'],
    },
};

// Health check function
export function healthCheck() {
    const startTime = Date.now();

    const res = http.get(`${BASE_URL}/api/health`);

    healthCheckDuration.add(Date.now() - startTime);

    const success = check(res, {
        'health check status is 200': (r) => r.status === 200,
        'health check returns ok': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.status === 'ok';
            } catch {
                return false;
            }
        },
    });

    errorRate.add(!success);
    sleep(1);
}

// User journey simulation
export function userJourney() {
    group('Authentication', () => {
        // Check login page loads
        const loginRes = http.get(`${BASE_URL}/login`);
        check(loginRes, {
            'login page loads': (r) => r.status === 200,
        });
        sleep(0.5);
    });

    group('Dashboard', () => {
        // Dashboard access (will redirect to login if not authenticated)
        const dashboardRes = http.get(`${BASE_URL}/dashboard`);
        check(dashboardRes, {
            'dashboard accessible': (r) => r.status === 200 || r.status === 302,
        });
        sleep(1);
    });

    group('Tickets List', () => {
        // Tickets list
        const ticketsRes = http.get(`${BASE_URL}/tickets`);
        check(ticketsRes, {
            'tickets page loads': (r) => r.status === 200 || r.status === 302,
        });
        sleep(1);
    });

    group('API Health', () => {
        // API health check
        const healthRes = http.get(`${BASE_URL}/api/health`);
        const success = check(healthRes, {
            'api health returns 200': (r) => r.status === 200,
        });
        errorRate.add(!success);
    });

    // Simulate user think time
    sleep(Math.random() * 3 + 1);
}

// Spike load function
export function spikeLoad() {
    const targets = [
        '/api/health',
        '/api/ready',
        '/api/live',
        '/login',
        '/tickets',
    ];

    const target = targets[Math.floor(Math.random() * targets.length)];
    const res = http.get(`${BASE_URL}${target}`);

    const success = check(res, {
        'spike request successful': (r) => r.status === 200 || r.status === 302,
        'spike request not rate limited': (r) => r.status !== 429,
    });

    errorRate.add(!success);
    sleep(0.1);
}

// Setup function (runs once before tests)
export function setup() {
    // Verify target is reachable
    const res = http.get(`${BASE_URL}/api/health`);
    if (res.status !== 200) {
        console.error(`Target ${BASE_URL} is not reachable. Status: ${res.status}`);
    }

    return {
        baseUrl: BASE_URL,
        startTime: new Date().toISOString(),
    };
}

// Teardown function (runs once after tests)
export function teardown(data) {
    console.log(`Load test completed. Started at: ${data.startTime}`);
}
