import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', border: '#d7deea' };
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) { ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); }
export function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) { ctx.save(); ctx.fillStyle = C.light; ctx.fillRect(x + 5, y + 5, w, h); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.restore(); }
function leafPath(ctx: CanvasRenderingContext2D) { ctx.beginPath(); ctx.moveTo(-65, 22); ctx.bezierCurveTo(-75, -23, -18, -54, 65, -27); ctx.bezierCurveTo(55, 27, -6, 49, -65, 22); ctx.closePath(); }
export function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color: string = C.dark) { ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); leafPath(ctx); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-78, 31); ctx.lineTo(54, -22); ctx.moveTo(-31, 12); ctx.lineTo(-31, -16); ctx.moveTo(-1, 0); ctx.lineTo(2, 24); ctx.moveTo(23, -10); ctx.lineTo(23, -30); ctx.strokeStyle = '#ffffffa6'; ctx.stroke(); ctx.restore(); }
export function drawStencil(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, opacity = .55) { ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = opacity; ctx.fillStyle = C.blue; ctx.beginPath(); ctx.rect(-92, -54, 184, 108); ctx.moveTo(-65, 22); ctx.bezierCurveTo(-75, -23, -18, -54, 65, -27); ctx.bezierCurveTo(55, 27, -6, 49, -65, 22); ctx.closePath(); ctx.fill('evenodd'); ctx.globalAlpha = 1; ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.strokeRect(-92, -54, 184, 108); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-79, -41, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
export function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle = -.65, color: string = C.green) { ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = C.support; ctx.beginPath(); ctx.roundRect(-5, -57, 10, 42, 4); ctx.fill(); ctx.fillStyle = '#adb5bd'; ctx.fillRect(-6, -18, 12, 12); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(-8, 4, 0, 13); ctx.quadraticCurveTo(8, 4, 6, -6); ctx.closePath(); ctx.fill(); ctx.restore(); }
export function drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string = C.orange) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h); ctx.restore(); }
export function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r = 27) { ctx.save(); ctx.strokeStyle = C.support; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x + r * .7, y + r * .7); ctx.lineTo(x + r * 1.7, y + r * 1.7); ctx.stroke(); ctx.fillStyle = '#e3eff866'; ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) { ctx.save(); ctx.fillStyle = C.text; ctx.font = '18px sans-serif'; ctx.fillText(text, x, y); ctx.restore(); }
export function drawLegend(ctx: CanvasRenderingContext2D, items: Array<{ label: string; color: string }>, x: number, y: number) { items.slice(0, 3).forEach((item, i) => { ctx.fillStyle = item.color; ctx.fillRect(x + i * 120, y - 9, 12, 12); drawSceneLabel(ctx, item.label, x + i * 120 + 18, y + 3); }); }

type PaintCanvasProps = {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;
  width?: number; height?: number; animate?: boolean; ariaLabel?: string;
  onPointerDown?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerMove?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: React.PointerEventHandler<HTMLCanvasElement>;
};
export function PaintCanvas({ draw, width = 1080, height = 280, animate = false, ariaLabel = '交互机制示意', ...events }: PaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw); drawRef.current = draw;
  const paintRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = setupCanvas(canvas, width, height);
    canvas.style.width = '100%'; canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, running = false;
    const paint = (t = performance.now()) => { ctx.save(); drawRef.current(ctx, width, height, reduced ? 1500 : t); ctx.restore(); canvas.classList.add('is-ready'); };
    paintRef.current = () => paint();
    const tick = (t: number) => { paint(t); if (running) raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const start = () => { if (running) return; paint(); if (animate && !reduced) { running = true; raf = requestAnimationFrame(tick); } };
    paint(); const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); paintRef.current = null; };
  }, [width, height, animate]);
  useEffect(() => { paintRef.current?.(); }, [draw]);
  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} {...events} onPointerCancel={events.onPointerUp} style={{ display: 'block', maxWidth: '100%', width: '100%', height: 'auto', borderRadius: 8, touchAction: events.onPointerDown ? 'none' : 'auto', cursor: events.onPointerDown ? 'grab' : undefined }} />;
}

