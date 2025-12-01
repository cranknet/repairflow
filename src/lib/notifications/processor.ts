/**
 * Notification processor - handles event to notification conversion
 */

import { EventPayload } from '../events/types';
import { getNotificationRecipients } from './recipients';
import { NotificationAdapter } from './adapter';
import { createNotification } from '../notifications';
import { logNotificationAttempt } from './logger';

/**
 * Process a notification event
 * This is called asynchronously and should never throw
 */
export async function processNotificationEvent(event: EventPayload): Promise<void> {
  try {
    // Get recipients
    const recipients = await getNotificationRecipients(event);

    // Process each recipient
    const promises = recipients.map(async (recipientId) => {
      try {
        // Translate event to old notification format
        const notification = NotificationAdapter.translate(event, recipientId);
        
        // Generate idempotency key (for future deduplication)
        const idempotencyKey = NotificationAdapter.getIdempotencyKey(event, recipientId, 'in-app');
        
        // Send notification using old system
        await createNotification({
          type: notification.type,
          message: notification.message,
          userId: notification.userId,
          ticketId: notification.ticketId,
        });

        // Log success
        logNotificationAttempt({
          eventId: event.eventId,
          entityType: event.entityType,
          action: event.action,
          recipientId,
          channel: 'in-app',
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        // Log failure but don't throw
        logNotificationAttempt({
          eventId: event.eventId,
          entityType: event.entityType,
          action: event.action,
          recipientId,
          channel: 'in-app',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    });

    await Promise.all(promises);
  } catch (error) {
    // Log error but don't throw - notifications should never block
    console.error(`[NotificationProcessor] Failed to process event ${event.eventId}:`, error);
  }
}


