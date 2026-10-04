import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const CENTROIDS = [-0.62, -0.14, 0.31, 0.83];
const INDEX: number[][] = [
  [0, 2, 3, 1],
  [1, 0, 2, 3],
  [3, 3, 1, 0],
  [2, 1, 0, 2],
];
const COLORS = [DC.blue, DC.green, DC.orange, DC.purple];

export const M6Codebook: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const count = sel === null ? 0 : INDEX.flat().filter((v) => v === sel).length;

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // codebook
    drawSceneLabel(ctx, 50, 44, '码本', DC.ink, 14);
    CENTROIDS.forEach((c, i) => {
      const y = 66 + i * 46;
      const active = sel === i;
      ctx.fillStyle = COLORS[i];
      ctx.globalAlpha = sel === null || active ? 1 : 0.4;
      ctx.fillRect(50, y, 26, 30);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? DC.ink : DC.border;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.strokeRect(50, y, 150, 30);
      drawSceneLabel(ctx, 90, y + 21, `${c.toFixed(2)}  #${i + 1}`, active ? DC.ink : DC.muted, 13);
    });
    // index grid
    drawSceneLabel(ctx, 360, 44, '索引', DC.ink, 14);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = INDEX[r][c];
        const active = sel === v;
        ctx.fillStyle = active ? COLORS[v] : DC.photo;
        ctx.strokeStyle = active ? COLORS[v] : DC.border;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.fillRect(360 + c * 60, 60 + r * 52, 54, 46);
        ctx.strokeRect(360 + c * 60, 60 + r * 52, 54, 46);
        drawSceneLabel(ctx, 387 + c * 60, 90 + r * 52, String(v + 1), active ? '#fff' : DC.ink, 16, 'center');
      }
    }
    // storage breakdown
    drawSceneLabel(ctx, 680, 44, '存储', DC.ink, 14);
    drawBar(ctx, 680, 70, 320, 20, 0.45, DC.blue);
    drawBar(ctx, 680, 106, 320, 20, 0.45, DC.purple);
    drawBar(ctx, 680, 142, 320, 20, 0.1, DC.orange);
    drawLegend(ctx, 680, 190, [
      { label: '权值', color: DC.blue },
      { label: '索引', color: DC.purple },
      { label: '码本', color: DC.orange },
    ]);
  }, W, H);

  const onCanvasClick = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const cy = ((clientY - rect.top) / rect.height) * H;
    if (cx >= 50 && cx <= 200) {
      const row = Math.floor((cy - 66) / 46);
      if (row >= 0 && row < 4) setSel(row);
    }
  };

  const text =
    sel === null
      ? '点击左侧一个共享权值，看看哪些连接在用它。'
      : `编号 #${sel + 1} 被 ${count} 个连接共享；索引只要 2 位，整层压缩率 16×32/(4×32+2×16)=3.2。`;

  return (
    <div>
      <div
        ref={areaRef}
        style={{ cursor: 'pointer' }}
        onClick={(e) => onCanvasClick(e.clientX, e.clientY)}
      >
        <canvas id="cv-m6-codebook" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {CENTROIDS.map((c, i) => (
          <button key={i} className={`chip ${sel === i ? 'selected' : ''}`} onClick={() => setSel(i)}>
            #{i + 1} ({c.toFixed(2)})
          </button>
        ))}
      </div>
      <div className={`feedback ${sel === null ? '' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M6Codebook;
