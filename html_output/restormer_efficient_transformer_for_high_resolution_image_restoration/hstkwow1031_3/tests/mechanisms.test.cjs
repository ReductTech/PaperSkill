const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/mechanisms.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleRecord={exports:{}};
new Function('exports','module',compiled)(moduleRecord.exports,moduleRecord);
const {mdtaToy,localToy,gelu,gateToy,residualToy,encoderShape,trainingSchedule}=moduleRecord.exports;
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('MDTA normalizes every output column and computes a convex mixture',()=>{
  for(const alpha of [.15,1,2])for(const mix of [0,.4,1]){
    const r=mdtaToy(mix,alpha,false);
    for(let j=0;j<3;j++)near(r.weights.reduce((s,row)=>s+row[j],0),1);
    assert.ok(r.output>=.2&&r.output<=.8);
    near(r.scores[0][0],1);near(r.scores[1][2],r.scores[2][1]);
  }
});
test('changing only remote features changes the local mixture through channel statistics',()=>{
  const a=mdtaToy(.15,1,false),b=mdtaToy(.15,1,true);
  assert.deepEqual(a.features.map(c=>c.slice(0,4)),b.features.map(c=>c.slice(0,4)));
  assert.ok(Math.abs(a.output-b.output)>.001);
});
test('small alpha concentrates attention and large alpha flattens it',()=>{
  const a=mdtaToy(1,.15,false),b=mdtaToy(1,2,false);
  assert.ok(a.weights[0][0]>b.weights[0][0]);
});
test('local projection uses three input channels and spatial mixing uses zero padding',()=>{
  near(localToy(12,false).value,.7225);
  near(localToy(12,true).value,.5791666666666667);
  assert.equal(localToy(0,true).neighbours.length,4);
  assert.ok(localToy(0,true).value<localToy(12,true).value);
});
test('GELU gate is signed and unbounded rather than a probability mask',()=>{
  near(gelu(0),0);near(gateToy(3,0),0);
  assert.ok(gateToy(-1,.8)<0);
  near(gateToy(2,.8),1.5636781552700415,1e-5);
});
test('residual gain zero preserves input and unit gain reconstructs known synthetic target',()=>{
  const zero=residualToy(0),one=residualToy(1),over=residualToy(1.8);
  assert.deepEqual(zero.output,zero.input);
  one.output.forEach((v,i)=>near(v,one.target[i]));near(one.mse,0);
  assert.ok(over.mse>one.mse);
});
test('four encoder scales have expected dimensions, channels and head counts',()=>{
  assert.deepEqual(encoderShape(0),{side:512,channels:48,heads:1,blocks:4});
  assert.deepEqual(encoderShape(3),{side:64,channels:384,heads:8,blocks:8});
  assert.deepEqual(trainingSchedule.map(s=>[s.patch,s.batch,s.start]),[[128,64,0],[160,40,92],[192,32,156],[256,16,204],[320,8,240],[384,8,276]]);
});
