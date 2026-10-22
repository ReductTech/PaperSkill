import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasket, drawRock, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
const N = 32;
const VALS = Array.from({ length: N }, (_, i) =>
  i === 3 ? 25 : i === 11 ? 30 : i === 19 ? 22 : 0.6 + ((i * 17) % 20) / 10
);
const MAXV = 30;

export const M2Outlier: React.FC<WidgetProps> = () => {
  const [pos, setPos] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const idx = Math.min(N - 1, Math.round(pos * (N - 1)));
  const v = VALS[idx];
  const levels = Math.max(1, Math.round((256 * v) / MAXV));

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 60;
    const x1 = 620;
    const y0 = 220;
    const y1 = 50;
    const bw = (x1 - x0) / N;
    VALS.forEach((val, i) => {
      const bh = (val / MAXV) * (y0 - y1);
      ctx.fillStyle = val > 10 ? SQ.red : SQ.blue;
      ctx.fillRect(x0 + i * bw + 1, y0 - bh, bw - 2, bh);
    });
    ctx.strokeStyle = SQ.orange;
    ctx.lineWidth = 2.5;
    const cx = x0 + idx * bw + bw / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y1 - 6);
    ctx.lineTo(cx, y0);
    ctx.stroke();
    drawSceneLabel(ctx, x0, y0 + 24, '通道 →', SQ.muted, 12);
    // basket view
    drawBasket(ctx, 760, 80, 160, 64, { highlight: true });
    drawRock(ctx, 840, 92, 15, { outlier: v > 10 });
    for (let i = 0; i < 4; i++) drawRock(ctx, 790 + i * 22, 108, 5, {});
    drawSceneLabel(ctx, 760, 70, `有效档位 ${levels}`, levels < 10 ? SQ.red : SQ.green, 14);
    drawSceneLabel(ctx, 760, 170, v > 10 ? '离群通道' : '普通通道', v > 10 ? SQ.red : SQ.green, 13);
    drawLegend(ctx, 760, 230, [
      { label: '普通', color: SQ.blue },
      { label: '离群', color: SQ.red },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const cls = v > 10 ? 'bad' : 'good';
  const text =
    v <= 10
      ? '普通通道：有效档位充足。'
      : v <= 22
      ? `幅值 ${v.toFixed(1)}：离群通道，只有 ${levels} 个有效档位。`
      : `幅值 ${v.toFixed(1)}：巨石级离群，只有 ${levels} 个有效档位——量化误差会很大。`;

  return (
    <div>
      <div
        ref={areaRef}
        style={{ cursor: 'ew-resize' }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX);
        }}
      >
        <canvas id="cv-m2-outlier" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          检查位置 <span className="val">{(pos * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(pos * 100)} onChange={(e) => setPos(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M2Outlier;
