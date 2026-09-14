import { cp, mkdir, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";
config({ quiet: true });
process.env.STORAGE_DIR = resolve(process.env.STORAGE_DIR || "var/media");
await access(".next/standalone/server.js");
await mkdir(".next/standalone/.next", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
try {
    await access("public");
    await cp("public", ".next/standalone/public", { recursive: true });
} catch (error) {
    if (error.code !== "ENOENT") throw error;
}
const child = spawn(process.execPath, [".next/standalone/server.js"], {
    env: {
        ...process.env,
        HOSTNAME: "127.0.0.1",
        PORT: process.env.PORT || "3100",
    },
    stdio: "inherit",
});
for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
