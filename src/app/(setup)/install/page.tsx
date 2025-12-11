import { redirect } from "next/navigation";
import { isAppInstalled } from "@/lib/install-check";
import { InstallWizard } from "./components/install-wizard";

export default async function InstallPage() {
    // Check if already installed - redirect to dashboard
    const isInstalled = await isAppInstalled();

    if (isInstalled) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <InstallWizard />
        </div>
    );
}
