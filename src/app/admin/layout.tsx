import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authorize, HttpError } from "@/server/security";
import { AdminShell } from "@/components/admin-shell";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Admin",
    robots: { index: false, follow: false },
};
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let actor;
    try {
        actor = await authorize(await headers());
    } catch (error) {
        if (error instanceof HttpError && error.status === 401)
            redirect("/login");
        throw error;
    }
    return <AdminShell role={actor.role}>{children}</AdminShell>;
}
