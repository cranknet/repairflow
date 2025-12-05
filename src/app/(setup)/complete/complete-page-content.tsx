"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { SetupLanguageSwitcher } from "@/components/setup/setup-language-switcher";

export function CompletePageContent({ dashboardUrl }: { dashboardUrl: string }) {
    const { t } = useLanguage();

    const handleGoToDashboard = () => {
        // Open dashboard in new tab
        window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
        // Close current tab after a short delay
        setTimeout(() => {
            window.close();
        }, 500);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <SetupLanguageSwitcher />
            </div>
            <Card className="border-0 shadow-none">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Image src="/default-logo.png" alt="RepairFlow Logo" width={128} height={128} unoptimized />
                    </div>
                    <div className="flex justify-center mb-4">
                        <CheckCircleIcon className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-center">{t('installationComplete')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('setupSuccessMessage')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    <p className="text-center text-sm text-muted-foreground">
                        {t('setupReadyMessage')}
                    </p>
                    <Button
                        className="w-full"
                        onClick={handleGoToDashboard}
                    >
                        {t('goToDashboard')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
