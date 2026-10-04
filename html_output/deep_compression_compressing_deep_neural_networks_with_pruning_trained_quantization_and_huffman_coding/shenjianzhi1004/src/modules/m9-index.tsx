import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;
const MAXD = 40;
const BOUND = 15;

export const M9Index: React.FC<WidgetProps> = () => {
  const [delta, setDelta] = useState(1);
  const areaRef = useRef<HTMLDivElement>(null);
  const pad = delta <= BOUND ? 0 : Math.ceil((delta - BOUND) / BOUND);

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // index row
    for (let i = 0; i < 12; i++) {
      const x = 60 + i * 78;
      ctx.fillStyle = i === 0 ? DC.blue : DC.photo;
      ctx.strokeStyle = i === 0 ? DC.blue : DC.border;
      ctx.lineWidth = 2;
      ctx.fillRect(x, 50, 66, 44);
      ctx.strokeRect(x, 50, 66, 44);
      drawSceneLabel(ctx, x + 33, 78, i === 0 ? '起点' : `+${i}`, i === 0 ? '#fff' : DC.muted, 13, 'center');
    }
    const pos = Math.min(11, Math.max(0, Math.round((delta / MAXD) * 11)));
    const hx = 60 + pos * 78;
    ctx.strokeStyle = DC.orange;
    ctx.lineWidth = 3;
    ctx.strokeRect(hx - 2, 48, 70, 48);
    // encoding line
    drawSceneLabel(ctx, 60, 150, `差值 δ = ${delta}`, DC.ink, 16);
    const enc = delta.toString(2).padStart(4, '0');
    drawSceneLabel(ctx, 60, 182, `4 位编码：${enc}`, pad ? DC.orange : DC.green, 15);
    for (let k = 0; k < pad; k++) {
      drawSceneLabel(ctx, 360 + k * 60, 182, '补零', DC.orange, 14);
    }
    drawLegend(ctx, 60, 250, [
      { label: '起点', color: DC.blue },
      { label: '当前', color: DC.orange },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    setDelta(Math.max(1, Math.min(MAXD, Math.round(1 + rel * (MAXD - 1)))));
  };

  const cls = delta <= BOUND ? 'good' : '';
  const text =
    delta <= BOUND
      ? '差值在 4 位范围内，一个短编码就够，索引存得很省。'
      : `超出 4 位范围，插入 ${pad} 个填充零，把差值拆成多段表示。`;

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
        <canvas id="cv-m9-index" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          索引差值 <span className="val">{delta}</span>
        </label>
        <input
          type="range"
          min={1}
          max={MAXD}
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M9Index;
