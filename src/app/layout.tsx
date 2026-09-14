import type { Metadata } from "next";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-serif-4/400.css";
import "./globals.css";
import "../styles/public.css";
import "../styles/workflows.css";
export const metadata: Metadata = {
    title: { default: "WAPALA", template: "%s — WAPALA" },
    description: "Wahana Pencinta Alam Telkom University Purwokerto",
};
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body>{children}</body>
        </html>
    );
}
