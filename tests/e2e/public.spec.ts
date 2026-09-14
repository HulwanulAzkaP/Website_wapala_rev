import {test,expect} from "@playwright/test";
import "../test-env";
test("public pages render real content, image and themes; closed recruitment is absent",async({page})=>{
 for(const path of ["/","/profil","/album","/divisi","/kontak"]){await page.goto(path,{waitUntil:"domcontentloaded"});await expect(page.locator("main h1")).toBeVisible();await expect(page.locator('a[href^="/pendaftaran"]')).toHaveCount(0);}
 await page.goto("/profil");await expect(page.getByRole("heading",{name:"Perjalanan Wapala"})).toBeVisible();
 const image=page.locator('img[src="/images/artilogo.png"]');await expect(image).toBeVisible();expect(await image.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 await page.getByRole("button",{name:"Ubah tema"}).click();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 const response=await page.request.get("/pendaftaran/create");expect(response.status()).toBe(404);
});
