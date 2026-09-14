import type { NextConfig } from "next";
const config: NextConfig = {
    poweredByHeader: false,
    devIndicators: false,
    output: "standalone",
    turbopack: { root: process.cwd() },
    serverExternalPackages: ["@prisma/client", "sharp"],
    outputFileTracingExcludes: {
        "/*": ["./var/**/*", "./.env*", "./tests/**/*", "./test-results/**/*"],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};
export default config;
