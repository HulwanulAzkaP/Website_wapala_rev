import {
    authorize,
    sameOrigin,
    errorResponse,
    HttpError,
} from "@/server/security";
import { storeImage } from "@/server/media";
import {boundedBody} from "@/server/http";
export async function POST(request: Request) {
    try {
        sameOrigin(request);
        const actor = await authorize(request.headers);
        if (
            Number(request.headers.get("content-length") || 0) >
            11 * 1024 * 1024
        )
            throw new HttpError(413, "Berkas terlalu besar.");
        const bytes = await boundedBody(request, 11*1024*1024);
        const form = await new Response(bytes, {headers:{"Content-Type":request.headers.get("content-type") || ""}}).formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new HttpError(422, "Pilih gambar.");
        return Response.json(
            await storeImage(
                Buffer.from(await file.arrayBuffer()),
                file.name,
                actor,
            ),
            { status: 201 },
        );
    } catch (e) {
        return errorResponse(e);
    }
}
