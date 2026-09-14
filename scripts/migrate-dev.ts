import { config } from "dotenv";
import { spawnSync } from "node:child_process";
config({ path: "var/test/runtime.env", quiet: true });
const r = spawnSync(
    process.execPath,
    [
        "node_modules/prisma/build/index.js",
        "migrate",
        "dev",
        "--name",
        "initial",
    ],
    { env: process.env, stdio: "inherit" },
);
process.exit(r.status ?? 1);
