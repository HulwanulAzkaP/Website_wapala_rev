import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
    if (instance) return instance;
    if (
        !process.env.BETTER_AUTH_URL ||
        !process.env.BETTER_AUTH_SECRET ||
        process.env.BETTER_AUTH_SECRET.length < 32
    )
        throw new Error("Authentication configuration is incomplete.");
    instance = createAuth();
    return instance;
}
function createAuth() {
    return betterAuth({
        database: prismaAdapter(db, { provider: "postgresql" }),
        emailAndPassword: {
            enabled: true,
            disableSignUp: true,
            minPasswordLength: 14,
        },
        user: {
            additionalFields: {
                role: { type: "string", defaultValue: "EDITOR", input: false },
            },
        },
        rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
        session: {
            expiresIn: 60 * 60 * 8,
            updateAge: 60 * 15,
            cookieCache: { enabled: false },
        },
        trustedOrigins: [process.env.BETTER_AUTH_URL!],
    });
}
