import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { COL, clearScene, drawPhoto, drawHand, drawTag, drawArrow } from './sceneKit';
import type { WidgetProps } from './registry';

// §2 类比动画：一只手在照片背面先写下一行内容说明（蓝），再写下一行关系说明（紫）。
// 单手、单动作、3.0 s 循环；静态道具：照片卡 + 标注笔。

const W = 560;
const H = 140;
const LOOP = 3000;

const CARD = { x: 200, y: 24, w: 150, h: 92 };
const X0 = 214;
const X1 = 336;
const LINE1 = 99;
const LINE2 = 110;

// 时间分段：写第一行 → 抬笔 → 写第二行 → 手退回画面外（留 0.6 s 空白）
const P1_END = 0.38;
const LIFT_END = 0.48;
const P2_END = 0.8;

export const A2Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const ink = (y: number, progress: number, color: string) => {
      if (progress <= 0) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X0, y);
      ctx.lineTo(X0 + (X1 - X0) * progress, y);
      ctx.stroke();
      ctx.restore();
    };

    const render = (t: number) => {
      clearScene(ctx, W, H, true);

      // 照片卡（正面朝下，写的是背面）
      drawPhoto(ctx, CARD.x, CARD.y, CARD.w, CARD.h, -0.035, COL.axis);

      const p = (t % LOOP) / LOOP;

      // 已写下的两行：内容行（蓝）与关系行（紫）
      const prog1 = p < P1_END ? clamp(p / P1_END, 0, 1) : 1;
      const prog2 = p < LIFT_END ? 0 : clamp((p - LIFT_END) / (P2_END - LIFT_END), 0, 1);
      ink(LINE1, prog1, COL.blue);
      ink(LINE2, prog2, COL.purple);

      // 运动主体：一只手 + 它握着的标注笔
      let tipX = X0;
      let tipY = LINE1;
      if (p < P1_END) {
        tipX = lerp(X0, X1, clamp(p / P1_END, 0, 1));
        tipY = LINE1;
      } else if (p < LIFT_END) {
        const k = clamp((p - P1_END) / (LIFT_END - P1_END), 0, 1);
        tipX = lerp(X1, X0, k);
        tipY = lerp(LINE1 - 6, LINE2, k);
      } else if (p < P2_END) {
        tipX = lerp(X0, X1, clamp((p - LIFT_END) / (P2_END - LIFT_END), 0, 1));
        tipY = LINE2;
      } else {
        const k = clamp((p - P2_END) / (1 - P2_END), 0, 1);
        tipX = lerp(X1, 620, k);
        tipY = lerp(LINE2, LINE2 - 34, k);
      }

      // 标注笔（静态道具）：笔身 + 指向书写点的笔尖
      drawTag(ctx, tipX + 10, tipY - 11, 34, 9, COL.route, true);
      drawArrow(ctx, tipX + 44, tipY - 8, tipX, tipY, COL.route, 6);
      drawHand(ctx, tipX + 58, tipY - 12, 0.85, -0.7, '#e8c9a8');

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

export default A2Scene;
