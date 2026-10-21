import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// window-analogy — one recurring 擦窗 world (560x140) selected by chapterId.
// Every scene uses one subject + one verb + one goal, at most one short label.

const W = 560;
const H = 140;

const FIELD = '#f5f8f0';
const GLASS = '#eaf1fb';
const GLASS_LINE = '#d7deea';
const FOG = '#c4d2b6';
const FRAME = '#92400e';
const HILL = '#6fa96b';
const SUN = '#f07e47';
const TREE = '#76906a';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Ctx = CanvasRenderingContext2D;

const WIN = { x: 62, y: 26, w: 436, h: 98 };

function glassOf(x: number, y: number, w: number, h: number) {
  return { gx: x + 6, gy: y + 6, gw: w - 12, gh: h - 12 };
}

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = GLASS_LINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 5);
  ctx.lineTo(w, h - 5);
  ctx.stroke();
}

function drawWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = FRAME;
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = GLASS;
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  ctx.strokeStyle = GLASS_LINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
}

function paintOutside(ctx: Ctx, x: number, y: number, w: number, h: number, alpha: number) {
  const a = clamp(alpha, 0, 1);
  if (a <= 0) return;
  const r = Math.min(w, h);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.3, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HILL;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.4, x + w * 0.64, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FRAME;
  ctx.fillRect(x + w * 0.2 - 2, y + h * 0.58, 4, h * 0.42);
  ctx.fillStyle = TREE;
  ctx.beginPath();
  ctx.arc(x + w * 0.2, y + h * 0.56, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOutside(ctx: Ctx, x: number, y: number, w: number, h: number, clarity: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  paintOutside(ctx, x, y, w, h, clarity);
  ctx.restore();
}

function drawFog(ctx: Ctx, x: number, y: number, w: number, h: number, density: number, seed: number) {
  const d = clamp(density, 0, 1);
  if (d <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = 0.16 + 0.5 * d;
  ctx.fillStyle = FOG;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.45 * d;
  let s = seed * 9973 + 12345;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const n = Math.round(4 + d * 16);
  for (let i = 0; i < n; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    const pr = 5 + rnd() * 16;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawCloth(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r - 4);
  ctx.lineTo(x + r * 0.7, y - r * 1.7);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWipePath(ctx: Ctx, points: number[][], progress: number, color: string) {
  if (points.length < 2) return;
  const n = clamp(progress, 0, 1) * (points.length - 1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const f = clamp(n - (i - 1), 0, 1);
    if (f <= 0) break;
    ctx.lineTo(lerp(points[i - 1][0], points[i][0], f), lerp(points[i - 1][1], points[i][1], f));
  }
  ctx.stroke();
  ctx.restore();
}

function drawTarget(ctx: Ctx, x: number, y: number, label?: string) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = ORANGE;
    ctx.font = '700 12px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 28);
  }
  ctx.restore();
}

function drawSceneLabel(ctx: Ctx, text: string, x: number, y: number) {
  ctx.save();
  ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TEXT;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: Ctx, items: { label: string; color: string }[], x: number, y: number) {
  ctx.save();
  ctx.font = '12px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(cx + 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(it.label, cx + 13, y);
    cx += 16 + ctx.measureText(it.label).width;
  });
  ctx.restore();
}

function hash01(k: number) {
  const s = Math.sin(k * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// 1 · 一只手猛擦一大片雾，擦过处短暂清晰又被新雾盖回。
function scene1(ctx: Ctx, now: number) {
  const D = 2.8;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.9);
  drawFog(ctx, gx, gy, gw, gh, 0.82, 7);
  const wipeP = clamp(p / 0.5, 0, 1);
  const fogBack = clamp((p - 0.55) / 0.45, 0, 1);
  const bandY = gy + gh * 0.28;
  const bandH = gh * 0.46;
  const wipeX = gx + 12 + wipeP * (gw - 24);
  ctx.save();
  ctx.beginPath();
  ctx.rect(gx + 10, bandY, Math.max(0, wipeX - gx - 10), bandH);
  ctx.clip();
  paintOutside(ctx, gx, gy, gw, gh, 1 - fogBack);
  if (fogBack > 0) {
    ctx.globalAlpha = fogBack * 0.82;
    ctx.fillStyle = FOG;
    ctx.fillRect(gx, gy, gw, gh);
  }
  ctx.restore();
  drawCloth(ctx, wipeX, gy + gh * 0.5, 13, RED);
  drawSceneLabel(ctx, '擦不净', gx, y - 8);
}

// 2 · 8x8 网格上，手指沿行逐格点亮，格内清晰度不同。
function scene2(ctx: Ctx, now: number) {
  const D = 3.2;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.85);
  drawFog(ctx, gx, gy, gw, gh, 0.28, 3);
  const n = 8;
  const cw = gw / n;
  const ch = gh / n;
  const total = 64;
  const idx = Math.floor(p * total) % total;
  for (let k = 0; k <= idx; k++) {
    const r = Math.floor(k / n);
    const c = k % n;
    ctx.globalAlpha = 0.12 + 0.5 * hash01(k + 1);
    ctx.fillStyle = FOG;
    ctx.fillRect(gx + c * cw + 1, gy + r * ch + 1, cw - 2, ch - 2);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = GLASS_LINE;
  ctx.lineWidth = 1;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(gx + i * cw, gy);
    ctx.lineTo(gx + i * cw, gy + gh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx, gy + i * ch);
    ctx.lineTo(gx + gw, gy + i * ch);
    ctx.stroke();
  }
  const row = Math.floor(idx / n);
  const col = idx % n;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(gx + col * cw + 1, gy + row * ch + 1, cw - 2, ch - 2);
  drawCloth(ctx, gx + (col + 0.5) * cw, gy + (row + 0.5) * ch, 6, BLUE);
  drawSceneLabel(ctx, '逐格读', gx, y - 8);
}

// 3 · 同一时间基准：左边一次猛擦留红痕，右边小圈轻擦逐渐变清。
function scene3(ctx: Ctx, now: number) {
  const D = 3.4;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const lx = 34;
  const ly = 26;
  const lw = 226;
  const lh = 98;
  drawWindow(ctx, lx, ly, lw, lh);
  const lg = glassOf(lx, ly, lw, lh);
  drawOutside(ctx, lg.gx, lg.gy, lg.gw, lg.gh, 0.45);
  drawFog(ctx, lg.gx, lg.gy, lg.gw, lg.gh, 0.8, 2);
  const lp = clamp(p / 0.5, 0, 1);
  const lwx = lg.gx + 10 + lp * (lg.gw - 20);
  ctx.save();
  ctx.beginPath();
  ctx.rect(lg.gx + 8, lg.gy + lg.gh * 0.24, Math.max(0, lwx - lg.gx - 8), lg.gh * 0.5);
  ctx.clip();
  paintOutside(ctx, lg.gx, lg.gy, lg.gw, lg.gh, 0.5);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yy = lg.gy + lg.gh * (0.32 + i * 0.11);
    ctx.beginPath();
    ctx.moveTo(lg.gx + 10, yy);
    ctx.lineTo(lwx, yy + (i % 2 === 0 ? 3 : -3));
    ctx.stroke();
  }
  ctx.restore();
  drawCloth(ctx, lwx, lg.gy + lg.gh * 0.5, 11, RED);
  const rx = 300;
  const ry = 26;
  const rw = 226;
  const rh = 98;
  drawWindow(ctx, rx, ry, rw, rh);
  const rg = glassOf(rx, ry, rw, rh);
  drawOutside(ctx, rg.gx, rg.gy, rg.gw, rg.gh, 0.92);
  drawFog(ctx, rg.gx, rg.gy, rg.gw, rg.gh, 0.85 * (1 - clamp(p, 0, 1)), 4);
  const steps = Math.floor(clamp(p * 2, 0, 1) * 5);
  for (let s = 0; s < steps; s++) {
    const sx = rg.gx + rg.gw * (0.2 + 0.15 * s);
    const sy = rg.gy + rg.gh * (s % 2 === 0 ? 0.4 : 0.6);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.clip();
    paintOutside(ctx, rg.gx, rg.gy, rg.gw, rg.gh, 1);
    ctx.restore();
  }
  drawCloth(ctx, rg.gx + rg.gw * (0.15 + 0.7 * ((p * 2) % 1)), rg.gy + rg.gh * 0.5, 9, GREEN);
  drawSceneLabel(ctx, '分步擦', lx, ly - 8);
}

