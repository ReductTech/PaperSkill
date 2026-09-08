import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Shared analogy widget: renders one 244x130 scene per chapter (chap-1 .. chap-10)
// on the 备考错题诊断 desk. One subject + one verb + one goal per scene, at most
// two in-canvas labels and one compact legend row. Auto loop only, no controls.

const W = 244;
const H = 130;
const BAND = 14; // desk band height

const PAL = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  envDark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

type Ctx = CanvasRenderingContext2D;

// ---- shared drawing kit (inlined per contract; locked palette only) ----

function desk(ctx: Ctx): void {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAL.env;
  ctx.fillRect(0, H - BAND, W, BAND);
  ctx.fillStyle = PAL.envDark;
  ctx.fillRect(0, H - BAND - 1.5, W, 1.5);
}

function lamp(ctx: Ctx): void {
  ctx.strokeStyle = PAL.envDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W - 20, H - 4);
  ctx.lineTo(W - 20, H - 18);
  ctx.lineTo(W - 7, H - 25);
  ctx.stroke();
  ctx.fillStyle = PAL.envDark;
  ctx.beginPath();
  ctx.moveTo(W - 15, H - 31);
  ctx.lineTo(W - 5, H - 31);
  ctx.lineTo(W - 11, H - 23);
  ctx.closePath();
  ctx.fill();
}

function sheet(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = PAL.env;
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function notebook(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = PAL.env;
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAL.route;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x - 2, y + 10 + i * ((h - 20) / 3), 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function pen(ctx: Ctx, x: number, y: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = PAL.route;
  ctx.fillRect(-18, -2, 8, 4); // wooden handle (rear)
  ctx.fillStyle = color;
  ctx.fillRect(-10, -1.8, 16, 3.6); // body
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(14, -1.6);
  ctx.lineTo(14, 1.6);
  ctx.closePath();
  ctx.fill(); // nib
  ctx.restore();
}

function lens(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.envDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = PAL.blue;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r - 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PAL.route;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.7, y + r * 0.7);
  ctx.lineTo(x + r * 0.7 + 14, y + r * 0.7 + 14);
  ctx.stroke();
}

function tick(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.25, y + s * 0.6);
  ctx.lineTo(x + s, y - s * 0.75);
  ctx.stroke();
}

function cross(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x - s, y + s);
  ctx.lineTo(x + s, y - s);
  ctx.stroke();
}

function circleMark(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function markDot(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = PAL.text;
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
}

function card(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function highlighter(ctx: Ctx, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = PAL.env;
  ctx.fillRect(-14, -2.5, 22, 5);
  ctx.fillStyle = PAL.green;
  ctx.fillRect(8, -2.5, 6, 5); // green cap
  ctx.restore();
}

// a row of tiny glyph-like strokes (stands for small text)
function glyphRow(ctx: Ctx, x: number, y: number, width: number, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, scale);
  const step = 6.5 * scale;
  for (let gx = x; gx < x + width - 2; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, y - 3 * scale);
    ctx.lineTo(gx, y + 3 * scale);
    ctx.moveTo(gx - 2 * scale, y - 1.5 * scale);
    ctx.lineTo(gx + 2 * scale, y - 1.5 * scale);
    ctx.stroke();
  }
}

function label(ctx: Ctx, text: string, x: number, y: number, size = 9, color = PAL.text): void {
  ctx.fillStyle = color;
  ctx.font = size + 'px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function legend(ctx: Ctx, items: Array<[string, string]>, x: number, y: number): void {
  ctx.font = '9px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let cx = x;
  for (const [color, text] of items) {
    ctx.fillStyle = color;
    ctx.fillRect(cx, y - 3.5, 7, 7);
    ctx.fillStyle = PAL.muted;
    ctx.fillText(text, cx + 10, y);
    cx += 10 + ctx.measureText(text).width + 9;
  }
}

// ---- per-chapter scenes ----

