import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label, drawBar, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 280, y: 120 });
  const rafRef = useRef<number | null>(null);
  const drag = useRef(false);
  const [coords, setCoords] = useState({ c: 1000, r: 1000 });
  const [feedback, setFeedback] = useState({ text: '拖动橙点，生成 [0,2000) 文本坐标（对比 DepthLM 视觉标记）。', cls: '' });

  const img = { x: 80, y: 24, w: 400, h: 145 };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const { x, y } = stateRef.current;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      drawWindow(ctx, img.x, img.y, img.w, img.h, C.blue);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(img.x + (img.w * i) / 8, img.y);
        ctx.lineTo(img.x + (img.w * i) / 8, img.y + img.h);
        ctx.moveTo(img.x, img.y + (img.h * i) / 8);
        ctx.lineTo(img.x + img.w, img.y + (img.h * i) / 8);
        ctx.stroke();
      }
      drawDot(ctx, x, y, 6, C.orange);
      const c = clamp(Math.floor(((x - img.x) / img.w) * 2000), 0, 1999);
      const r = clamp(Math.floor(((y - img.y) / img.h) * 2000), 0, 1999);
      drawCaption(ctx, W, H, '文本引用  [' + c + ', ' + r + ']', C.blue);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return {
      x: clamp(x, img.x, img.x + img.w),
      y: clamp(y, img.y, img.y + img.h),
    };
  };

  const update = (x: number, y: number) => {
    stateRef.current = { x, y };
    const c = clamp(Math.floor(((x - img.x) / img.w) * 2000), 0, 1999);
    const r = clamp(Math.floor(((y - img.y) / img.h) * 2000), 0, 1999);
    setCoords({ c, r });
    const edge = c < 40 || r < 40 || c > 1960 || r > 1960;
    setFeedback(edge
      ? { text: '贴边离散坐标，注意边界。', cls: '' }
      : { text: '文本引用 [' + c + ',' + r + ']：不必把标记画进像素。', cls: 'good' });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); const p = toLocal(e); update(p.x, p.y); }}
        onPointerMove={(e) => { if (!drag.current) return; const p = toLocal(e); update(p.x, p.y); }}
        onPointerUp={() => { drag.current = false; }}
      />
      <div className="ctrl"><label>当前 <span className="val">[{coords.c}, {coords.r}]</span></label></div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
