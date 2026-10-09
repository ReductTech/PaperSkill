import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function wrapLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, color = C.ink) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  const chars = [...text];
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += 23;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function drawDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e7eedf';
  roundedPath(ctx, 18, 16, w - 36, h - 34, 18);
  ctx.fill();
  ctx.fillStyle = '#d9c2a5';
  ctx.fillRect(18, h - 25, w - 36, 9);
  ctx.fillStyle = C.wood;
  ctx.fillRect(18, h - 25, w - 36, 3);
}

function drawPiece(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, active = false, angle = 0) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(angle);
  ctx.translate(-size / 2, -size / 2);
  roundedPath(ctx, 0, 0, size, size, 9);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeStyle = active ? C.orange : C.dark;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.72, size * 0.28, size * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = active ? C.orange : '#e5a96f';
  ctx.fill();
  ctx.restore();
}

function smoothCycle(t: number) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
}

function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.blue;
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.lineTo(34, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const HeroRapf: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 520, 180); } catch { return; }
    const oldSide = moduleId === 'old';
    const draw = () => {
      drawDesk(ctx, 520, 180);
      const t = (performance.now() % 2800) / 2800;
      const travel = smoothCycle(t);
      for (let i = 0; i < 4; i++) {
        drawPiece(ctx, 72 + i * 92, 48, 72, i === 3 ? C.red : '#d9e6d2', oldSide && i === 3);
      }
      if (!oldSide) {
        ctx.fillStyle = C.blue;
        ctx.fillRect(112, 130, 280, 8);
        ctx.fillStyle = C.purple;
        ctx.fillRect(112, 144, 210, 6);
        drawPiece(ctx, 90 + travel * 160, 30, 62, C.green, true);
      } else {
        drawPiece(ctx, 250 - travel * 120, 36, 70, C.red, true, travel * 0.08);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [moduleId]);
  return <canvas id={`cv-hero-${moduleId}`} ref={ref} width={520} height={180} />;
};

export const AnaPuzzle: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const scene = Number(chapterId.replace(/\D/g, '')) || 1;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 560, 140); } catch { return; }
    const draw = () => {
      drawDesk(ctx, 560, 140);
      const t = (performance.now() % 3000) / 3000;
      const motion = smoothCycle(t);
      if (scene === 1) {
        drawPiece(ctx, 170 + motion * 180, 44, 62, C.red, true, motion * 0.1);
        drawPiece(ctx, 90, 40, 58, '#d9e6d2'); drawPiece(ctx, 390, 40, 58, '#e7c79d');
      } else if (scene === 2) {
        ctx.fillStyle = '#ffffff'; roundedPath(ctx, 100, 36, 92, 72, 12); ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = C.axis; ctx.lineWidth = 2; [48, 60, 72].forEach((yy) => { ctx.beginPath(); ctx.moveTo(116, yy); ctx.lineTo(174, yy); ctx.stroke(); });
        drawPiece(ctx, 342, 38, 58, '#d9e6d2');
        const lensX = 180 + motion * 138;
        const lensY = 76 - Math.sin(motion * Math.PI) * 12;
        drawMagnifier(ctx, lensX, lensY, -0.72 + motion * 0.16);
      } else if (scene === 3) {
        ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(120, 94); ctx.lineTo(120 + motion * 320, 94); ctx.stroke();
        for (let i = 0; i < 5; i++) drawPiece(ctx, 110 + i * 72, 44 - (i % 2) * 10, 52, i < 3 ? '#d9e6d2' : '#ebe2d3');
      } else if (scene === 4) {
        drawPiece(ctx, 145, 42, 64, '#d9e6d2'); drawPiece(ctx, 250, 42, 64, '#e7c79d');
        ctx.fillStyle = C.wood; ctx.fillRect(214, 44 + motion * 18, 16, 64);
      } else if (scene === 5) {
        ctx.strokeStyle = C.muted; ctx.setLineDash([6, 5]); ctx.strokeRect(245, 40, 64, 64); ctx.setLineDash([]);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(168 + motion * 78, 104); ctx.lineTo(192 + motion * 78, 70); ctx.stroke();
      } else if (scene === 6) {
        drawPiece(ctx, 245, 40, 64, C.green, true, motion * 0.18 - 0.09);
        ctx.strokeStyle = C.axis; ctx.strokeRect(241, 36, 72, 72);
      } else if (scene === 7) {
        drawPiece(ctx, 160, 38, 66, '#d9e6d2'); drawPiece(ctx, 275 + motion * 45, 38, 66, '#e7c79d');
        ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(274, 28); ctx.lineTo(274, 112); ctx.stroke();
      } else if (scene === 8) {
        drawPiece(ctx, 126, 42, 58, '#d9e6d2'); drawPiece(ctx, 374, 42, 58, '#e7c79d'); drawPiece(ctx, 250, 42 + motion * 14, 58, C.purple, true);
      } else if (scene === 9) {
        ctx.strokeStyle = C.wood; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(180, 70); ctx.lineTo(380, 70); ctx.stroke();
        ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(180 + motion * 170, 70, 16, 0, Math.PI * 2); ctx.fill();
        drawPiece(ctx, 360, 36, 58, '#d9e6d2');
      } else {
        for (let i = 0; i < 4; i++) {
          const x = 80 + motion * (320 + i * 18);
          drawPiece(ctx, x, 38 + i * 18, 42, i === 3 ? C.green : '#d9e6d2', i === 3);
        }
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [scene]);
  return <canvas id={`cv-${chapterId}-ana`} ref={ref} width={560} height={140} />;
};

