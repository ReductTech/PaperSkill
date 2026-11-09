import {useState} from 'react';
import {C,SceneCanvas,clearScene,drawLine,drawDot,drawText,drawTrail} from './cm-kit';

const EPS=.002,VARIANCE=.25;
export function gaussianFlow(t:number,branch:number){const x=branch*Math.sqrt(VARIANCE+t*t);return {x,score:-x/(VARIANCE+t*t),endpoint:x*Math.sqrt((VARIANCE+EPS*EPS)/(VARIANCE+t*t))};}

export function ProbabilityFlow(){
 const [t,setT]=useState(2),[branch,setBranch]=useState(1);const current=gaussianFlow(t,branch);
 const xPixel=(time:number)=>100+time/3*570,yPixel=(x:number)=>140-x*32;
 return <div>
  <SceneCanvas ariaLabel="一维高斯例子的概率流轨迹：改变时间后，选中状态移动，而映射的数据端点不变" draw={ctx=>{
   clearScene(ctx);drawLine(ctx,100,140,690,140,C.border,2);drawLine(ctx,100,25,100,255,C.border,2);
   drawText(ctx,'噪声时间',550,260,C.muted,17);drawText(ctx,'共同端点',820,35,C.green,18);
   for(const b of [-1,1]){const points:[number,number][]=Array.from({length:80},(_,i)=>{const time=EPS+(3-EPS)*i/79;return[xPixel(time),yPixel(gaussianFlow(time,b).x)];});drawTrail(ctx,points,b===branch?C.blue:C.border,b===branch?4:2);}
   const cx=xPixel(t),cy=yPixel(current.x),ey=yPixel(current.endpoint);drawDot(ctx,cx,cy,10,C.orange);drawDot(ctx,xPixel(EPS),ey,7,C.green);
   drawLine(ctx,cx,cy,865,ey,C.green,2);drawDot(ctx,865,ey,14,C.green);drawText(ctx,current.endpoint.toFixed(4),865,ey+35,C.text,23,'center');
   for(const time of [0,1,2,3])drawText(ctx,String(time),xPixel(time),162,C.muted,16,'center');
  }}/>
  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:12}}>
   <label style={{display:'flex',alignItems:'center',gap:12,flex:'1 1 500px'}}>噪声时间 t
    <input type="range" aria-label="高斯例子噪声时间" min={EPS} max={3} step={.001} value={t} onChange={e=>setT(Number(e.target.value))} onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}/>
   </label>
   {[1,-1].map(b=><button key={b} className={`chip${branch===b?' selected':''}`} aria-pressed={branch===b} onClick={()=>setBranch(b)}>{b===1?'正向分支':'负向分支'}</button>)
   }
  </div>
  <p>t={t.toFixed(3)}　x_t={current.x.toFixed(4)}　score={current.score.toFixed(4)}　f(x_t,t)={current.endpoint.toFixed(4)}</p>
  <p className="feedback good" role="status">同一分支上，x_t 随时间改变，端点始终是 {current.endpoint.toFixed(4)}；换一个分支才会换端点。这里使用精确高斯 score，真实图像的 score 需由模型近似。</p>
 </div>;
}
