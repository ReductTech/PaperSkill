import { useEffect, useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const colors = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  paper: '#fffcf2',
};

type Drawing = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
type Hit = (x: number, y: number) => void;

function prepare(canvas: HTMLCanvasElement, width: number, height: number) {
  const context = setupCanvas(canvas, width, height);
  canvas.style.width = '100%';
  canvas.style.maxWidth = width + 'px';
  canvas.style.height = 'auto';
  canvas.style.marginInline = 'auto';
  return context;
}

interface StageProps {
  label: string;
  draw: Drawing;
  feedback: string;
  tone?: 'good' | 'bad' | 'neutral';
  children?: ReactNode;
  width?: number;
  height?: number;
  onPick?: Hit;
  onDrag?: Hit;
}

export function Stage({
  label, draw, feedback, tone = 'neutral', children, width = 640, height = 240, onPick, onDrag,
}: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = prepare(canvas, width, height);
    draw(context, width, height);
    canvas.classList.add('is-ready');
  }, [draw, width, height]);

  function locate(event: PointerEvent<HTMLCanvasElement>, handler: Hit) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * width / rect.width;
    const y = (event.clientY - rect.top) * height / rect.height;
    handler(Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y)));
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        width={width}
        height={height}
        style={{ display: 'block', touchAction: onDrag ? 'none' : 'auto', cursor: onPick || onDrag ? 'crosshair' : 'default' }}
        onPointerDown={event => {
          if (event.button !== 0) return;
          if (onPick) locate(event, onPick);
          if (onDrag) {
            event.currentTarget.setPointerCapture(event.pointerId);
            locate(event, onDrag);
          }
        }}
        onPointerMove={event => {
          if (onDrag && event.currentTarget.hasPointerCapture(event.pointerId)) locate(event, onDrag);
        }}
      />
      {children && (
        <div className="ctrl" onKeyDown={event => {
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            if (event.key.startsWith('Arrow')) event.stopPropagation();
          }
        }}>
          {children}
        </div>
      )}
      <div className={tone === 'neutral' ? 'feedback' : 'feedback ' + tone} aria-live="polite">{feedback}</div>
    </>
  );
}

export function rounded(
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
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function bench(ctx: CanvasRenderingContext2D, width: number, height: number) {
  rounded(ctx, 0, 0, width, height, 10, colors.bg);
  ctx.fillStyle = colors.light;
  ctx.fillRect(0, height - 26, width, 26);
  ctx.fillStyle = colors.dark;
  ctx.globalAlpha = .55;
  ctx.fillRect(0, height - 26, width, 1);
  ctx.globalAlpha = 1;
}

export function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  motif: 'leaf' | 'cross' | 'diamond',
  color: string,
  opacity = 1,
) {
  rounded(ctx, x + 2, y + 5, size, size, 7, colors.dark);
  rounded(ctx, x, y, size, size, 7, colors.paper, colors.light);
  rounded(ctx, x + size * .09, y + size * .09, size * .82, size * .82, 4, colors.paper, colors.line);
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.scale(size / 80, size / 80);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (motif === 'leaf') {
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-19, -11, 0, -29);
      ctx.quadraticCurveTo(19, -11, 0, 0);
      ctx.fill();
    }
  } else if (motif === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(25, 0);
    ctx.lineTo(0, 25);
    ctx.lineTo(-25, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-10, -10, 20, 20);
  } else {
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      rounded(ctx, -4, -26, 8, 22, 4, color);
    }
  }
  ctx.restore();
}

export function MovingCanvas({
  label, draw, width = 560, height = 140,
}: { label: string; draw: (ctx: CanvasRenderingContext2D, progress: number) => void; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = prepare(canvas, width, height);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let origin: number | undefined;
    function render(progress: number) {
      draw(context, progress);
      canvas?.classList.add('is-ready');
    }
    function tick(time: number) {
      origin ??= time;
      const phase = ((time - origin) % 3400) / 3400;
      const progress = (1 - Math.cos(phase * Math.PI * 2)) / 2;
      render(progress);
      frame = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    render(1);
    if (reduce) return;
    const disconnect = observeCanvas(canvas, () => {
      if (!frame) frame = requestAnimationFrame(tick);
    }, stop);
    return () => {
      disconnect();
      stop();
    };
  }, [draw, width, height]);

  return <canvas ref={ref} role="img" aria-label={label} width={width} height={height} style={{ display: 'block' }} />;
}

export function HeroComparison({ shared }: { shared: boolean }) {
  return (
    <MovingCanvas
      label={shared ? '共用印模的两块瓷砖保留同一纹样' : '独立估计的两块瓷砖出现纹样差异'}
      width={420}
      height={156}
      draw={(ctx, progress) => {
        bench(ctx, 420, 156);
        rounded(ctx, 63, 115, 294, 20, 8, colors.support);
        tile(ctx, 97, 40, 82, 'leaf', colors.blue, .62);
        tile(ctx, 233, 40, 82, shared ? 'leaf' : 'cross', shared ? colors.green : colors.red, .3 + .5 * progress);
        ctx.save();
        ctx.translate(274, 50 + progress * 20);
        rounded(ctx, -30, -7, 60, 14, 5, colors.support);
        rounded(ctx, -9, -27, 18, 23, 6, colors.support);
        rounded(ctx, -29, 1, 58, 7, 3, shared ? colors.green : colors.red);
        ctx.restore();
      }}
    />
  );
}

export function HeroOld() {
  return <HeroComparison shared={false} />;
}
