import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const COLORS = {
  bg: '#f5f8f0',
  paper: '#ffffff',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  paleBlue: '#e9eff8',
  paleGreen: '#e7f5ed',
  paleRed: '#fae9ec',
  paleOrange: '#fff0e8',
};

export const W = 1080;
export const H = 280;

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) => void;

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 12,
  fill?: string,
  stroke?: string,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function studioBase(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, height - 42);
  ctx.lineTo(width - 24, height - 42);
  ctx.stroke();
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = COLORS.ink,
  size = 16,
  align: CanvasTextAlign = 'left',
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = COLORS.blue) {
  const w = 122 * scale;
  const h = 78 * scale;
  roundedRect(ctx, x, y, w, h, 14 * scale, color, '#19304f');
  roundedRect(ctx, x + 18 * scale, y - 14 * scale, 35 * scale, 18 * scale, 5 * scale, color);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 67 * scale, y + 40 * scale, 27 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#19304f';
  ctx.lineWidth = 5 * scale;
  ctx.stroke();
  ctx.fillStyle = '#9db4ce';
  ctx.beginPath();
  ctx.arc(x + 67 * scale, y + 40 * scale, 13 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 104 * scale, y + 18 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFilter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width = 42,
  color = COLORS.green,
  alpha = 0.92,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundedRect(ctx, x, y, width, 82, 9, color, '#155f3d');
  ctx.fillStyle = COLORS.bg;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 41, Math.max(7, width * 0.22), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = COLORS.purple,
  quality = 1,
  labelSize = 14,
) {
  roundedRect(ctx, x, y, 126, 92, 8, '#ffffff', color);
  ctx.fillStyle = quality > 0.65 ? COLORS.paleGreen : COLORS.paleRed;
  ctx.fillRect(x + 11, y + 11, 104, 55);
  ctx.fillStyle = quality > 0.65 ? COLORS.green : COLORS.red;
  ctx.beginPath();
  ctx.arc(x + 63, y + 38, 12 + quality * 8, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, quality > 0.65 ? '目标成像' : '偏离目标', x + 63, y + 79, COLORS.ink, labelSize, 'center');
}

export function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = COLORS.blue) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: number,
  color: string,
  text: string,
  labelSize = 14,
) {
  roundedRect(ctx, x, y, width, 22, 7, '#eef2f6', COLORS.line);
  roundedRect(ctx, x, y, Math.max(8, width * Math.max(0, Math.min(1, value))), 22, 7, color);
  const labelY = y - 12 - Math.max(0, (labelSize - 14) / 2);
  label(ctx, text, x, labelY, COLORS.ink, labelSize);
}

export function drawLayers(ctx: CanvasRenderingContext2D, x: number, y: number, active: number[] = [], removed: number[] = []) {
  for (let i = 0; i < 12; i += 1) {
    const xx = x + i * 49;
    const isRemoved = removed.includes(i);
    const isActive = active.includes(i);
    roundedRect(
      ctx,
      xx,
      y,
      36,
      60,
      7,
      isRemoved ? COLORS.paleRed : isActive ? COLORS.paleGreen : COLORS.paleBlue,
      isRemoved ? COLORS.red : isActive ? COLORS.green : COLORS.blue,
    );
    label(ctx, String(i), xx + 18, y + 30, isRemoved ? COLORS.red : COLORS.ink, 13, 'center');
  }
}

export function drawAnalogy(ctx: CanvasRenderingContext2D, chapter: number, phase: number) {
  studioBase(ctx, W, H);
  const travel = (Math.sin(phase * Math.PI * 2) + 1) / 2;
  drawCamera(ctx, 80, 118, 0.92);
  drawFrame(ctx, 860, 100, COLORS.purple, chapter === 5 ? 1 - travel * 0.55 : 0.9, chapter === 1 ? 18 : 14);
  drawArrow(ctx, 235, 157, 835, 145, COLORS.line);
  const filterWidth = chapter === 4 ? 24 + travel * 48 : 46;
  const filterAlpha = chapter === 5 ? 0.2 + travel * 0.8 : 0.92;
  const filterX = chapter === 6 ? 390 + travel * 115 : 330 + travel * 250;
  drawFilter(ctx, filterX, 116, filterWidth, chapter === 9 ? COLORS.red : COLORS.green, filterAlpha);
  if ([1, 3, 6].includes(chapter)) {
    drawFilter(ctx, 390, 205, 35, COLORS.orange, 0.78);
    drawFilter(ctx, 445, 205, 35, COLORS.purple, 0.78);
  }
  if ([7, 8, 9].includes(chapter)) drawLayers(ctx, 300, 205, chapter === 8 ? [2, 8] : [], chapter === 9 ? [4, 5, 6, 7] : []);
  const captions: Record<number, string> = {
    1: '整机复制 → 只换滤镜', 2: '选择改装深度', 3: '旧滤镜保持不变', 4: '窄通道控制容量', 5: '从近透明状态开始',
    6: '一机身，多任务套件', 7: '只更新开放的旋钮', 8: '每层两个固定卡位', 9: '遮住层区间做消融', 10: '同一协议内比较',
  };
  label(ctx, captions[chapter], 540, 34, COLORS.ink, chapter === 1 ? 22 : 18, 'center');
}

export const CanvasStage: React.FC<{
  labelText: string;
  draw: DrawFn;
  height?: number;
  animate?: boolean;
}> = ({ labelText, draw, height = H, animate = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, height);
      // setupCanvas fixes the CSS height for an unscaled desktop canvas. Once a
      // narrower container constrains the width, let the browser derive height
      // from the intrinsic bitmap ratio so text and shapes are never squashed.
      canvas.style.height = 'auto';
      canvas.style.aspectRatio = `${W} / ${height}`;
    } catch {
      return;
    }
    let raf: number | null = null;
    const started = performance.now();
    const render = (now = performance.now()) => {
      const phase = ((now - started) % 3200) / 3200;
      drawRef.current(ctx, W, height, phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (animate) raf = requestAnimationFrame(render);
    };
    const drawFirstFrame = () => {
      drawRef.current(ctx, W, height, 0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const start = () => {
      if (animate) {
        if (raf === null) raf = requestAnimationFrame(render);
      } else {
        render();
      }
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    drawFirstFrame();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [animate, height, draw]);

  return <canvas ref={canvasRef} width={W} height={height} role="img" aria-label={labelText} />;
};

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="chip-row" role="group">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`chip ${option.value === value ? 'selected' : ''}`}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StepControls({ value, max, onChange, labels }: { value: number; max: number; onChange: (n: number) => void; labels: string[] }) {
  return (
    <div className="step-ctrl">
      <button type="button" className="tiny ghost" disabled={value === 0} onClick={() => onChange(value - 1)}>上一步</button>
      <span className="step-label"><b>{value + 1}</b> / {max + 1} · {labels[value]}</span>
      <button type="button" className="tiny" disabled={value === max} onClick={() => onChange(value + 1)}>下一步</button>
      <button type="button" className="tiny ghost" onClick={() => onChange(0)}>重置</button>
    </div>
  );
}

export const CameraKit: React.FC<WidgetProps> = () => (
  <CanvasStage labelText="共享相机与任务滤镜图例" draw={(ctx) => {
    studioBase(ctx, W, H);
    drawCamera(ctx, 300, 100);
    drawFilter(ctx, 500, 98, 46);
    drawFrame(ctx, 690, 92);
    drawArrow(ctx, 440, 140, 485, 140, COLORS.line);
    drawArrow(ctx, 560, 140, 675, 140, COLORS.line);
  }} />
);
