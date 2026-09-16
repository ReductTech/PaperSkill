import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';

type WidgetProps = { chapterId: string; moduleId: string };

function useCanvas(draw: (ctx: CanvasRenderingContext2D) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 140);
    draw(ctx);
    return observeCanvas(canvas, () => draw(ctx), () => undefined);
  }, deps);
  return ref;
}

export function OPDResults({ chapterId, moduleId }: WidgetProps) {
  const [view,setView]=useState<'effect'|'mechanism'|'limit'>('effect'); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const rows=view==='effect'?[0.99,0.91,0.80]:view==='mechanism'?[0.72,0.91,0.02]:[0.37,0.02,0.75];const labels=view==='effect'?['质量 97%-99%','overlap >91%','gap recovery >80%']:view==='mechanism'?['overlap 起点','overlap 终点','entropy gap']:['1K 续写增益','16K 续写增益','AUROC ≈'];rows.forEach((v,i)=>{ctx.fillStyle=i===2?'#f07e47':'#228d5c';ctx.fillRect(34+i*175,118-v*82,105,v*82);ctx.fillStyle='#21324a';ctx.font='11px sans-serif';ctx.fillText(labels[i],34+i*175,134);});},[view]);return <><div className="chip-row"><button className={`chip ${view==='effect'?'selected':''}`} onClick={()=>setView('effect')}>效果</button><button className={`chip ${view==='mechanism'?'selected':''}`} onClick={()=>setView('mechanism')}>机制</button><button className={`chip ${view==='limit'?'selected':''}`} onClick={()=>setView('limit')}>边界</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className="feedback good">{view==='effect'?'共享 token 占双方总概率质量的 97%-99%，成功运行还恢复了超过 80% 的师生性能差距。':view==='mechanism'?'本文成功消融中，overlap ratio 从约 72% 升至 91% 以上。':'教师续写增益从 1K 前缀的 +0.3659 降至 16K 的 +0.0237；两位教师的 AUROC 为 0.7333 和 0.7511。局部梯度各向异性仍是作者提出、尚未直接验证的假设。'}</div></>;
}
