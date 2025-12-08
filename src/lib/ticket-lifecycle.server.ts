/**
 * Ticket Status Lifecycle Server Functions
 * Server-only functions that require database access
 */
import 'server-only';

import { prisma } from '@/lib/prisma';
import { RETURN_WINDOW_SETTING_KEY, DEFAULT_RETURN_WINDOW_DAYS } from './ticket-lifecycle';

/**
 * Get the configured return window in days
 */
export async function getReturnWindowDays(): Promise<number> {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key: RETURN_WINDOW_SETTING_KEY },
        });
        if (setting?.value) {
            const days = parseInt(setting.value, 10);
            if (!isNaN(days) && days > 0) {
                return days;
            }
        }
    } catch (error) {
        console.error('Error fetching return window setting:', error);
    }
    return DEFAULT_RETURN_WINDOW_DAYS;
}

/**
 * Check if a ticket is within the return window
 */
export async function isWithinReturnWindow(completedAt: Date | null): Promise<{ allowed: boolean; reason?: string }> {
    if (!completedAt) {
        return { allowed: false, reason: 'Ticket has no completion date' };
    }

    const returnWindowDays = await getReturnWindowDays();
    const now = new Date();
    const completedDate = new Date(completedAt);
    const daysSinceCompletion = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCompletion > returnWindowDays) {
        return {
            allowed: false,
            reason: `Return window of ${returnWindowDays} days has expired. Ticket was completed ${daysSinceCompletion} days ago.`,
        };
    }

    return { allowed: true };
}