// 4 · 手腕高度决定按压力，水痕宽度随之变化。
function scene4(ctx: Ctx, now: number) {
  const D = 3.0;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.75);
  drawFog(ctx, gx, gy, gw, gh, 0.5, 6);
  const press = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
  const bandH = lerp(6, 34, press);
  const bandY = gy + gh * 0.5 - bandH / 2;
  const bandX = gx + 16;
  const bandW = gw - 32;
  ctx.save();
  roundRectPath(ctx, bandX, bandY, bandW, bandH, 5);
  ctx.clip();
  paintOutside(ctx, gx, gy, gw, gh, 0.35 + 0.5 * press);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 2;
  roundRectPath(ctx, bandX, bandY, bandW, bandH, 5);
  ctx.stroke();
  ctx.restore();
  const cx = gx + gw * 0.5;
  const cy = gy + gh * 0.5 - press * 22 - 6;
  drawCloth(ctx, cx, cy, 12, PURPLE);
  drawWipePath(
    ctx,
    [
      [cx, cy + 9],
      [cx, gy + gh * 0.5],
    ],
    1,
    PURPLE
  );
  drawSceneLabel(ctx, '按压力', gx, y - 8);
}

// 5 · 三种工具并排，手指依次点选，水痕细密程度不同。
function scene5(ctx: Ctx, now: number) {
  const D = 3.4;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const cols = [ORANGE, BLUE, PURPLE];
  const lines = [3, 5, 8];
  const active = Math.floor((p * 3) % 3);
  for (let i = 0; i < 3; i++) {
    const px = 22 + i * 174;
    const py = 22;
    const pw = 164;
    const ph = 104;
    drawWindow(ctx, px, py, pw, ph);
    const g = glassOf(px, py, pw, ph);
    drawOutside(ctx, g.gx, g.gy, g.gw, g.gh, 0.7);
    drawFog(ctx, g.gx, g.gy, g.gw, g.gh, 0.45, 8 + i);
    const n = lines[i];
    ctx.strokeStyle = cols[i];
    ctx.lineWidth = i === 0 ? 3 : i === 1 ? 2 : 1.2;
    for (let k = 0; k < n; k++) {
      const yy = g.gy + g.gh * (0.2 + (0.6 * k) / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(g.gx + 12, yy);
      ctx.lineTo(g.gx + g.gw - 12, yy);
      ctx.stroke();
    }
    ctx.fillStyle = cols[i];
    roundRectPath(ctx, g.gx + 10, g.gy + g.gh - 22, 30, 12, 4);
    ctx.fill();
  }
  const apx = 22 + active * 174;
  drawCloth(ctx, apx + 82, 18, 9, cols[active]);
  drawSceneLabel(ctx, '选工具', 22, 14);
}

// 6 · 抹布由中心向外一圈圈擦，中心先清晰、边缘后清晰。
function scene6(ctx: Ctx, now: number) {
  const D = 3.6;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.95);
  drawFog(ctx, gx, gy, gw, gh, 0.85, 9);
  const cx = gx + gw / 2;
  const cy = gy + gh / 2;
  const maxR = Math.min(gw, gh) * 0.5 + 8;
  const r = 8 + clamp(p, 0, 1) * (maxR - 8);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  paintOutside(ctx, gx, gy, gw, gh, 1);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  for (let k = 1; k <= 3; k++) {
    const rr = (maxR * k) / 4;
    if (rr > r) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  const ang = p * Math.PI * 6;
  drawCloth(ctx, cx + Math.cos(ang) * r * 0.75, cy + Math.sin(ang) * r * 0.75, 10, GREEN);
  drawSceneLabel(ctx, '由内向外', gx, y - 8);
}

// 7 · 同一处小擦法反复练习，每次落点略有不同。
function scene7(ctx: Ctx, now: number) {
  const D = 3.2;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.9);
  drawFog(ctx, gx, gy, gw, gh, 0.75 * (1 - clamp(p, 0, 1) * 0.85), 11);
  const sx = gx + gw * 0.42;
  const sy = gy + gh * 0.5;
  const passes = Math.floor(p * 8);
  ctx.save();
  ctx.strokeStyle = GREEN;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  for (let k = 0; k < passes; k++) {
    const off = ((k % 3) - 1) * 3;
    ctx.beginPath();
    ctx.moveTo(sx - 26, sy + off);
    ctx.lineTo(sx + 26, sy + off + ((k % 2) * 2 - 1) * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, 22, 0, Math.PI * 2);
  ctx.clip();
  paintOutside(ctx, gx, gy, gw, gh, 0.4 + 0.6 * clamp(p, 0, 1));
  ctx.restore();
  drawTarget(ctx, sx, sy);
  const sw = Math.sin(p * Math.PI * 10);
  drawCloth(ctx, sx + sw * 24, sy + sw * 3, 9, GREEN);
  drawSceneLabel(ctx, '反复练', gx, y - 8);
}

// 8 · 分层擦窗器（海绵头-刮条-伸缩杆）展开再合拢。
function scene8(ctx: Ctx, now: number) {
  const D = 3.6;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const bx = 90;
  const by = 22;
  const bw = 380;
  const bh = 96;
  ctx.save();
  ctx.globalAlpha = 0.3;
  drawWindow(ctx, bx, by, bw, bh);
  ctx.restore();
  const u = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
  const cx = W / 2;
  const cy = H * 0.55;
  const spongeW = 46;
  const spongeH = 30;
  const sgX = cx - 40 - u * 110;
  ctx.fillStyle = ORANGE;
  roundRectPath(ctx, sgX, cy - spongeH / 2, spongeW, spongeH, 6);
  ctx.fill();
  const sqW = 56;
  const sqH = 10;
  const sqX = cx - 10;
  ctx.fillStyle = BLUE;
  roundRectPath(ctx, sqX, cy - sqH / 2, sqW, sqH, 3);
  ctx.fill();
  const poleW = 90 + u * 60;
  const poleH = 8;
  const poX = cx + 40;
  ctx.fillStyle = PURPLE;
  roundRectPath(ctx, poX, cy - poleH / 2, poleW, poleH, 4);
  ctx.fill();
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sgX + spongeW, cy);
  ctx.lineTo(sqX, cy);
  ctx.moveTo(sqX + sqW, cy);
  ctx.lineTo(poX, cy);
  ctx.stroke();
  drawSceneLabel(ctx, '分层杆', bx, by - 8);
}

