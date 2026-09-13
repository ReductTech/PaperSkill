import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, gauge, bars, label, GUIDE, OK, BAD, EMPH, MUTED, WHEEL } from './clayKit';

// 模块 5.1：CFG 引导尺度筹码，观察「更贴合样板」与「更多样手味」的取舍。
const W = 1080;
const H = 300;
const OMEGAS = [0.5, 1, 1.5, 2, 3];

export const Ch5Guidance: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const omegaRef = useRef(1);
  const [omega, setOmega] = useState(1);
  const [fb, setFb] = useState({ text: '选择引导尺度 ω：力度越大越贴合样板，但随机手味也越少。', cls: '' });

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
      const w = omegaRef.current;
      const fit = Math.min(1, 0.3 + 0.22 * w);
      const div = Math.max(0.2, 1 - 0.2 * w);
      field(ctx, W, H);
      gauge(ctx, 330 - 120 * fit, 90, 240 * fit, EMPH);
      clay(ctx, 330, 200, 90, Math.max(0.05, 0.5 - 0.12 * w), now / 600, WHEEL);
      hand(ctx, 330 + 92 * fit, 186, 1.2, 1);
      bars(ctx, 720, 80, 300, [
        { label: '贴合样板', value: fit, color: OK },
        { label: '多样性', value: div, color: GUIDE },
      ]);
      label(ctx, 'ω=' + w.toFixed(1), 726, 68, EMPH);
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

  const pick = (w: number) => {
    omegaRef.current = w;
    setOmega(w);
    if (w <= 1) setFb({ text: '贴合一般，但手味最足；生成更杂、更多样。', cls: '' });
    else if (w <= 2) setFb({ text: '贴合与多样性比较均衡，论文的无条件最佳取 ω=3 附近。', cls: 'good' });
    else setFb({ text: '非常贴合样板，代价是熵下降、多样性明显减少。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {OMEGAS.map((w) => (
          <button key={w} className={`chip ${omega === w ? 'selected' : ''}`} onClick={() => pick(w)}>
            ω = {w}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Guidance;