export const Ch1NeighborStress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pressure: 0.35 });
  const raf = useRef<number | null>(null);
  const [pressure, setPressure] = useState(0.35);
  const feedback = pressure <= 0.25
    ? { text: '旧边界仍有余量，但相似新类尚未充分挑战它。', cls: 'good' }
    : pressure < 0.7
      ? { text: '边界开始向旧类移动；这不是均匀遗忘，而是相似邻类干扰。', cls: '' }
      : { text: '旧类拼片被新类槽位吸走，必须专门保护相邻边界。', cls: 'bad' };
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 300); } catch { return; }
    const draw = () => {
      drawDesk(ctx, 1080, 300);
      const p = stateRef.current.pressure;
      ctx.fillStyle = '#d9e6d2'; roundedPath(ctx, 90, 68, 330, 150, 24); ctx.fill();
      ctx.fillStyle = '#ead7c6'; roundedPath(ctx, 660, 68, 330, 150, 24); ctx.fill();
      const boundary = 445 + p * 260;
      ctx.strokeStyle = p > 0.7 ? C.red : C.blue; ctx.lineWidth = 5; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(boundary, 48); ctx.lineTo(boundary, 250); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) drawPiece(ctx, 120 + i * 38, 105 + (i % 2) * 30, 30, p > 0.5 && i > 3 ? C.red : '#b8c9a7');
      for (let i = 0; i < 7; i++) drawPiece(ctx, 700 + i * 38, 105 + (i % 2) * 30, 30, '#e7c79d');
      drawPiece(ctx, boundary - 18, 142, 38, C.orange, true, p * 0.18);
      ctx.fillStyle = C.axis; ctx.fillRect(760, 62, 250, 16);
      ctx.fillStyle = p > 0.7 ? C.red : p > 0.25 ? C.blue : C.green; ctx.fillRect(760, 62, 250 * p, 16);
      ctx.fillStyle = C.ink; ctx.font = 'bold 24px "Segoe UI", sans-serif'; ctx.fillText(p.toFixed(2), 920, 118);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={300} />
    <div className="ctrl"><label>相似压力 <span className="val">{pressure.toFixed(2)}</span></label><input type="range" min={0} max={100} value={Math.round(pressure * 100)} onInput={(e) => { const v = Number((e.target as HTMLInputElement).value) / 100; stateRef.current.pressure = v; setPressure(v); }} /></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

export const Ch2EmbeddingDrag: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const start = { x: 0.50, y: 0.50 };
  const targetRef = useRef(start);
  const renderRef = useRef({ ...start });
  const raf = useRef<number | null>(null);
  const [point, setPoint] = useState(start);
  const oldD = Math.hypot(point.x - 0.28, point.y - 0.38);
  const newD = Math.hypot(point.x - 0.74, point.y - 0.63);
  const feedback = Math.abs(oldD - newD) < 0.035
    ? { text: '两个锚点的距离接近，边界处最不稳定。', cls: '' }
    : oldD < newD
      ? { text: '当前特征更接近旧类文本锚点，分类会保留旧类。', cls: 'good' }
      : { text: '当前特征更接近新类锚点；若两者本来就相似，旧类会被吞掉。', cls: 'bad' };
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 340); } catch { return; }
    const oldAnchor = { x: 0.28, y: 0.38 };
    const newAnchor = { x: 0.74, y: 0.63 };
    const plot = { x: 60, y: 34, w: 600, h: 244 };
    const draw = () => {
      const target = targetRef.current;
      const current = renderRef.current;
      current.x = lerp(current.x, target.x, 0.24);
      current.y = lerp(current.y, target.y, 0.24);
      drawDesk(ctx, 1080, 340);
      ctx.strokeStyle = '#dfe7d8'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { const x = plot.x + (plot.w / 6) * i; ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke(); }
      for (let i = 1; i < 5; i++) { const y = plot.y + (plot.h / 5) * i; ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke(); }
      const old = { x: plot.x + oldAnchor.x * plot.w, y: plot.y + (1 - oldAnchor.y) * plot.h };
      const fresh = { x: plot.x + newAnchor.x * plot.w, y: plot.y + (1 - newAnchor.y) * plot.h };
      const p = { x: plot.x + current.x * plot.w, y: plot.y + (1 - current.y) * plot.h };
      const dOld = Math.hypot(current.x - oldAnchor.x, current.y - oldAnchor.y);
      const dNew = Math.hypot(current.x - newAnchor.x, current.y - newAnchor.y);
      const nearOld = dOld <= dNew;
      const mid = { x: (old.x + fresh.x) / 2, y: (old.y + fresh.y) / 2 };
      const boundaryAngle = Math.atan2(fresh.y - old.y, fresh.x - old.x) + Math.PI / 2;
      ctx.strokeStyle = 'rgba(104,119,143,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([7, 8]);
      ctx.beginPath(); ctx.moveTo(mid.x + Math.cos(boundaryAngle) * 120, mid.y + Math.sin(boundaryAngle) * 120); ctx.lineTo(mid.x - Math.cos(boundaryAngle) * 120, mid.y - Math.sin(boundaryAngle) * 120); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = nearOld ? C.blue : 'rgba(39,68,110,0.25)'; ctx.lineWidth = nearOld ? 7 : 4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(old.x, old.y); ctx.stroke();
      ctx.strokeStyle = !nearOld ? C.purple : 'rgba(124,58,237,0.25)'; ctx.lineWidth = !nearOld ? 7 : 4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(fresh.x, fresh.y); ctx.stroke();
      const ring = (q: {x:number;y:number}, color: string) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, 19, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(q.x, q.y, 13, 0, Math.PI * 2); ctx.fill(); };
      ring(old, C.blue); ring(fresh, C.purple);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = 'bold 18px "Microsoft YaHei", sans-serif'; ctx.fillText('旧类', old.x - 18, old.y - 28);
      ctx.fillStyle = C.purple; ctx.fillText('新类', fresh.x - 18, fresh.y - 28);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 760, 62, 250, 190, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      const maxD = Math.max(dOld, dNew, 0.01);
      ctx.fillStyle = C.blue; ctx.fillRect(810, 118, 150 * (dOld / maxD), 18);
      ctx.fillStyle = C.purple; ctx.fillRect(810, 168, 150 * (dNew / maxD), 18);
      ctx.fillStyle = nearOld ? C.green : C.red; ctx.beginPath(); ctx.arc(885, 218, 12, 0, Math.PI * 2); ctx.fill();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const startLoop = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const next = {
      x: clamp(((e.clientX - rect.left) / rect.width * 1080 - 60) / 600, 0.08, 0.92),
      y: clamp(1 - ((e.clientY - rect.top) / rect.height * 340 - 34) / 244, 0.10, 0.90),
    };
    targetRef.current = next;
    setPoint(next);
  };
  const reset = () => { targetRef.current = start; renderRef.current = { ...start }; setPoint(start); };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={340} style={{ cursor: 'grab' }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }} />
    <div className="ctrl"><button onClick={reset}>重置</button></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

