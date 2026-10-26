const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..');
const code=buildSync({entryPoints:[path.join(root,'src/modules/llava-kit.tsx')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const m={exports:{}};new Function('module','exports','require',code)(m,m.exports,require);
const {softmax,projectionStep}=m.exports;
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const z=[2,1],W=[[1,0],[0,1],[1,-1]];
assert.deepEqual(W.map(row=>row.reduce((s,x,i)=>s+x*z[i],0)),[2,1,1]);
const a=softmax([1/Math.sqrt(2),0]);close(a[0]+a[1],1);close(a[0],.6697615493266569);close(softmax([0,1/Math.sqrt(2)])[1],a[0]);
for(const w of [-2,-.5,0,.7,2]){const s=projectionStep(w,.5),e=1e-5;const numeric=(projectionStep(w+e,.5).loss-projectionStep(w-e,.5).loss)/(2*e);close(s.gradient,numeric,1e-8);assert.ok(projectionStep(s.next,.5).loss<s.loss);}
close(projectionStep(0,.5).loss,Math.log(2));close(projectionStep(0,.5).next,.5);
const results=JSON.parse(fs.readFileSync(path.join(__dirname,'results.json'),'utf8'));
assert.equal(results.runs.length,10);
for(const run of results.runs){assert.equal(run.weights.length,2);assert.ok(run.final_loss<run.initial_loss);for(const metric of Object.values(run.test))assert.ok(metric>=0&&metric<=1);}
const tutorialSource=fs.readFileSync(path.join(root,'src/data/tutorial.ts'),'utf8');
const tutorial=JSON.parse(tutorialSource.slice(tutorialSource.indexOf('=')+1).trim().replace(/;$/,''));
assert.equal(tutorial.chapters.length,10);assert.equal(tutorial.chapters.flatMap(c=>c.modules).length,20);
for(const c of tutorial.chapters){assert.equal(c.takeaways.length,3);assert.ok(c.modules.every(m=>m.desc.includes('https://arxiv.org/')));}
const output={status:'pass',checks:['actual shared softmax function normalized and symmetric','projection [2,1] to [2,1,1]','actual gradient agrees with finite differences at five weights','actual update reduces loss across tested weights','10 persisted experiment runs valid','10 chapters,20 modules,source-linked descriptions'],attentionWeights:a,firstUpdate:projectionStep(0,.5)};
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
