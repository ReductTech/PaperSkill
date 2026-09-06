import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, ruler, sheet, label } from './kit';

// Ch1 M1.2 — "OpenCompass 统一收束" (repair toggle, hybrid view).
// One button applies the paper's unified platform; the rulers visibly snap into alignment.
const W = 560;
const H = 220;

export const Ch1Mod2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ unified: false, tStart: 0 });
  const [unified, setUnified] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点击按钮，看看 OpenCompass 如何把散乱的评测统一起来。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { unified: boolean; tStart: number }) => {
      clear(ctx, W, H);
      const now = performance.now();
      const raw = s.tStart ? (now - s.tStart) / 700 : 1;
      const prog = clamp(raw, 0, 1); // progress since last toggle (0→1)
      const k = s.unified ? prog : 1 - prog; // 0 = scattered, 1 = aligned
      const ys = [52, 110, 168];
      const scatter = [12, -14, 4];
      for (let i = 0; i < 3; i++) {
        const off = scatter[i] * (1 - k);
        sheet(ctx, 40, ys[i] - 14, 150, 30, '#fff', 2);
        ruler(ctx, 48, ys[i] + off, 120, 8, k > 0.5 ? C.green : i === 1 ? C.red : C.muted, k > 0.5 ? C.green : C.red);
      }
      // 统一评分尺随对齐进度淡入
      ctx.globalAlpha = k;
      ruler(ctx, 48, 46, 150, 10, C.green, C.green);
      ctx.globalAlpha = 1;
      label(ctx, s.unified ? '同一把统一评分尺' : '三份答卷 · 三套标准', 180, 12, 12, s.unified ? C.green : C.red, 'center', 700);
      label(
        ctx,
        s.unified ? 'OpenCompass：统一标准，一次评测' : '对不齐，分数不可比',
        260,
        100,
        13,
        s.unified ? C.green : C.red,
        'center',
        700
      );
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
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
  }, []);

  const toggle = () => {
    const v = !stateRef.current.unified;
    stateRef.current.unified = v;
    stateRef.current.tStart = performance.now();
    setUnified(v);
    setFeedback(
      v
        ? { text: '统一标准已启用：所有基准对齐到同一套评测协议，分数可以横向比较了。', cls: 'good' }
        : { text: '已回到散乱状态：各基准各说各话，分数不可比。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${unified ? 'selected' : ''}`} onClick={toggle}>
          {unified ? '✓ 已启用统一标准' : '启用 OpenCompass 统一标准'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod2;
