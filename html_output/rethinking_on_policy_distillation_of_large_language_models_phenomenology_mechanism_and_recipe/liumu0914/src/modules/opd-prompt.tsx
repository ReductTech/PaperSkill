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

export function OPDPrompt({ chapterId, moduleId }: WidgetProps) {
  const [align,setAlign]=useState<'template'|'content'>('template'); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const mass=align==='template'?0.78:0.90;const entropy=align==='template'?0.58:0.36;ctx.fillStyle='#27446e';ctx.fillRect(58,48,190,16);ctx.fillStyle='#228d5c';ctx.fillRect(58,48,190*mass,16);ctx.fillStyle='#f07e47';ctx.fillRect(310,48,190*entropy,16);ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText('共享 token 概率质量',58,36);ctx.fillText('策略熵（探索余量）',310,36);},[align]);return <><div className="chip-row"><button className={`chip ${align==='template'?'selected':''}`} onClick={()=>setAlign('template')}>模板对齐</button><button className={`chip ${align==='content'?'selected':''}`} onClick={()=>setAlign('content')}>内容对齐</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${align==='content'?'good':''}`}>{align==='content'?'内容对齐时 overlap ratio 反而较低，但共享 token 的概率质量更高；entropy 也明显更低。':'仅改变模板就能提高验证表现与 overlap，底层数学问题保持不变。'}</div></>;
}
