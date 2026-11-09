import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawCamp, drawHiker, drawTrail, drawDot, drawLine, drawText } from './cm-kit';

const messages = ['先从 N(0,T²I) 采初始噪声，尚未调用网络。', '第一次一致性预测，得到数据端估计；NFE=1。', '重新加入方差 τ²−ε² 的噪声；加噪本身不增加 NFE。', '第二次预测，NFE=2；本文报告多步在测试指标上改善质量。'];
export function Sampling() {
  const [step, setStep] = useState(0);
  const nfe = [0, 1, 1, 2][step];
  return <div>
    <SceneCanvas ariaLabel={`两次网络评估采样示意，第${step}阶段，网络评估${nfe}次`} draw={ctx => {
      clearScene(ctx); drawSetting(ctx, 520, 280);
      const trail: [number, number][] = [[80,220],[160,190],[245,205],[330,130],[420,75]];
      drawTrail(ctx, trail, C.dark, 3); drawCamp(ctx, 80, 220, .8);
      const pos: [number,number][] = [[420,75],[100,215],[235,170],[85,220]];
      drawHiker(ctx, pos[step][0], pos[step][1], C.blue, 0, .85);
      drawText(ctx,'返程示意',55,35,C.muted,16); drawText(ctx,'状态与调用',590,35,C.text,16);
      drawLine(ctx,590,235,1030,235,C.border,2); drawLine(ctx,610,50,610,235,C.border,2);
      const points: [number,number][] = [[990,70],[665,205],[810,145],[650,210]];
      for(let i=0;i<3;i++) { const a=points[i],b=points[i+1]; drawLine(ctx,a[0],a[1],b[0],b[1],i<step?(i===1?C.purple:C.green):C.border,i<step?4:2); }
      points.forEach((p,i)=> {drawDot(ctx,p[0],p[1],i===step?11:6,i===step?C.orange:i<step?C.green:C.light);drawText(ctx,String(i),p[0],p[1]-19,C.muted,15,'center');});
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><button className="chip" onClick={()=>setStep(s=>s-1)} disabled={step===0}>上一步</button><button className="chip" onClick={()=>setStep(s=>s+1)} disabled={step===3}>下一步</button><button className="chip" onClick={()=>setStep(0)}>重置</button></div>
    <p>阶段 {step} / 3　网络评估次数 NFE：<strong>{nfe}</strong>　{step===0?'初始标准差 T=80':step===2?'重加噪标准差 √(1−0.002²)≈0.999998':'端点时间 ε=0.002'}</p>
    <p className="feedback" role="status" style={{color:step===3?C.green:C.blue}}>{messages[step]}</p>
  </div>;
}
