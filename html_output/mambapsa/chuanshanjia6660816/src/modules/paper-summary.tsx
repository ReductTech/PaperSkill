import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp, easeOutCubic, easeInOutQuad, easeOutBounce } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* 论文速览动画(playback-like)。
   一段约 48 秒的自动播放 canvas 动画,把全文串成 7 幕:
   引言 → 问题(C2PSA 自注意力 O(N²))→ 思路(Mamba 线性扫描)
   → MambaPSA 块 → BiViM 双向扫描 → 实验结果 → 结论。
   自带 播放/暂停/重播 与场景点跳转,观感接近内嵌视频,但完全由 TS 代码驱动。 */

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const F = '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

const W = 800;
const H = 420;
const TOTAL_MS = 48000;

const SCENES = [
  { start: 0, end: 6000, badge: '01', title: '引言 · 这篇论文做了什么', name: '引言' },
  { start: 6000, end: 13000, badge: '02', title: '问题 · C2PSA 的自注意力 O(N²)', name: '问题' },
  { start: 13000, end: 20000, badge: '03', title: '思路 · Mamba 线性扫描', name: '思路' },
  { start: 20000, end: 27000, badge: '04', title: '模块 · MambaPSA 块', name: '模块' },
  { start: 27000, end: 34000, badge: '05', title: '模块 · BiViM 双向扫描', name: '双向' },
  { start: 34000, end: 42000, badge: '06', title: '结果 · 效率与精度', name: '结果' },
  { start: 42000, end: 48000, badge: '07', title: '结论 · 权衡与边界', name: '结论' },
];

const FOOTERS = [
  '约一分钟的动画速览：问题 → 机制 → 结果。',
  '每个 token 都要和所有 token 各打一次分——序列一长，平方级开销先压垮边缘设备。',
  'Mamba 用一个不断更新的隐状态记住读过的内容，代价随序列长度线性增长。',
  '保留 CSP 外壳：拆两半，一半过 Mamba 精加工、一半恒等，拼回再投影——整体近似参数中性。',
  'BiViM 正反各扫一遍、两向信息相加，再接线性投影与残差；只插一层，P4 效果最好。',
  'MambaPSA：FLOPs −12.1% · 参数 −2.9% · CPU 17→20 FPS · mAP −0.1；P4 BiViM mAP +0.9（参数 +9.6%）。',
  '',
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
function drawShelfRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.fillStyle = C.shelf;
  ctx.fillRect(x0, y - 6, x1 - x0, 8);
  ctx.fillStyle = C.shelfDark;
  ctx.fillRect(x0, y + 1, x1 - x0, 2);
  ctx.fillStyle = 'rgba(118,144,106,0.25)';
  ctx.fillRect(x1 - 4, y - 8, 4, 10);
}
function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, color: string) {
  if (bh <= 1) return;
  ctx.fillStyle = color;
  rr(ctx, x, y - bh, bw, bh, 2);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.35)';
  ctx.fillRect(x + bw / 2 - 0.5, y - bh + 3, 1, bh - 6);
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
  const p = easeOutCubic(clamp(localT / 700, 0, 1));
  const panel = { x: 120, y: 52, w: 560, h: 236 };
  const sw = panel.w * (0.94 + 0.06 * p);
  const sh = panel.h * (0.94 + 0.06 * p);
  const sx = panel.x + (panel.w - sw) / 2;
  const sy = panel.y + (panel.h - sh) / 2;
  const a = p;
  ctx.fillStyle = `rgba(33,50,74,${a})`;
  rr(ctx, sx, sy, sw, sh, 18);
  ctx.fill();
  // 内部描边装饰
  ctx.strokeStyle = `rgba(244,200,106,${0.8 * a})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx + 14, sy + 14, sw - 28, sh - 28);
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(251,247,238,${a})`;
  ctx.font = `bold 46px ${F}`;
  ctx.fillText('MambaPSA', W / 2, sy + 92);
  ctx.font = `23px ${F}`;
  ctx.fillText('用 Mamba 替换 YOLO26 中的 C2PSA 模块', W / 2, sy + 140);
  ctx.font = `17px ${F}`;
  ctx.fillStyle = `rgba(244,200,106,${a})`;
  ctx.fillText('从平方级自注意力 → 线性级选择性扫描', W / 2, sy + 178);
  ctx.font = `13px ${F}`;
  ctx.fillStyle = `rgba(251,247,238,${0.7 * a})`;
  ctx.fillText('淡江大学 · arXiv 2607.12681 · PASCAL VOC 目标检测', W / 2, sy + 212);

  // 底部书架：5 本书依次弹起。把书架留在正文区，避免压住下面的说明文字。
  drawShelfRow(ctx, 336, 150, 650);
  const books = [
    { x: 180, c: C.blue, h: 40 }, { x: 276, c: C.green, h: 46 }, { x: 372, c: C.orange, h: 34 },
    { x: 468, c: C.purple, h: 44 }, { x: 564, c: C.red, h: 38 },
  ];
  books.forEach((b, i) => {
    const bp = easeOutBounce(clamp((localT - (900 + i * 150)) / 500, 0, 1));
    drawBook(ctx, b.x, 336, 44, b.h * bp, b.c);
  });
}

