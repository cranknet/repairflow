/**
 * Notification Adapter - Bridges new event system to old notification system
 */

import { EventPayload } from '../events/types';
import { NotificationType, createNotification } from '../notifications';
import { renderNotificationMessage } from './templates';

/**
 * Maps new event format to old notification system format
 */
export class NotificationAdapter {
  /**
   * Translate event payload to old notification system format
   */
  static translate(event: EventPayload, recipientId: string): {
    type: NotificationType;
    message: string;
    userId: string | null;
    ticketId: string | null;
  } {
    // Map entity.action to old NotificationType
    const type = this.mapEventToNotificationType(event);
    
    // Render message from template
    const message = renderNotificationMessage(event);
    
    return {
      type,
      message,
      userId: recipientId,
      ticketId: event.ticketId || null,
    };
  }

  /**
   * Map new event format to old NotificationType
   */
  private static mapEventToNotificationType(event: EventPayload): NotificationType {
    const { entityType, action } = event;
    
    // Map to existing notification types
    if (entityType === 'ticket') {
      if (action === 'created') return 'TICKET_CREATED';
      if (action === 'status_changed') return 'STATUS_CHANGE';
      if (action === 'assigned') return 'ASSIGNMENT';
    }
    
    if (entityType === 'charge' && action === 'added') {
      return 'PRICE_ADJUSTMENT';
    }
    
    if (entityType === 'payment' && action === 'created') {
      return 'PAYMENT_STATUS_CHANGE';
    }
    
    // Default fallback - use generic types or extend NotificationType if needed
    // For now, we'll use a generic approach
    if (action === 'created') return 'TICKET_CREATED';
    if (action === 'updated') return 'STATUS_CHANGE';
    if (action === 'deleted') return 'STATUS_CHANGE';
    
    return 'STATUS_CHANGE';
  }

  /**
   * Generate idempotency key
   */
  static getIdempotencyKey(event: EventPayload, recipientId: string, channel: string): string {
    return `notification:${event.eventId}:${recipientId}:${channel}`;
  }
}