// chap-1: 红笔在密卷上批改，红叉逐个增加，页面越来越乱 (goal 干净答案页 not reached)
function sceneChap1(ctx: Ctx, t: number): void {
  desk(ctx);
  lamp(ctx);
  sheet(ctx, 40, 12, 164, 84);
  // faint content: table grid (upper-left), formula dashes (middle), text rows (lower)
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.strokeRect(50 + c * 14, 22 + r * 11, 14, 11);
    }
  }
  for (let x = 50; x < 190; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x + 3, 58);
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    for (let x = 50; x < 190; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 78 + i * 9);
      ctx.lineTo(x + 2, 78 + i * 9);
      ctx.stroke();
    }
  }
  // four fixed page positions; red crosses accumulate across the loop
  const pos: Array<[number, number]> = [
    [56, 32],
    [122, 52],
    [64, 84],
    [166, 44],
  ];
  const seg = t * 4;
  const iActive = clamp(Math.floor(seg), 0, 3);
  const lp = clamp(seg - iActive, 0, 1);
  for (let i = 0; i < 4; i++) {
    const done = seg >= i + 1;
    const current = seg >= i && seg < i + 1 && lp > 0.5;
    if (done || current) {
      cross(ctx, pos[i][0], pos[i][1], 7, PAL.red);
    }
  }
  // red pen dips at the active position
  const dp = lp < 0.5 ? lp * 2 : (1 - lp) * 2;
  pen(ctx, pos[iActive][0], lerp(pos[iActive][1] - 30, pos[iActive][1] - 5, dp), -Math.PI / 2 + 0.35 * (1 - dp), PAL.red);
  label(ctx, '密卷', 44, 8, 9, PAL.muted);
  legend(ctx, [['#c43f52', '红叉 = 误差累积']], 40, 108);
}

// chap-2: 放大镜沿试卷逐行平移扫描，镜内小字变大清晰
function sceneChap2(ctx: Ctx, t: number): void {
  desk(ctx);
  sheet(ctx, 24, 14, 196, 88);
  const rowYs = [30, 44, 58, 72, 86];
  // small glyphs outside the lens stay small (ink)
  for (const ry of rowYs) {
    glyphRow(ctx, 36, ry, 176, 1, PAL.text);
  }
  // lens sweeps down row by row, then back up (continuous single motion)
  const u = (1 - Math.cos(2 * Math.PI * t)) / 2;
  const lensY = lerp(rowYs[0], rowYs[4], u);
  const lensX = 132;
  // magnified glyphs inside the lens (2.2x, blue = current region)
  ctx.save();
  ctx.beginPath();
  ctx.arc(lensX, lensY, 26 - 3, 0, Math.PI * 2);
  ctx.clip();
  for (const ry of rowYs) {
    if (Math.abs(ry - lensY) < 14) {
      glyphRow(ctx, lensX - 34, ry, 68, 2.2, PAL.blue);
    }
  }
  ctx.restore();
  lens(ctx, lensX, lensY, 26);
  label(ctx, '试卷', 26, 10, 9, PAL.muted);
  legend(ctx, [['#27446e', '镜片下放大']], 40, 114);
}

