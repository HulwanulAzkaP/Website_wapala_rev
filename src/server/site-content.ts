import { db } from "./db";
import { z } from "zod";
import { HttpError } from "./security";
import type { Actor } from "./content";
export const defaults: Record<string, Record<string, string>> = {
    beranda: {
        title: "Bertumbuh bersama. Merawat alam.",
        description:
            "WAPALA Telkom University Purwokerto — ruang untuk belajar, berpetualang, melestarikan alam dan mengabdi kepada masyarakat.",
        heroImageId: "",
        heroAlt: "",
        heroCaption: "",
        archiveTitle: "Arsip visual",
        archiveDescription: "Dokumentasi perjalanan WAPALA.",
        archiveImageId: "",
        archiveAlt: "",
    },
    tentang: {
        introduction:
            "WAPALA merupakan Unit Kegiatan Mahasiswa (UKM) Telkom University Purwokerto yang bergerak di bidang kepencintaalaman. WAPALA berusaha menyeimbangkan antara berpetualang di alam bebas, usaha pelestarian alam dan pengabdian masyarakat.",
        vision: "WAPALA Telkom University sebagai organisasi yang memiliki kepedulian tinggi terhadap alam dan lingkungan sekitar serta dapat meningkatkan intelektualitas, jasmani, rohani dan jiwa ksatria anggotanya.",
        mission1:
            "Memperluas hubungan kerjasama dan mempererat rasa kekeluargaan yang harmonis serta saling menguntungkan dengan organisasi eksternal.",
        mission2:
            "Menyelenggarakan kegiatan yang dapat membantu masyarakat, dan turut serta dalam usaha pelestarian alam dan lingkungan hidup.",
        mission3:
            "Membentuk anggota WAPALA Telkom University yang mampu berpikir dan bertindak kritis, bertanggung jawab, berwawasan luas yang berlandaskan nilai-nilai kekeluargaan.",
        mission4:
            "Mengembangkan kegiatan dalam rangka peningkatan kualitas tata kelola organisasi.",
        profileImageId: "",
        profileAlt: "Makna lambang WAPALA",
    },
    kontak: {
        email: "",
        address: "",
        instagram: "",
        mapUrl: "",
        directionsUrl: "",
    },
};
export function validateContent(key: string, value: unknown) {
    if (!defaults[key]) throw new HttpError(404, "Konten tidak ditemukan.");
    const shape = Object.fromEntries(
        Object.keys(defaults[key]).map((k) => [
            k,
            z.string().trim().max(10000),
        ]),
    );
    const data = z.object(shape).strict().parse(value) as Record<
        string,
        string
    >;
    if (data.mapUrl) {
        const url = new URL(data.mapUrl);
        if (
            url.origin !== "https://www.google.com" ||
            !(url.pathname === "/maps/embed" || url.pathname === "/maps/embed/")
        )
            throw new HttpError(
                422,
                "Gunakan URL embed Google Maps yang valid.",
            );
    }
    for (const field of ["instagram", "directionsUrl"])
        if (data[field]) {
            const u = new URL(data[field]);
            if (u.protocol !== "https:" || u.username || u.password)
                throw new HttpError(
                    422,
                    "Tautan harus HTTPS tanpa kredensial.",
                );
        }
    if (data.email) z.email().parse(data.email);
    for (const [field, v] of Object.entries(data))
        if (field.endsWith("ImageId") && v) z.string().uuid().parse(v);
    return data;
}
export async function getContent(key: string, draft = false) {
    if (!defaults[key]) throw new HttpError(404, "Tidak ditemukan.");
    const row = await db.siteContent.findUnique({ where: { id: key } });
    return {
        ...defaults[key],
        ...(row
            ? ((draft ? row.draft : row.live) as Record<string, string>)
            : {}),
    };
}
export async function saveContent(
    key: string,
    input: unknown,
    publish: boolean,
    actor: Actor,
) {
    if (!["ADMIN", "EDITOR"].includes(actor.role))
        throw new HttpError(403, "Akses ditolak.");
    const value = validateContent(key, input);
    for (const [k, v] of Object.entries(value))
        if (k.endsWith("ImageId") && v) {
            const asset = await db.mediaAsset.findUnique({ where: { id: v } });
            if (!asset || asset.ownerId.startsWith("application:"))
                throw new HttpError(422, "Gambar tidak tersedia.");
        }
    return db.$transaction(async (tx) => {
        const row = await tx.siteContent.upsert({
            where: { id: key },
            create: {
                id: key,
                draft: value,
                live: publish ? value : defaults[key],
            },
            update: { draft: value, ...(publish ? { live: value } : {}) },
        });
        await tx.auditEvent.create({
            data: {
                actorId: actor.id,
                action: publish ? "PUBLISH" : "DRAFT",
                target: `content:${key}`,
            },
        });
        return row;
    });
}