export const Ch3PairStep: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const inside = step < 3;
  const feedback = step >= 5
    ? { text: '只保留阈值内的近邻对；候选集从5对收缩为3对。', cls: 'good' }
    : inside ? { text: '这一对进入相邻类别集 P，后续会接受铰链间隔约束。', cls: '' }
      : { text: '这一对距离太远，不进入修复集；强行纳入会增加计算并干扰分类。', cls: 'bad' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 300); } catch { return; }
    let rafId = 0;
    const paint = () => {
      drawDesk(ctx, 1080, 300);
      const gaps = [42, 68, 94, 136, 178];
      const scale = 2.65;
      const gate = 120 + 112 * scale;
      const activeIndex = step < 5 ? step : -1;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
      gaps.forEach((distance, i) => {
        const y = 54 + i * 45;
        const endX = 120 + distance * scale;
        const selected = distance < 112;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#dbe3ed'; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(600, y); ctx.stroke();
        const active = i === activeIndex;
        ctx.strokeStyle = active ? (selected ? C.orange : C.red) : selected ? C.blue : C.muted;
        ctx.lineWidth = active ? 8 : 5;
        ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(endX, y); ctx.stroke();
        if (active) {
          ctx.strokeStyle = selected ? 'rgba(240,126,71,0.28)' : 'rgba(196,63,82,0.25)';
          ctx.lineWidth = 16 + pulse * 6;
          ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(endX, y); ctx.stroke();
        }
        ctx.fillStyle = active ? (selected ? C.orange : C.red) : selected ? C.blue : C.muted;
        ctx.beginPath(); ctx.arc(endX, y, active ? 12 : 9, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(gate, 30); ctx.lineTo(gate, 268); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.font = 'bold 17px "Segoe UI", sans-serif'; ctx.fillText('α=0.65', gate - 25, 22);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 770, 62, 230, 160, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = 'bold 24px "Segoe UI", sans-serif'; ctx.fillText('P', 832, 116);
      ctx.fillStyle = C.ink; ctx.font = 'bold 38px "Segoe UI", sans-serif'; ctx.fillText('3 / 5', 842, 174);
      ctx.fillStyle = C.blue; ctx.fillRect(830, 194, 110, 8);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(paint);
    };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const startLoop = () => { if (!rafId) rafId = requestAnimationFrame(paint); };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => { stop(); disconnect(); ctx.clearRect(0, 0, 1080, 300); };
  }, [step]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={300} />
    <div className="ctrl"><button onClick={() => setStep(0)}>重置</button><button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>上一步</button><button onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 5}>{step === 5 ? '已完成' : '下一步'}</button></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

export const Ch4HingeMargin: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const startPoint = { x: 0.30, y: 0.64 };
  const targetRef = useRef(startPoint);
  const renderRef = useRef({ ...startPoint });
  const raf = useRef<number | null>(null);
  const [point, setPoint] = useState(startPoint);
  const dOld = Math.hypot(point.x - 0.28, point.y - 0.28);
  const dNew = Math.hypot(point.x - 0.72, point.y - 0.72);
  const margin = dOld - dNew + 0.14;
  const feedback = margin > 0.03 ? { text: '旧类仍然更靠近新类，铰链损失在推动它回到旧边界。', cls: 'bad' } : margin < -0.02 ? { text: '旧类已与相邻新类拉开间隔，不用继续过度调整。', cls: 'good' } : { text: '刚刚越过间隔线，修正量小而有效。', cls: '' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    const oldAnchor = { x: 0.28, y: 0.28 };
    const newAnchor = { x: 0.72, y: 0.72 };
    const plot = { x: 60, y: 34, w: 600, h: 238 };
    const draw = () => {
      const target = targetRef.current; const current = renderRef.current;
      current.x = lerp(current.x, target.x, 0.24); current.y = lerp(current.y, target.y, 0.24);
      drawDesk(ctx, 1080, 320);
      ctx.strokeStyle = '#dfe7d8'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { const x = plot.x + (plot.w / 6) * i; ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke(); }
      for (let i = 1; i < 5; i++) { const y = plot.y + (plot.h / 5) * i; ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke(); }
      const old = { x: plot.x + oldAnchor.x * plot.w, y: plot.y + (1 - oldAnchor.y) * plot.h };
      const fresh = { x: plot.x + newAnchor.x * plot.w, y: plot.y + (1 - newAnchor.y) * plot.h };
      const p = { x: plot.x + current.x * plot.w, y: plot.y + (1 - current.y) * plot.h };
      const currentMargin = Math.hypot(current.x - oldAnchor.x, current.y - oldAnchor.y) - Math.hypot(current.x - newAnchor.x, current.y - newAnchor.y) + 0.14;
      const color = currentMargin > 0.03 ? C.red : currentMargin < -0.02 ? C.green : C.blue;
      const dx = fresh.x - old.x; const dy = fresh.y - old.y; const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len; const ny = dx / len; const band = 18 + clamp(currentMargin, 0, 0.7) * 38;
      ctx.strokeStyle = currentMargin > 0 ? 'rgba(196,63,82,0.20)' : 'rgba(34,141,92,0.18)';
      ctx.lineWidth = band; ctx.beginPath(); ctx.moveTo(p.x + nx * 95, p.y + ny * 95); ctx.lineTo(p.x - nx * 95, p.y - ny * 95); ctx.stroke();
      ctx.lineCap = 'round'; ctx.setLineDash([8, 7]); ctx.lineWidth = 5;
      ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(old.x, old.y); ctx.stroke();
      ctx.strokeStyle = C.purple; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(fresh.x, fresh.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(old.x, old.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(fresh.x, fresh.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = 'bold 18px "Microsoft YaHei", sans-serif'; ctx.fillText('旧类', old.x - 18, old.y - 28);
      ctx.fillStyle = C.purple; ctx.fillText('新类', fresh.x - 18, fresh.y - 28);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 760, 62, 250, 180, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      ctx.fillStyle = color; ctx.font = 'bold 30px "Segoe UI", sans-serif'; ctx.fillText(currentMargin > 0.03 ? 'L > 0' : currentMargin < -0.02 ? 'L < 0' : 'L = 0', 835, 132);
      ctx.fillStyle = color; ctx.fillRect(825, 158, clamp(Math.abs(currentMargin) * 340 + 22, 22, 145), 16);
      ctx.fillStyle = C.muted; ctx.fillRect(825, 190, 80, 7);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const startLoop = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const next = {
      x: clamp(((e.clientX - rect.left) / rect.width * 1080 - 60) / 600, 0.08, 0.92),
      y: clamp(1 - ((e.clientY - rect.top) / rect.height * 320 - 34) / 238, 0.08, 0.92),
    };
    targetRef.current = next; setPoint(next);
  };
  const reset = () => { targetRef.current = startPoint; renderRef.current = { ...startPoint }; setPoint(startPoint); };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} style={{ cursor: 'grab' }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }} />
    <div className="ctrl"><button onClick={reset}>重置</button></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

export const Ch5GaussianSample: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ samples: 20 });
  const raf = useRef<number | null>(null);
  const [samples, setSamples] = useState(20);
  const feedback = samples < 20 ? { text: '少于论文设置的采样量；覆盖更稀疏。', cls: '' } : samples === 20 ? { text: '与论文实现一致：每个被选类别每次迭代增加20个特征。', cls: 'good' } : { text: '多于论文设置；教学上可见更密，但会放大计算预算。', cls: 'warn' };
  const points = React.useMemo(() => Array.from({ length: 40 }, (_, i) => ({ x: Math.cos(i * 2.399) * (0.12 + (i % 7) * 0.035), y: Math.sin(i * 2.399) * (0.18 + (i % 5) * 0.04) })), []);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    const draw = () => {
      drawDesk(ctx, 1080, 320);
      const n = stateRef.current.samples;
      const cx = 300, cy = 170;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 170, 92, -0.25, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(510, 130, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.red; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.moveTo(570, 42); ctx.lineTo(520, 278); ctx.stroke(); ctx.setLineDash([]);
      points.slice(0, n).forEach((p, i) => {
        ctx.fillStyle = i % 5 === 0 ? C.orange : C.blue; ctx.beginPath(); ctx.arc(cx + p.x * 340, cy + p.y * 190, 5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 760, 74, 240, 170, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = 'bold 44px "Segoe UI", sans-serif'; ctx.fillText(String(n), 850, 160);
      ctx.font = '18px "Microsoft YaHei", sans-serif'; ctx.fillStyle = C.muted; ctx.fillText('样本 / 类别', 820, 198);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [points]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} />
    <div className="ctrl"><label>采样数 <span className="val">{samples}</span></label><input type="range" min={5} max={40} step={5} value={samples} onInput={(e) => { const v = Number((e.target as HTMLInputElement).value); stateRef.current.samples = v; setSamples(v); }} /></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

export const Ch6TrainingSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const targetEpochRef = useRef(0);
  const renderEpochRef = useRef(0);
  const [epoch, setEpoch] = useState(0);
  const lr = epoch >= 10 ? '0.00001' : epoch >= 4 ? '0.0001' : '0.001';
  const feedback = epoch === 0 ? { text: '15个epoch即将开始，学习率为0.001。', cls: '' } : epoch < 4 ? { text: '适配器在当前任务上更新，CLIP保持冻结。', cls: '' } : epoch < 10 ? { text: '第4个epoch后学习率降为0.0001。', cls: 'warn' } : epoch < 15 ? { text: '第10个epoch后再降为0.00001。', cls: 'aux' } : { text: '固定线性适配器完成当前任务；结构规模不随任务增长。', cls: 'good' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    let rafId = 0;
    const snowflake = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); ctx.stroke(); }
    };
    const arrow = (x1: number, x2: number, y: number, active: boolean) => {
      ctx.strokeStyle = active ? C.green : C.axis; ctx.fillStyle = active ? C.green : C.axis; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 10, y - 6); ctx.lineTo(x2 - 10, y + 6); ctx.closePath(); ctx.fill();
    };
    const paint = () => {
      const currentEpoch = lerp(renderEpochRef.current, targetEpochRef.current, 0.18);
      renderEpochRef.current = currentEpoch;
      drawDesk(ctx, 1080, 320);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 72, 52, 190, 190, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#e7eedf'; roundedPath(ctx, 102, 88, 128, 98, 12); ctx.fill();
      ctx.fillStyle = C.dark; ctx.beginPath(); ctx.moveTo(112, 174); ctx.lineTo(150, 126); ctx.lineTo(180, 166); ctx.lineTo(202, 140); ctx.lineTo(220, 174); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(193, 108, 9, 0, Math.PI * 2); ctx.fill(); snowflake(236, 78, C.blue);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 302, 52, 190, 190, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      ctx.fillStyle = '#eef1f7'; roundedPath(ctx, 332, 86, 130, 104, 12); ctx.fill();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 6; ctx.lineCap = 'round';
      [114, 136, 158].forEach((yy, i) => { ctx.beginPath(); ctx.moveTo(352, yy); ctx.lineTo(i === 2 ? 428 : 444, yy); ctx.stroke(); }); snowflake(466, 78, C.blue);
      arrow(266, 298, 146, currentEpoch > 0.15); arrow(496, 536, 146, currentEpoch > 0.35);
      const adapterGlow = currentEpoch > 0 ? 0.55 + 0.2 * Math.sin(performance.now() / 320) : 0.2;
      ctx.fillStyle = '#eaf4ec'; roundedPath(ctx, 540, 68, 170, 156, 18); ctx.fill();
      ctx.strokeStyle = `rgba(34,141,92,${adapterGlow})`; ctx.lineWidth = currentEpoch > 0 ? 7 : 3; ctx.stroke();
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        ctx.fillStyle = currentEpoch / 15 > (row * 4 + col) / 16 ? C.green : '#cfd9d4';
        roundedPath(ctx, 566 + col * 28, 94 + row * 25, 19, 15, 4); ctx.fill();
      }
      ctx.fillStyle = C.green; ctx.font = 'bold 22px "Segoe UI", sans-serif'; ctx.fillText('A', 610, 204);
      ctx.fillStyle = C.blue; ctx.font = 'bold 17px "Microsoft YaHei", sans-serif'; ctx.fillText('冻结', 141, 40);
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 760, 48, 250, 210, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      for (let i = 0; i < 16; i++) {
        const x = 790 + i * 13.8; const passed = currentEpoch >= i;
        ctx.fillStyle = i >= 10 ? C.purple : i >= 4 ? C.orange : C.green; ctx.globalAlpha = passed ? 1 : 0.20;
        ctx.beginPath(); ctx.arc(x, 101, i === Math.round(currentEpoch) ? 7 : 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        if (i > 0) { ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, 101); ctx.lineTo(x - 2, 101); ctx.stroke(); }
      }
      const visualLr = currentEpoch >= 10 ? '0.00001' : currentEpoch >= 4 ? '0.0001' : '0.001';
      ctx.fillStyle = C.muted; ctx.font = '16px "Microsoft YaHei", sans-serif'; ctx.fillText('学习率', 840, 166);
      ctx.fillStyle = C.ink; ctx.font = 'bold 25px "Segoe UI", sans-serif'; ctx.fillText(visualLr, 830, 205);
      ctx.fillStyle = C.green; ctx.fillRect(806, 225, 150 * (currentEpoch / 15), 8);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(paint);
    };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const startLoop = () => { if (!rafId) rafId = requestAnimationFrame(paint); };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => { stop(); disconnect(); ctx.clearRect(0, 0, 1080, 320); };
  }, []);
  const changeEpoch = (value: number) => { targetEpochRef.current = clamp(value, 0, 15); setEpoch(clamp(value, 0, 15)); };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} />
    <div className="ctrl"><button onClick={() => changeEpoch(0)}>重置</button><button onClick={() => changeEpoch(epoch - 1)} disabled={epoch === 0}>上一步</button><button onClick={() => changeEpoch(epoch + 1)} disabled={epoch === 15}>{epoch === 15 ? '已完成' : '下一步'}</button></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

