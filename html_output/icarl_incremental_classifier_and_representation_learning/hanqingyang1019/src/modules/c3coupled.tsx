import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, dot, rr, legend, type WidgetProps } from './kit';

// Chapter 3.1 — a fixed classification head decouples from the moving representation,
// while the prototype is recomputed from samples and moves with it.
function fixedScore(a: number): number {
  return 0.95 * Math.exp(-3.3 * a);
}
function protoScore(a: number): number {
  return 0.95 - 0.06 * a;
}

export const C3Coupled: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const panels = [
      { x: 50, title: '固定权重', color: C.red, f: fixedScore, label: 'w 不动' },
      { x: 550, title: '原型', color: C.green, f: protoScore, label: 'μ 重算' },
    ];

    panels.forEach((p) => {
      const left = p.x;
      const right = p.x + 480;
      const top = 76;
      const bottom = 226;
      rr(ctx, left, top - 34, 480, bottom - top + 52, 12, 'rgba(255,255,255,0.75)', C.border, 1);
      txt(ctx, p.title, left + 18, top - 12, C.text, 19, 'left', '700');

      line(ctx, left + 30, bottom, right - 16, bottom, C.border, 2);
      line(ctx, left + 30, top, left + 30, bottom, C.border, 2);

      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const x = left + 30 + t * (right - left - 50);
        const y = bottom - p.f(t) * (bottom - top - 14);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      const px = left + 30 + a * (right - left - 50);
      const py = bottom - p.f(a) * (bottom - top - 14);
      line(ctx, px, bottom, px, py, C.border, 1, [4, 4]);
      dot(ctx, px, py, 8, p.color, C.white, 3);
      txt(ctx, p.f(a).toFixed(2), right - 18, top + 6, p.color, 24, 'right', '700');
    });

    legend(ctx, [
      { label: '旧类分数', color: C.red },
      { label: '原型分数', color: C.green },
    ], 700, 44);
    c.classList.add('is-ready');
  }, [a]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          表示更新强度 α <span className="val">{a.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(a * 100)} onChange={(e) => setA(Number(e.target.value) / 100)} />
        <span className="val">固定头 {fixedScore(a).toFixed(2)} / 原型 {protoScore(a).toFixed(2)}</span>
      </div>
      <div className={`feedback ${a > 0.45 ? 'bad' : ''}`}>
        {a > 0.45
          ? '固定权重还停在旧特征的位置，旧类分数已经崩了；原型由样本现算，跟着表示一起移动，分数基本不动。'
          : '表示只更新了一点点时，两者都能维持；继续加大 α，差距会迅速拉开。'}
      </div>
    </div>
  );
};

export default C3Coupled;
