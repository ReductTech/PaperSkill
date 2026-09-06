import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
export { clamp };

export interface PaperWidgetProps { chapterId: string; moduleId: string }

export const PALETTE = {
  bg: '#f5f8f0', paper: '#fffdf7', light: '#b8c9a7', depth: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea', white: '#ffffff'
};

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
}

export function clearDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8eedf'; ctx.fillRect(0, h - 24, w, 24);
  ctx.strokeStyle = PALETTE.light; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h - 24); ctx.lineTo(w, h - 24); ctx.stroke();
}

export function drawManuscript(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone = PALETTE.blue) {
  ctx.save(); ctx.shadowColor = 'rgba(33,50,74,.12)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  roundedRect(ctx, x, y, w, h, 8); ctx.fillStyle = PALETTE.paper; ctx.fill(); ctx.restore();
  roundedRect(ctx, x, y, w, h, 8); ctx.strokeStyle = tone; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = PALETTE.light; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const yy = y + 24 + i * Math.max(14, (h - 38) / 4); ctx.beginPath(); ctx.moveTo(x + 16, yy); ctx.lineTo(x + w - 16 - (i % 2) * 18, yy); ctx.stroke(); }
}

export function drawTool(ctx: CanvasRenderingContext2D, x: number, y: number, tone = PALETTE.blue, kind: 'lens'|'stamp'|'brush'|'clip'|'tag' = 'lens') {
  ctx.save(); ctx.strokeStyle = tone; ctx.fillStyle = tone; ctx.lineWidth = 3;
  if (kind === 'lens') { ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 11, y + 12); ctx.lineTo(x + 27, y + 28); ctx.stroke(); }
  if (kind === 'stamp') { roundedRect(ctx, x - 14, y - 10, 28, 20, 4); ctx.stroke(); ctx.fillRect(x - 5, y - 28, 10, 18); }
  if (kind === 'brush') { ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 18, y + 14); ctx.lineTo(x + 15, y - 16); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 18, y + 14); ctx.lineTo(x - 24, y + 20); ctx.stroke(); }
  if (kind === 'clip') { ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 12, .2, Math.PI * 1.8); ctx.stroke(); }
  if (kind === 'tag') { roundedRect(ctx, x - 18, y - 11, 36, 22, 4); ctx.fill(); ctx.fillStyle = PALETTE.white; ctx.beginPath(); ctx.arc(x - 9, y, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

export function drawGuideLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, tone = PALETTE.blue, width = 3) {
  ctx.save(); ctx.strokeStyle = tone; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

export function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, tone = PALETTE.green) {
  ctx.save(); ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 5); ctx.lineTo(x + 7, y - 6); ctx.stroke(); ctx.restore();
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tone = PALETTE.ink, align: CanvasTextAlign = 'left') {
  ctx.save(); ctx.fillStyle = tone; ctx.font = '600 13px "Segoe UI", sans-serif'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.restore();
}

export function drawWrappedLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, tone = PALETTE.ink, align: CanvasTextAlign = 'center', lineHeight = 18) {
  ctx.save();
  ctx.fillStyle = tone;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const candidate = line + char;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  ctx.restore();
}

type PointerKind = 'down'|'move'|'up';
export function PaperCanvas({ width = 560, height = 260, draw, onPointer, ariaLabel = '交互画布' }: {
  width?: number; height?: number; draw: (ctx: CanvasRenderingContext2D, time: number) => void;
  onPointer?: (x: number, y: number, kind: PointerKind) => void; ariaLabel?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null); const drawRef = useRef(draw); drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    let raf: number | null = null;
    const tick = (time: number) => { drawRef.current(ctx, time); canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const start = () => { if (raf === null) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [width, height]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>, kind: PointerKind) => {
    if (!onPointer) return; const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * width / rect.width; const y = (e.clientY - rect.top) * height / rect.height;
    if (kind === 'down') e.currentTarget.setPointerCapture(e.pointerId); onPointer(x, y, kind);
  };
  return <canvas ref={ref} width={width} height={height} aria-label={ariaLabel} role="img"
    onPointerDown={(e) => point(e, 'down')} onPointerMove={(e) => point(e, 'move')} onPointerUp={(e) => point(e, 'up')}
    style={{ maxWidth: '100%', height: 'auto', touchAction: onPointer ? 'none' : 'auto' }} />;
}

export function Feedback({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue'|'green'|'red'|'orange' }) {
  const cls = tone === 'green' ? 'good' : tone === 'red' ? 'bad' : '';
  return <div className={`feedback ${cls}`} style={tone === 'orange' ? { borderLeftColor: PALETTE.orange, color: PALETTE.orange } : undefined}>{children}</div>;
}

export const CascadeVsUnified: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [phase, setPhase] = useState<'idle'|'running'|'done'>('idle'); const startRef = useRef(0); const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);
  const start = () => { startRef.current = performance.now(); setPhase('running'); timerRef.current = window.setTimeout(() => setPhase('done'), 2200); };
  const reset = () => { if (timerRef.current) window.clearTimeout(timerRef.current); setPhase('idle'); };
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearDesk(ctx, 560, 260); const p = phase === 'done' ? 1 : phase === 'running' ? clamp((time - startRef.current) / 2200, 0, 1) : 0;
    drawSceneLabel(ctx, '级联拆分', 137, 24, phase === 'done' ? PALETTE.red : PALETTE.ink, 'center');
    drawSceneLabel(ctx, '整页端到端', 423, 24, phase === 'done' ? PALETTE.green : PALETTE.ink, 'center');
    drawManuscript(ctx, 34, 40, 206, 152, phase === 'done' ? PALETTE.red : PALETTE.axis);
    drawManuscript(ctx, 320, 40, 206, 152, phase === 'done' ? PALETTE.green : PALETTE.axis);
    if (p > 0) { ctx.save(); ctx.strokeStyle = PALETTE.red; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { const yy = 76 + i * 32 + (i - 1) * p * 10; ctx.beginPath(); ctx.moveTo(56 + i * p * 9, yy); ctx.lineTo(210 - i * p * 6, yy); ctx.stroke(); } ctx.restore(); }
    drawGuideLine(ctx, 342, 78, 500, 78, phase === 'done' ? PALETTE.green : PALETTE.light, phase === 'done' ? 5 : 2);
    drawTool(ctx, 66 + 142 * easeInOutQuad(p), 124, phase === 'done' ? PALETTE.red : PALETTE.blue, 'lens');
    drawTool(ctx, 352 + 142 * easeInOutQuad(p), 124, phase === 'done' ? PALETTE.green : PALETTE.blue, 'lens');
    if (phase === 'done') { drawSceneLabel(ctx, '阅读顺序断裂', 137, 218, PALETTE.red, 'center'); drawSceneLabel(ctx, '整页路径保留', 423, 218, PALETTE.green, 'center'); }
  };
  const feedback = phase === 'idle' ? '从同一页开始，观察结构是否在处理中被打散。' : phase === 'running' ? '两边正在读取同一页。' : '级联方案可能把版面误差传给后续模块；端到端方案直接在整页上下文中生成结果。';
  return <div><PaperCanvas draw={draw} ariaLabel={`${chapterId}-${moduleId} 级联与端到端对照`} />
    <div className="ctrl" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button onClick={start} disabled={phase === 'running'}>{phase === 'done' ? '再次对照' : '开始对照'}</button><button onClick={reset}>重置</button></div>
    <Feedback tone={phase === 'done' ? 'green' : 'blue'}>{feedback}</Feedback></div>;
};

export default CascadeVsUnified;
