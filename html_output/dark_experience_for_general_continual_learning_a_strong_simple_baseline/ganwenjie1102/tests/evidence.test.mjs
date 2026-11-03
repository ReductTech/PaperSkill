import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
import {EXPERIMENTS,COUNTEREXAMPLES} from "../src/modules/evidence-data.ts";
test("every source-listed result and reference counterexample resolves to the W2 source-checked Results table",async()=>{
 const model=(await readFile(new URL("../../../research/paper-model.md",import.meta.url),"utf8")).replace(/\s+/g,"");
 for(const e of EXPERIMENTS){assert.ok(e.locator.includes("Table"));assert.ok(e.setup&&e.protocol&&e.metric);for(const v of e.values)assert.ok(model.includes(v.mean.toFixed(2)+"±"+v.spread.toFixed(2)),e.id+" "+v.method+" must exist in checked paper model");}
 for(const e of COUNTEREXAMPLES)assert.ok(model.includes(e.text.replace(/\s+/g,"")),e.setting+" remains traceable");
});
