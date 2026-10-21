import { useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, line, box, sketch, pencil, text } from './vdsr-kit';
const phases = ['插值底稿','预测残差','相加重建'];
const feedback = ['先用双三次插值把LR放到目标尺寸，得到ILR；后续卷积都在这个尺寸上工作。','20层网络预测与ILR同尺寸的有符号残差。最后一层是线性的，残差可加深也可减淡原有笔画。','把ILR与预测残差逐像素相加，得到完整重建；网络只执行一次前向计算。'];
export function Vdsr6() {
  const [step,setStep] = useState(0);
  return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
    <div className="vdsr-controls"><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>上一步</button><strong>{step+1} / 3 · {phases[step]}</strong><button disabled={step===2} onClick={()=>setStep(s=>s+1)}>下一步</button><button onClick={()=>setStep(0)}>回到起点</button></div>
    <CanvasPlot label={`一次推理流程：当前${phases[step]}。底稿与残差在同一空间位置相加；绿色是增加，红色是减少的示意笔画`} draw={(ctx,w,h)=>{
      clearScene(ctx,w,h);
      box(ctx,80,32,690,215,'#ffffff',C.axis);
      if(step===0) sketch(ctx,175,48,450,175,0,C.blue);
      if(step===1) {
        ctx.save(); ctx.globalAlpha=.12; sketch(ctx,175,48,450,175,0,C.blue); ctx.restore();
        line(ctx,357,86,424,119,C.green,5);
        line(ctx,432,119,475,140,C.red,5);
        pencil(ctx,424,115,C.green);
      }
      if(step===2) {
        sketch(ctx,175,48,450,175,1,C.blue);
        line(ctx,357,86,424,119,C.green,5);
        pencil(ctx,424,115,C.green);
      }
      for(let i=0;i<3;i++) {box(ctx,850,47+i*66,105,38,i===step?C.orange:C.light);}
      text(ctx,phases[step],830,268,C.ink,20);
    }}/>
    <div className="vdsr-metrics"><span>当前张量：<strong>{step===0?'x：ILR':step===1?'fΘ(x)：残差':'ŷ：重建图'}</strong></span><span>空间尺寸：<strong>300×300</strong></span><span>示意倍率：<strong>×3</strong></span></div>
    <p className="vdsr-feedback" aria-live="polite">状态{step+1}/3：{feedback[step]}</p>
    <p>第2—3页，§3.1、图2。绿色和红色表示正负修正的概念；素描未运行真实模型，不能用于判断图像质量。</p>
  </div>;
}
