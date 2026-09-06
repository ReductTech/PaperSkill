import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* §9 结构总览动画（播放式）。
   约 40 秒的 canvas 自动播放，把整条管线串成 5 幕:
   整网主干 → C2PSA 内幕(O(N²) 问题) → 换成 MambaPSA → 颈部 BiViM → 两个集成点总览。
   自带 播放/暂停/重播 与场景点跳转，观感与 §1 速览动画一致，完全由 TS 代码驱动。 */

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const F = '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

const W = 800;
const H = 420;
const TOTAL_MS = 40000;

const SCENES = [
  { start: 0, end: 8000, badge: '01', title: '整网主干：YOLO26 一路加深，末尾 C2PSA 聚合', name: '主干' },
  { start: 8000, end: 16000, badge: '02', title: 'C2PSA 内幕：自注意力要打 N×N 个分数', name: 'C2PSA' },
  { start: 16000, end: 24000, badge: '03', title: '替换：a 分支换成 Mamba，问题归零', name: 'MambaPSA' },
  { start: 24000, end: 32000, badge: '04', title: '颈部 BiViM：双向扫描，P4 最佳', name: 'BiViM' },
  { start: 32000, end: 40000, badge: '05', title: '两个集成点：最省与最高精度', name: '总览' },
];

const FOOTERS = [
  'YOLO26 主干由 C3k2 逐层加深、SPPF 汇集多尺度，末尾 C2PSA 做全局聚合。',
  'a 分支用自注意力对 N×N 个位置对打分——序列一长，平方级开销先压垮轻量设备。',
  '保留 CSP 外壳，a 分支的自注意力换成单向 Mamba 扫描：参数 −2.9%、FLOPs −12.1%。',
  'BiViM 正反各扫一遍、两向上下文相加，再接线性投影与残差；只插一层，P4 效果最好。',
  'MambaPSA 最省、P4 BiViM 精度最高；差异为单一种子的方向性趋势，非定论。',
];

