import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLabel, roundRect } from './ana-scene';

const W = 560, H = 280;
type T = 4 | 8 | 16;

// ImageNet 256^2 FID-50K, Table 6; reference: STARFlow(FAE) 2.67 @ 256 steps.
const DATA: Record<T, { fid: number; noise: number }> = {
  4: { fid: 3.83, noise: 0.16 },
  8: { fid: 3.24, noise: 0.09 },
  16: { fid: 2.8, noise: 0.04 },
};
const REF_FID = 2.67;
const FID_MAX = 4.4;

const FEEDBACK: Record<T, { text: string; cls: string }> = {
  4: { text: 'T=4：最快的一档，FID 3.83。微调场景下论文推荐的质量-速度平衡就在 4–8 步。', cls: 'good' },
  8: { text: 'T=8：FID 3.24——多花一倍步数，换回更多细节。', cls: '' },
  16: { text: 'T=16：FID 2.80，已经逼近 256 步的 STARFlow（FAE）2.67——但步数只有它的 1/16。', cls: 'good' },
};

export const M7TSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ T: T; t0: number }>({ T: 4, t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [T, setT] = useState<T>(4);
  const [feedback, setFeedback] = useState(FEEDBACK[4]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    stateRef.current.t0 = performance.now() / 1000;

    const render = () => {
      const s = stateRef.current;
      const anim = clamp((performance.now() / 1000 - s.t0) / 0.7, 0, 1);
      const d = DATA[s.T];
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- left: sample detail at this step count ----
      drawPhotoCard(ctx, 40, 44, 150, 120, d.noise, 103 + s.T);
      drawLabel(ctx, `T = ${s.T} 步的样本`, 46, 30, K.text, 13);
      drawLabel(ctx, s.T === 16 ? '细节最好' : s.T === 8 ? '细节适中' : '最快', 46, 180,
        s.T === 4 ? K.orange : K.green, 12);

      // ---- right: FID bars + step-count bars ----
      const gx = 236, gw = 288;
      drawLabel(ctx, 'ImageNet 256² · FID-50K（越低越好）', gx, 30, K.muted, 11);
      const rows: { name: string; fid: number; steps: number; mine: boolean }[] = [
        { name: 'NTM T=4', fid: 3.83, steps: 4, mine: s.T === 4 },
        { name: 'NTM T=8', fid: 3.24, steps: 8, mine: s.T === 8 },
        { name: 'NTM T=16', fid: 2.8, steps: 16, mine: s.T === 16 },
        { name: 'STARFlow(FAE)', fid: REF_FID, steps: 256, mine: false },
      ];
      rows.forEach((r, i) => {
        const y = 48 + i * 40;
        const wfrac = (r.fid / FID_MAX) * (r.mine ? anim : 1);
        const isRef = r.name.startsWith('STARFlow');
        ctx.fillStyle = r.mine ? K.green : isRef ? K.muted : 'rgba(34,141,92,0.3)';
        roundRect(ctx, gx, y + 8, gw * wfrac, 14, 3);
        ctx.fill();
        drawLabel(ctx, r.name, gx, y + 2, r.mine ? K.text : K.muted, 11);
        drawLabel(ctx, `FID ${r.fid.toFixed(2)} · ${r.steps} 步`, gx + gw * (r.fid / FID_MAX) + 6, y + 15,
          r.mine ? K.green : K.muted, 11);
      });
      // step count comparison strip
      const sy = 216;
      drawLabel(ctx, '顺序步数（越少越快）', gx, sy - 6, K.muted, 11);
      const maxSteps = 256;
      ctx.fillStyle = K.blue;
      roundRect(ctx, gx, sy + 2, Math.max(4, (DATA[s.T] ? s.T : 4) / maxSteps * gw), 10, 2);
      ctx.fill();
      ctx.fillStyle = K.border;
      roundRect(ctx, gx, sy + 18, gw, 10, 2);
      ctx.fill();
      drawLabel(ctx, `NTM：${s.T} 步`, gx + 12 + (s.T / maxSteps) * gw, sy + 8, K.blue, 10);
      drawLabel(ctx, 'STARFlow：256 步', gx + gw - 96, sy + 24, K.muted, 10);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (t: T) => {
    stateRef.current.T = t;
    stateRef.current.t0 = performance.now() / 1000;
    setT(t);
    setFeedback(FEEDBACK[t]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {([4, 8, 16] as T[]).map((t) => (
          <button key={t} className={`chip ${T === t ? 'selected' : ''}`} onClick={() => pick(t)}>
            T = {t}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
