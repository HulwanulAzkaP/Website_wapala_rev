import { authorize, sameOrigin, errorResponse } from "@/server/security";
import { getContent, saveContent } from "@/server/site-content";
export async function GET(
    request: Request,
    { params }: { params: Promise<{ key: string }> },
) {
    try {
        await authorize(request.headers);
        return Response.json(await getContent((await params).key, true), {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (e) {
        return errorResponse(e);
    }
}
export async function POST(
    request: Request,
    { params }: { params: Promise<{ key: string }> },
) {
    try {
        sameOrigin(request);
        const actor = await authorize(request.headers);
        const body = await request.json();
        return Response.json(
            await saveContent(
                (await params).key,
                body.value,
                body.publish === true,
                actor,
            ),
        );
    } catch (e) {
        return errorResponse(e);
    }
}
