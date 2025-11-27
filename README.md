# RepairFlow

A comprehensive, open-source repair shop management system built with Next.js, designed to streamline operations for phone and device repair businesses.

![RepairFlow](https://img.shields.io/badge/RepairFlow-Open%20Source-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Functionality
- **Ticket Management**: Complete lifecycle management from receipt to completion
- **Customer Management**: Track customer information, history, and contact details
- **Inventory Management**: Manage parts, track stock levels, and monitor reorder points
- **Multi-language Support**: English, French, and Arabic
- **Print System**: Generate labels (40x20mm) and invoices (80x80mm) with QR codes
- **SMS Notifications**: Customizable SMS templates in multiple languages
- **Dashboard Analytics**: Real-time KPIs, sales charts, and business insights

### Advanced Features
- **User Management**: Role-based access control (Admin, Staff)
- **Status Tracking**: Complete status history with notes
- **Price Adjustments**: Track price changes with audit trail
- **Parts Integration**: Link parts to tickets and track usage
- **Returns Management**: Handle customer returns and refunds
- **Payment Tracking**: Mark tickets as paid/unpaid
- **Device Tracking**: Track device brands, models, and common issues
- **Image Upload**: Capture device condition photos
- **Search & Filters**: Quick search and filter tickets by status

### Platform Support
- **Web Application**: Full-featured web interface
- **Android App**: Native Android support via Capacitor
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- SQLite (included) or PostgreSQL
- For Android: Android Studio and Java JDK

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/repairflow.git
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
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding:
- **Admin**: `admin` / `admin123`
- **Staff**: `staff` / `staff123`

⚠️ **Change these passwords immediately in production!**

## 📱 Android Setup

1. **Build the web app**
   ```bash
   npm run build:android
   ```

2. **Open Android Studio**
   ```bash
   npm run cap:open:android
   ```

3. **Configure server URL** in `capacitor.config.ts`:
   - Development: `http://YOUR_IP:3000`
   - Production: `https://your-domain.com`

4. **Build and run** from Android Studio

See [ANDROID_BUILD.md](./ANDROID_BUILD.md) for detailed instructions.

## 🛠️ Tech Stack

- **Framework**: Next.js 15.0
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI + Tailwind CSS
- **Mobile**: Capacitor
- **Icons**: Heroicons
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Printing**: Custom print system

## 📁 Project Structure

```
repairflow/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── lib/           # Utilities and helpers
│   └── contexts/      # React contexts
├── public/            # Static assets
├── scripts/          # Utility scripts
└── capacitor.config.ts # Capacitor configuration
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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run reset-admin-password` - Reset admin password
- `npm run cap:sync` - Sync Capacitor
- `npm run android:build` - Build for Android

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

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/repairflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/repairflow/discussions)

## 🗺️ Roadmap

- [ ] Email notifications
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning for inventory
- [ ] Multi-store support
- [ ] API for third-party integrations
- [ ] Mobile app improvements
- [ ] More language support

---

Made with ❤️ by the RepairFlow community
