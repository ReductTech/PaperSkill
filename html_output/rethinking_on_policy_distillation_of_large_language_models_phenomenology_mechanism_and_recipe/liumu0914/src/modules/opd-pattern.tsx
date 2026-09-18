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

export function OPDPattern({ chapterId, moduleId }: WidgetProps) {
  const [mode, setMode] = useState<'compatible'|'mismatch'>('mismatch'); const ref = useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const a=mode==='compatible'?0.69:0.60;ctx.fillStyle='#d7deea';ctx.fillRect(42,58,470,18);ctx.fillStyle=mode==='compatible'?'#228d5c':'#c43f52';ctx.fillRect(42,58,470*a,18);ctx.fillStyle='#21324a';ctx.font='13px sans-serif';ctx.fillText('初始 overlap',42,38);ctx.fillText(mode==='compatible'?'较高':'较低',450,38);},[mode]); const good=mode==='compatible'; return <><div className="chip-row"><button className={`chip ${good?'selected':''}`} onClick={()=>setMode('compatible')}>同拍</button><button className={`chip ${!good?'selected':''}`} onClick={()=>setMode('mismatch')}>不同拍</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':'bad'}`}>{good?'初始候选空间更兼容，教师信号容易被利用。':'即使教师分数更高，早期 mismatch 也会留下损失。'}</div></>;
}
