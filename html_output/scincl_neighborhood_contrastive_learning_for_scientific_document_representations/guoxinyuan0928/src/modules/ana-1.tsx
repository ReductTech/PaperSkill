import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 1：只会数「中不中」的记分牌。
// 三支说不清的箭各自困在一个二选一的判定里，记分牌逐个给它们盖章：
//   最像的那支没有箭头 → 判「不中」；无关的那支出于礼貌也有箭头 → 判「中」；
//   还有一支既被引又引用 → 「中」和「不中」同时成立。
const W = 560, H = 140;
const C = {
  bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52',
  text: '#21324a', muted: '#68778f', navy: '#27446e', orange: '#f07e47', purple: '#7c3aed', white: '#ffffff',
};
const Q = { x: 150, y: 74, r: 11 };
const NX = 400;                       // 三支箭的落点横坐标
const SB = { x: 14, y: 30, w: 106, h: 80 };   // 记分牌

type Row = { y: number; col: string; label: string; verdict: string; kind: 'none' | 'polite' | 'both' };
const ROWS: Row[] = [
  { y: 30, col: C.red, label: '最像·无箭头', verdict: '不中', kind: 'none' },
  { y: 74, col: C.orange, label: '礼貌·有箭头', verdict: '中', kind: 'polite' },
  { y: 110, col: C.purple, label: '双向·都算', verdict: '中＋不中', kind: 'both' },
];

export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };
    const headAt = (x: number, y: number, ux: number, uy: number, s: number, color: string, alpha: number) => {
      if (alpha <= 0.03) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * s - uy * s * 0.5, y - uy * s + ux * s * 0.5);
      ctx.lineTo(x - ux * s + uy * s * 0.5, y - uy * s - ux * s * 0.5);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    // 白底 ✗ 圆徽：把「判错了」直接钉在箭上
    const xBadge = (x: number, y: number, r: number, col: string, alpha: number) => {
      if (alpha <= 0.03) return;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = C.white; ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const a = r * 0.44;
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, r * 0.42); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - a, y - a); ctx.lineTo(x + a, y + a);
      ctx.moveTo(x + a, y - a); ctx.lineTo(x - a, y + a);
      ctx.stroke(); ctx.restore();
    };

    let raf = 0;
    let t0 = performance.now();
    const tick = (now: number) => {
      // 三个节拍轮流亮起一支箭，记分牌跟着盖章（3 拍 / 4.2s）
      const t = ((now - t0) / 4200) % 1;
      const beat = Math.min(2, Math.floor(t * 3));
      const local = (t * 3) % 1;
      const pulse = 0.5 + 0.5 * Math.sin(local * Math.PI * 2);
      const stampP = easeOutCubic(clamp((local - 0.1) / 0.22, 0, 1));

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, 129, W, H - 129);

      // ── 记分牌外壳 ──
      ctx.fillStyle = C.white; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      rr(SB.x, SB.y, SB.w, SB.h, 10); ctx.fill(); ctx.stroke();
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
      ctx.fillText('记分牌', SB.x + SB.w / 2, SB.y - 7);
      ctx.font = '10px sans-serif';
      ctx.fillText('中=正例  不中=负例', SB.x + SB.w / 2, SB.y + 66);

      // ── 三支说不清的箭 ──
      ROWS.forEach((row, i) => {
        const on = i === beat;
        const a = on ? 1 : 0.42;
        const dx = NX - Q.x, dy = row.y - Q.y, L = Math.hypot(dx, dy);
        const ux = dx / L, uy = dy / L;
        const ax = Q.x + ux * (Q.r + 5), ay = Q.y + uy * (Q.r + 5);
        const bx = NX - ux * 13, by = row.y - uy * 13;

        ctx.save();
        ctx.globalAlpha = a; ctx.lineCap = 'round';
        ctx.strokeStyle = row.kind === 'none' ? C.border : row.col;
        ctx.lineWidth = row.kind === 'none' ? 2.2 : 3;
        if (row.kind === 'none') ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        if (row.kind === 'polite') {
          // 有箭头，但箭头来自「礼貌」而不是内容
          headAt(bx, by, ux, uy, 11, row.col, a);
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          ctx.save(); ctx.globalAlpha = a;
          ctx.fillStyle = row.col; ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.fill();
          ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
          ctx.fillText('礼', mx, my + 4.4);
          ctx.restore();
        } else if (row.kind === 'both') {
          // 两头都有箭头：正负同时成立
          headAt(bx, by, ux, uy, 11, row.col, a);
          headAt(ax, ay, -ux, -uy, 11, row.col, a);
        } else {
          // 虚线 + ✗：最像的一对，偏偏没有那根箭头
          xBadge((ax + bx) / 2, (ay + by) / 2, 9, row.col, 0.95 * a);
        }

        if (on) {
          ctx.save();
          ctx.globalAlpha = 0.42 * (1 - pulse * 0.7);
          ctx.strokeStyle = row.col; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(NX, row.y, 11 + 8 * pulse, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = row.col; ctx.beginPath(); ctx.arc(NX, row.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        xBadge(NX + 15, row.y - 15, 8.5, row.col, a);

        ctx.save();
        ctx.globalAlpha = on ? 1 : 0.6;
        ctx.font = '12.5px sans-serif'; ctx.textAlign = 'left';
        ctx.fillStyle = on ? row.col : C.muted;
        ctx.fillText(row.label, NX + 31, row.y + 4.5);
        ctx.restore();
      });

      // ── 查询论文 ──
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r, 0, Math.PI * 2); ctx.fill();
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
      ctx.fillText('查询论文', Q.x, Q.y + 27);

      // ── 记分牌的判定 + 盖章 ──
      const act = ROWS[beat];
      const vA = clamp(local / 0.16, 0, 1);
      ctx.save();
      ctx.globalAlpha = vA;
      ctx.font = (act.verdict.length > 2 ? '17px' : '21px') + ' sans-serif';
      ctx.textAlign = 'center'; ctx.fillStyle = C.text;
      ctx.fillText(act.verdict, SB.x + 46, SB.y + 46);
      ctx.globalAlpha = vA * 0.92;
      ctx.translate(SB.x + SB.w - 6, SB.y + 10);
      ctx.rotate(-0.24);
      const sc = 1 + (1 - stampP) * 0.55;
      ctx.scale(sc, sc);
      ctx.strokeStyle = C.red; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, -9); ctx.lineTo(9, 9);
      ctx.moveTo(9, -9); ctx.lineTo(-9, 9);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(
      canvas,
      () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } },
      () => { cancelAnimationFrame(raf); raf = 0; },
    );
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana1;
