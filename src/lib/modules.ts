export type Field = {
    key: string;
    label: string;
    type?:
        | "text"
        | "textarea"
        | "number"
        | "date"
        | "datetime-local"
        | "checkbox"
        | "select"
        | "image"
        | "epub";
    required?: boolean;
    options?: string[];
    source?: string;
};
export type Module = {
    title: string;
    singular: string;
    model: string;
    pii?: boolean;
    public?: boolean;
    fields: Field[];
};
const name: Field = { key: "name", label: "Nama", required: true };
const slug: Field = {
    key: "slug",
    label: "Slug URL (tetap setelah dibuat)",
    required: true,
};
const code: Field = { key: "code", label: "Kode unik", required: true };
const published: Field = {
    key: "published",
    label: "Terbitkan",
    type: "checkbox",
};
const order: Field = { key: "order", label: "Urutan", type: "number" };
const description: Field = {
    key: "description",
    label: "Deskripsi",
    type: "textarea",
};
const image: Field = {
    key: "imageId",
    label: "Gambar PNG / JPG / JPEG / WebP",
    type: "image",
};
const division: Field = {
    key: "divisionId",
    label: "Divisi",
    type: "select",
    source: "divisi",
};
export const modules: Record<string, Module> = {
    divisi: {
        title: "Divisi",
        singular: "divisi",
        model: "division",
        public: true,
        fields: [
            name,
            code,
            slug,
            { key: "summary", label: "Ringkasan", type: "textarea" },
            { key: "body", label: "Isi", type: "textarea" },
            image,
            order,
            published,
        ],
    },
    angkatan: {
        title: "Angkatan",
        singular: "angkatan",
        model: "cohort",
        public: true,
        fields: [
            name,
            code,
            { key: "year", label: "Tahun", type: "number" },
            description,
            image,
            { key: "alt", label: "Deskripsi gambar" },
            order,
            published,
        ],
    },
    "kategori-album": {
        title: "Kategori album",
        singular: "kategori",
        model: "category",
        public: true,
        fields: [
            name,
            slug,
            description,
            order,
            { key: "active", label: "Aktif", type: "checkbox" },
        ],
    },
    album: {
        title: "Album",
        singular: "album",
        model: "album",
        public: true,
        fields: [
            { key: "title", label: "Judul", required: true },
            slug,
            description,
            {
                key: "categoryId",
                label: "Kategori",
                source: "kategori-album",
                type: "select",
                required: true,
            },
            division,
            { key: "activityDate", label: "Tanggal kegiatan", type: "date" },
            published,
        ],
    },
    foto: {
        title: "Foto album",
        singular: "foto",
        model: "photo",
        public: true,
        fields: [
            {
                key: "albumId",
                label: "Album",
                source: "album",
                type: "select",
                required: true,
            },
            { ...image, required: true },
            { key: "alt", label: "Deskripsi gambar", required: true },
            { key: "caption", label: "Keterangan" },
            order,
            { key: "cover", label: "Jadikan sampul", type: "checkbox" },
        ],
    },
    kegiatan: {
        title: "Kegiatan",
        singular: "kegiatan",
        model: "activity",
        public: true,
        fields: [
            { key: "title", label: "Judul", required: true },
            slug,
            { ...division, required: true },
            { key: "body", label: "Isi", type: "textarea" },
            {
                key: "activityDate",
                label: "Tanggal",
                type: "date",
                required: true,
            },
            image,
            { key: "albumId", label: "Album", source: "album", type: "select" },
            published,
        ],
    },
    buku: {
        title: "Buku EPUB",
        singular: "buku",
        model: "book",
        public: true,
        fields: [
            { key: "title", label: "Judul", required: true },
            slug,
            { key: "author", label: "Penulis", required: true },
            { ...division, required: true },
            { key: "summary", label: "Ringkasan", type: "textarea" },
            {
                key: "rights",
                label: "Pernyataan hak / izin publikasi",
                required: true,
            },
            image,
            {
                key: "epub",
                label: "Buku EPUB reflowable (maks. 25 MB)",
                type: "epub",
            },
            published,
        ],
    },
    referensi: {
        title: "Data referensi",
        singular: "referensi",
        model: "reference",
        pii: true,
        fields: [
            {
                key: "kind",
                label: "Jenis",
                type: "select",
                options: ["FACULTY", "PROGRAM", "STATUS"],
                required: true,
            },
            name,
            code,
            {
                key: "facultyId",
                label: "Fakultas (untuk program studi)",
                source: "referensi",
                type: "select",
            },
            { key: "active", label: "Aktif", type: "checkbox" },
        ],
    },
    anggota: {
        title: "Anggota",
        singular: "anggota",
        model: "member",
        pii: true,
        fields: [
            name,
            { key: "nim", label: "NIM" },
            { key: "nia", label: "NIA" },
            {
                key: "sex",
                label: "Jenis kelamin",
                type: "select",
                options: ["L", "P"],
            },
            { key: "phone", label: "Kontak" },
            { key: "email", label: "Email" },
            { key: "enrollmentYear", label: "Tahun masuk kampus" },
            { key: "membershipYear", label: "Tahun keanggotaan" },
            division,
            {
                key: "cohortId",
                label: "Angkatan WAPALA",
                source: "angkatan",
                type: "select",
            },
            {
                key: "programId",
                label: "Program studi",
                source: "referensi",
                type: "select",
            },
            {
                key: "statusId",
                label: "Status anggota",
                source: "referensi",
                type: "select",
            },
            image,
        ],
    },
    rekrutmen: {
        title: "Rekrutmen",
        singular: "periode",
        model: "recruitmentPeriod",
        pii: true,
        fields: [
            name,
            description,
            {
                key: "opensAt",
                label: "Mulai (waktu perangkat)",
                type: "datetime-local",
            },
            {
                key: "closesAt",
                label: "Selesai (waktu perangkat)",
                type: "datetime-local",
            },
            { key: "enabled", label: "Buka pendaftaran", type: "checkbox" },
            { key: "archived", label: "Arsipkan periode", type: "checkbox" },
        ],
    },
};
export const menu = Object.entries(modules)
    .filter(([key]) => key !== "foto")
    .map(([key, m]) => ({ key, title: m.title, pii: m.pii }));
