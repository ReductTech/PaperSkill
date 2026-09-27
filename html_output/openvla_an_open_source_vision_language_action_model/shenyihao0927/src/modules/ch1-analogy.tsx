import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWorker, drawCabinet, drawSceneLabel } from './flatKit';
import type { WidgetProps } from './registry';

// 类比动画（§1）：组装工站在挂锁的黑箱成品柜前摊手——名牌店连图纸都锁在保险柜里。
// 一个动体（红衣摊手的组装工原地起伏），两个静物（上锁成品柜 + 高价签）。
const W = 560;
const H = 140;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
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

    const render = (ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // locked assembled cabinet (static prop 1)
      drawCabinet(ctx, 430, 112, 1.35, { assembled: true });
      // padlock glyph on the door
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.fillStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(430, 76, 5, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(423, 76, 14, 12, 2);
      ctx.fill();
      ctx.restore();
      // swinging price tag (static prop 2, hung on the cabinet)
      const swing = Math.sin(ms / 420) * 0.14;
      ctx.save();
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(458, 40);
      ctx.lineTo(458, 48);
      ctx.stroke();
      ctx.translate(458, 48);
      ctx.rotate(swing);
      ctx.fillStyle = C.orange;
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-13, 0, 26, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('高价', 0, 8);
      ctx.restore();
      // the moving subject: shrugging worker bobbing in place
      const bob = Math.abs(Math.sin(ms / 320)) * 4;
      drawWorker(ctx, 245, 112 - bob, 1.45, { mode: 'locked', t: ms / 300, color: C.red });
      drawSceneLabel(ctx, '闭源黑箱柜', 16, 24, { color: C.red });
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

export default Ch1Analogy;
