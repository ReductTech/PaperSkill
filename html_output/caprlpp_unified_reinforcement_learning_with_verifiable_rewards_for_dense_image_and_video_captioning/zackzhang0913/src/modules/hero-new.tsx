import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard, drawScoreCell,
} from '../canvas-scene';

const W = 520;
const H = 280;

// Hero 右侧：讲解者只写「一条讲解稿」，稿子滑到学生手里；
// 题目来自学生那一侧的固定题库（带箭头指向学生，表示学生取题作答）。
// 讲解稿的滑行路径刻意走在答对格上方，避免与格子冲突。
export const HeroNew: React.FC<WidgetProps> = () => {
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
    let raf: number | null = null;
    const t0 = performance.now();

    const drawScroll = (x: number, y: number, s: number, alpha: number) => {
      const w = s, h = s * 0.58;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.frame;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 7, y + 7 + i * 8, w * (i === 0 ? 0.74 : i === 1 ? 0.58 : 0.4), 3);
      }
      ctx.restore();
    };

    const render = (t: number) => {
      const phase = ((t - t0) / 3600) % 1;
      gameField(ctx, W, H);

      // 画面（只有讲解者看得见）
      drawPictureCard(ctx, 20, 28, 92, 'clean');
      // 讲解者（左下）
      drawDescriber(ctx, 108, 224, 54, C.green);
      // 学生那一侧的题库：静态一叠题卡（固定在右上，全程不动）
      for (let i = 0; i < 4; i++) {
        drawQuestionCard(ctx, 400 + i * 3, 30 + i * 4, 62, 'idle');
      }
      // 题库 -> 学生 的箭头：表示学生从题库取题
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(430, 78);
      ctx.lineTo(430, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(430, 126);
      ctx.lineTo(424, 114);
      ctx.lineTo(436, 114);
      ctx.closePath();
      ctx.fillStyle = C.blue;
      ctx.fill();
      ctx.restore();
      // 学生（右下）
      drawGuesser(ctx, 430, 224, 54, C.green);

      // 唯一运动主体：讲解稿。写在讲解者面前，然后滑到学生手里。
      const write = Math.min(1, phase / 0.26);
      const travel = Math.max(0, Math.min(1, (phase - 0.3) / 0.34));
      const ease = 1 - Math.pow(1 - travel, 3);
      const sx = 140 + (320 - 140) * ease;
      const sy = 112 + (128 - 112) * ease;
      drawScroll(sx, sy, 88, 0.35 + 0.65 * write);

      // 讲解稿送到后，学生逐题作答（题卡翻绿）
      const n = phase > 0.72 ? Math.min(4, Math.floor((phase - 0.72) / 0.06) + 1) : 0;
      for (let i = 0; i < n; i++) {
        drawQuestionCard(ctx, 150 + i * 46, 178, 42, 'right');
      }
      // 答对格：放在最下沿，讲解稿路径不会经过
      for (let i = 0; i < 4; i++) {
        drawScoreCell(ctx, 330 + i * 22, 238, 16, i < n, C.green);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
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
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};
export default HeroNew;
