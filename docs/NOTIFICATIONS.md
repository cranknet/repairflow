# Notification System Integration

## Overview

The notification system has been integrated across all features (Customers, Tickets, Payments, Charges, Parts, Suppliers) using an adapter/bridge pattern. The existing old notification system in `src/lib/notifications.ts` is reused without modification - new events are translated and sent through the old system.

## Architecture

### Event System

Events are emitted after successful database commits for various entity operations:

- **Customers**: `customer.created`, `customer.updated`, `customer.deleted`
- **Tickets**: `ticket.created`, `ticket.updated`, `ticket.status_changed`, `ticket.deleted`
- **Payments**: `payment.created`
- **Charges**: `charge.added`, `charge.removed` (price adjustments)
- **RepairJobs**: `repairjob.assigned`, `repairjob.completed`, `repairjob.updated` (mapped to tickets)
- **Parts**: `part.used`, `part.removed` (when parts are added/removed from tickets)
- **Suppliers**: `supplier.created`, `supplier.updated`, `supplier.deleted`

### Event Payload

Each event includes:
- `eventId`: Unique identifier for the event
- `entityType`: Type of entity (customer, ticket, payment, etc.)
- `entityId`: ID of the affected entity
- `action`: Action performed (created, updated, deleted, etc.)
- `actorId`: ID of user who performed the action
- `actorName`: Name of user who performed the action
- `timestamp`: When the event occurred
- `summary`: Human-readable summary
- `details`: Optional detailed information
- `meta`: Additional metadata (entity-specific)
- `customerId`: Optional customer ID (if applicable)
- `ticketId`: Optional ticket ID (if applicable)
- `device`: Optional device information (if applicable)

### Notification Adapter

The `NotificationAdapter` class (`src/lib/notifications/adapter.ts`) translates new event payloads into the old notification system format:

- Maps entity/action combinations to old `NotificationType` enum values
- Renders notification messages using i18n templates
- Generates idempotency keys: `notification:{eventId}:{recipientId}:{channel}`

### Recipient Selection

The `getNotificationRecipients()` function (`src/lib/notifications/recipients.ts`) determines who should receive notifications:

- Respects user notification preferences from `NotificationPreference` table
- Checks entity permissions (admin/staff for customers/payments, assigned tech for tickets)
- Excludes actor unless self-notify preference is enabled
- For ticket-related events: includes assigned technician and watchers
- For customer events: includes admin/staff roles
- For payments: includes accounting roles (admin/staff)

### Processing

Events are processed asynchronously using a fire-and-forget pattern:

1. Event is emitted via `emitEvent()` (non-blocking)
2. `processNotificationEvent()` determines recipients
3. For each recipient, `NotificationAdapter.translate()` converts event to old format
4. Old `createNotification()` function is called
5. Success/failure is logged but never throws errors

## Notification Preferences

Users can control which notifications they receive through the Settings > Notification Preferences page:

- Toggle notifications per entity type and action
- Preferences are stored in `NotificationPreference` table
- Default: all notifications enabled
- Preferences are checked before sending notifications

## Templates

Notification messages are rendered using i18n templates:

- Template keys: `notifications.{entityType}.{action}.body`
- Supported placeholders: `{entityId}`, `{ticketId}`, `{customerName}`, `{actorName}`, `{changeSummary}`, `{device}`, etc.
- Templates available in English, Arabic, and French

## Deep Links

Notifications support deep linking to relevant entities:

- Ticket notifications: `/tickets/{ticketId}`
- Payment notifications: `/tickets/{ticketId}` (links to ticket)
- Customer/Supplier notifications: Currently not supported (old system doesn't store customerId/supplierId)

## Logging & Metrics

- Each notification attempt is logged with: `eventId`, `entityType`, `action`, `recipientId`, `channel`, `success/failure`
- Metrics tracked: `notifications.sent`, `notifications.failed`
- Logs use console.log (can be extended to file/external service)

## Database Schema

### NotificationPreference

```prisma
model NotificationPreference {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entityType String  // customer, ticket, payment, charge, repairjob, part, supplier
  action    String   // created, updated, deleted, status_changed, assigned, completed, used, removed, added
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, entityType, action])
  @@index([userId])
}
```

### Supplier

```prisma
model Supplier {
  id          String   @id @default(cuid())
  name        String
  contactPerson String?
  email       String?
  phone       String?
  address     String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  parts       Part[]
}
```

## API Endpoints

### Suppliers

- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier (emits `supplier.created`)
- `GET /api/suppliers/[id]` - Get supplier by ID
- `PATCH /api/suppliers/[id]` - Update supplier (emits `supplier.updated`)
- `DELETE /api/suppliers/[id]` - Delete supplier (emits `supplier.deleted`)

### Notification Preferences

- `GET /api/notifications/preferences` - Get user's notification preferences
- `POST /api/notifications/preferences` - Save user's notification preferences

## Integration Points

Events are emitted in the following API routes:

- `src/app/api/customers/route.ts` - Customer create
- `src/app/api/customers/[id]/route.ts` - Customer update/delete
- `src/app/api/tickets/route.ts` - Ticket create
- `src/app/api/tickets/[id]/route.ts` - Ticket update/delete/status change/assignment/price adjustment
- `src/app/api/tickets/[id]/pay/route.ts` - Payment create
- `src/app/api/suppliers/route.ts` - Supplier create
- `src/app/api/suppliers/[id]/route.ts` - Supplier update/delete

## Future Enhancements

- Add email and push notification channels (currently only in-app)
- Store entity IDs (customerId, supplierId) in notification model for better deep linking
- Add queue system for better reliability and retry logic
- Add notification batching for multiple events
- Add notification history/audit trail


