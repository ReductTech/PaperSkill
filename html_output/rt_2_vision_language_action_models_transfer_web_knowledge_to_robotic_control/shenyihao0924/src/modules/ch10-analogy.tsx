import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
} from './chefKit';
import type { WidgetProps } from './registry';

// Chapter 10 analogy card (560x140, auto-loop, gentle). A scoreboard: three
// columns of bars rise (62 / 60 / 90), a medal flashes twice at the top-right,
// then a sticky note labeled 局限 attaches at the side of the board.
const W = 560;
const H = 140;
const LOOP = 5600;

const BAR_VALUES = [62, 60, 90];

export const Ch10Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawMedal = (ctx2: CanvasRenderingContext2D, cx: number, cy: number, alpha: number) => {
      ctx2.save();
      ctx2.globalAlpha = alpha;
      // ribbons
      ctx2.strokeStyle = C.red;
      ctx2.lineWidth = 4;
      ctx2.beginPath();
      ctx2.moveTo(cx - 7, cy - 22);
      ctx2.lineTo(cx - 3, cy - 10);
      ctx2.moveTo(cx + 7, cy - 22);
      ctx2.lineTo(cx + 3, cy - 10);
      ctx2.stroke();
      // disc
      ctx2.fillStyle = C.orange;
      ctx2.strokeStyle = C.support;
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.stroke();
      // star
      ctx2.fillStyle = C.white;
      ctx2.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? 6.5 : 3;
        const px = cx + rr * Math.cos(a);
        const py = cy + rr * Math.sin(a);
        if (i === 0) ctx2.moveTo(px, py);
        else ctx2.lineTo(px, py);
      }
      ctx2.closePath();
      ctx2.fill();
      ctx2.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // scoreboard panel
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(28, 20, 336, 84, 8);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(352, 40);
      ctx.stroke();

      // three rising bars (gentle): 62 / 60 / 90
      const rise = easeOutCubic(clamp(t / 0.42, 0, 1));
      const baseY = 94;
      const maxH = 44;
      BAR_VALUES.forEach((v, i) => {
        const x = 72 + i * 94;
        const h = (v / 100) * maxH * rise;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.roundRect(x, baseY - h, 36, h, [4, 4, 0, 0]);
        ctx.fill();
        if (rise > 0.6) drawValueChip(ctx, x + 18, baseY - h - 13, String(v), C.green);
      });

      // medal flashes twice at top-right, then stays
      let medalAlpha = 0;
      if (t >= 0.44 && t < 0.74) {
        const p = (t - 0.44) / 0.3;
        medalAlpha = Math.abs(Math.sin(p * Math.PI * 2)); // exactly two flashes
      } else if (t >= 0.74) {
        medalAlpha = 1;
      }
      if (medalAlpha > 0.02) drawMedal(ctx, 468, 52, medalAlpha);

      // sticky note (局限) attaches at the side of the board
      if (t >= 0.76) {
        const p = easeOutCubic(clamp((t - 0.76) / 0.16, 0, 1));
        ctx.save();
        ctx.translate(W + 40 - p * 110, 96);
        ctx.rotate(-0.08);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#f6e08e';
        ctx.strokeStyle = '#d9b23c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-27, -22, 54, 44, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.support;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('局限', 0, 0);
        ctx.restore();
      }

      drawSceneLabel(ctx, '出师考核', 14, 16, { color: C.text });
      drawLegend(ctx, [['分数', C.green], ['注意事项', C.orange]], 14, H - 12);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch10Analogy;
