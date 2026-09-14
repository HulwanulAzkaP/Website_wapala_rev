import "../test-env";
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
test("image upload preserves PNG alpha, persists bytes, strips metadata and denies private access", async () => {
    const { storeImage, readImage } = await import("../../src/server/media");
    const { db } = await import("../../src/server/db");
    const input = await sharp({
        create: {
            width: 20,
            height: 30,
            channels: 4,
            background: { r: 10, g: 20, b: 30, alpha: 0.5 },
        },
    })
        .png()
        .toBuffer();
    const asset = await storeImage(input, "IMAGE.PNG", {
        id: "test-editor",
        role: "EDITOR",
    });
    assert.equal(asset.mime, "image/png");
    await assert.rejects(() => readImage(asset.id));
    const loaded = await readImage(asset.id, {
        id: "test-editor",
        role: "EDITOR",
    });
    const meta = await sharp(loaded.buffer).metadata();
    assert.equal(meta.hasAlpha, true);
    assert.equal(meta.width, 20);
    assert.equal(meta.exif, undefined);
    await assert.rejects(() =>
        storeImage(Buffer.from("<svg/>"), "evil.png", {
            id: "test-editor",
            role: "EDITOR",
        }),
    );
    await db.mediaAsset.delete({ where: { id: asset.id } });
    await db.$disconnect();
});
