import {test,expect} from "@playwright/test";
test("applicants are protected even when recruitment closes",async({request})=>{const r=await request.get("/api/admin/applicants");expect(r.status()).toBe(401);});
