import React, { useRef, useState } from 'react';
import { C, useScene, txt, line, rr, dot, ring, clamp, bar } from './scene';

// 第2章：同学特点分布（特征空间）
// 拖动"新同学"的点：落在老同学的簇里就会被认错，落在空地上边界才宽。

const W = 1000;
const H = 300;
const SP = { x: 40, y: 26, w: 470, h: 250 };

const CLUSTERS = [
  { x: 148, y: 92 },
  { x: 236, y: 208 },
  { x: 392, y: 118 },
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const OLD_POINTS: [number, number][][] = CLUSTERS.map((c, ci) => {
  const rnd = seeded(97 + ci * 131);
  return Array.from({ length: 14 }, () => {
    const a = rnd() * Math.PI * 2;
    const r = 8 + rnd() * 30;
    return [c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.82] as [number, number];
  });
});

export default function FeatureSpace() {
  const posRef = useRef({ x: 470, y: 240 });
  const dragging = useRef(false);
  const [pos, setPos] = useState({ x: 470, y: 240 });
  const [overlap, setOverlap] = useState(false);

  const maxSim = (() => {
    const s = CLUSTERS.map((c) => {
      const d = Math.hypot(pos.x - c.x, pos.y - c.y);
      return clamp(1 - d / 250, 0, 1);
    });
    return { list: s, best: Math.max(...s), nearest: s.indexOf(Math.max(...s)) };
  })();

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // 特征空间底板
    rr(ctx, SP.x, SP.y, SP.w, SP.h, 8);
    ctx.fillStyle = '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 老类簇
    CLUSTERS.forEach((c, i) => {
      const near = maxSim.best >= 0.8 && maxSim.nearest === i;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 52, 40, 0, 0, Math.PI * 2);
      ctx.fillStyle = near ? 'rgba(196,63,82,0.12)' : 'rgba(74,100,132,0.10)';
      ctx.fill();
      ctx.strokeStyle = near ? 'rgba(196,63,82,0.55)' : 'rgba(74,100,132,0.35)';
      ctx.lineWidth = near ? 2 : 1.2;
      ctx.stroke();
      ctx.restore();
      OLD_POINTS[i].forEach(([x, y]) => dot(ctx, x, y, 3.4, near ? C.red : C.old));
      txt(ctx, String(i + 1), c.x, c.y + 3.5, 12, C.muted, 'center', 700);
    });

    // 新同学的点
    const p = posRef.current;
    const inside = maxSim.best >= 0.8;
    dot(ctx, p.x, p.y, 7, inside ? C.red : C.novice);
    ring(ctx, p.x, p.y, 13, inside ? C.red : C.orange, t);
    txt(ctx, '新', p.x, p.y + 4, 10, '#ffffff', 'center', 700);

    // 最近的连线
    const near = CLUSTERS[maxSim.nearest];
    line(ctx, p.x, p.y, near.x, near.y, inside ? C.red : C.line, 1.4, [4, 4]);

    // 右侧：相似度条
    const bx = 590;
    const by = 54;
    txt(ctx, '相似度', bx, by - 14, 13, C.muted, 'left', 600);
    maxSim.list.forEach((s, i) => {
      const y = by + i * 52;
      txt(ctx, String(i + 1), bx, y + 17, 12, C.muted, 'left', 600);
      rr(ctx, bx + 18, y, 230, 14, 7);
      ctx.fillStyle = C.line;
      ctx.fill();
      bar(ctx, bx + 18, y, Math.max(6, 230 * s), 14, s >= 0.8 ? C.red : C.blue, 7);
      txt(ctx, s.toFixed(2), bx + 258, y + 12, 12, s >= 0.8 ? C.red : C.ink, 'left', 700);
    });
    // 阈值
    const s0 = 0.8;
    const ty = by + 3 * 52 + 6;
    line(ctx, bx + 18 + 230 * s0, by - 6, bx + 18 + 230 * s0, ty - 12, C.orange, 1.4, [4, 3]);
    txt(ctx, '0.8', bx + 18 + 230 * s0, by - 12, 11, C.orange, 'center', 700);

    // 判定徽标
    const gx = 900;
    const gy = 78;
    dot(ctx, gx, gy, 22, inside ? 'rgba(196,63,82,0.14)' : 'rgba(34,141,92,0.14)');
    ctx.save();
    ctx.strokeStyle = inside ? C.red : C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (inside) {
      ctx.moveTo(gx - 8, gy - 8);
      ctx.lineTo(gx + 8, gy + 8);
      ctx.moveTo(gx + 8, gy - 8);
      ctx.lineTo(gx - 8, gy + 8);
    } else {
      ctx.moveTo(gx - 9, gy + 1);
      ctx.lineTo(gx - 2, gy + 8);
      ctx.lineTo(gx + 10, gy - 7);
    }
    ctx.stroke();
    ctx.restore();
  });

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    return {
      x: clamp(x, SP.x + 10, SP.x + SP.w - 10),
      y: clamp(y, SP.y + 10, SP.y + SP.h - 10),
    };
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const p = toLocal(e);
    posRef.current = p;
    setPos(p);
  };

  const best = maxSim.list[maxSim.nearest];
  const inside = best >= 0.8;

  const fb = inside
    ? {
        cls: 'bad',
        text: `最近的老簇相似度 ${best.toFixed(2)}：这个新同学直接落进了老同学的圈里，分类器只能靠一条很窄的边界硬分，稍微再学一批就被并进去了。`,
      }
    : best > 0.66
    ? {
        cls: '',
        text: `最近的老簇相似度 ${best.toFixed(2)}：贴着老簇边缘，勉强分得开。边界越窄，后面几批新同学越容易把它挤过去。`,
      }
    : {
        cls: 'good',
        text: `最近的老簇相似度 ${best.toFixed(2)}：落在空地上，新簇和老簇拉得开，边界宽，分类器不容易认错。`,
      };

  return (
    <div>
      <canvas
        ref={ref}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = toLocal(e);
          posRef.current = p;
          setPos(p);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      />
      <div className="ctrl">
        <label>新同学落点</label>
        <span className="val">
          ({Math.round(pos.x)}, {Math.round(pos.y)})
        </span>
        <button
          className="tiny ghost"
          onClick={() => {
            const p = { x: 470, y: 240 };
            posRef.current = p;
            setPos(p);
          }}
        >
          放回空地
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">最近老类</div>
          <div className="v">第 {maxSim.nearest + 1} 类</div>
        </div>
        <div className="metric">
          <div className="l">归一化余弦相似度</div>
          <div className="v" style={{ color: inside ? C.red : best > 0.66 ? C.orange : C.green }}>
            {best.toFixed(2)}
          </div>
        </div>
        <div className="metric">
          <div className="l">阈值 σ</div>
          <div className="v" style={{ color: C.orange }}>0.80</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>
        {fb.text}（把「新」拖到不同位置试试，圈 1/2/3 是老同学的三类特点）
      </div>
    </div>
  );
}
