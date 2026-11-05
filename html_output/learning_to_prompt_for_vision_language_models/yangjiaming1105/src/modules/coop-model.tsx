import React from 'react';
export const ModelAnchor: React.FC = () => null;

type Pair = [number, number];
const A = [[.8, -.35], [.25, .9]];
const biases: Pair[] = [[.3,.8],[.8,.25],[-.7,-.5]];
const images: Pair[] = [[.8,.6],[.99,.1],[-.8,-.6]];
const unit = (a:Pair):Pair => { const n=Math.hypot(...a); return [a[0]/n,a[1]/n]; };

/** Fixed tiny differentiable encoder for teaching. This is not CLIP. */
export function toyModel(V:Pair, imageIndex=0) {
  const image = unit(images[imageIndex]);
  const hidden:Pair[] = biases.map(b => [Math.tanh(A[0][0]*V[0]+A[0][1]*V[1]+b[0]),Math.tanh(A[1][0]*V[0]+A[1][1]*V[1]+b[1])]);
  // epsilon makes normalization smooth even at zero; derivative below matches it exactly.
  const norms=hidden.map(h=>Math.sqrt(h[0]*h[0]+h[1]*h[1]+1e-12));
  const features:Pair[]=hidden.map((h,i)=>[h[0]/norms[i],h[1]/norms[i]]);
  const logits=features.map(w=>3*(w[0]*image[0]+w[1]*image[1]));
  const max=Math.max(...logits), exps=logits.map(l=>Math.exp(l-max)), sum=exps.reduce((a,b)=>a+b,0);
  const probs=exps.map(e=>e/sum);
  const loss=max+Math.log(sum)-logits[imageIndex];
  const perClassGrad:Pair[]=hidden.map((h,i)=>{
    const n=norms[i], dot=h[0]*image[0]+h[1]*image[1];
    const dh:Pair=[3*(image[0]/n-h[0]*dot/(n*n*n)),3*(image[1]/n-h[1]*dot/(n*n*n))];
    const dz:Pair=[dh[0]*(1-h[0]*h[0]),dh[1]*(1-h[1]*h[1])];
    const coefficient=probs[i]-(i===imageIndex?1:0);
    return [coefficient*(A[0][0]*dz[0]+A[1][0]*dz[1]),coefficient*(A[0][1]*dz[0]+A[1][1]*dz[1])];
  });
  const gradient:Pair=perClassGrad.reduce<Pair>((g,c)=>[g[0]+c[0],g[1]+c[1]],[0,0]);
  return {features,image,logits,probs,loss,gradient,perClassGrad};
}
