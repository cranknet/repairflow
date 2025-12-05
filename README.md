# RepairFlow

<div align="center">

![RepairFlow Logo](https://img.shields.io/badge/RepairFlow-Open%20Source-blue?style=for-the-badge)

A comprehensive, open-source repair shop management system built with Next.js, designed to streamline operations for phone and device repair businesses.

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Project Index](PROJECT_INDEX.md) • [Contributing](#-contributing) • [License](#-license)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

![RepairFlow](https://img.shields.io/badge/RepairFlow-Open%20Source-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Functionality
- **Ticket Management**: Complete lifecycle management with status workflow (RECEIVED → IN_PROGRESS → WAITING_FOR_PARTS → REPAIRED → COMPLETED, with CANCELLED and RETURNED states). Styled action buttons (View with icon, Delete with conditional access - admin-only, disabled for repaired/returned tickets)
- **Customer Management**: Track customer information, history, and contact details. Styled action buttons (View with icon, Edit with icon, Delete with conditional access - admin-only, disabled when customer has linked tickets)
- **Returns Management**: Handle customer returns with refund amount tracking (partial or full refund). Workflow: Create return from REPAIRED tickets → Admin approval/rejection → Ticket status updates accordingly
- **Multi-language Support**: English, French, and Arabic with full UI translation
- **Print System**: Generate labels (40x20mm) and invoices (80x120mm) with QR codes
- **SMS Notifications**: Customizable SMS templates in multiple languages with variable substitution. COM port SMS support (web only, mobile native SMS coming soon)
- **Dashboard Analytics**: Real-time KPIs (active tickets, customers, low stock items, revenue), sales charts with COGS tracking, sales targets, and recent activity
- **Public Tracking**: Customer-facing tracking page with status history and social media links

### Advanced Features
- **Contact System**: Public contact form on track page and admin inbox for managing customer messages
- **User Management**: Role-based access control (Admin, Staff) with login logs
- **Notifications System**: In-app notifications for status changes, price adjustments, and user actions
- **Status Tracking**: Complete status history with notes and timestamps
- **Price Adjustments**: Track price changes with audit trail and user attribution
- **Parts Management**: Link parts to tickets with inventory tracking and transaction history
- **Payment Tracking**: Mark tickets as paid/unpaid with payment status indicators
- **Device Tracking**: Track device brands, models, and common issues with condition photos
- **Image Upload**: Capture device condition photos (front and back) stored as Base64
- **Search & Filters**: Quick search and filter tickets by status, customer, and more
- **Dynamic Branding**: Custom logo, favicon, and login background with image upload
- **Theme Customization**: Customize app appearance with theme settings
- **Social Media Integration**: Add social media links displayed on public tracking page
- **Warranty Management**: Track warranty periods and custom warranty text per ticket
- **Password Reset**: Forgot password functionality with email-based reset tokens
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Project Index**: Comprehensive codebase overview for developers


## 🚀 Quick Start / Démarrage Rapide / البداية السريعة

<details open>
<summary><strong>🇬🇧 English</strong></summary>

### Prerequisites

- Node.js 18+ and npm
- SQLite (included) or PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cranknet/repairflow.git
   cd repairflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

</details>

<details>
<summary><strong>🇫🇷 Français</strong></summary>

### Prérequis

- Node.js 18+ et npm
- SQLite (inclus) ou PostgreSQL

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/cranknet/repairflow.git
   cd repairflow
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Modifiez `.env` et ajoutez :
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="votre-cle-secrete-ici"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Configurer la base de données**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

6. **Ouvrir votre navigateur**
   Accédez à [http://localhost:3000](http://localhost:3000)

</details>

<details>
<summary><strong>🇸🇦 العربية</strong></summary>

### المتطلبات الأساسية

- Node.js 18+ و npm
- SQLite (مضمن) أو PostgreSQL

### التثبيت

1. **استنساخ المستودع**
   ```bash
   git clone https://github.com/cranknet/repairflow.git
   cd repairflow
   ```

2. **تثبيت التبعيات**
   ```bash
   npm install
   ```

3. **إعداد متغيرات البيئة**
   ```bash
   cp .env.example .env
   ```
   
   قم بتحرير `.env` وأضف:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **إعداد قاعدة البيانات**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **تشغيل خادم التطوير**
   ```bash
   npm run dev
   ```

6. **افتح متصفحك**
   انتقل إلى [http://localhost:3000](http://localhost:3000)

</details>

### Setup Wizard

Upon first launch, the application will automatically redirect you to the **8-step installation wizard**:

| Step | Description |
|------|-------------|
| 1. Welcome | Environment checks (DATABASE_URL, AUTH_SECRET validation) |
| 2. Database | Test database connectivity and write access |
| 3. Company | Configure company name, email, phone, address, country, language, currency |
| 4. Branding | Upload company logo, favicon, and login background (optional) |
| 5. Admin | Create your administrator account |
| 6. Preferences | Set timezone, theme, SMS toggle, and social media links |
| 7. Sample Data | Optionally load demo customers, suppliers, and parts |
| 8. Finalize | Review settings and complete installation |

After completing the wizard, you'll be redirected to the login page.

> **Fresh Install:** To reset and run the wizard again:
> ```bash
> npx prisma db push --force-reset
> npm run dev
> ```


## 🛠️ Tech Stack

- **Framework**: Next.js 16.0
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite/PostgreSQL/MySQL
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI + Tailwind CSS

- **Icons**: Heroicons
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Printing**: Custom print system

## 📁 Project Structure

```
repairflow/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/
│   │   ├── (main)/     # Main application routes
│   │   └── (setup)/    # Setup routes
│   ├── components/     # React components
│   ├── lib/           # Utilities and helpers
│   └── contexts/      # React contexts
├── public/            # Static assets
├── scripts/          # Utility scripts

```

## 🔧 Configuration

### Database
The app uses Prisma ORM. To modify the schema:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (development) or `npx prisma migrate dev` (production)

### Settings
Access settings via the Settings page (Admin only):
- **General Settings**: Company information (name, email, phone, address, currency, country)
- **Appearance**: Theme customization and color preferences
- **Branding**: Custom logo, favicon, and login background image uploads
- **Social Media**: Facebook, YouTube, and Instagram links for public tracking page
- **SMS Templates**: Create and manage SMS templates in multiple languages
- **User Management**: Create, edit, and delete users with role assignment and login log viewing

### SMS Templates
Create custom SMS templates in multiple languages:
- Navigate to Settings → SMS Templates
- Create templates for different ticket statuses
- Use variables: `{customerName}`, `{ticketNumber}`, `{trackingCode}`, `{finalPrice}`
- Enable/disable templates individually
- Support for multiple languages per template type
- **SMS Sending**: COM port SMS via AT commands (web platform only). Mobile devices show a notice that native Android SMS integration is coming soon

### Public Tracking
Customers can track their repair status using a tracking code:
- Access via `/track` route or direct link with tracking code
- View ticket status, device information, and status history
- Display social media links for business promotion
- No authentication required for public access

## Returns Workflow

### Creating a Return

**From Returns Page:**
1. Navigate to the Returns page
2. Click "Create Return" button (Admin only)
3. Search for a ticket by:
   - Customer name, or
   - Ticket ID
4. Select a ticket from search results
5. Fill in the return form and submit

**From Ticket View:**
1. Navigate to a ticket detail page
2. Change ticket status to RETURNED
3. Create Return modal opens automatically prefilled with ticket data
4. Fill in the return form and submit

**Return Form Fields:**
- Reason (required)
- Refund amount (defaults to ticket price)
- Returned to (optional)
- Notes (optional)

**Note:** Only repaired tickets without existing returns are eligible for returns. Ticket → change status to Returned opens Create Return modal prefilled by ticket ID; search remains on Returns page.

### Admin: Approving/Rejecting Returns
1. Navigate to Returns page
2. View pending returns
3. Click Approve:
   - Return status → APPROVED
   - Ticket status → RETURNED
   - Tracked: who approved, when
4. Click Reject:
   - Return status → REJECTED
   - Ticket status → remains REPAIRED
   - Tracked: who rejected, when

### Authorization
- Creating returns: Admin only
- Approving/rejecting: Admin only

## 📝 Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint


### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create a migration
- `npm run db:reset` - Reset database (clear all data)
- `npm run db:studio` - Open Prisma Studio

### Version Management
- `npm run version:patch` - Bump patch version (1.0.0 → 1.0.1)
- `npm run version:minor` - Bump minor version (1.0.0 → 1.1.0)
- `npm run version:major` - Bump major version (1.0.0 → 2.0.0)
- `npm run version:set <version>` - Set specific version

### Utilities
- `npm run reset-admin-password` - Reset admin password


See [VERSIONING.md](./VERSIONING.md) for detailed version management guide.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Database management with [Prisma](https://www.prisma.io/)

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/cranknet/repairflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cranknet/repairflow/discussions)
- **Security**: See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities

## ⭐ Star History

If you find RepairFlow useful, please consider giving it a star on GitHub!




## 🗺️ Roadmap

- [ ] Email notifications (SMTP configuration available, full email notifications coming soon)
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning for inventory
- [ ] Multi-store support
- [ ] API for third-party integrations
- [ ] Native Android SMS integration for mobile devices
- [ ] More language support

---

Made with ❤️ by the RepairFlow community
