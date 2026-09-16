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

export function OPDNovelty({ chapterId, moduleId }: WidgetProps) {
  const [kind, setKind] = useState<'scale'|'new'>('scale'); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const gain=kind==='new'?0.82:0.34;ctx.fillStyle='#d7deea';ctx.fillRect(54,48,420,18);ctx.fillStyle='#f07e47';ctx.fillRect(54,48,420*0.92,18);ctx.fillStyle=kind==='new'?'#228d5c':'#c43f52';ctx.fillRect(54,88,420*gain,18);ctx.fillStyle='#21324a';ctx.font='13px sans-serif';ctx.fillText('教师分数',54,38);ctx.fillText('可迁移增益',54,78);},[kind]); const good=kind==='new'; return <><div className="chip-row"><button className={`chip ${!good?'selected':''}`} onClick={()=>setKind('scale')}>同管线 7B</button><button className={`chip ${good?'selected':''}`} onClick={()=>setKind('new')}>RL 后训练</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':'bad'}`}>{good?'额外 RL 带来学生尚未见过的可迁移能力。':'规模更大，但可能只是重复同一训练分布。'}</div></>;
}
