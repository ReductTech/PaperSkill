import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, label, barH, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 8.2 Expert-count selector. Verified data: Table 7
// n = 2 / 4 / 6 -> ACC 32.24 / 33.47 / 34.90, FID 53.61 / 53.74 / 52.69.
const W = 1080;
const H = 280;
const NS = [2, 4, 6];
const ACC = [32.24, 33.47, 34.9];
const FID = [53.61, 53.74, 52.69];
const NOTES = [
  { text: '2 支专家：ACC 32.24——分工不够，模态内挤占偏多（表7）。', cls: 'bad' },
  { text: '4 支专家（论文默认）：ACC 33.47、FID 53.74——性能与算力的折中。', cls: 'good' },
  { text: '6 支专家：ACC 34.90、FID 52.69 全面更好——但论文按算力选了 4（附录E.2）。', cls: '' },
];

export const M82Experts: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState(1);

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
    const n = NS[sel];
    // answer board with n windows
    board(ctx, 70, 60, 320, 140, '');
    for (let i = 0; i < n; i++) {
      const wx = 90 + (i % 3) * 100;
      const wy = 84 + Math.floor(i / 3) * 56;
      ctx.fillStyle = mix(SC.purple, SC.bg, 0.4);
      ctx.fillRect(wx, wy, 86, 44);
      ctx.strokeStyle = SC.purple;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, wy, 86, 44);
    }
    label(ctx, `n = ${n}`, 230, 232, SC.purple, 15, 'center');
    // gauges
    const bx = 560;
    label(ctx, '理解 ACC', bx, 84, SC.muted, 12);
    barH(ctx, bx + 80, 70, 320, (ACC[sel] - 30) / 6, 24, sel === 2 ? SC.green : SC.blue);
    label(ctx, ACC[sel].toFixed(2), bx + 408, 88, sel === 2 ? SC.green : SC.blue, 14);
    label(ctx, '出图 FID', bx, 156, SC.muted, 12);
    const fidColor = FID[sel] <= 52.8 ? SC.green : SC.orange;
    barH(ctx, bx + 80, 142, 320, (FID[sel] - 51) / 4, 24, fidColor);
    label(ctx, FID[sel].toFixed(2), bx + 408, 160, fidColor, 14);
    label(ctx, '窗口越多 = 分工越细 = 参数越多', bx + 80, 226, SC.muted, 12);
  }, [sel]);

  return (
    <div>
      <div className="chip-row">
        {NS.map((n, i) => (
          <button key={n} className={`chip ${sel === i ? 'selected' : ''}`} onClick={() => setSel(i)}>
            {n} 支专家
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className={`feedback ${NOTES[sel].cls}`}>{NOTES[sel].text}</div>
    </div>
  );
};
export default M82Experts;
