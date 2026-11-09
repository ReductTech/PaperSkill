import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawCamp, drawTrail, drawLine, drawDot, drawText } from './cm-kit';
function routePoint(route:number,p:number):[number,number]{return [95+370*p,route===0?95+52*p+25*Math.sin(p*5):220-35*p-25*Math.sin(p*5)];}
export function Consistency(){
  const [selection,setSelection]=useState({route:0,position:2});
  const {route,position}=selection;
  const end=routePoint(route,0),chosen=routePoint(route,[.15,.52,1][position]);
  return <div>
    <SceneCanvas ariaLabel={`轨迹${route===0?'A':'B'}的${['近端','中段','远端'][position]}指向同一营地，右侧三个预测点重合`} draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,520,280);drawText(ctx,'两条轨迹',45,32);drawText(ctx,'端点重合',580,32);
      [0,1].forEach(r=>{drawTrail(ctx,Array.from({length:61},(_,i)=>routePoint(r,i/60)),r===route?C.dark:C.light,r===route?4:2);const e=routePoint(r,0);drawCamp(ctx,e[0],e[1],.6);[.15,.52,1].forEach((p,i)=>{const q=routePoint(r,p);drawDot(ctx,q[0],q[1],r===route&&i===position?9:5,r===route&&i===position?C.blue:C.muted);});});
      drawLine(ctx,chosen[0],chosen[1],end[0],end[1],C.green,3);drawDot(ctx,chosen[0],chosen[1],10,C.blue);
      const output:[number,number]=route===0?[920,105]:[920,212];
      [0,1,2].forEach(i=>{const x=625,y=78+i*70;drawLine(ctx,x,y,output[0],output[1],i===position?C.green:C.light,i===position?4:2);drawDot(ctx,x,y,i===position?9:5,i===position?C.blue:C.muted);});
      [16,11,6].forEach((radius,i)=>{ctx.strokeStyle=[C.purple,C.blue,C.green][i];ctx.lineWidth=3;ctx.beginPath();ctx.arc(output[0],output[1],radius,0,Math.PI*2);ctx.stroke();});
      drawDot(ctx,output[0],output[1],3,C.green);
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}>{[0,1].flatMap(r=>[0,1,2].map(p=><button key={`${r}-${p}`} className={`chip${route===r&&position===p?' selected':''}`} aria-pressed={route===r&&position===p} onClick={()=>setSelection({route:r,position:p})}>{r===0?'A':'B'}·{['近端','中段','远端'][p]}</button>))}</div>
    <div>所选轨迹：{route===0?'A':'B'} · 位置：{['近端','中段','远端'][position]} · 三个理想输出共享端点 {route===0?'A':'B'}。二维曲线仅为教学示意。</div>
    <div className="feedback" role="status" style={{color:C.green}}>{route===1?'切换到另一条轨迹，目标营地改变；一致性不等于输出常数。':position===2?'选中远端位置；理想一致性函数仍应返回这条轨迹的数据端点。':'在同一条轨迹切换位置，目标端点保持不变。'}</div>
  </div>;
}
