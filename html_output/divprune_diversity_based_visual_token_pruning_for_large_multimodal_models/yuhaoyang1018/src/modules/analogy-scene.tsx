import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useInView, useReducedMotion } from '../lib/hooks';
import { C, FONT_MONO, FONT_SANS } from '../lib/palette';
import { rng } from '../lib/maxmin';

// 类比画布：统一的“实验台”世界——每章一件不同的器物，没有重复的角色。
// 1 沙漏 · 2 手电与图钉 · 3 计数轮 · 4 罗盘 · 5 最大空白处落针 · 6 蓝图叠图
// 7 油量与层带 · 8 三把尺子 · 9 台秤与秒表 · 10 翻牌计分板
// 自动播放、离屏暂停；减少动态效果时只画一帧静态画面。

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

function txt(ctx: Ctx, s: string, x: number, y: number, color: string = C.ink2, size = 12, align: CanvasTextAlign = 'left', mono = false) {
  ctx.fillStyle = color;
  ctx.font = `${mono ? 600 : 700} ${size}px ${mono ? FONT_MONO : FONT_SANS}`;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

function halo(ctx: Ctx, x: number, y: number, r: number, color: string, a = 0.35) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('A', String(a)));
  g.addColorStop(1, color.replace('A', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
const VERM_A = 'rgba(255,106,77,A)';
const COB_A = 'rgba(59, 91, 255, A)';
const MUS_A = 'rgba(214, 148, 18, A)';

function pin(ctx: Ctx, x: number, y: number, color: string, s = 1) {
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 9 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 11 * s, 3.4 * s, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------------------------------------------------------------- 1 沙漏
function hourglass(ctx: Ctx, cx: number, top: number, hw: number, hh: number, grains: number, t: number, period: number, color: string, label: string) {
  const k = clamp01((t % (period + 1.4)) / period);
  const neck = top + hh;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - hw, top);
  ctx.lineTo(cx + hw, top);
  ctx.lineTo(cx + 3, neck);
  ctx.lineTo(cx + hw, neck + hh);
  ctx.lineTo(cx - hw, neck + hh);
  ctx.lineTo(cx - 3, neck);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = color;
  // 上半：剩余的沙
  const remain = 1 - k;
  const ty = neck - hh * remain * 0.8;
  const tw = (hw * (neck - ty)) / hh;
  ctx.beginPath();
  ctx.moveTo(cx - tw, ty);
  ctx.lineTo(cx + tw, ty);
  ctx.lineTo(cx + 2, neck - 2);
  ctx.lineTo(cx - 2, neck - 2);
  ctx.closePath();
  ctx.globalAlpha = 0.8;
  ctx.fill();
  // 下半：堆积
  const by = neck + hh - hh * k * 0.75;
  ctx.beginPath();
  ctx.moveTo(cx - hw + 2, neck + hh - 1);
  ctx.lineTo(cx + hw - 2, neck + hh - 1);
  ctx.lineTo(cx, by);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // 正在下落的沙粒
  if (k > 0 && k < 1) {
    for (let i = 0; i < 6; i++) {
      const y = neck + ((t * 60 + i * 9) % (hh * 0.9));
      ctx.fillRect(cx - 0.8, y, 1.6, 2.4);
    }
  }
  txt(ctx, label, cx, neck + hh + 18, C.ink, 13, 'center', true);
  txt(ctx, `${Math.round(grains * k)} / ${grains}`, cx, top - 8, color === C.verm ? C.vermD : C.ink2, 11, 'center', true);
}

// ---------------------------------------------------------------- 场景表
function drawScene(id: string, ctx: Ctx, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const s = t / 1000;
  const cx = w / 2;
  switch (id) {
    case 'chap-1': {
      const hh = Math.min(48, h * 0.3);
      const hw = Math.min(46, w * 0.12);
      hourglass(ctx, w * 0.3, 26, hw, hh, 576, s, 6, C.cobalt, '576 个');
      hourglass(ctx, w * 0.72, 26, hw * 0.75, hh, 56, s, 0.9, C.verm, '56 个');
      txt(ctx, '同一个沙漏，少放沙', cx, h - 6, C.muted, 11, 'center');
      break;
    }
    case 'chap-2': {
      // 暗色地图 + 固定的手电光圈；图钉只落在光圈里
      const night = ctx.createLinearGradient(0, 0, w, h);
      night.addColorStop(0, 'rgba(20, 28, 52, 0.55)');
      night.addColorStop(1, 'rgba(20, 28, 52, 0.35)');
      ctx.fillStyle = night;
      ctx.fillRect(8, 8, w - 16, h - 16);
      const lx = w * 0.3;
      const ly = h * 0.55;
      const lr = Math.min(52, h * 0.32);
      const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, lr);
      g.addColorStop(0, 'rgba(255,236,170,0.95)');
      g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, TAU);
      ctx.fill();
      // 手电
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.08, 14);
      ctx.lineTo(lx - lr * 0.7, ly - lr * 0.7);
      ctx.moveTo(w * 0.08, 14);
      ctx.lineTo(lx + lr * 0.7, ly - lr * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink;
      ctx.fillRect(w * 0.08 - 10, 8, 20, 9);
      const r = rng(4);
      const n = Math.floor((s * 2.2) % 18);
      for (let i = 0; i < n; i++) {
        const a = r() * TAU;
        const rr = Math.sqrt(r()) * lr * 0.7;
        pin(ctx, lx + Math.cos(a) * rr, ly + Math.sin(a) * rr * 0.8 + 6, C.mustard, 0.9);
      }
      // 暗处：空白的区域
      ctx.strokeStyle = 'rgba(59, 91, 255, 0.5)';
      ctx.setLineDash([4, 4]);
      [
        [0.66, 0.36],
        [0.86, 0.66],
        [0.55, 0.78],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(w * x, h * y, 16, 0, TAU);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      txt(ctx, '暗处：0 颗', w * 0.72, 20, C.cobaltD, 12);
      break;
    }
    case 'chap-3': {
      // 计数轮：越往左转得越慢，永远转不完
      const digits = Math.min(12, Math.floor((w - 60) / 30));
      const dw = Math.min(30, (w - 60) / digits);
      const x0 = cx - (digits * dw) / 2;
      const y0 = h * 0.28;
      const dh = Math.min(54, h * 0.42);
      for (let i = 0; i < digits; i++) {
        const speed = Math.pow(3.1, i - digits + 4);
        const v = s * speed * 2;
        const cur = Math.floor(v) % 10;
        const frac = v - Math.floor(v);
        const x = x0 + i * dw;
        ctx.fillStyle = i === digits - 1 ? 'rgba(255, 106, 77, 0.1)' : '#ffffff';
        ctx.fillRect(x + 1, y0, dw - 3, dh);
        ctx.strokeStyle = C.rule;
        ctx.strokeRect(x + 1.5, y0 + 0.5, dw - 4, dh - 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 1, y0, dw - 3, dh);
        ctx.clip();
        const off = speed > 8 ? 0 : frac * dh;
        txt(ctx, String(cur), x + dw / 2 - 1, y0 + dh * 0.68 - off, C.ink, Math.round(dh * 0.55), 'center', true);
        txt(ctx, String((cur + 1) % 10), x + dw / 2 - 1, y0 + dh * 1.68 - off, C.ink, Math.round(dh * 0.55), 'center', true);
        if (speed > 8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fillRect(x + 1, y0, dw - 3, dh);
        }
        ctx.restore();
      }
      txt(ctx, '只画出最低几位', x0, y0 + dh + 22, C.muted, 11);
      txt(ctx, '要数到 ≈ 10^78', x0 + digits * dw, y0 + dh + 22, C.vermD, 12, 'right', true);
      break;
    }
    case 'chap-4': {
      // 罗盘：前半段只改指针长度（读数不变），后半段改角度
      const r = Math.min(h * 0.38, 92);
      const ox = w * 0.34;
      const oy = h * 0.52;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ox, oy, r + 8, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        ctx.beginPath();
        ctx.moveTo(ox + Math.cos(a) * (r + 3), oy + Math.sin(a) * (r + 3));
        ctx.lineTo(ox + Math.cos(a) * (r + 8), oy + Math.sin(a) * (r + 8));
        ctx.stroke();
      }
      const P = 8;
      const u = (s % P) / P;
      const lenPhase = u < 0.5;
      const len = lenPhase ? 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(u * TAU * 2)) : 0.85;
      const th = lenPhase ? 1.0 : 0.35 + 1.9 * ease(clamp01((u - 0.5) / 0.45));
      const needle = (a: number, L: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(-a) * L, oy + Math.sin(-a) * L);
        ctx.stroke();
        ctx.lineCap = 'butt';
      };
      needle(0, r * 0.85, C.ink);
      needle(th, r * len, C.cobalt);
      ctx.strokeStyle = C.verm;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, 22, -th, 0);
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, TAU);
      ctx.fill();
      const tx = Math.min(w - 10, ox + r + 30);
      txt(ctx, lenPhase ? '只改长度' : '改变夹角', tx, oy - 18, C.muted, 11);
      txt(ctx, `1 − cos θ = ${(1 - Math.cos(th)).toFixed(2)}`, tx, oy + 4, C.vermD, 13, 'left', true);
      break;
    }
    case 'chap-5': {
      // 最大空白处落针：先画出最大空圆，再在圆心落针
      const pts: [number, number][] = [
        [0.1, 0.75],
        [0.9, 0.2],
        [0.5, 0.5],
        [0.15, 0.2],
        [0.85, 0.82],
        [0.5, 0.12],
        [0.48, 0.88],
        [0.3, 0.48],
      ];
      const cyc = 1.6;
      const n = Math.floor(s / cyc) % (pts.length + 2);
      const k = (s % cyc) / cyc;
      ctx.strokeStyle = C.rule;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      const X = (x: number) => 14 + x * (w - 28);
      const Y = (y: number) => 14 + y * (h - 28);
      const done = Math.min(n, pts.length);
      for (let i = 0; i < done; i++) pin(ctx, X(pts[i][0]), Y(pts[i][1]) + 6, C.verm, 0.95);
      if (n < pts.length && n > 0) {
        // 下一针：到已有针最近距离 = 空白圆半径
        const [px, py] = pts[n];
        let rmin = Infinity;
        for (let i = 0; i < n; i++) rmin = Math.min(rmin, Math.hypot(X(px) - X(pts[i][0]), Y(py) - Y(pts[i][1])));
        const e = ease(clamp01(k / 0.7));
        halo(ctx, X(px), Y(py), rmin * e, COB_A, 0.18);
        ctx.strokeStyle = C.cobalt;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(X(px), Y(py), rmin * e, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        if (k > 0.7) pin(ctx, X(px), Y(py) + 6 - (1 - clamp01((k - 0.7) / 0.2)) * 14, C.verm, 0.95);
      }
      txt(ctx, `${done} / ${pts.length}`, w - 16, h - 14, C.vermD, 12, 'right', true);
      break;
    }
    case 'chap-6': {
      // 蓝图叠在成品上，扫描线经过时打标记
      const x0 = 12;
      const x1 = w - 12;
      ctx.fillStyle = 'rgba(59, 91, 255, 0.07)';
      ctx.fillRect(x0, 12, x1 - x0, h - 24);
      ctx.strokeStyle = 'rgba(59, 91, 255, 0.22)';
      for (let x = x0; x < x1; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.lineTo(x, h - 12);
        ctx.stroke();
      }
      for (let y = 12; y < h - 12; y += 18) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      const items: { x: number; y: number; m: 'ok' | 'diff' | 'q' }[] = [
        { x: 0.14, y: 0.35, m: 'ok' },
        { x: 0.3, y: 0.68, m: 'ok' },
        { x: 0.46, y: 0.32, m: 'diff' },
        { x: 0.6, y: 0.66, m: 'ok' },
        { x: 0.75, y: 0.36, m: 'diff' },
        { x: 0.88, y: 0.68, m: 'q' },
      ];
      const scan = x0 + ((s * 0.22) % 1.15) * (x1 - x0);
      items.forEach((it) => {
        const x = x0 + it.x * (x1 - x0);
        const y = 12 + it.y * (h - 24);
        ctx.strokeStyle = C.cobalt;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 13, y - 11, 26, 22);
        ctx.setLineDash([]);
        ctx.fillStyle = C.ink;
        ctx.fillRect(x - 9 + (it.m === 'diff' ? 4 : 0), y - 7, 18, 14);
        if (scan > x + 14) {
          const col = it.m === 'ok' ? C.green : it.m === 'diff' ? C.amber : C.cobalt;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + 14, y - 12, 8, 0, TAU);
          ctx.stroke();
          ctx.lineWidth = 1;
          txt(ctx, it.m === 'ok' ? '✓' : it.m === 'diff' ? '≠' : '?', x + 14, y - 8, col, 11, 'center');
        }
      });
      ctx.fillStyle = 'rgba(255, 106, 77, 0.6)';
      ctx.fillRect(Math.min(scan, x1), 12, 2, h - 24);
      break;
    }
    case 'chap-7': {
      // 油量固定：K 越大，前面烧掉的越多，后面能带的越少
      const K = Math.floor(s / 2.4) % 4;
      const kept = [56, 39, 21, 2][K];
      const L = 32;
      const x0 = 14;
      const bw = (w - 28) / L;
      const base = h - 28;
      const full = Math.min(h * 0.5, h - 96);
      for (let l = 0; l < L; l++) {
        const hh = l < K ? full : Math.max(2, full * (kept / 576) * 3.2);
        ctx.fillStyle = l < K ? 'rgba(59, 91, 255, 0.6)' : 'rgba(255, 106, 77, 0.85)';
        ctx.fillRect(x0 + l * bw + 0.5, base - hh, bw - 1.5, hh);
      }
      ctx.strokeStyle = C.ink2;
      ctx.beginPath();
      ctx.moveTo(x0, base + 0.5);
      ctx.lineTo(w - 14, base + 0.5);
      ctx.stroke();
      // 油量表
      const gx = w - 70;
      const gy = 30;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(gx, gy + 10, 22, Math.PI, TAU);
      ctx.stroke();
      ctx.strokeStyle = C.verm;
      ctx.beginPath();
      ctx.arc(gx, gy + 10, 22, Math.PI, Math.PI + Math.PI * 0.2);
      ctx.stroke();
      ctx.lineWidth = 1;
      txt(ctx, '预算 19.6%', gx, gy + 26, C.muted, 10, 'center', true);
      txt(ctx, K === 0 ? '第 0 层剪' : `第 ${K} 层后剪`, x0, 20, C.ink, 13);
      txt(ctx, `之后只能留 ${kept} 个`, x0, 40, C.vermD, 13, 'left', true);
      txt(ctx, '层 1 → 32', x0, h - 10, C.muted, 10);
      break;
    }
    case 'chap-8': {
      // 三把尺子量四个点：读数不同，指出的“最远一对”相同
      const P: [number, number][] = [
        [0.12, 0.62],
        [0.36, 0.3],
        [0.58, 0.7],
        [0.88, 0.34],
      ];
      const X = (x: number) => 16 + x * (w - 32);
      const Y = (y: number) => 10 + y * (h - 30);
      const mode = Math.floor(s / 2.2) % 3;
      const a = P[0];
      const b = P[3];
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.cobalt;
      if (mode === 0) {
        ctx.beginPath();
        ctx.moveTo(X(a[0]), Y(a[1]));
        ctx.lineTo(X(b[0]), Y(b[1]));
        ctx.stroke();
        for (let i = 1; i < 12; i++) {
          const u = i / 12;
          const x = X(a[0] + (b[0] - a[0]) * u);
          const y = Y(a[1] + (b[1] - a[1]) * u);
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, TAU);
          ctx.fillStyle = C.cobalt;
          ctx.fill();
        }
      } else if (mode === 1) {
        ctx.beginPath();
        ctx.moveTo(X(a[0]), Y(a[1]));
        ctx.lineTo(X(b[0]), Y(a[1]));
        ctx.lineTo(X(b[0]), Y(b[1]));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(X(a[0]), Y(a[1]));
        ctx.quadraticCurveTo(X(0.5), Y(-0.1), X(b[0]), Y(b[1]));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      P.forEach((p, i) => {
        const far = i === 0 || i === 3;
        if (far) halo(ctx, X(p[0]), Y(p[1]), 16, VERM_A, 0.35);
        ctx.beginPath();
        ctx.arc(X(p[0]), Y(p[1]), 5, 0, TAU);
        ctx.fillStyle = far ? C.verm : C.ink2;
        ctx.fill();
      });
      txt(ctx, ['直尺 · ℓ2', '折尺 · ℓ1', '量角 · 余弦'][mode], 16, h - 6, C.cobaltD, 12);
      txt(ctx, '最远一对：始终是红色两点', w - 16, h - 6, C.vermD, 11, 'right');
      break;
    }
    case 'chap-9': {
      // 台秤读数降到 14%，秒表只少约 22%
      const u = clamp01((s % 6) / 3.2);
      const e = ease(u);
      const r = Math.min(h * 0.32, 52);
      const sx = w * 0.28;
      const tx = w * 0.72;
      const cy = h * 0.5;
      const dial = (x: number, frac: number, color: string, title: string, val: string) => {
        ctx.strokeStyle = C.rule;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, cy, r, Math.PI * 0.75, Math.PI * 2.25);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, cy, r, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * frac);
        ctx.stroke();
        ctx.lineWidth = 1;
        const a = Math.PI * 0.75 + Math.PI * 1.5 * frac;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
        ctx.stroke();
        ctx.lineWidth = 1;
        txt(ctx, val, x, cy + r * 0.62, color === C.verm ? C.vermD : C.cobaltD, 15, 'center', true);
        txt(ctx, title, x, h - 6, C.muted, 11, 'center');
      };
      const tfl = 1 - 0.859 * e;
      const e2e = 1 - 0.224 * e;
      dial(sx, tfl, C.verm, '台秤 · 理论 TFLOPs', `${Math.round(tfl * 100)}%`);
      dial(tx, e2e, C.cobalt, '秒表 · 端到端时间', `${Math.round(e2e * 100)}%`);
      break;
    }
    default: {
      // chap-10：翻牌计分板
      const P = 5;
      const u = (s % P) / P;
      const flip = clamp01((u - 0.15) / 0.2);
      const board = (x: number, title: string, from: string, to: string, color: string) => {
        const bw = Math.min(120, w * 0.34);
        const bh = Math.min(70, h * 0.48);
        const y = h * 0.2;
        ctx.fillStyle = C.ink;
        ctx.fillRect(x - bw / 2, y, bw, bh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(x - bw / 2, y + bh / 2);
        ctx.lineTo(x + bw / 2, y + bh / 2);
        ctx.stroke();
        const v = flip < 0.5 ? from : to;
        const sc = Math.abs(Math.cos(flip * Math.PI));
        ctx.save();
        ctx.translate(x, y + bh / 2);
        ctx.scale(1, Math.max(0.05, sc));
        txt(ctx, v, 0, bh * 0.2, color, Math.round(bh * 0.5), 'center', true);
        ctx.restore();
        txt(ctx, title, x, y + bh + 18, C.ink2, 12, 'center');
      };
      board(w * 0.3, 'FastV', '—', '0.06', '#f3d27a');
      board(w * 0.7, 'DivPrune', '—', '0.96', '#ff8a70');
      txt(ctx, 'COCO CIDEr · Table 1', w / 2, 14, C.muted, 11, 'center');
      if (u > 0.55) txt(ctx, '同样的规则吗？', w / 2, h - 6, C.amber, 12, 'center');
      break;
    }
  }
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => (W < 500 ? 170 : Math.min(250, W * 0.55)));
  const [viewRef, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  // 静态帧（减少动态效果时）挑一个信息完整的时刻
  const STATIC_T: Record<string, number> = { 'chap-5': 12500, 'chap-10': 3000 };
  const tRef = useRef(STATIC_T[chapterId] ?? 5200);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    if (reduced || !inView) {
      drawScene(chapterId, ctx, w, h, reduced ? STATIC_T[chapterId] ?? 5200 : tRef.current);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tRef.current += Math.min(64, now - last);
      last = now;
      drawScene(chapterId, ctx, w, h, tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [chapterId, w, h, reduced, inView, canvasRef]);

  return (
    <div ref={viewRef} className="ana-canvas">
      <div ref={wrapRef}>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
    </div>
  );
};

export default AnalogyScene;
