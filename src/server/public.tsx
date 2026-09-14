import {PublicShell} from "@/components/public-shell";
import {db} from "./db";import {isRecruitmentOpen} from "@/lib/availability";
export async function currentRecruitment(){const period=await db.recruitmentPeriod.findFirst({where:{enabled:true,archived:false},orderBy:{createdAt:"desc"}});return period&&isRecruitmentOpen(period)?period:null;}
export async function PublicPage({children}:{children:React.ReactNode}){return <PublicShell initialOpen={Boolean(await currentRecruitment())}>{children}</PublicShell>;}
export function Heading({title,eyebrow,description}:{title:string;eyebrow:string;description?:string}){return <div className="container page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>;}
export function media(id:string|null|undefined,fallback=""){return id?`/media/${id}`:fallback;}
