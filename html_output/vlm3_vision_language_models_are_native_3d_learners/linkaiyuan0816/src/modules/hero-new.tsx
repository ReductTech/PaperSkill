import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { C } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 480;
const H = 270;
const T = 2600;

const TASKS = ['深度', '对应', '位姿', '物体'];
const PROMPTS = ['depth?', 'match?', 'pose?', 'bbox?'];
const STEPS = ['统一焦距', '文本引用', '配比放大'];

/** 本文方法：同一布局，流水线始终不动，仅提示小标签切换 */
export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const tick = (now: number) => {
      const u = (now % T) / T;
      const phase = Math.floor(now / T) % 4;
      const next = (phase + 1) % 4;
      const pulse = (Math.sin(now / 450) + 1) / 2;

      let promptMorph = 0;
      let showNextPrompt = false;
      if (u >= 0.38 && u < 0.72) {
        promptMorph = easeInOutQuad((u - 0.38) / 0.34);
        showNextPrompt = promptMorph > 0.5;
      } else if (u >= 0.72) {
        promptMorph = 1;
        showNextPrompt = true;
      }

      const taskName = showNextPrompt ? TASKS[next] : TASKS[phase];
      const prompt = showNextPrompt ? PROMPTS[next] : PROMPTS[phase];

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.quiet;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#e8f5ee';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.fillRect(160, 18, 160, 32);
      ctx.strokeRect(160, 18, 160, 32);
      centerText(ctx, '任务 · ' + taskName, 240, 34, C.green, 14);

      roundBox(ctx, 24, 110, 70, 56, '#fff', C.green);
      centerText(ctx, '输入', 59, 138, C.green, 13);
      arrow(ctx, 100, 138, 128, 138, C.green);

      for (let i = 0; i < 3; i++) {
        const bx = 136 + i * 78;
        const by = 100;
        ctx.fillStyle = '#e8f5ee';
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5 + pulse * 0.4;
        ctx.fillRect(bx, by, 68, 72);
        ctx.strokeRect(bx, by, 68, 72);
        centerWrap(ctx, STEPS[i], bx + 34, by + 36, 60, C.green, 11);
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(bx + 58, by + 10, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      arrow(ctx, 378, 138, 400, 138, C.green);
      roundBox(ctx, 404, 110, 52, 56, '#fff', C.green);
      centerText(ctx, '输出', 430, 138, C.green, 12);

      const px = 214;
      const py = 188;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      const s = 1 + (u > 0.38 && u < 0.72 ? Math.sin(promptMorph * Math.PI) * 0.08 : 0);
      ctx.save();
      ctx.translate(px + 50, py + 16);
      ctx.scale(s, s);
      ctx.translate(-(px + 50), -(py + 16));
      ctx.fillRect(px, py, 100, 32);
      ctx.strokeRect(px, py, 100, 32);
      if (u >= 0.38 && u < 0.72) {
        const m = promptMorph;
        ctx.globalAlpha = 1 - m;
        centerText(ctx, PROMPTS[phase], px + 50, py + 16, C.muted, 12);
        ctx.globalAlpha = m;
        centerText(ctx, PROMPTS[next], px + 50, py + 16, C.green, 12);
        ctx.globalAlpha = 1;
      } else {
        centerText(ctx, prompt, px + 50, py + 16, C.green, 12);
      }
      ctx.restore();

      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(248, 172);
      ctx.lineTo(248, 188);
      ctx.stroke();
      ctx.setLineDash([]);

      if (u > 0.38 && u < 0.72) {
        ctx.globalAlpha = Math.sin(promptMorph * Math.PI);
        centerText(ctx, '只换提示', 240, 240, C.green, 13);
        ctx.globalAlpha = 1;
      }

      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

function roundBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string, stroke: string,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6, y2 - 4);
  ctx.lineTo(x2 - 6, y2 + 4);
  ctx.closePath();
  ctx.fill();
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function centerWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (ctx.measureText(text).width <= maxW || text.length <= 4) {
    ctx.fillText(text, cx, cy);
  } else {
    const mid = Math.ceil(text.length / 2);
    ctx.fillText(text.slice(0, mid), cx, cy - 8);
    ctx.fillText(text.slice(mid), cx, cy + 8);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export default HeroNew;
