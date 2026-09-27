import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawWorker, drawSceneLabel } from './flatKit';
import type { WidgetProps } from './registry';

// Chapter 6 analogy — the pitfall notebook: the worker flips a notebook covered
// in sticky notes while the four lessons (backbone / resolution / vision / epochs)
// light up one after another. Auto-looping 560x140 canvas, no controls.
const W = 560;
const H = 140;
const LOOP = 4800;

interface Note {
  x: number;
  y: number;
  rot: number;
  color: string;
  word: string;
}

const NOTES: Note[] = [
  { x: 196, y: 66, rot: -0.12, color: C.orange, word: '骨干' },
  { x: 306, y: 56, rot: 0.1, color: C.purple, word: '像素' },
  { x: 372, y: 92, rot: -0.08, color: C.blue, word: '解冻' },
  { x: 236, y: 104, rot: 0.14, color: C.green, word: '轮数' },
];

const SPINE_X = 288;

function drawNotebook(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  // cover shadow
  ctx.fillStyle = 'rgba(33, 50, 74, 0.12)';
  ctx.beginPath();
  ctx.roundRect(178, 54, 220, 66, 5);
  ctx.fill();
  // left page
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(186, 62);
  ctx.lineTo(SPINE_X, 54);
  ctx.lineTo(SPINE_X, 116);
  ctx.lineTo(186, 122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // right page
  ctx.beginPath();
  ctx.moveTo(SPINE_X, 54);
  ctx.lineTo(390, 62);
  ctx.lineTo(390, 122);
  ctx.lineTo(SPINE_X, 116);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // scribble lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.25;
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    ctx.moveTo(194, 74 + r * 11);
    ctx.lineTo(278, 70 + r * 11);
    ctx.moveTo(298, 70 + r * 11);
    ctx.lineTo(382, 74 + r * 11);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ch6Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawNotebook(ctx);
      // worker flipping pages beside the notebook
      drawWorker(ctx, 120, 124, 1.45, { mode: 'read', t: ms / 400, color: C.green });

      // four lessons pop in sequence
      NOTES.forEach((n, i) => {
        const seg = t * 4;
        const active = Math.floor(seg) === i && seg < 4;
        const pop = active ? Math.sin(Math.PI * clamp((seg - i) / 0.35, 0, 1)) : 0;
        const scale = 1 + pop * 0.32;
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);
        ctx.scale(scale, scale);
        ctx.globalAlpha = active ? 1 : 0.55 + 0.1 * i;
        // sticky note with folded corner
        ctx.fillStyle = n.color;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-13, -12, 26, 24, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(1, 12);
        ctx.lineTo(13, 12);
        ctx.lineTo(13, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = 'bold 11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.word, -1, 0);
        ctx.restore();
        // active note gets a halo ring
        if (active) {
          ctx.save();
          ctx.strokeStyle = C.orange;
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(ms / 120);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(n.x - 18, n.y - 17, 36, 34, 4);
          ctx.stroke();
          ctx.restore();
        }
      });

      // page sweep between lessons
      const segT = t * 4 - Math.floor(t * 4);
      if (segT > 0.82 && t < 0.97) {
        const f = easeOutCubic((segT - 0.82) / 0.18);
        ctx.save();
        ctx.globalAlpha = 0.75 * (1 - f);
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.5;
        const sweep = Math.sin(f * Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(SPINE_X, 54 + 62 * sweep * 0.1);
        ctx.lineTo(SPINE_X + 102 * sweep, 62 - 8 * sweep);
        ctx.lineTo(SPINE_X + 102 * sweep, 122 - 8 * sweep);
        ctx.lineTo(SPINE_X, 116 + 62 * sweep * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '踩坑笔记', 14, 16, { color: C.green });
      drawSceneLabel(ctx, '4 条经验', 452, 16, { color: C.muted });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch6Analogy;
