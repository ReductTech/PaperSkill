import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
const route = [
  { label: '查询', obs: '需要多跳证据' },
  { label: '检索', obs: '返回文档片段' },
  { label: '再查', obs: '补全缺失实体' },
  { label: '作答', obs: '输出最终答案' },
];
export const Ch6Rollout: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '按交互步推进多轮行程。', cls: '' });
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      clearScene(ctx, W, H);
      drawRoad(ctx, 200, W);
      drawFlag(ctx, W - 70, 180);
      route.forEach((r, i) => {
        const x = 90 + i * 240;
        ctx.fillStyle = i <= idx ? C.blue : '#fff';
        ctx.strokeStyle = i === idx ? C.orange : C.axis;
        ctx.lineWidth = i === idx ? 3 : 1;
        ctx.fillRect(x, 50, 160, 70);
        ctx.strokeRect(x, 50, 160, 70);
        drawLabel(ctx, r.label, x + 50, 90, i <= idx ? '#fff' : C.text);
      });
      drawCar(ctx, 140 + idx * 240, 192, C.blue);
      drawLabel(ctx, route[idx].obs, 40, 250, C.muted);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [idx]);
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => { setIdx(0); setFb({ text: '行程重置到起点。', cls: '' }); }}>重置</button>
        <span className="val">{idx + 1}/{route.length}</span>
        <button type="button" disabled={idx >= route.length - 1} onClick={() => {
          const n = Math.min(route.length - 1, idx + 1); setIdx(n);
          setFb({ text: n === route.length - 1 ? '多轮交互完成：每步都是完整环境动作。' : '进入下一步观察与动作。', cls: n === route.length - 1 ? 'good' : '' });
        }}>下一步</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch6Rollout;
