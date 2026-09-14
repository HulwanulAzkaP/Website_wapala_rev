import { config } from "dotenv";
const result = config({
    path: "var/test/runtime.env",
    quiet: true,
    override: true,
});
if (result.error || !result.parsed?.DATABASE_URL)
    throw new Error(
        "Isolated test configuration unavailable; refusing database tests.",
    );
const url = new URL(result.parsed.DATABASE_URL);
if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "55439" ||
    url.pathname !== "/wapala_test"
)
    throw new Error(
        "Database tests require the isolated loopback test instance.",
    );
