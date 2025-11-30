# RepairFlow Project Index

This document provides a comprehensive overview of the RepairFlow project structure, architecture, and key components to facilitate faster code review and development.

## 1. Project Overview

**RepairFlow** is a comprehensive repair shop management system built with Next.js 15. It supports ticket management, customer tracking, inventory, returns, notifications, public tracking, and more.

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Database:** SQLite (Dev) / PostgreSQL (Prod) / MySQL via Prisma ORM
- **Authentication:** NextAuth.js
- **State Management:** React Context + SWR (implied for data fetching)

## 2. Directory Structure

```
repairflow/
├── .github/                # GitHub Actions & templates
├── prisma/                 # Database schema & migrations
│   └── schema.prisma       # Main data model definition
├── public/                 # Static assets (images, icons)
├── scripts/                # Utility scripts (versioning, seeding)
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── api/            # Backend API routes
│   │   ├── (main)/         # Main application routes (protected)
│   │   │   ├── dashboard/  # Main dashboard
│   │   │   ├── tickets/    # Ticket management pages
│   │   │   ├── customers/  # Customer management pages
│   │   │   ├── returns/    # Returns management page
│   │   │   ├── notifications/ # Notifications page
│   │   │   ├── settings/   # Settings page (Admin only)
│   │   │   ├── track/      # Public tracking page
│   │   │   ├── login/      # Login page
│   │   │   ├── forgot-password/ # Password reset request
│   │   │   └── reset-password/ # Password reset form
│   │   └── (setup)/        # Setup wizard routes
│   ├── components/         # React Components
│   │   ├── ui/             # Reusable design system (Buttons, Inputs)
│   │   ├── tickets/        # Ticket-specific components
│   │   ├── customers/      # Customer-specific components
│   │   └── ...
│   ├── contexts/           # Global State (Settings, Language)
│   ├── lib/                # Utilities & Libraries
│   │   ├── prisma.ts       # DB Client instance
│   │   ├── auth.ts         # Authentication logic
│   │   └── utils.ts        # Helper functions
│   └── types/              # TypeScript type definitions

├── next.config.js          # Next.js configuration
└── package.json            # Dependencies & Scripts
```

## 3. Key Modules & Features

### Ticket Management
- **Core Logic:** `src/app/tickets/`
- **Data Model:** `Ticket`, `TicketStatusHistory`, `TicketPart` (in `schema.prisma`)
- **Components:** `src/components/tickets/` (Tables, Forms, Status Badges)

### Customer Management
- **Core Logic:** `src/app/(main)/customers/`
- **Data Model:** `Customer`
- **Components:** `src/components/customers/`
- **Features:** Create, view, edit customers with ticket history

### Returns Management
- **Core Logic:** `src/app/(main)/returns/`
- **Data Model:** `Return`
- **Components:** `src/components/returns/`
- **Features:** Handle customer returns with refund tracking

### Notifications System
- **Core Logic:** `src/app/(main)/notifications/`, `src/lib/notifications.ts`
- **Data Model:** `Notification`
- **Components:** `src/components/notifications/`
- **Features:** In-app notifications for status changes, price adjustments, user actions

### Public Tracking
- **Core Logic:** `src/app/(main)/track/`, `src/app/api/track/`
- **Features:** Customer-facing tracking page with status history, no authentication required

### Inventory (Parts)
- **API:** `src/app/api/parts/`
- **Data Model:** `Part`, `InventoryTransaction`
- **Integration:** Linked to tickets via `TicketPart`
- **Features:** Track inventory with transactions, reorder levels, and stock management

### Settings & Configuration
- **Core Logic:** `src/app/(main)/settings/`
- **State:** `src/contexts/settings-context.tsx`
- **Data Model:** `Settings` (Key-Value store)
- **Components:** `src/components/settings/`
- **Features:** General settings, appearance, branding, social media, SMS templates, database switcher, user management

### Authentication & Security
- **Provider:** NextAuth.js
- **Config:** `src/lib/auth.ts`, `src/lib/auth.config.ts`
- **Data Model:** `User`, `LoginLog`, `PasswordResetToken`
- **Features:** Login, logout, password reset, login logs, role-based access control

## 4. Data Model (Prisma)

The database schema is defined in `prisma/schema.prisma`. Key entities include:

