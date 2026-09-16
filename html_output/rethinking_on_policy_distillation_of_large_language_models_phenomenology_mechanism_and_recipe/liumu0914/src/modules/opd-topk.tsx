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

export function OPDTopK({ chapterId, moduleId }: WidgetProps) {
  const [k, setK] = useState(16);
  const ref = useCanvas((ctx) => { ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0,0,560,140); const n = k === 1 ? 1 : k === 4 ? 4 : k === 16 ? 8 : 12; for(let i=0;i<12;i++){ const h = 20 + ((i*17)%42); ctx.fillStyle = i<n ? (i<4 ? '#27446e' : '#228d5c') : '#d7deea'; ctx.fillRect(34+i*40, 112-h, 22, h); } ctx.fillStyle='#21324a'; ctx.font='13px sans-serif'; ctx.fillText('共享候选', 34, 22); ctx.fillStyle='#f07e47'; ctx.fillRect(430, 20, Math.min(90, 14 + k), 8); }, [k]); const good = k >= 4; return <><div className="ctrl"><label>k <input type="range" min="1" max="64" step="1" value={k} onChange={(e) => setK(Number(e.target.value))} /></label><span className="val">{k}</span></div><canvas ref={ref} width={560} height={140} className="is-ready" /><div className={`feedback ${good ? 'good' : 'bad'}`}>{k === 1 ? 'Top-1 只盯 argmax，选择偏置会放大抖动。' : k < 16 ? '小窗口已经覆盖部分共享高概率区域。' : '窗口覆盖主要质量，计算和稳定性达到折中。'}</div></>;
}
