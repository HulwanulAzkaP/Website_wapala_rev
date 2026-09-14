import { test } from "node:test";
import assert from "node:assert/strict";
import { defaults, validateContent } from "../../src/server/site-content";
test("map configuration rejects scripts, credentials and non-embed hosts", () => {
    for (const mapUrl of [
        "javascript:alert(1)",
        "https://evil.test/maps/embed",
        "https://www.google.com/search",
    ])
        assert.throws(() =>
            validateContent("kontak", { ...defaults.kontak, mapUrl }),
        );
    assert.equal(
        validateContent("kontak", {
            ...defaults.kontak,
            mapUrl: "https://www.google.com/maps/embed?pb=1",
        }).mapUrl,
        "https://www.google.com/maps/embed?pb=1",
    );
});
