import { authorize, sameOrigin, errorResponse } from "@/server/security";
import { saveRecord, deleteRecord } from "@/server/content";
type Context = { params: Promise<{ module: string; id: string }> };
export async function PATCH(request: Request, { params }: Context) {
    try {
        sameOrigin(request);
        const actor = await authorize(request.headers);
        const { module, id } = await params;
        return Response.json(
            await saveRecord(module, await request.json(), actor, id),
        );
    } catch (e) {
        return errorResponse(e);
    }
}
export async function DELETE(request: Request, { params }: Context) {
    try {
        sameOrigin(request);
        const actor = await authorize(request.headers);
        const { module, id } = await params;
        await deleteRecord(module, id, actor);
        return Response.json({ ok: true });
    } catch (e) {
        return errorResponse(e);
    }
}