// chap-3: 铅笔在错题本上圈出集中错题
function sceneChap3(ctx: Ctx, t: number): void {
  desk(ctx);
  notebook(ctx, 42, 20, 130, 76);
  const singles: Array<[number, number]> = [
    [58, 40],
    [150, 34],
    [158, 70],
    [60, 74],
    [136, 52],
  ];
  const cluster: Array<[number, number]> = [
    [96, 46],
    [104, 54],
    [92, 58],
    [108, 44],
    [100, 62],
    [112, 54],
    [94, 50],
    [106, 58],
  ];
  for (const [mx, my] of singles) markDot(ctx, mx, my);
  for (const [mx, my] of cluster) markDot(ctx, mx, my);
  // one continuous circling gesture around the dense cluster (orange)
  const a = t * Math.PI * 4;
  ctx.strokeStyle = PAL.orange;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(102, 53, 18, 0, a);
  ctx.stroke();
  const tipX = 102 + 18 * Math.cos(a);
  const tipY = 53 + 18 * Math.sin(a);
  // pencil nib rides the circle, body trailing outward
  pen(ctx, tipX - 12 * Math.cos(a), tipY - 12 * Math.sin(a), a, PAL.envDark);
  // purple emphasis stroke marks the diagnosed weak region at loop end
  if (t > 0.85) {
    ctx.strokeStyle = PAL.purple;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(102, 53, 22, 17, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  highlighter(ctx, 186, 100, 0.2); // static prop: 荧光笔
  label(ctx, '数据册', 46, 16, 9, PAL.muted);
  legend(ctx, [['#d97706', '橙圈 = 薄弱题型']], 40, 114);
}

// chap-4: 试卷轻微抖动，同一道题在 √/× 间交替（时对时错）
function sceneChap4(ctx: Ctx, t: number): void {
  desk(ctx);
  // static props first: 笔 and 标准答案
  pen(ctx, 62, 96, 0.35, PAL.blue);
  sheet(ctx, 184, 40, 42, 34);
  tick(ctx, 205, 57, 7, PAL.green);
  // subject: the sheet wobbles (±3 deg, 2px horizontal swing)
  ctx.save();
  ctx.translate(122 + Math.sin(2 * Math.PI * t) * 2, 60);
  ctx.rotate(Math.sin(2 * Math.PI * t) * 0.05);
  sheet(ctx, -52, -34, 104, 68);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-40 + i * 16, -6);
    ctx.lineTo(-32 + i * 16, -6);
    ctx.strokeStyle = PAL.text;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // the same answer alternates green tick / red cross with the wobble phase
  if (t < 0.5) {
    tick(ctx, 32, -6, 7, PAL.green);
  } else {
    cross(ctx, 32, -6, 7, PAL.red);
  }
  ctx.restore();
  label(ctx, '试卷', 96, 18, 9, PAL.muted);
  label(ctx, '时对时错', 100, 100, 9, PAL.muted);
  legend(ctx, [['#228d5c', '对'], ['#c43f52', '错']], 40, 114);
}

// chap-5: 一支笔从题库册抽出一张同类题卡片，插进错题本稀疏栏，栏位渐满
function sceneChap5(ctx: Ctx, t: number): void {
  desk(ctx);
  notebook(ctx, 20, 18, 96, 80);
  // three card columns; the sparse column holds one lonely card + 凑齐线
  card(ctx, 28, 65, 14, 9, '#ffffff', PAL.envDark);
  card(ctx, 28, 74, 14, 9, '#ffffff', PAL.envDark);
  card(ctx, 28, 83, 14, 9, '#ffffff', PAL.envDark);
  card(ctx, 50, 74, 14, 9, '#ffffff', PAL.envDark);
  card(ctx, 50, 83, 14, 9, '#ffffff', PAL.envDark);
  card(ctx, 72, 83, 14, 9, PAL.env, PAL.envDark);
  // 凑齐线: where the next card should reach
  ctx.strokeStyle = PAL.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(72, 74);
  ctx.lineTo(86, 74);
  ctx.stroke();
  ctx.setLineDash([]);
  // 题库册 (closed book) + a card on top of the stack
  ctx.fillStyle = PAL.envDark;
  ctx.fillRect(184, 52, 26, 20);
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(184.5, 52.5, 25, 19);
  card(ctx, 214, 56, 14, 9, '#ffffff', PAL.envDark);
  // pen motion: rest -> pick card -> carry across -> drop -> back
  const seg = t * 100;
  let penX = 208;
  let penY = 86;
  let cardVisible = false;
  let cardX = 192;
  let cardY = 56;
  let columnGrown = false;
  if (seg < 14) {
    const e = easeInOutQuad(seg / 14);
    penX = lerp(208, 192, e);
    penY = lerp(86, 56, e);
  } else if (seg < 22) {
    penX = 192;
    penY = 56 - ((seg - 14) / 8) * 6;
    cardVisible = true;
  } else if (seg < 72) {
    const e = easeInOutQuad((seg - 22) / 50);
    cardX = lerp(192, 79, e);
    cardY = lerp(60, 64, e) - Math.sin(e * Math.PI) * 16;
    cardVisible = true;
    penX = cardX - 14;
    penY = cardY - 10;
  } else if (seg < 84) {
    const e = easeInOutQuad((seg - 72) / 12);
    cardX = 79;
    cardY = lerp(64, 74, e);
    cardVisible = e < 0.7;
    penX = 65;
    penY = cardY - 12 - e * 4;
    columnGrown = e >= 0.7;
  } else {
    const e = easeInOutQuad((seg - 84) / 16);
    penX = lerp(65, 208, e);
    penY = lerp(58, 86, e);
    columnGrown = true;
  }
  if (cardVisible) {
    card(ctx, cardX - 7, cardY - 4, 14, 9, PAL.blue, PAL.blue); // carried card
  }
  if (columnGrown) {
    card(ctx, 72, 74, 14, 9, PAL.blue, PAL.blue); // sparse column grows to the goal line
  }
  pen(ctx, penX, penY, 0.4, PAL.blue);
  label(ctx, '稀疏栏', 64, 26, 9, PAL.muted);
  label(ctx, '数据池', 180, 46, 9, PAL.muted);
  legend(ctx, [['#27446e', '蓝卡 = 同类题']], 40, 114);
}

// chap-6: 铅笔在"原答案"与三份参考答案之间来回核对，圈出可疑答案
function sceneChap6(ctx: Ctx, t: number): void {
  desk(ctx);
  sheet(ctx, 16, 34, 64, 56); // 原答案
  glyphRow(ctx, 24, 52, 40, 1, PAL.text);
  const keys: Array<[number, number]> = [
    [120, 44],
    [158, 40],
    [196, 46],
  ];
  for (const [kx, ky] of keys) {
    sheet(ctx, kx, ky, 34, 40);
  }
  // checking sequence: two agreeing keys get green ticks, the odd one gets a red circle
  if (t > 0.18) tick(ctx, keys[0][0] + 17, keys[0][1] + 20, 7, PAL.green);
  if (t > 0.38) tick(ctx, keys[1][0] + 17, keys[1][1] + 20, 7, PAL.green);
  if (t > 0.58) circleMark(ctx, keys[2][0] + 17, keys[2][1] + 20, 12, PAL.red);
  if (t > 0.78) circleMark(ctx, 48, 56, 14, PAL.red); // suspicious answer circled
  // pencil shuttles: 原答案 -> key1 -> key2 -> key3 -> 原答案
  const stops: Array<[number, number]> = [
    [48, 74],
    [137, 84],
    [175, 80],
    [213, 86],
    [48, 74],
  ];
  const seg = t * 5;
  const i = clamp(Math.floor(seg), 0, 4);
  const e = easeInOutQuad(clamp(seg - i, 0, 1));
  const nx = i === 4 ? 0 : i + 1;
  const px = lerp(stops[i][0], stops[nx][0], e);
  const py = lerp(stops[i][1], stops[nx][1], e);
  pen(ctx, px + 12, py, 0.6, PAL.envDark);
  label(ctx, '原答案', 20, 30, 9, PAL.muted);
  label(ctx, '参考答案', 120, 36, 9, PAL.muted);
  legend(ctx, [['#c43f52', '红圈 = 可疑']], 40, 114);
}

// chap-7: 一支笔快速翻动整本错题本，随后回停在贴了标签的重点页
function sceneChap7(ctx: Ctx, t: number): void {
  desk(ctx);
  notebook(ctx, 60, 24, 124, 76);
  // page stack edges
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(60 + 124 - i * 3, 24);
    ctx.lineTo(60 + 124 - i * 3, 100);
    ctx.stroke();
  }
  // page flips sweep right -> left, blue leading edge (pages flip blue)
  const flips = [0.1, 0.3, 0.5, 0.7];
  for (const f of flips) {
    const p = clamp((t - f) / 0.15, 0, 1);
    if (p > 0 && p < 1) {
      const sweep = easeInOutQuad(p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(60, 24, 124, 76);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60 + 124 - sweep * 124, 24, sweep * 124, 76);
      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60 + 124 - sweep * 124, 24);
      ctx.lineTo(60 + 124 - sweep * 124, 100);
      ctx.stroke();
      ctx.restore();
    }
  }
  // tagged key page: orange tag, pen rests pointing at it at the end
  if (t > 0.82) {
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(140, 18, 16, 8);
  }
  const atTag = t > 0.82;
  pen(ctx, atTag ? 134 : 214, atTag ? 46 : 70, atTag ? -0.5 : -1.1, PAL.blue);
  label(ctx, '数据册', 64, 20, 9, PAL.muted);
  label(ctx, '重点页', 128, 12, 9, PAL.orange);
  legend(ctx, [['#d97706', '橙签 = 重点页']], 40, 114);
}

