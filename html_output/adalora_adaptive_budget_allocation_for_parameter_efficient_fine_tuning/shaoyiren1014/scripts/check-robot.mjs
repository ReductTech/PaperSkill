import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {dirname,resolve} from 'node:path';import assert from 'node:assert/strict';import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url)),cache=new Map();function load(path){path=resolve(root,path);if(path.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));if(cache.has(path))return cache.get(path);const module={exports:{}};cache.set(path,module.exports);const native=createRequire(path),js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(name=>name.startsWith('.')?load(resolve(dirname(path),name.endsWith('.json')?name:name+'.ts')):native(name),module,module.exports);cache.set(path,module.exports);return module.exports;}

const storage=new Map();globalThis.localStorage={get length(){return storage.size},key:i=>[...storage.keys()][i]??null,getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const {robotReducer:r,initialRobot,restoreRobot,robotReady,robotUnlocked,robotReport,robotKey,captureLegacy}=load('src/store/robotStore.ts');
const {robotScheduleFrame,robotDisplayAllocation}=load('src/data/robotSimulation.ts');
const {robotStory,validRobotChain}=load('src/data/robotStory.ts');
assert.equal(robotStory.length,10);
for(let i=0;i<10;i++)storage.set(`adaptive-engine:act${i}:v1`,JSON.stringify({completed:i<6,firstPrediction:'different'}));
const old=Object.fromEntries(storage);let s=initialRobot(captureLegacy());assert.equal(Object.keys(s.legacy).length,10);assert.equal(s.chapters.filter(c=>c.completed).length,0);assert.deepEqual(robotUnlocked(s),[]);
s=r(s,{type:'act',value:9});assert.equal(robotReady(s),false);assert.equal(r(s,{type:'stage',value:2}),s);assert.equal(robotReport(s).approved,false);
function stage(n){s=r(s,{type:'stage',value:n});}
function finish(){assert.equal(robotReady(s),true);stage(2);s=r(s,{type:'complete'});assert.equal(s.chapters[s.act].completed,true);}
for(let act=0;act<9;act++){
 s=r(s,{type:'act',value:act});stage(1);assert.equal(s.chapters[act].stage,1);
 if(act===0)s=r(s,{type:'awake'});
 if(act===1){s=r(s,{type:'tuning',value:'full'});assert.equal(robotReady(s),false);s=r(s,{type:'tuning',value:'lora'});assert.ok(!robotUnlocked(s).includes('LoRA'));}
 if(act===2){s=r(s,{type:'predict',value:0});assert.equal(r(s,{type:'predict',value:1}).chapters[2].prediction,0);s=r(s,{type:'transfer',from:0,to:3});assert.deepEqual(s.allocation,[2,3,3,4]);for(let i=0;i<500;i++){s=r(s,{type:'transfer',from:i%4,to:(i*3+1)%4});assert.equal(s.allocation.reduce((a,b)=>a+b,0),12);assert.ok(s.allocation.every(v=>v>=0&&v<=8));}}
 if(act===3){s=r(s,{type:'pause'});assert.equal(s.strengthOn,false);s=r(s,{type:'strength',value:true});assert.equal(s.paused,true);}
 if(act===4){s=r(s,{type:'sensor',value:'single'});assert.equal(robotReady(s),false);s=r(s,{type:'sensor',value:'history'});}
 if(act===5){assert.deepEqual(s.times,[0]);for(let i=1;i<=3;i++)s=r(s,{type:'time',value:i});}
 if(act>=6)assert.equal(robotReady(s),true,'optional evidence must not become a gate');
 finish();storage.set(robotKey,JSON.stringify(s));assert.deepEqual(restoreRobot(),{...s,preview:'complete'});
}
assert.equal(robotUnlocked(s).length,13);assert.ok(robotUnlocked(s).includes('Ablation'));
s=r(s,{type:'act',value:9});stage(1);s=r(s,{type:'move',id:'structure',direction:-1});assert.ok(validRobotChain(s.chain));for(const type of ['why','how','boundary'])s=r(s,{type,value:'自己说明机制<script>不用自动判分</script>'});s=r(s,{type:'review'});assert.equal(robotReady(s),true);const before=s;s=r(s,{type:'how',value:'更新后的解释文字'});assert.equal(s.selfReviewed,false);s=r(s,{type:'review'});finish();const report=robotReport(s);assert.equal(report.completed,10);assert.equal(report.assembled,true);assert.equal(report.approved,true);assert.ok(!('accuracy' in report));assert.deepEqual(report.legacy,s.legacy);storage.set(robotKey,JSON.stringify(s));assert.deepEqual(restoreRobot(),{...s,preview:'complete'});
for(let t=0;t<4;t++){const frame=robotScheduleFrame(t);assert.equal(frame.sourceType,'conceptual_simulation');assert.equal(frame.allocation.reduce((a,b)=>a+b,0),frame.budget);assert.equal(new Set(frame.ids).size,frame.budget);}
assert.deepEqual(robotScheduleFrame(2).ids,robotScheduleFrame(3).ids);assert.deepEqual(robotDisplayAllocation(s),robotScheduleFrame(3).allocation);
s=r(s,{type:'act',value:3});s=r(s,{type:'reset'});assert.equal(s.chapters[3].completed,false);assert.equal(s.chapters[2].completed,true);assert.equal(s.chapters[4].completed,true);assert.equal(robotReport(s).approved,false);assert.equal(s.attempts.length,1);assert.ok(!robotUnlocked(s).includes('SVD Intuition'));assert.ok(robotUnlocked(s).includes('Importance Score'));assert.ok(robotReport(s).review.some(v=>v.act===3));
for(const [key,value] of Object.entries(old))assert.equal(storage.get(key),value,'legacy keys remain untouched');
for(const invalid of [{allocation:[12,0,0,0]},{version:1},{act:12},{chain:['why','why','score','time']},{sensor:'perfect'}]){storage.set(robotKey,JSON.stringify({...s,...invalid}));const restored=restoreRobot();assert.equal(restored.chapters.filter(c=>c.completed).length,0);assert.equal(Object.keys(restored.legacy).length,10);}
console.log('Robot story passed: 10-act flow, optional archives/predictions, assembly gates, 500 budget transfers, pause/recovery boundary, noisy score/phase gates, frozen final mask, 13 progressive unlocks, distinct old/new storage, report truthfulness, reset archives, review hints and corrupt-state recovery.');
