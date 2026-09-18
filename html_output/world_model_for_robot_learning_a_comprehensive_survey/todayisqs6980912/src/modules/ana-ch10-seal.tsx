import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawTarget, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：钤印——红色印章落到作品右下角，盖下时纸面微陷、朱红印泥成形，
// 随后印章抬起复位。循环 2.8 s。

const W = 560;
const H = 140;
const DUR = 2800;

const WORK = [
  { x: 120, y: 40 },
  { x: 200, y: 34 },
  { x: 300, y: 46 },
  { x: 380, y: 38 },
  { x: 420, y: 60 },
  { x: 350, y: 74 },
  { x: 250, y: 68 },
  { x: 170, y: 78 },
];
const SEAL = { x: 440, y: 102 };
const SEAL_R = 13;

export const AnaCh10Seal: React.FC<WidgetProps> = () => {
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

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1;
      // A 0–0.42 下落；B 0.42–0.55 按压（印迹成形）；C 0.55–0.75 定格；D 0.75–1.0 抬起
      const dropU = clamp(cyc / 0.42, 0, 1);
      const pressU = clamp((cyc - 0.42) / 0.13, 0, 1);
      const liftU = clamp((cyc - 0.75) / 0.25, 0, 1);
      const lift = liftU * (1 - Math.pow(1 - liftU, 2)); // ease

      const sealY = lerp(18, SEAL.y - 2, dropU) - lift * 64;
      const dip = pressU * (1 - liftU); // 纸面微陷程度

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      // 作品（纸面 + 墨迹），按压时整幅微缩下沉
      ctx.save();
      ctx.translate(SEAL.x, SEAL.y);
      ctx.scale(1 - dip * 0.015, 1 - dip * 0.015);
      ctx.translate(-SEAL.x, -SEAL.y);
      ctx.translate(0, dip * 2);
      drawInkPath(ctx, WORK, { color: PALETTE.blue, width: 3.5 });
      ctx.restore();
      drawSceneLabel(ctx, 90, 100, '作品', { size: 12, align: 'right' });

      // 印迹：按压后留在纸上（press 出现后持续）
      if (pressU > 0.15) {
        ctx.save();
        ctx.globalAlpha = fade * Math.min(1, (pressU - 0.15) / 0.4);
        drawTarget(ctx, SEAL.x, SEAL.y, { r: SEAL_R, seal: true });
        ctx.restore();
      }

      // 印章本体（未落地时可见）
      if (liftU < 1) {
        ctx.save();
        ctx.globalAlpha = fade;
        // 印柄
        ctx.strokeStyle = PALETTE.guide;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(SEAL.x, sealY - 4);
        ctx.lineTo(SEAL.x, sealY - 22);
        ctx.stroke();
        // 印面
        drawTarget(ctx, SEAL.x, sealY, { r: SEAL_R, seal: true });
        ctx.restore();
      }

      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let raf: number | null = null;
    const tick = (ms: number) => {
      render(ms);
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

  return <canvas id="cv-ana-ch10" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh10Seal;
