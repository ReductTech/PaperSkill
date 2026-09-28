export function MathRoot(){return null;}
export const rad=(a:number)=>a*Math.PI/180;
export const sum=(a:number[])=>a.reduce((s,v)=>s+v,0);
export const mean=(a:number[])=>sum(a)/a.length;
export const f=(v:number,d=3)=>Number.isFinite(v)?v.toFixed(d):'未定义';
export function sm(a:number[]){const m=Math.max(...a);if(!Number.isFinite(m))return a.map(()=>NaN);const e=a.map(v=>Math.exp(v-m)),s=sum(e);return e.map(v=>v/s);}
export function cos(a:number[],b:number[]){const n=Math.hypot(...a)*Math.hypot(...b);return n?sum(a.map((v,i)=>v*b[i]))/n:NaN;}
export const rot=(v:number[],a:number)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
export function nce(s:number[][]){const b=s.length,rows=s.map(sm),cols=Array.from({length:b},(_,j)=>sm(s.map(r=>r[j])));const row=-mean(rows.map((r,i)=>Math.log(r[i]))),col=-mean(cols.map((r,i)=>Math.log(r[i])));return {rows,cols,row,col,loss:(row+col)/2};}
export const trainScores=(a:number)=>[[Math.cos(a),-Math.sin(a)],[Math.sin(a),Math.cos(a)]];
export const trainLoss=(a:number)=>nce(trainScores(a)).loss;
export const grad=(a:number)=>(trainLoss(a+1e-5)-trainLoss(a-1e-5))/2e-5;
export const classes=['树林','花园','道路'];
export const truth=[0,0,1,0,1,1,2,2,2];
export const features=truth.map((c,i)=>[0,1,2].map(d=>d===c?.9:(i%2?.1:.05)));
export const heads=[[3,3,0,3,0,0,0,0,0],[0,0,3,0,3,3,0,0,0],[0,0,0,0,0,0,3,3,3]];
export function pool(a:number[]){const p=sm(a);return [0,1,2].map(d=>sum(features.map((v,i)=>p[i]*v[d])));}
export function rescale(a:number[],lo:number,hi:number){const amin=Math.min(...a),amax=Math.max(...a);return amax===amin?a.map(()=>NaN):a.map(v=>lo+(v-amin)/(amax-amin)*(hi-lo));}
export const rawS=[[.9,.82,.42,.85,.62,.35,.52,.47,.48],[.3,.35,.87,.26,.74,.9,.4,.49,.46]];
export function cleaning(r:number[][],maps=heads){return r.map(row=>{const weights=sm(row);const a=maps[0].map((_,j)=>sum(maps.map((h,i)=>weights[i]*h[j])));return {weights,a,spatial:sm(a),scaled:rescale(sm(a),Math.min(...rawS.flat()),Math.max(...rawS.flat()))};});}
export const defaultR=[[.9,.2,.1],[.1,.8,.2]];
export const dataNames=['V20','C59','Stuff','City','ADE','V21','C60','Object'];
export const main=[[[87.1,39.8,28.1,36.6,21.1,61.5,35.1,41],[88.5,42.4,30.2,38.1,22.5,65.8,37.7,45.1]],[[87.1,39.1,27,35.8,21.1,60.1,34.2,37.6],[89.8,42.7,29.6,38.4,22.9,66.1,37.3,42.3]]];
export const mainAvg=[[43.8,46.3],[42.8,46.1]];
export const smallProtocol=[[[88.3,39.1,27.4,38.2,20.2],[89.4,41.5,29.4,40.3,21.2]],[[86.6,38.2,26,36.4,19.3],[89.5,41.7,29.8,38.7,20.8]]];
export const ablations=[
 {title:'映射方向 · Table3',rows:[{name:'线性，仅文本',v:[85.1,37.9,26.7,35.6,20.1]},{name:'非线性，双侧映射',v:[59.2,27.3,18.9,23.5,13.5]},{name:'非线性，仅视觉',v:[84.6,35.2,26.2,20.4,15.5]},{name:'非线性，仅文本',v:[87.1,39.8,28.1,36.6,21.1]}]},
 {title:'选头策略 · Table3',rows:[{name:'只用CLS',v:[84.5,30.6,23,22.6,17.2]},{name:'标准平均',v:[89.6,36.9,25.6,33.5,19.7]},{name:'相似度加权平均',v:[87.6,35.2,23.1,29.3,17.5]},{name:'相似度加权采样',v:[88.2,32.9,22.6,27,17.9]},{name:'最大相似度',v:[87.1,39.8,28.1,36.6,21.1]}]},
 {title:'register与规模 · Table2',rows:[{name:'Small，无register',v:[83.7,38.3,25.8,32.9,19.8]},{name:'Small，有register',v:[86.9,35.3,24.5,27.2,16.9]},{name:'Base，无register',v:[74.2,31.9,23,27.9,16.5]},{name:'Base，有register',v:[87.1,39.8,28.1,36.6,21.1]},{name:'Large，无register',v:[56,20.1,14.9,18.1,8.2]},{name:'Large，有register',v:[87.1,39.1,27,35.8,21.1]}]}
];
