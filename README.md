# RepairFlow

<div align="center">

![RepairFlow Logo](public/default-logo.png)

A comprehensive, open-source repair shop management system built with Next.js 15, designed to streamline operations for phone and device repair businesses.

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Documentation](#-documentation) • [Contributing](CONTRIBUTING.md)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 🚀 Overview

**RepairFlow** is a modern, monolithic application designed to handle the entire lifecycle of a repair business. From checking in devices and managing inventory to tracking financials and communicating with customers via SMS, RepairFlow provides a unified interface for shop owners and technicians.

It leverages the latest web technologies including Next.js App Router, Server Actions, and Prisma ORM with SQLite for a robust and easy-to-deploy solution.

## ✨ Features

### 🛠️ Core Operations
- **Ticket Management**: Complete repair lifecycle tracking (Received → In Progress → Waiting for Parts → Repaired → Completed).
- **Status Workflow**: Visual status indicators, automated transitions, and history tracking.
- **Device Tracking**: Record device details (Brand, Model, Serial/IMEI) and condition (with photo uploads).
- **Print System**: Generate professional PDF invoices and repair labels (QR code support).

### 💰 Finance & Accounting
- **Payment Tracking**: Track partial/full payments, refunds, and payment methods.
- **Price Adjustments**: Audit trail for any price changes made to tickets.
- **Expenses**: Record shop expenses and categorize them.
- **Automated Journaling**: Double-entry bookkeeping system that automatically records financial events.
- **Dashboard Analytics**: Real-time revenue, COGS (Cost of Goods Sold), and profit reporting.

### 📦 Inventory & Suppliers
- **Parts Management**: Track stock levels, costs, and selling prices.
- **Low Stock Alerts**: Dashboard notifications for items running low.
- **Supplier Management**: Database of suppliers and contact details.
- **AI-Powered OCR**: Scan supplier receipts/invoices using **Google Gemini**, **OpenAI GPT-4**, or **Anthropic Claude** to automatically extract part data and update inventory.

### 🤝 Customer Relations (CRM)
- **Customer Profiles**: detailed history of all repairs and purchases.
- **Communication**: Integrated system to send updates via email or SMS.
- **Public Tracking**: Dedicated public portal for customers to check their repair status using their ticket number.

### 🔌 Hardware & Integrations
- **Hardware SMS**: Direct integration with GSM modems via **Serial/COM port** for cost-effective, carrier-independent SMS messaging.
- **Label Printers**: Formatted output for standard label printers (40x20mm).

### 🌍 Internationalization
- **Multi-language Support**: Fully localized interface in **English**, **French**, and **Arabic** (RTL support).
- **Automated Translation**: Scripts to auto-translate missing keys using AI.

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [SQLite](https://sqlite.org/) (via [Prisma ORM](https://www.prisma.io/))
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)
- **OCR/Vision**: Tesseract.js (client-side) + Integration for Gemini/OpenAI/Claude.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/cranknet/repairflow.git
    cd repairflow
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your configuration (see [SETUP.md](SETUP.md) for details). You must generate a secure secret for NextAuth:
    ```bash
    # PowerShell
    [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
    # Bash
    openssl rand -base64 32
    ```

4.  **Database Setup**
    Initialize the SQLite database:
    ```bash
    npm run db:push
    npm run db:seed  # Optional: Adds sample data
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages & API
│   │   ├── (main)/          # Authenticated application routes
│   │   ├── api/             # Backend API endpoints
│   │   └── ...
│   ├── components/          # React components
│   ├── lib/                 # Core business logic & utilities
│   │   ├── ai-vision.ts     # AI Receipt scanning logic
│   │   ├── com-port-sms.ts  # Serial port SMS handler
│   │   └── ...
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets (locales, images)
├── scripts/                 # Maintenance & automation scripts
└── ...
```

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed installation and configuration.
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and fixes.
- [Versioning](VERSIONING.md) - Release process.
- [Feature Guides](docs/) - In-depth documentation for specific modules.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and the code of conduct.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.