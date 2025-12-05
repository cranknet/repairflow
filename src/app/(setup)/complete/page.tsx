import { CompletePageContent } from "./complete-page-content";

export default async function CompletePage() {
    // Get the base URL from environment variable or construct it
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/dashboard`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <CompletePageContent dashboardUrl={dashboardUrl} />
            </div>
        </div>
    );
}
