import { test } from "node:test";
import assert from "node:assert/strict";
import { isRecruitmentOpen } from "../../src/lib/availability";
test("recruitment fails closed and obeys exact schedule boundaries", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    assert.equal(isRecruitmentOpen(null, now), false);
    const p = {
        enabled: true,
        archived: false,
        opensAt: now,
        closesAt: new Date(now.getTime() + 1000),
    };
    assert.equal(isRecruitmentOpen(p, now), true);
    assert.equal(isRecruitmentOpen(p, p.closesAt), false);
    assert.equal(isRecruitmentOpen({ ...p, enabled: false }, now), false);
    assert.equal(isRecruitmentOpen({ ...p, archived: true }, now), false);
});
