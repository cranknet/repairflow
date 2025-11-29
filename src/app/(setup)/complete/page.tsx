import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function CompletePage() {
    // Get the base URL from environment variable or construct it
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/dashboard`;

    return (
        <Card className="border-0 shadow-none">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Image src="/default-logo.png" alt="RepairFlow Logo" width={128} height={128} unoptimized />
                </div>
                <div className="flex justify-center mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-center">Installation Complete!</CardTitle>
                <CardDescription className="text-center">
                    Your RepairFlow system has been successfully set up.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                    You are now logged in and ready to start managing your repair shop.
                </p>
                <Link href={dashboardUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="w-full">
                        Go to Dashboard
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
