import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, 108, W, 22);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 108);
  ctx.lineTo(W, 108);
  ctx.stroke();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin = 0) {
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    const a = spin + (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawBikeUnit(ctx: CanvasRenderingContext2D, x: number, y: number, spin = 0, chainOk = true) {
  drawWheel(ctx, x, y, 15, spin);
  drawWheel(ctx, x + 49, y, 15, spin);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 23, y);
  ctx.lineTo(x + 16, y - 25);
  ctx.lineTo(x, y);
  ctx.moveTo(x + 23, y);
  ctx.lineTo(x + 39, y - 25);
  ctx.lineTo(x + 49, y);
  ctx.moveTo(x + 16, y - 25);
  ctx.lineTo(x + 39, y - 25);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(x + 23, y - 46, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 23, y - 40);
  ctx.lineTo(x + 30, y - 25);
  ctx.lineTo(x + 40, y - 19);
  ctx.moveTo(x + 29, y - 25);
  ctx.lineTo(x + 18, y - 7);
  ctx.stroke();
  ctx.strokeStyle = chainOk ? C.green : C.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.quadraticCurveTo(x + 17, y + (chainOk ? 2 : 9), x + 26, y + 2);
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text) {
  ctx.fillStyle = color;
  ctx.font = '700 11px "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
}

function drawWrench(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, jaw = 9) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(46, 0);
  ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-jaw, -9);
  ctx.lineTo(1, 0);
  ctx.lineTo(-jaw, 9);
  ctx.stroke();
  ctx.restore();
}

function drawChapter1(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = C.light;
  ctx.beginPath();
  ctx.moveTo(0, 108);
  ctx.lineTo(244, 58);
  ctx.lineTo(244, 108);
  ctx.closePath();
  ctx.fill();
  const travel = Math.min(p / 0.68, 1);
  drawBikeUnit(ctx, 28 + travel * 88, 94 - travel * 19, p * 12, p < 0.55);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(212, 55);
  ctx.lineTo(212, 31);
  ctx.lineTo(231, 38);
  ctx.lineTo(212, 44);
  ctx.stroke();
  label(ctx, p < 0.55 ? '记得经过' : '仍需判断', 142, 96, p < 0.55 ? C.blue : C.red);
}

