import { readImage } from "@/server/media";
import { authorize, errorResponse } from "@/server/security";
export const dynamic = "force-dynamic";
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const actor = await authorize(request.headers).catch(() => undefined);
        const { asset, buffer } = await readImage((await params).id, actor);
        return new Response(new Uint8Array(buffer), {
            headers: {
                "Content-Type": asset.mime,
                "Content-Length": String(buffer.length),
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e) {
        return errorResponse(e);
    }
}
