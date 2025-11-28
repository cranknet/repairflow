import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

    return <>{children}</>;
}