type FusionMode = 'new' | 'average' | 'rapf';
export const Ch7FusionModes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FusionMode>('rapf');
  const feedback = mode === 'new' ? { text: '旧知识稳，但新拼图几乎没接上。', cls: 'bad' } : mode === 'average' ? { text: '等权平均忽略逐参数重要性，接缝可能互相拖拽。', cls: 'warn' } : { text: '变化大的参数接收更多新知识，其余参数更多保留旧知识。', cls: 'good' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    let rafId = 0;
    const paint = () => {
        drawDesk(ctx, 1080, 320);
        drawPiece(ctx, 120, 80, 150, '#d9e6d2'); drawPiece(ctx, 260 + (mode === 'rapf' ? -18 : mode === 'average' ? -6 : 30), 80, 150, mode === 'new' ? C.red : mode === 'average' ? C.blue : '#e7c79d', mode === 'rapf');
        ctx.strokeStyle = mode === 'rapf' ? C.green : mode === 'average' ? C.blue : C.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(330, 62); ctx.lineTo(330, 248); ctx.stroke();
        const right = mode === 'new' ? [92, 18] : mode === 'average' ? [62, 62] : [78, 78];
        const labels = ['稳定', '可塑'];
        [0, 1].forEach((i) => {
          ctx.fillStyle = C.axis; ctx.fillRect(750, 84 + i * 70, 220, 18);
          ctx.fillStyle = i === 0 ? C.green : C.blue; ctx.fillRect(750, 84 + i * 70, 220 * (right[i] / 100), 18);
          ctx.fillStyle = C.ink; ctx.font = '17px "Microsoft YaHei", sans-serif'; ctx.fillText(labels[i], 750, 74 + i * 70);
        });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(paint);
    };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const start = () => { if (!rafId) rafId = requestAnimationFrame(paint); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); ctx.clearRect(0, 0, 1080, 320); };
  }, [mode]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} />
    <div className="ctrl">{(['new','average','rapf'] as FusionMode[]).map((m) => <button key={m} className={`chip ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>{m === 'new' ? '只保留新参数' : m === 'average' ? '等权平均' : 'RAPF融合'}</button>)}</div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

type NodeId = 'image-encoder' | 'adapter' | 'text-encoder' | 'neighbor' | 'gaussian' | 'hinge' | 'fusion';
const archNodes: Array<{ id: NodeId; label: string; x: number; y: number; role: string; state: string }> = [
  { id: 'image-encoder', label: '图像编码器', x: 70, y: 80, role: '冻结图像特征', state: '冻结' },
  { id: 'text-encoder', label: '文本编码器', x: 70, y: 210, role: '固定类名特征', state: '冻结' },
  { id: 'adapter', label: '线性适配器', x: 270, y: 80, role: '唯一可训练层', state: '训练' },
  { id: 'neighbor', label: '邻居选择', x: 470, y: 210, role: '按文本距离筛选', state: '规则' },
  { id: 'gaussian', label: '高斯采样', x: 470, y: 80, role: '生成旧类特征', state: '生成' },
  { id: 'hinge', label: '铰链损失', x: 670, y: 130, role: '修复相邻边界', state: '损失' },
  { id: 'fusion', label: '参数融合', x: 860, y: 130, role: 'SVD基下逐项融合', state: '任务后' },
];
export const Ch8ArchitectureHotspots: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<NodeId>('image-encoder');
  const fb = active === 'image-encoder' ? '冻结图像编码器输出当前任务特征。' : active === 'adapter' ? '唯一可训练线性层 A 调整图像表示。' : active === 'text-encoder' ? '固定类名文本特征，提供分类锚点和邻居距离。' : active === 'neighbor' ? '按 Dᵢⱼ < α 选择相邻旧新对。' : active === 'gaussian' ? '从 N(μ_c,Σ_c) 生成旧类近似特征。' : active === 'hinge' ? '只对选中邻居施加间隔损失。' : '任务结束后融合 W_old 与 W_new。';
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 360); } catch { return; }
    const drawGlyph = (id: NodeId, x: number, y: number, color: string) => {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      if (id === 'image-encoder') {
        ctx.strokeRect(x - 16, y - 12, 32, 24);
        ctx.beginPath(); ctx.moveTo(x - 12, y + 7); ctx.lineTo(x - 3, y - 3); ctx.lineTo(x + 4, y + 5); ctx.lineTo(x + 11, y - 5); ctx.lineTo(x + 14, y + 7); ctx.stroke();
      } else if (id === 'text-encoder') {
        [-8, 0, 8].forEach((dy) => { ctx.beginPath(); ctx.moveTo(x - 16, y + dy); ctx.lineTo(x + (dy === 8 ? 6 : 16), y + dy); ctx.stroke(); });
      } else if (id === 'adapter') {
        for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) { ctx.globalAlpha = 0.45 + (r + c + 2) * 0.12; ctx.fillRect(x + c * 10 - 4, y + r * 10 - 4, 8, 8); }
        ctx.globalAlpha = 1;
      } else if (id === 'neighbor') {
        ctx.beginPath(); ctx.arc(x - 13, y, 7, 0, Math.PI * 2); ctx.arc(x + 13, y, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke();
      } else if (id === 'gaussian') {
        ctx.beginPath(); ctx.ellipse(x, y, 19, 12, -0.3, 0, Math.PI * 2); ctx.stroke();
        [-9, 0, 9].forEach((dx) => { ctx.beginPath(); ctx.arc(x + dx, y + Math.sin(dx) * 3, 3, 0, Math.PI * 2); ctx.fill(); });
      } else if (id === 'hinge') {
        ctx.beginPath(); ctx.moveTo(x - 18, y - 8); ctx.lineTo(x - 3, y - 8); ctx.moveTo(x + 3, y + 8); ctx.lineTo(x + 18, y + 8); ctx.stroke();
      } else {
        ctx.globalAlpha = 0.55; ctx.fillRect(x - 14, y - 11, 22, 22); ctx.globalAlpha = 1; ctx.strokeRect(x - 5, y - 2, 22, 22);
      }
    };
    const draw = () => {
      drawDesk(ctx, 1080, 360);
      const connector = (a: {x:number;y:number}, b: {x:number;y:number}) => { ctx.strokeStyle = C.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a.x + 65, a.y + 28); ctx.lineTo(b.x, b.y + 28); ctx.stroke(); };
      connector(archNodes[0], archNodes[2]); connector(archNodes[1], archNodes[3]); connector(archNodes[2], archNodes[4]); connector(archNodes[4], archNodes[5]); connector(archNodes[3], archNodes[5]); connector(archNodes[5], archNodes[6]);
      archNodes.forEach((n) => {
        const isActive = n.id === active;
        ctx.fillStyle = n.id.includes('encoder') ? '#e7eedf' : n.id === 'adapter' ? '#d9e6d2' : n.id === 'fusion' ? '#eadff7' : '#ffffff';
        roundedPath(ctx, n.x, n.y, 130, 58, 12); ctx.fill();
        ctx.strokeStyle = isActive ? C.blue : C.axis; ctx.lineWidth = isActive ? 6 : 2; ctx.stroke();
        drawGlyph(n.id, n.x + 65, n.y + 29, isActive ? C.blue : C.ink);
      });
      ctx.fillStyle = '#ffffff'; roundedPath(ctx, 790, 258, 250, 74, 14); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '16px "Microsoft YaHei", sans-serif'; ctx.fillText(archNodes.find((n) => n.id === active)?.state ?? '', 820, 288);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [active]);
  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width * 1080; const y = (e.clientY - rect.top) / rect.height * 360;
    const hit = archNodes.find((n) => x >= n.x && x <= n.x + 130 && y >= n.y && y <= n.y + 58); if (hit) setActive(hit.id);
  };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={360} onClick={pick} />
    <div className="ctrl">{archNodes.map((n) => <button key={n.id} className={`chip ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>{n.label}</button>)}</div>
    <div className="feedback">{fb}</div>
  </div>;
};

