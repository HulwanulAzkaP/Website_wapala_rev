import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authorize, HttpError } from "./security";
export async function requirePageActor() {
    try {
        return await authorize(await headers());
    } catch (error) {
        if (error instanceof HttpError && error.status === 401)
            redirect("/login");
        throw error;
    }
}
