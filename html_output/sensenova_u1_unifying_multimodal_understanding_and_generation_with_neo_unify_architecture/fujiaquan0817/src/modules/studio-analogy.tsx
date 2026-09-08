import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearStudio,
  drawCamera,
  drawDesk,
  drawFocusTarget,
  drawLabel,
  drawMeter,
  drawPhoto,
} from './studio-kit';

const W = 244;
const H = 130;

const actionLabels = [
  '框住人像', '贯通光路', '文字与照片入册', '校平地平线', '校准曝光',
  '瞄准构图', '显影成片', '调稳拨盘', '检视细节', '同尺比较',
];

function drawScene(ctx: CanvasRenderingContext2D, chapter: number, p: number) {
  clearStudio(ctx, W, H);
  drawDesk(ctx, W, H, 101);
  const wave = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);

  if (chapter === 1) {
    drawCamera(ctx, 55, 76, 0.58);
    drawPhoto(ctx, 151, 42, 66, 51, C.current);
    drawFocusTarget(ctx, 116 + wave * 31, 47, 50, 40, wave > 0.78 ? C.success : C.current);
  } else if (chapter === 2) {
    drawCamera(ctx, 82, 76, 0.58);
    drawPhoto(ctx, 164, 40, 62, 50, wave > 0.72 ? C.success : C.current);
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(16, 62); ctx.lineTo(58, 62); ctx.stroke();
    ctx.fillStyle = wave > 0.72 ? C.success : C.current;
    ctx.beginPath(); ctx.arc(18 + wave * 134, 62, 6, 0, Math.PI * 2); ctx.fill();
  } else if (chapter === 3) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(98, 30, 128, 64, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(160, 34);
    ctx.lineTo(160, 90);
    ctx.stroke();
    drawPhoto(ctx, 174, 42, 38, 34, C.success);
    drawLabel(ctx, '照片', 193, 88, C.success, 9, 'center');
    const cardX = 20 + wave * 96;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = wave > 0.78 ? C.success : C.current;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX, 47, 40, 28, 6);
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, '文字', cardX + 20, 65, wave > 0.78 ? C.success : C.current, 10, 'center');
  } else if (chapter === 4) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(48, 48, 148, 34, 17); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.current; ctx.beginPath(); ctx.moveTo(122, 46); ctx.lineTo(122, 84); ctx.stroke();
    ctx.fillStyle = wave > 0.8 ? C.success : C.control;
    ctx.beginPath(); ctx.arc(70 + wave * 52, 65, 10, 0, Math.PI * 2); ctx.fill();
  } else if (chapter === 5) {
    drawCamera(ctx, 83, 72, 0.62); drawPhoto(ctx, 151, 42, 62, 48);
    ctx.fillStyle = C.current; ctx.fillRect(72, 48, 22 + wave * 24, 48);
  } else if (chapter === 6) {
    drawCamera(ctx, 60, 76, 0.56); drawPhoto(ctx, 160, 43, 58, 48);
    ctx.strokeStyle = wave > 0.76 ? C.success : C.current; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(89, 62); ctx.lineTo(145, 48 + wave * 23); ctx.stroke();
  } else if (chapter === 7) {
    drawPhoto(ctx, 81, 28, 84, 68, wave > 0.72 ? C.success : C.current);
    ctx.fillStyle = `rgba(104,119,143,${0.72 * (1 - wave)})`; ctx.fillRect(89, 36, 68, 44);
  } else if (chapter === 8) {
    drawMeter(ctx, 122, 80, 43, 0.16 + wave * 0.34, wave > 0.75 ? C.success : C.current);
  } else if (chapter === 9) {
    drawPhoto(ctx, 73, 34, 98, 66);
    const x = 95 + wave * 43;
    ctx.strokeStyle = C.current; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, 59, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 12, 72); ctx.lineTo(x + 25, 87); ctx.stroke();
  } else {
    drawPhoto(ctx, 35, 40, 70, 54, C.current); drawPhoto(ctx, 139, 40, 70, 54, C.success);
    ctx.strokeStyle = C.control; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(108 + wave * 28, 34); ctx.lineTo(108 + wave * 28, 98); ctx.stroke();
  }
  drawLabel(ctx, actionLabels[Math.max(0, Math.min(9, chapter - 1))], 122, 115, C.text, 12, 'center');
}

export const StudioAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const match = chapterId.match(/(\d+)/);
    const chapter = Math.max(1, Math.min(10, Number(match?.[1] || 1)));
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '244px';
    canvas.style.height = '130px';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    let startedAt = 0;
    const frame = (now: number) => {
      if (!startedAt) startedAt = now;
      const p = reduced ? 0.82 : ((now - startedAt) % 3100) / 3100;
      drawScene(ctx, chapter, p);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId]);

  return <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="摄影工作室类比动画" />;
};

export default StudioAnalogy;
