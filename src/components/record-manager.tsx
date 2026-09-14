"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { modules, type Field } from "@/lib/modules";
type RecordData = Record<string, unknown> & { id: string };
function valueText(value: unknown) {
    return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
}
function formValue(field: Field, value: unknown) {
    if (field.type === "checkbox") return Boolean(value);
    if (field.type === "datetime-local" && typeof value === "string" && value) {
        const date = new Date(value);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    }
    if (field.type === "date" && typeof value === "string")
        return value.slice(0, 10);
    return valueText(value);
}
export function RecordManager({ moduleKey }: { moduleKey: string }) {
    const module = modules[moduleKey];
    const [records, setRecords] = useState<RecordData[]>([]);
    const [options, setOptions] = useState<Record<string, RecordData[]>>({});
    const [editing, setEditing] = useState<RecordData | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [editorOpen, setEditorOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/admin/${moduleKey}?q=${encodeURIComponent(query)}&page=${page}`,
                { cache: "no-store" },
            );
            const data = await response.json();
            if (!response.ok) throw Error(data.error || "Daftar gagal dimuat.");
            setRecords(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Daftar gagal dimuat.");
        } finally {
            setLoading(false);
        }
    }, [moduleKey, query, page]);
    useEffect(() => {
        void load();
    }, [load]);
    useEffect(() => {
        let cancelled = false;
        const sources = [
            ...new Set(
                module.fields.flatMap((f) => (f.source ? [f.source] : [])),
            ),
        ];
        void Promise.all(
            sources.map(async (source) => {
                const rows: RecordData[] = [];
                let current = 1;
                while (true) {
                    const r = await fetch(
                        `/api/admin/${source}?page=${current}`,
                        { cache: "no-store" },
                    );
                    const data = await r.json();
                    if (!r.ok)
                        throw Error(data.error || "Pilihan gagal dimuat.");
                    rows.push(...data);
                    if (data.length < 50) break;
                    if (current++ >= 200)
                        throw Error(
                            "Pilihan terlalu banyak. Hubungi pengelola.",
                        );
                }
                return [source, rows] as const;
            }),
        )
            .then((entries) => {
                if (!cancelled) setOptions(Object.fromEntries(entries));
            })
            .catch((e) => {
                if (!cancelled)
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Pilihan gagal dimuat.",
                    );
            });
        return () => {
            cancelled = true;
        };
    }, [module]);
    useEffect(() => {
        if (!editorOpen) return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [editorOpen]);
    function openEditor(row: RecordData | null) {
        setEditing(row);
        setForm(
            Object.fromEntries(
                module.fields.map((f) => [
                    f.key,
                    formValue(
                        f,
                        row?.[f.key] ??
                            (f.type === "number" && f.key === "order" ? 0 : ""),
                    ),
                ]),
            ),
        );
        setEditorOpen(true);
        setStatus("");
        setError("");
    }
    function setValue(key: string, value: unknown) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }
    function selectable(field: Field) {
        return (options[field.source || ""] || []).filter((row) => {
            if (field.key === "facultyId") return row.kind === "FACULTY";
            if (field.key === "programId") return row.kind === "PROGRAM";
            if (field.key === "statusId") return row.kind === "STATUS";
            return true;
        });
    }
    const titleField =
        module.fields.find((f) => f.key === "name" || f.key === "title")?.key ||
        "alt";
    return (
        <>
            <div className="section-heading">
                <div>
                    <span className="eyebrow">DATA ORGANISASI</span>
                    <h1>{module.title}</h1>
                    <p>Tambah dan perbarui catatan organisasi.</p>
                </div>
                <button
                    className="button"
                    disabled={pending}
                    hidden={moduleKey === "buku"}
                    onClick={() => openEditor(null)}
                >
                    Tambah {module.singular}
                </button>
            </div>
            <form
                className="toolbar"
                onSubmit={(event) => {
                    event.preventDefault();
                    setPage(1);
                    setQuery(search);
                }}
            >
                <label className="form-field">
                    Cari {module.singular}
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        maxLength={120}
                    />
                </label>
                <button className="button secondary">Cari</button>
                {moduleKey === "album" && (
                    <Link href="/admin/kategori-album">Kelola kategori</Link>
                )}
            </form>
            <p role="status" className="status">
                {loading ? "Memuat data…" : status}
            </p>
            {error && (
                <p role="alert" className="error">
                    {error}
                </p>
            )}
            {editorOpen && (
                <section
                    className="record-editor"
                    aria-labelledby="editor-title"
                >
                    <h2 id="editor-title">
                        {editing ? "Edit" : "Tambah"} {module.singular}
                    </h2>
                    <form
                        className="form-grid"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setPending(true);
                            setStatus("");
                            setError("");
                            try {
                                const body = Object.fromEntries(
                                    module.fields
                                        .filter((f) => f.type !== "epub")
                                        .map((f) => {
                                            const v = form[f.key];
                                            return [
                                                f.key,
                                                f.type === "checkbox"
                                                    ? Boolean(v)
                                                    : f.type === "number"
                                                      ? v === ""
                                                          ? null
                                                          : Number(v)
                                                      : f.type ===
                                                          "datetime-local"
                                                        ? v
                                                            ? new Date(
                                                                  String(v),
                                                              ).toISOString()
                                                            : null
                                                        : f.type === "date"
                                                          ? v
                                                              ? `${v}T00:00:00.000Z`
                                                              : null
                                                          : f.type ===
                                                                  "select" ||
                                                              f.type ===
                                                                  "image" ||
                                                              [
                                                                  "email",
                                                                  "sex",
                                                                  "nim",
                                                                  "nia",
                                                                  "phone",
                                                                  "enrollmentYear",
                                                                  "membershipYear",
                                                              ].includes(f.key)
                                                            ? v || null
                                                            : v,
                                            ];
                                        }),
                                );
                                const response = await fetch(
                                    `/api/admin/${moduleKey}${editing ? `/${editing.id}` : ""}`,
                                    {
                                        method: editing ? "PATCH" : "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(body),
                                    },
                                );
                                const data = await response.json();
                                if (!response.ok)
                                    throw Error(
                                        data.error || "Data gagal disimpan.",
                                    );
                                setEditorOpen(false);
                                setStatus("Data tersimpan.");
                                await load();
                            } catch (e) {
                                setError(
                                    e instanceof Error
                                        ? e.message
                                        : "Data gagal disimpan.",
                                );
                            } finally {
                                setPending(false);
                            }
                        }}
                    >
                        {module.fields
                            .filter((f) => f.type !== "epub")
                            .map((field) => {
                                const id = `field-${field.key}`;
                                if (field.type === "checkbox")
                                    return (
                                        <label
                                            key={field.key}
                                            className="checkbox-label"
                                            htmlFor={id}
                                        >
                                            <input
                                                id={id}
                                                type="checkbox"
                                                checked={Boolean(
                                                    form[field.key],
                                                )}
                                                onChange={(e) =>
                                                    setValue(
                                                        field.key,
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            {field.label}
                                        </label>
                                    );
                                return (
                                    <div
                                        key={field.key}
                                        className={`form-field${field.type === "textarea" ? " full" : ""}`}
                                    >
                                        <label htmlFor={id}>
                                            {field.label}
                                            {field.required && (
                                                <span aria-hidden="true">
                                                    {" "}
                                                    *
                                                </span>
                                            )}
                                        </label>
                                        {field.type === "textarea" ? (
                                            <textarea
                                                id={id}
                                                value={valueText(
                                                    form[field.key],
                                                )}
                                                onChange={(e) =>
                                                    setValue(
                                                        field.key,
                                                        e.target.value,
                                                    )
                                                }
                                                maxLength={50000}
                                                required={field.required}
                                            />
                                        ) : field.type === "select" ? (
                                            <select
                                                id={id}
                                                value={valueText(
                                                    form[field.key],
                                                )}
                                                onChange={(e) =>
                                                    setValue(
                                                        field.key,
                                                        e.target.value,
                                                    )
                                                }
                                                required={field.required}
                                            >
                                                <option value="">Pilih…</option>
                                                {field.options
                                                    ? field.options.map((v) => (
                                                          <option
                                                              key={v}
                                                              value={v}
                                                          >
                                                              {v}
                                                          </option>
                                                      ))
                                                    : selectable(field).map(
                                                          (row) => (
                                                              <option
                                                                  key={row.id}
                                                                  value={row.id}
                                                              >
                                                                  {valueText(
                                                                      row.name ||
                                                                          row.title,
                                                                  )}
                                                                  {row.active ===
                                                                  false
                                                                      ? " (arsip)"
                                                                      : ""}
                                                              </option>
                                                          ),
                                                      )}
                                            </select>
                                        ) : field.type === "image" ? (
                                            <>
                                                <input
                                                    id={id}
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                                                    disabled={pending}
                                                    onChange={async (e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (!file) return;
                                                        setPending(true);
                                                        setError("");
                                                        try {
                                                            if (
                                                                file.size >
                                                                10 * 1024 * 1024
                                                            )
                                                                throw Error(
                                                                    "Gambar maksimal 10 MB.",
                                                                );
                                                            const data =
                                                                new FormData();
                                                            data.set(
                                                                "file",
                                                                file,
                                                            );
                                                            const r =
                                                                await fetch(
                                                                    "/api/admin/media",
                                                                    {
                                                                        method: "POST",
                                                                        body: data,
                                                                    },
                                                                );
                                                            const image =
                                                                await r.json();
                                                            if (!r.ok)
                                                                throw Error(
                                                                    image.error ||
                                                                        "Unggah gagal.",
                                                                );
                                                            setValue(
                                                                field.key,
                                                                image.id,
                                                            );
                                                        } catch (error) {
                                                            setError(
                                                                error instanceof
                                                                    Error
                                                                    ? error.message
                                                                    : "Unggah gagal.",
                                                            );
                                                        } finally {
                                                            setPending(false);
                                                        }
                                                    }}
                                                />
                                                {Boolean(form[field.key]) && (
                                                    <>
                                                        <img
                                                            className="image-preview"
                                                            src={`/media/${form[field.key]}`}
                                                            alt="Pratinjau gambar yang dipilih"
                                                        />
                                                        <button
                                                            className="button secondary"
                                                            type="button"
                                                            onClick={() =>
                                                                setValue(
                                                                    field.key,
                                                                    "",
                                                                )
                                                            }
                                                        >
                                                            Lepas gambar
                                                        </button>
                                                    </>
                                                )}
                                                <small>
                                                    Gambar baru terhubung ke
                                                    catatan setelah disimpan.
                                                </small>
                                            </>
                                        ) : (
                                            <input
                                                id={id}
                                                type={field.type || "text"}
                                                value={valueText(
                                                    form[field.key],
                                                )}
                                                readOnly={
                                                    field.key === "slug" &&
                                                    Boolean(editing)
                                                }
                                                onChange={(e) =>
                                                    setValue(
                                                        field.key,
                                                        e.target.value,
                                                    )
                                                }
                                                required={field.required}
                                                maxLength={
                                                    field.type ? undefined : 255
                                                }
                                                min={
                                                    field.key === "order"
                                                        ? 0
                                                        : undefined
                                                }
                                            />
                                        )}
                                        {field.source && (
                                            <Link
                                                className="reference-link"
                                                href={`/admin/${field.source}`}
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                Kelola{" "}
                                                {modules[
                                                    field.source
                                                ].title.toLowerCase()}{" "}
                                                (tab baru)
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        <div className="form-actions">
                            <button className="button" disabled={pending}>
                                {pending ? "Memproses…" : "Simpan"}
                            </button>
                            <button
                                className="button secondary"
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            "Batalkan perubahan yang belum disimpan?",
                                        )
                                    )
                                        setEditorOpen(false);
                                }}
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </section>
            )}
            {!loading && !records.length ? (
                <div className="empty">
                    Belum ada data{query ? " yang sesuai pencarian" : ""}.
                </div>
            ) : (
                <div className="table-scroll">
                    <table>
                        <caption>
                            {module.title} — halaman {page}
                        </caption>
                        <thead>
                            <tr>
                                <th>Nama / judul</th>
                                <th>Kode / URL</th>
                                <th>Status</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((row) => (
                                <tr key={row.id}>
                                    <td>{valueText(row[titleField])}</td>
                                    <td>
                                        {valueText(
                                            row.code || row.slug || row.nim,
                                        )}
                                    </td>
                                    <td>
                                        {"published" in row
                                            ? row.published
                                                ? "Terbit"
                                                : "Draf"
                                            : "active" in row
                                              ? row.active
                                                  ? "Aktif"
                                                  : "Arsip"
                                              : "enabled" in row
                                                ? row.archived
                                                    ? "Arsip"
                                                    : row.enabled
                                                      ? "Diaktifkan"
                                                      : "Ditutup"
                                                : "—"}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button
                                                className="button secondary"
                                                disabled={pending}
                                                onClick={() => openEditor(row)}
                                            >
                                                Edit
                                            </button>
                                            {moduleKey === "album" && (
                                                <Link
                                                    className="button secondary"
                                                    href="/admin/foto"
                                                >
                                                    Kelola foto
                                                </Link>
                                            )}
                                            <button
                                                className="button danger"
                                                disabled={pending}
                                                onClick={async () => {
                                                    if (
                                                        !window.confirm(
                                                            "Hapus catatan ini? Data yang masih digunakan tidak dapat dihapus.",
                                                        )
                                                    )
                                                        return;
                                                    setPending(true);
                                                    setError("");
                                                    try {
                                                        const r = await fetch(
                                                            `/api/admin/${moduleKey}/${row.id}`,
                                                            {
                                                                method: "DELETE",
                                                            },
                                                        );
                                                        const data =
                                                            await r.json();
                                                        if (!r.ok)
                                                            throw Error(
                                                                data.error ||
                                                                    "Data gagal dihapus.",
                                                            );
                                                        setStatus(
                                                            "Data dihapus.",
                                                        );
                                                        await load();
                                                    } catch (e) {
                                                        setError(
                                                            e instanceof Error
                                                                ? e.message
                                                                : "Data gagal dihapus.",
                                                        );
                                                    } finally {
                                                        setPending(false);
                                                    }
                                                }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="pagination">
                <button
                    className="button secondary"
                    disabled={page === 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                >
                    Sebelumnya
                </button>
                <span>Halaman {page}</span>
                <button
                    className="button secondary"
                    disabled={records.length < 50 || loading}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Berikutnya
                </button>
            </div>
        </>
    );
}
