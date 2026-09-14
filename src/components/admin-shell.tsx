"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { menu } from "@/lib/modules";
import {ThemeControl} from "./theme-control";
export function AdminShell({
    role,
    children,
}: {
    role: string;
    children: React.ReactNode;
}) {
    const path = usePathname();
    const router = useRouter();
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    return (
        <div className="admin-layout">
            <a className="skip-link" href="#main">
                Lewati ke konten
            </a>
            <aside className="admin-sidebar">
                <Link className="admin-brand" href="/admin">
                    WAPALA.<small>RUANG PENGELOLA</small>
                </Link>
                <nav aria-label="Navigasi admin" className="admin-nav">
                    <Link
                        href="/admin"
                        aria-current={path === "/admin" ? "page" : undefined}
                    >
                        Ringkasan
                    </Link>
                    <span className="nav-label">DATA & KEGIATAN</span>
                    {menu
                        .filter((m) => !m.pii || role === "ADMIN")
                        .map((m) => (
                            <Link
                                key={m.key}
                                href={`/admin/${m.key}`}
                                aria-current={
                                    path === `/admin/${m.key}`
                                        ? "page"
                                        : undefined
                                }
                            >
                                {m.title}
                            </Link>
                        ))}
                {role === "ADMIN" && <Link href="/admin/pendaftar">Pendaftar & undangan</Link>}<span className="nav-label">KONTEN WEBSITE</span>{["beranda","tentang","kontak"].map(k=><Link key={k} href={`/admin/konten/${k}`}>{k=== "beranda"?"Beranda & arsip visual":k==="tentang"?"Tentang WAPALA":"Kontak & peta"}</Link>)}<Link href="/" target="_blank">Buka website ↗</Link></nav>
            </aside>
            <div className="admin-main-column">
                <header className="admin-topbar"><ThemeControl/>
                    <p>
                        WAPALA Telkom University
                        <br />
                        <strong>
                            {role === "ADMIN"
                                ? "Administrator"
                                : "Editor konten"}
                        </strong>
                    </p>
                    <button
                        className="button secondary"
                        disabled={pending}
                        onClick={async () => {
                            setPending(true);
                            setError("");
                            try {
                                const r = await fetch("/api/auth/sign-out", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: "{}",
                                });
                                if (!r.ok) throw Error();
                                router.replace("/login");
                                router.refresh();
                            } catch {
                                setError("Keluar gagal. Coba kembali.");
                            } finally {
                                setPending(false);
                            }
                        }}
                    >
                        {pending ? "Keluar…" : "Keluar"}
                    </button>
                </header>
                {error && (
                    <p role="alert" className="error">
                        {error}
                    </p>
                )}
                <main id="main" className="admin-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
