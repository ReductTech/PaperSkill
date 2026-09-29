import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawPotter, drawCheckMark, drawSceneLabel } from './potteryKit';
import type { WidgetProps } from './registry';

// Chapter 9 analogy — 出师比武: a rack of three arena plaques (开箱 / 听令 /
// 学新活) flips open one by one, each revealing a green check. The potter
// (single subject) watches the board; the goal is three revealed wins.
const W = 560;
const H = 140;
const LOOP = 4600;
const WORDS = ['开箱', '听令', '新活'];

export const Ch9Analogy: React.FC<WidgetProps> = () => {
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

    // One plaque hanging on the rail; p in [0,1] is the flip progress.
    const drawPlaque = (cx: number, cy: number, p: number, word: string) => {
      const sx = Math.abs(Math.cos(Math.PI * p)); // 1 -> 0 -> 1 flip
      const showFront = p >= 0.5;
      const pw = 76 * Math.max(sx, 0.06);
      ctx.save();
      ctx.translate(cx, cy);
      // hook + cord
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, -22);
      ctx.stroke();
      ctx.fillStyle = showFront ? '#e7f3ec' : C.white;
      ctx.strokeStyle = showFront ? C.green : C.blue;
      ctx.lineWidth = showFront ? 2.25 : 2;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -22, pw, 46, 5);
      ctx.fill();
      ctx.stroke();
      if (sx > 0.25) {
        if (showFront) {
          drawCheckMark(ctx, 0, -8, 7);
          ctx.fillStyle = C.green;
          ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word, 0, 9);
        } else {
          ctx.fillStyle = C.blue;
          ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', 0, 1);
        }
      }
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // rail with two posts (static prop)
      const railY = 26;
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(200, railY);
      ctx.lineTo(520, railY);
      ctx.moveTo(212, railY);
      ctx.lineTo(212, H - 34);
      ctx.moveTo(508, railY);
      ctx.lineTo(508, H - 34);
      ctx.stroke();
      // the potter watching the board (subject, magnifier up = checking scores)
      drawPotter(ctx, 96, H - 34, 1.6, { mode: 'eye', t: ms / 400 });
      // three plaques flip in sequence; hold, then reset
      const base = 0.16;
      for (let i = 0; i < 3; i++) {
        const start = base + i * 0.21;
        const p = t < start ? 0 : clamp((t - start) / 0.09, 0, 1);
        drawPlaque(268 + i * 112, 62, p, WORDS[i]);
      }
      drawSceneLabel(ctx, '比武牌', 16, 22, { color: C.text });
      drawSceneLabel(ctx, t > 0.85 ? '三战三胜' : '', 16, 42, { color: C.green });
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

export default Ch9Analogy;
