import {sameOrigin,errorResponse} from "@/server/security";import {initialSetup} from "@/server/setup";import {jsonBody} from "@/server/http";import {rateLimit} from "@/server/recruitment";
export async function POST(request:Request){try{sameOrigin(request);await rateLimit("initial-setup",5);return Response.json(await initialSetup(await jsonBody(request)));}catch(e){return errorResponse(e);}}
