import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §3：桌上散着索引卡，一只手先画出两两之间的直接引文线，
// 再让卡片上重合的参考文献之间浮现出文献耦合（橙）与共引（紫）细线，散卡连成网。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', orange: '#f07e47',
  purple: '#7c3aed', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const CARDS: { x: number; y: number }[] = [
  { x: 52, y: 26 }, { x: 166, y: 20 }, { x: 286, y: 32 }, { x: 404, y: 24 },
  { x: 88, y: 82 }, { x: 202, y: 90 }, { x: 322, y: 78 }, { x: 440, y: 86 },
];
const CW = 46;
const CH = 30;

const DIRECT: [number, number][] = [[0, 1], [2, 3], [4, 5]];
const BC: [number, number][] = [[0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [2, 6]];
const CC: [number, number][] = [[1, 5], [3, 7], [0, 6], [2, 4]];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();

    const center = (i: number) => ({ x: CARDS[i].x + CW / 2, y: CARDS[i].y + CH / 2 });

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.6;
      const p = (t % cycle) / cycle;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 卡阵
      for (let i = 0; i < CARDS.length; i++) {
        ctx.fillStyle = '#fff';
        roundRect(ctx, CARDS[i].x, CARDS[i].y, CW, CH, 4);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.6;
        roundRect(ctx, CARDS[i].x, CARDS[i].y, CW, CH, 4);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillRect(CARDS[i].x + 6, CARDS[i].y + 6, CW - 12, 4);
      }

      const drawSet = (set: [number, number][], color: string, from: number, to: number, width: number, dashed: boolean) => {
        const k = clamp((p - from) / (to - from), 0, 1);
        const n = Math.round(k * set.length);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dashed) ctx.setLineDash([5, 4]);
        for (let i = 0; i < n; i++) {
          const a = center(set[i][0]);
          const b = center(set[i][1]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        return { n, k };
      };

      const d = drawSet(DIRECT, C.blue, 0.02, 0.3, 2.4, false);
      const b = drawSet(BC, C.orange, 0.32, 0.66, 1.6, false);
      const c = drawSet(CC, C.purple, 0.68, 0.9, 1.6, true);

      // 握笔的手：停在本阶段刚画完的那条线中点
      let hx = 60;
      let hy = 40;
      if (b.n === 0 && d.n > 0) {
        const seg = DIRECT[Math.min(d.n, DIRECT.length) - 1];
        const a = center(seg[0]);
        const bb = center(seg[1]);
        hx = lerp(a.x, bb.x, 0.5);
        hy = lerp(a.y, bb.y, 0.5) - 16;
      } else if (c.n === 0 && b.n > 0) {
        const seg = BC[Math.min(b.n, BC.length) - 1];
        const a = center(seg[0]);
        const bb = center(seg[1]);
        hx = lerp(a.x, bb.x, 0.5);
        hy = lerp(a.y, bb.y, 0.5) - 16;
      } else if (c.n > 0) {
        const seg = CC[Math.min(c.n, CC.length) - 1];
        const a = center(seg[0]);
        const bb = center(seg[1]);
        hx = lerp(a.x, bb.x, 0.5);
        hy = lerp(a.y, bb.y, 0.5) - 16;
      }
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(hx, hy, 8, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 图例：3 项
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      const items = [
        { color: C.blue, label: '直接引文' },
        { color: C.orange, label: '文献耦合' },
        { color: C.purple, label: '共引' },
      ];
      let cx = 316;
      for (const it of items) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx, 16);
        ctx.lineTo(cx + 12, 16);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, cx + 17, 20);
        cx += 17 + ctx.measureText(it.label).width + 12;
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label="一只手先用直接引文把索引卡连起来，再补上文献耦合与共引细线，散卡连成网"
    />
  );
};

export default Ana3;
