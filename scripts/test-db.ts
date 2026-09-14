import EmbeddedPostgres from "embedded-postgres";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const password = randomBytes(32).toString("hex");
await mkdir("var/test", { recursive: true });
const pg = new EmbeddedPostgres({
    databaseDir: "var/test/postgres",
    user: "wapala_test",
    password,
    port: 55439,
    persistent: false,
    authMethod: "scram-sha-256",
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
    onError: () => {},
});
await pg.initialise();
await pg.start();
await pg.createDatabase("wapala_test");
await writeFile(
    "var/test/runtime.env",
    `DATABASE_URL=postgresql://wapala_test:${password}@127.0.0.1:55439/wapala_test
BETTER_AUTH_SECRET=${randomBytes(48).toString("hex")}
BETTER_AUTH_URL=http://127.0.0.1:3100
STORAGE_DIR=var/test/media
`,
    { mode: 0o600 },
);
console.log(
    "Isolated PostgreSQL ready on loopback port 55439; test configuration written privately.",
);
for (const s of ["SIGTERM", "SIGINT"] as const)
    process.on(s, async () => {
        await pg.stop();
        process.exit(0);
    });
setInterval(() => {}, 60000);
