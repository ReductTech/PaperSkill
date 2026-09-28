import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 左面板：旧方法（SPECTER）——「箭头 = 引用关系」，正负样本由箭头方向决定。
// 用有向箭头把引用关系画出来，循环暴露三种失效：
//   ① 同一对论文反向即翻面（A→B 有箭头 ⇒ B 是正例；B→A 没箭头 ⇒ A 是负例）
//   ② 礼貌引用也是「引用」⇒ 噪声被当成证据收进正例
//   ③ 语义高度相似却互不引用 ⇒ 那根箭头不存在，于是被判成负例
const W = 480, H = 240;
const R = 17;
const C = {
  bg: '#f5f8f0', field: '#b8c9a7', green: '#228d5c', red: '#c43f52',
  muted: '#68778f', text: '#21324a', navy: '#27446e', orange: '#f07e47', halo: '#ffffff',
};

type P = { x: number; y: number; label: string };

const A: P = { x: 84, y: 124, label: 'A' }; // 查询论文
const B: P = { x: 214, y: 70, label: 'B' }; // A 引用了 B ⇒ B 是正例
const E: P = { x: 214, y: 186, label: 'E' }; // A「礼貌引用」的无关论文
const D: P = { x: 338, y: 124, label: 'D' }; // 与 A 高度相似，但互不引用

export const HeroOld: React.FC<WidgetProps> = () => {
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

    // 有向箭头：起止都从节点边界起算，箭头是实心三角
    const arrow = (from: P, to: P, color: string, alpha: number, dashed: boolean, lw = 2.4) => {
      if (alpha <= 0.02) return;
      const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
      if (dashed) ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(from.x + ux * (R + 3), from.y + uy * (R + 3));
      ctx.lineTo(to.x - ux * (R + 10), to.y - uy * (R + 10));
      ctx.stroke();
      ctx.setLineDash([]);
      const tx = to.x - ux * (R + 2), ty = to.y - uy * (R + 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - ux * 11 - uy * 5.5, ty - uy * 11 + ux * 5.5);
      ctx.lineTo(tx - ux * 11 + uy * 5.5, ty - uy * 11 - ux * 5.5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    // 无箭头的虚线：用来说明「像，但没有任何引用箭头」
    const dotLine = (from: P, to: P, color: string, alpha: number) => {
      if (alpha <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.8;
      ctx.setLineDash([2, 7]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    const node = (n: P, color: string, filled: boolean, alpha: number, pulse = 0) => {
      if (alpha <= 0.02) return;
      ctx.save();
      if (pulse > 0) {
        ctx.globalAlpha = alpha * pulse * 0.35;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(n.x, n.y, R + 4 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
      if (filled) { ctx.fillStyle = color; ctx.fill(); } else {
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = filled ? '#fff' : C.text;
      ctx.fillText(n.label, n.x, n.y + 0.5);
      ctx.restore();
    };

    const tag = (x: number, y: number, txt: string, color: string, alpha: number, size = 12) => {
      if (alpha <= 0.03) return;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${size}px sans-serif`;
      const w = ctx.measureText(txt).width;
      ctx.globalAlpha = alpha * 0.92; ctx.fillStyle = C.halo;
      rr(x - w / 2 - 6, y - size / 2 - 4, w + 12, size + 8, 6); ctx.fill();
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.fillText(txt, x, y + 0.5);
      ctx.restore();
    };

    const cross = (x: number, y: number, s: number, color: string, alpha: number) => {
      if (alpha <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
      ctx.restore();
    };

    const status = (txt: string, color: string) => {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 13px sans-serif'; ctx.fillStyle = color;
      ctx.fillText(txt, W / 2, H - 15);
      ctx.restore();
    };

    const LOOP = 7200;
    let raf = 0; let t0 = performance.now();

    const tick = (now: number) => {
      const t = ((now - t0) / LOOP) % 1;
      const c = Math.floor(t * 3);
      const l = (t * 3) % 1;
      const pulse = 0.5 + 0.5 * Math.sin(l * Math.PI * 6);

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.93, W, H * 0.07);

      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 13px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('单向引用 → 正负样本（箭头决定）', W / 2, 20);
      ctx.restore();

      // ---- 案例 0：同一对论文，反向翻面 ----
      if (c === 0) {
        const sub = l < 0.5 ? 0 : 1;
        const ls = sub === 0 ? l / 0.5 : (l - 0.5) / 0.5;
        arrow(A, B, C.navy, 1, false);
        node(A, C.navy, true, 1);
        node(D, C.muted, false, 0.3);
        node(E, C.muted, false, 0.3);
        if (sub === 0) {
          node(B, C.green, true, 1);
          tag(B.x, B.y - R - 16, '正例', C.green, 1);
          status('① 只看单向：A → B 命中，B 判为正例', C.green);
        } else {
          const p = easeInOutQuad(ls);
          node(B, C.red, false, 1);
          // 反向那根箭头「不存在」⇒ A 对 B 而言成了负例
          arrow(B, A, C.red, 0.3 + 0.28 * p, true);
          cross((A.x + B.x) / 2 + 6, (A.y + B.y) / 2, 8, C.red, 0.35 + 0.65 * p);
          tag(A.x, A.y - R - 16, '负例', C.red, 0.35 + 0.65 * p);
          tag((A.x + B.x) / 2 + 52, (A.y + B.y) / 2 + 28, '该箭头不存在', C.red, p, 11);
          status('① 反过来看 B：没有 B → A，同一篇 A 又成负例', C.red);
        }
      }

      // ---- 案例 1：礼貌引用带进噪声 ----
      else if (c === 1) {
        arrow(A, B, C.navy, 0.26, false);
        node(A, C.navy, true, 1);
        node(B, C.green, false, 0.35);
        node(D, C.muted, false, 0.3);
        arrow(A, E, C.orange, 0.7 + 0.3 * pulse, true);
        const jx = Math.sin(l * Math.PI * 8) * 1.8;
        node({ x: E.x + jx, y: E.y, label: E.label }, C.orange, false, 1, pulse * 0.5);
        tag(E.x + 78, E.y, '内容并不相关', C.red, 1, 11);
        tag((A.x + E.x) / 2 + 30, (A.y + E.y) / 2 - 6, '礼貌引用', C.orange, 1, 11);
        status('② 礼貌引用也当「引用」⇒ 噪声混进正例', C.orange);
      }

      // ---- 案例 2：相似却零引用 ----
      else {
        arrow(A, B, C.navy, 0.26, false);
        arrow(A, E, C.orange, 0.18, true);
        node(A, C.navy, true, 1);
        node(B, C.green, false, 0.35);
        node(E, C.orange, false, 0.25);
        dotLine(A, D, C.green, 0.7);
        cross((A.x + D.x) / 2, A.y, 7, C.red, 0.6 + 0.4 * pulse);
        tag((A.x + D.x) / 2, A.y + 16, '语义最相似', C.green, 1, 11);
        tag((A.x + D.x) / 2, A.y + 32, '却没有那根箭头', C.red, 1, 11);
        node(D, C.red, false, 1, pulse);
        status('③ 相似却零引用 ⇒ 被判为负例', C.red);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default HeroOld;
