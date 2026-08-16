import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 300;

// Left: the original image. The learner drags its bottom-right corner.
const INPUT_LEFT = 34;
const INPUT_TOP = 76;
const INPUT_MIN = { w: 88, h: 64 };
const INPUT_MAX = { w: 154, h: 164 };

// Right top: fixed-resolution encoder always outputs one square.
const FIXED_SQUARE = { x: 346, y: 54, size: 96 };

// Right bottom: native encoder keeps the original aspect ratio.
const NATIVE_REGION = { x: 304, y: 190, w: 224, h: 76 };

function drawPhotoScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w, h);
  ctx.fillStyle = '#dceef5';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  // sun: a perfect circle in the original
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(w * 0.20, h * 0.22, r * 0.085, 0, Math.PI * 2);
  ctx.fill();
  // mountain
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.68);
  ctx.lineTo(w * 0.52, h * 0.32);
  ctx.lineTo(w * 0.82, h * 0.68);
  ctx.closePath();
  ctx.fill();
  // house with a circular window
  ctx.fillStyle = '#f0c060';
  ctx.fillRect(w * 0.76, h * 0.55, w * 0.16, h * 0.19);
  ctx.fillStyle = '#c43f52';
  ctx.beginPath();
  ctx.moveTo(w * 0.735, h * 0.56);
  ctx.lineTo(w * 0.84, h * 0.40);
  ctx.lineTo(w * 0.945, h * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w * 0.84, h * 0.64, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  // road
  ctx.strokeStyle = '#e9e7dd';
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h);
  ctx.lineTo(w * 0.40, h * 0.68);
  ctx.stroke();
  // alignment grid: this is what makes distortion visible
  ctx.strokeStyle = 'rgba(33,50,74,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = (w / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function fitContain(srcW: number, srcH: number, maxW: number, maxH: number): { w: number; h: number } {
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

