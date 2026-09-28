import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 右面板：本文方法（SciNCL）。
// 左半：引文图——「引用的」与「被引的」都连到查询论文，边不带箭头（对称化）。
// 中段：GNN 训练出引文嵌入。
// 右半：引文嵌入空间里的邻域环带采样——绿带取正样本、红带取难负样本，
//       两带之间的空隙就是「采样诱导边际 Δ」。
const W = 480, H = 240;
const C = {
  bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52',
  muted: '#68778f', text: '#21324a', navy: '#27446e', orange: '#f07e47', halo: '#ffffff',
};

type P = { x: number; y: number };

const Q = { x: 96, y: 130, r: 13 };
const NB: { p: P; r: number; cites: boolean }[] = [
  { p: { x: 50, y: 82 }, r: 12, cites: true },   // 查询论文「引用的」文献
  { p: { x: 150, y: 88 }, r: 12, cites: false }, // 「被引的」文献
  { p: { x: 46, y: 188 }, r: 12, cites: false },
  { p: { x: 154, y: 182 }, r: 12, cites: true },
];
const EX = 344, EY = 132; // 引文嵌入空间中心

export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const cap = (x: number, y: number, txt: string, color: string, size = 12, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${size}px sans-serif`; ctx.fillStyle = color;
      ctx.fillText(txt, x, y);
      ctx.restore();
    };

    const tag = (x: number, y: number, txt: string, color: string, alpha: number, size = 11) => {
      if (alpha <= 0.03) return;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${size}px sans-serif`;
      const w = ctx.measureText(txt).width;
      ctx.globalAlpha = alpha * 0.92; ctx.fillStyle = C.halo;
      rr(x - w / 2 - 5, y - size / 2 - 4, w + 10, size + 8, 5); ctx.fill();
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.fillText(txt, x, y + 0.5);
      ctx.restore();
    };

    const head = (x: number, y: number, ux: number, uy: number, s: number, color: string, alpha: number) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * s - uy * s * 0.5, y - uy * s + ux * s * 0.5);
      ctx.lineTo(x - ux * s + uy * s * 0.5, y - uy * s - ux * s * 0.5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    const LOOP = 6400;
    let raf = 0; let t0 = performance.now();

    const tick = (now: number) => {
      const t = ((now - t0) / LOOP) % 1;
      const p = easeInOutQuad(Math.max(0, Math.min(1, (t - 0.1) / 0.5)));

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.93, W, H * 0.07);

      cap(96, 34, '① 引文图：引 / 被引 皆邻居', C.muted);

      // ---------- 左：对称化的引文图（边无箭头） ----------
      const ea = 0.22 + 0.62 * p;
      NB.forEach((nb, i) => {
        const color = nb.cites ? C.green : C.navy;
        const dx = Q.x - nb.p.x, dy = Q.y - nb.p.y, L = Math.hypot(dx, dy);
        ctx.save();
        ctx.globalAlpha = ea; ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(nb.p.x + (dx / L) * nb.r, nb.p.y + (dy / L) * nb.r);
        ctx.lineTo(Q.x - (dx / L) * Q.r, Q.y - (dy / L) * Q.r);
        ctx.stroke();
        ctx.restore();
        // 邻域里的邻居一起亮起来
        const on = p > 0.1 + i * 0.08 ? 1 : 0.35;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.65 * on;
        ctx.beginPath(); ctx.arc(nb.p.x, nb.p.y, nb.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.restore();
        // 沿边流向查询论文的信号点
        const s = (t * 1.7 + i * 0.25) % 1;
        ctx.save();
        ctx.globalAlpha = 0.85 * (1 - Math.abs(s - 0.5) * 1.2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nb.p.x + (Q.x - nb.p.x) * s, nb.p.y + (Q.y - nb.p.y) * s, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      tag(122, 150, '引', C.green, 0.4 + 0.6 * p, 10);
      tag(120, 92, '被引', C.navy, 0.4 + 0.6 * p, 10);

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r, 0, Math.PI * 2);
      ctx.fillStyle = C.navy; ctx.fill();
      ctx.restore();
      cap(Q.x, Q.y + 0.5, 'q', '#fff', 12);

      cap(96, 224, '引 / 被引 都算邻居（对称化）', C.muted, 11.5);

      // ---------- 中：训练引文嵌入 ----------
      const fa = 0.3 + 0.7 * p;
      const fx1 = 182, fx2 = 226, fy = 130;
      ctx.save();
      ctx.globalAlpha = fa; ctx.strokeStyle = C.navy; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx1, fy); ctx.lineTo(fx2 - 10, fy); ctx.stroke();
      ctx.restore();
      head(fx2 - 2, fy, 1, 0, 11, C.navy, fa);
      tag(203, 108, 'GNN', C.navy, fa);

      // ---------- 右：引文嵌入 + 环带采样 + 边际 ----------
      cap(EX, 34, '② 引文嵌入：邻域环带 + 边际', C.muted);

      const band = (rIn: number, rOut: number, color: string, alpha: number) => {
        ctx.save();
        ctx.globalAlpha = alpha; ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(EX, EY, rOut, rOut * 0.62, 0, 0, Math.PI * 2);
        ctx.ellipse(EX, EY, rIn, rIn * 0.62, 0, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
      };
      band(44, 62, C.green, 0.3 * p);
      band(78, 88, C.red, 0.3 * p);

      // 环带边界
      ctx.save();
      ctx.globalAlpha = 0.45 * p; ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 5]);
      [62, 78].forEach((r) => {
        ctx.beginPath(); ctx.ellipse(EX, EY, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();

      // 采样诱导边际 Δ（正样本带外沿 ↔ 难负样本带内沿 之间的空隙）
      const ma = Math.max(0, Math.min(1, (p - 0.72) / 0.28));
      if (ma > 0.02) {
        ctx.save();
        ctx.globalAlpha = 0.75 * ma; ctx.strokeStyle = C.orange; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(EX + 63, EY); ctx.lineTo(EX + 77, EY); ctx.stroke();
        // 指示线：指向两带之间的空隙
        ctx.beginPath(); ctx.moveTo(EX, EY - 60); ctx.lineTo(EX, EY - 44); ctx.stroke();
        ctx.restore();
        head(EX + 63, EY, -1, 0, 6, C.orange, 0.8 * ma);
        head(EX + 77, EY, 1, 0, 6, C.orange, 0.8 * ma);
        head(EX, EY - 44, 0, 1, 7, C.orange, 0.8 * ma);
        tag(EX, EY - 72, '采样诱导边际 Δ', C.orange, ma, 11);
      }

      // 正样本（绿带内）
      const pos: [number, number][] = [[50, 0.45], [56, 1.55], [50, 2.65], [56, 3.85], [50, 5.15]];
      pos.forEach(([r, a], i) => {
        const th = 0.12 + i * 0.075;
        const al = Math.max(0, Math.min(1, (p - th) / 0.18));
        if (al <= 0.02) return;
        ctx.save();
        ctx.globalAlpha = al;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(EX + r * Math.cos(a), EY + r * 0.62 * Math.sin(a), 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 难负样本（红带内）
      const hard: [number, number][] = [[86, 1.0], [90, 2.3], [84, 4.6]];
      hard.forEach(([r, a], i) => {
        const th = 0.5 + i * 0.08;
        const al = Math.max(0, Math.min(1, (p - th) / 0.18));
        if (al <= 0.02) return;
        ctx.save();
        ctx.globalAlpha = al;
        ctx.strokeStyle = C.red; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(EX + r * Math.cos(a), EY + r * 0.62 * Math.sin(a), 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 查询论文（中心）
      ctx.save();
      ctx.beginPath(); ctx.arc(EX, EY, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.navy; ctx.fill();
      ctx.restore();
      tag(EX, EY + 20, '查询论文', C.navy, 0.5 + 0.5 * p, 11);

      cap(EX, 224, '绿带取正样本 · 红带取难负样本', C.muted, 11.5);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default HeroNew;
