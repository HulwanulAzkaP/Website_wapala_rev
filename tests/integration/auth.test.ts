import "../test-env";
import { test } from "node:test";
import assert from "node:assert/strict";
test("operator-created admin signs in; anonymous and editor PII access denied", async () => {
    const { db } = await import("../../src/server/db");
    const { createOperator } = await import("../../src/server/operators");
    const { getAuth } = await import("../../src/server/auth");
    const auth = getAuth();
    const { authorize } = await import("../../src/server/security");
    const { randomBytes } = await import("node:crypto");
    const password = randomBytes(32).toString("hex");
    await db.user.deleteMany({
        where: { email: { endsWith: "@test.invalid" } },
    });
    await createOperator(
        "admin@test.invalid",
        "Test operator",
        password,
        "ADMIN",
    );
    const response = await auth.api.signInEmail({
        body: { email: "admin@test.invalid", password },
        asResponse: true,
    });
    assert.equal(response.status, 200);
    const cookies = response.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
    const actor = await authorize(new Headers({ cookie: cookies }), "ADMIN");
    assert.equal(actor.role, "ADMIN");
    await assert.rejects(() => authorize(new Headers(), "ADMIN"));
    await createOperator(
        "editor@test.invalid",
        "Test editor",
        password,
        "EDITOR",
    );
    const editor = await auth.api.signInEmail({
        body: { email: "editor@test.invalid", password },
        asResponse: true,
    });
    await assert.rejects(() =>
        authorize(
            new Headers({
                cookie: editor.headers
                    .getSetCookie()
                    .map((c) => c.split(";")[0])
                    .join("; "),
            }),
            "ADMIN",
        ),
    );
    const signup = await auth.api.signUpEmail({
        body: { name: "No", email: "no@test.invalid", password },
        asResponse: true,
    });
    assert.ok(signup.status >= 400);
    await db.$disconnect();
});
