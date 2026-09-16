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

export function OPDOverlap({ chapterId, moduleId }: WidgetProps) {
  const [a,setA]=useState(42); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const o=0.72+0.19*a/100;const adv=-0.006*(1-a/100);const gap=0.12-0.10*a/100;ctx.strokeStyle='#27446e';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const x=44+i*64;const y=110-(0.12+0.1*i*a/100)*450; if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText(`overlap ${(o*100).toFixed(0)}%`,24,24);ctx.fillText(`adv ${adv.toFixed(4)}`,220,24);ctx.fillText(`ΔH ${gap.toFixed(2)}`,410,24);ctx.fillStyle=a>82?'#228d5c':a>55?'#27446e':'#c43f52';ctx.fillRect(36,124,480*a/100,7);},[a]); const good=a>82;return <><div className="ctrl"><label>alignment <input type="range" min="0" max="100" value={a} onChange={e=>setA(Number(e.target.value))}/></label><span className="val">{a}</span></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':'bad'}`}>{good?'共享高概率 token 正在逐步对齐，优势值和熵差也接近零。':a>55?'overlap 在增长，但共享区内的权重还需校准。':'候选空间仍分离，梯度难以形成稳定方向。'}</div></>;
}
