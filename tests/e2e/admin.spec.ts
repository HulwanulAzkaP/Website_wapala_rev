import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import "../test-env";
import { randomBytes, randomUUID } from "node:crypto";
let email: string, password: string;
test.beforeAll(async () => {
    const { createOperator } = await import("../../src/server/operators");
    email = `browser-${randomUUID()}@test.invalid`;
    password = randomBytes(32).toString("hex");
    await createOperator(email, "Browser operator", password, "ADMIN");
});
test.afterAll(async () => {
    const { db } = await import("../../src/server/db");
    await db.user.deleteMany({ where: { email } });
    await db.$disconnect();
});
test("login, save persistent category, reload and delete, then logout", async ({
    page,
}) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi").fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page
        .getByRole("link", { name: "Kategori album", exact: true })
        .click();
    await page
        .getByRole("button", { name: "Tambah kategori", exact: true })
        .click();
    const slug = `browser-${randomUUID()}`;
    await page
        .getByRole("textbox", { name: "Nama", exact: true })
        .fill("Browser test category");
    await page.getByLabel("Slug URL (tetap setelah dibuat)").fill(slug);
    await page.getByLabel("Aktif", { exact: true }).check();
    await page.getByRole("button", { name: "Simpan", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Data tersimpan");
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const overflow = await page.evaluate(() =>
            Array.from(document.querySelectorAll("body *"))
                .filter((el) => {
                    const r = el.getBoundingClientRect();
                    return (
                        r.right > innerWidth + 1 &&
                        getComputedStyle(el).position !== "fixed"
                    );
                })
                .map((el) => ({
                    tag: el.tagName,
                    class: el.className,
                    width: el.getBoundingClientRect().width,
                }))
                .slice(0, 12),
        );
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
            JSON.stringify({ width, overflow }),
        ).toBe(true);
    }
    const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
    expect(
        accessibility.violations.map((v) => ({ id: v.id, impact: v.impact })),
    ).toEqual([]);
    await mkdir("var/evidence", { recursive: true });
    await page.screenshot({
        path: "var/evidence/admin-1440.png",
        fullPage: true,
    });
    const row = page.getByRole("row").filter({ hasText: slug });
    await expect(row).toContainText("Browser test category");
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Hapus", exact: true }).click();
    await expect(row).toHaveCount(0);
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    const response = await page.request.get("/api/admin/anggota");
    expect(response.status()).toBe(401);
});
