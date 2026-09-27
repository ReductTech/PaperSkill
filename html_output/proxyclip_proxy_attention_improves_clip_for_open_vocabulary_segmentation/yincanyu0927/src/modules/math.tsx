export function MathRoot(){return null;}
export const rad=(a:number)=>a*Math.PI/180;
export const round=(x:number,d=3)=>Number.isFinite(x)?x.toFixed(d):'未定义';
export const sum=(v:number[])=>v.reduce((a,b)=>a+b,0);
export const mean=(v:number[])=>sum(v)/v.length;
export function softmax(a:number[]){const m=Math.max(...a);if(!Number.isFinite(m))return a.map(()=>NaN);const e=a.map(x=>Math.exp(x-m));return e.map(x=>x/sum(e));}
export function proxy(angles:number[],beta=1.2,gamma=3,mode=2){const s=angles.map(a=>angles.map(b=>Math.cos(rad(a-b))));const mu=mean(s.flat());const a=s.map(r=>r.map(v=>mode===0?v:gamma*(v-beta*mu)));const p=a.map(r=>softmax(r.map(v=>mode===2&&v<0?-Infinity:v)));return {s,mu,a,p};}
export const vals=[[1,.05],[.75,.3],[-.1,1],[.1,.85]];
export function multiply(p:number[][],v:number[][]){return p.map(r=>v[0].map((_,d)=>sum(r.map((w,j)=>w*v[j][d]))));}
export function cosine(a:number[],b:number[]){const na=Math.hypot(...a),nb=Math.hypot(...b);return na&&nb?sum(a.map((x,i)=>x*b[i]))/(na*nb):NaN;}
export function bilinear(v:number[],col:number,row:number){const x=col/3,y=row/3;const w=[(1-x)*(1-y),x*(1-y),(1-x)*y,x*y];return {w,value:sum(v.map((z,i)=>z*w[i]))};}
export const datasets=['VOC','Context','Object','VOC20','Context59','Stuff','City','ADE'];
export const mainRows=[
 {name:'SCLIP · B/16',v:[59.1,30.4,30.5,80.4,34.2,22.4,32.2,16.1],avg:38.2},
 {name:'CLIP-DINOiser',v:[62.2,32.4,35,80.2,35.9,24.6,31.7,20],avg:40.3},
 {name:'Proxy · B/16',v:[61.3,35.3,37.5,80.3,39.1,26.5,38.1,20.2],avg:42.3},
 {name:'Proxy · L/14',v:[60.6,34.5,39.2,83.2,37.7,25.6,40.1,22.6],avg:43.0},
 {name:'Proxy · H/14',v:[65,35.4,38.6,83.3,39.6,26.8,42,24.2],avg:44.4}
];
export const abRows=[
 {name:'无归一化 / 无mask',v:[32.5,18.8,17,70,22.1,14,15.8,10.3],avg:25},
 {name:'有归一化 / 无mask',v:[39.8,23.4,21.4,73.1,27,17.5,20,13.5],avg:29.5},
 {name:'有归一化 / 有mask',v:[61.3,35.3,37.5,80.3,39.1,26.5,38.1,20.2],avg:42.3}
];
export const hardRows=[{name:'MAE',v:[15.2,16.9,19.8,23,23.3],adaptive:23.1},{name:'SAM',v:[12.6,12.6,14,21.4,25.2],adaptive:25},{name:'DINOv2',v:[15.5,22.4,25.2,25.1,23.7],adaptive:25.4},{name:'DINO',v:[15.5,22.2,25.8,24.4,22],adaptive:26.5}];
export const truth=Array.from({length:48},(_,i)=>{const x=i%8,y=Math.floor(i/8);return (x>=2&&x<=5&&y>=1&&y<=4&&!(x===2&&y===1)&&!(x===5&&y===4))?1:0;});
export function binaryStats(pred:number[],actual:number[]){let tp=0,fp=0,fn=0;pred.forEach((x,i)=>{if(x&&actual[i])tp++;else if(x)fp++;else if(actual[i])fn++;});return {tp,fp,fn,iou:tp+fp+fn?tp/(tp+fp+fn):NaN};}
export function confusion(pred:number[],actual:number[],n:number){const cm=Array.from({length:n},()=>Array(n).fill(0) as number[]);pred.forEach((v,i)=>cm[actual[i]][v]++);const iou=cm.map((r,i)=>{const union=sum(r)+sum(cm.map(r=>r[i]))-r[i];return union?r[i]/union:NaN;});return {cm,iou,miou:mean(iou.filter(Number.isFinite)),accuracy:sum(cm.map((r,i)=>r[i]))/pred.length};}
