import {currentRecruitment} from "@/server/public";
export const dynamic="force-dynamic";
export async function GET(){const period=await currentRecruitment();return Response.json({open:Boolean(period)},{headers:{"Cache-Control":"no-store"}});}
