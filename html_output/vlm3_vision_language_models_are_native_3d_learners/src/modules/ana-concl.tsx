import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

const CORES = [
  { short: '统一焦距', color: C.blue },
  { short: '文本引用', color: C.orange },
  { short: '配比规模', color: C.green },
];

function textAt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'center',
  baseline: CanvasTextBaseline = 'middle',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const AnaConcl: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 4.5;
      // 0–0.4 显示外壳；之后依次点亮 3 个核心
      const lit =
        t < 0.5 ? 0 : t < 1.5 ? 1 : t < 2.5 ? 2 : 3;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // VLM 外壳
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.fillRect(10, 22, W - 20, 88);
      ctx.strokeRect(10, 22, W - 20, 88);

      textAt(ctx, 'VLM', W / 2, 34, C.purple, 13, 'center', 'middle');
      textAt(ctx, '3 个核心', W / 2, 48, C.muted, 9, 'center', 'middle');

      // 三个核心块
      const boxW = 66;
      const boxH = 36;
      const gap = 6;
      const total = CORES.length * boxW + (CORES.length - 1) * gap;
      const x0 = (W - total) / 2;
      const y0 = 58;

      CORES.forEach((c, i) => {
        const on = i < lit;
        const x = x0 + i * (boxW + gap);
        ctx.fillStyle = on ? c.color : '#fff';
        ctx.strokeStyle = on ? c.color : C.border;
        ctx.lineWidth = on ? 2 : 1;
        ctx.fillRect(x, y0, boxW, boxH);
        ctx.strokeRect(x, y0, boxW, boxH);
        textAt(ctx, c.short, x + boxW / 2, y0 + boxH / 2, on ? '#fff' : C.muted, 10, 'center', 'middle');
      });

      // 底部收束提示（全部点亮后）
      if (lit >= 3) {
        textAt(ctx, '→ native 3D learners', W / 2, 122, C.purple, 10, 'center', 'middle');
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default AnaConcl;
