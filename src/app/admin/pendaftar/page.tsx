import {requirePageActor} from "@/server/page-authorization";import {HttpError} from "@/server/security";import {ApplicantManager} from "@/components/applicant-manager";
export default async function Applicants(){const actor=await requirePageActor();if(actor.role!=="ADMIN")throw new HttpError(403,"Akses ditolak.");return <ApplicantManager/>;}
