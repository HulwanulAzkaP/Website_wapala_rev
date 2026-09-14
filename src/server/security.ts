import { getAuth } from "./auth";
export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}
export async function authorize(
    headers: Headers,
    role: "ADMIN" | "EDITOR" = "EDITOR",
) {
    const session = await getAuth().api.getSession({ headers });
    if (!session) throw new HttpError(401, "Authentikasi diperlukan.");
    if (
        !["ADMIN", "EDITOR"].includes(session.user.role) ||
        (role === "ADMIN" && session.user.role !== "ADMIN")
    )
        throw new HttpError(403, "Akses ditolak.");
    return session.user;
}
export function sameOrigin(request: Request) {
    if (
        request.headers.get("origin") !==
        new URL(process.env.BETTER_AUTH_URL || "http://127.0.0.1:3100").origin
    )
        throw new HttpError(403, "Origin tidak diizinkan.");
}
export function errorResponse(error: unknown) {
    if (error instanceof HttpError)
        return Response.json(
            { error: error.message },
            { status: error.status },
        );
    if (error && typeof error === "object" && "issues" in error)
        return Response.json(
            { error: "Data tidak valid. Periksa isian dan relasi." },
            { status: 422 },
        );
    if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        ["P2002", "P2003", "P2025"].includes(String(error.code))
    )
        return Response.json(
            { error: "Data duplikat, tidak ditemukan, atau masih digunakan." },
            { status: 409 },
        );
    console.error(
        "Operation failed",
        error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
        { error: "Operasi gagal. Data belum disimpan." },
        { status: 500 },
    );
}
