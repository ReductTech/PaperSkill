import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, gameField, drawPictureCard, drawDescriber } from '../canvas-scene';

const W = 560;
const H = 140;

// 第 2 章 类比动画：讲解者把画面拆成四块逐个讲（持粉笔者=讲解者）。
// 四块信息区在图片卡内部居中排布。
export const Ana2: React.FC<WidgetProps> = () => {
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
    const render = (t: number) => {
      const phase = ((t - t0) / 3200) % 1;
      gameField(ctx, W, H);
      // 图片卡固定在中央，四块区域以卡片中心对称排布
      const cx = 300, cy = 72, cw = 170, ch = 116;
      drawPictureCard(ctx, cx - cw / 2, cy - ch / 2, cw, 'clean');
      const zw = 62, zh = 38, gapx = 10, gapy = 12;
      const zx0 = cx - (zw * 2 + gapx) / 2;
      const zy0 = cy - (zh * 2 + gapy) / 2;
      const lit = Math.floor(phase * 4.6);
      for (let i = 0; i < 4; i++) {
        const zx = zx0 + (i % 2) * (zw + gapx);
        const zy = zy0 + Math.floor(i / 2) * (zh + gapy);
        ctx.save();
        ctx.strokeStyle = i < lit ? C.blue : C.axis;
        ctx.lineWidth = i < lit ? 3 : 2;
        ctx.setLineDash(i < lit ? [] : [5, 4]);
        ctx.beginPath();
        ctx.rect(zx, zy, zw, zh);
        ctx.stroke();
        ctx.restore();
      }
      drawDescriber(ctx, 110, 120, 56, C.blue);
      // 右侧四格进度
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.fillStyle = i < lit ? C.green : C.axis;
        ctx.fillRect(410 + i * 32, 62, 24, 24);
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
  return <canvas id="cv-ana-2" ref={ref} width={W} height={H} />;
};
export default Ana2;
