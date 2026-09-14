import Link from "next/link";
import { requirePageActor } from "@/server/page-authorization";
import { authorize } from "@/server/security";
import { db } from "@/server/db";
export default async function Dashboard() {
    const actor = await requirePageActor();
    const [divisions, albums, cohorts, members] = await Promise.all([
        db.division.count(),
        db.album.count(),
        db.cohort.count(),
        actor.role === "ADMIN" ? db.member.count() : Promise.resolve(null),
    ]);
    return (
        <>
            <div className="section-heading">
                <div>
                    <span className="eyebrow">ADMINISTRASI</span>
                    <h1>Ringkasan organisasi.</h1>
                    <p>
                        Catatan tersimpan dalam database, termasuk konten draf.
                    </p>
                </div>
            </div>
            <dl className="summary-list">
                <div>
                    <dt>
                        <Link href="/admin/divisi">Divisi</Link>
                    </dt>
                    <dd>{divisions}</dd>
                </div>
                <div>
                    <dt>
                        <Link href="/admin/album">Album</Link>
                    </dt>
                    <dd>{albums}</dd>
                </div>
                <div>
                    <dt>
                        <Link href="/admin/angkatan">Angkatan</Link>
                    </dt>
                    <dd>{cohorts}</dd>
                </div>
                {members !== null && (
                    <div>
                        <dt>
                            <Link href="/admin/anggota">Anggota</Link>
                        </dt>
                        <dd>{members}</dd>
                    </div>
                )}
            </dl>
            <div className="notice">
                <strong>
                    Versi pengembangan — belum untuk publikasi produksi.
                </strong>
                <p>
                    Kelola divisi, angkatan, kategori, album, buku EPUB, data anggota, dan rekrutmen. Konten baru tampil di website setelah diterbitkan. Undangan email memerlukan konfigurasi SMTP.
                </p>
            </div>
        </>
    );
}