/* ---------- 基础绘制 ---------- */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, W, H);
}
function box(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  label: string,
  fill: string,
  border: string,
  sub?: string
) {
  ctx.fillStyle = fill;
  rr(ctx, r.x, r.y, r.w, r.h, 9);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 13px ${F}`;
  const ly = sub ? r.y + r.h / 2 - 2 : r.y + r.h / 2 + 5;
  ctx.fillText(label, r.x + r.w / 2, ly);
  if (sub) {
    ctx.font = `10px ${F}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(sub, r.x + r.w / 2, r.y + r.h / 2 + 14);
  }
  ctx.textAlign = 'left';
}
function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = C.ink,
  dash = false
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  if (dash) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}
function drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.font = `bold 13px ${F}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 28;
  const ph = 26;
  rr(ctx, x, y, pw, ph, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 13, y + 13, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 24, y + 18);
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lineH: number, center: boolean) {
  ctx.textAlign = center ? 'center' : 'left';
  const chars = Array.from(text);
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      yy += lineH;
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}

/* ---------- 时间工具 ---------- */
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
function findScene(elapsed: number): number {
  if (elapsed >= TOTAL_MS) return SCENES.length - 1;
  for (let i = 0; i < SCENES.length; i++) {
    if (elapsed < SCENES[i].end) return i;
  }
  return SCENES.length - 1;
}
function sceneAlpha(localT: number, dur: number): number {
  const fin = easeOutCubic(clamp(localT / 450, 0, 1));
  const fout = clamp((dur - localT) / 350, 0, 1);
  return Math.min(fin, fout);
}

/* ---------- 各幕绘制 ---------- */
function drawScene1(ctx: CanvasRenderingContext2D, localT: number) {
  const boxes = [
    { x: 30, y: 196, w: 60, h: 44, label: '输入' },
    { x: 114, y: 196, w: 72, h: 44, label: 'Stem' },
    { x: 212, y: 200, w: 60, h: 36, label: 'C3k2 P2' },
    { x: 296, y: 182, w: 70, h: 42, label: 'C3k2 P3' },
    { x: 390, y: 162, w: 78, h: 48, label: 'C3k2 P4' },
    { x: 492, y: 142, w: 88, h: 54, label: 'C3k2 P5' },
    { x: 604, y: 136, w: 76, h: 46, label: 'SPPF' },
    { x: 706, y: 136, w: 66, h: 46, label: 'C2PSA' },
  ];
  boxes.forEach((b, i) => {
    const p = easeOutCubic(clamp((localT - (250 + i * 500)) / 450, 0, 1));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    ctx.fillStyle = '#ffffff';
    rr(ctx, b.x, b.y - (1 - p) * 10, b.w, b.h, 9);
    ctx.fill();
    ctx.strokeStyle = i === 7 ? C.red : C.line;
    ctx.lineWidth = i === 7 ? 2 : 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 13px ${F}`;
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 5);
    ctx.globalAlpha = 1;
  });
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    const p = easeOutCubic(clamp((localT - (300 + i * 500)) / 300, 0, 1));
    if (p <= 0) continue;
    arrow(ctx, a.x + a.w, a.y + a.h / 2, b.x - 2, b.y + b.h / 2, C.ink);
  }
  // 颈部 → 检测头
  const c = boxes[7];
  const pn = easeOutCubic(clamp((localT - (250 + 7 * 500 + 350)) / 400, 0, 1));
  if (pn > 0) {
    ctx.globalAlpha = pn;
    const neck = { x: c.x, y: 208, w: c.w, h: 40 };
    const head = { x: c.x, y: 258, w: c.w, h: 40 };
    arrow(ctx, c.x + c.w / 2, c.y + c.h, neck.x + neck.w / 2, neck.y, C.ink);
    ctx.fillStyle = '#ffffff';
    rr(ctx, neck.x, neck.y, neck.w, neck.h, 9);
    ctx.fill();
    rr(ctx, head.x, head.y, head.w, head.h, 9);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(neck.x, neck.y, neck.w, neck.h);
    ctx.strokeRect(head.x, head.y, head.w, head.h);
    arrow(ctx, neck.x + neck.w / 2, neck.y + neck.h, head.x + head.w / 2, head.y, C.ink);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 12px ${F}`;
    ctx.fillText('颈部 PAN-FPN', neck.x + neck.w / 2, neck.y + neck.h / 2 + 5);
    ctx.fillText('检测头', head.x + head.w / 2, head.y + head.h / 2 + 5);
    ctx.globalAlpha = 1;
  }
  // C2PSA 红圈 + 标注
  const ringP = clamp(localT - 4600, 0, 1);
  if (ringP > 0) {
    const rp = 0.4 + 0.6 * easeInOutQuad(clamp(((localT - 4600) % 1600) / 1600, 0, 1));
    ctx.strokeStyle = 'rgba(196,63,82,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 16 + 8 * rp, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.red;
    ctx.font = `bold 13px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText('全局聚合 · O(N²)', c.x + c.w / 2, c.y - 8);
  }
}

function drawScene2(ctx: CanvasRenderingContext2D, localT: number) {
  const xbox = { x: 40, y: 150, w: 70, h: 44 };
  const conv = { x: 140, y: 150, w: 80, h: 44 };
  const aBox = { x: 260, y: 44, w: 250, h: 96 };
  const bBox = { x: 260, y: 222, w: 250, h: 44 };
  const conc = { x: 536, y: 128, w: 80, h: 44 };
  const conv2 = { x: 646, y: 128, w: 80, h: 44 };
  const ybox = { x: 752, y: 128, w: 40, h: 44 };
  box(ctx, xbox, 'x', '#ffffff', C.line);
  box(ctx, conv, '1×1 conv', '#ffffff', C.line);
  arrow(ctx, 110, 172, 140, 172, C.ink);
  arrow(ctx, 220, 172, 260, 100, C.ink);
  arrow(ctx, 220, 172, 260, 240, C.ink);

  // a 分支框（自定义内部）：标题在上、打分矩阵在下
  ctx.fillStyle = 'rgba(196,63,82,0.06)';
  rr(ctx, aBox.x, aBox.y, aBox.w, aBox.h, 9);
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.red;
  ctx.font = `bold 12px ${F}`;
  ctx.fillText('a 分支 · 自注意力 PSA', aBox.x + 14, aBox.y + 18);
  // N×N 打分矩阵（示意 5×5）
  const gx = 274, gy = 74, cell = 7, gap = 1.5;
  const total = 25;
  const k = Math.min(total, Math.floor(clamp(localT / 6000, 0, 1) * total * 1.4));
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / 5);
    const col = i % 5;
    ctx.fillStyle = i < k ? C.red : '#f2eef5';
    ctx.fillRect(gx + col * (cell + gap), gy + r * (cell + gap), cell, cell);
  }
  ctx.fillStyle = C.red;
  ctx.font = `bold 12px ${F}`;
  ctx.fillText(`打分 ${k}/${total} · N×N`, gx, gy + 5 * (cell + gap) + 12);

  box(ctx, bBox, 'b 分支 · 恒等映射', '#ffffff', C.line);

  const cp = clamp((localT - 1800) / 400, 0, 1);
  if (cp > 0) {
    arrow(ctx, 510, 90, 536, 140, C.ink);
    arrow(ctx, 510, 244, 536, 156, C.ink);
    box(ctx, conc, '拼接', '#ffffff', C.line);
  }
  const cp2 = clamp((localT - 2800) / 400, 0, 1);
  if (cp2 > 0) {
    arrow(ctx, 616, 150, 646, 150, C.ink);
    box(ctx, conv2, '1×1 conv', '#ffffff', C.line);
  }
  const cp3 = clamp((localT - 3600) / 400, 0, 1);
  if (cp3 > 0) {
    arrow(ctx, 726, 150, 752, 150, C.ink);
    box(ctx, ybox, 'y', '#ffffff', C.line);
  }
}

