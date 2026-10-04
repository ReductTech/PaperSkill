import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPhotoTile, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

// Fixed bimodal sample: small-magnitude weights dominate, a few large ones exist.
const WEIGHTS: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 160; i++) {
    const s = i % 2 === 0 ? -1 : 1;
    const m = i % 13 === 0 ? 0.45 + (i % 5) * 0.03 : 0.08 + (i % 9) * 0.02;
    out.push(s * m);
  }
  return out;
})();

export const M2Dist: React.FC<WidgetProps> = () => {
  const [thr, setThr] = useState(0); // 0..1 -> |w| threshold 0..0.6
  const areaRef = useRef<HTMLDivElement>(null);

  const covered = WEIGHTS.filter((v) => Math.abs(v) < thr * 0.6).length / WEIGHTS.length;

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 50;
    const x1 = 700;
    const y0 = 230;
    const y1 = 50;
    const bins = new Array(20).fill(0);
    WEIGHTS.forEach((v) => {
      const b = Math.min(19, Math.max(0, Math.floor(((v + 1) / 2) * 20)));
      bins[b] += 1;
    });
    const maxB = Math.max(...bins);
    const bw = (x1 - x0) / 20;
    bins.forEach((c, i) => {
      const cx = x0 + i * bw;
      const bh = (c / maxB) * (y0 - y1);
      const wv = -1 + ((i + 0.5) / 20) * 2;
      ctx.fillStyle = Math.abs(wv) < thr * 0.6 ? DC.red : DC.blue;
      ctx.fillRect(cx + 1, y0 - bh, bw - 2, bh);
    });
    const lineX = x0 + ((thr * 0.6 + 0.6) / 1.2) * (x1 - x0);
    ctx.strokeStyle = DC.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lineX, y1 - 6);
    ctx.lineTo(lineX, y0);
    ctx.stroke();
    // right: photo tiles, covered ones grayed
    for (let i = 0; i < 12; i++) {
      const v = WEIGHTS[i * 13 % WEIGHTS.length];
      drawPhotoTile(ctx, 760 + (i % 4) * 70, 60 + Math.floor(i / 4) * 66, 56, 50, {
        blur: Math.abs(v) < thr * 0.6,
      });
    }
    drawSceneLabel(ctx, 760, 48, '连接', DC.ink, 13);
    drawLegend(ctx, 50, 262, [
      { label: '低幅值', color: DC.red },
      { label: '高幅值', color: DC.blue },
      { label: '阈值', color: DC.orange },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const xFrac = (rel * W - 50) / 650; // canvas x -> 0..1 over the histogram
    setThr(Math.max(0, Math.min(1, xFrac)));
  };

  const cls = thr > 0.6 ? 'bad' : '';
  const text =
    thr > 0.6
      ? '阈值太高，连重要权重也开始被划掉，准确率会受损。'
      : thr > 0.2
      ? `约 ${(covered * 100).toFixed(0)}% 的权重幅值很小，正是剪枝的主要对象。`
      : '只有很少的权重被划掉，压缩空间还很小。';

  return (
    <div>
      <div
        ref={areaRef}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX);
        }}
      >
        <canvas id="cv-m2-dist" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          幅值阈值 <span className="val">{(thr * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(thr * 100)}
          onChange={(e) => setThr(Number(e.target.value) / 100)}
        />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M2Dist;
