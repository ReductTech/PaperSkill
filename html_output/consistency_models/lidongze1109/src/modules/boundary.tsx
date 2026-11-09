import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawHiker, drawCamp, drawLine, drawDot, drawText } from './cm-kit';
export function Boundary(){
  const [q,setQ]=useState(60);
  const t=.002+q/100*2,skip=.25/((t-.002)**2+.25),out=.5*(t-.002)/Math.sqrt(.25+t*t);
  return <div>
    <SceneCanvas ariaLabel="左侧营地锚点与安全绳，右侧跳连和网络两条分支按系数改变宽度，边界处网络分支为零" draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,520,280);drawText(ctx,'固定锚点',45,32);drawText(ctx,'两路相加',575,32);drawCamp(ctx,110,210,.85);drawDot(ctx,130,205,8,C.green);const hx=140+q*3,hy=205-q*.8;ctx.strokeStyle=C.support;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(130,205);ctx.quadraticCurveTo((130+hx)/2,(205+hy)/2+q*.35,hx,hy);ctx.stroke();drawHiker(ctx,hx,hy,q===0?C.green:C.blue,0,.85);
      const branch=(y:number,weight:number,color:string)=>{ctx.globalAlpha=weight===0?.16:1;ctx.strokeStyle=color;ctx.lineWidth=weight===0?2:3+weight*24;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(590,y);ctx.lineTo(830,y);ctx.lineTo(930,145);ctx.stroke();drawDot(ctx,590,y,8,color);ctx.globalAlpha=1;};
      branch(90,skip,C.blue);branch(205,out,C.purple);drawDot(ctx,930,145,17,C.green);drawLine(ctx,922,145,938,145,'#ffffff',3);drawLine(ctx,930,137,930,153,'#ffffff',3);drawLine(ctx,950,145,1020,145,C.green,4);drawDot(ctx,1020,145,9,C.green);
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><label style={{display:'flex',alignItems:'center',gap:12,flex:'1 1 500px'}}>离数据端的距离 <input type="range" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}} min={0} max={100} step={1} value={q} onChange={e=>setQ(Number(e.target.value))}/></label><button className="chip" disabled={q===0} onClick={()=>setQ(0)}>回到 ε</button></div>
    <div>t = {t.toFixed(3)} · <span style={{color:C.blue}}>输入跳连 c_skip = {skip.toFixed(4)}</span> · <span style={{color:C.purple}}>网络分支 c_out = {out.toFixed(4)}</span></div>
    <div>σ_data = 0.5；两条线的宽度分别表示系数，它们不是概率，也不要求和为 1。</div>
    <div className="feedback" role="status" style={{color:q===0?C.green:C.blue}}>{q===0?'t=ε：c_skip=1，c_out=0，输出严格等于输入。':q<15?'靠近 ε 时，输入跳连逐渐占主导。':'t 仍大于 ε，网络分支参与预测；两个系数不是概率。'}</div>
  </div>;
}
