import { CompletePageContent } from "./complete-page-content";

export default async function CompletePage() {
    // Get the base URL from environment variable or construct it
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/dashboard`;

    return <CompletePageContent dashboardUrl={dashboardUrl} />;
}
