# RepairShop - Repair Shop Management System

A complete management system for phone repair shops built with Next.js 15, TypeScript, Prisma, and SQLite.

## Features

- **Authentication & Authorization**: Role-based access control (Admin/Staff)
- **Dashboard**: Overview with key metrics and quick actions
- **Ticket Management**: Create, track, and manage repair tickets with status history
- **Customer Management**: Manage customer information and view ticket history
- **Inventory Management**: Track spare parts, stock levels, and transactions
- **Public Tracking**: Customers can track their repairs using a tracking code
- **Settings**: Admin-only settings and user management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js (Credentials provider)
- **Forms**: React Hook Form + Zod
- **Icons**: Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CursorRepairApp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL="file:./dev.db"`
- `NEXTAUTH_SECRET` (generate a random string)
- `NEXTAUTH_URL="http://localhost:3000"`
- SMTP settings (optional, for email features)

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

After seeding the database:

- **Admin**: username: `admin`, password: `admin123`
- **Staff**: username: `staff`, password: `staff123`

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components
│   ├── layout/      # Layout components (sidebar, main layout)
│   ├── tickets/     # Ticket-related components
│   ├── settings/    # Settings components
│   └── ui/          # Reusable UI components
├── lib/             # Utility functions and configurations
└── types/           # TypeScript type definitions

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seed script
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create a migration
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Features in Detail

### Ticket Management
- Create tickets with device details and photos
- Track status through workflow (Received → In Progress → Waiting for Parts → Repaired → Completed)
- Price adjustments with audit trail
- Parts usage tracking
- Print tickets with QR codes

### Customer Management
- Add and manage customer profiles
- View customer ticket history
- Search and filter customers

### Inventory Management
- Track spare parts stock
- Low stock alerts
- Inventory transactions (IN/OUT)
- Supplier information

### Public Tracking
- Customers can track repairs using tracking code at `/track`
- View status history and ticket information

### Settings (Admin Only)
- Company information settings
- User management (create/edit users)
- Role-based access control

## License

MIT

