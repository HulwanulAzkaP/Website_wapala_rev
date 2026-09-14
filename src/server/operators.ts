import { db } from "./db";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export async function createOperator(
    email: string,
    name: string,
    password: string,
    role: "ADMIN" | "EDITOR",
) {
    const input = z
        .object({
            email: z.email().max(254),
            name: z.string().min(1).max(120),
            password: z.string().min(14).max(128),
            role: z.enum(["ADMIN", "EDITOR"]),
        })
        .parse({ email, name, password, role });
    const hash = await hashPassword(input.password);
    const id = randomUUID();
    return db.user.create({
        data: {
            id,
            email: input.email.toLowerCase(),
            name: input.name,
            role: input.role,
            emailVerified: true,
            accounts: {
                create: {
                    accountId: id,
                    providerId: "credential",
                    password: hash,
                },
            },
        },
        select: { id: true, email: true, role: true },
    });
}
