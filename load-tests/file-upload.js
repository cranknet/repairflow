/**
 * RepairFlow Load Test - File Upload
 * 
 * Tests multipart/form-data upload to settings endpoint.
 * Requires valid ADMIN authentication cookie.
 * 
 * Usage:
 *   k6 run --env AUTH_COOKIE="<next-auth.session-token>" load-tests/file-upload.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const uploadDuration = new Trend('upload_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_COOKIE = __ENV.AUTH_COOKIE;

// Generate a mock JPEG image (minimal valid header)
// 0xFF 0xD8 0xFF 0xE0 ...
const MOCK_JPEG = new Uint8Array([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    // Just minimal filler to not crash magic byte detector
]).buffer; // In reality, better to load a real small file if possible, or construct a slightly larger random buffer with valid header

// For testing purposes, we construct a binary blob that looks roughly like a file
const BINARY_PAYLOAD = new Uint8Array(10 * 1024); // 10KB
BINARY_PAYLOAD.set(new Uint8Array(MOCK_JPEG), 0); // Set header

export const options = {
    scenarios: {
        upload_files: {
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
            exec: 'uploadFile',
        },
    },
    thresholds: {
        upload_duration: ['p(95)<2000'],
        errors: ['rate<0.05'],
    },
};

export function uploadFile() {
    const fd = new FormData();
    // k6 http.file(data, filename, content_type)
    const file = http.file(BINARY_PAYLOAD, 'test-logo.jpg', 'image/jpeg');

    // Construct payload manually because k6 handling of FormData is specific
    const data = {
        file: file,
        type: 'logo',
    };

    const params = {
        headers: {
            'Cookie': `next-auth.session-token=${AUTH_COOKIE}`,
        },
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/api/settings/upload`, data, params);
    uploadDuration.add(Date.now() - startTime);

    const success = check(res, {
        'upload successful (200)': (r) => r.status === 200,
        'returns url': (r) => r.json('url') !== undefined,
    });

    if (!success) {
        // Debug: log 400s which might be validation errors
        if (res.status === 400) {
            console.log(`Upload failed 400: ${res.body}`);
        }
    }

    errorRate.add(!success);
    sleep(2);
}

export function setup() {
    if (!AUTH_COOKIE) {
        throw new Error('AUTH_COOKIE environment variable is required!');
    }
}
