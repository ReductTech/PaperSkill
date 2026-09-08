import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 360;
const H = 176;
const C = {
  bg: '#f4efe4',
  paper: '#fffdf7',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  wood: '#92400e',
  oldPaper: '#dfd5c3',
};

function label(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 12, weight = 650) {
  ctx.fillStyle = color;
  ctx.font = (weight >= 700 ? 'bold ' : 'normal ') + size + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(value, x, y);
}

function drawReference(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(15, 14, 100, 58, 6);
  ctx.fill();
  ctx.stroke();
  label(ctx, '参考页 + 提示', 27, 33, C.blue, 11, 750);
  ctx.strokeStyle = '#9fb0c8';
  ctx.lineWidth = 1.2;
  for (let y = 43; y <= 61; y += 6) {
    ctx.beginPath();
    ctx.moveTo(27, y);
    ctx.lineTo(y === 55 ? 91 : 102, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 3);
  ctx.lineTo(x + 14, y + 3);
  ctx.moveTo(x + 9, y + 2);
  ctx.lineTo(x + 9, y + 14);
  ctx.moveTo(x + 3, y + 9);
  ctx.lineTo(x + 15, y + 9);
  ctx.moveTo(x + 5, y + 14);
  ctx.lineTo(x + 13, y + 14);
  ctx.stroke();
  ctx.restore();
}

function drawScroll(ctx: CanvasRenderingContext2D, old: boolean) {
  const y = 105;
  ctx.save();
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = '#cbbda6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(31, y, 306, 45, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d8cab4';
  ctx.strokeStyle = C.wood;
  ctx.beginPath();
  ctx.ellipse(31, y + 22, 13, 23, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(31, y + 22, 6, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 13; i += 1) {
    const x = 48 + i * 20;
    const isRecent = i >= 9;
    if (!old && isRecent) {
      ctx.fillStyle = '#e7f4ed';
      ctx.fillRect(x - 1, y + 8, 19, 28);
    }
    drawGlyph(ctx, x, y + 13, old ? C.red : isRecent ? C.green : '#9aa4b2', old ? 0.75 : isRecent ? 1 : 0.5);
  }

  if (old) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(45, y + 5);
    ctx.lineTo(314, y + 5);
    ctx.stroke();
  } else {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(224, y + 5, 91, 35, 5);
    ctx.stroke();
  }

  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.strokeRect(316, y + 9, 16, 27);
  ctx.restore();
}

function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, -33);
  ctx.lineTo(0, 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-4, 1);
  ctx.quadraticCurveTo(0, 17, 4, 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawScrollHeroScene(ctx: CanvasRenderingContext2D, moduleId: string, raw: number) {
  const progress = easeInOutQuad(raw < 0.82 ? raw / 0.82 : 1);
  const old = moduleId === 'old';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawReference(ctx);
  drawScroll(ctx, old);

  if (old) {
    const x = 52 + progress * 265;
    ctx.strokeStyle = 'rgba(196,63,82,0.28)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(52, 98);
    ctx.lineTo(x, 98);
    ctx.stroke();
    drawBrush(ctx, x, 101, -0.22, C.red);
    label(ctx, '每次落笔前，重扫全部旧稿', 126, 29, C.red, 12, 750);
    label(ctx, '工作区：Lₘ + T', 126, 50, C.red, 13, 800);
  } else {
    ctx.strokeStyle = 'rgba(39,68,110,0.32)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(107, 67);
    ctx.quadraticCurveTo(205, 68, 285, 103);
    ctx.stroke();
    ctx.setLineDash([]);
    const local = raw < 0.5 ? easeInOutQuad(raw * 2) : easeInOutQuad((1 - raw) * 2);
    drawBrush(ctx, 320 + local * 5, 102 - local * 10, -0.18, C.green);
    label(ctx, '原稿常驻，只看最近几字', 130, 29, C.green, 12, 750);
    label(ctx, '工作区：Lₘ + n', 130, 50, C.green, 13, 800);
  }

  label(ctx, old ? '全部输出历史' : '最近输出窗口', 228, 169, old ? C.red : C.green, 10, 700);
}

export const ScrollHero: React.FC<WidgetProps> = ({ moduleId }) => {
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
    const startedAt = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (now: number) => {
      const raw = reduced ? 0.72 : ((now - startedAt) % 3200) / 3200;
      drawScrollHeroScene(ctx, moduleId, raw);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label={moduleId === 'old' ? '标准全注意力在每次落笔前扫描全部旧稿的长卷示意' : 'R-SWA 保留原稿并只查看最近输出窗口的长卷示意'}
    />
  );
};

export default ScrollHero;