export const Ch8FusionSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const feedback = step === 0 ? 'W_old 被分解为共享正交基 B 与旧任务系数 R_old。' : step === 1 ? '把 W_new 投影到同一个 B，得到可比较的 R_new。' : step === 2 ? '按参数变化得到逐项重要性掩码 M。' : step === 3 ? '在 R_old 与 R_new 之间逐元素融合得到 R。' : '重构成最终 W，任务数增长但适配器大小不变。';
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 300); } catch { return; }
    let rafId = 0;
    const paint = () => {
        drawDesk(ctx, 1080, 300);
        const boxes = [
          { x: 70, y: 88, c: C.muted, label: 'W_old' },
          { x: 250, y: 78, c: C.purple, label: 'B' },
          { x: 410, y: 100, c: step >= 1 ? C.blue : C.axis, label: 'R_new' },
          { x: 590, y: 100, c: step >= 2 ? C.orange : C.axis, label: 'M' },
          { x: 770, y: 88, c: step >= 4 ? C.green : C.axis, label: 'W' },
        ];
        boxes.forEach((b, i) => {
          const visible = i === 0 || i === 1 || i === 2 ? step >= Math.min(i, 1) : i === 3 ? step >= 2 : step >= 4;
          ctx.globalAlpha = visible ? 1 : 0.22; ctx.fillStyle = b.c; roundedPath(ctx, b.x, b.y, 118, 108, 14); ctx.fill(); ctx.globalAlpha = 1;
          ctx.fillStyle = C.ink; ctx.font = 'bold 20px "Segoe UI", sans-serif'; ctx.fillText(b.label, b.x + 28, b.y + 62);
          if (i < boxes.length - 1) { ctx.strokeStyle = step >= i + 1 ? C.green : C.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x + 118, b.y + 54); ctx.lineTo(boxes[i + 1].x, boxes[i + 1].y + 54); ctx.stroke(); }
        });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(paint);
    };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const start = () => { if (!rafId) rafId = requestAnimationFrame(paint); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); ctx.clearRect(0, 0, 1080, 300); };
  }, [step]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={300} />
    <div className="ctrl"><button onClick={() => setStep(0)}>重置</button><button onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>上一步</button><button onClick={() => setStep((v) => Math.min(4, v + 1))} disabled={step === 4}>{step === 4 ? '已完成' : '下一步'}</button></div>
    <div className={`feedback ${step === 2 ? 'warn' : step === 4 ? 'good' : ''}`}>{feedback}</div>
  </div>;
};

