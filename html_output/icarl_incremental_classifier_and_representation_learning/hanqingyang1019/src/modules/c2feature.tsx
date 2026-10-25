import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, rr, arrow, canvasPoint, type WidgetProps } from './kit';

// Chapter 2.1 — one leaf image becomes an 8-dim feature; L2 norm keeps only direction.
const SAMPLES = [
  { label: '叶 A', color: C.blue, f: [0.62, 0.31, 0.9, 0.22, 0.44, 0.7, 0.18, 0.55] },
  { label: '叶 B', color: C.green, f: [0.18, 0.8, 0.35, 0.66, 0.28, 0.42, 0.74, 0.3] },
  { label: '叶 C', color: C.orange, f: [0.5, 0.52, 0.48, 0.55, 0.9, 0.2, 0.36, 0.62] },
  { label: '叶 D', color: C.purple, f: [0.75, 0.15, 0.22, 0.86, 0.33, 0.58, 0.4, 0.2] },
];

function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export const C2Feature: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [normed, setNormed] = useState(true);
  const s = SAMPLES[idx];
  const n = norm(s.f);
  const raw = Math.sqrt(s.f[0] * s.f[0] + s.f[1] * s.f[1]);
  const dir = { x: s.f[0] / (raw || 1), y: s.f[1] / (raw || 1) };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    // four leaf tiles
    SAMPLES.forEach((it, i) => {
      const x = 60 + i * 72;
      const y = 52;
      rr(ctx, x, y, 56, 56, 10, it.color, i === idx ? C.text : 'transparent', i === idx ? 3 : 0);
      line(ctx, x + 28, y + 44, x + 28, y + 14, C.bg, 3);
      line(ctx, x + 28, y + 34, x + 44, y + 24, C.bg, 3);
      line(ctx, x + 28, y + 26, x + 14, y + 18, C.bg, 3);
    });

    // feature bars
    const baseY = 238;
    s.f.forEach((v, i) => {
      const h = v * 150;
      const x = 380 + i * 42;
      ctx.fillStyle = v > 0.6 ? C.blue : C.light;
      ctx.fillRect(x, baseY - h, 24, h);
    });
    line(ctx, 372, baseY, 372 + 8 * 42 + 10, baseY, C.border, 2);
    txt(ctx, 'φ', 372, 236 - 160, C.muted, 22, 'left', '700');

    // direction on the unit circle
    const cx = 960;
    const cy = 132;
    const r = 78;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    const len = normed ? r : Math.min(1.55, n / 1.4) * r;
    arrow(ctx, cx, cy, cx + dir.x * len, cy - dir.y * len, normed ? C.blue : C.orange, 4);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = C.dark;
    ctx.fill();

    c.classList.add('is-ready');
  }, [idx, normed, s, n, dir.x, dir.y]);

  const onClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    const p = canvasPoint(e, c);
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 72;
      if (p.x >= x && p.x <= x + 56 && p.y >= 52 && p.y <= 108) {
        setIdx(i);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onPointerDown={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <div className="chip-row">
          {SAMPLES.map((it, i) => (
            <button key={it.label} className={`chip ${idx === i ? 'selected' : ''}`} onClick={() => setIdx(i)}>
              {it.label}
            </button>
          ))}
        </div>
        <button className={`chip ${normed ? 'selected' : ''}`} onClick={() => setNormed((v) => !v)}>
          归一化 {normed ? '开' : '关'}
        </button>
        <span className="val">‖φ‖ = {normed ? '1.00' : n.toFixed(2)}</span>
      </div>
      <div className={`feedback ${normed ? 'good' : ''}`}>
        {normed
          ? '长度被缩放到 1，方向完全不变：类别比较只看方向，长度不再干扰距离。'
          : '未归一化时箭头长度随样本缩放，同一个方向的图片也会显得“更远”——距离被长度污染。'}
      </div>
    </div>
  );
};

export default C2Feature;
