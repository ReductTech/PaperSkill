import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const C = {
  bg: '#fbf7ed',
  paper: '#fffdf7',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  wood: '#92400e',
};

const SCENE_LABELS = [
  '回看整卷',
  '压成索引',
  '滑动落笔窗',
  '移动视线',
  '卷走旧字',
  '跨过分页',
  '校准笔势',
  '选择笔尖',
  '放大小字',
  '同尺比较',
];

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 11, weight = 650) {
  ctx.fillStyle = color;
  ctx.font = (weight >= 700 ? 'bold ' : 'normal ') + size + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(value, x, y);
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#e2d7c5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 112);
  ctx.lineTo(W, 112);
  ctx.stroke();
}

function drawReference(ctx: CanvasRenderingContext2D, compact = false) {
  const w = compact ? 42 : 58;
  const h = compact ? 28 : 36;
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(9, 10, w, h, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#9fb0c8';
  ctx.lineWidth = 1;
  for (let y = 19; y < 10 + h - 4; y += 6) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(9 + w - 7, y);
    ctx.stroke();
  }
}

function drawTinyGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + 9, y + 2);
  ctx.moveTo(x + 5, y + 1);
  ctx.lineTo(x + 5, y + 10);
  ctx.moveTo(x + 1, y + 7);
  ctx.lineTo(x + 10, y + 7);
  ctx.stroke();
  ctx.restore();
}

function drawScroll(ctx: CanvasRenderingContext2D, recentStart = 7, separator = -1) {
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = '#cbbda6';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(18, 72, 214, 37, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8cab4';
  ctx.strokeStyle = C.wood;
  ctx.beginPath();
  ctx.ellipse(18, 90, 10, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const x = 31 + i * 16;
    if (i >= recentStart) {
      ctx.fillStyle = '#e7f4ed';
      ctx.fillRect(x - 2, 78, 15, 25);
    }
    drawTinyGlyph(ctx, x, 84, i >= recentStart ? C.green : '#9aa4b2', i >= recentStart ? 1 : 0.45);
  }
  if (separator >= 0) {
    const x = 31 + separator * 16;
    ctx.strokeStyle = C.blue;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 75);
    ctx.lineTo(x, 106);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 1);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-3, 1);
  ctx.quadraticCurveTo(0, 12, 3, 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 10);
  ctx.lineTo(x + 24, y + 24);
  ctx.stroke();
}

