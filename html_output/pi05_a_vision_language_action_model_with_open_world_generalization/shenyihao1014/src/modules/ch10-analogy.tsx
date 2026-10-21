import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawHome, drawCheckMark, drawSceneLabel } from './movingKit';
import type { WidgetProps } from './registry';

// §10 analogy 「交房」: three unseen homes become tidy side by side; a green
// 「客户验收」 stamp blinks twice above them; a notice sticky (告示) sits on
// the side — a good crew posts its own shortcomings on the door.
const W = 560;
const H = 200;
const LOOP = 6400;

const HOME_X = [22, 156, 290];
const HOME_W = 112;
const HOME_H = 96;
const HOME_Y = 42;

export const Ch10Analogy: React.FC<WidgetProps> = () => {
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
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // three unseen homes, tidiness advancing (staggered)
      for (let i = 0; i < 3; i++) {
        const tidy = clamp((t - i * 0.05) / 0.6, 0, 1);
        drawHome(ctx, HOME_X[i], HOME_Y, HOME_W, HOME_H, {
          familiar: false,
          tidy01: tidy,
          label: `新家 ${i + 1}`,
        });
        if (tidy >= 1) drawCheckMark(ctx, HOME_X[i] + HOME_W - 14, HOME_Y + 12, 8);
      }

      // notice sticky on the side (limitations + prospect)
      const sx = 438;
      const sy = 40;
      ctx.save();
      ctx.fillStyle = '#f6e7a1';
      ctx.strokeStyle = '#d8c56d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 96, sy);
      ctx.lineTo(sx + 96, sy + 78);
      ctx.lineTo(sx + 78, sy + 96);
      ctx.lineTo(sx, sy + 96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // folded corner
      ctx.fillStyle = '#e8d68a';
      ctx.beginPath();
      ctx.moveTo(sx + 78, sy + 96);
      ctx.lineTo(sx + 96, sy + 78);
      ctx.lineTo(sx + 78, sy + 78);
      ctx.closePath();
      ctx.fill();
      // three red notices + one green prospect line
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = C.red;
        ctx.beginPath();
        ctx.moveTo(sx + 12, sy + 20 + k * 18);
        ctx.lineTo(sx + 66 + (k % 2) * 14, sy + 20 + k * 18);
        ctx.stroke();
      }
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(sx + 12, sy + 74);
      ctx.lineTo(sx + 58, sy + 74);
      ctx.stroke();
      ctx.restore();

      // 「客户验收」 stamp blinks twice once all homes are tidy
      if (t > 0.74) {
        const sub = (t - 0.74) / 0.26;
        const seg = Math.floor(sub * 4);
        const alpha = seg % 2 === 0 ? 0.95 : 0.12;
        ctx.save();
        ctx.translate(212, 78);
        ctx.rotate(-0.14);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-72, -23, 144, 46, 8);
        ctx.stroke();
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(-66, -17, 132, 34, 6);
        ctx.stroke();
        ctx.fillStyle = C.green;
        ctx.font = 'bold 21px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('客户验收', 0, 1);
        ctx.restore();
      }

      drawSceneLabel(ctx, '告示也照贴', 486, 156, { color: C.muted, align: 'center' });
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

export default Ch10Analogy;
