import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = await readFile(new URL('../src/store/adaptationStore.ts', import.meta.url),'utf8');
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module = { exports:{} };
new Function('require','module','exports',js)(createRequire(import.meta.url),module,module.exports);
const { reducer, restore } = module.exports;
globalThis.localStorage = { getItem:()=>null };
let s = restore();
assert.equal(reducer(s,{type:'step',value:3}),s,'Evidence cannot precede prediction and operation');
assert.equal(reducer(s,{type:'complete'}),s,'Cannot complete without evidence and reflection');
s = reducer(s,{type:'predict',value:'unsure'});
assert.equal(reducer(s,{type:'predict',value:'equal'}).firstPrediction,'unsure','Keep original prediction');
s = reducer(s,{type:'strategy',value:'adjust'});
for (let i=0;i<800;i++) {
  s = reducer(s,{type:'transfer',from:i%4,to:Math.floor(i/7)%4});
  assert.equal(s.allocation.reduce((a,b)=>a+b,0),12,'Budget must be conserved');
  assert.ok(s.allocation.every(n=>Number.isInteger(n)&&n>=0&&n<=6),'Allocation stays in valid range');
}
assert.equal(reducer(s,{type:'transfer',from:0,to:0}),s,'No self-transfer');
assert.equal(reducer(s,{type:'transfer',from:9,to:0}),s,'No invalid department');
s=reducer(s,{type:'read'}); s=reducer(s,{type:'reflect',value:'universal'});
assert.equal(reducer(s,{type:'complete'}),s,'Overgeneralization must not complete chapter');
s=reducer(s,{type:'reflect',value:'conditional'}); s=reducer(s,{type:'complete'});
assert.equal(s.completed,true); assert.equal(s.step,5);
globalThis.localStorage={getItem:()=>JSON.stringify(s)};
assert.deepEqual(restore(),s,'Completed progress survives reload');
globalThis.localStorage={getItem:()=>JSON.stringify({...s,allocation:[12,0,0,0]})};
assert.equal(restore().completed,false,'Invalid saved budgets are rejected');
const data=JSON.parse(await readFile(new URL('../design/paper-evidence.json',import.meta.url),'utf8'));
const original=data.experiments.find(e=>e.id==='figure-1').panels[0].rows;
const runtime=await readFile(new URL('../src/data/paperEvidence.ts',import.meta.url),'utf8');
for(const row of original) assert.ok(runtime.includes(`value: ${row.accuracy}`),'Published values remain unchanged');
console.log('ACT 0 checks passed: 800 budget transfers, learning gates, first prediction, restore validation, original evidence values.');