// 9 · 手指处理窗框角落残留水渍。
function scene9(ctx: Ctx, now: number) {
  const D = 3.0;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.9);
  drawFog(ctx, gx, gy, gw, gh, 0.3, 13);
  const drops = 6;
  const removed = clamp(p, 0, 1) * drops;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = BLUE;
  for (let k = 0; k < drops; k++) {
    if (k < removed) continue;
    const dx = gx + gw - 16 - (k % 3) * 12;
    const dy = gy + gh - 14 - Math.floor(k / 3) * 14;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(gx + gw - 44, gy + gh);
  ctx.lineTo(gx + gw, gy + gh - 44);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  const d = (p * 3) % 1;
  drawCloth(ctx, gx + gw - 12 - d * 24, gy + gh - 12 - d * 24, 8, GREEN);
  drawSceneLabel(ctx, '擦边角', gx, y - 8);
}

// 10 · 两块玻璃同起点竞赛，分步擦的一侧保持更清晰。
function scene10(ctx: Ctx, now: number) {
  const D = 3.4;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const prog = clamp(p / 0.85, 0, 1);
  const lx = 34;
  const ly = 26;
  const lw = 226;
  const lh = 98;
  drawWindow(ctx, lx, ly, lw, lh);
  const lg = glassOf(lx, ly, lw, lh);
  drawOutside(ctx, lg.gx, lg.gy, lg.gw, lg.gh, 0.3 + 0.65 * prog);
  drawFog(ctx, lg.gx, lg.gy, lg.gw, lg.gh, 0.9 * (1 - prog), 15);
  const barY = ly + lh + 2;
  ctx.fillStyle = GLASS_LINE;
  roundRectPath(ctx, lg.gx, barY, lg.gw, 5, 2);
  ctx.fill();
  ctx.fillStyle = GREEN;
  roundRectPath(ctx, lg.gx, barY, lg.gw * prog, 5, 2);
  ctx.fill();
  const rx = 300;
  const ry = 26;
  const rw = 226;
  const rh = 98;
  drawWindow(ctx, rx, ry, rw, rh);
  const rg = glassOf(rx, ry, rw, rh);
  const rProg = 0.3 + 0.35 * clamp(p / 0.4, 0, 1);
  drawOutside(ctx, rg.gx, rg.gy, rg.gw, rg.gh, rProg);
  drawFog(ctx, rg.gx, rg.gy, rg.gw, rg.gh, 0.9 * (1 - rProg) + 0.2, 16);
  ctx.fillStyle = GLASS_LINE;
  roundRectPath(ctx, rg.gx, barY, rg.gw, 5, 2);
  ctx.fill();
  ctx.fillStyle = RED;
  roundRectPath(ctx, rg.gx, barY, rg.gw * rProg, 5, 2);
  ctx.fill();
  drawCloth(ctx, lg.gx + lg.gw * (0.15 + 0.7 * ((p * 3) % 1)), lg.gy + lg.gh * 0.5, 9, GREEN);
  drawSceneLabel(ctx, '比清晰', lx, ly - 8);
}

const SCENES: Record<string, (ctx: Ctx, now: number) => void> = {
  'chap-1': scene1,
  'chap-2': scene2,
  'chap-3': scene3,
  'chap-4': scene4,
  'chap-5': scene5,
  'chap-6': scene6,
  'chap-7': scene7,
  'chap-8': scene8,
  'chap-9': scene9,
  'chap-10': scene10,
};

export const WindowAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [sceneName] = useState(() => `擦窗类比 ${chapterId}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const scene = SCENES[chapterId] || scene1;
    const tick = () => {
      scene(ctx, performance.now() / 1000);
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
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={sceneName}
    />
  );
};

export default WindowAnalogy;
