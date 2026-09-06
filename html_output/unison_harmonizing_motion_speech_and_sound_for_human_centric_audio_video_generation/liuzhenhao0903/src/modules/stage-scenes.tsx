import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const PALETTE = {
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
  border: '#d7deea',
};

export function clearConsole(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawConsole(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.light;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(x + 10, y + 10, w - 20, 13);
  ctx.globalAlpha = 1;
}

export function drawFader(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, color = PALETTE.orange) {
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 70);
  ctx.stroke();
  const py = y + 70 * (1 - value);
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 12, py - 7, 24, 14, 5);
  ctx.fill();
  ctx.stroke();
}

export function drawMeter(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, color: string) {
  ctx.fillStyle = '#eef2f7';
  ctx.fillRect(x, y, 16, 70);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 68 * (1 - value), 12, 68 * value);
  ctx.strokeStyle = PALETTE.border;
  ctx.strokeRect(x, y, 16, 70);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = PALETTE.text) {
  ctx.fillStyle = color;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = PALETTE.border, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, value: number, color: string) {
  ctx.fillStyle = '#edf1f5';
  ctx.fillRect(x, y, w, 12);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * value, 12);
}

function sceneForChapter(ctx: CanvasRenderingContext2D, chapter: number, w: number, h: number) {
  drawConsole(ctx, 10, 9, w - 20, h - 18);
  if (chapter === 1) {
    line(ctx, 122, 34, 122, 108);
    label(ctx, '声学层次', 24, 42);
    bar(ctx, 24, 55, 78, 0.92, PALETTE.red);
    bar(ctx, 24, 78, 78, 0.28, PALETTE.purple);
    label(ctx, '时间对齐', 142, 42);
    line(ctx, 142, 72, 218, 72, PALETTE.border, 3);
    line(ctx, 162, 54, 162, 92, PALETTE.blue, 4);
    line(ctx, 202, 58, 202, 88, PALETTE.red, 5);
    ctx.setLineDash([3, 3]);
    line(ctx, 164, 98, 200, 98, PALETTE.red, 1.5);
    ctx.setLineDash([]);
  } else if (chapter === 2) {
    label(ctx, '语音流', 24, 49, PALETTE.green);
    label(ctx, '音效流', 24, 91, PALETTE.purple);
    line(ctx, 74, 44, 216, 44, PALETTE.green, 8);
    line(ctx, 74, 86, 216, 86, PALETTE.purple, 8);
    for (let x = 88; x <= 204; x += 29) line(ctx, x, 34, x, 96, PALETTE.border, 1.5);
  } else if (chapter === 3) {
    ctx.fillStyle = PALETTE.green; ctx.beginPath(); ctx.roundRect(24, 51, 72, 34, 6); ctx.fill();
    ctx.fillStyle = PALETTE.purple; ctx.beginPath(); ctx.roundRect(148, 51, 72, 34, 6); ctx.fill();
    label(ctx, '语音流', 38, 73, '#fff');
    label(ctx, '音效流', 162, 73, '#fff');
    line(ctx, 100, 58, 144, 58, PALETTE.green, 3);
    line(ctx, 144, 78, 100, 78, PALETTE.green, 3);
  } else if (chapter === 4) {
    drawFader(ctx, 82, 35, 0.46, PALETTE.green);
    drawFader(ctx, 164, 35, 0.54, PALETTE.purple);
    label(ctx, '语音门', 58, 116, PALETTE.green);
    label(ctx, '音效门', 140, 116, PALETTE.purple);
  } else if (chapter === 5) {
    label(ctx, '视频 tᵥ', 24, 48, PALETTE.blue);
    label(ctx, '音频 tₐ', 24, 91, PALETTE.green);
    line(ctx, 82, 43, 214, 43, PALETTE.border, 6);
    line(ctx, 82, 86, 214, 86, PALETTE.border, 6);
    ctx.fillStyle = PALETTE.orange; ctx.beginPath(); ctx.arc(180, 43, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.green; ctx.beginPath(); ctx.arc(132, 86, 8, 0, Math.PI * 2); ctx.fill();
    line(ctx, 140, 77, 171, 52, PALETTE.green, 2.5);
  } else if (chapter === 6) {
    [0, 1, 2].forEach(i => {
      ctx.fillStyle = i === 1 ? PALETTE.blue : '#e8edf4';
      ctx.strokeStyle = i === 1 ? PALETTE.text : PALETTE.border;
      ctx.lineWidth = i === 1 ? 2.5 : 1.5;
      ctx.beginPath(); ctx.roundRect(24 + i * 70, 43, 52, 43, 6); ctx.fill(); ctx.stroke();
      label(ctx, ['I', 'II', 'III'][i], 46 + i * 70, 69, i === 1 ? '#fff' : PALETTE.muted);
    });
    label(ctx, '同步  →  独立', 78, 109, PALETTE.blue);
  } else if (chapter === 7) {
    label(ctx, 'Lᵥ', 28, 52, PALETTE.orange);
    label(ctx, 'Lᵃ', 28, 92, PALETTE.blue);
    bar(ctx, 60, 42, 150, 1.0, PALETTE.orange);
    bar(ctx, 60, 82, 150, 0.67, PALETTE.blue);
  } else if (chapter === 8) {
    for (let i = 0; i < 4; i++) {
      const active = i === 2;
      ctx.fillStyle = active ? PALETTE.green : '#e8edf4';
      ctx.strokeStyle = active ? PALETTE.blue : PALETTE.border;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath(); ctx.roundRect(35 + i * 45, 52, 34, 30, 5); ctx.fill(); ctx.stroke();
    }
    line(ctx, 52, 91, 187, 91, PALETTE.green, 3);
    label(ctx, '路由选择', 93, 112, PALETTE.blue);
  } else if (chapter === 9) {
    ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(122, 68, 34, -2.5, 2.5); ctx.stroke();
    ctx.save(); ctx.translate(122, 68); ctx.rotate(-0.55); ctx.strokeStyle = PALETTE.orange; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(29, 0); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(122, 68, 9, 0, Math.PI * 2); ctx.fill();
    label(ctx, '生成方向', 92, 116, PALETTE.blue);
  } else {
    const values = [0.68, 0.82, 0.72, 0.94];
    values.forEach((v, i) => {
      const bh = 58 * v;
      ctx.fillStyle = i === 3 ? PALETTE.green : PALETTE.blue;
      ctx.fillRect(48 + i * 38, 101 - bh, 22, bh);
    });
    label(ctx, '同协议比较', 84, 117, PALETTE.blue);
  }
}

export const StageScenes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHero = chapterId === 'hero';
  const w = isHero ? 420 : 244;
  const h = isHero ? 170 : 130;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, w, h); } catch { return; }
    const draw = () => {
      clearConsole(ctx, w, h);
      if (isHero) {
        drawConsole(ctx, 12, 12, w - 24, h - 24);
        const old = moduleId === 'old';
        drawMeter(ctx, 96, 50, old ? 0.94 : 0.61, old ? PALETTE.red : PALETTE.green);
        drawMeter(ctx, 136, 50, old ? 0.25 : 0.57, old ? PALETTE.red : PALETTE.purple);
        line(ctx, 238, 88, 360, 88, PALETTE.border, 3);
        line(ctx, 278, 58, 278, 118, PALETTE.blue, 4);
        line(ctx, old ? 330 : 282, 64, old ? 330 : 282, 112, old ? PALETTE.red : PALETTE.green, 5);
        label(ctx, old ? '语音遮蔽' : '双流调和', 73, 142, old ? PALETTE.red : PALETTE.green);
        label(ctx, old ? '时间错位' : '时间对齐', 260, 142, old ? PALETTE.red : PALETTE.green);
      } else {
        const chapter = Number(chapterId.replace('chap-', '')) || 1;
        sceneForChapter(ctx, chapter, w, h);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => undefined);
    return () => disconnect();
  }, [chapterId, moduleId, isHero, w, h]);

  return <canvas ref={canvasRef} width={w} height={h} aria-label={isHero ? '传统方法与 Unison 的静态概念对比' : `第 ${chapterId.replace('chap-', '')} 章调音台静态概念图`} />;
};

export default StageScenes;
