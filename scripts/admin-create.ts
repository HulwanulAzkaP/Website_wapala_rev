import "dotenv/config";
import { input, password, select, confirm } from "@inquirer/prompts";
import { createOperator } from "../src/server/operators";
import { db } from "../src/server/db";
try {
    if (!process.stdin.isTTY) throw new Error("Interactive terminal required.");
    if (!process.env.DATABASE_URL)
        throw new Error("Database configuration required.");
    const email = await input({ message: "Email pengelola:" });
    const name = await input({ message: "Nama pengelola:" });
    const role = await select<"ADMIN" | "EDITOR">({
        message: "Hak akses:",
        choices: [
            { name: "Editor konten", value: "EDITOR" },
            { name: "Administrator (termasuk data pribadi)", value: "ADMIN" },
        ],
    });
    const secret = await password({
        message: "Kata sandi (14–128 karakter):",
        mask: true,
    });
    const repeat = await password({
        message: "Ulangi kata sandi:",
        mask: true,
    });
    if (secret !== repeat) throw new Error("Passwords do not match.");
    if (
        await confirm({ message: "Buat akun pengelola ini?", default: false })
    ) {
        await createOperator(email, name, secret, role);
        console.log("Akun pengelola dibuat.");
    }
} catch {
    console.error(
        "Akun tidak dibuat. Periksa konfigurasi, keunikan email, dan isian; tidak ada kredensial dicatat.",
    );
    process.exitCode = 1;
} finally {
    await db.$disconnect();
}
