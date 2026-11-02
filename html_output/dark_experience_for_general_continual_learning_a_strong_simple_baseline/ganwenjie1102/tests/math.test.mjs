import test from "node:test";
import assert from "node:assert/strict";
import { softmax, probabilityComparison, logitComparison, CLASSES, PROBABILITY_CLASSES, REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, LABEL_OLD, LABEL_CURRENT } from "../src/modules/math-model.ts";
import { MODEL_CLASSES } from "../src/data/model-classes.ts";

const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
test("softmax is stable and preserves normalized class coordinates", () => {
  assert.equal(CLASSES, MODEL_CLASSES);
  assert.deepEqual(CLASSES, ["Claude", "GPT", "DeepSeek"]);
  assert.deepEqual(PROBABILITY_CLASSES, CLASSES.slice(0, REFERENCE_P.length));
  assert.equal(CLASSES[HISTORY_Z.indexOf(Math.max(...HISTORY_Z))], "Claude");
  assert.equal(CLASSES[LOGIT_CASES[0].values.indexOf(Math.max(...LOGIT_CASES[0].values))], "GPT");
  const small = softmax([2, 1, 0]); const large = softmax([1002, 1001, 1000]);
  near(small.reduce((a,b) => a+b), 1); small.forEach((value,i) => near(value,large[i]));
  assert.ok(small.every((value) => value > 0));
});
test("all approved probability cases use one fixed target and match KL / entropy identity", () => {
  const expected = [0.09151622184943578, 0, 0.8317766166719343];
  PROBABILITY_CASES.forEach((item,index) => {
    const before = [...REFERENCE_P]; const result = probabilityComparison(REFERENCE_P,item.values);
    near(result.kl,expected[index]); near(result.kl,result.crossEntropy-result.entropy);
    assert.deepEqual(REFERENCE_P,before);
  });
  assert.ok(probabilityComparison(REFERENCE_P,PROBABILITY_CASES[0].values).terms[1] < 0);
});
test("KL output gradient agrees with finite differences through softmax", () => {
  const a=[Math.log(.6),Math.log(.4)], epsilon=1e-6;
  const result=probabilityComparison(REFERENCE_P,softmax(a));
  a.forEach((_,i) => { const plus=[...a],minus=[...a];plus[i]+=epsilon;minus[i]-=epsilon;
    near((probabilityComparison(REFERENCE_P,softmax(plus)).kl-probabilityComparison(REFERENCE_P,softmax(minus)).kl)/(2*epsilon),result.gradient[i],1e-9);
  });
});
test("logit examples keep history frozen, with correct distance and gradient", () => {
  LOGIT_CASES.forEach((item,index) => {
    const before=[...HISTORY_Z];const result=logitComparison(HISTORY_Z,item.values);
    assert.equal(result.squaredDistance,[2,3][index]);assert.deepEqual(HISTORY_Z,before);
    const epsilon=1e-6;
    item.values.forEach((_,k) => {const plus=[...item.values],minus=[...item.values];plus[k]+=epsilon;minus[k]-=epsilon;
      near((logitComparison(HISTORY_Z,plus).squaredDistance-logitComparison(HISTORY_Z,minus).squaredDistance)/(2*epsilon),result.gradient[k],1e-8);
    });
  });
});
test("common translation gives identical probabilities but nonzero squared distance", () => {
  const result=logitComparison(HISTORY_Z,LOGIT_CASES[1].values);
  result.p.forEach((v,i)=>near(v,result.q[i]));assert.equal(result.probabilityKL,0);assert.equal(result.squaredDistance,3);
});
test("hard-label example is equally correct while the other-class preference changes", () => {
  const p=softmax(LABEL_OLD),q=softmax(LABEL_CURRENT);
  near(-Math.log(p[0]),-Math.log(q[0]));assert.ok(p[1]>p[2]);assert.ok(q[1]<q[2]);
});
test("invalid probability support, dimensions, or nonfinite values cannot silently form a loss", () => {
  assert.throws(()=>probabilityComparison([.8,.2],[1,0]));assert.throws(()=>probabilityComparison([.8,.2],[.4,.4]));
  assert.throws(()=>logitComparison([1],[1,2]));assert.throws(()=>softmax([Infinity]));
});

