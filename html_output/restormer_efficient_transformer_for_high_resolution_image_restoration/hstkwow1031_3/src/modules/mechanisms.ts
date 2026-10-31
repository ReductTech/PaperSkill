/** Small, declared teaching models. These do not use trained Restormer weights. */
export const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export const trainingSchedule=[
  {patch:128,batch:64,start:0},{patch:160,batch:40,start:92},
  {patch:192,batch:32,start:156},{patch:256,batch:16,start:204},
  {patch:320,batch:8,start:240},{patch:384,batch:8,start:276},
];
export function encoderShape(level:number){
  const l=clamp(Math.round(level),0,3),d=2**l;
  return {side:512/d,channels:48*d,heads:d,blocks:[4,6,6,8][l]};
}
export function gelu(a:number){return .5*a*(1+Math.tanh(Math.sqrt(2/Math.PI)*(a+.044715*a*a*a)));}
export function gateToy(a:number,b:number){return gelu(a)*b;}
export function localToy(index:number,depthwise:boolean){
  const idx=clamp(Math.round(index),0,24),row=Math.floor(idx/5),col=idx%5;
  const channels=Array.from({length:3},(_,c)=>Array.from({length:25},(_,i)=>{
    const y=Math.floor(i/5),x=i%5;
    return c===0?(x<2?.15:.85):c===1?(y<2?.2:.75):((x+y)%2?.8:.2);
  }));
  const grid=Array.from({length:25},(_,i)=>.55*channels[0][i]+.3*channels[1][i]+.15*channels[2][i]);
  const neighbours:number[]=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const y=row+dy,x=col+dx;if(y>=0&&y<5&&x>=0&&x<5)neighbours.push(y*5+x);
  }
  return {channels,grid,neighbours,point:grid[idx],value:depthwise?neighbours.reduce((s,i)=>s+grid[i],0)/9:grid[idx]};
}
export function mdtaToy(mix:number,alpha:number,far:boolean){
  const t=clamp(mix,0,1),temperature=Math.max(.05,alpha);
  const features=[[1,.1,.8,.1,1,.1],[1-t,t,1-t,t,far?1:1-t,far?1:t],[.1,1,.1,.9,.1,1]];
  const normalized=features.map(c=>{const norm=Math.hypot(...c);return c.map(v=>v/norm);});
  const scores=normalized.map(k=>normalized.map(q=>k.reduce((s,v,i)=>s+v*q[i],0)));
  // Paper's N×C value convention: each column describes one output channel.
  const weights=scores.map(row=>row.map((_,j)=>{
    const max=Math.max(...scores.map(r=>r[j]));
    const exp=(v:number)=>Math.exp((v-max)/temperature);
    return exp(row[j])/scores.reduce((s,r)=>s+exp(r[j]),0);
  }));
  const values=[.2,.8,.5];
  return {features,scores,weights,values,output:values.reduce((s,v,i)=>s+v*weights[i][0],0)};
}
export function residualToy(gain:number){
  const target=[.15,.15,.75,.75,.2,.2,.85,.85,.3,.3,.65,.65];
  const noise=[.12,-.08,-.1,.11,.07,-.12,-.08,.09,.1,-.13,.12,-.1];
  const input=target.map((v,i)=>v+noise[i]),residual=target.map((v,i)=>v-input[i]);
  const output=input.map((v,i)=>v+gain*residual[i]);
  const mse=output.reduce((s,v,i)=>s+(v-target[i])**2,0)/output.length;
  return {target,input,residual,output,mse};
}