export const Ch9ThresholdBudget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ alpha: 0.65 });
  const raf = useRef<number | null>(null);
  const [alpha, setAlpha] = useState(0.65);
  const feedback = alpha < 0.60 ? { text: '阈值偏低，可能漏掉仍然接近的新旧类。', cls: '' } : Math.abs(alpha - 0.65) < 0.001 ? { text: '论文实验采用0.65，并只在选中对上增加训练负担。', cls: 'good' } : { text: '更多远关系被纳入；论文指出这可能干扰分类并增加计算。', cls: 'bad' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    const draw = () => {
      drawDesk(ctx, 1080, 320);
      const a = stateRef.current.alpha;
      const selected = Math.round((a - 0.5) / 0.05);
      for (let i = 0; i < 7; i++) {
        const y = 52 + i * 30;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(110, y); ctx.lineTo(570, y); ctx.stroke();
        if (i < selected) { ctx.strokeStyle = i >= 5 ? C.red : C.blue; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(110, y); ctx.lineTo(570 - i * 18, y); ctx.stroke(); }
      }
      const gateX = 110 + ((a - 0.5) / 0.3) * 460;
      ctx.strokeStyle = Math.abs(a - 0.65) < 0.001 ? C.green : a > 0.65 ? C.red : C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gateX, 30); ctx.lineTo(gateX, 260); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = 'bold 26px "Segoe UI", sans-serif'; ctx.fillText(a.toFixed(2), 820, 132);
      ctx.fillStyle = C.green; roundedPath(ctx, 790, 164, 190, 58, 12); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px "Segoe UI", sans-serif'; ctx.fillText('0.26M', 845, 202);
      ctx.fillStyle = C.muted; ctx.font = '16px "Microsoft YaHei", sans-serif'; ctx.fillText('固定适配器', 825, 246);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} />
    <div className="ctrl"><label>阈值 α <span className="val">{alpha.toFixed(2)}</span></label><input type="range" min={50} max={80} step={5} value={Math.round(alpha * 100)} onInput={(e) => { const v = Number((e.target as HTMLInputElement).value) / 100; stateRef.current.alpha = v; setAlpha(v); }} /><button onClick={() => { stateRef.current.alpha = 0.65; setAlpha(0.65); }}>重置</button></div>
    <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
  </div>;
};

