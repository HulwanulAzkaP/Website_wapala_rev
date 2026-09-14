import "../test-env";import {test} from "node:test";import assert from "node:assert/strict";import {initialSetup} from "../../src/server/setup";
test("web administrator setup is disabled unless explicitly enabled",async()=>{delete process.env.ALLOW_INITIAL_SETUP;await assert.rejects(()=>initialSetup({}),e=>(e as {status:number}).status===404);});
