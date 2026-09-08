import React, { useEffect, useRef } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export type PosterRole =
  | 'field'
  | 'desk'
  | 'shadow'
  | 'support'
  | 'current'
  | 'guidance'
  | 'success'
  | 'method'
  | 'failure'
  | 'input'
  | 'emphasis'
  | 'auxiliary'
  | 'text'
  | 'muted'
  | 'border';

export type PosterTool = 'loupe' | 'cursor' | 'pen' | 'knob' | 'stamp' | 'crop' | 'marker';

export type EvidenceLegendItem =
  | string
  | [string, string]
  | {
      label?: string;
      text?: string;
      color?: string;
      role?: PosterRole | string;
      [key: string]: unknown;
    };

export interface PosterFrame {
  time: number;
  progress: number;
  reducedMotion: boolean;
}

export interface PosterCanvasOptions {
  animate?: boolean;
  durationMs?: number;
  stableProgress?: number;
}

export const POSTER_COLORS: Record<PosterRole, string> = {
  field: '#f5f8f0',
  desk: '#b8c9a7',
  shadow: '#76906a',
  support: '#92400e',
  current: '#27446e',
  guidance: '#27446e',
  success: '#228d5c',
  method: '#228d5c',
  failure: '#c43f52',
  input: '#d97706',
  emphasis: '#d97706',
  auxiliary: '#7c3aed',
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
  radius = 4
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function posterColor(role: PosterRole | string): string {
  return POSTER_COLORS[role as PosterRole] ?? POSTER_COLORS.text;
}

export const semanticColor = posterColor;

export function clearDesk(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = posterColor('field');
  ctx.fillRect(0, 0, width, height);
  const deskY = Math.round(height * 0.76);
  ctx.fillStyle = posterColor('desk');
  ctx.fillRect(0, deskY, width, height - deskY);
  ctx.strokeStyle = posterColor('shadow');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, deskY + 0.5);
  ctx.lineTo(width, deskY + 0.5);
  ctx.stroke();
}

