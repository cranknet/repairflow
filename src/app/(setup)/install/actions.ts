"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function setupApp(formData: FormData) {
    const storeName = formData.get("storeName") as string;
    const adminName = formData.get("adminName") as string;
    const adminUsername = formData.get("adminUsername") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const adminPassword = formData.get("adminPassword") as string;

    if (!storeName || !adminName || !adminUsername || !adminEmail || !adminPassword) {
        return;
    }

    try {
        // 1. Hash the password
        const hashedPassword = await hash(adminPassword, 10);

        // 2. Clean up existing data (Users and Settings) to ensure fresh start
        // Delete in correct order to respect foreign key constraints
        await prisma.$transaction([
            // Delete all dependent records first
            prisma.journalEntry.deleteMany({}),
            prisma.return.deleteMany({}),
            prisma.payment.deleteMany({}),
            prisma.expense.deleteMany({}),
            prisma.inventoryAdjustment.deleteMany({}),
            prisma.notificationPreference.deleteMany({}),
            prisma.loginLog.deleteMany({}),
            prisma.passwordResetToken.deleteMany({}),
            prisma.ticketPriceAdjustment.deleteMany({}),
            prisma.ticketPart.deleteMany({}),
            prisma.ticketStatusHistory.deleteMany({}),
            prisma.satisfactionRating.deleteMany({}),
            prisma.contactMessage.deleteMany({}),
            prisma.notification.deleteMany({}),
            prisma.inventoryTransaction.deleteMany({}),
            prisma.ticket.deleteMany({}),
            prisma.customer.deleteMany({}),
            prisma.part.deleteMany({}),
            prisma.supplier.deleteMany({}),
            prisma.sMSTemplate.deleteMany({}),
            prisma.emailSettings.deleteMany({}),
            // Then delete users and settings
            prisma.user.deleteMany({}),
            prisma.settings.deleteMany({}),
        ]);

        // 3. Create Settings and Admin User
        await prisma.$transaction([
            prisma.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    username: adminUsername,
                    password: hashedPassword,
                    role: "ADMIN",
                },
            }),
            prisma.settings.create({
                data: { key: "company_name", value: storeName },
            }),
            prisma.settings.create({
                data: { key: "company_logo", value: "/default-logo.png" },
            }),
            prisma.settings.create({
                data: { key: "company_favicon", value: "/default-favicon.png" },
            }),
            prisma.settings.create({
                data: { key: "currency", value: "USD" },
            }),
            prisma.settings.create({
                data: { key: "is_installed", value: "true" },
            }),
        ]);

        console.log("Transaction successful");

    } catch (error) {
        console.error("Setup error:", error);
        throw error;
    }

    try {
        await signIn("credentials", {
            username: adminUsername,
            password: adminPassword,
            redirectTo: "/complete",
        });
    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("SignIn error:", error);
        // Fallback redirect if signin fails for some reason (though it shouldn't)
        redirect("/complete");
    }
}
