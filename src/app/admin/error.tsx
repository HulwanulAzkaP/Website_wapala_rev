"use client";
export default function AdminError({ reset }: { reset: () => void }) {
    return (
        <section>
            <h1>Halaman tidak dapat dimuat.</h1>
            <p>
                Periksa hak akses dan koneksi server. Perubahan belum
                dikonfirmasi tersimpan.
            </p>
            <button className="button" onClick={reset}>
                Coba kembali
            </button>
        </section>
    );
}
