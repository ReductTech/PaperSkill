import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));const cache=new Map();
function load(path){path=resolve(root,path);if(cache.has(path))return cache.get(path);const module={exports:{}};cache.set(path,module.exports);const source=readFileSync(path,'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const native=createRequire(path);const require=name=>name.startsWith('.')?load(resolve(dirname(path),name+'.ts')):native(name);new Function('require','module','exports',js)(require,module,module.exports);cache.set(path,module.exports);return module.exports;}
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const {rankReducer:r,restoreRank,transferBlocked,eligibleRank}=load('src/store/rankStore.ts');
const {rankExperiment,rankMechanism}=load('src/data/rankAllocation.ts');let s=restoreRank();
assert.equal(r(s,{type:'transfer'}),s);assert.equal(r(s,{type:'read'}),s);assert.equal(r(s,{type:'complete'}),s);
for(let i=2;i<=6;i++)assert.equal(r(s,{type:'step',value:i}),s,'Cannot bypass chapter activities');
s=r(s,{type:'predict',value:'free'});assert.equal(r(s,{type:'predict',value:'tradeoff'}).prediction,'free');
s=r(s,{type:'step',value:2});const before=s.ranks;s=r(s,{type:'transfer'});assert.deepEqual(s.ranks,[2,3,4,3]);assert.deepEqual(before,[3,3,3,3]);
assert.equal(s.transfers[0].before[0],3);assert.equal(s.transfers[0].after[0],2);
for(let i=0;i<5000;i++){
  s=r(s,{type:'from',value:Math.floor(i/3)%4});s=r(s,{type:'to',value:Math.floor(i/11)%4});
  const previous=s;const blocked=transferBlocked(s);s=r(s,{type:'transfer'});
  assert.equal(s.ranks.reduce((a,b)=>a+b,0),12);assert.equal(s.ranks.reduce((a,b)=>a+b*128,0),1536);
  assert.ok(s.ranks.every(n=>Number.isInteger(n)&&n>=0&&n<=8));if(blocked)assert.equal(s,previous);
  else assert.deepEqual(s.ranks.map((n,j)=>n-previous.ranks[j]),[0,1,2,3].map(j=>j===s.from?-1:j===s.to?1:0),'Only the two named positions change');
}
for(const value of [-1,4,1.5,NaN])assert.equal(r(s,{type:'from',value}),s);
assert.match(transferBlocked({...s,from:0,to:0}),/不同/);
assert.match(transferBlocked({...s,ranks:[0,4,4,4],from:0,to:1}),/没有通道/);
assert.match(transferBlocked({...s,ranks:[8,2,1,1],from:1,to:0}),/上限/);
const transfers=s.transfers;s=r(s,{type:'equal'});assert.deepEqual(s.ranks,[3,3,3,3]);assert.equal(s.transfers,transfers,'Restore average retains attempts');
s=r(s,{type:'observe',value:'accuracy'});assert.equal(r(s,{type:'read'}),s,'Cannot confuse simulation and training');
s=r(s,{type:'observe',value:'capacity'});s=r(s,{type:'read'});assert.equal(r(s,{type:'observe',value:'weights'}),s,'Revisit cannot invalidate saved evidence');
s=r(s,{type:'reflect',value:'automatic'});assert.equal(r(s,{type:'complete'}),s);s=r(s,{type:'reflect',value:'universal'});assert.equal(r(s,{type:'complete'}),s);
s=r(s,{type:'reflect',value:'conditional'});s=r(s,{type:'complete'});assert.equal(s.completed,true);assert.equal(eligibleRank(s,6),true);
storage.set('adaptive-engine:act2:v1',JSON.stringify(s));assert.deepEqual(restoreRank(),s);
storage.set('adaptive-engine:act2:v1',JSON.stringify({...s,ranks:[3,3,3,4]}));assert.equal(restoreRank().completed,false);
storage.set('adaptive-engine:act2:v1',JSON.stringify({...s,transfers:[{from:0,to:1,before:[3,3,3,3],after:[4,2,3,3]}]}));assert.equal(restoreRank().completed,false);
const {archiveAttempt,readHistory}=load('src/store/learningHistory.ts');storage.set('adaptive-engine:act0:v1','preserved-0');storage.set('adaptive-engine:act1:v1','preserved-1');const history=archiveAttempt(2,s,[]);const reset=r(s,{type:'reset'});
assert.equal(reset.completed,false);assert.equal(reset.prediction,null);assert.equal(reset.evidenceRead,false);assert.equal(reset.transfers.length,0);assert.deepEqual(reset.ranks,[3,3,3,3]);assert.equal(history[0].state.prediction,'free');assert.equal(history[0].state.completed,true);assert.deepEqual(readHistory(),history);assert.equal(storage.get('adaptive-engine:act0:v1'),'preserved-0');assert.equal(storage.get('adaptive-engine:act1:v1'),'preserved-1');
const evidence=JSON.parse(readFileSync(resolve(root,'design/paper-evidence.json'),'utf8'));const spec=evidence.simulationSpecs.find(s=>s.id==='equal-dimension-rank');assert.deepEqual(rankExperiment.initialRanks,spec.initialRanks);assert.equal(rankExperiment.performanceMetrics,null);assert.equal(rankExperiment.source.type,'conceptual_simulation');assert.equal(rankMechanism.source.page,evidence.mechanismClaims.find(c=>c.id==='lora').source.page);assert.equal(rankMechanism.source.type,'paper_evidence');
console.log('ACT 2 passed: 5,000 transfer attempts, exact Rank/parameter conservation, named-pair updates, empty/full/self limits, learning gates, evidence boundaries, restore validation, isolated reset/history, source references.');
