import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, type WidgetProps } from './kit';

// Chapter 10.1 — verified result race on iCIFAR-100 (Table 1a, average incremental accuracy).
const BATCHES = [2, 5, 10, 20, 50];
const SERIES = [
  { name: 'iCaRL', color: C.green, v: [57.0, 61.2, 64.1, 67.2, 68.6] },
  { name: 'hybrid1', color: C.blue, v: [36.6, 50.9, 59.3, 65.6, 68.2] },
  { name: 'hybrid2', color: C.purple, v: [57.6, 57.9, 59.9, 63.2, 65.3] },
  { name: 'hybrid3', color: C.orange, v: [57.0, 56.7, 58.1, 60.5, 61.5] },
  { name: 'LwF.MC', color: C.red, v: [11.7, 32.6, 44.4, 54.4, 64.5] },
];

export const C10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [bi, setBi] = useState(0);
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (run === 0) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    setProgress(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const left = 190;
    const maxW = 760;
    SERIES.forEach((s, i) => {
      const y = 48 + i * 42;
      const target = (s.v[bi] / 70) * maxW;
      const w = target * Math.max(progress, 0.02);
      txt(ctx, s.name, 172, y, C.muted, 17, 'right', '600');
      ctx.fillStyle = 'rgba(215,222,234,0.55)';
      ctx.fillRect(left, y - 12, maxW, 24);
      ctx.fillStyle = s.color;
      ctx.fillRect(left, y - 12, w, 24);
      if (progress > 0.98) txt(ctx, s.v[bi].toFixed(1), left + target + 12, y, s.color, 20, 'left', '700');
    });
    c.classList.add('is-ready');
  }, [bi, progress]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {BATCHES.map((b, i) => (
            <button
              key={b}
              className={`chip ${bi === i ? 'selected' : ''}`}
              onClick={() => {
                setBi(i);
                setProgress(1);
              }}
            >
              每批 {b} 类
            </button>
          ))}
        </div>
        <button className="chip selected" onClick={() => setRun((r) => r + 1)}>
          开始比较
        </button>
      </div>
      <div className="feedback">
        iCIFAR-100 平均增量准确率（%），越高越好；10 次不同类别顺序的平均。当前每批 {BATCHES[bi]} 类：iCaRL{' '}
        {SERIES[0].v[bi].toFixed(1)}% vs LwF.MC {SERIES[4].v[bi].toFixed(1)}%
        {bi === 0 ? '——批次越小，差距越大。' : '。'}
      </div>
    </div>
  );
};

export default C10Race;
