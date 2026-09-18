import React, { useEffect, useRef } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 160;

const C = {
  field: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawPanel(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, 127, W, 33);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 127);
  ctx.lineTo(W, 127);
  ctx.stroke();
  roundedRect(ctx, 24, 29, 116, 62, 8, '#ffffff', C.border);
  ctx.fillStyle = C.dark;
  ctx.fillRect(42, 45, 80, 5);
  ctx.fillRect(42, 58, 55, 5);
  roundedRect(ctx, 411, 33, 112, 56, 8, '#ffffff', C.border);
}

function drawKnob(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, phase: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(-0.7 + phase * 1.4);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -11);
  ctx.stroke();
  ctx.restore();
}

function drawOld(ctx: CanvasRenderingContext2D, phase: number) {
  const x = 188 + phase * 242;
  ctx.strokeStyle = '#9aa9b1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(188, 96);
  ctx.lineTo(431, 96);
  ctx.stroke();
  drawKnob(ctx, x, 96, C.red, phase);
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(470, 96, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('任务分数', 467, 61);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText('属性仍不可见', 424, 119);
}

function drawNew(ctx: CanvasRenderingContext2D, phase: number) {
  const x = 185 + phase * 160;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(183, 96);
  ctx.lineTo(348, 96);
  ctx.lineTo(437, 96);
  ctx.stroke();
  drawKnob(ctx, x, 96, phase > 0.74 ? C.green : C.blue, phase);
  roundedRect(ctx, 286, 75, 70, 42, 7, '#ffffff', C.blue);
  ctx.fillStyle = C.blue;
  ctx.fillRect(298, 88, 45, 4);
  ctx.fillStyle = C.green;
  ctx.fillRect(298, 98, 45 * clamp(phase, 0, 1), 4);
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('z → probe', 467, 61);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText('读出目标属性', 407, 119);
}

export const HeroCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    const render = (time: number) => {
      const phase = reduceMotion ? 0.86 : (time / 2800) % 1;
      drawPanel(ctx);
      if (isNew) drawNew(ctx, phase);
      else drawOld(ctx, phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (!reduceMotion) raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (reduceMotion) render(0);
      else if (raf === null) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isNew]);

  return (
    <div className="hero-compare-widget">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={isNew ? '本文 probing 方法自动对照动画' : '传统任务分数方法自动对照动画'}
      />
      {isNew ? (
        <div className="hero-term-strip" aria-label="关键词和术语解释">
          <span><b>CLAP</b> 音频-文本对齐</span>
          <span><b>embedding</b> 512 维表示</span>
          <span><b>probe</b> 轻量读出器</span>
          <span><b>RT60 / LUFS / SC / RP</b> 四个目标</span>
          <span><b>R² / MAE / r</b> 三种证据</span>
        </div>
      ) : null}
    </div>
  );
};

export default HeroCompare;
