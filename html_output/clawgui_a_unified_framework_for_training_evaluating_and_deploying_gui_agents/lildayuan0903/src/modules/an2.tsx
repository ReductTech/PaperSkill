import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, AW, AH, C, car, road, text, line as kitLine } from './kit';

/** kit 的 line 因默认参数把颜色收窄成了字面量类型，这里放宽签名后复用同一实现 */
const line = kitLine as (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  lw?: number,
  dash?: number[]
) => void;

/* 类比动画：一条断了三处的路 —— 车开到第一个断口就过不去了。
   几何与 an11（第 6 章「三处断口都架上了桥」）严格一致，构成首尾呼应。
   单一运动主体（一辆车）、单一动作（向前开→被断口挡住退回）、可见目标（对岸的路）。 */

const CYCLE = 4600;
const RY = 54;
const RH = 30;
const GW = 18; // 断口宽度
const GAPS = [52, 110, 168]; // 三处断口的左边界（与 an11 相同）
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export const An2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const off = p * 200;

    // 四段路面，中间留出三处断口
    road(ctx, 0, RY, GAPS[0], RH, off);
    road(ctx, GAPS[0] + GW, RY, GAPS[1] - GAPS[0] - GW, RH, off);
    road(ctx, GAPS[1] + GW, RY, GAPS[2] - GAPS[1] - GW, RH, off);
    road(ctx, GAPS[2] + GW, RY, AW - GAPS[2] - GW, RH, off);

    GAPS.forEach((x0) => {
      const x1 = x0 + GW;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, RY, GW, RH);
      ctx.clip();
      ctx.fillStyle = 'rgba(179,55,47,0.13)';
      ctx.fillRect(x0, RY, GW, RH);
      for (let i = -2; i < 4; i++) line(ctx, x0, RY + i * 12, x1, RY + i * 12 + 20, C.fail, 1);
      ctx.restore();
      line(ctx, x0, RY, x0, RY + RH, C.fail, 2.5);
      line(ctx, x1, RY, x1, RY + RH, C.fail, 2.5);
    });

    // 唯一运动主体：一辆车，冲到第一个断口前停住 / 退回
    let cx: number;
    if (p < 0.5) cx = -26 + easeOut(p / 0.5) * 64;
    else if (p < 0.62) cx = 38 - easeOut(clamp01((p - 0.5) / 0.12)) * 14;
    else cx = 24;
    car(ctx, cx, RY + RH / 2, 0.62, p < 0.5 ? C.guide : C.fail);

    text(ctx, '断了三处', 10, 24, { size: 10, color: C.fail, weight: '700' });
    GAPS.forEach((x0) => {
      text(ctx, '✕', x0 + GW / 2, RY - 8, {
        size: 11,
        color: C.fail,
        weight: '700',
        align: 'center',
      });
    });

    if (p > 0.64 && Math.floor(p * 8) % 2 === 0) {
      text(ctx, '过不去', 24, RY + RH + 22, {
        size: 11,
        color: C.fail,
        weight: '700',
        align: 'center',
      });
    }
  });

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={AW} height={AH} />;
};

export default An2;
