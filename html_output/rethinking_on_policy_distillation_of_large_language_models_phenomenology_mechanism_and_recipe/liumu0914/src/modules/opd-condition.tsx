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

export function OPDCondition({ chapterId, moduleId }: WidgetProps) {
  const [route, setRoute] = useState<'fixed' | 'student'>('fixed');
  const ref = useCanvas((ctx) => { ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, 560, 140); ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(36, 82); ctx.lineTo(524, 82); ctx.stroke(); const x = route === 'fixed' ? 450 : 270; ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(270, 82, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = route === 'fixed' ? '#c43f52' : '#228d5c'; ctx.beginPath(); ctx.arc(x, 82, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#21324a'; ctx.font = '13px sans-serif'; ctx.fillText(route === 'fixed' ? '不同前缀' : '同一前缀', 234, 36); }, [route]);
  const good = route === 'student';
  return <><div className="chip-row"><button className={`chip ${route === 'fixed' ? 'selected' : ''}`} onClick={() => setRoute('fixed')}>固定示范</button><button className={`chip ${route === 'student' ? 'selected' : ''}`} onClick={() => setRoute('student')}>学生自弹</button></div><canvas ref={ref} width={560} height={140} className="is-ready" /><div className={`feedback ${good ? 'good' : 'bad'}`}>{good ? '监督落在学生实际访问的位置。' : '固定轨迹没有覆盖学生刚走到的状态。'}</div></>;
}
