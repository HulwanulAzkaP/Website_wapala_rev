import sharp, { type Metadata } from "sharp";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { HttpError } from "./security";
import type { Actor } from "./content";
const directory = () =>
    resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR || "var/media");
export async function storeImage(
    buffer: Buffer,
    filename: string,
    actor: Actor,
) {
    if (
        !/\.(png|jpe?g|webp)$/i.test(filename) ||
        buffer.length > 10 * 1024 * 1024 ||
        !buffer.length
    )
        throw new HttpError(
            422,
            "Gunakan PNG, JPG, JPEG atau WebP maksimal 10 MB.",
        );
    let output: Buffer, meta: Metadata;
    try {
        const image = sharp(buffer, {
            limitInputPixels: 40_000_000,
            animated: false,
            failOn: "error",
        });
        meta = await image.metadata();
        if (
            !["png", "jpeg", "webp"].includes(meta.format || "") ||
            (meta.pages || 1) > 1
        )
            throw Error("format");
        output = await image
            .rotate()
            .toFormat(meta.format as "png" | "jpeg" | "webp")
            .toBuffer();
    } catch {
        throw new HttpError(422, "Gambar tidak valid atau terlalu besar.");
    }
    const clean = await sharp(output).metadata();
    const key = `${randomUUID()}.${meta.format}`;
    await mkdir(directory(), { recursive: true });
    await writeFile(resolve(directory(), key), output, {
        flag: "wx",
        mode: 0o600,
    });
    try {
        return await db.mediaAsset.create({
            data: {
                storageKey: key,
                mime: `image/${meta.format}`,
                bytes: output.length,
                width: clean.width!,
                height: clean.height!,
                ownerId: actor.id,
                private: true,
            },
        });
    } catch (error) {
        await unlink(resolve(directory(), key)).catch(() => {});
        throw error;
    }
}
export async function imageIsPublished(id: string): Promise<boolean> {
    const [division, cohort, photo, activity, book, contents] =
        await Promise.all([
            db.division.count({ where: { imageId: id, published: true } }),
            db.cohort.count({ where: { imageId: id, published: true } }),
            db.photo.count({
                where: {
                    imageId: id,
                    album: { published: true, category: { active: true } },
                },
            }),
            db.activity.count({
                where: {
                    imageId: id,
                    published: true,
                    division: { published: true },
                },
            }),
            db.book.count({
                where: {
                    imageId: id,
                    published: true,
                    division: { published: true },
                },
            }),
            db.siteContent.findMany({ select: { live: true } }),
        ]);
    return !!(
        division ||
        cohort ||
        photo ||
        activity ||
        book ||
        contents.some((c) =>
            Object.entries(c.live as Record<string, unknown>).some(
                ([k, v]) => k.endsWith("ImageId") && v === id,
            ),
        )
    );
}
export async function readImage(id: string, actor?: Actor) {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new HttpError(404, "Gambar tidak ditemukan.");
    const privileged =
        actor &&
        (actor.role === "ADMIN" ||
            (actor.role === "EDITOR" && asset.ownerId === actor.id));
    if (!privileged && !(await imageIsPublished(id)))
        throw new HttpError(404, "Gambar tidak ditemukan.");
    return {
        asset,
        buffer: await readFile(
            /* turbopackIgnore: true */ resolve(directory(), asset.storageKey),
        ),
    };
}
