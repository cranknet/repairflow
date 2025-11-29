import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InstallPageContent } from "./install-page-content";

export default async function InstallPage() {
    // Double check if already installed
    const isInstalled = await prisma.settings.findUnique({
        where: { key: "is_installed" },
    });

    if (isInstalled?.value === "true") {
        redirect("/dashboard");
    }

    return <InstallPageContent />;
}
