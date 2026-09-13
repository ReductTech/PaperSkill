import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, ring, curve, label, GUIDE, OK, BAD, MUTED, WHEEL } from './clayKit';

// 模块 6.1：分步进刀。步进/重置控制采样步数，泥形与曲线同步收敛。
const W = 1080;
const H = 300;
const TOTAL = 32;

export const Ch6Steps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '按「下一步」逐步推进：每一步只把泥形推进一点。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const s = stepRef.current;
      const prog = s / TOTAL;
      field(ctx, W, H);
      for (let i = 0; i <= TOTAL; i += 4) {
        ctx.save();
        ctx.strokeStyle = i <= s ? GUIDE : '#cfd8c2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(120 + i * 8, 262);
        ctx.lineTo(120 + i * 8, 274);
        ctx.stroke();
        ctx.restore();
      }
      ring(ctx, 360, 190, 90, GUIDE, true);
      clay(ctx, 360, 190, 72, 0.85 * (1 - prog), now / 700, WHEEL);
      const pts: number[][] = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        pts.push([u, Math.min(1, 0.22 + 0.78 * (1 - Math.exp(-4 * u)))]);
      }
      curve(ctx, 780, 96, 250, 130, pts, GUIDE);
      ctx.save();
      ctx.fillStyle = OK;
      ctx.beginPath();
      ctx.arc(780 + prog * 250, 96 + 130 - Math.min(1, 0.22 + 0.78 * (1 - Math.exp(-4 * prog))) * 130, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      label(ctx, '步数', 786, 88, MUTED);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
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

  const setTo = (v: number) => {
    const s = Math.max(0, Math.min(TOTAL, v));
    stepRef.current = s;
    setStep(s);
    if (s <= 4) setFb({ text: '步数很少：误差还没来得及被修掉，形状还很乱。', cls: 'bad' });
    else if (s <= 16) setFb({ text: '正在收敛：每一步都在把泥形往目标推。', cls: '' });
    else setFb({ text: '已接近成品，再增加步数的收益越来越小。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          第 <span className="val">{step}</span> / {TOTAL} 步
        </label>
        <button className="chip" onClick={() => setTo(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button className="chip" onClick={() => setTo(step + 1)} disabled={step === TOTAL}>
          下一步
        </button>
        <button className="chip" onClick={() => setTo(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch6Steps;
