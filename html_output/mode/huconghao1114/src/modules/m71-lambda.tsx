import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, album, label, barH, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 7.1 Lambda trade-off dial. Verified data: Table 5 sweep
// lam 0.0 / 0.3 / 0.5 / 1.0 -> FID 54.61 / 53.74 / 53.12 / 51.72,
// ACC 33.07 / 33.47 / 31.53 / 32.10. Zero-shot FID reference 52.13.
const W = 1080;
const H = 280;
const LAMS = [0, 0.3, 0.5, 1.0];
const FID = [54.61, 53.74, 53.12, 51.72];
const ACC = [33.07, 33.47, 31.53, 32.1];
const NOTES = [
  { text: 'λ=0：不对照样片册，FID 恶化到 54.61——块内没人管，漂移发生。', cls: 'bad' },
  { text: 'λ=0.3：ACC 33.47、FID 53.74——论文在四个验证点里按整体最优选定（表5）。', cls: 'good' },
  { text: 'λ=0.5：FID 53.12 更好，但 ACC 掉到 31.53——四个验证点并非单调变化。', cls: '' },
  { text: 'λ=1.0：FID 最好 51.72，ACC 回升到 32.10 仍低于 0.3 档——锚太紧，理解整体吃亏。', cls: 'bad' },
];

export const M71Lambda: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(1);
  const lam = LAMS[idx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    clearStudio(ctx, W, H, 0.95);
    // left: image board anchored to the reference album
    board(ctx, 60, 60, 170, 130, '出图板');
    ctx.fillStyle = SC.green;
    ctx.fillRect(82, 88, 126, 78);
    album(ctx, 330, 60, 130, 130, 0.55);
    const t = 2 + lam * 12;
    ctx.strokeStyle = lam === 0 ? SC.shade : lam <= 0.3 ? SC.orange : SC.purple;
    ctx.lineWidth = t;
    ctx.setLineDash(lam === 0 ? [6, 6] : []);
    ctx.beginPath();
    ctx.moveTo(230, 125);
    ctx.lineTo(330, 125);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `λ = ${lam.toFixed(1)}`, 280, 226, lam === 0 ? SC.shade : lam <= 0.3 ? SC.orange : SC.purple, 15, 'center');
    // right: two gauges
    const bx = 560;
    label(ctx, '理解 ACC', bx, 84, SC.muted, 12);
    barH(ctx, bx + 80, 70, 320, (ACC[idx] - 30) / 6, 24, idx === 1 ? SC.green : SC.blue);
    label(ctx, ACC[idx].toFixed(2), bx + 408, 88, idx === 1 ? SC.green : SC.blue, 14);
    label(ctx, '出图 FID', bx, 156, SC.muted, 12);
    const fidColor = FID[idx] <= 53.2 ? SC.green : FID[idx] <= 54 ? SC.orange : SC.red;
    barH(ctx, bx + 80, 142, 320, (FID[idx] - 51) / 4, 24, fidColor);
    label(ctx, FID[idx].toFixed(2), bx + 408, 160, fidColor, 14);
    // zero-shot reference tick (52.13) on the FID axis
    const zx = bx + 80 + ((52.13 - 51) / 4) * 320;
    ctx.strokeStyle = SC.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zx, 134);
    ctx.lineTo(zx, 170);
    ctx.stroke();
    label(ctx, '零样本 52.13', zx - 34, 182, SC.muted, 10);
    // anchor tightness meter
    label(ctx, '锚的松紧', bx, 226, SC.muted, 12);
    barH(ctx, bx + 80, 214, 320, lam, 14, lam === 0 ? SC.shade : lam <= 0.3 ? SC.orange : SC.purple);
  }, [idx, lam]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          蒸馏权重 λ <span className="val">{lam.toFixed(1)}</span>
        </label>
        <input type="range" min={0} max={3} step={1} value={idx} onChange={(e) => setIdx(Number(e.target.value))} />
        <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, minWidth: 180, color: 'var(--slate-2)', fontSize: 12 }}>
          {LAMS.map((l, i) => (
            <span key={l} style={{ fontWeight: i === idx ? 700 : 400, color: i === idx ? 'var(--blue)' : undefined }}>
              {l.toFixed(1)}
            </span>
          ))}
        </div>
      </div>
      <div className={`feedback ${NOTES[idx].cls}`}>{NOTES[idx].text}</div>
    </div>
  );
};
export default M71Lambda;
