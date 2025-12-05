import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout as MainLayoutComponent } from "@/components/layout/main-layout";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await prisma.settings.findUnique({
        where: { key: "is_installed" },
    });

    if (!settings || settings.value !== "true") {
        redirect("/install");
    }

    return (
        <MainLayoutComponent>
            {children}
        </MainLayoutComponent>
    );
}
