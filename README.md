# RepairFlow

<div align="center">

![RepairFlow Logo](https://img.shields.io/badge/RepairFlow-Open%20Source-blue?style=for-the-badge)

A comprehensive, open-source repair shop management system built with Next.js, designed to streamline operations for phone and device repair businesses.

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Project Index](PROJECT_INDEX.md) • [Contributing](#-contributing) • [License](#-license)

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

![RepairFlow](https://img.shields.io/badge/RepairFlow-Open%20Source-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Functionality
- **Ticket Management**: Complete lifecycle management from receipt to completion
- **Customer Management**: Track customer information, history, and contact details
- **Multi-language Support**: English, French, and Arabic
- **Print System**: Generate labels (40x20mm) and invoices (80x80mm) with QR codes
- **SMS Notifications**: Customizable SMS templates in multiple languages
- **Dashboard Analytics**: Real-time KPIs, sales charts, and business insights

### Advanced Features
- **User Management**: Role-based access control (Admin, Staff)
- **Status Tracking**: Complete status history with notes
- **Price Adjustments**: Track price changes with audit trail
- **Parts Integration**: Link parts to tickets (without inventory tracking)
- **Returns Management**: Handle customer returns with refund amount tracking (partial or full refund)
- **Payment Tracking**: Mark tickets as paid/unpaid
- **Device Tracking**: Track device brands, models, and common issues
- **Image Upload**: Capture device condition photos
- **Search & Filters**: Quick search and filter tickets by status
- **Dynamic Branding**: Custom logo, favicon, and login background
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Project Index**: Comprehensive codebase overview for developers

## 🖥️ Windows Desktop App

RepairFlow is available as a native Windows application!

- **Native Experience**: Runs as a standalone desktop app with taskbar and system tray integration
- **Dual Database Support**: Seamlessly switch between local **SQLite** (offline) and remote **MySQL** (multi-user) databases via the Settings UI
- **Automatic Server Management**: The app automatically manages the internal server lifecycle
- **Flexible Deployment**: Available as a standard **Installer (.exe)** or **Portable** application
- **Offline Capable**: Fully functional offline when using the local database

See [ELECTRON.md](ELECTRON.md) for detailed installation and usage instructions.

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

Upon first launch, the application will automatically redirect you to the setup wizard. Follow the on-screen instructions to:
1. Create your administrator account
2. Configure company details
3. Set up initial preferences



## 🛠️ Tech Stack

- **Framework**: Next.js 15.0
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite/PostgreSQL/MySQL
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI + Tailwind CSS

- **Icons**: Heroicons
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Printing**: Custom print system
- **Desktop**: Electron + Electron Builder

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
- Company information
- Branding (logo, background)
- SMS templates
- User management
- Language preferences

### SMS Templates
Create custom SMS templates in multiple languages:
- Navigate to Settings → SMS Templates
- Create templates for different ticket statuses
- Use variables: `{customerName}`, `{ticketNumber}`, `{trackingCode}`, `{finalPrice}`

## 📝 Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Windows App
- `npm run dev:electron` - Run desktop app in development mode
- `npm run electron:dist` - Build Windows installer (.exe)

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

- [ ] Email notifications
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning for inventory
- [ ] Multi-store support
- [ ] API for third-party integrations

- [ ] More language support

---

Made with ❤️ by the RepairFlow community
