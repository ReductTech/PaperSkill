import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawChalkPuff,
  drawTopoCard,
  drawSceneLabel,
  EMPH,
  GUIDE,
  HOLD,
  INK,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana4 — 简图要和真墙对得上：攀岩者先看左边的简图，再看右边的真墙，
// 用粉笔圈出一个被漏掉的支点；简图随之补上这个点。自动循环，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3400;

const CARD = { x: 36, y: 26, w: 150, h: 88 };
// 简图上的支点（绝对坐标，位于卡片内）
const CARD_PTS: number[][] = [
  [70, 80],
  [100, 60],
  [118, 42],
];
const CARD_EXTRA: number[] = [140, 52];
// 真墙上的支点，最后一个是被漏掉、需要补圈的关键点
const WALL_PTS: number[][] = [
  [360, 100],
  [404, 78],
  [462, 62],
];
const MISSING: number[] = [438, 54];

function cardPts(withExtra: boolean): number[][] {
  return withExtra ? [...CARD_PTS, CARD_EXTRA] : CARD_PTS;
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (elapsed % DUR) / DUR;
      const found = t >= 0.8;

      clearCrag(ctx, W, H);

      // 左边：简图卡片
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = found ? GUIDE : LINE;
      ctx.lineWidth = found ? 2.5 : 1.5;
      ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
      ctx.strokeRect(CARD.x, CARD.y, CARD.w, CARD.h);
      drawTopoCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, cardPts(found), GUIDE);

      // 右边：真墙
      drawWall(ctx, 330, 14, 200, 106);
      for (const p of WALL_PTS) drawHold(ctx, p[0], p[1], 6, HOLD);
      drawHold(ctx, MISSING[0], MISSING[1], 6, HOLD, t > 0.5);

      // 主体：站在中间的攀岩者
      drawClimber(ctx, 268, 118, 1, INK, 'rest');

      // 移动的粉笔：简图 → 真墙漏掉的点 → 回到手边
      let hand: number[];
      if (t < 0.25) {
        hand = [296, 92];
      } else if (t < 0.5) {
        hand = [lerp(296, 130, easeOutCubic((t - 0.25) / 0.25)), lerp(92, 66, (t - 0.25) / 0.25)];
      } else if (t < 0.82) {
        hand = [lerp(130, MISSING[0], easeOutCubic((t - 0.5) / 0.32)), lerp(66, MISSING[1], (t - 0.5) / 0.32)];
      } else {
        hand = [lerp(MISSING[0], 296, easeOutCubic((t - 0.82) / 0.18)), lerp(MISSING[1], 92, (t - 0.82) / 0.18)];
      }
      drawChalkPuff(ctx, hand[0], hand[1], 0.85);
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(hand[0], hand[1], 4, 0, Math.PI * 2);
      ctx.fill();

      // 粉笔圈：在漏掉的关键点上
      if (t > 0.5 && t < 0.9) {
        const k = clamp((t - 0.5) / 0.25, 0, 1);
        ctx.save();
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(MISSING[0], MISSING[1], 10 + k * 6, -Math.PI * 0.9, Math.PI * 1.4);
        ctx.stroke();
        ctx.restore();
      }

      // 简图补漏：漏掉的点出现并连上
      if (found) {
        ctx.fillStyle = EMPH;
        ctx.beginPath();
        ctx.arc(CARD_EXTRA[0], CARD_EXTRA[1], 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CARD_PTS[CARD_PTS.length - 1][0], CARD_PTS[CARD_PTS.length - 1][1]);
        ctx.lineTo(CARD_EXTRA[0], CARD_EXTRA[1]);
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '简图', 36, 20, GUIDE);
      drawSceneLabel(ctx, '真墙', 330, 10, INK);
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

export default Ana4;