type DatasetId = 'CIFAR100 B0 Inc10' | 'ImageNet100 B0 Inc10' | 'ImageNet-R B0 Inc10';
const raceData: Record<DatasetId, Array<{ name: string; value: number; color: string }>> = {
  'CIFAR100 B0 Inc10': [{ name: 'PROOF', value: 76.29, color: C.blue }, { name: 'SLCA', value: 67.58, color: C.muted }, { name: 'ADAM-Adapter', value: 65.50, color: C.purple }, { name: 'RAPF', value: 79.04, color: C.green }],
  'ImageNet100 B0 Inc10': [{ name: 'PROOF', value: 72.48, color: C.blue }, { name: 'SLCA', value: 59.92, color: C.muted }, { name: 'ADAM-Adapter', value: 76.40, color: C.purple }, { name: 'RAPF', value: 80.23, color: C.green }],
  'ImageNet-R B0 Inc10': [{ name: 'PROOF', value: 77.25, color: C.blue }, { name: 'SLCA', value: 73.57, color: C.muted }, { name: 'ADAM-Adapter', value: 68.75, color: C.purple }, { name: 'RAPF', value: 79.62, color: C.green }],
};
export const Ch10ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dataset, setDataset] = useState<DatasetId>('ImageNet100 B0 Inc10');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const tick = () => {
      progressRef.current = Math.min(1, progressRef.current + 0.016);
      setProgress(progressRef.current);
      if (progressRef.current < 1) id = requestAnimationFrame(tick); else setRunning(false);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 320); } catch { return; }
    drawDesk(ctx, 1080, 320);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(120, 42); ctx.lineTo(120, 278); ctx.stroke();
    const rows = raceData[dataset];
    rows.forEach((r, i) => {
      const y = 58 + i * 58;
      ctx.fillStyle = C.axis; ctx.fillRect(120, y, 560, 22);
      ctx.fillStyle = r.color; ctx.fillRect(120, y, 560 * (r.value / 100) * (progress > 0 ? progress : 0), 22);
      if (progress >= 1) { ctx.fillStyle = C.ink; ctx.font = 'bold 18px "Segoe UI", sans-serif'; ctx.fillText(r.value.toFixed(2), 690, y + 19); }
    });
    ctx.fillStyle = '#ffffff'; roundedPath(ctx, 790, 48, 230, 220, 18); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = 'bold 22px "Segoe UI", sans-serif'; ctx.fillText('Last ↑', 850, 98);
    ctx.fillStyle = dataset.includes('ImageNet-R') ? C.purple : dataset.includes('CIFAR') ? C.blue : C.green; ctx.beginPath(); ctx.arc(905, 164, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = progress >= 1 ? C.green : C.orange; ctx.fillRect(830, 226, 160 * progress, 12);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [dataset, progress]);
  const feedback = running ? { text: '按同一Last准确率尺度推进。', cls: 'warn' } : progress >= 1 ? { text: 'RAPF在该协议下最高；不能把三个协议的数值直接合并。', cls: 'good' } : { text: '选择同一协议，再启动比较。', cls: '' };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={320} />
    <div className="ctrl">{(Object.keys(raceData) as DatasetId[]).map((d) => <button key={d} className={`chip ${dataset === d ? 'active' : ''}`} onClick={() => { setDataset(d); setProgress(0); progressRef.current = 0; setRunning(false); }}>{d}</button>)}<button onClick={() => { setProgress(0); progressRef.current = 0; setRunning(true); }} disabled={running}>{running ? '比较中' : '启动比较'}</button></div>
    <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'10px 0 0',fontSize:14}}>{raceData[dataset].map((r) => <span key={r.name}><b style={{color:r.color}}>●</b> {r.name} {r.value.toFixed(2)}</span>)}</div>
    <div className={`feedback ${feedback.cls}`} style={{marginTop:10}}>{feedback.text}</div>
  </div>;
};

