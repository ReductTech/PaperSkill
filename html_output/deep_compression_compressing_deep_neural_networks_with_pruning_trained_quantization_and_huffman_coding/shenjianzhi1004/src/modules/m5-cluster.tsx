import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const VALS = [-0.95, -0.8, -0.62, -0.5, -0.34, -0.22, -0.1, 0.04, 0.16, 0.27, 0.42, 0.58, 0.7, 0.84, 0.93, 1.0];
const K_OPTIONS = [4, 8, 16, 32, 256] as const;

function kmeans1d(vals: number[], k: number): { assign: number[]; cents: number[]; wcss: number } {
  const kk = Math.min(k, vals.length);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const cents = Array.from({ length: kk }, (_, i) => min + ((i + 0.5) / kk) * (max - min));
  const assign = new Array(vals.length).fill(0);
  for (let it = 0; it < 30; it++) {
    vals.forEach((v, i) => {
      let best = 0;
      let bd = Infinity;
      cents.forEach((c, j) => {
        const d = Math.abs(v - c);
        if (d < bd) {
          bd = d;
          best = j;
        }
      });
      assign[i] = best;
    });
    const sums = new Array(kk).fill(0);
    const counts = new Array(kk).fill(0);
    vals.forEach((v, i) => {
      sums[assign[i]] += v;
      counts[assign[i]] += 1;
    });
    cents.forEach((_, j) => {
      if (counts[j] > 0) cents[j] = sums[j] / counts[j];
    });
  }
  let wcss = 0;
  vals.forEach((v, i) => {
    wcss += (v - cents[assign[i]]) ** 2;
  });
  return { assign, cents, wcss };
}

export const M5Cluster: React.FC<WidgetProps> = () => {
  const [k, setK] = useState(4);
  const { assign, cents, wcss } = kmeans1d(VALS, k);
  const bits = Math.log2(k);
  const palette = [DC.blue, DC.green, DC.orange, DC.purple, DC.red, DC.deskDark, DC.route, DC.muted];

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 60;
    const x1 = 720;
    const y = 150;
    ctx.strokeStyle = DC.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    const px = (v: number) => x0 + ((v + 1) / 2) * (x1 - x0);
    VALS.forEach((v, i) => {
      const cx = px(v);
      const cy = y + (i % 3) * 4 - 4;
      ctx.strokeStyle = palette[assign[i] % palette.length];
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px(cents[assign[i]]), y - 46);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette[assign[i] % palette.length];
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    cents.forEach((c, j) => {
      const cx = px(c);
      ctx.fillStyle = palette[j % palette.length];
      ctx.beginPath();
      ctx.moveTo(cx, y - 56);
      ctx.lineTo(cx + 7, y - 46);
      ctx.lineTo(cx, y - 36);
      ctx.lineTo(cx - 7, y - 46);
      ctx.closePath();
      ctx.fill();
    });
    drawSceneLabel(ctx, 760, 80, `索引 ${bits} 位`, DC.blue, 14);
    drawSceneLabel(ctx, 760, 116, `码本 ${k}`, DC.purple, 14);
    drawLegend(ctx, 760, 160, [
      { label: '权重', color: DC.blue },
      { label: '中心', color: DC.orange },
    ]);
    drawLegend(ctx, 760, 190, [{ label: `WCSS ${wcss.toFixed(2)}`, color: DC.muted }]);
  }, W, H);

  const cls = k >= 8 && k <= 32 ? 'good' : '';
  const text =
    k < 8
      ? '组数少、索引短，但簇内误差偏大。'
      : k <= 32
      ? '组数与误差较平衡：论文剪枝后的 AlexNet 用 CONV 8 位（256 组）、FC 5 位（32 组）。'
      : '误差最小，但索引要 8 位，压缩率会下降。';

  return (
    <div>
      <canvas id="cv-m5-cluster" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {K_OPTIONS.map((opt) => (
          <button key={opt} className={`chip ${k === opt ? 'selected' : ''}`} onClick={() => setK(opt)}>
            k = {opt}
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M5Cluster;
