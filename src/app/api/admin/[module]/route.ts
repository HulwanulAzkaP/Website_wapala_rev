import {
    authorize,
    sameOrigin,
    errorResponse,
    HttpError,
} from "@/server/security";
import { permit, listRecords, saveRecord } from "@/server/content";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ module: string }> };
export async function GET(request: Request, { params }: Context) {
    try {
        const { module } = await params;
        const actor = await authorize(request.headers);
        permit(module, actor);
        return Response.json(
            await listRecords(
                module,
                Object.fromEntries(new URL(request.url).searchParams),
            ),
            { headers: { "Cache-Control": "private, no-store" } },
        );
    } catch (e) {
        return errorResponse(e);
    }
}
export async function POST(request: Request, { params }: Context) {
    try {
        sameOrigin(request);
        const actor = await authorize(request.headers);
        if (Number(request.headers.get("content-length") || 0) > 100000)
            throw new HttpError(413, "Permintaan terlalu besar.");
        const { module } = await params;
        return Response.json(
            await saveRecord(module, await request.json(), actor),
            { status: 201 },
        );
    } catch (e) {
        return errorResponse(e);
    }
}
