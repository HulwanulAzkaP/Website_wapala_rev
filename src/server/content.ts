import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./security";
import { modules } from "../lib/modules";
import type { Prisma } from "@prisma/client";
export type Actor = { id: string; role: string };
export function permit(key: string, actor: Actor) {
    const module = modules[key];
    if (!module) throw new HttpError(404, "Modul tidak ditemukan.");
    if (
        !["ADMIN", "EDITOR"].includes(actor.role) ||
        (module.pii && actor.role !== "ADMIN")
    )
        throw new HttpError(403, "Akses ditolak.");
    return module;
}
const nullableText = (max = 255) =>
    z
        .string()
        .trim()
        .max(max)
        .nullish()
        .transform((v) => v || null);
const text = (max = 255) => z.string().trim().max(max).default("");
const required = z.string().trim().min(1).max(200);
const slug = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160);
const uuid = z
    .string()
    .uuid()
    .nullish()
    .transform((v) => v || null);
const bool = z.boolean().default(false);
const order = z.coerce.number().int().min(0).max(100000).default(0);
const date = z.coerce.date().nullable().optional();
const schemas: Record<string, z.ZodType> = {
    divisi: z.object({
        name: required,
        code: required,
        slug,
        summary: text(2000),
        body: text(50000),
        imageId: uuid,
        published: bool,
        order,
    }),
    angkatan: z.object({
        name: required,
        code: required,
        year: z.number().int().min(1900).max(2200).nullish(),
        description: text(5000),
        imageId: uuid,
        alt: text(500),
        published: bool,
        order,
    }),
    "kategori-album": z.object({
        name: required,
        slug,
        description: text(5000),
        active: bool,
        order,
    }),
    album: z.object({
        title: required,
        slug,
        description: text(10000),
        categoryId: z.string().uuid(),
        divisionId: uuid,
        activityDate: date,
        published: bool,
    }),
    foto: z.object({
        albumId: z.string().uuid(),
        imageId: z.string().uuid(),
        alt: required,
        caption: text(2000),
        order,
        cover: bool,
    }),
    kegiatan: z.object({
        title: required,
        slug,
        body: text(50000),
        divisionId: z.string().uuid(),
        albumId: uuid,
        imageId: uuid,
        activityDate: z.coerce.date(),
        published: bool,
    }),
    buku: z.object({
        title: required,
        slug,
        author: required,
        summary: text(5000),
        rights: required,
        divisionId: z.string().uuid(),
        imageId: uuid,
        published: bool,
    }),
    referensi: z.object({
        kind: z.enum(["FACULTY", "PROGRAM", "STATUS"]),
        name: required,
        code: required,
        facultyId: uuid,
        active: bool,
    }),
    anggota: z.object({
        name: required,
        nim: nullableText(40),
        nia: nullableText(60),
        sex: z.enum(["L", "P"]).nullish(),
        phone: nullableText(80),
        email: z.email().max(254).nullish(),
        enrollmentYear: nullableText(10),
        membershipYear: nullableText(10),
        divisionId: uuid,
        cohortId: uuid,
        programId: uuid,
        statusId: uuid,
        imageId: uuid,
    }),
    rekrutmen: z.object({
        name: required,
        description: text(10000),
        enabled: bool,
        archived: bool,
        opensAt: date,
        closesAt: date,
    }),
};
function model(client: any, key: string): any {
    return client[modules[key].model];
}
export async function memberLock(tx: Prisma.TransactionClient) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81001)`;
    await tx.dataset.upsert({
        where: { id: "members" },
        create: { id: "members" },
        update: {},
    });
}
export async function saveRecord(
    key: string,
    input: unknown,
    actor: Actor,
    id?: string,
    extra?: { chapters: Prisma.InputJsonValue },
) {
    permit(key, actor);
    if (id) z.string().uuid().parse(id);
    const data: any = schemas[key].parse(input);
    return db.$transaction(
        async (tx) => {
            if (key === "anggota") await memberLock(tx);
            if (key === "rekrutmen") {
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(81002)`;
                if (
                    data.opensAt &&
                    data.closesAt &&
                    data.opensAt >= data.closesAt
                )
                    throw new HttpError(
                        422,
                        "Waktu selesai harus setelah mulai.",
                    );
                if (data.enabled && data.archived)
                    throw new HttpError(
                        422,
                        "Periode arsip tidak dapat dibuka.",
                    );
                if (data.enabled)
                    await tx.recruitmentPeriod.updateMany({
                        where: { id: { not: id } },
                        data: { enabled: false },
                    });
            }
            if (id && data.slug) {
                const old = await model(tx, key).findUnique({ where: { id } });
                if (old && old.slug !== data.slug)
                    throw new HttpError(
                        422,
                        "Slug tetap; buat entri baru untuk URL berbeda.",
                    );
            }
            if (data.imageId) {
                const image = await tx.mediaAsset.findUnique({
                    where: { id: data.imageId },
                });
                if (
                    !image ||
                    (image.private &&
                        image.ownerId !== actor.id &&
                        actor.role !== "ADMIN")
                )
                    throw new HttpError(403, "Gambar tidak dapat digunakan.");
                if (
                    key !== "anggota" &&
                    image.ownerId.startsWith("application:")
                )
                    throw new HttpError(403, "Foto pendaftar bersifat privat.");
            }
            if (key === "referensi" && data.facultyId) {
                const f = await tx.reference.findUnique({
                    where: { id: data.facultyId },
                });
                if (data.kind !== "PROGRAM" || f?.kind !== "FACULTY")
                    throw new HttpError(422, "Relasi fakultas tidak valid.");
            }
            if (key === "anggota")
                for (const [field, kind] of [
                    ["programId", "PROGRAM"],
                    ["statusId", "STATUS"],
                ])
                    if (data[field]) {
                        const ref = await tx.reference.findUnique({
                            where: { id: data[field] },
                        });
                        if (ref?.kind !== kind)
                            throw new HttpError(
                                422,
                                "Jenis referensi tidak sesuai.",
                            );
                    }
            if (key === "foto" && data.cover)
                await tx.photo.updateMany({
                    where: { albumId: data.albumId },
                    data: { cover: false },
                });
            if (key === "buku") {
                if (extra) data.chapters = extra.chapters;
                else if (!id)
                    throw new HttpError(422, "Unggah EPUB terlebih dahulu.");
            }
            const record = id
                ? await model(tx, key).update({ where: { id }, data })
                : await model(tx, key).create({ data });
            if (key === "anggota")
                await tx.dataset.update({
                    where: { id: "members" },
                    data: { version: { increment: 1 } },
                });
            await tx.auditEvent.create({
                data: {
                    actorId: actor.id,
                    action: id ? "UPDATE" : "CREATE",
                    target: `${key}:${record.id}`,
                },
            });
            return record;
        },
        { timeout: 15000 },
    );
}
export function publicFilter(key: string): any {
    switch (key) {
        case "divisi":
        case "angkatan":
            return { published: true };
        case "kategori-album":
            return { active: true };
        case "album":
            return { published: true, category: { active: true } };
        case "foto":
            return { album: { published: true, category: { active: true } } };
        case "kegiatan":
        case "buku":
            return { published: true, division: { published: true } };
        default:
            throw new HttpError(404, "Tidak ditemukan.");
    }
}
export async function listRecords(
    key: string,
    filter: Record<string, string> = {},
    isPublic = false,
) {
    if (!modules[key]) throw new HttpError(404, "Tidak ditemukan.");
    const where: any = isPublic ? publicFilter(key) : {};
    for (const k of ["slug", "divisionId", "albumId", "categoryId"])
        if (filter[k]) where[k] = filter[k];
    const q = filter.q?.trim().slice(0, 120);
    if (q)
        where[
            modules[key].fields.some((f) => f.key === "title")
                ? "title"
                : "name"
        ] = { contains: q, mode: "insensitive" };
    const page = Math.max(1, Number(filter.page) || 1);
    const ordering = modules[key].fields.some((f) => f.key === "order")
        ? [{ order: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];
    return model(db, key).findMany({
        where,
        orderBy: ordering,
        take: 50,
        skip: (page - 1) * 50,
    });
}
export async function deleteRecord(key: string, id: string, actor: Actor) {
    permit(key, actor);
    z.string().uuid().parse(id);
    await db.$transaction(async (tx) => {
        if (key === "anggota") await memberLock(tx);
        await model(tx, key).delete({ where: { id } });
        if (key === "anggota")
            await tx.dataset.update({
                where: { id: "members" },
                data: { version: { increment: 1 } },
            });
        await tx.auditEvent.create({
            data: {
                actorId: actor.id,
                action: "DELETE",
                target: `${key}:${id}`,
            },
        });
    });
}
