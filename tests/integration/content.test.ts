import "../test-env";
import { test } from "node:test";
import assert from "node:assert/strict";
test("database content CRUD enforces roles, relations and draft publication", async () => {
    const { db } = await import("../../src/server/db");
    const { saveRecord, listRecords, deleteRecord } =
        await import("../../src/server/content");
    const actor = { id: "test-editor", role: "EDITOR" };
    const slug = `division-${Date.now()}`;
    const division = await saveRecord(
        "divisi",
        {
            code: slug,
            name: "Test division",
            slug,
            summary: "Description",
            body: "Body",
            published: false,
            order: 0,
        },
        actor,
    );
    assert.ok(division.id);
    assert.equal(
        (await listRecords("divisi", {}, true)).some(
            (r: any) => r.id === division.id,
        ),
        false,
    );
    await saveRecord(
        "divisi",
        { ...division, published: true },
        actor,
        division.id,
    );
    assert.equal(
        (await listRecords("divisi", {}, true)).some(
            (r: any) => r.id === division.id,
        ),
        true,
    );
    await assert.rejects(() =>
        saveRecord("anggota", { name: "Private" }, actor),
    );
    const category = await saveRecord(
        "kategori-album",
        { name: "Test category", slug, active: true, order: 0 },
        actor,
    );
    const album = await saveRecord(
        "album",
        {
            title: "Test album",
            slug,
            categoryId: category.id,
            divisionId: division.id,
            published: true,
        },
        actor,
    );
    await assert.rejects(() =>
        deleteRecord("kategori-album", category.id, actor),
    );
    await deleteRecord("album", album.id, actor);
    await deleteRecord("kategori-album", category.id, actor);
    await deleteRecord("divisi", division.id, actor);
    await db.$disconnect();
});
