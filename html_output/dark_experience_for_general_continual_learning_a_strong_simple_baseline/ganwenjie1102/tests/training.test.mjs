import test from "node:test";import assert from "node:assert/strict";
import {runTraining,predict,trainStep,trainingSceneAt,STREAM,forward,viewOf} from "../src/modules/training-model.ts";
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
const expected={
 DER:[[.924831171,0,0,.924831171],[.996218307,.001450076,0,.996943345],[1.320544135,.008208513,0,1.324648391],[.795830653,.005751480,0,.798706393]],
 "DER++":[[.924831171,0,0,.924831171],[.996218307,.001450076,.860131109,1.427008899],[1.339471793,.017769232,.935701131,1.816206974],[.763913071,.010760951,1.173231484,1.355909289]]
};
for(const mode of ["DER","DER++"])test(mode+" follows approved W5 numerical fixture and read-update-write order",()=>{
 const steps=runTraining(mode);
 for(const [i,step] of steps.entries()){
  Object.values(step.losses).forEach((v,k)=>near(v,expected[mode][i][k]));
  assert.deepEqual(step.candidate.z,forward(step.before.W,viewOf(step.input.u,step.input.s)));
  assert.equal(step.before.N,i);assert.equal(step.updated.N,i);assert.equal(step.updated.updates,i+1);
  assert.strictEqual(step.updated.M,step.before.M);
  assert.equal(step.after.N,i+1);assert.equal(step.after.updates,i+1);
  if(i<3)assert.strictEqual(step.after,steps[i+1].before);
  if(i>0)assert.ok(step.before.M.includes(step.rd));
  assert.equal("y" in step.candidate,mode==="DER++");
  if(mode==="DER++"&&i>0)assert.ok(step.before.M.includes(step.ry));
 }
 assert.equal(steps[0].rd,null);assert.equal(steps[0].ry,null);
 if(mode==="DER++"){assert.strictEqual(steps[1].rd,steps[1].ry);assert.notStrictEqual(steps[2].rd,steps[2].ry);}
 assert.deepEqual(steps[3].after.M.map(r=>r.id),["x₃","x₂"]);
 assert.deepEqual(steps[0].candidate.z,[.22000000000000003,0,-.11000000000000001]);
 const snapshot=JSON.stringify(steps[3].after),result=predict(steps[3].after);
 assert.equal(result.label,0);assert.equal(JSON.stringify(steps[3].after),snapshot);
 const predicted=mode==="DER"?[.159186177,-.021224039,-.036373610]:[.151553393,-.050553588,.000588725];
 result.logits.forEach((v,k)=>near(v,predicted[k]));
 assert.strictEqual(trainingSceneAt(steps,13,.79).state,steps[2].before);
 assert.strictEqual(trainingSceneAt(steps,13,.8).state,steps[2].updated);
 assert.strictEqual(trainingSceneAt(steps,14,.88).state,steps[2].after);
 assert.strictEqual(trainingSceneAt(steps,20,1).state,steps[3].after);
 assert.throws(()=>trainStep(steps[3].before,{...STREAM[3],rd:"x₁"},mode));
});
test("joint gradient agrees with finite differences, including separate label replay",()=>{
 const step=runTraining("DER++")[2],eps=1e-6;
 for(let k=0;k<3;k++)for(let j=0;j<2;j++){
  const perturbed=delta=>{const W=step.before.W.map(row=>[...row]);W[k][j]+=delta;return trainStep({...step.before,W},step.input,"DER++").losses.total;};
  const numeric=(perturbed(eps)-perturbed(-eps))/(2*eps);
  near(numeric,step.gradients.total[k][j]);
 }
});
