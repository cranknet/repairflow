// Simple in-memory rate limiting utility
// For production, migrate to Redis-based rate limiting

import { NextRequest } from 'next/server';

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private rateLimitMap: Map<string, RateLimitRecord>;
    private windowMs: number;
    private maxAttempts: number;

    constructor(windowMs: number, maxAttempts: number) {
        this.rateLimitMap = new Map();
        this.windowMs = windowMs;
        this.maxAttempts = maxAttempts;

        // Clean up old entries periodically
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.rateLimitMap.entries()) {
                if (now > value.resetAt) {
                    this.rateLimitMap.delete(key);
                }
            }
        }, this.windowMs);
    }

    getClientId(request: NextRequest): string {
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded
            ? forwarded.split(',')[0].trim()
            : request.headers.get('x-real-ip') || 'unknown';
        return ip;
    }

    check(clientId: string): { allowed: boolean; resetAt?: number; remaining?: number } {
        const now = Date.now();
        const record = this.rateLimitMap.get(clientId);

        if (!record || now > record.resetAt) {
            // Reset or create new record
            this.rateLimitMap.set(clientId, {
                count: 1,
                resetAt: now + this.windowMs
            });
            return {
                allowed: true,
                remaining: this.maxAttempts - 1,
                resetAt: now + this.windowMs
            };
        }

        if (record.count >= this.maxAttempts) {
            return {
                allowed: false,
                resetAt: record.resetAt,
                remaining: 0
            };
        }

        record.count++;
        return {
            allowed: true,
            remaining: this.maxAttempts - record.count,
            resetAt: record.resetAt
        };
    }

    reset(clientId: string): void {
        this.rateLimitMap.delete(clientId);
    }
}

// Pre-configured rate limiters for common use cases
export const authRateLimiters = {
    forgotPassword: new RateLimiter(60 * 60 * 1000, 3), // 3 requests per hour
    resetPassword: new RateLimiter(60 * 60 * 1000, 5),  // 5 attempts per hour
    login: new RateLimiter(15 * 60 * 1000, 10),         // 10 attempts per 15 minutes
};
