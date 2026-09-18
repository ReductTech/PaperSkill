import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import { COL, clearScene, drawPhoto, drawHand, drawStamp } from './sceneKit';
import type { WidgetProps } from './registry';

// §3 类比动画：一只手拿日期章，给同一时刻拍下的三张照片盖上同一个日期。
// 单手、单动作、3.4 s 循环；静态道具：并排的三张照片卡。

const W = 560;
const H = 140;
const LOOP = 3400;

const CW = 110;
const CH = 76;
const CARDS: { x: number; y: number; tilt: number }[] = [
  { x: 120, y: 34, tilt: -0.03 },
  { x: 230, y: 34, tilt: 0.02 },
  { x: 340, y: 34, tilt: -0.01 },
];
const CORNERS = CARDS.map((c) => ({ x: c.x + CW - 18, y: c.y + CH - 16 }));

const HOME = { x: 538, y: 126 };

// 时间分段（LOOP 的归一化比例）：移动到 → 盖章，重复三次，随后退回并静置 0.6 s
const M1 = 0.1;
const S1 = 0.18;
const M2 = 0.34;
const S2 = 0.42;
const M3 = 0.58;
const S3 = 0.66;
const RE = 0.82;

export const A3Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const stampProgress = (p: number, start: number, end: number): number => {
      if (p < start) return 0;
      if (p >= end) return 1;
      return clamp((p - start) / 0.06, 0, 1);
    };

    const render = (t: number) => {
      clearScene(ctx, W, H, true);

      // 静态道具：同一时刻拍下的三张照片
      CARDS.forEach((c) => drawPhoto(ctx, c.x, c.y, CW, CH, c.tilt, COL.axis));

      const p = (t % LOOP) / LOOP;

      // 运动主体：一只手 + 它握着的日期章
      let hx = HOME.x;
      let hy = HOME.y;
      if (p < M1) {
        const k = easeOutCubic(clamp(p / M1, 0, 1));
        hx = lerp(HOME.x, CORNERS[0].x, k);
        hy = lerp(HOME.y, CORNERS[0].y, k);
      } else if (p < S1) {
        hx = CORNERS[0].x;
        hy = CORNERS[0].y;
      } else if (p < M2) {
        const k = easeOutCubic(clamp((p - S1) / (M2 - S1), 0, 1));
        hx = lerp(CORNERS[0].x, CORNERS[1].x, k);
        hy = lerp(CORNERS[0].y, CORNERS[1].y, k);
      } else if (p < S2) {
        hx = CORNERS[1].x;
        hy = CORNERS[1].y;
      } else if (p < M3) {
        const k = easeOutCubic(clamp((p - S2) / (M3 - S2), 0, 1));
        hx = lerp(CORNERS[1].x, CORNERS[2].x, k);
        hy = lerp(CORNERS[1].y, CORNERS[2].y, k);
      } else if (p < S3) {
        hx = CORNERS[2].x;
        hy = CORNERS[2].y;
      } else {
        const k = easeOutCubic(clamp((p - S3) / (RE - S3), 0, 1));
        hx = lerp(CORNERS[2].x, HOME.x, k);
        hy = lerp(CORNERS[2].y, HOME.y, k);
      }

      // 同一个日期，依次盖在三张照片的同一角落
      const stamps = [
        stampProgress(p, M1, S1),
        stampProgress(p, M2, S2),
        stampProgress(p, M3, S3),
      ];
      stamps.forEach((prog, i) => {
        if (prog <= 0) return;
        drawStamp(ctx, CORNERS[i].x, CORNERS[i].y, 4 + 9 * prog, COL.orange, true);
      });

      if (p < RE) {
        drawHand(ctx, hx + 18, hy - 22, 0.8, -2.4, '#e8c9a8');
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default A3Scene;
