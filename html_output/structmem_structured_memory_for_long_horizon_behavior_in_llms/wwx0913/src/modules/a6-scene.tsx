import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import { COL, clearScene, drawPage, drawPhoto, drawHand } from './sceneKit';
import type { WidgetProps } from './registry';

// §6 类比动画（560×140）：一只手同时压住相册的两页向右翻开——左页露出一张原始照片卡，
// 右页露出一张写满小结的注记页，两页并列摊平后停住。单手、单动作、3.0 s 循环。
// 静态道具：相册（左右两页）。运动主体：一只手。

const W = 560;
const H = 140;
const LOOP = 3000;

export const A6Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H, true);

      const p = (t % LOOP) / LOOP;
      // 摊开进度：0.45 之前把两页翻开，之后保持摊平停住
      const open = easeInOutQuad(clamp(p / 0.45, 0, 1));
      const cx = 280;
      const top = 26;
      const ph = 88;
      const half = 8 + 124 * open;

      // 左页：当天的原始照片
      drawPage(ctx, cx - half, top, half, ph, COL.blue, 0);
      // 右页：这段时间合成的小结注记页
      drawPage(ctx, cx, top, half, ph, COL.purple, 5);

      // 左页里的原始照片卡（页面摊开到一定程度才露出）
      if (open > 0.5 && half > 34) {
        const a = clamp((open - 0.5) / 0.4, 0, 1);
        const prev = ctx.globalAlpha;
        ctx.globalAlpha = a;
        drawPhoto(ctx, cx - half + 12, top + 14, half - 24, ph - 28, -0.03, COL.axis);
        ctx.globalAlpha = prev;
      }

      // 书脊
      ctx.save();
      ctx.strokeStyle = COL.route;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx, top + ph);
      ctx.stroke();
      ctx.restore();

      // 运动主体：一只手同时压住两页，从右侧压到书脊处
      const hx = cx + 170 - 170 * open;
      const hy = 28 + 16 * open;
      drawHand(ctx, hx, hy, 1.15, -0.7 + 0.7 * open, '#e8c9a8');

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

export default A6Scene;
