import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Outfit } from "next/font/google";

// PWA App Constants
const APP_NAME = "RepairFlow";
const APP_DESCRIPTION = "Complete management system for phone repair shops";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

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
import { isAppInstalled } from "@/lib/install-check";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check installation status using helper that handles missing DB gracefully
  const isInstalled = await isAppInstalled();

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
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head />

      <body className="font-sans">
        <Providers>
          {children}
          <Toaster />
          <OfflineIndicator />
          <InstallPrompt />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}