export const NativeWindow: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ frame: { w: 150, h: 100 }, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [frame, setFrame] = useState({ w: 150, h: 100 });
  const [feedback, setFeedback] = useState({ text: '默认 3:2 原图：左边是原图，右上固定方框开始变形，右下 Hy-ViT2 完整保持原貌。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { frame: { w: number; h: number } }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      if (!offRef.current) offRef.current = document.createElement('canvas');
      const off = offRef.current;
      off.width = Math.max(1, Math.round(s.frame.w));
      off.height = Math.max(1, Math.round(s.frame.h));
      const offCtx = off.getContext('2d');
      if (offCtx) {
        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.clearRect(0, 0, off.width, off.height);
        drawPhotoScene(offCtx, off.width, off.height);
      }

      // ---- left: original photo with draggable aspect ----
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(20, 42, 180, 214);
      label(ctx, '原图', 110, 54, 11, C.ink);
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(INPUT_LEFT - 4, INPUT_TOP - 4, s.frame.w + 8, s.frame.h + 8);
      if (offCtx) ctx.drawImage(off, 0, 0, off.width, off.height, INPUT_LEFT, INPUT_TOP, s.frame.w, s.frame.h);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.strokeRect(INPUT_LEFT, INPUT_TOP, s.frame.w, s.frame.h);
      const hx = INPUT_LEFT + s.frame.w;
      const hy = INPUT_TOP + s.frame.h;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(hx, hy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      label(ctx, '拖动', hx, hy - 18, 9, C.orange);
      label(ctx, '拖动右下角改变原图画幅', 110, 272, 10, C.muted);

      // ---- right top: realistic fixed-resolution encoder ----
      // Real fixed encoders keep aspect ratio and pad the rest to a square;
      // they never squash the picture non-uniformly.
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(292, 42, 248, 120);
      label(ctx, '固定分辨率编码', 416, 34, 11, C.red);
      const fixedScale = Math.min(FIXED_SQUARE.size / s.frame.w, FIXED_SQUARE.size / s.frame.h);
      const fw = s.frame.w * fixedScale;
      const fh = s.frame.h * fixedScale;
      const fx = FIXED_SQUARE.x + (FIXED_SQUARE.size - fw) / 2;
      const fy = FIXED_SQUARE.y + (FIXED_SQUARE.size - fh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(FIXED_SQUARE.x, FIXED_SQUARE.y, FIXED_SQUARE.size, FIXED_SQUARE.size);
      ctx.clip();
      // padding area
      ctx.fillStyle = '#d8dfe8';
      ctx.fillRect(FIXED_SQUARE.x, FIXED_SQUARE.y, FIXED_SQUARE.size, FIXED_SQUARE.size);
      ctx.strokeStyle = 'rgba(104,119,143,0.28)';
      ctx.lineWidth = 1;
      for (let px = FIXED_SQUARE.x - FIXED_SQUARE.size; px < FIXED_SQUARE.x + FIXED_SQUARE.size * 2; px += 8) {
        ctx.beginPath();
        ctx.moveTo(px, FIXED_SQUARE.y);
        ctx.lineTo(px + FIXED_SQUARE.size, FIXED_SQUARE.y + FIXED_SQUARE.size);
        ctx.stroke();
      }
      // aspect-preserving content
      if (offCtx) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, off.width, off.height, fx, fy, fw, fh);
      }
      ctx.strokeStyle = 'rgba(33,50,74,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(fx, fy, fw, fh);
      ctx.restore();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.strokeRect(FIXED_SQUARE.x, FIXED_SQUARE.y, FIXED_SQUARE.size, FIXED_SQUARE.size);
      const contentRatio = Math.round((fw * fh) / (FIXED_SQUARE.size * FIXED_SQUARE.size) * 100);
      label(ctx, '等比缩放 + 填充到 1:1', FIXED_SQUARE.x + FIXED_SQUARE.size / 2, FIXED_SQUARE.y + FIXED_SQUARE.size + 15, 10, C.red);
      label(ctx, `有效内容 ${contentRatio}%`, FIXED_SQUARE.x + FIXED_SQUARE.size / 2, FIXED_SQUARE.y + FIXED_SQUARE.size + 28, 9, C.muted);

      // ---- right bottom: Hy-ViT2 native output ----
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(292, 176, 248, 100);
      label(ctx, 'Hy-ViT2 原生编码', 416, 168, 11, C.green);
      const fit = fitContain(s.frame.w, s.frame.h, NATIVE_REGION.w, NATIVE_REGION.h);
      const nx = NATIVE_REGION.x + (NATIVE_REGION.w - fit.w) / 2;
      const ny = NATIVE_REGION.y + (NATIVE_REGION.h - fit.h) / 2;
      if (offCtx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(nx, ny, fit.w, fit.h);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, off.width, off.height, nx, ny, fit.w, fit.h);
        ctx.restore();
      }
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.strokeRect(nx, ny, fit.w, fit.h);
      label(ctx, '尽量保持原画幅（具体策略未披露）', nx + fit.w / 2, ny + fit.h + 14, 10, C.green);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const updateFrame = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const w = clamp(x - INPUT_LEFT, INPUT_MIN.w, INPUT_MAX.w);
    const h = clamp(y - INPUT_TOP, INPUT_MIN.h, INPUT_MAX.h);
    stateRef.current.frame = { w, h };
    setFrame({ w, h });
    const ar = w / h;
    if (ar > 1.7) setFeedback({ text: `宽画幅 ${ar.toFixed(2)}：固定编码等比缩放后在上下留出大片填充，有效内容减少；Hy-ViT2 保持完整宽景。`, cls: 'good' });
    else if (ar < 0.9) setFeedback({ text: `竖画幅 ${ar.toFixed(2)}：固定编码等比缩放后在左右留出大片填充，有效内容减少；Hy-ViT2 保持完整竖景。`, cls: 'good' });
    else if (ar > 1.15) setFeedback({ text: `接近 4:3（${ar.toFixed(2)}）：固定编码开始出现上下填充，Hy-ViT2 无填充。`, cls: '' });
    else setFeedback({ text: `接近方画幅（${ar.toFixed(2)}）：两者差异较小；画幅越极端，原生分辨率优势越明显。`, cls: '' });
  };

  const nearHandle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const hx = INPUT_LEFT + stateRef.current.frame.w;
    const hy = INPUT_TOP + stateRef.current.frame.h;
    return Math.hypot(x - hx, y - hy) < 28;
  };

  const setAspect = (w: number, h: number, msg: string, cls = '') => {
    stateRef.current.frame = { w, h };
    setFrame({ w, h });
    setFeedback({ text: msg, cls });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'nwse-resize', touchAction: 'none' }}
        onPointerDown={(e) => {
          if (!nearHandle(e)) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          stateRef.current.dragging = true;
          updateFrame(e);
        }}
        onPointerMove={(e) => { if (stateRef.current.dragging) updateFrame(e); }}
        onPointerUp={() => { stateRef.current.dragging = false; }}
        onPointerCancel={() => { stateRef.current.dragging = false; }}
      />
      <div className="ctrl">
        <label>原图画幅 <span className="val">{Math.round(frame.w / frame.h * 100) / 100}</span></label>
        <button className="chip" onClick={() => setAspect(150, 100, '已恢复 3:2 原图。', '')}>3:2</button>
        <button className="chip" onClick={() => setAspect(154, 66, '宽画幅：固定编码等比缩放后在上下填充，Hy-ViT2 完整保留宽景。', 'good')}>宽幅</button>
        <button className="chip" onClick={() => setAspect(108, 164, '竖画幅：固定编码等比缩放后在左右填充，Hy-ViT2 完整保留竖景。', 'good')}>竖幅</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default NativeWindow;
