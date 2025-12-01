/**
 * Event emitter for notification system
 * Uses fire-and-forget async pattern to avoid blocking main operations
 */

import { EventPayload } from './types';
import { processNotificationEvent } from '../notifications/processor';

/**
 * Emit an event for notification processing
 * This is non-blocking and will not throw errors
 */
export async function emitEvent(payload: EventPayload): Promise<void> {
  // Fire-and-forget: process in background without blocking
  processNotificationEvent(payload).catch((error) => {
    // Log error but don't throw - notifications should never block main operations
    console.error(`[EventEmitter] Failed to process notification event ${payload.eventId}:`, error);
  });
}


