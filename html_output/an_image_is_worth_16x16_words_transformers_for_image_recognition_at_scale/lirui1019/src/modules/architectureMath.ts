// Small, deterministic forward pass for the architecture lesson, not ViT weights.
export const patchNames=['叶片','鸟嘴','翅膀','树枝'];
export const rowNames=['CLS',...patchNames];
export const patchInputs=[[.2,.4,.1],[.9,.2,.4],[.3,.8,.7],[.5,.1,.2]];
export const projection=[[.7,-.3,.2,.5],[.1,.8,-.4,.3],[-.5,.2,.9,-.2]];
export const clsSeed=[.1,-.1,.2,0];
export const positions=[[.02,.03,-.02,.01],[.1,0,-.1,.02],[0,.1,.02,-.1],[-.1,.02,.1,0],[.02,-.1,0,.1]];
export const headWeights=[[.7,-.2,-.5],[-.1,.6,.1],[.4,-.3,.2],[-.3,.2,.5]];
export function multiply(a:number[],w:number[][]){return w[0].map((_,j)=>a.reduce((s,v,i)=>s+v*w[i][j],0));}
export function norm(a:number[]){const mean=a.reduce((s,v)=>s+v,0)/a.length,sd=Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/a.length+1e-5);return a.map(v=>(v-mean)/sd);}
export function softmax(a:number[]){const e=a.map(v=>Math.exp(v-Math.max(...a))),s=e.reduce((x,y)=>x+y,0);return e.map(v=>v/s);}
const gelu=(v:number)=>.5*v*(1+Math.tanh(Math.sqrt(2/Math.PI)*(v+.044715*v*v*v)));
export function architectureExample(mask=false){
 const raw=patchInputs.map((r,i)=>r.map(v=>mask&&i===1?0:v));
 const projected=raw.map(r=>multiply(r,projection));
 const seeded=[clsSeed,...projected];
 const positioned=seeded.map((r,i)=>r.map((v,j)=>v+positions[i][j]));
 const normalized=positioned.map(norm);
 const attention=normalized.map(q=>[0,1].flatMap(h=>{
  const weights=softmax(normalized.map(k=>(q[2*h]*k[2*h]+q[2*h+1]*k[2*h+1])/Math.sqrt(2)));
  return [0,1].map(d=>.25*weights.reduce((s,v,i)=>s+v*normalized[i][2*h+d],0));
 }));
 const residual=positioned.map((r,i)=>r.map((v,j)=>v+attention[i][j]));
 const encoded=residual.map(r=>{const n=norm(r),hidden=[...n,...n.map(v=>-v)].map(gelu);return r.map((v,j)=>v+.45*hidden[j]+.2*hidden[(j+1)%4]-.3*hidden[j+4]);});
 const final=encoded.map(norm),readout=final[0],logits=multiply(readout,headWeights),probabilities=softmax(logits);
 return {raw,projected,seeded,positioned,attention,residual,encoded,final,readout,logits,probabilities};
}