export function drawScrollAnalogyScene(ctx: CanvasRenderingContext2D, chapter: number, phase: number) {
  clearScene(ctx);
  const travel = easeInOutQuad(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
  text(ctx, SCENE_LABELS[chapter - 1], 78, 23, chapter === 1 ? C.red : chapter === 10 ? C.green : C.blue, 11, 750);

  if (chapter === 1) {
    drawReference(ctx);
    drawScroll(ctx, 12);
    const x = 35 + travel * 180;
    ctx.strokeStyle = 'rgba(196,63,82,0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(34, 67);
    ctx.lineTo(x, 67);
    ctx.stroke();
    drawBrush(ctx, x, 72, -0.18, C.red);
    return;
  }

  if (chapter === 2) {
    const x = 74 + travel * 92;
    const scale = 1 - travel * 0.42;
    ctx.save();
    ctx.translate(x, 65);
    ctx.scale(scale, scale);
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.fillRect(-38, -29, 76, 58);
    ctx.strokeRect(-38, -29, 76, 58);
    for (let y = -17; y <= 17; y += 8) {
      ctx.beginPath();
      ctx.moveTo(-27, y);
      ctx.lineTo(27, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = C.orange;
    ctx.strokeRect(162, 44, 47, 40);
    text(ctx, '256', 176, 69, C.orange, 12, 800);
    return;
  }

  if (chapter === 3) {
    drawReference(ctx);
    drawScroll(ctx, 7);
    const x = 120 + travel * 70;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x, 76, 58, 29);
    text(ctx, 'P 常驻', 13, 59, C.blue, 9, 700);
    return;
  }

  if (chapter === 4) {
    drawReference(ctx);
    drawScroll(ctx, 8);
    const x = travel < 0.5 ? 43 : 175;
    ctx.fillStyle = 'rgba(217,119,6,0.12)';
    ctx.beginPath();
    ctx.arc(x, x < 80 ? 29 : 88, 20, 0, Math.PI * 2);
    ctx.fill();
    drawMagnifier(ctx, x, x < 80 ? 29 : 88);
    return;
  }

  if (chapter === 5) {
    drawReference(ctx);
    drawScroll(ctx, 7);
    const x = 109 + travel * 68;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x, 76, 62, 29);
    text(ctx, '4 格', x + 19, 67, C.orange, 9, 800);
    return;
  }

  if (chapter === 6) {
    drawReference(ctx);
    drawScroll(ctx, 7, 8);
    const x = 143 + travel * 48;
    drawBrush(ctx, x, 75, -0.2, C.green);
    text(ctx, '页 1｜页 2', 150, 59, C.blue, 9, 750);
    return;
  }

  if (chapter === 7) {
    drawReference(ctx);
    drawScroll(ctx, 9);
    ctx.fillStyle = '#eef1f5';
    ctx.strokeStyle = C.line;
    ctx.fillRect(84, 34, 98, 28);
    ctx.strokeRect(84, 34, 98, 28);
    text(ctx, '编码器锁定', 100, 53, C.muted, 9, 750);
    drawBrush(ctx, 181 + travel * 10, 76 - travel * 8, -0.18, C.blue);
    return;
  }

  if (chapter === 8) {
    drawReference(ctx);
    panelNibCase(ctx);
    const x = 97 + travel * 89;
    drawBrush(ctx, x, 87, -0.05, C.purple);
    return;
  }

  if (chapter === 9) {
    drawReference(ctx);
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = '#cbbda6';
    ctx.fillRect(73, 58, 147, 46);
    ctx.strokeRect(73, 58, 147, 46);
    for (let i = 0; i < 15; i += 1) drawTinyGlyph(ctx, 80 + i * 9, 73, '#8b97ab', 0.7);
    drawMagnifier(ctx, 101 + travel * 88, 76);
    return;
  }

  ctx.fillStyle = C.paper;
  ctx.strokeStyle = '#cbbda6';
  ctx.fillRect(22, 50, 196, 22);
  ctx.strokeRect(22, 50, 196, 22);
  ctx.fillRect(22, 82, 196, 22);
  ctx.strokeRect(22, 82, 196, 22);
  ctx.fillStyle = C.red;
  ctx.fillRect(29, 57, 118, 8);
  ctx.fillStyle = C.green;
  ctx.fillRect(29, 89, 166, 8);
  const x = 28 + travel * 170;
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, 43);
  ctx.lineTo(x, 108);
  ctx.stroke();
}

function panelNibCase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.roundRect(74, 47, 145, 56, 6);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    const x = 96 + i * 48;
    ctx.fillStyle = i === 1 ? '#f5f3ff' : '#eef1f5';
    ctx.strokeStyle = i === 1 ? C.purple : C.line;
    ctx.beginPath();
    ctx.moveTo(x - 7, 64);
    ctx.lineTo(x + 7, 64);
    ctx.lineTo(x, 83);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export const ScrollAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const chapter = Math.max(1, Math.min(10, Number(chapterId.replace('chap-', '')) || 1));

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
      const phase = reduced ? 0.7 : ((now - startedAt) % 3000) / 3000;
      drawScrollAnalogyScene(ctx, chapter, phase);
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
  }, [chapter]);

  return <canvas ref={canvasRef} width={W} height={H} aria-label={'第 ' + chapter + ' 章的长卷誊写类比动画'} />;
};

export default ScrollAnalogy;
