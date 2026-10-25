import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, dot, line, legend, type WidgetProps } from './kit';

// Chapter 9.1 — herding picks the sample whose inclusion keeps the running mean closest
// to the true class mean. One click adds the next sample.
type P = { x: number; y: number };
const PTS: P[] = Array.from({ length: 24 }, (_, i) => ({
  x: 150 + ((i * 149) % 780),
  y: 58 + ((i * 97) % 150),
}));
const MEAN: P = {
  x: PTS.reduce((s, p) => s + p.x, 0) / PTS.length,
  y: PTS.reduce((s, p) => s + p.y, 0) / PTS.length,
};

function buildOrder(): number[] {
  const order: number[] = [];
  const used = new Set<number>();
  for (let k = 0; k < 12; k++) {
    let best = -1;
    let bestErr = Infinity;
    PTS.forEach((p, i) => {
      if (used.has(i)) return;
      const sum = order.reduce((s, j) => ({ x: s.x + PTS[j].x, y: s.y + PTS[j].y }), { x: 0, y: 0 });
      const n = order.length + 1;
      const err = Math.hypot((sum.x + p.x) / n - MEAN.x, (sum.y + p.y) / n - MEAN.y);
      if (err < bestErr) {
        bestErr = err;
        best = i;
      }
    });
    used.add(best);
    order.push(best);
  }
  return order;
}
const ORDER = buildOrder();
const RANDOM = [...PTS.keys()].sort((a, b) => ((a * 37) % 24) - ((b * 37) % 24));

function errAt(order: number[], k: number): number {
  if (k === 0) return 0;
  const sel = order.slice(0, k).map((i) => PTS[i]);
  const m = sel.reduce((s, p) => ({ x: s.x + p.x / k, y: s.y + p.y / k }), { x: 0, y: 0 });
  return Math.hypot(m.x - MEAN.x, m.y - MEAN.y);
}

export const C9Herding: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);
    line(ctx, 120, 226, 980, 226, C.border, 2);

    const chosen = new Set(ORDER.slice(0, k));
    PTS.forEach((p, i) => dot(ctx, p.x, p.y, chosen.has(i) ? 8 : 5, chosen.has(i) ? C.green : C.dark, chosen.has(i) ? C.white : undefined, 2));

    if (k > 0) {
      const sel = ORDER.slice(0, k).map((i) => PTS[i]);
      const mx = sel.reduce((s, p) => s + p.x / k, 0);
      const my = sel.reduce((s, p) => s + p.y / k, 0);
      line(ctx, mx, my, MEAN.x, MEAN.y, C.orange, 2, [5, 4]);
      dot(ctx, mx, my, 11, C.orange, C.white, 3);
    }

    // true mean cross
    line(ctx, MEAN.x - 10, MEAN.y, MEAN.x + 10, MEAN.y, C.wood, 3);
    line(ctx, MEAN.x, MEAN.y - 10, MEAN.x, MEAN.y + 10, C.wood, 3);

    legend(ctx, [
      { label: '已选', color: C.green },
      { label: '已选均值', color: C.orange },
      { label: '总体均值', color: C.wood },
    ], 640, 46);

    txt(ctx, k.toString(), 1000, 210, C.muted, 26, 'right', '700');
    c.classList.add('is-ready');
  }, [k]);

  const eh = errAt(ORDER, k);
  const er = errAt(RANDOM, k);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip selected" onClick={() => setK((v) => Math.min(12, v + 1))} disabled={k >= 12}>
          选下一枝
        </button>
        <button className="chip" onClick={() => setK(0)}>
          重来
        </button>
        <span className="val">已选 {k} · 误差 {eh.toFixed(0)}（随机 {er.toFixed(0)}）</span>
      </div>
      <div className={`feedback ${k >= 6 ? 'good' : ''}`}>
        {k === 0
          ? '点“选下一枝”：每次加入让“已选均值”最接近总体均值的那一个样本。'
          : eh <= er
          ? `herding 的均值误差 ${eh.toFixed(0)}，不高于同样数量的随机选择（${er.toFixed(0)}）：优先级让前缀子集始终可删。`
          : `当前 ${k} 个样本下 herding 的误差反而略高，但前 k 个仍保持最优顺序；继续增加样本会收敛。`}
      </div>
    </div>
  );
};

export default C9Herding;
