/**
 * Logger for notification system
 */

export interface NotificationLogEntry {
  eventId: string;
  entityType: string;
  action: string;
  recipientId: string;
  channel: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

let metrics = {
  sent: 0,
  failed: 0,
};

/**
 * Log a notification attempt
 */
export function logNotificationAttempt(entry: NotificationLogEntry): void {
  const logMessage = `[Notification] ${entry.success ? '✓' : '✗'} ${entry.entityType}.${entry.action} -> ${entry.recipientId} (${entry.channel}) [${entry.eventId}]`;
  
  if (entry.success) {
    console.log(logMessage);
    metrics.sent++;
  } else {
    console.error(logMessage, entry.error);
    metrics.failed++;
  }
}

/**
 * Get notification metrics
 */
export function getNotificationMetrics() {
  return { ...metrics };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metrics = { sent: 0, failed: 0 };
}


