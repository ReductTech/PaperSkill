import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
const modes = [
  { id: 'text', label: '文本消息', color: C.red, note: '解码再分词易漂移' },
  { id: 'flat', label: '扁平 token', color: C.orange, note: '一致但缺步结构' },
  { id: 'step', label: '步原生记录', color: C.green, note: '状态/动作/奖励对齐转移' },
];
export const Ch2Repr: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState('text');
  const [fb, setFb] = useState({ text: '切换表征，观察回放单元是否对准交互步。', cls: 'bad' });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let t0 = performance.now();
    const render = (now: number) => {
      const u = ((now - t0) % 3000) / 3000;
      clearScene(ctx, W, H);
      drawRoad(ctx, 200, W);
      const m = modes.find((x) => x.id === mode)!;
      if (mode === 'text') {
        drawLabel(ctx, 'Detok → Tok ≠ z', 40, 40, C.red);
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? C.red : C.axis;
          ctx.fillRect(40 + i * 50 + Math.sin(u * 10 + i) * 6, 70, 36, 50);
        }
        drawCar(ctx, 100 + u * 700, 192 + Math.sin(u * 20) * 8, C.red);
      } else if (mode === 'flat') {
        drawLabel(ctx, '连续 token 流', 40, 40, C.orange);
        ctx.fillStyle = C.orange;
        ctx.fillRect(40, 80, 900, 40);
        for (let i = 0; i < 20; i++) { ctx.fillStyle = '#fff8'; ctx.fillRect(50 + i * 44, 88, 2, 24); }
        drawCar(ctx, 100 + u * 700, 192, C.orange);
      } else {
        drawLabel(ctx, 'step records', 40, 40, C.green);
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = C.green; ctx.lineWidth = 2;
          ctx.strokeRect(60 + i * 230, 60, 200, 90);
          drawLabel(ctx, 's/a/r', 90 + i * 230, 110, C.muted);
        }
        const si = Math.floor(u * 4);
        drawCar(ctx, 140 + si * 230, 192, C.green);
      }
      drawLegend(ctx, modes.map((x) => ({ color: x.color, label: x.label })), 40, 250);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (n: number) => { render(n); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [mode]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {modes.map((m) => (
          <button key={m.id} type="button" className={mode === m.id ? 'chip on' : 'chip'}
            onClick={() => {
              setMode(m.id);
              setFb({
                text: m.id === 'step' ? '步原生记录保留似然，又使每条记录对应一次 MDP 转移。' : m.note,
                cls: m.id === 'step' ? 'good' : m.id === 'flat' ? '' : 'bad',
              });
            }}>{m.label}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch2Repr;
