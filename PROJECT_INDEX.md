# RepairFlow Project Index

This document provides a comprehensive overview of the RepairFlow project structure, architecture, and key components to facilitate faster code review and development.

## 1. Project Overview

**RepairFlow** is a repair shop management system built with Next.js 15. It supports ticket management, customer tracking, inventory, and more. It is designed to run as a web application and a native Android app (via Capacitor).

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Database:** SQLite (Dev) / PostgreSQL (Prod) via Prisma ORM
- **Authentication:** NextAuth.js
- **Mobile:** Capacitor (Android)
- **State Management:** React Context + SWR (implied for data fetching)

## 2. Directory Structure

```
repairflow/
├── .github/                # GitHub Actions & templates
├── android/                # Native Android project files (Capacitor)
├── prisma/                 # Database schema & migrations
│   └── schema.prisma       # Main data model definition
├── public/                 # Static assets (images, icons)
├── scripts/                # Utility scripts (versioning, seeding)
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── api/            # Backend API routes
│   │   ├── login/          # Login page
│   │   ├── dashboard/      # Main dashboard
│   │   ├── tickets/        # Ticket management pages
│   │   ├── customers/      # Customer management pages
│   │   └── ...
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
├── capacitor.config.ts     # Mobile app configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies & Scripts
```

## 3. Key Modules & Features

### Ticket Management
- **Core Logic:** `src/app/tickets/`
- **Data Model:** `Ticket`, `TicketStatusHistory`, `TicketPart` (in `schema.prisma`)
- **Components:** `src/components/tickets/` (Tables, Forms, Status Badges)

### Customer Management
- **Core Logic:** `src/app/customers/`
- **Data Model:** `Customer`
- **Components:** `src/components/customers/`

### Inventory (Parts)
- **API:** `src/app/api/parts/`
- **Data Model:** `Part`, `InventoryTransaction`
- **Integration:** Linked to tickets via `TicketPart`.

### Settings & Configuration
- **Core Logic:** `src/app/settings/`
- **State:** `src/contexts/settings-context.tsx`
- **Data Model:** `Settings` (Key-Value store)

### Authentication
- **Provider:** NextAuth.js
- **Config:** `src/lib/auth.ts`, `src/lib/auth.config.ts`
- **Data Model:** `User`, `LoginLog`

## 4. Data Model (Prisma)

The database schema is defined in `prisma/schema.prisma`. Key entities include:

- **User:** Staff members with roles (ADMIN, STAFF).
- **Customer:** Client details.
- **Ticket:** Central entity linking Customer, Device, and Status.
- **Part:** Inventory items.
- **Notification:** System alerts.
- **SMSTemplate:** Templates for automated messages.

## 5. API Endpoints (`src/app/api/`)

- `/auth/*`: Authentication routes
- `/customers`: Customer CRUD
- `/dashboard`: Analytics data
- `/notifications`: User notifications
- `/parts`: Inventory management
- `/settings`: App configuration
- `/sms`: SMS sending and templates
- `/tickets`: Ticket CRUD
- `/users`: User management (Admin)

## 6. External Integrations

- **Mobile (Capacitor):** Configured in `capacitor.config.ts`. See `ANDROID_BUILD.md`.
- **SMS:** Custom implementation in `src/lib/com-port-sms.ts` (Web) and `src/app/api/sms`.
- **Printing:** Custom print system for labels and invoices.

## 7. Development Workflow

Refer to `DEVELOPMENT_WORKFLOW.md` for detailed instructions on:
- Running the web server (`npm run dev`)
- Running the Android app (`npm run android:dev`)
- Database migrations (`npm run db:push`)
