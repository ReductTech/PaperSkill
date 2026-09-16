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

export function OPDFuture({ chapterId, moduleId }: WidgetProps) {
  const [q,setQ]=useState('agent'); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const xs=['代码','开放域','agent','混合'];const active=xs.indexOf(q);xs.forEach((x,i)=>{ctx.fillStyle=i===active?'#228d5c':'#d7deea';ctx.fillRect(32+i*130,62,100,26);ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText(x,64+i*130,79);});},[q]);return <><div className="chip-row">{['代码','开放域','agent','混合'].map(x=><button key={x} className={`chip ${q===x?'selected':''}`} onClick={()=>setQ(x)}>{x}</button>)}</div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className="feedback good">这是作者明确留下的未来问题，不应写成本文已验证的结论。</div></>;
}
