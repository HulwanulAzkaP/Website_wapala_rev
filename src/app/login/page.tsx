import type { Metadata } from "next";
import {db} from "@/server/db";
import {localSetupEnabled} from "@/server/setup";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
import { LoginForm } from "@/components/login-form";
export const metadata: Metadata = {
    title: "Masuk admin",
    robots: { index: false, follow: false },
};
export default async function Login() {
    if(localSetupEnabled() && !(await db.user.count())) redirect("/setup");
    return (
        <main className="login-page">
            <section className="login-panel">
                <span className="eyebrow">WAPALA / ADMINISTRASI</span>
                <h1>Masuk admin</h1>
                <p>Kelola informasi dan arsip organisasi.</p>
                <LoginForm />
                <p>
                    Akun hanya dibuat oleh pengelola melalui perintah instalasi.
                </p>
            </section>
        </main>
    );
}
