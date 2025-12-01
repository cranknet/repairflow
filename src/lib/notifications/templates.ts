/**
 * Template renderer for notifications
 */

import { translations, Language } from '../i18n';
import { EventPayload } from '../events/types';

/**
 * Render a notification template with placeholders
 */
export function renderTemplate(
  key: string,
  params: Record<string, any>,
  locale: Language = 'en'
): string {
  const template = translations[locale]?.[key] || translations.en[key] || key;
  
  // Replace placeholders: {entityId}, {ticketId}, {customerName}, {actorName}, {changeSummary}, etc.
  return template.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params[paramName]?.toString() || match;
  });
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


