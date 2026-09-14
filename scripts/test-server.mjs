import { config } from "dotenv";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
config({ path: "var/test/runtime.env", quiet: true });
process.env.BETTER_AUTH_URL = "http://127.0.0.1:3101";
process.env.PORT = "3101";
process.env.STORAGE_DIR = resolve(process.env.STORAGE_DIR || "var/test/media");
const args = process.env.PLAYWRIGHT_PRODUCTION
    ? ["scripts/start.mjs"]
    : [
          "node_modules/next/dist/bin/next",
          "dev",
          "--hostname",
          "127.0.0.1",
          "-p",
          "3101",
      ];
const child = spawn(process.execPath, args, {
    env: process.env,
    stdio: "inherit",
});
for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
