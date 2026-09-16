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

export function OPDPrefix({ chapterId, moduleId }: WidgetProps) {
  const [step,setStep]=useState(1); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);for(let i=0;i<6;i++){ctx.fillStyle=i<step?'#27446e':'#d7deea';ctx.fillRect(46+i*75,70,48,24);}ctx.fillStyle=step>4?'#c43f52':'#228d5c';ctx.fillRect(46+step*75,70,48,24);ctx.fillStyle='#21324a';ctx.font='13px sans-serif';ctx.fillText(`学生前缀 ${step}/6`,46,34);},[step]); const good=step<5;return <><div className="step-ctrl"><button className="chip" onClick={()=>setStep(Math.max(1,step-1))}>上一拍</button><span className="step-label">前缀 <b>{step}</b>/6</span><button className="chip" onClick={()=>setStep(Math.min(6,step+1))}>下一拍</button></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':'bad'}`}>{good?'教师在当前学生前缀上仍能给出可利用的局部信号。':'前缀变长后，教师 continuation 面对更陌生的状态。'}</div></>;
}
