import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasin, drawGarment, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
const N = 32;
const VALS = Array.from({ length: N }, (_, i) =>
  i === 3 ? 44 : i === 11 ? 58 : i === 19 ? 37 : 0.6 + ((i * 17) % 25) / 10
);
const MAXV = 60;

export const M3Outlier: React.FC<WidgetProps> = () => {
  const [pos, setPos] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const idx = Math.min(N - 1, Math.round(pos * (N - 1)));
  const v = VALS[idx];
  const isOut = v > 6;

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 60;
    const x1 = 660;
    const y0 = 220;
    const y1 = 50;
    const bw = (x1 - x0) / N;
    VALS.forEach((val, i) => {
      const bh = (val / MAXV) * (y0 - y1);
      ctx.fillStyle = val > 6 ? LI.red : LI.blue;
      ctx.fillRect(x0 + i * bw + 1, y0 - bh, bw - 2, bh);
    });
    ctx.strokeStyle = LI.orange;
    ctx.lineWidth = 2.5;
    const cx = x0 + idx * bw + bw / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y1 - 6);
    ctx.lineTo(cx, y0);
    ctx.stroke();
    drawSceneLabel(ctx, x0, y0 + 24, '特征维度 →', LI.muted, 12);
    // basin
    drawBasin(ctx, 760, 90, 190, 90, { fill: 0.5 });
    drawGarment(ctx, 800, 104, 60, 46, { big: true });
    drawSceneLabel(ctx, 760, 80, `幅值 ${v.toFixed(1)}`, isOut ? LI.red : LI.green, 14);
    drawSceneLabel(ctx, 760, 200, isOut ? '离群维度' : '普通维度', isOut ? LI.red : LI.green, 13);
    drawLegend(ctx, 760, 240, [
      { label: '普通', color: LI.blue },
      { label: '离群', color: LI.red },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const cls = isOut ? 'bad' : 'good';
  const text = isOut
    ? `幅值 ${v.toFixed(1)}，超过阈值 6——一个全局缩放会被它撑爆。`
    : '幅值正常，8 位能表示。';

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
        <canvas id="cv-m3-outlier" ref={ref} width={W} height={H} />
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

export default M3Outlier;
