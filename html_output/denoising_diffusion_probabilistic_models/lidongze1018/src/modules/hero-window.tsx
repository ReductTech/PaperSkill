import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// hero-window — the same fogged-window drawing style used by the hero contrast.
// moduleId "old" = one full-palm wipe, streaks + heavy residual fog (red accents).
// moduleId "new" = cloth in small regular circles, outdoor scene clearing (green/blue).

const W = 520;
const H = 220;

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

type Ctx = CanvasRenderingContext2D;

const WIN = { x: 56, y: 36, w: 408, h: 162 };

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
  ctx.moveTo(0, h - 6);
  ctx.lineTo(w, h - 6);
  ctx.stroke();
}

function drawWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = FRAME;
  roundRectPath(ctx, x, y, w, h, 8);
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
  const n = Math.round(6 + d * 20);
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(x + rnd() * w, y + rnd() * h, 6 + rnd() * 20, 0, Math.PI * 2);
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
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = '#d97706';
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
  ctx.fillStyle = '#21324a';
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
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.label, cx + 13, y);
    cx += 16 + ctx.measureText(it.label).width;
  });
  ctx.restore();
}

function drawOld(ctx: Ctx, now: number) {
  const D = 3.6;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, 0.4);
  drawFog(ctx, gx, gy, gw, gh, 0.85, 21);
  const lp = clamp(p / 0.5, 0, 1);
  const wx = gx + 12 + lp * (gw - 24);
  const bandY = gy + gh * 0.3;
  const bandH = gh * 0.44;
  ctx.save();
  ctx.beginPath();
  ctx.rect(gx + 10, bandY, Math.max(0, wx - gx - 10), bandH);
  ctx.clip();
  paintOutside(ctx, gx, gy, gw, gh, 0.5);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    const yy = bandY + bandH * (0.12 + i * 0.19);
    ctx.beginPath();
    ctx.moveTo(gx + 12, yy);
    ctx.lineTo(wx, yy + (i % 2 === 0 ? 4 : -4));
    ctx.stroke();
  }
  ctx.restore();
  const fogBack = clamp((p - 0.55) / 0.45, 0, 1);
  if (fogBack > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx + 10, bandY, Math.max(0, wx - gx - 10), bandH);
    ctx.clip();
    ctx.globalAlpha = fogBack * 0.85;
    ctx.fillStyle = FOG;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.restore();
  }
  drawCloth(ctx, wx, gy + gh * 0.52, 17, RED);
}

function drawNew(ctx: Ctx, now: number) {
  const D = 3.6;
  const p = (now % D) / D;
  clearScene(ctx, W, H);
  const { x, y, w, h } = WIN;
  const { gx, gy, gw, gh } = glassOf(x, y, w, h);
  const c = 0.4 + 0.55 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
  drawWindow(ctx, x, y, w, h);
  drawOutside(ctx, gx, gy, gw, gh, c);
  drawFog(ctx, gx, gy, gw, gh, 0.9 * (1 - c), 22);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const sx = gx + gw * (0.15 + 0.7 * t);
    const sy = gy + gh * (i % 2 === 0 ? 0.36 : 0.62);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.clip();
    paintOutside(ctx, gx, gy, gw, gh, c);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const cx = gx + gw * (0.15 + 0.7 * ((p * 2) % 1));
  const ang = p * Math.PI * 8;
  drawCloth(ctx, cx + Math.cos(ang) * 10, gy + gh * 0.5 + Math.sin(ang) * 10, 15, GREEN);
  ctx.save();
  ctx.fillStyle = GLASS_LINE;
  roundRectPath(ctx, gx, y + h + 4, gw, 6, 3);
  ctx.fill();
  ctx.fillStyle = BLUE;
  roundRectPath(ctx, gx, y + h + 4, gw * c, 6, 3);
  ctx.fill();
  ctx.restore();
}

export const HeroWindow: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [label] = useState(() => (moduleId === 'old' ? '一次性去噪' : '逐步去噪 DDPM'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const scene = moduleId === 'old' ? drawOld : drawNew;
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
  }, [moduleId]);

  return (
    <canvas
      id={`cv-hero-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={label}
    />
  );
};

export default HeroWindow;
