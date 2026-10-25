import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, dot, legend, canvasPoint, type WidgetProps } from './kit';

// Chapter 4.1 — drag a query point; the nearest class prototype wins.
type Pt = { x: number; y: number };
const PROTO: { id: number; c: string; name: string; p: Pt; s: Pt[] }[] = [
  {
    id: 0, c: C.blue, name: '类一',
    p: { x: 300, y: 150 },
    s: [{ x: 245, y: 118 }, { x: 332, y: 108 }, { x: 280, y: 190 }, { x: 352, y: 176 }, { x: 236, y: 162 }],
  },
  {
    id: 1, c: C.purple, name: '类二',
    p: { x: 620, y: 88 },
    s: [{ x: 556, y: 58 }, { x: 652, y: 60 }, { x: 692, y: 110 }, { x: 570, y: 122 }, { x: 632, y: 132 }],
  },
  {
    id: 2, c: C.orange, name: '类三',
    p: { x: 842, y: 190 },
    s: [{ x: 788, y: 158 }, { x: 882, y: 160 }, { x: 818, y: 222 }, { x: 902, y: 202 }, { x: 758, y: 206 }],
  },
];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export const C4Prototype: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [q, setQ] = useState<Pt>({ x: 470, y: 150 });
  const [drag, setDrag] = useState(false);

  const ds = PROTO.map((p) => dist(q, p.p));
  const best = ds.indexOf(Math.min(...ds));
  const second = [...ds].sort((x, y) => x - y)[1];

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);
    line(ctx, 100, 238, 990, 238, C.border, 2);

    PROTO.forEach((p, i) => {
      p.s.forEach((sp) => dot(ctx, sp.x, sp.y, 6, p.c, undefined));
      line(ctx, q.x, q.y, p.p.x, p.p.y, i === best ? C.green : C.border, i === best ? 4 : 2, i === best ? [] : [6, 6]);
      ctx.beginPath();
      ctx.arc(p.p.x, p.p.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      dot(ctx, p.p.x, p.p.y, 9, p.c, i === best ? C.green : C.white, 3);
    });

    dot(ctx, q.x, q.y, 11, C.white, C.text, 3);
    dot(ctx, q.x, q.y, 4, C.text);
    txt(ctx, ds[best].toFixed(0), q.x + 18, q.y - 18, C.green, 20, 'left', '700');

    legend(ctx, PROTO.map((p) => ({ label: p.name, color: p.c })), 110, 52);
    c.classList.add('is-ready');
  }, [q, best, ds]);

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    const p = canvasPoint(e, c);
    setQ({ x: Math.max(120, Math.min(970, p.x)), y: Math.max(52, Math.min(226, p.y)) });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => { setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
        onPointerMove={(e) => { if (drag) move(e); }}
        onPointerUp={() => setDrag(false)}
        onPointerLeave={() => setDrag(false)}
      />
      <div className="ctrl">
        <span className="val">归为 {PROTO[best].name}</span>
        <span className="val">最近 {ds[best].toFixed(0)} · 次近 {second.toFixed(0)}</span>
      </div>
      <div className={`feedback ${ds[best] < second - 80 ? 'good' : ''}`}>
        {ds[best] < second - 80
          ? `查询点明显靠近${PROTO[best].name}，最近邻判定很干净。`
          : '查询点落在两个原型中间：距离接近时，预测就会在边界附近摆动。'}
      </div>
    </div>
  );
};

export default C4Prototype;
