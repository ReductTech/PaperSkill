import test from "node:test";
import assert from "node:assert/strict";
import { reservoirInsert, RESERVOIR_INPUTS as inputs, RESERVOIR_STEPS as steps, reservoirSceneAt } from "../src/modules/reservoir-model.ts";
test("four inputs preserve immutable records and count append, replace and rejection",()=>{
 assert.deepEqual(steps.map(s=>s.decision),["append","append","replace","reject"]);
 assert.deepEqual(steps.map(s=>s.after.N),[1,2,3,4]);
 assert.deepEqual(steps[3].after.M.map(r=>r.id),["x₃","x₂"]);
 assert.strictEqual(steps[3].after.M[1],inputs[1]);
 assert.deepEqual(steps[2].before.M.map(r=>r.id),["x₁","x₂"]);
 assert.strictEqual(steps[2].evicted,inputs[0]);
 for(let i=0;i<4;i++){
  assert.strictEqual(reservoirSceneAt(i,.89).state,steps[i].before);
  assert.strictEqual(reservoirSceneAt(i,.9).state,steps[i].after);
  if(i<3) assert.strictEqual(steps[i].after,steps[i+1].before);
 }
});
test("inclusive draw rejects K..N, never removes history on rejection, rejects invalid draws",()=>{
 const state=steps[2].before;
 for(const j of [0,1,2]){
  const result=reservoirInsert(state,inputs[2],j);
  assert.equal(result.after.N,3);assert.equal(result.after.K,2);
  assert.deepEqual(result.after.M.map(r=>r.id),j===0?["x₃","x₂"]:j===1?["x₁","x₃"]:["x₁","x₂"]);
 }
 for(const j of [-1,3,.5,undefined]) assert.throws(()=>reservoirInsert(state,inputs[2],j));
});
test("exhaustive legal draws give every processed item K/n marginal probability",()=>{
 let states=[{state:{K:2,N:0,M:[]},prob:1}];
 for(let i=0;i<4;i++){
  states=states.flatMap(({state,prob})=>(state.N<2?[undefined]:Array.from({length:state.N+1},(_,j)=>j)).map(j=>({state:reservoirInsert(state,inputs[i],j).after,prob:prob/(state.N<2?1:state.N+1)})));
  for(const item of inputs.slice(0,i+1)){
   const probability=states.reduce((sum,s)=>sum+(s.state.M.some(r=>r.id===item.id)?s.prob:0),0);
   assert.ok(Math.abs(probability-Math.min(1,2/(i+1)))<1e-12);
  }
 }
});
