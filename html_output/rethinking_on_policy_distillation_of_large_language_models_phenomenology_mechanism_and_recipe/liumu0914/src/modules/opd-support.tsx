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

export function OPDSupport({ chapterId, moduleId }: WidgetProps) {
  const [support,setSupport]=useState<'student'|'overlap'|'non'>('student'); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const vals=support==='student'?[0.46,0.31,0.78]:support==='overlap'?[0.47,0.33,0.79]:[0.43,0.275,0.73];const cols=support==='non'?'#c43f52':'#228d5c';vals.forEach((v,i)=>{ctx.fillStyle=cols;ctx.fillRect(70+i*150,120-v*100,70,v*100);});ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText('AIME24',70,136);ctx.fillText('AIME25',220,136);ctx.fillText('AMC23',370,136);},[support]); const good=support!=='non';return <><div className="chip-row"><button className={`chip ${support==='student'?'selected':''}`} onClick={()=>setSupport('student')}>Student Top-k</button><button className={`chip ${support==='overlap'?'selected':''}`} onClick={()=>setSupport('overlap')}>Overlap Top-k</button><button className={`chip ${support==='non'?'selected':''}`} onClick={()=>setSupport('non')}>Non-overlap</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':'bad'}`}>{support==='overlap'?'本文消融中，只优化共享区仍接近完整 Student Top-k。':support==='student'?'完整学生支持提供了主要收益。':'Non-overlap Top-k 仍能学习，但在三个基准上都明显较弱。'}</div></>;
}
