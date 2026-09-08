import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, label } from './kit';

// Ch10 M10.1 — "统一排行榜对比" (P8 result race, technical view).
// One button starts a race of verified averages (Appendix A, Table 1); higher is better.
const W = 560;
const H = 230;
const MODELS = [
  { name: 'Gemini-3-Pro-Preview', score: 81.32 },
  { name: 'GLM-5-FP8', score: 78.98 },
  { name: 'GPT-5 (high)', score: 78.22 },
  { name: 'Kimi-K2.5', score: 76.93 },
];

export const Ch10Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点击「开始对比」，看统一评测如何把不同模型拉到同一把尺上。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      clear(ctx, W, H);
      const p = running ? clamp((performance.now() - startRef.current) / 1600, 0, 1) : 0;
      const maxScore = 100;
      const baseline = 200;
      const barH = 34;
      const gap = 12;
      MODELS.forEach((m, i) => {
        const y = 24 + i * (barH + gap);
        label(ctx, m.name, 12, y + barH / 2, 12, C.ink, 'left', 700);
        const target = (m.score / maxScore) * 360;
        const w = target * easeOutCubic(clamp(p * 5 - i, 0, 1));
        ctx.fillStyle = C.axis;
        ctx.fillRect(160, y, 360, barH);
        ctx.fillStyle = i === 0 ? C.orange : C.blue;
        ctx.fillRect(160, y, w, barH);
        if (p >= 1 || running) {
          label(ctx, m.score.toFixed(2), 160 + w + 6, y + barH / 2, 12, C.ink, 'left', 700);
        }
      });
      label(ctx, '平均分（越高越好）', 340, 12, 12, C.muted, 'center');
      if (!running) {
        label(ctx, '等待开始…', W / 2, baseline + 4, 12, C.muted, 'center');
      } else if (p >= 1) {
        label(ctx, 'OpenCompass 让所有模型在同一把尺上可比', W / 2, baseline + 4, 13, C.green, 'center', 700);
      }
    };
    let raf = 0;
    const tick = () => {
      render();
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
      text: '数据来自 OpenCompass 学术排行榜（Appendix A 表 1）：按表中可用基准计算的平均分（部分模型存在空单元格），越高越好。',
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

export default Ch10Mod1;
