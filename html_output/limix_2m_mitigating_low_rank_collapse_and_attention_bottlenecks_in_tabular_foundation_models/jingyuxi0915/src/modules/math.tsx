import React from 'react';

export const MathSupport: React.FC = () => null;
export const X0 = [-2,-1,0,1,2];
export const LINEAR_W = [1,2,-1,0];
export const LINEAR_B = [0,1,0,1];
export const RBF_C = [-1,0,1];
export const RBF_W = [[1,0,0],[0,1,0],[0,0,1],[.5,-.5,.5]];
export const CUPS = [
  {name:'甲',height:8,diameter:6,capacity:200},
  {name:'乙',height:10,diameter:8,capacity:350},
  {name:'丙',height:12,diameter:10,capacity:500}
];
export function mean(v:number[]) { return v.reduce((a,b)=>a+b,0)/v.length; }
function finite(v:number[]) { if (!v.length || v.some(x=>!Number.isFinite(x))) throw new Error('需要有限数值'); }
export function standardize(v:number[],eps=1e-6) {
  finite(v); if(v.length<2) throw new Error('样本标准差需要至少两个值');
  const m=mean(v),std=Math.sqrt(v.reduce((a,x)=>a+(x-m)**2,0)/(v.length-1));
  return {values:v.map(x=>(x-m)/(std+eps)),mean:m,std};
}
export function affine(v:number[],bias=true) {return v.map(x=>LINEAR_W.map((w,j)=>x*w+(bias?LINEAR_B[j]:0)));}
export function center(a:number[][]) {
  if(!a.length)return [];
  const origin=a[0];
  const offsets=a.map(row=>row.map((x,j)=>x-origin[j]));
  const means=origin.map((_,j)=>mean(offsets.map(row=>row[j])));
  return offsets.map(row=>row.map((x,j)=>x-means[j]));
}
export function layerNorm(v:number[],eps=1e-5) {
  finite(v);const m=mean(v),variance=mean(v.map(x=>(x-m)**2));
  return v.map(x=>(x-m)/Math.sqrt(variance+eps));
}
export function rbf(x:number,sigma=1,centers=RBF_C) {
  if(!Number.isFinite(x)||!(sigma>0)||!Number.isFinite(sigma))throw new Error('数值须有限，带宽须为正');
  return centers.map(c=>Math.exp(-((x-c)**2)/(2*sigma*sigma)));
}
export function project(phi:number[]) {return RBF_W.map(row=>row.reduce((sum,w,j)=>sum+w*phi[j],0));}
export function rabel(values:number[],sigma=1) {
  const st=standardize(values),phi=st.values.map(x=>rbf(x,sigma));
  const projected=phi.map(project),normalized=projected.map(row=>layerNorm(row));
  return {standardized:st.values,phi,projected,normalized,mean:st.mean,std:st.std};
}
// One-sided Jacobi: orthogonalize columns directly, without squaring the condition number.
export function svd(matrix:number[][]) {
  const m=matrix.length,n=matrix[0]?.length??0;
  if(!m||!n||matrix.some(r=>r.length!==n||r.some(x=>!Number.isFinite(x))))throw new Error('矩阵必须非空、等宽且有限');
  const b=matrix.map(r=>[...r]);const v:number[][]=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
  const norm2=matrix.flat().reduce((s,x)=>s+x*x,0);
  let converged=norm2===0;
  for(let sweep=0;sweep<120&&!converged;sweep++){
    let rotations=0;
    for(let p=0;p<n-1;p++)for(let q=p+1;q<n;q++){
      let alpha=0,beta=0,gamma=0;
      for(let i=0;i<m;i++){alpha+=b[i][p]**2;beta+=b[i][q]**2;gamma+=b[i][p]*b[i][q];}
      if(alpha<=norm2*1e-30||beta<=norm2*1e-30||Math.abs(gamma)<=1e-14*Math.sqrt(alpha*beta))continue;
      const zeta=(beta-alpha)/(2*gamma),t=(zeta>=0?1:-1)/(Math.abs(zeta)+Math.hypot(1,zeta));
      const c=1/Math.hypot(1,t),s=c*t;
      for(let i=0;i<m;i++){const bp=b[i][p],bq=b[i][q];b[i][p]=c*bp-s*bq;b[i][q]=s*bp+c*bq;}
      for(let i=0;i<n;i++){const vp=v[i][p],vq=v[i][q];v[i][p]=c*vp-s*vq;v[i][q]=s*vp+c*vq;}
      rotations++;
    }
    if(!rotations)converged=true;
  }
  const norms=Array.from({length:n},(_,j)=>Math.hypot(...b.map(row=>row[j])));
  const order=norms.map((_,i)=>i).sort((a,c)=>norms[c]-norms[a]).slice(0,Math.min(m,n));
  return {s:order.map(j=>norms[j]),u:b.map(row=>order.map(j=>norms[j]>0?row[j]/norms[j]:0)),v:v.map(row=>order.map(j=>row[j])),converged};
}
export function spectrum(matrix:number[][]) {
  const out=svd(matrix),s=out.s,threshold=1e-10*(s[0]??0),rank=s.filter(x=>x>threshold).length;
  const energy=s.reduce((a,x)=>a+x*x,0),total=s.reduce((a,x)=>a+x,0);
  let sum=0;const cumulative=energy>0?s.map(x=>(sum+=x*x)/energy):[];
  const effective=total>0?Math.exp(-s.reduce((h,x)=>x>0?h+(x/total)*Math.log(x/total):h,0)):null;
  const findK=(fraction:number)=>energy>0?Math.min(s.length,cumulative.findIndex(x=>x>=fraction-1e-14)+1):null;
  return {s,rank,threshold,energy,effective,k95:findK(.95),k99:findK(.99),cumulative,converged:out.converged};
}
export function nearest(height:number,diameter:number) {
  if(!Number.isFinite(height)||!Number.isFinite(diameter)||height<1||height>30||diameter<1||diameter>30)throw new Error('杯高和口径必须是1～30cm的有限数值');
  const squaredDistances=CUPS.map(c=>(height-c.height)**2+(diameter-c.diameter)**2);
  const min=Math.min(...squaredDistances);
  const indices=squaredDistances.flatMap((d,i)=>Math.abs(d-min)<=1e-12*Math.max(1,min)?[i]:[]);
  return {squaredDistances,indices,value:mean(indices.map(i=>CUPS[i].capacity))};
}
export function attention(queryIndex:number) {
  const k=[[1,0],[0,1],[1,1]],v=[[1,0],[0,2],[1,2]];
  const q=k[Math.max(0,Math.min(2,queryIndex))],scores=k.map(row=>row.reduce((s,x,i)=>s+x*q[i],0)/Math.sqrt(2));
  const max=Math.max(...scores),ex=scores.map(x=>Math.exp(x-max)),sum=ex.reduce((a,b)=>a+b,0),weights=ex.map(x=>x/sum);
  return {q,k,v,scores,weights,output:[0,1].map(j=>weights.reduce((s,a,i)=>s+a*v[i][j],0))};
}
function softplus(x:number){return Math.max(0,x)+Math.log1p(Math.exp(-Math.abs(x)));}
export function gate(x:number) {
  if(!Number.isFinite(x))throw new Error('门控输入必须有限');
  const logMagnitude=Math.log2(Math.abs(x)+1e-6),bins=Array.from({length:17},(_,i)=>i-8);
  const logits=bins.map(b=>-((logMagnitude-b)**2)),max=Math.max(...logits),ex=logits.map(x=>Math.exp(x-max)),sum=ex.reduce((a,b)=>a+b,0),pi=ex.map(x=>x/sum);
  const embedding=pi.reduce((s,p,i)=>s+p*bins[i]/8,0),h1=Math.tanh(embedding),h2=Math.tanh(Math.sign(x));
  const gammaC=softplus(h1+.1*h2),gammaSigma=softplus(.5*h1-.1*h2);
  const phi=rbf(x,gammaSigma,RBF_C.map(c=>c*gammaC)),projected=project(phi),normalized=layerNorm(projected);
  return {logMagnitude,bins,pi,gammaC,gammaSigma,phi,projected,normalized};
}
export function readM02():number[]|null {
  try {const value=JSON.parse(sessionStorage.getItem('limix-v03-m02')||'null');return Array.isArray(value)&&value.length===5&&value.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=-3&&x<=3)?value:null;}catch{return null;}
}
export function saveM02(value:number[]) {
  try {if(value.length===5&&value.every(x=>Number.isFinite(x)&&x>=-3&&x<=3))sessionStorage.setItem('limix-v03-m02',JSON.stringify(value));}catch{/* Optional cross-chapter transfer; independent defaults still work. */}
}