function drawChapter2(ctx: CanvasRenderingContext2D, p: number) {
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(70, 108);
  ctx.lineTo(83, 83);
  ctx.lineTo(144, 83);
  ctx.lineTo(157, 108);
  ctx.stroke();
  drawWheel(ctx, 114, 72, 38);
  const angle = -1.2 + p * 2.4;
  const hx = 114 + Math.cos(angle) * 30;
  const hy = 72 + Math.sin(angle) * 30;
  ctx.fillStyle = 'rgba(217,119,6,0.18)';
  ctx.beginPath();
  ctx.moveTo(42, 32);
  ctx.lineTo(hx - 10, hy - 8);
  ctx.lineTo(hx + 10, hy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(42, 32, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p > 0.72 ? C.green : C.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(114, 72);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  label(ctx, p > 0.72 ? '找到证据' : '逐项检查', 161, 47, p > 0.72 ? C.green : C.blue);
}

function drawChapter3(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.arc(168, 75, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(168, 75, 6, 0, Math.PI * 2);
  ctx.fill();
  const angle = -0.7 + easeInOutQuad(p) * 1.25;
  drawWrench(ctx, 168, 75, angle);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(168, 75, 27, -0.25, 0.45);
  ctx.stroke();
  label(ctx, 'ρₜ + 局部证据', 21, 31, C.purple);
  label(ctx, p > 0.72 ? '评分输出 αₜ' : '提示评分中', 21, 49, p > 0.72 ? C.orange : C.muted);
}

function drawChapter4(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.arc(171, 73, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(171, 34);
  ctx.lineTo(171, 50);
  ctx.stroke();
  drawWrench(ctx, 171, 73, -0.85 + p * 0.85);
  label(ctx, p > 0.78 ? '对齐 ≠ 因果' : '比较证据', 25, 35, p > 0.78 ? C.green : C.blue);
}

function drawChapter5(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.fillRect(58, 24, 140, 78);
  ctx.strokeRect(58, 24, 140, 78);
  ctx.strokeStyle = C.dark;
  ctx.beginPath();
  ctx.moveTo(72, 81);
  ctx.quadraticCurveTo(111, 36, 154, 75);
  ctx.quadraticCurveTo(172, 91, 189, 54);
  ctx.stroke();
  const x = 67 + p * 116;
  ctx.fillStyle = 'rgba(217,119,6,0.2)';
  ctx.beginPath();
  ctx.moveTo(x, 22);
  ctx.lineTo(x - 27, 99);
  ctx.lineTo(x + 27, 99);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(x, 19, 7, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, '地图说明路况', 75, 119, C.blue);
}

function drawChapter6(ctx: CanvasRenderingContext2D, p: number) {
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(122, 83, 50, Math.PI, 0);
  ctx.stroke();
  const angle = Math.PI - easeInOutQuad(p) * Math.PI;
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(122, 83);
  ctx.lineTo(122 + Math.cos(angle) * 40, 83 - Math.sin(angle) * 40);
  ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(122, 83, 50, -0.45, 0);
  ctx.stroke();
  label(ctx, '证据 · 稳定 · 校验', 69, 112, p > 0.82 ? C.green : C.blue);
}

function drawChapter7(ctx: CanvasRenderingContext2D, p: number) {
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(76, 108);
  ctx.lineTo(91, 86);
  ctx.lineTo(153, 86);
  ctx.lineTo(168, 108);
  ctx.stroke();
  drawWheel(ctx, 122, 68, 39, p * Math.PI * 6);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(174, 48);
  ctx.lineTo(181, 55);
  ctx.lineTo(194, 41);
  ctx.stroke();
  label(ctx, '每次调用都更新 η', 64, 119, C.blue);
}

function drawChapter8(ctx: CanvasRenderingContext2D, p: number) {
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(126, 70, 83, 38, 0, 0, Math.PI * 2);
  ctx.stroke();
  const a = p * Math.PI * 2;
  drawBikeUnit(ctx, 101 + Math.cos(a) * 70, 73 + Math.sin(a) * 25, p * 12, true);
  ctx.fillStyle = C.green;
  ctx.fillRect(205, 31, 3, 25);
  ctx.fillRect(208, 31, 17, 11);
  label(ctx, '外部状态更新', 17, 22, C.blue);
}

function drawChapter9(ctx: CanvasRenderingContext2D, p: number) {
  const targetX = p < 0.5 ? 154 : 184;
  const jaw = p < 0.5 ? 8 : 13;
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.arc(154, 72, 12, 0, Math.PI * 2);
  ctx.arc(184, 72, 17, 0, Math.PI * 2);
  ctx.fill();
  drawWrench(ctx, targetX, 72, -0.08, jaw);
  label(ctx, p < 0.5 ? 'Alpine 参数' : 'Debian 参数', 25, 34, C.blue);
  label(ctx, '原则保持', 25, 52, C.green);
}

function drawChapter10(ctx: CanvasRenderingContext2D, p: number) {
  const eased = easeInOutQuad(p);
  const lanes = [44, 73, 102];
  const colors = [C.blue, C.green, C.support];
  const gains = [0.45, 0.92, 0.58];
  lanes.forEach((y, i) => {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, y + 8);
    ctx.lineTo(218, y + 8);
    ctx.stroke();
    const x = 30 + 168 * gains[i] * eased;
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 7);
    ctx.lineTo(x + 7, y + 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 4, y + 13, 4, 0, Math.PI * 2);
    ctx.arc(x + 4, y + 13, 4, 0, Math.PI * 2);
    ctx.stroke();
  });
  label(ctx, '同协议 · 同量纲', 80, 20, C.blue);
}

const drawers: Record<number, (ctx: CanvasRenderingContext2D, p: number) => void> = {
  1: drawChapter1,
  2: drawChapter2,
  3: drawChapter3,
  4: drawChapter4,
  5: drawChapter5,
  6: drawChapter6,
  7: drawChapter7,
  8: drawChapter8,
  9: drawChapter9,
  10: drawChapter10,
};

export const BikeAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const chapter = Number(chapterId.replace('chap-', '')) || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = `${W}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = 3000;

    const render = (now: number) => {
      const raw = reduced ? 0.82 : (now % duration) / duration;
      const phase = raw < 0.76 ? easeInOutQuad(raw / 0.76) : 1;
      clearScene(ctx);
      (drawers[chapter] || drawChapter1)(ctx, phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapter]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={`第 ${chapter} 章自行车维护类比动画`}
    />
  );
};

export default BikeAnalogy;
