import React, { useEffect, useRef } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, drawMountainSprite, getClimbSprites } from './climb-sprites';

const W = 480;
const H = 180;
const C = {
  bg: '#f5f8f0', route: '#92400e', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '600 13px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 20;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 25, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 10, y + 17);
  ctx.restore();
}

export const HeroContrast: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    getClimbSprites();
    canvas.style.height = 'auto';
    let startedAt = performance.now();

    const draw = (now: number) => {
      const phase = (Math.sin((now - startedAt) / 900) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      drawMountainSprite(ctx, 34, 18, 402, 138, 0.3);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.setLineDash(isNew ? [] : [8, 7]);
      ctx.beginPath();
      ctx.moveTo(83, 142);
      if (isNew) { ctx.bezierCurveTo(135, 125, 160, 75, 220, 95); ctx.bezierCurveTo(283, 115, 310, 48, 390, 43); }
      else { ctx.lineTo(390, 43); }
      ctx.stroke(); ctx.setLineDash([]);

      const t = clamp(0.12 + phase * 0.76, 0, 1);
      const x = 83 + (390 - 83) * t;
      const y = isNew ? 142 - 99 * t + Math.sin(t * Math.PI * 3) * 24 : 142 - 99 * t;
      drawHikerSprite(ctx, x, y + 27, 54, 68);
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(400, 35, 11, 0, Math.PI * 2); ctx.fill();

      if (isNew) {
        ['产物', '状态', '语义'].forEach((label, i) => {
          const px = 142 + i * 94;
          ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(px, 148, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, px, 169);
        });
        pill(ctx, '整段轨迹可审计', 17, 15, C.green);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fillRect(95, 117, 278, 50);
        ['绕路', '误操作', '超时'].forEach((label, i) => {
          ctx.fillStyle = C.red; ctx.font = '13px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`× ${label}`, 145 + i * 88, 148);
        });
        pill(ctx, '只核对终点', 17, 15, C.red);
      }
      ctx.textAlign = 'left';
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { startedAt = performance.now(); if (rafRef.current === null) rafRef.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [isNew]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={isNew ? '真实工具链与混合验收示意' : '只核对最终答案的短任务示意'} />;
};

export default HeroContrast;
