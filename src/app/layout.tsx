import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "RepairFlow - Repair Shop Management System",
  description: "Complete management system for phone repair shops",
  icons: {
    icon: '/favicon.png',
  },
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