// chap-8: 笔袋把文具一件件摆到桌面指定位置，摆好的文具落绿勾
function sceneChap8(ctx: Ctx, t: number): void {
  desk(ctx);
  const spots: Array<[number, number]> = [
    [48, 82],
    [118, 74],
    [188, 88],
  ];
  for (const [sx, sy] of spots) {
    ctx.strokeStyle = PAL.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  const placed: Array<boolean> = [t > 0.22, t > 0.42, t > 0.62];
  for (let i = 0; i < 3; i++) {
    if (!placed[i]) continue;
    const [ix, iy] = spots[i];
    if (i === 0) pen(ctx, ix - 8, iy + 4, 0.2, PAL.blue);
    if (i === 1) {
      ctx.fillStyle = PAL.envDark;
      ctx.fillRect(ix - 8, iy - 3, 16, 7); // eraser
    }
    if (i === 2) highlighter(ctx, ix - 10, iy, 0.25);
    tick(ctx, ix, iy - 14, 6, PAL.green); // green tick once placed
  }
  // purple pencil case moves spot to spot, then eases back
  const stops: Array<[number, number]> = [
    [14, 70],
    [48, 82],
    [118, 74],
    [188, 88],
    [14, 70],
  ];
  const seg = t * 5;
  const i = clamp(Math.floor(seg), 0, 4);
  const e = easeInOutQuad(clamp(seg - i, 0, 1));
  const nx = i === 4 ? 0 : i + 1;
  const bx = lerp(stops[i][0], stops[nx][0], e);
  const by = lerp(stops[i][1], stops[nx][1], e);
  ctx.fillStyle = PAL.purple;
  ctx.fillRect(bx - 14, by - 10, 28, 16);
  ctx.fillStyle = PAL.env;
  ctx.fillRect(bx - 14, by - 14, 28, 5);
  label(ctx, '笔袋', 16, 52, 9, PAL.muted);
  legend(ctx, [['#228d5c', '绿勾 = 已就位']], 40, 114);
}

// chap-9: 一支笔在错题本上挑题，被选中的题划入冲刺题单
function sceneChap9(ctx: Ctx, t: number): void {
  desk(ctx);
  notebook(ctx, 30, 20, 100, 80);
  const qs: Array<[number, number]> = [
    [42, 38],
    [42, 52],
    [42, 66],
  ];
  for (const [qx, qy] of qs) {
    glyphRow(ctx, qx, qy, 60, 0.9, PAL.text);
  }
  const rows: Array<boolean> = [t > 0.15, t > 0.4, t > 0.65];
  for (let i = 0; i < 3; i++) {
    if (rows[i]) {
      ctx.fillStyle = 'rgba(217,119,6,0.25)';
      ctx.fillRect(qs[i][0] - 4, qs[i][1] - 5, 70, 10);
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 1;
      ctx.strokeRect(qs[i][0] - 4, qs[i][1] - 5, 70, 10);
    }
  }
  // 冲刺题单 column on the right, green rows form as questions are chosen
  sheet(ctx, 160, 24, 66, 78);
  ctx.fillStyle = PAL.green;
  ctx.fillRect(164, 28, 58, 8);
  for (let i = 0; i < 3; i++) {
    if (rows[i]) {
      ctx.fillRect(164, 42 + i * 14, 40, 7);
    }
  }
  // pen moves down the questions one by one
  const stops: Array<[number, number]> = [
    [52, 30],
    [52, 44],
    [52, 58],
    [52, 72],
  ];
  const seg = t * 3;
  const i = clamp(Math.floor(seg), 0, 2);
  const e = easeInOutQuad(clamp(seg - i, 0, 1));
  const px = lerp(stops[i][0], stops[i + 1][0], e);
  const py = lerp(stops[i][1], stops[i + 1][1], e);
  pen(ctx, px + 12, py - 4, 0.5, PAL.envDark);
  highlighter(ctx, 124, 100, 0.35); // static prop: 荧光笔
  label(ctx, '数据册', 34, 16, 9, PAL.muted);
  label(ctx, 'RL 训练集', 160, 20, 9, PAL.green);
  legend(ctx, [['#d97706', '橙条 = 选中']], 40, 114);
}

// chap-10: 成绩单上的分数柱从同一起点生长，绿色柱最后最高（卡片内无数值）
function sceneChap10(ctx: Ctx, t: number): void {
  desk(ctx);
  sheet(ctx, 56, 26, 132, 74); // report card
  ctx.fillStyle = PAL.axis;
  ctx.fillRect(62, 32, 120, 8); // card header
  const bars: Array<[number, string]> = [
    [0.72, PAL.blue],
    [0.5, PAL.muted],
    [1, PAL.green],
  ];
  const bx = [78, 112, 146];
  for (let i = 0; i < 3; i++) {
    const g = easeOutCubic(clamp((t - i * 0.3) / 0.28, 0, 1));
    ctx.fillStyle = bars[i][1];
    ctx.fillRect(bx[i], 88 - bars[i][0] * 44 * g, 16, bars[i][0] * 44 * g);
  }
  ctx.strokeStyle = PAL.text;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(62, 88);
  ctx.lineTo(182, 88);
  ctx.stroke();
  label(ctx, '成绩单', 60, 22, 9, PAL.muted);
  legend(ctx, [['#27446e', '基线'], ['#68778f', '其他'], ['#228d5c', '本文方法']], 40, 114);
}

// 7 章版映射（§1 为合并后的引言与总览章，无类比动画；原欠优化区域章并入 §1）：
// chap-2=边界脆弱(抖动)、chap-3=覆盖稀疏(补样本)、chap-4=监督不可靠(核对)、
// chap-5=高潜力样本(挑选)、chap-6=分阶段训练(通读)、chap-7=成绩单(榜单)。
// 红笔/放大镜/圈划/笔袋场景保留于 legacy 键下仅作引用（未使用）。
const SCENES: Record<string, (ctx: Ctx, t: number) => void> = {
  'chap-2': sceneChap4,
  'chap-3': sceneChap5,
  'chap-4': sceneChap6,
  'chap-5': sceneChap9,
  'chap-6': sceneChap7,
  'chap-7': sceneChap10,
  legacy1: sceneChap1,
  legacy2: sceneChap2,
  legacy3: sceneChap3,
  legacy4: sceneChap8,
};

const LOOP_MS: Record<string, number> = {
  'chap-2': 3000,
  'chap-3': 3000,
  'chap-4': 3200,
  'chap-5': 3000,
  'chap-6': 2600,
  'chap-7': 2800,
};

export const AnaTheme: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const scene = SCENES[chapterId] ?? SCENES['chap-1'];
    const loopMs = LOOP_MS[chapterId] ?? 3000;
    const t0 = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (now: number) => {
      const t = ((now - t0) % loopMs) / loopMs;
      ctx.clearRect(0, 0, W, H);
      scene(ctx, t);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    if (reduced) {
      render(t0);
      canvas.classList.add('is-ready');
      return () => {};
    }
    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default AnaTheme;
