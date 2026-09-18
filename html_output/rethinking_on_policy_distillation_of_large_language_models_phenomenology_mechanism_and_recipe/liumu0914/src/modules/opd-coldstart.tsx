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

export function OPDColdStart({ chapterId, moduleId }: WidgetProps) {
  const [cold,setCold]=useState(false); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const start=cold?0.72:0.51;ctx.fillStyle='#d7deea';ctx.fillRect(54,45,430,16);ctx.fillStyle=cold?'#228d5c':'#c43f52';ctx.fillRect(54,45,430*start,16);ctx.fillStyle='#d7deea';ctx.fillRect(54,92,430,16);ctx.fillStyle='#27446e';ctx.fillRect(54,92,430*(cold?0.80:0.55),16);ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText('起点 overlap',54,35);ctx.fillText('最终效果',54,82);},[cold]);return <><div className="chip-row"><button className={`chip ${!cold?'selected':''}`} onClick={()=>setCold(false)}>Only OPD</button><button className={`chip ${cold?'selected':''}`} onClick={()=>setCold(true)}>SFT + OPD</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${cold?'good':'bad'}`}>{cold?'先用教师 rollout 热身，后续监督立刻变得可用。':'直接开始时，前几步的思考模式差距较大。'}</div></>;
}
