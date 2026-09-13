import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 类比动画（560×140，3.4 s 自动循环）：一只手握修复笔在划痕上来回补色，
// 每补一笔抬眼对一下原片，划痕随循环推进逐渐消失。
// 单一运动主体 = 手 + 修复笔；原片副本是静态道具。

const W = 560;
const H = 140;
const LOOP = 3400;

/* ---------------- 绘图工具（局部实现，签名固定） ---------------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

/** 稳定的伪随机：同一序号每帧返回同一值，避免噪点闪烁。 */
function speck(i: number): number {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = stateColor ? stateColor : '#d7deea';
  ctx.fill();
  const pad = 6;
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + pad, y + pad, cw, ch);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const px = x + pad + speck(i * 3 + 1) * cw;
    const py = y + pad + speck(i * 3 + 2) * ch;
    const size = 1 + speck(i * 3 + 3) * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(px, py, size, size);
  }
  const cracks = Math.round(clamp(4 * d, 0, 4));
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < cracks; i++) {
    const sx = x + pad + speck(i * 7 + 40) * cw;
    const sy = y + pad + speck(i * 7 + 41) * ch;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 8 + speck(i * 7 + 42) * 16, sy + 6 + speck(i * 7 + 43) * 14);
    ctx.lineTo(sx + 14 + speck(i * 7 + 44) * 22, sy + 16 + speck(i * 7 + 45) * 20);
    ctx.stroke();
  }
}

function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, clarity: number) {
  const alpha = clamp(0.15 + 0.85 * clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.38, cy - r * 0.15, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.38, cy - r * 0.15, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  if (clarity >= 0.95) {
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 5, r * 0.45, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#76906a';
  roundRectPath(ctx, -11, -9, 22, 19, 6);
  ctx.fill();
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const fy = -6 + i * 6;
    ctx.beginPath();
    ctx.moveTo(6, fy);
    ctx.lineTo(19, fy - 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-9, -3.6);
  ctx.lineTo(-9, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#21324a';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ---------------- 时间轴：三笔补色 + 三次对原片 ---------------- */

const SCRATCH: Array<{ x: number; y: number }> = [
  { x: 252, y: 52 },
  { x: 270, y: 58 },
  { x: 292, y: 64 },
  { x: 312, y: 72 },
  { x: 330, y: 82 },
  { x: 342, y: 90 },
];

const PEN_KEYS: Array<{ u: number; x: number; y: number }> = [
  { u: 0.0, x: 258, y: 54 },
  { u: 0.1, x: 286, y: 60 },
  { u: 0.26, x: 218, y: 88 },
  { u: 0.38, x: 292, y: 62 },
  { u: 0.48, x: 312, y: 70 },
  { u: 0.64, x: 218, y: 88 },
  { u: 0.76, x: 318, y: 72 },
  { u: 0.86, x: 338, y: 84 },
  { u: 0.94, x: 244, y: 50 },
  { u: 1.0, x: 258, y: 54 },
];

function penAt(u: number): { x: number; y: number } {
  let i = 0;
  while (i < PEN_KEYS.length - 2 && u > PEN_KEYS[i + 1].u) i++;
  const a = PEN_KEYS[i];
  const b = PEN_KEYS[i + 1];
  const span = Math.max(1e-6, b.u - a.u);
  const k = easeInOutQuad(clamp((u - a.u) / span, 0, 1));
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
}

/* ---------------- 组件 ---------------- */

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let start = 0;
    let raf: number | null = null;

    const render = (u: number) => {
      clearScene(ctx, W, H);

      // 静态道具：立在旁边的原片副本（清晰人脸 = 目标）
      drawPhoto(ctx, 120, 30, 86, 62, 0, '#228d5c');
      drawFace(ctx, 163, 61, 13, 1);
      drawSceneLabel(ctx, '原片', 128, 22);

      // 正在修复的照片
      drawPhoto(ctx, 240, 30, 110, 80, 0.5);
      drawFace(ctx, 295, 70, 20, clamp(0.35 + 0.5 * u, 0, 0.85));

      // 划痕：随循环推进逐渐消失
      ctx.save();
      ctx.globalAlpha = clamp(1 - u, 0, 1);
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < SCRATCH.length; i++) {
        if (i === 0) ctx.moveTo(SCRATCH[i].x, SCRATCH[i].y);
        else ctx.lineTo(SCRATCH[i].x, SCRATCH[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // 修复笔 + 手：补一笔，抬眼对一下原片
      const tip = penAt(u);
      const before = penAt(Math.max(0, u - 0.012));
      const after = penAt(Math.min(1, u + 0.012));
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = len > 0.4 ? Math.atan2(-dy, -dx) : -Math.PI / 2;
      drawPencil(ctx, tip.x, tip.y, angle);
      drawHand(ctx, tip.x + 24 * Math.cos(angle), tip.y + 24 * Math.sin(angle), angle + 0.45);
    };

    const tick = (now: number) => {
      if (!start) start = now;
      const u = ((now - start) % LOOP) / LOOP;
      render(u);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const go = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, go, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch7Ana;
