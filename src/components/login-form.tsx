"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const router = useRouter();
    return (
        <form
            onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setPending(true);
                setError("");
                try {
                    const response = await fetch("/api/auth/sign-in/email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: form.get("email"),
                            password: form.get("password"),
                            rememberMe: false,
                        }),
                    });
                    if (!response.ok) {
                        setError(
                            response.status === 429
                                ? "Terlalu banyak percobaan. Coba kembali nanti."
                                : "Email atau kata sandi tidak sesuai.",
                        );
                        return;
                    }
                    router.replace("/admin");
                    router.refresh();
                } catch {
                    setError("Server tidak dapat dihubungi. Coba kembali.");
                } finally {
                    setPending(false);
                }
            }}
        >
            <label className="form-field">
                Email
                <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    maxLength={254}
                    required
                />
            </label>
            <label className="form-field">
                Kata sandi
                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    maxLength={128}
                    required
                />
            </label>
            <p role="alert" className="error">
                {error}
            </p>
            <button className="button" disabled={pending}>
                {pending ? "Memeriksa…" : "Masuk"}
            </button>
        </form>
    );
}
