import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch3 M3.1 — "一体化 vs 模块化" (P3 synchronized before/after).
// Always shows both designs side by side as an introduction; the button then animates
// the instability of a monolith vs. the independent swappability of decoupled modules.
const W = 560;
const H = 220;

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '先看两种设计：一体化把五件事焊在一起，模块化把它们拆成独立组件。点击「开始对比」看运行时差别。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (p: number) => {
      clear(ctx, W, H);
      const t = performance.now() / 1000;

      // 左：一体化 —— 五个组件缠绕成一个结，运行时就整体抖动。
      const cx = 150;
      const cy = 96;
      const jit = running ? Math.sin(t * 10) * 5 : 0;
      const centers: [number, number][] = [
        [cx, cy],
        [cx - 22, cy + 16],
        [cx + 24, cy + 14],
        [cx - 6, cy + 34],
        [cx + 20, cy - 24],
      ];
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          ctx.beginPath();
          ctx.moveTo(centers[i][0] + jit, centers[i][1] + jit);
          ctx.lineTo(centers[j][0] + jit, centers[j][1] + jit);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(196, 63, 82, 0.15)';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centers[i][0] + jit, centers[i][1] + jit, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      label(ctx, '一体化：互相缠绕', cx, 186, 13, C.red, 'center', 700);
      label(ctx, '改一处 → 全盘受影响', cx, 206, 11, C.muted, 'center');

      // 右：模块化 —— 五个独立组件一字排开，高亮组件可单独替换。
      const bx = 300;
      const mods = ['配置', '切分', '调度', '任务', '汇总'];
      const swapIdx = Math.floor(t * 0.8) % 5;
      for (let i = 0; i < 5; i++) {
        const x = bx + 14 + i * 52;
        const active = i === swapIdx;
        // 运行时高亮组件轻微上浮，表现「被替换」。
        const lift = running && active ? -Math.sin(clamp(p * 5, 0, 1) * Math.PI) * 10 : 0;
        ctx.fillStyle = active ? C.orange : C.green;
        rr(ctx, x, 82 + lift, 44, 44, 8);
        ctx.fill();
        label(ctx, mods[i], x + 22, 104 + lift, 11, '#fff', 'center', 700);
      }
      const sx = bx + 14 + swapIdx * 52 + 22;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 130);
      ctx.lineTo(sx, 146);
      ctx.stroke();
      ctx.lineWidth = 1;
      label(ctx, '可单独替换', sx, 162, 11, C.orange, 'center', 700);
      label(ctx, '模块化：组件解耦', 430, 186, 13, C.green, 'center', 700);
      label(ctx, '替换一个 → 其余不变', 430, 206, 11, C.muted, 'center');

      if (running && p < 1) {
        label(ctx, '同步推进中…', W / 2, 16, 11, C.muted, 'center');
      }
    };
    let raf = 0;
    const tick = () => {
      const p = running ? clamp((performance.now() - startRef.current) / 1600, 0, 1) : 0;
      render(p);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [running]);

  const start = () => {
    startRef.current = performance.now();
    setRunning(true);
    setFeedback({
      text: '一体化一改就整体震荡，模块化却能单独替换一个组件而不影响其他——这正是 OpenCompass 的设计哲学。',
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={start}>
          {running ? '重新对比' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
