import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const globalDB = globalThis as unknown as { db?: PrismaClient };
export const db = globalDB.db ?? new PrismaClient({ log: ["warn"] });
if (process.env.NODE_ENV !== "production") globalDB.db = db;
