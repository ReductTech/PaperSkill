import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', muted: '#68778f',
  text: '#21324a', border: '#d7deea',
};

const STEPS = [
  '初始化：ZFE ← Xsrc',
  '采样噪声配对，估计 Vsrc / Vtar',
  '求差得 VΔ，n_avg 次平均',
  '沿 VΔ 更新一步 ZFE',
  '推进到下一时刻，直到结束',
];

/** P2：Algorithm 1 步进 + n_avg 平均可视化 */
export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, pulse: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let t0 = performance.now();

    const render = (now: number) => {
      const s = stateRef.current.step;
      const e = easeInOutQuad(((now - t0) % 2000) / 2000);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(40, 30, W - 80, H - 60);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(40, 30, W - 80, H - 60);

      // timeline
      for (let i = 0; i < 5; i++) {
        const x = 120 + i * 180;
        ctx.fillStyle = i <= s ? C.green : C.border;
        ctx.beginPath();
        ctx.arc(x, 70, 10, 0, Math.PI * 2);
        ctx.fill();
        if (i < 4) {
          ctx.strokeStyle = i < s ? C.green : C.border;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 12, 70);
          ctx.lineTo(x + 168, 70);
          ctx.stroke();
        }
      }

      // photo
      const px = 120 + Math.min(s, 4) * 180;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 28, 110, 56, 44);
      ctx.strokeRect(px - 28, 110, 56, 44);

      // averaging viz at step 2
      if (s === 2) {
        const samples = [
          [60, -20],
          [90, 15],
          [50, 25],
          [75, -10],
        ];
        samples.forEach(([dx, dy], i) => {
          ctx.strokeStyle = C.muted;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(500, 180);
          ctx.lineTo(500 + dx * (0.5 + e * 0.5), 180 + dy * (0.5 + e * 0.5));
          ctx.stroke();
          ctx.setLineDash([]);
        });
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(500, 180);
        ctx.lineTo(500 + 70 * e, 180 + 5);
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('n_avg 平均 → VΔ', 620, 185);
      }

      if (s >= 3) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, 155);
        ctx.lineTo(px + 80, 155);
        ctx.stroke();
      }
      canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const go = (n: number) => {
    const v = Math.max(0, Math.min(STEPS.length - 1, n));
    stateRef.current.step = v;
    setStep(v);
    setFeedback({ text: STEPS[v], cls: v === STEPS.length - 1 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" disabled={step === 0} className="tiny ghost" onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="val">
          {step + 1} / {STEPS.length}
        </span>
        <button type="button" disabled={step === STEPS.length - 1} className="tiny" onClick={() => go(step + 1)}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
