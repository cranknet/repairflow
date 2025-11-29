"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { setupApp } from "./actions";
import { SetupLanguageSwitcher } from "@/components/setup/setup-language-switcher";

export function InstallPageContent() {
    const { t } = useLanguage();

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
                    <CardTitle>{t('welcomeToRepairFlow')}</CardTitle>
                    <CardDescription>
                        {t('setupIntroMessage')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={setupApp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">{t('storeName')}</Label>
                            <Input id="storeName" name="storeName" placeholder={t('storeNamePlaceholder')} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminName">{t('adminName')}</Label>
                            <Input id="adminName" name="adminName" placeholder={t('adminNamePlaceholder')} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminUsername">{t('username')}</Label>
                            <Input id="adminUsername" name="adminUsername" placeholder={t('adminUsernamePlaceholder')} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">{t('adminEmail')}</Label>
                            <Input id="adminEmail" name="adminEmail" type="email" placeholder={t('adminEmailPlaceholder')} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">{t('adminPassword')}</Label>
                            <Input id="adminPassword" name="adminPassword" type="password" required />
                        </div>

                        <Button type="submit" className="w-full">
                            {t('installRepairFlow')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