import {binaryKL,coordinateStep,squaredCoordinate,retentionProbability} from "../src/modules/formula-model.ts";
test("binary curve differentiates the constrained probability, not independent coordinates",()=>{
 const e=1e-6;
 for(const q of [.02,.2,.6,.8,.95,.98]){
  const r=binaryKL(.8,q);
  near((binaryKL(.8,q+e).kl-binaryKL(.8,q-e).kl)/(2*e),r.slope,1e-6);
  near(r.kl,probabilityComparison([.8,.2],[q,1-q]).kl);
  near(r.reverse,probabilityComparison([q,1-q],[.8,.2]).kl);
  assert.ok(r.kl>=-1e-12);
  assert.equal(Math.sign(r.slope),Math.sign(q-.8));
 }
 near(binaryKL(.8,.8).kl,0);near(binaryKL(.8,.8).slope,0);
 near(binaryKL(.8,.2).kl,binaryKL(.8,.2).reverse);
 // Noncomplementary probabilities exhibit the asymmetry hidden by the swapped .8/.2 pair.
 assert.ok(Math.abs(binaryKL(.8,.6).kl-binaryKL(.8,.6).reverse)>1e-3);
 assert.ok(binaryKL(.8,.00001).kl>binaryKL(.8,.02).kl);
 assert.throws(()=>binaryKL(.8,0));assert.throws(()=>binaryKL(.8,1));
});
test("single-coordinate gradient step agrees with derivatives and moves down the parabola",()=>{
 const e=1e-6;
 for(const d of [-2,-1,0,.5,2]){
  const r=squaredCoordinate(d);
  near((squaredCoordinate(d+e).loss-squaredCoordinate(d-e).loss)/(2*e),r.slope,1e-8);
  near(coordinateStep(d),.6*d);
  assert.ok(squaredCoordinate(coordinateStep(d)).loss<=r.loss);
 }
 assert.throws(()=>coordinateStep(1,-.2));
});
test("reservoir teaching curve matches inclusion induction and the initial full-retention branch",()=>{
 for(let K=1;K<=5;K++)for(let n=1;n<30;n++){
  const p=retentionProbability(K,n);
  if(n<=K)near(p,1);
  else {near(p,K/n);near(retentionProbability(K,n-1)*(1-1/n),p);}
 }
 assert.throws(()=>retentionProbability(0,2));assert.throws(()=>retentionProbability(2,2.5));
});

import { RESPONSE_CASES, responseComparison } from "../src/modules/math-model.ts";
test("S2/S3 share three class coordinates and both representation losses", () => {
  assert.deepEqual(RESPONSE_CASES.map(c=>c.id),["equal","preference","shifted"]);
  assert.equal(RESPONSE_CASES[1].values,LABEL_CURRENT);
  for(let i=0;i<3;i++) {
    const r=responseComparison(i);
    assert.deepEqual(r.z,[2,1,0]);
    near(r.squaredDistance,[0,2,3][i]);
    near(r.probabilityKL,probabilityComparison(softmax(r.z),softmax(r.a)).kl);
    assert.deepEqual(r.klGradient,r.q.map((v,k)=>v-r.p[k]));
    if(i===1){assert.ok(r.probabilityKL>0);assert.deepEqual(r.differences,[0,-1,1]);assert.deepEqual(r.gradient,[0,-2,2]);}
    else near(r.probabilityKL,0);
    const epsilon=1e-6;
    r.a.forEach((_,k)=>{const plus=[...r.a],minus=[...r.a];plus[k]+=epsilon;minus[k]-=epsilon;
      near((logitComparison(r.z,plus).probabilityKL-logitComparison(r.z,minus).probabilityKL)/(2*epsilon),r.klGradient[k],1e-9);
    });
  }
  assert.throws(()=>responseComparison(-1));
});
