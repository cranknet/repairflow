/**
 * RepairFlow Load Test - Ticket Creation (with Image "Upload")
 * 
 * Tests ticket creation endpoint including large payloads (simulating base64 images).
 * Requires valid authentication cookie.
 * 
 * Usage:
 *   k6 run --env AUTH_COOKIE="<next-auth.session-token>" load-tests/create-ticket.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const ticketCreationDuration = new Trend('ticket_creation_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_COOKIE = __ENV.AUTH_COOKIE; // Required: session token

// Mock Data
const MOCK_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDA...'; // Simplified for test
// In real test, use a larger string to simulate actual load:
const LARGE_MOCK_IMAGE = 'data:image/png;base64,' + 'a'.repeat(50 * 1024); // ~50KB image

export const options = {
    scenarios: {
        create_tickets: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 5 },   // Ramp up
                { duration: '1m', target: 10 },   // Sustained load
                { duration: '30s', target: 0 },   // Ramp down
            ],
            exec: 'createTicket',
        },
    },
    thresholds: {
        ticket_creation_duration: ['p(95)<2000'], // 2s max for creation
        errors: ['rate<0.05'], // Max 5% errors
    },
};

export function createTicket() {
    const payload = JSON.stringify({
        customerId: 'new', // Or existing ID if known, logic might vary
        deviceBrand: 'LoadTestBrand',
        deviceModel: 'TestModel X',
        deviceIssue: 'Screen broken (Load Test)',
        deviceConditionFront: LARGE_MOCK_IMAGE, // Simulating upload
        deviceConditionBack: LARGE_MOCK_IMAGE,
        priority: 'MEDIUM',
        estimatedPrice: 100,
        notes: 'Created by k6 load test',
        // If creating new customer inline:
        isNewCustomer: true,
        newCustomer: {
            name: 'Load Test User',
            phone: '555-0199'
        }
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `next-auth.session-token=${AUTH_COOKIE}`,
        },
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/api/tickets`, payload, params);
    ticketCreationDuration.add(Date.now() - startTime);

    const success = check(res, {
        'ticket created (201)': (r) => r.status === 201,
        'has ticket id': (r) => r.json('id') !== undefined,
    });

    if (!success) {
        console.error(`Failed to create ticket: ${res.status} ${res.body}`);
    }

    errorRate.add(!success);
    sleep(1);
}

export function setup() {
    if (!AUTH_COOKIE) {
        throw new Error('AUTH_COOKIE environment variable is required!');
    }
}
