import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawHiker, drawCamp, drawTrail, drawDot, drawText } from './cm-kit';

const trail: [number,number][] = Array.from({length:49},(_,i)=>{const p=i/48;return [100+350*p,205-115*p+32*Math.sin(p*Math.PI*3)];});
export function Budget(){
  const [steps,setSteps]=useState(1);
  const point=trail[Math.round((1-steps/12)*48)];
  return <div>
    <SceneCanvas ariaLabel="左侧沿山路返程的位置，右侧十二格网络调用预算" draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,520,280);drawTrail(ctx,trail,C.light,4);drawTrail(ctx,trail.slice(Math.round((1-steps/12)*48)),C.blue,4);drawCamp(ctx,100,205,.9);drawHiker(ctx,point[0],point[1],steps===12?C.green:C.blue,0,.85);
      drawText(ctx,'逐步返程',50,35);drawText(ctx,'调用预算',575,35);
      for(let i=0;i<12;i++){const x=580+(i%6)*75,y=88+Math.floor(i/6)*76;ctx.fillStyle=i<steps?C.blue:C.border;ctx.beginPath();ctx.roundRect(x,y,57,42,9);ctx.fill();drawText(ctx,String(i+1),x+28,y+27,i<steps?'#ffffff':C.muted,18,'center');}
      drawDot(ctx,point[0],point[1]+8,4,C.orange);
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><label style={{display:'flex',alignItems:'center',gap:12,flex:'1 1 500px'}}>网络评估次数 <input type="range" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}} min={1} max={12} step={1} value={steps} onChange={e=>setSteps(Number(e.target.value))}/></label><output aria-live="polite">{steps} / 12</output></div>
    <div className="feedback" role="status" style={{color:steps===12?C.green:steps===1?C.red:C.blue}}>{steps===1?'只调用一次局部方向预测，示意路径还未走完。':steps===12?'完整走完示意路径用了12次局部预测；这不是论文固定步数。':'增加局部预测次数可以继续沿路返回，但会增加计算。'}</div>
  </div>;
}