function drawScene3(ctx: CanvasRenderingContext2D, localT: number) {
  const xbox = { x: 40, y: 150, w: 70, h: 44 };
  const conv = { x: 140, y: 150, w: 80, h: 44 };
  const aBox = { x: 260, y: 44, w: 250, h: 96 };
  const bBox = { x: 260, y: 222, w: 250, h: 44 };
  const conc = { x: 536, y: 128, w: 80, h: 44 };
  const conv2 = { x: 646, y: 128, w: 80, h: 44 };
  const ybox = { x: 752, y: 128, w: 40, h: 44 };
  box(ctx, xbox, 'x', '#ffffff', C.line);
  box(ctx, conv, '1×1 conv', '#ffffff', C.line);
  arrow(ctx, 110, 172, 140, 172, C.ink);
  arrow(ctx, 220, 172, 260, 100, C.ink);
  arrow(ctx, 220, 172, 260, 240, C.ink);

  // a 分支框（自定义内部）：标题在上、token 扫描在下
  ctx.fillStyle = 'rgba(34,141,92,0.06)';
  rr(ctx, aBox.x, aBox.y, aBox.w, aBox.h, 9);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.green;
  ctx.font = `bold 12px ${F}`;
  ctx.fillText('a 分支 · 单向 Mamba 扫描', aBox.x + 14, aBox.y + 18);
  // token 行 + 绿色扫描头
  const N = 10, ts = 10, pitch = 15, tx = 274, ty = 78;
  for (let i = 0; i < N; i++) {
    ctx.fillStyle = '#ffffff';
    rr(ctx, tx + i * pitch, ty, ts, ts, 3);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const sp = easeInOutQuad(clamp((localT - 500) / 4200, 0, 1));
  const head = tx + sp * (N - 1) * pitch + ts / 2;
  for (let i = 0; i < N; i++) {
    const cx = tx + i * pitch;
    if (cx + ts / 2 <= head) {
      ctx.fillStyle = 'rgba(34,141,92,0.28)';
      rr(ctx, cx, ty, ts, ts, 3);
      ctx.fill();
    }
  }
  if (sp > 0 && sp < 1) {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(head, ty + ts / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.green;
  ctx.font = `bold 12px ${F}`;
  ctx.fillText('每步固定开销 · O(N) 线性', 274, ty + ts + 12);

  box(ctx, bBox, 'b 分支 · 恒等映射', '#ffffff', C.line);

  const cp = clamp((localT - 1800) / 400, 0, 1);
  if (cp > 0) {
    arrow(ctx, 510, 90, 536, 140, C.ink);
    arrow(ctx, 510, 244, 536, 156, C.ink);
    box(ctx, conc, '拼接', '#ffffff', C.line);
  }
  const cp2 = clamp((localT - 2800) / 400, 0, 1);
  if (cp2 > 0) {
    arrow(ctx, 616, 150, 646, 150, C.ink);
    box(ctx, conv2, '1×1 conv', '#ffffff', C.line);
  }
  const cp3 = clamp((localT - 3600) / 400, 0, 1);
  if (cp3 > 0) {
    arrow(ctx, 726, 150, 752, 150, C.ink);
    box(ctx, ybox, 'y', '#ffffff', C.line);
  }

  // 整网效率卡
  const cp4 = clamp((localT - 4500) / 400, 0, 1);
  if (cp4 > 0) {
    ctx.globalAlpha = cp4;
    ctx.fillStyle = '#ffffff';
    rr(ctx, 530, 206, 250, 116, 10);
    ctx.fill();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const rows = [
      ['参数', '−2.9%'],
      ['FLOPs', '−12.1%'],
      ['CPU 推理', '17 → 20 FPS'],
      ['mAP50:95', '−0.1'],
    ];
    ctx.font = `bold 13px ${F}`;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left';
    ctx.fillText('整网相对 C2PSA', 548, 228);
    rows.forEach((r, i) => {
      const ry = 248 + i * 18;
      ctx.font = `12px ${F}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(r[0], 548, ry);
      ctx.fillStyle = r[1].startsWith('−') && i === 1 ? C.green : C.ink;
      ctx.font = `bold 12px ${F}`;
      ctx.fillText(r[1], 720, ry);
    });
    ctx.globalAlpha = 1;
  }
}

function drawScene4(ctx: CanvasRenderingContext2D, localT: number) {
  const pills = [
    { x: 60, label: 'P3 层 · 退步 −1.5', color: C.red, active: false },
    { x: 300, label: 'P4 层 · 最佳 +0.9', color: C.green, active: true },
    { x: 540, label: 'P5 层 · 太贵 +43.8%', color: C.purple, active: false },
  ];
  pills.forEach((pl, i) => {
    const pp = easeOutCubic(clamp((localT - (300 + i * 260)) / 400, 0, 1));
    if (pp <= 0) return;
    drawPill(ctx, pl.x, 66, pl.label, pl.color);
    if (pl.active) {
      ctx.font = `bold 13px ${F}`;
      const w = ctx.measureText(pl.label).width + 28;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(pl.x - 3, 63, w + 6, 32);
      ctx.setLineDash([]);
    }
  });

  // BiViM 机制：token 行，正反两趟扫描
  const N = 10, ts = 26, pitch = 34, x0 = 90, y = 190;
  for (let i = 0; i < N; i++) {
    ctx.fillStyle = '#ffffff';
    rr(ctx, x0 + i * pitch, y, ts, ts, 6);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  const fp = easeInOutQuad(clamp((localT - 900) / 2600, 0, 1));
  const fX = x0 + fp * (N - 1) * pitch;
  for (let i = 0; i < N; i++) {
    const cx = x0 + i * pitch;
    if (cx + ts / 2 <= fX) {
      ctx.fillStyle = 'rgba(217,119,6,0.25)';
      rr(ctx, cx, y, ts, ts, 6);
      ctx.fill();
    }
  }
  if (localT > 900 && localT < 3500) {
    ctx.fillStyle = 'rgba(217,119,6,0.4)';
    rr(ctx, fX - 4, y - 4, ts + 8, ts + 8, 8);
    ctx.fill();
  }
  const bp = easeInOutQuad(clamp((localT - 3600) / 2600, 0, 1));
  const bX = x0 + (1 - bp) * (N - 1) * pitch;
  for (let i = 0; i < N; i++) {
    const cx = x0 + i * pitch;
    if (cx + ts / 2 >= bX) {
      ctx.fillStyle = 'rgba(39,68,110,0.22)';
      rr(ctx, cx, y, ts, ts, 6);
      ctx.fill();
    }
  }
  if (localT > 3600 && localT < 6200) {
    ctx.fillStyle = 'rgba(39,68,110,0.4)';
    rr(ctx, bX - 4, y - 4, ts + 8, ts + 8, 8);
    ctx.fill();
  }
  ctx.font = `bold 13px ${F}`;
  ctx.textAlign = 'left';
  if (localT > 900 && localT < 3600) {
    ctx.fillStyle = C.orange;
    ctx.fillText('正向扫描 →', x0, y - 14);
  }
  if (localT > 3600 && localT < 6200) {
    ctx.fillStyle = C.blue;
    ctx.fillText('← 反向扫描', x0, y + ts + 22);
  }
  // 相加 + 线性投影 + 残差
  ctx.fillStyle = '#ffffff';
  rr(ctx, 620, 176, 150, 56, 10);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 13px ${F}`;
  ctx.fillText('相加 → 线性投影', 695, 202);
  ctx.fillText('+ 残差', 695, 220);
  ctx.fillStyle = C.muted;
  ctx.font = `12px ${F}`;
  ctx.fillText('两向上下文相加', 695, 244);
}

function drawScene5(ctx: CanvasRenderingContext2D, localT: number) {
  // 迷你整网：两个集成点高亮
  const nodes = [
    { x: 40, y: 70, w: 56, h: 40, label: '输入', c: C.line },
    { x: 108, y: 70, w: 56, h: 40, label: 'Stem', c: C.line },
    { x: 176, y: 70, w: 80, h: 40, label: 'C3k2×4', c: C.line },
    { x: 268, y: 70, w: 60, h: 40, label: 'SPPF', c: C.line },
    { x: 340, y: 70, w: 96, h: 40, label: 'MambaPSA', c: C.orange, sub: '替换 C2PSA' },
    { x: 448, y: 70, w: 70, h: 40, label: '颈部', c: C.line },
    { x: 530, y: 70, w: 88, h: 40, label: 'P4 BiViM', c: C.blue, sub: '双向扫描' },
    { x: 630, y: 70, w: 66, h: 40, label: '检测头', c: C.line },
  ];
  nodes.forEach((n, i) => {
    const p = easeOutCubic(clamp((localT - (250 + i * 400)) / 400, 0, 1));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    ctx.fillStyle = n.c === C.line ? '#ffffff' : n.c === C.orange ? 'rgba(217,119,6,0.10)' : 'rgba(39,68,110,0.10)';
    rr(ctx, n.x, n.y, n.w, n.h, 9);
    ctx.fill();
    ctx.strokeStyle = n.c;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = n.sub ? `bold 11px ${F}` : `bold 13px ${F}`;
    const ly = n.sub ? n.y + n.h / 2 - 2 : n.y + n.h / 2 + 5;
    ctx.fillText(n.label, n.x + n.w / 2, ly);
    if (n.sub) {
      ctx.font = `9px ${F}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(n.sub, n.x + n.w / 2, n.y + n.h / 2 + 13);
    }
    ctx.globalAlpha = 1;
  });
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const p = easeOutCubic(clamp((localT - (300 + i * 400)) / 250, 0, 1));
    if (p <= 0) continue;
    arrow(ctx, a.x + a.w, a.y + a.h / 2, b.x - 2, b.y + b.h / 2, C.ink);
  }

  // 结论三条
  const items = [
    { t: 'MambaPSA 最省：参数 −2.9% · FLOPs −12.1% · CPU 17→20 FPS，mAP 仅 −0.1。', d: 1400 },
    { t: 'P4 BiViM 精度最高：+0.9，但参数 +9.6%；P5 参数 +43.8% 太贵。', d: 3200 },
    { t: '要效率选 MambaPSA，要精度选 P4 BiViM。', d: 5000 },
  ];
  items.forEach((it, i) => {
    const p = easeOutCubic(clamp((localT - it.d) / 500, 0, 1));
    if (p <= 0) return;
    const y = 176 + i * 56;
    const x = 110 + lerp(-40, 0, p);
    ctx.globalAlpha = p;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(x + 12, y - 5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 14px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText('✓', x + 12, y + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.font = `16px ${F}`;
    ctx.fillText(it.t, x + 40, y);
    ctx.globalAlpha = 1;
  });
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, localT: number) {
  switch (idx) {
    case 0: drawScene1(ctx, localT); break;
    case 1: drawScene2(ctx, localT); break;
    case 2: drawScene3(ctx, localT); break;
    case 3: drawScene4(ctx, localT); break;
    default: drawScene5(ctx, localT); break;
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, idx: number) {
  const sc = SCENES[idx];
  ctx.font = `bold 12px ${F}`;
  const bw = ctx.measureText(sc.badge).width + 18;
  rr(ctx, 16, 14, bw, 24, 12);
  ctx.fillStyle = C.blue;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(sc.badge, 16 + bw / 2, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 16px ${F}`;
  ctx.fillText(sc.title, 16 + bw + 12, 31);
}

function drawFooter(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = `15px ${F}`;
  ctx.fillStyle = C.ink;
  wrapText(ctx, text, W / 2, 352, W - 90, 20, true);
}

function drawBottomStrip(ctx: CanvasRenderingContext2D, elapsed: number, idx: number, paused: boolean) {
  const y = H - 40;
  rr(ctx, 12, y, W - 24, 26, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = `12px ${F}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(paused ? '⏸ 已暂停' : '⏵ 播放中', 26, y + 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.fillText(`第 ${idx + 1}/${SCENES.length} 幕`, W / 2, y + 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.muted;
  ctx.fillText(`${fmt(elapsed)} / ${fmt(TOTAL_MS)}`, W - 26, y + 18);
}

/* ---------- 组件 ---------- */
export const PipelineVideo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ started: false, paused: false, t0: 0, pausedAt: 0 });
  const lastUiRef = useRef(0);
  const [ui, setUi] = useState({ elapsed: 0, paused: true, idx: 0, ended: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (elapsed: number) => {
      clearScene(ctx);
      const prog = clamp(elapsed / TOTAL_MS, 0, 1);
      ctx.fillStyle = 'rgba(33,50,74,0.08)';
      ctx.fillRect(0, 0, W, 6);
      ctx.fillStyle = C.orange;
      ctx.fillRect(0, 0, W * prog, 6);

      const idx = findScene(elapsed);
      const sc = SCENES[idx];
      const localT = clamp(elapsed - sc.start, 0, sc.end - sc.start);
      drawHeader(ctx, idx);
      const a = sceneAlpha(localT, sc.end - sc.start);
      ctx.save();
      ctx.globalAlpha = a;
      drawScene(ctx, idx, localT);
      if (FOOTERS[idx]) drawFooter(ctx, FOOTERS[idx]);
      ctx.restore();
      drawBottomStrip(ctx, elapsed, idx, stateRef.current.paused || !stateRef.current.started);
    };
    const tick = (t: number) => {
      const s = stateRef.current;
      const elapsed = !s.started ? 0 : s.paused ? s.pausedAt : t - s.t0;
      render(elapsed);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (t - lastUiRef.current > 150) {
        lastUiRef.current = t;
        setUi({
          elapsed: Math.round(elapsed),
          paused: s.paused || !s.started,
          idx: findScene(elapsed),
          ended: elapsed >= TOTAL_MS - 40,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const startLoop = () => {
      if (!stateRef.current.started) {
        stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const disconnect = observeCanvas(canvas, startLoop, stopLoop);
    return () => {
      stopLoop();
      disconnect();
    };
  }, []);

  const toggle = () => {
    const s = stateRef.current;
    const el = s.started && !s.paused ? performance.now() - s.t0 : s.pausedAt;
    if (s.started && !s.paused && el < TOTAL_MS - 40) {
      stateRef.current = { ...s, paused: true, pausedAt: el };
      setUi((u) => ({ ...u, paused: true }));
    } else if (s.started && !s.paused) {
      stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
      setUi((u) => ({ ...u, paused: false, ended: false }));
    } else {
      const base = s.pausedAt || 0;
      stateRef.current = { started: true, paused: false, t0: performance.now() - base, pausedAt: base };
      setUi((u) => ({ ...u, paused: false, ended: false }));
    }
  };
  const restart = () => {
    stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
    setUi((u) => ({ ...u, paused: false, ended: false }));
  };
  const seek = (i: number) => {
    const ms = SCENES[i].start + 60;
    stateRef.current = { started: true, paused: false, t0: performance.now() - ms, pausedAt: ms };
    setUi((u) => ({ ...u, paused: false, ended: false, idx: i }));
  };

  const isPaused = ui.paused || ui.ended;
  const scene = SCENES[ui.idx];
  const playLabel = ui.ended ? '↺ 重播' : isPaused ? '▶ 播放' : '⏸ 暂停';
  const feedbackText = ui.ended
    ? `已播完全部 ${SCENES.length} 幕。`
    : isPaused
      ? `已暂停 · 第 ${ui.idx + 1}/${SCENES.length} 幕「${scene.title}」。`
      : `第 ${ui.idx + 1}/${SCENES.length} 幕「${scene.title}」。`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={toggle}>
          {playLabel}
        </button>
        <button className="tiny ghost" onClick={restart}>
          ↺ 从头
        </button>
      </div>
      <div className="chip-row">
        {SCENES.map((s, i) => (
          <button key={i} className={`chip ${ui.idx === i ? 'selected' : ''}`} onClick={() => seek(i)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="feedback">{feedbackText}</div>
    </div>
  );
};