- **User:** Staff members with roles (ADMIN, STAFF), login tracking.
- **Customer:** Client details with ticket history.
- **Ticket:** Central entity linking Customer, Device, Status, with tracking codes, warranty, images, and price adjustments.
- **TicketStatusHistory:** Complete audit trail of status changes.
- **TicketPart:** Links parts to tickets with quantities.
- **TicketPriceAdjustment:** Tracks price changes with user attribution and reasons.
- **Part:** Inventory items with stock levels, reorder points, and pricing.
- **InventoryTransaction:** Tracks inventory movements (IN, OUT, RETURN).
- **Return:** Customer returns with refund amounts and approval workflow.
- **Notification:** System alerts for users (status changes, price adjustments, etc.).
- **SMSTemplate:** Templates for automated SMS messages in multiple languages.
- **Settings:** Key-value configuration store for app settings.
- **LoginLog:** Authentication audit trail with IP and user agent.
- **PasswordResetToken:** Secure password reset token management.

## 5. API Endpoints (`src/app/api/`)

- `/auth/*`: Authentication routes (login, logout, session)
- `/customers`: Customer CRUD operations
- `/dashboard`: Analytics and KPI data
- `/notifications`: User notifications (get, mark as read, delete)
- `/parts`: Inventory management (CRUD, transactions)
- `/returns`: Returns management
- `/settings`: App configuration (get, update, public settings)
- `/settings/database`: Database configuration (if applicable)
- `/settings/database/test`: Test database connection
- `/sms`: SMS sending and template management
- `/tickets`: Ticket CRUD operations
- `/track`: Public ticket tracking (no auth required)
- `/users`: User management (Admin only - CRUD, login logs)

## 6. External Integrations

- **SMS:** Custom implementation in `src/lib/com-port-sms.ts` (Web only) and `src/app/api/sms` for sending SMS notifications via COM port using AT commands. Mobile devices show a notice that native Android SMS integration is coming soon.
- **Email:** Nodemailer integration for password reset emails (configured via SMTP settings).
- **Printing:** Custom print system for labels (40x20mm) and invoices (80x120mm) with QR codes.

## 7. Key Features by Module

### Dashboard
- Real-time KPIs with week-over-week comparisons:
  - Active tickets count and change percentage
  - Total customers count and change percentage
  - Low stock items count and change percentage
  - Weekly revenue and change percentage
- Sales charts with COGS (Cost of Goods Sold) tracking
- Sales target progress indicator
- Recent tickets table with status filtering
- Store profile display

### Tickets
- Full lifecycle management with status workflow:
  - **Active Statuses**: RECEIVED → IN_PROGRESS → WAITING_FOR_PARTS → REPAIRED → COMPLETED
  - **Terminal Statuses**: CANCELLED, RETURNED (cannot be changed once set)
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Device condition photos (front/back) stored as Base64
- Price adjustments with audit trail and user attribution
- Parts linking with quantity tracking
- Payment tracking (paid/unpaid status)
- Warranty management (custom warranty days and text)
- Status history with notes and timestamps
- Print labels (40x20mm) and invoices (80x120mm) with QR codes
- SMS notifications with customizable templates
- Ticket assignment to staff members

### Customers
- Contact information management
- Ticket history per customer
- Search and filter capabilities

### Returns
- Return request management linked to tickets
- Refund amount tracking (partial or full refund)
- Approval workflow (PENDING, APPROVED, REJECTED)
- Automatically marks associated ticket as RETURNED status (cannot be changed)

### Notifications
- Real-time notification bell
- Notification dropdown with swipe actions
- Full notifications page with filtering
- Mark as read/unread
- Delete notifications

### Public Tracking
- Customer-facing tracking page
- Status history display
- Social media links
- No authentication required

## 8. Development Workflow

Refer to `README.md` and `SETUP.md` for detailed instructions on:
- Running the web server (`npm run dev`)
- Database migrations (`npm run db:push`)
- Building for production (`npm run build`)

## 9. Internationalization

- **Languages:** English, French, Arabic
- **Implementation:** `src/lib/i18n.ts` with translation dictionaries
- **Context:** `src/contexts/language-context.tsx` for language switching
- **UI:** Language switcher in navigation

## 10. State Management

- **Settings Context:** `src/contexts/settings-context.tsx` - Global app settings
- **Language Context:** `src/contexts/language-context.tsx` - Current language and translations
- **Session:** NextAuth.js session management
