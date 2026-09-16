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

export function OPDLength({ chapterId, moduleId }: WidgetProps) {
  const [length,setLength]=useState(7); const ref=useCanvas((ctx)=>{ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,560,140);const stable=length===3||length===7;const acc=stable?0.80:length<=1?0.42:length>=10?0.60:0.68;ctx.fillStyle=stable?'#228d5c':length>=10?'#c43f52':'#27446e';ctx.fillRect(54,110-acc*100,54,acc*100);ctx.fillStyle='#21324a';ctx.font='12px sans-serif';ctx.fillText(`${length}K`,62,130);ctx.fillText('相对验证表现（示意）',180,30);ctx.strokeStyle=length>=10?'#c43f52':'#27446e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(180,98);ctx.lineTo(510, length>=10?122:62);ctx.stroke();},[length]);const good=length===3||length===7;return <><div className="ctrl"><label>最大响应长度 <input type="range" min="0" max="5" step="1" value={[0.5,1,3,7,10,15].indexOf(length)} onChange={e=>setLength([0.5,1,3,7,10,15][Number(e.target.value)])}/></label><span className="val">{length}K</span></div><canvas ref={ref} width={560} height={140} className="is-ready"/><div className={`feedback ${good?'good':length>=10?'bad':''}`}>{good?'本文实验中，3K 和 7K 的结果最强，overlap 增长也更平滑。':length>=10?'10K 和 15K 后期出现 overlap 下降、entropy 与 gradient 峰值。':'0.5K 和 1K 的监督 token 太少，样本效率较低。'}</div></>;
}
