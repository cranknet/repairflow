import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

// PWA App Constants
const APP_NAME = "RepairFlow";
const APP_DESCRIPTION = "Complete management system for phone repair shops";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "RepairFlow - Repair Shop Management System",
    template: "%s | RepairFlow",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: "RepairFlow - Repair Shop Management System",
      template: "%s | RepairFlow",
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check installation status
  // We use a try-catch to handle potential DB issues during build or first run
  let isInstalled = false;
  try {
    const isInstalledSetting = await prisma.settings.findUnique({
      where: { key: "is_installed" },
    });
    isInstalled = isInstalledSetting?.value === "true";
  } catch (error) {
    console.error("Failed to check installation status:", error);
    // If DB fails, assume not installed or handle gracefully
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Route Protection Logic
  if (!isInstalled) {
    // If not installed, only allow /install
    if (!pathname.startsWith("/install")) {
      redirect("/install");
    }
  } else {
    // If installed, block /install
    if (pathname.startsWith("/install")) {
      redirect("/dashboard");
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />

      <body className="font-sans">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
