import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { COL, clearScene, drawPage, drawTag, drawHand, label } from './sceneKit';
import type { WidgetProps } from './registry';

// §5 类比动画：一只手合上相册本，并贴上一张小结条。
// 单手、单动作、2.8 s 循环 + 0.7 s 离屏停顿；无控件、无反馈行。

const W = 560;
const H = 140;
const LOOP = 3500;

const PAGE_W = 110;
const PAGE_H = 80;
const PAGE_Y = 18;
const SPINE_X = 280;
const CLOSE_END = 0.45;

export const A5Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = (t % LOOP) / LOOP;
      clearScene(ctx, W, H, true);

      // 静态道具：摊开的相册本左半页
      drawPage(ctx, SPINE_X - PAGE_W, PAGE_Y, PAGE_W, PAGE_H, COL.route, 3);

      // 右半页绕书脊向左合拢（宽度随 cos 收缩，越过中线后翻到左侧）
      const cosv = p < CLOSE_END ? Math.cos(Math.PI * easeInOutQuad(p / CLOSE_END)) : -1;
      const pw = Math.max(2, PAGE_W * Math.abs(cosv));
      const px = cosv >= 0 ? SPINE_X : SPINE_X - pw;
      ctx.save();
      ctx.fillStyle = COL.white;
      ctx.fillRect(px, PAGE_Y, pw, PAGE_H);
      ctx.strokeStyle = COL.route;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, PAGE_Y, pw, PAGE_H);
      if (pw > 26) {
        ctx.strokeStyle = COL.axis;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i += 1) {
          const ly = PAGE_Y + 20 + i * 16;
          ctx.beginPath();
          ctx.moveTo(px + 10, ly);
          ctx.lineTo(px + pw - 10, ly);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 唯一运动主体：手（合页 → 取小结条 → 贴上 → 移出左下角）
      let handX = SPINE_X;
      let handY = PAGE_Y + PAGE_H - 6;
      let tagVisible = false;
      let tagX = 0;
      let tagY = 0;
      if (p < CLOSE_END) {
        const edge = cosv >= 0 ? SPINE_X + pw : SPINE_X - pw;
        handX = Math.max(182, Math.min(384, edge));
        handY = PAGE_Y + PAGE_H - 6;
      } else if (p < 0.62) {
        const u = (p - CLOSE_END) / (0.62 - CLOSE_END);
        handX = SPINE_X + (470 - SPINE_X) * u;
        handY = 92 + (112 - 92) * u;
      } else if (p < 0.78) {
        const u = (p - 0.62) / (0.78 - 0.62);
        handX = 470 + (188 - 470) * u;
        handY = 112 + (54 - 112) * u;
        tagVisible = true;
        tagX = handX - 46;
        tagY = handY - 34;
      } else if (p < 0.86) {
        handX = 188;
        handY = 54;
        tagVisible = true;
        tagX = 166;
        tagY = 46;
      } else {
        const u = (p - 0.86) / 0.14;
        handX = 188 - 160 * u;
        handY = 54 + 100 * u;
        tagVisible = true;
        tagX = 166;
        tagY = 46;
      }

      if (tagVisible) drawTag(ctx, tagX, tagY, 46, 16, COL.orange, true);
      drawHand(ctx, handX, handY, 0.8, -0.5);

      // 类比动画不画文字标签：动作本身说明一切

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

export default A5Scene;
