import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hash } from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

async function setupApp(formData: FormData) {
    "use server";

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
        // We delete all users to remove any "old" admins like cranknet
        await prisma.user.deleteMany({});
        await prisma.settings.deleteMany({});

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
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("SignIn error:", error);
        // Fallback redirect if signin fails for some reason (though it shouldn't)
        redirect("/dashboard");
    }
}

export default async function InstallPage() {
    // Double check if already installed
    const isInstalled = await prisma.settings.findUnique({
        where: { key: "is_installed" },
    });

    if (isInstalled?.value === "true") {
        redirect("/dashboard");
    }

    return (
        <Card className="border-0 shadow-none">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Image src="/default-logo.png" alt="RepairFlow Logo" width={128} height={128} unoptimized />
                </div>
                <CardTitle>Welcome to RepairFlow</CardTitle>
                <CardDescription>
                    Let&apos;s get your repair shop set up.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={setupApp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" name="storeName" placeholder="My Repair Shop" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminName">Admin Name</Label>
                        <Input id="adminName" name="adminName" placeholder="John Doe" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminUsername">Username</Label>
                        <Input id="adminUsername" name="adminUsername" placeholder="admin" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminEmail">Admin Email</Label>
                        <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@example.com" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminPassword">Admin Password</Label>
                        <Input id="adminPassword" name="adminPassword" type="password" required />
                    </div>

                    <Button type="submit" className="w-full">
                        Install RepairFlow
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
