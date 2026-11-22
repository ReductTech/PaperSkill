import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawBar, drawLabel, drawStamp, drawNib, withAlpha, type Ctx } from './scene';

const W = 1080;
const H = 280;

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef(0);
  const [steps, setSteps] = useState(0);

  const fbText = (s: number) => {
    if (s === 0) return { text: '一步没训：新证物还认不出。', cls: 'bad' };
    if (s >= 200) return { text: '论文 B0 的 warmup 就是 200 步（学习率 3e-6）：新证物写对了，旧案仍满格。', cls: 'good' };
    return { text: '写法在收敛，旧卡没动。', cls: '' };
  };
  const [feedback, setFeedback] = useState(fbText(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const s = stepsRef.current;
      const t = s / 200;
      const newAcc = 0.18 + 0.66 * Math.pow(t, 0.7);
      const oldAcc = 0.96;
      clearScene(ctx, W, H);

      // last page of the register
      ctx.save();
      ctx.fillStyle = C.card;
      ctx.fillRect(40, 34, 520, 200);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(40, 34, 520, 200);
      ctx.strokeStyle = withAlpha(C.border, 0.85);
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(56, 34 + i * 33);
        ctx.lineTo(544, 34 + i * 33);
        ctx.stroke();
      }
      ctx.restore();
      drawLabel(ctx, 56, 52, '结案报告末页', C.muted, 12);

      const rows = ['窑口 — 景德镇', '底款 — 乾隆六年', '纹样 — 缠枝纹'];
      rows.forEach((r, i) => {
        const y = 86 + i * 33;
        const solid = t > (i === 0 ? 0.12 : i === 1 ? 0.35 : 0.6);
        ctx.save();
        ctx.strokeStyle = solid ? withAlpha(C.green, 0.9) : withAlpha(C.muted, 0.5);
        ctx.lineWidth = solid ? 1.6 : 1;
        if (!solid) ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(56, y);
        ctx.lineTo(56 + (solid ? 420 : 120 + t * 220), y);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, 66, y - 4, r, solid ? C.ink : C.muted, 12);
      });

      if (s > 0) {
        drawNib(ctx, 120 + t * 380, 200, -0.3);
      }
      if (s >= 200) {
        drawStamp(ctx, 470, 120, 1.2);
      }

      // right: two hit bars
      drawLabel(ctx, 620, 86, '新证物', C.ink, 13);
      drawBar(ctx, 620, 100, 380, 16, newAcc, t > 0.85 ? C.green : C.orange);
      drawLabel(ctx, 620, 166, '旧案', C.ink, 13);
      drawBar(ctx, 620, 180, 380, 16, oldAcc, C.blue);
      drawLabel(ctx, 1006, 180, '锁', C.muted, 13);
    };

    let raf = 0;
    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const change = (v: number) => {
    stepsRef.current = v;
    setSteps(v);
    setFeedback(fbText(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor={`sl-${chapterId}-${moduleId}`}>
          训练步数 <span className="val">{steps}</span>
        </label>
        <input
          id={`sl-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={200}
          step={25}
          value={steps}
          onInput={(e) => change(Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
