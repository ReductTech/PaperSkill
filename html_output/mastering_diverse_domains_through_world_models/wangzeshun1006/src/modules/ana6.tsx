import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawFlag,
  drawSceneLabel,
  drawLegend,
  HOLD,
  GUIDE,
  OK,
  EMPH,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana6 — 把一张画着大幅崖壁剖面的长条对折两次，塞进一张巴掌大的路线卡；展开再折，循环。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const CYCLE = 3200;

const STRIP_Y = 96;
const STRIP_X0 = 40;
const STRIP_X1 = 350;
const CARD_X = 402;
const CARD_Y = 62;
const CARD_W = 110;
const CARD_H = 54;

// 崖壁剖面：一个 5 米小裂缝 + 一个 50 米仰角
const profile: number[][] = [
  [0.0, 78],
  [0.16, 70],
  [0.30, 86],
  [0.36, 34],
  [0.50, 30],
  [0.62, 74],
  [0.78, 64],
  [1.0, 82],
];

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const t = (elapsed % CYCLE) / CYCLE;
      // 展开 → 对折 → 停一会 → 再展开
      const fold =
        t < 0.34
          ? 0
          : t < 0.66
          ? easeInOutQuad((t - 0.34) / 0.32)
          : t < 0.78
          ? 1
          : 1 - easeInOutQuad((t - 0.78) / 0.22);

      clearCrag(ctx, W, H);
      drawWall(ctx, 30, 24, 500, 104);

      // 长条：随对折收拢并滑向卡片位置
      const x0 = lerp(STRIP_X0, CARD_X, fold);
      const x1 = lerp(STRIP_X1, CARD_X + CARD_W, fold);
      const amp = lerp(1, 0.34, fold);

      ctx.save();
      ctx.strokeStyle = fold > 0.55 ? OK : GUIDE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      profile.forEach((p, i) => {
        const px = lerp(x0, x1, p[0]);
        const py = lerp(STRIP_Y, CARD_Y + CARD_H / 2, fold) + (p[1] - 56) * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      // 折叠折痕：对折两次
      if (fold > 0.12) {
        ctx.save();
        ctx.strokeStyle = MUTED;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        [0.34, 0.67].forEach((f) => {
          const px = lerp(x0, x1, f);
          ctx.beginPath();
          ctx.moveTo(px, lerp(STRIP_Y, CARD_Y, fold) - 14 * amp);
          ctx.lineTo(px, lerp(STRIP_Y, CARD_Y, fold) + 22 * amp);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 路线卡：折好后出现的巴掌大小卡
      if (fold > 0.5) {
        const a = clamp((fold - 0.5) / 0.5, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        ctx.strokeRect(CARD_X, CARD_Y, CARD_W, CARD_H);
        ctx.fillStyle = HOLD;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(CARD_X + 18 + i * 24, CARD_Y + 30, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        if (a > 0.7) drawFlag(ctx, CARD_X + CARD_W - 6, CARD_Y + 6, EMPH);
      }

      // 展开时的两个落差标注（画布内至多两个标签）
      if (fold < 0.45) {
        const a = 1 - fold / 0.45;
        ctx.save();
        ctx.globalAlpha = a;
        drawSceneLabel(ctx, '5 米', STRIP_X0 + 4, 122, MUTED);
        drawSceneLabel(ctx, '50 米', STRIP_X1 - 54, 122, EMPH);
        ctx.restore();
      }

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '大幅落差' },
          { color: OK, text: '折进小图' },
          { color: EMPH, text: '路线卡' },
        ],
        360,
        20
      );
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana6;
