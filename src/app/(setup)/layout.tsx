import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Install RepairFlow",
    description: "Setup your RepairFlow installation",
};

export default function SetupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
