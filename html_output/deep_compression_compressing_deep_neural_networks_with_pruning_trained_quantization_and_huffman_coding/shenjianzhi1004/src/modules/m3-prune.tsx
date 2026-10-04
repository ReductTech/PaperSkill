import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawAlbumFrame, drawPhotoTile, drawBar, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

export const M3Prune: React.FC<WidgetProps> = () => {
  const [sparsity, setSparsity] = useState(0);
  const kept = 1 - sparsity;
  const over = Math.max(0, sparsity - 0.85);
  const error = 42.78 + over * 62;

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawAlbumFrame(ctx, 40, 50, 340, 180, sparsity > 0.92);
    const total = 20;
    const remaining = Math.round(total * kept);
    for (let i = 0; i < total - remaining; i++) {
      drawPhotoTile(ctx, 52 + (i % 5) * 66, 62 + Math.floor(i / 5) * 56, 56, 48, { blur: true });
    }
    for (let i = 0; i < remaining; i++) {
      drawPhotoTile(ctx, 52 + (i % 5) * 66, 62 + Math.floor(i / 5) * 56, 56, 48, {});
    }
    // right: connection + storage bars and error curve
    const x0 = 470;
    const x1 = 1040;
    drawBar(ctx, x0, 70, x1 - x0, 20, kept, DC.blue);
    drawBar(ctx, x0, 120, x1 - x0, 20, kept, DC.orange);
    drawLegend(ctx, x0, 160, [
      { label: '连接', color: DC.blue },
      { label: '存储', color: DC.orange },
    ]);
    // error curve
    const cy0 = 250;
    const cy1 = 185;
    ctx.strokeStyle = DC.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, cy0);
    ctx.lineTo(x1, cy0);
    ctx.stroke();
    ctx.strokeStyle = error > 43 ? DC.red : DC.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let s = 0; s <= 1.0001; s += 0.02) {
      const e = 42.78 + Math.max(0, s - 0.85) * 62;
      const xx = x0 + s * (x1 - x0);
      const yy = cy0 - ((e - 40) / 12) * (cy0 - cy1);
      if (s === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const px = x0 + sparsity * (x1 - x0);
    const py = cy0 - ((error - 40) / 12) * (cy0 - cy1);
    ctx.fillStyle = error > 43 ? DC.red : DC.green;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, cy1 - 6, '误差', DC.muted, 12);
  }, W, H);

  const cls = sparsity > 0.92 ? 'bad' : sparsity > 0.85 ? '' : 'good';
  const text =
    sparsity > 0.92
      ? '剪得太狠，准确率会明显下降。'
      : sparsity > 0.85
      ? '接近安全边界，必须靠重训练守住精度。'
      : '这个范围内剪枝后重训练能恢复到原准确率。';

  return (
    <div>
      <canvas id="cv-m3-prune" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          剪枝比例 <span className="val">{(sparsity * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={95}
          value={Math.round(sparsity * 100)}
          onChange={(e) => setSparsity(Number(e.target.value) / 100)}
        />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M3Prune;