function scene(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, n: number, old = false) {
  clearScene(ctx, w, h);
  const t = (time % 3200) / 3200, wave = .5 - .5 * Math.cos(t * Math.PI * 2);
  drawPaper(ctx, 76, 17, 390, 106);
  const cx = 275, cy = 71;
  drawLeaf(ctx, cx, cy, .9, n === 1 || old ? C.light : C.dark);
  if (n === 1 || n === 0) {
    if (!old && n === 0) drawStencil(ctx, cx, cy, .89, .18);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(.9, .9);
    if (!old && n === 0) { leafPath(ctx); ctx.clip(); }
    ctx.strokeStyle = old || n === 1 ? '#c43f5270' : '#228d5c90'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(-65, 20); ctx.lineTo(-65 + 138 * wave, 20 - 43 * wave); ctx.stroke(); ctx.restore();
    drawBrush(ctx, cx - 58 + 124 * wave, cy + 18 - 39 * wave, .55, old || n === 1 ? C.red : C.green);
  } else if (n === 2) {
    drawFrame(ctx, cx - 80 - wave * 60, cy - 35 - wave * 8, 160 + wave * 120, 70 + wave * 16);
  } else if (n === 3) {
    drawStencil(ctx, cx, cy - 34 * (1 - wave), .92, .25 + .3 * wave);
  } else if (n === 4) {
    drawStencil(ctx, cx, cy, .9, .35);
    drawBrush(ctx, cx + 57, cy - 23 + 10 * wave, -.55, C.orange);
  } else if (n === 5) {
    drawStencil(ctx, cx + 64 * (1 - wave), cy, .9, .4);
  } else if (n === 6) {
    const a = -.7 + 2.6 * wave;
    drawBrush(ctx, cx + Math.cos(a) * 58, cy + Math.sin(a) * 25, a - .7, C.green);
  } else if (n === 7) {
    ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = C.blue; ctx.strokeRect(cx - 69, cy - 31, 138, 62); ctx.restore();
    const x = cx - 57 + wave * 114, y = cy + 20 - wave * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(.55); ctx.fillStyle = C.orange; ctx.fillRect(-3, -48, 6, 42); ctx.fillStyle = C.text; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(3, -6); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (n === 8) {
    ctx.save(); ctx.translate(0, -27 * wave); drawStencil(ctx, cx, cy, 1 + wave * .12, .55 - .23 * wave); ctx.restore();
  } else if (n === 9) {
    drawMagnifier(ctx, cx - 53 + wave * 107, cy - 12 + Math.sin(wave * Math.PI) * 19, 25);
  } else {
    ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(366, 102); ctx.lineTo(366 + wave * 42, 102 - wave * 7); ctx.stroke(); ctx.restore();
    drawBrush(ctx, 366 + wave * 42, 92 - wave * 7, .65, C.green);
  }
}
function Scene({ n, old = false }: { n: number; old?: boolean }) { return <PaintCanvas width={560} height={140} animate draw={(ctx, w, h, t) => scene(ctx, w, h, t, n, old)} ariaLabel="叶片遮版绘画类比" />; }
export function KitPreview() { return <Scene n={3} />; }
export function CamoOld() { return <Scene n={0} old />; }
export function CamoNew() { return <Scene n={0} />; }
export function CamoScene1() { return <Scene n={1} />; }
export function CamoScene2() { return <Scene n={2} />; }
export function CamoScene3() { return <Scene n={3} />; }
export function CamoScene4() { return <Scene n={4} />; }
export function CamoScene5() { return <Scene n={5} />; }
export function CamoScene6() { return <Scene n={6} />; }
export function CamoScene7() { return <Scene n={7} />; }
export function CamoScene8() { return <Scene n={8} />; }
export function CamoScene9() { return <Scene n={9} />; }
export function CamoScene10() { return <Scene n={10} />; }
