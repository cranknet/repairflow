/**
 * Template renderer for notifications
 */

import { getServerTranslation, Language } from '../server-translation';
import { EventPayload } from '../events/types';

/**
 * Render a notification template with placeholders
 */
export function renderTemplate(
  key: string,
  params: Record<string, unknown>,
  locale: Language = 'en'
): string {
  // Use the server-safe translation helper which handles interpolation
  return getServerTranslation(key, locale, params as Record<string, string | number>);
}

/**
 * Get template key for an event
 */
export function getTemplateKey(event: EventPayload, part: 'title' | 'body'): string {
  return `notifications.${event.entityType}.${event.action}.${part}`;
}

/**
 * Render notification message from event
 */
export function renderNotificationMessage(
  event: EventPayload,
  locale: Language = 'en'
): string {
  const templateKey = getTemplateKey(event, 'body');
  const params = {
    entityId: event.entityId,
    ticketId: event.ticketId || '',
    customerName: event.meta?.customerName || '',
    actorName: event.actorName,
    changeSummary: event.summary,
    device: event.device ? `${event.device.brand} ${event.device.model}` : '',
    ...event.meta,
  };

  return renderTemplate(templateKey, params, locale);
}