export function drawPoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  detailOrColor: number | boolean | string = 0.65,
  colorOrDetail: string | number | boolean = posterColor('current'),
  defectCount: number | boolean = 0
) {
  const detail = clamp(
    typeof detailOrColor === 'number'
      ? detailOrColor
      : typeof detailOrColor === 'boolean'
        ? (detailOrColor ? 1 : 0)
        : typeof colorOrDetail === 'number'
          ? colorOrDetail
          : typeof colorOrDetail === 'boolean'
            ? (colorOrDetail ? 1 : 0)
            : 0.65,
    0,
    1
  );
  const lineColor = typeof detailOrColor === 'string'
    ? detailOrColor
    : typeof colorOrDetail === 'string'
      ? colorOrDetail
      : posterColor('current');
  const defects = typeof defectCount === 'boolean' ? (defectCount ? 1 : 0) : Math.max(0, Math.min(3, defectCount));
  const margin = Math.max(4, Math.min(width, height) * 0.08);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = detail > 0.78 ? 3 : 2;
  roundedRect(ctx, x, y, width, height, Math.min(6, width * 0.06));
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.28 + detail * 0.55;
  ctx.fillStyle = lineColor;
  ctx.fillRect(x + margin, y + margin, width - margin * 2, Math.max(5, height * 0.2));
  ctx.fillStyle = posterColor('auxiliary');
  ctx.globalAlpha = 0.12 + detail * 0.32;
  ctx.fillRect(x + margin, y + height * 0.38, width * 0.48, height * 0.37);
  ctx.strokeStyle = lineColor;
  ctx.globalAlpha = 0.45 + detail * 0.5;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const yy = y + height * (0.43 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.61, yy);
    ctx.lineTo(x + width - margin - (i % 2) * width * 0.08, yy);
    ctx.stroke();
  }
  if (defects > 0) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = posterColor('failure');
    ctx.lineWidth = 2;
    for (let i = 0; i < defects; i += 1) {
      const dx = x + width * (0.3 + i * 0.2);
      const dy = y + height * (0.35 + (i % 2) * 0.35);
      ctx.beginPath();
      ctx.moveTo(dx - 5, dy - 5);
      ctx.lineTo(dx + 5, dy + 5);
      ctx.moveTo(dx + 5, dy - 5);
      ctx.lineTo(dx - 5, dy + 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawBriefCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  lineCountOrColor: number | string = 3,
  color = posterColor('current')
) {
  const lineCount = typeof lineCountOrColor === 'number' ? Math.max(1, Math.min(6, Math.round(lineCountOrColor))) : 3;
  const lineColor = typeof lineCountOrColor === 'string' ? lineCountOrColor : color;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.stroke();
  const gap = height / (lineCount + 1);
  for (let i = 0; i < lineCount; i += 1) {
    const yy = y + gap * (i + 1);
    ctx.fillStyle = i === 0 ? posterColor('input') : lineColor;
    ctx.beginPath();
    ctx.arc(x + 8, yy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = i === 0 ? 1 : 0.65;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, yy);
    ctx.lineTo(x + width - 7 - (i % 2) * 7, yy);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawProofFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color = posterColor('success'),
  broken = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(broken ? [8, 6] : []);
  roundedRect(ctx, x, y, width, height, 5);
  ctx.stroke();
  ctx.restore();
}

export function drawTool(ctx: CanvasRenderingContext2D, ...args: Array<number | string | boolean>) {
  const first = args[0];
  const kind = (typeof first === 'string' ? first : args[2]) as PosterTool;
  const x = Number(typeof first === 'string' ? args[1] : args[0]) || 0;
  const y = Number(typeof first === 'string' ? args[2] : args[1]) || 0;
  const remaining = typeof first === 'string' ? args.slice(3) : args.slice(3);
  const scaleValue = remaining.find((value) => typeof value === 'number');
  const scale = Math.max(0.25, typeof scaleValue === 'number' ? scaleValue : 1);
  const colorValue = remaining.find((value) => typeof value === 'string');
  const color = typeof colorValue === 'string' ? colorValue : posterColor(kind === 'loupe' || kind === 'stamp' ? 'auxiliary' : 'input');
  const activeValue = remaining.find((value) => typeof value === 'boolean');
  const active = typeof activeValue === 'boolean' ? activeValue : true;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 3 : 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'loupe') {
    ctx.beginPath();
    ctx.arc(0, 0, 13 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9 * scale, 9 * scale);
    ctx.lineTo(22 * scale, 22 * scale);
    ctx.stroke();
  } else if (kind === 'cursor') {
    ctx.beginPath();
    ctx.moveTo(-7 * scale, -12 * scale);
    ctx.lineTo(12 * scale, 3 * scale);
    ctx.lineTo(3 * scale, 5 * scale);
    ctx.lineTo(7 * scale, 15 * scale);
    ctx.lineTo(1 * scale, 17 * scale);
    ctx.lineTo(-3 * scale, 7 * scale);
    ctx.lineTo(-10 * scale, 13 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'pen' || kind === 'marker') {
    ctx.rotate(-0.72);
    ctx.fillRect(-3 * scale, -17 * scale, 6 * scale, 34 * scale);
    ctx.beginPath();
    ctx.moveTo(-3 * scale, 17 * scale);
    ctx.lineTo(3 * scale, 17 * scale);
    ctx.lineTo(0, 24 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'knob') {
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -11 * scale);
    ctx.stroke();
  } else if (kind === 'stamp') {
    roundedRect(ctx, -11 * scale, -12 * scale, 22 * scale, 19 * scale, 3 * scale);
    ctx.fill();
    ctx.fillRect(-16 * scale, 7 * scale, 32 * scale, 7 * scale);
  } else if (kind === 'crop') {
    const r = 14 * scale;
    ctx.beginPath();
    ctx.moveTo(-r, -r / 2);
    ctx.lineTo(-r, -r);
    ctx.lineTo(-r / 2, -r);
    ctx.moveTo(r / 2, r);
    ctx.lineTo(r, r);
    ctx.lineTo(r, r / 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawTargetMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  labelOrColor: string = '',
  colorOrProgress: string | number = posterColor('success'),
  progress = 1
) {
  const label = labelOrColor.startsWith('#') ? '' : labelOrColor;
  const color = labelOrColor.startsWith('#') ? labelOrColor : typeof colorOrProgress === 'string' ? colorOrProgress : posterColor('success');
  const amount = clamp(typeof colorOrProgress === 'number' ? colorOrProgress : progress, 0, 1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.25 + amount * 0.75;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x - 1, y + 5);
  ctx.lineTo(x + 8, y - 7);
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '600 11px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 17, y);
  }
  ctx.restore();
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = posterColor('text')
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawEvidenceLegend(
  ctx: CanvasRenderingContext2D,
  itemsOrText: ReadonlyArray<EvidenceLegendItem> | string,
  x: number,
  y: number
) {
  const items = typeof itemsOrText === 'string' ? [itemsOrText] : itemsOrText;
  ctx.save();
  ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  let cursorX = x;
  items.slice(0, 3).forEach((item) => {
    let label = '';
    let color = posterColor('muted');
    if (typeof item === 'string') {
      label = item;
    } else if (Array.isArray(item)) {
      color = item[0] || color;
      label = item[1] || '';
    } else {
      const entry = item as Exclude<EvidenceLegendItem, string | [string, string]>;
      label = String(entry.label ?? entry.text ?? '');
      color = entry.color ?? posterColor(String(entry.role ?? 'muted'));
    }
    if (!label) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cursorX + 3, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = posterColor('muted');
    ctx.fillText(label, cursorX + 10, y);
    cursorX += 17 + ctx.measureText(label).width;
  });
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = posterColor('current'),
  width = 2,
  dashed = false
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.5) * 8, y2 - Math.sin(angle - 0.5) * 8);
  ctx.lineTo(x2 - Math.cos(angle + 0.5) * 8, y2 - Math.sin(angle + 0.5) * 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  color = posterColor('border'),
  active = false
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 3 : 2;
  roundedRect(ctx, x, y, width, height, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? color : posterColor('text');
  ctx.font = `${active ? 700 : 600} 12px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.restore();
}

export function usePosterCanvas<T>(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, state: T, frame: PosterFrame) => void,
  state: T,
  options: PosterCanvasOptions = {}
) {
  const stateRef = useRef(state);
  const drawRef = useRef(draw);
  stateRef.current = state;
  drawRef.current = draw;
  const animate = options.animate ?? true;
  const durationMs = Math.max(400, options.durationMs ?? 3000);
  const stableProgress = clamp(options.stableProgress ?? 1, 0, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motion.matches;
    let visible = false;
    let raf: number | null = null;
    const startedAt = performance.now();

    const paint = (time: number, progress: number) => {
      drawRef.current(ctx, stateRef.current, { time, progress, reducedMotion });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const tick = (time: number) => {
      const progress = animate ? ((time - startedAt) % durationMs) / durationMs : stableProgress;
      paint(time, reducedMotion ? stableProgress : progress);
      if (visible && animate && !reducedMotion) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    const start = () => {
      visible = true;
      if (reducedMotion || !animate) paint(performance.now(), stableProgress);
      else if (raf === null) raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      visible = false;
      stop();
    };
    const onMotionChange = () => {
      reducedMotion = motion.matches;
      stop();
      if (visible) start();
    };

    paint(performance.now(), reducedMotion ? stableProgress : 0);
    const disconnect = observeCanvas(canvas, start, pause);
    motion.addEventListener?.('change', onMotionChange);
    return () => {
      stop();
      disconnect();
      motion.removeEventListener?.('change', onMotionChange);
    };
  }, [animate, canvasRef, durationMs, height, stableProgress, width]);
}

export const PosterKitWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => (
  <span hidden data-poster-kit={`${chapterId}-${moduleId}`} />
);

export default PosterKitWidget;
