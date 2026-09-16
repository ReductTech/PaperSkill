import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawPage, drawHand } from './sceneKit';
import type { WidgetProps } from './registry';

// §10 类比动画：一只手并排对照两本摊开的相册，在两本之间来回掀页，
// 最后把手停在留页更多的一本上。单手、单动作、3.0 s 循环，无控件、无反馈条。
// 手的位置曲线在循环首尾同值（都停在右册上），因此循环处不会跳变。

const W = 560;
const H = 140;
const LOOP = 3000;
const LEFT_CX = 155;
const RIGHT_CX = 405;

/** 手在两本相册之间来回移动：右（停在结论上）→ 左 → 右，首尾相接。 */
function handX(p: number): number {
  if (p < 0.15) return RIGHT_CX;
  if (p < 0.5) return RIGHT_CX - (RIGHT_CX - LEFT_CX) * easeInOutQuad((p - 0.15) / 0.35);
  if (p < 0.65) return LEFT_CX;
  return LEFT_CX + (RIGHT_CX - LEFT_CX) * easeInOutQuad((p - 0.65) / 0.35);
}

export const A10Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // 被掀起的一页：只是相册自身的动作，不构成第三个道具。
    const liftPage = (cx: number, cy: number, angle: number): void => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      fillRound(ctx, -18, -7, 56, 14, 3, COL.white);
      roundRect(ctx, -18, -7, 56, 14, 3);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    // 手离某一册越近，那一册被掀起的页角越明显（连续，循环处不跳变）。
    const near = (x: number, cx: number): number => Math.max(0, 1 - Math.abs(x - cx) / 70);

    const render = (t: number) => {
      const p = (t % LOOP) / LOOP;
      clearScene(ctx, W, H, true);

      // 静态道具一：左侧相册（留住的“一起”较少，页少）
      fillRound(ctx, 74, 38, 6, 76, 3, COL.purple);
      drawPage(ctx, 80, 38, 150, 76, COL.purple, 4);

      // 静态道具二：右侧相册（留住的“一起”更多，页更多）
      fillRound(ctx, 324, 24, 6, 90, 3, COL.purple);
      drawPage(ctx, 330, 24, 150, 90, COL.purple, 5);

      // 运动主体：一只手在两本之间来回对照，最后停在右册上
      const hx = handX(p);
      const ll = near(hx, LEFT_CX);
      const rl = near(hx, RIGHT_CX);
      if (ll > 0.05) liftPage(170, 36, -0.3 - 0.5 * ll);
      if (rl > 0.05) liftPage(420, 22, -0.3 - 0.5 * rl);
      drawHand(ctx, hx, 106, 0.85, -0.12 - 0.12 * (rl - ll), '#e8c9a8');

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

export default A10Scene;
