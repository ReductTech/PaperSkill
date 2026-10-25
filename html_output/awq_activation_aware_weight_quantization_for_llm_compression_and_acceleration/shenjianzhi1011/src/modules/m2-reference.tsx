import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFader, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const N = 40;

// Deterministic 40 channels: wNorm (weight magnitude) and actNorm (activation magnitude).
const CH = Array.from({ length: N }, (_, i) => ({
  w: ((i * 37) % 100) / 100,
  act: ((i * 53 + 11) % 100) / 100,
}));

function topK(score: number[], k: number): Set<number> {
  return new Set(
    score
      .map((v, i) => ({ v, i }))
      .sort((a, b) => b.v - a.v)
      .slice(0, k)
      .map((o) => o.i)
  );
}

export const M2Reference: React.FC<WidgetProps> = () => {
  const [refLevel, setRefLevel] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const score = CH.map((c) => (1 - refLevel) * c.w + refLevel * c.act);
  const selected = topK(score, 8);
  const byWeight = topK(CH.map((c) => c.w), 8);
  const overlap = [...selected].filter((i) => byWeight.has(i)).length;

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: 40 mini faders
    for (let i = 0; i < N; i++) {
      drawFader(ctx, 40 + (i % 20) * 17, 40 + Math.floor(i / 20) * 90, 70, CH[i].act, {
        salient: selected.has(i),
      });
    }
    // right: scatter |w| vs |act|
    const x0 = 470;
    const x1 = 1030;
    const y0 = 230;
    const y1 = 50;
    ctx.strokeStyle = AQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
    CH.forEach((c, i) => {
      const px = x0 + c.w * (x1 - x0);
      const py = y0 - c.act * (y0 - y1);
      ctx.fillStyle = selected.has(i) ? AQ.orange : AQ.blue;
      ctx.beginPath();
      ctx.arc(px, py, selected.has(i) ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    // selection box shifts with refLevel (a horizontal band = weight cutoff)
    const wCut = 1 - refLevel * 0.6;
    const bx = x0 + wCut * (x1 - x0);
    ctx.strokeStyle = AQ.orange;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0, y1, Math.max(4, bx - x0), y0 - y1);
    drawSceneLabel(ctx, x0, y0 + 24, '|权重| →', AQ.muted, 12);
    drawSceneLabel(ctx, x0 - 6, y1, '|激活| ↑', AQ.muted, 12);
    drawLegend(ctx, 470, 270, [
      { label: '选中', color: AQ.orange },
      { label: '其他', color: AQ.blue },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    setRefLevel(Math.max(0, Math.min(1, rel)));
  };

  const cls = refLevel > 0.7 ? 'good' : '';
  const text =
    refLevel < 0.3
      ? `按权重选：和随机挑差不多（与激活选出的重叠 ${overlap}/8）。`
      : refLevel < 0.7
      ? `两种标准开始分叉（重叠 ${overlap}/8）。`
      : `按激活选：选中的是真正吃到大幅值输入的通道（与权重选重叠仅 ${overlap}/8）。`;

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
        <canvas id="cv-m2-reference" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          参考 <span className="val">{(refLevel * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(refLevel * 100)} onChange={(e) => setRefLevel(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M2Reference;
