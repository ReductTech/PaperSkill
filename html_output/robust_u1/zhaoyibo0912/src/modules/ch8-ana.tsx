import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutBounce, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 类比动画（560×140，3.6 s 自动循环）：一只手把桌面上的工具一件件摆齐，
// 四件工具最终落在同一排的四个等距位置。单一运动主体 = 手（工具由手搬运）。

const W = 560;
const H = 140;
const LOOP = 3600;
const MOVE = LOOP / 4;

type ToolKind = 'photo' | 'original' | 'magnifier' | 'brush';

interface Tool {
  kind: ToolKind;
  from: { x: number; y: number };
  to: { x: number; y: number };
  tilt: number;
}

// 最终一排：照片、原片、放大镜、修复刷（等距）
const TOOLS: Tool[] = [
  { kind: 'photo', from: { x: 104, y: 52 }, to: { x: 150, y: 74 }, tilt: 0.5 },
  { kind: 'original', from: { x: 302, y: 104 }, to: { x: 255, y: 74 }, tilt: -0.6 },
  { kind: 'magnifier', from: { x: 468, y: 60 }, to: { x: 360, y: 74 }, tilt: 0.35 },
  { kind: 'brush', from: { x: 202, y: 98 }, to: { x: 465, y: 74 }, tilt: -0.45 },
];

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
  roundRectPath(ctx, x, y, w, h, 5);
  ctx.fillStyle = stateColor ? stateColor : '#d7deea';
  ctx.fill();
  const pad = 5;
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + pad, y + pad, cw, ch);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const px = x + pad + speck(i * 3 + 1) * cw;
    const py = y + pad + speck(i * 3 + 2) * ch;
    const size = 1 + speck(i * 3 + 3) * 1.5;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(px, py, size, size);
  }
}

function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, clarity: number) {
  const alpha = clamp(0.15 + 0.85 * clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.38, cy - r * 0.15, Math.max(1, r * 0.13), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.38, cy - r * 0.15, Math.max(1, r * 0.13), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
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

function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(r * 0.7, r * 0.7);
  ctx.lineTo(r * 1.7, r * 1.7);
  ctx.stroke();
  ctx.fillStyle = 'rgba(39,68,110,0.08)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(22, -6);
  ctx.lineTo(34, 0);
  ctx.lineTo(22, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y - 34);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 32);
  ctx.lineTo(x + 20, y - 32);
  ctx.lineTo(x + 11, y - 50);
  ctx.lineTo(x - 11, y - 50);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ---------------- 时间轴 ---------------- */

/** 第 i 件工具在本轮循环内的进度（0=还在原地，1=已归位）。 */
function windowLocal(u: number, i: number): number {
  return clamp(u * 4 - i, 0, 1);
}

function toolPos(tool: Tool, local: number): { x: number; y: number } {
  const p = easeOutBounce(clamp((local - 0.02) / 0.8, 0, 1));
  return { x: lerp(tool.from.x, tool.to.x, p), y: lerp(tool.from.y, tool.to.y, p) };
}

function toolTilt(tool: Tool, local: number): number {
  return lerp(tool.tilt, 0, clamp((local - 0.02) / 0.8, 0, 1));
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  tool: Tool,
  x: number,
  y: number,
  angle: number
) {
  if (tool.kind === 'magnifier') {
    drawMagnifier(ctx, x, y, 13, angle);
    return;
  }
  if (tool.kind === 'brush') {
    drawBrush(ctx, x - 16, y, angle);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (tool.kind === 'original') {
    drawPhoto(ctx, -20, -15, 40, 30, 0, '#228d5c');
    drawFace(ctx, 0, 0, 9, 1);
  } else {
    drawPhoto(ctx, -20, -15, 40, 30, 0.35);
    drawFace(ctx, 0, 0, 9, 0.5);
  }
  ctx.restore();
}

function handAt(u: number, idx: number): { x: number; y: number } {
  const tool = TOOLS[idx];
  const local = windowLocal(u, idx);
  const pos = toolPos(tool, local);
  const from = idx > 0 ? TOOLS[idx - 1].to : tool.from;
  const k = easeInOutQuad(clamp(local / 0.22, 0, 1));
  return { x: lerp(from.x, pos.x, k) + 24, y: lerp(from.y, pos.y, k) + 12 };
}

/* ---------------- 组件 ---------------- */

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      drawLamp(ctx, 58, 112);

      for (let i = 0; i < TOOLS.length; i++) {
        const local = windowLocal(u, i);
        const pos = toolPos(TOOLS[i], local);
        drawTool(ctx, TOOLS[i], pos.x, pos.y, toolTilt(TOOLS[i], local));
      }

      const idx = clamp(Math.floor(u * 4), 0, TOOLS.length - 1);
      const hand = handAt(u, idx);
      drawHand(ctx, hand.x, hand.y, -0.35);
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

export default Ch8Ana;
