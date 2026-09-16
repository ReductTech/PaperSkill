import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, gameField, drawPictureCard, drawQuestionCard } from '../canvas-scene';

const W = 560;
const H = 140;

// 第 5 章 类比动画：先叠成一摞题卡，再逐张抽出来验；不看图也能答对的被划掉。
// 卡片有固定错位偏移，形成层叠；每张被抽出时移到中央验一次。
export const Ana5: React.FC<WidgetProps> = () => {
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
    const N = 4;
    const GOOD = [false, true, false, true]; // true = 带图答对、去图答错 -> 留下
    const render = (t: number) => {
      const phase = ((t - t0) / 3600) % 1;
      gameField(ctx, W, H);
      drawPictureCard(ctx, 14, 30, 76, 'clean');
      // 层叠：未处理的卡片在左上角堆成一小摞
      const stackX = 120, stackY = 54;
      for (let i = 0; i < N; i++) {
        const off = (N - 1 - i) * 3;
        drawQuestionCard(ctx, stackX + off, stackY - off, 62, 'idle');
      }
      // 抽卡：每张卡按 0.18 的相位节拍依次移到中央
      const cursor = phase * N;
      const idx = Math.min(N - 1, Math.floor(cursor));
      const local = Math.min(1, Math.max(0, cursor - idx));
      const ease = 1 - Math.pow(1 - local, 3);
      const targetX = 250, targetY = 34;
      const cardX = stackX + (targetX - stackX) * ease;
      const cardY = stackY + (targetY - stackY) * ease;
      drawQuestionCard(ctx, cardX, cardY, 62, GOOD[idx] ? 'right' : 'wrong');
      // 已经处理过的卡片结果：留下（绿）或划掉（红）
      for (let i = 0; i < idx; i++) {
        const col = GOOD[i] ? C.green : C.red;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(410, 22 + i * 28, 62, 22);
        ctx.stroke();
        if (!GOOD[i]) {
          ctx.beginPath();
          ctx.moveTo(410, 22 + i * 28);
          ctx.lineTo(472, 44 + i * 28);
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(430, 33 + i * 28);
          ctx.lineTo(436, 39 + i * 28);
          ctx.lineTo(452, 26 + i * 28);
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
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
  return <canvas id="cv-ana-5" ref={ref} width={W} height={H} />;
};
export default Ana5;
