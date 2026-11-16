import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const color = {
  field: '#f5f8f0', pale: '#b8c9a7', outline: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', edge: '#d7deea',
  paper: '#fffef8',
};

export type Draw = (ctx: CanvasRenderingContext2D, progress: number) => void;
export function Stage({ draw, name, width = 760, height = 300, motion = false, onPointerDown, onPointerMove, onKeyDown }: {
  draw: Draw; name: string; width?: number; height?: number; motion?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLCanvasElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLCanvasElement>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paint = useRef(draw);
  paint.current = draw;
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const frame = (progress: number) => {
      ctx.clearRect(0, 0, width, height);
      rect(ctx, 0, 0, width, height, color.field);
      paint.current(ctx, progress);
      canvas.classList.add('is-ready');
    };
    let id = 0;
    let startedAt: number | null = null;
    const stop = () => {
      cancelAnimationFrame(id);
      id = 0;
    };
    const tick = (time: number) => {
      startedAt ??= time;
      const phase = Math.min(1, ((time - startedAt) % 3600) / 2200);
      frame(phase * phase * (3 - 2 * phase));
      id = requestAnimationFrame(tick);
    };
    const start = () => {
      if (motion && !media.matches && !id) id = requestAnimationFrame(tick);
    };
    refresh.current = () => { if (!id) frame(1); };
    frame(1);
    const disconnect = motion ? observeCanvas(canvas, start, stop) : () => {};
    return () => { stop(); disconnect(); refresh.current = () => {}; };
  }, [width, height, motion]);
  useEffect(() => refresh.current());
  return <canvas ref={ref} width={width} height={height} role={onKeyDown ? undefined : 'img'}
    aria-label={name} tabIndex={onKeyDown ? 0 : undefined}
    style={onPointerDown ? { cursor: onPointerMove ? 'grab' : 'pointer', touchAction: onPointerMove ? 'none' : 'auto' } : undefined}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onKeyDown={onKeyDown} />;
}

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke?: string, radius = 0) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
export function line(ctx: CanvasRenderingContext2D, from: number[], to: number[], hue: string, size = 2, dash: number[] = []) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = hue;
  ctx.lineWidth = size;
  ctx.setLineDash(dash);
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, ring?: string) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke(); }
}
export function label(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, hue = color.ink, size = 18, align: CanvasTextAlign = 'center') {
  ctx.font = '600 ' + size + 'px "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillStyle = hue; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y);
}
export function frameBox(ctx: CanvasRenderingContext2D, box: readonly number[], hue: string, dash: number[] = [], width = 3) {
  const [x1, y1, x2, y2] = box;
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = hue;
  ctx.lineWidth = width;
  ctx.strokeRect(x1, y1, Math.max(0, x2 - x1), Math.max(0, y2 - y1));
  ctx.restore();
}
export function apple(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, red = false) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(size / 32, size / 32);
  ctx.beginPath(); ctx.moveTo(0, -19);
  ctx.bezierCurveTo(-24, -32, -40, -10, -29, 12);
  ctx.bezierCurveTo(-19, 35, -8, 34, 0, 30);
  ctx.bezierCurveTo(8, 34, 20, 35, 29, 12);
  ctx.bezierCurveTo(40, -10, 24, -32, 0, -19);
  const fill = ctx.createLinearGradient(-20, -22, 17, 27);
  fill.addColorStop(0, red ? '#efba70' : '#b8cc77');
  fill.addColorStop(1, red ? '#b75e47' : '#667d4d');
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = red ? '#9c4e3d' : '#597347'; ctx.lineWidth = 1.5; ctx.stroke();
  line(ctx, [0, -20], [4, -35], color.wood, 3);
  ctx.beginPath(); ctx.ellipse(12, -30, 10, 4, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#76906a'; ctx.fill();
  ctx.restore();
}
export function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x + 3, y + 5, w, h, '#dce5d1', undefined, 12);
  rect(ctx, x, y, w, h, color.paper, color.pale, 12);
}
export function orchard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  card(ctx, x, y, w, h);
  line(ctx, [x + w * .08, y + h * .75], [x + w * .92, y + h * .75], color.pale, 1);
  const boxes = [0.23, 0.51, 0.78].map((position, index) => {
    const size = Math.min(w * .12, h * .24) * (index === 1 ? 1.1 : 1);
    const cx = x + w * position, cy = y + h * .54 + (index === 1 ? h * .06 : 0);
    apple(ctx, cx, cy, size, index === 1);
    return [cx - size * 1.12, cy - size * 1.18, cx + size * 1.12, cy + size * 1.04];
  });
  return boxes;
}

export function Choices<T extends string | number>({ label: title, entries, selected, change }: {
  label: string; entries: readonly (readonly [T, string])[]; selected: T; change: (value: T) => void;
}) {
  return <div role="group" aria-label={title} style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
    {entries.map(([key, caption]) => <button key={key} type="button" className="gs-choice" aria-pressed={key === selected}
      style={{ border:'1px solid ' + (key === selected ? color.blue : color.edge), color:key === selected ? '#fff' : color.ink,
        background:key === selected ? color.blue : color.paper, borderRadius:9, padding:'7px 12px', font:'inherit',
        fontSize:'0.95rem', fontWeight:key === selected ? 700 : 500, cursor:'pointer', maxWidth:'100%', textAlign:'left' }}
      onClick={() => change(key)}>{caption}</button>)}
  </div>;
}
export function Feedback({ tone, children }: { tone?: 'good' | 'bad'; children: ReactNode }) {
  return <div className={'feedback ' + (tone ?? '')} aria-live="polite" style={{ fontStyle:'normal' }}>{children}</div>;
}
export function Slider({ title, value, min, max, step, digits = 2, change }: {
  title: string; value:number; min:number; max:number; step:number; digits?:number; change:(v:number)=>void;
}) {
  return <div className="ctrl"><label style={{ flex:1, flexWrap:'wrap', gap:12 }}>
    {title} <span className="val">{value.toFixed(digits)}</span>
    <input type="range" min={min} max={max} step={step} value={value}
      onKeyDown={e => e.stopPropagation()} onChange={e => change(Number(e.target.value))} />
  </label></div>;
}
export function usePhoto(path: string) {
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = new Image();
    image.onload = () => setPhoto(image);
    image.onerror = () => setPhoto(null);
    image.src = path;
    return () => { image.onload = null; image.onerror = null; };
  }, [path]);
  return photo?.src === new URL(path, location.href).href ? photo : null;
}

export const fmt = (n: number, places = 2) => n.toFixed(places);
export const sigmoid = (x:number) => 1 / (1 + Math.exp(-x));
export const asset = (filename:string) => import.meta.env.BASE_URL + 'images/' + filename;