type Noise = 0 | 5 | 10 | 20;
const noiseData: Record<Noise, { r: number; p: number }> = { 0: { r: 80.28, p: 77.66 }, 5: { r: 79.55, p: 77.54 }, 10: { r: 79.25, p: 77.08 }, 20: { r: 77.12, p: 70.70 } };
export const Ch10NoiseChips: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [noise, setNoise] = useState<Noise>(0);
  const d = noiseData[noise];
  const feedback = noise === 0 ? { text: '0%噪声时，RAPF Last为80.28。', cls: 'good' } : noise < 20 ? { text: `RAPF ${d.r.toFixed(2)}，RanPAC ${d.p.toFixed(2)}。`, cls: noise === 5 ? 'good' : '' } : { text: 'RAPF 77.12，RanPAC 70.70；RAPF仍领先，但下降更明显。', cls: 'warn' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 1080, 280); } catch { return; }
    let rafId = 0;
    const paint = () => {
        drawDesk(ctx, 1080, 280);
        [0, 1].forEach((i) => {
          const x = 170 + i * 370;
          ctx.fillStyle = C.axis; ctx.fillRect(x, 58, 220, 160);
          const value = i === 0 ? d.r : d.p; const color = i === 0 ? C.green : C.blue;
          ctx.fillStyle = color; ctx.fillRect(x, 58 + 160 * (1 - value / 100), 220, 160 * (value / 100));
          ctx.fillStyle = C.ink; ctx.font = 'bold 28px "Segoe UI", sans-serif'; ctx.fillText(value.toFixed(2), x + 72, 248);
        });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(paint);
    };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const start = () => { if (!rafId) rafId = requestAnimationFrame(paint); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); ctx.clearRect(0, 0, 1080, 280); };
  }, [d]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={1080} height={280} />
    <div className="ctrl">{(['0','5','10','20'] as string[]).map((n) => <button key={n} className={`chip ${noise === Number(n) ? 'active' : ''}`} onClick={() => setNoise(Number(n) as Noise)}>{n}%噪声</button>)}</div>
    <div style={{display:'flex',gap:22,marginTop:8,fontSize:14}}><span><b style={{color:C.green}}>●</b> RAPF</span><span><b style={{color:C.blue}}>●</b> RanPAC</span></div>
    <div className={`feedback ${feedback.cls}`} style={{marginTop:10}}>{feedback.text}</div>
  </div>;
};
