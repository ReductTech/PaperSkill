import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawBackground, drawTable, drawScale, drawWeight } from './scaleKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 160;

// Hero 两侧对比：old = 直接四舍五入（天平反复倾斜、红色）；new = GPTQ 误差补偿（天平回平、绿色）。
export const HeroScale: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      drawBackground(ctx, W, H);
      drawTable(ctx, W, H, 128);
      const phase = (t % 2600) / 2600;

      if (isNew) {
        // 本文方法：两侧砝码保持平衡，绿色
        drawScale(ctx, W / 2, 84, 180, 0, C.green);
        drawWeight(ctx, W / 2 - 180, 118, 34, 26, C.green);
        drawWeight(ctx, W / 2 + 180, 118, 34, 26, C.green);
      } else {
        // 旧方法：砝码被"削掉"后反复倾斜，红色
        const tilt = Math.sin(phase * Math.PI * 2) * 0.16;
        drawScale(ctx, W / 2, 84, 180, tilt, C.red);
        drawWeight(ctx, W / 2 - 180, 116, 34, 30, C.red);
        drawWeight(ctx, W / 2 + 180, 112, 30, 20, C.red);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isNew]);

  return <canvas ref={canvasRef} width={W} height={H} aria-label={isNew ? '本文方法天平' : '传统方法天平'} />;
};

export default HeroScale;