function drawScene2(ctx: CanvasRenderingContext2D, localT: number) {
  const bx0 = 80;
  const baseline = 250;
  const bw = 38;
  const gap = 10;
  const pitch = 48;
  const heights = [64, 72, 68, 76, 58, 70, 66, 74];
  const focus = 4;
  const bp = clamp(localT / 600, 0, 1);

  drawShelfRow(ctx, baseline, bx0, bx0 + 374);
  // 书架：焦点书红色，其余蓝色
  const xs = heights.map((h, i) => bx0 + i * pitch);
  for (let i = 0; i < heights.length; i++) {
    drawBook(ctx, xs[i], baseline, bw, heights[i] * easeOutCubic(bp), i === focus ? C.red : C.blue);
  }
  // 焦点书红圈
  const fcx = xs[focus] + bw / 2;
  const fty = baseline - heights[focus] * easeOutCubic(bp) - 8;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(fcx, fty, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 比对弧线：按距离从近到远依次出现
  const order = [3, 5, 2, 6, 1, 7, 0];
  let done = 0;
  order.forEach((i, k) => {
    const delay = 700 + k * 420;
    const ap = clamp((localT - delay) / 300, 0, 1);
    if (ap <= 0) return;
    done++;
    const tx = xs[i] + bw / 2;
    const ty = baseline - heights[i] * easeOutCubic(bp) - 8;
    const mx = (fcx + tx) / 2;
    const my = Math.min(fty, ty) - 40;
    ctx.strokeStyle = `rgba(196,63,82,${0.55 * ap})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(fcx, fty);
    ctx.quadraticCurveTo(mx, my, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // 右侧计分卡片
  ctx.fillStyle = '#ffffff';
  rr(ctx, 496, 84, 280, 152, 12);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 17px ${F}`;
  ctx.fillText('打分次数 = N×N', 516, 116);
  ctx.font = `bold 30px ${F}`;
  ctx.fillStyle = C.red;
  ctx.fillText('8 × 8 = 64', 516, 156);
  ctx.font = `13px ${F}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('每个 token 都要和所有 token 比一遍', 516, 188);
  // 进度条：比对完成度
  ctx.fillStyle = 'rgba(196,63,82,0.12)';
  rr(ctx, 516, 202, 240, 12, 6);
  ctx.fill();
  ctx.fillStyle = C.red;
  rr(ctx, 516, 202, 240 * (done / 7), 12, 6);
  ctx.fill();
  ctx.font = `12px ${F}`;
  ctx.fillStyle = C.ink;
  ctx.fillText(`已比对 ${done}/7`, 516, 230);
}

function drawScene3(ctx: CanvasRenderingContext2D, localT: number) {
  const bx0 = 80;
  const baseline = 210;
  const bw = 34;
  const pitch = 42;
  const N = 10;
  const heights = [52, 58, 62, 56, 50, 60, 54, 64, 58, 52];
  const bp = clamp(localT / 500, 0, 1);

  drawShelfRow(ctx, baseline, bx0 - 6, bx0 + 9 * pitch + bw + 6);
  for (let i = 0; i < N; i++) {
    const x = bx0 + i * pitch;
    const h = heights[i] * easeOutCubic(bp);
    drawBook(ctx, x, baseline, bw, h, i % 2 ? '#3a5d8f' : C.blue);
  }

  // 扫描指针：从左到右一趟
  const sp = easeInOutQuad(clamp((localT - 600) / 5000, 0, 1));
  const px = lerp(bx0 - 14, bx0 + 9 * pitch + bw + 14, sp);
  // 已扫描区（绿色半透明）
  ctx.fillStyle = 'rgba(34,141,92,0.16)';
  ctx.fillRect(bx0 - 14, baseline - 70, Math.max(0, px - (bx0 - 14)), 64);
  // 扫描头
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(px, baseline - 36, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, baseline - 36, 12 + Math.sin(localT / 90) * 3, 0, Math.PI * 2);
  ctx.stroke();
  // 架子下方的进度线
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx0 - 14, baseline + 22);
  ctx.lineTo(px, baseline + 22);
  ctx.stroke();

  // 右侧隐状态卡片
  const k = Math.floor(sp * N);
  ctx.fillStyle = '#ffffff';
  rr(ctx, 556, 66, 224, 150, 12);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 16px ${F}`;
  ctx.fillText('隐状态 · 记忆 h', 572, 96);
  ctx.font = `bold 30px ${F}`;
  ctx.fillStyle = C.green;
  ctx.fillText(`${k}/10`, 572, 138);
  ctx.fillStyle = 'rgba(34,141,92,0.14)';
  rr(ctx, 572, 154, 160, 10, 5);
  ctx.fill();
  ctx.fillStyle = C.green;
  rr(ctx, 572, 154, 160 * (k / 10), 10, 5);
  ctx.fill();
  ctx.font = `12px ${F}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('每步固定开销，总代价线性增长', 572, 186);

  // 左下对比
  drawPill(ctx, 90, 250, '自注意力 · 每本都比一遍', C.red);
  drawPill(ctx, 90, 288, 'Mamba · 一趟扫过，只记要点', C.green);
}

function drawScene4(ctx: CanvasRenderingContext2D, localT: number) {
  const inp = { x: 24, y: 128, w: 106, h: 48 };
  const conv = { x: 158, y: 128, w: 106, h: 48 };
  const mamba = { x: 292, y: 56, w: 204, h: 66 };
  const iden = { x: 292, y: 198, w: 204, h: 48 };
  const conc = { x: 524, y: 128, w: 132, h: 48 };
  const outp = { x: 684, y: 128, w: 92, h: 48 };

  const box = (b: { x: number; y: number; w: number; h: number }, label: string, fill: string, border: string, sub?: string) => {
    ctx.fillStyle = fill;
    rr(ctx, b.x, b.y, b.w, b.h, 9);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 15px ${F}`;
    ctx.fillText(label, b.x + b.w / 2, b.y + (sub ? b.h / 2 - 2 : b.h / 2 + 5));
    if (sub) {
      ctx.font = `11px ${F}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 17);
    }
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number, color = C.ink, dash = false) => {
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
  };

  box(inp, 'x · C×H×W', '#ffffff', C.line);
  box(conv, '1×1 conv', '#ffffff', C.line);
  box(mamba, 'Mamba 单向扫描', 'rgba(34,141,92,0.08)', C.green, 'd_state=8 · e=1');
  box(iden, 'b · 恒等保持', 'rgba(104,119,143,0.08)', C.muted);
  box(conc, '拼接 + 1×1 conv', '#ffffff', C.line);
  box(outp, 'y', '#ffffff', C.line);

  arrow(130, 152, 158, 152);
  arrow(264, 132, 292, 92, C.green);
  arrow(264, 172, 292, 210, C.muted);
  arrow(496, 92, 530, 130, C.green);
  arrow(496, 210, 530, 172, C.muted);
  arrow(656, 152, 684, 152);

  // 分支标注
  ctx.font = `bold 13px ${F}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.green;
  ctx.fillText('a 分支', 278, 88);
  ctx.fillStyle = C.muted;
  ctx.fillText('b 分支', 278, 240);

  // 令牌点动画：a 走 Mamba、b 走恒等
  const tA1 = clamp((localT - 1500) / 600, 0, 1);
  const tA2 = clamp((localT - 2100) / 1200, 0, 1);
  const tA3 = clamp((localT - 3300) / 600, 0, 1);
  const tA4 = clamp((localT - 3900) / 600, 0, 1);
  const tB1 = clamp((localT - 1500) / 500, 0, 1);
  const tB2 = clamp((localT - 2000) / 1400, 0, 1);
  const tB3 = clamp((localT - 3400) / 500, 0, 1);

  const dot = (x: number, y: number, color: string, r = 6) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // a 路径（绿）
  if (tA1 > 0 && tA1 < 1) dot(lerp(264, 292, tA1), lerp(132, 92, tA1), C.green);
  else if (tA2 > 0 && tA2 < 1) dot(lerp(296, 492, tA2), 89, C.green);
  else if (tA3 > 0 && tA3 < 1) dot(lerp(496, 524, tA3), lerp(92, 132, tA3), C.green);
  else if (tA4 > 0 && tA4 < 1) dot(lerp(524, 684, tA4), 152, C.green);
  // b 路径（灰蓝）
  if (tB1 > 0 && tB1 < 1) dot(lerp(264, 292, tB1), lerp(172, 210, tB1), C.muted);
  else if (tB2 > 0 && tB2 < 1) dot(lerp(296, 492, tB2), 222, C.muted);
  else if (tB3 > 0 && tB3 < 1) dot(lerp(496, 524, tB3), lerp(210, 172, tB3), C.muted);

  // Mamba 块内的扫描动效
  const scanP = clamp((localT - 2200) / 1200, 0, 1);
  if (scanP > 0 && scanP < 1) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(306, 100);
    ctx.lineTo(306 + 180 * scanP, 100);
    ctx.stroke();
  }
  // 汇聚处 "+"
  if (localT > 3800 && localT < 4500) {
    ctx.font = `bold 24px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.orange;
    ctx.fillText('+', 560, 122);
  }
}

function drawScene5(ctx: CanvasRenderingContext2D, localT: number) {
  const tsize = 36;
  const pitch = 48;
  const x0 = 56;
  const y = 146;
  const N = 10;

  // 令牌行
  for (let i = 0; i < N; i++) {
    const x = x0 + i * pitch;
    ctx.fillStyle = '#ffffff';
    rr(ctx, x, y, tsize, tsize, 6);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 正向扫描（橙）左→右
  const fp = easeInOutQuad(clamp((localT - 600) / 2000, 0, 1));
  const fX = x0 + fp * 9 * pitch;
  for (let i = 0; i < N; i++) {
    const x = x0 + i * pitch;
    if (x < fX) {
      ctx.fillStyle = 'rgba(217,119,6,0.22)';
      rr(ctx, x, y, tsize, tsize, 6);
      ctx.fill();
    }
  }
  if (localT > 600 && localT < 2600) {
    ctx.fillStyle = 'rgba(217,119,6,0.35)';
    rr(ctx, fX - 4, y - 4, tsize + 8, tsize + 8, 8);
    ctx.fill();
  }
  // 反向扫描（蓝）右→左
  const bpp = easeInOutQuad(clamp((localT - 3000) / 2000, 0, 1));
  const bX = x0 + (1 - bpp) * 9 * pitch;
  for (let i = 0; i < N; i++) {
    const x = x0 + i * pitch;
    if (x > bX) {
      ctx.fillStyle = 'rgba(39,68,110,0.20)';
      rr(ctx, x, y, tsize, tsize, 6);
      ctx.fill();
    }
  }
  if (localT > 3000 && localT < 5000) {
    ctx.fillStyle = 'rgba(39,68,110,0.35)';
    rr(ctx, bX - 4, y - 4, tsize + 8, tsize + 8, 8);
    ctx.fill();
  }

  // 方向标注
  ctx.font = `bold 13px ${F}`;
  ctx.textAlign = 'left';
  if (localT > 600 && localT < 2800) {
    ctx.fillStyle = C.orange;
    ctx.fillText('正向扫描 →', x0, y - 14);
  }
  if (localT > 3000 && localT < 5200) {
    ctx.fillStyle = C.blue;
    ctx.fillText('← 反向扫描', x0, y + tsize + 24);
  }

  // 右侧：相加 + 投影
  ctx.fillStyle = '#ffffff';
  rr(ctx, 576, 118, 52, 52, 10);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 26px ${F}`;
  ctx.fillText('+', 602, 154);
  const sumP = easeOutCubic(clamp((localT - 3200) / 600, 0, 1));
  const bx = 656;
  ctx.fillStyle = `rgba(39,68,110,${0.08 + 0.05 * sumP})`;
  rr(ctx, bx, 118, 124, 52, 10);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = `bold 14px ${F}`;
  ctx.fillText('线性投影', bx + 62, 140);
  ctx.fillText('+ 残差', bx + 62, 158);
  // 连到 + 的箭头
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(602 + sumP * 24, 144);
  ctx.lineTo(656, 144);
  ctx.stroke();
  ctx.font = `12px ${F}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('两个方向上下文相加', 668, 192);

  // 放置位置三档
  drawPill(ctx, 70, 248, 'P3 · 退步 −1.5', C.red);
  drawPill(ctx, 232, 248, 'P4 · 最佳 ＋0.9', C.green);
  drawPill(ctx, 394, 248, 'P5 · 太贵 +43.8%', C.purple);
}

function drawScene6(ctx: CanvasRenderingContext2D, localT: number) {
  // 左：mAP 柱状
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 16px ${F}`;
  ctx.fillText('mAP50:95 精度（↑好）', 44, 66);
  const mcfg = [
    { n: 'Base', v: 49.9, c: C.blue }, { n: 'P3', v: 48.4, c: C.purple },
    { n: 'P4', v: 50.8, c: C.green }, { n: 'P5', v: 50.6, c: C.purple },
    { n: 'MPSA', v: 49.8, c: C.orange },
  ];
  const baseY = 282;
  const maxH = 170;
  const bw = 44;
  const pitch = 62;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(34, baseY);
  ctx.lineTo(344, baseY);
  ctx.stroke();
  mcfg.forEach((c, i) => {
    const delay = 400 + i * 500;
    const p = easeOutCubic(clamp((localT - delay) / 700, 0, 1));
    const h = ((c.v - 48) / 3) * maxH * p;
    const x = 44 + i * pitch;
    ctx.fillStyle = c.c;
    rr(ctx, x, baseY - h, bw, h, 4);
    ctx.fill();
    ctx.font = `bold 11px ${F}`;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText(c.n, x + bw / 2, baseY + 18);
    if (h > 12) {
      ctx.font = `11px ${F}`;
      ctx.fillStyle = c.c;
      ctx.fillText(String(c.v), x + bw / 2, baseY - h - 6);
    }
  });
  // P4 最优标记
  const p4p = easeOutCubic(clamp((localT - 900) / 600, 0, 1));
  if (p4p > 0) {
    ctx.font = `bold 13px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.green;
    ctx.fillText('✓ +0.9', 44 + 2 * pitch + bw / 2, 96);
  }

  // 右：FLOPs 条形
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 16px ${F}`;
  ctx.fillText('FLOPs(G) 效率（↓好）', 470, 66);
  const fcfg = [
    { n: 'Base', v: 5.8, c: C.blue }, { n: 'P3', v: 6.5, c: C.purple },
    { n: 'P4', v: 6.2, c: C.purple }, { n: 'P5', v: 6.1, c: C.purple },
    { n: 'MPSA', v: 5.1, c: C.orange },
  ];
  const fX0 = 514;
  const fMaxW = 260;
  fcfg.forEach((c, i) => {
    const delay = 900 + i * 450;
    const p = easeOutCubic(clamp((localT - delay) / 700, 0, 1));
    const w = (c.v / 6.5) * fMaxW * p;
    const ry = 112 + i * 34;
    ctx.font = `bold 12px ${F}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.fillText(c.n, 470, ry + 14);
    ctx.fillStyle = c.c;
    rr(ctx, fX0, ry, w, 16, 4);
    ctx.fill();
    ctx.font = `11px ${F}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.fillText(String(c.v), 784, ry + 14);
  });
  // MPSA 最省标记
  const mp = easeOutCubic(clamp((localT - 3300) / 600, 0, 1));
  if (mp > 0) {
    ctx.font = `bold 12px ${F}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.orange;
    ctx.fillText('最省 −12.1%', 514, 112 + 4 * 34 - 6);
  }
}

function drawScene7(ctx: CanvasRenderingContext2D, localT: number) {
  const items = [
    { t: '全局信息不必平方级开销——一趟线性扫描就够了。', d: 500 },
    { t: 'MambaPSA 最省：FLOPs −12.1% · 参数 −2.9%，精度几乎不掉（−0.1）。', d: 1500 },
    { t: 'P4 是 SSM 放置的最佳位置（+0.9）；P3 退步、P5 参数 +43.8% 太贵。', d: 2500 },
  ];
  items.forEach((it, i) => {
    const p = easeOutCubic(clamp((localT - it.d) / 600, 0, 1));
    if (p <= 0) return;
    const y = 118 + i * 62;
    const x = 110 + lerp(-46, 0, p);
    ctx.globalAlpha = p;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(x + 12, y - 5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 15px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText('✓', x + 12, y + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.font = `17px ${F}`;
    ctx.fillText(it.t, x + 40, y);
    ctx.globalAlpha = 1;
  });
  // 边界说明
  const np = clamp((localT - 3200) / 500, 0, 1);
  if (np > 0) {
    ctx.globalAlpha = np;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `13px ${F}`;
    ctx.fillText('所有差异均为单一种子的方向性趋势；未来：多种子 · MambaPSA+P4 · COCO', W / 2, 300);
    ctx.globalAlpha = 1;
  }
  // 结束语
  const ep = clamp((localT - 4300) / 500, 0, 1);
  if (ep > 0) {
    ctx.globalAlpha = ep;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 15px ${F}`;
    ctx.fillText('— 动画速览结束 · 各章节还有完整交互精读 —', W / 2, 336);
    ctx.globalAlpha = 1;
  }
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, localT: number) {
  switch (idx) {
    case 0: drawScene1(ctx, localT); break;
    case 1: drawScene2(ctx, localT); break;
    case 2: drawScene3(ctx, localT); break;
    case 3: drawScene4(ctx, localT); break;
    case 4: drawScene5(ctx, localT); break;
    case 5: drawScene6(ctx, localT); break;
    default: drawScene7(ctx, localT); break;
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
export const PaperSummary: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 顶部进度条
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
