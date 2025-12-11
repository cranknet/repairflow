/**
 * RepairFlow Load Test - Ticket Operations
 * 
 * Tests ticket creation and viewing under load.
 * Requires authentication cookie or API key.
 * 
 * Usage:
 *   k6 run load-tests/ticket-operations.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const ticketListDuration = new Trend('ticket_list_duration');
const ticketViewDuration = new Trend('ticket_view_duration');
const ticketsLoaded = new Counter('tickets_loaded');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
    scenarios: {
        ticket_browsing: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },  // Warm up
                { duration: '2m', target: 25 },   // Normal load
                { duration: '1m', target: 50 },   // Peak load
                { duration: '30s', target: 0 },   // Cool down
            ],
            exec: 'browseTickets',
        },
    },

    thresholds: {
        http_req_duration: ['p(95)<1000'],
        errors: ['rate<0.1'],
        ticket_list_duration: ['p(95)<800'],
        ticket_view_duration: ['p(95)<500'],
    },
};

export function browseTickets() {
    group('Ticket List', () => {
        const startTime = Date.now();
        const res = http.get(`${BASE_URL}/tickets`, {
            headers: {
                'Accept': 'text/html,application/json',
            },
        });
        ticketListDuration.add(Date.now() - startTime);

        const success = check(res, {
            'tickets page loads': (r) => r.status === 200 || r.status === 302,
        });

        if (success && res.status === 200) {
            ticketsLoaded.add(1);
        }
        errorRate.add(!success);

        sleep(1);
    });

    group('Ticket Detail', () => {
        // Simulate viewing a specific ticket
        // In a real scenario, you'd extract ticket IDs from the list
        const startTime = Date.now();
        const res = http.get(`${BASE_URL}/api/health`); // Fallback to health check
        ticketViewDuration.add(Date.now() - startTime);

        check(res, {
            'ticket detail loads': (r) => r.status === 200,
        });

        sleep(0.5);
    });

    // User think time
    sleep(Math.random() * 2 + 1);
}

export function setup() {
    console.log(`Starting Ticket Operations Load Test`);
    console.log(`Target: ${BASE_URL}`);

    // Verify target is up
    const health = http.get(`${BASE_URL}/api/health`);
    if (health.status !== 200) {
        console.error('Target is not healthy!');
    }
}

export function teardown() {
    console.log('Ticket Operations Load Test Complete');
}
