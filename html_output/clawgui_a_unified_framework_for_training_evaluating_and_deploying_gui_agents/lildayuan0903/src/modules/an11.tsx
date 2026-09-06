import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, AW, AH, C, car, road, text, fillRound, line as kitLine } from './kit';

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

/* 类比动画：第 1 章那条断了三处的路，现在架上了桥 ——
   断口的画法沿用 an2（红色斜线剖面 + 两道红色断面线），只是每处都搭上了绿色小桥。
   单一运动主体（一辆车）、单一动作（从最左一路开到最右）、可见目标（走完全程）。 */

const CYCLE = 6000;
const RY = 54;
const RH = 30;
const CAR_Y = RY + RH / 2;
const GW = 18; // 断口宽度，与 an2 一致
const GAPS = [52, 110, 168]; // 三处断口的左边界
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

export const An11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const u = smooth(clamp01((p - 0.06) / 0.66));
    const carX = -26 + u * (AW + 52);
    const finished = p > 0.8;

    // 四段路面，中间留出三处断口
    const off = u * 200;
    road(ctx, 0, RY, GAPS[0], RH, off);
    road(ctx, GAPS[0] + GW, RY, GAPS[1] - GAPS[0] - GW, RH, off);
    road(ctx, GAPS[1] + GW, RY, GAPS[2] - GAPS[1] - GW, RH, off);
    road(ctx, GAPS[2] + GW, RY, AW - GAPS[2] - GW, RH, off);

    GAPS.forEach((x0) => {
      const x1 = x0 + GW;
      const mid = x0 + GW / 2;
      const done = carX > x1 + 8;

      // 断口剖面：沿用 an2 的视觉语言，只是压低了浓度（已经架上桥了）
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, RY, GW, RH);
      ctx.clip();
      ctx.fillStyle = 'rgba(179,55,47,0.10)';
      ctx.fillRect(x0, RY, GW, RH);
      for (let i = -2; i < 4; i++) {
        line(ctx, x0, RY + i * 12, x1, RY + i * 12 + 20, 'rgba(179,55,47,0.42)', 1);
      }
      ctx.restore();
      line(ctx, x0, RY, x0, RY + RH, C.fail, 1.8);
      line(ctx, x1, RY, x1, RY + RH, C.fail, 1.8);

      // 桥：桥墩 + 桥面 + 栏杆；车驶过后转为实心绿
      const bx = x0 - 9;
      const bw = GW + 18;
      line(ctx, x0 + 1.5, RY + 23, x0 + 1.5, RY + RH + 8, C.pass, 2.4);
      line(ctx, x1 - 1.5, RY + 23, x1 - 1.5, RY + RH + 8, C.pass, 2.4);
      fillRound(ctx, bx, RY + 7, bw, 16, 3, done ? C.pass : C.white, C.pass, 2);
      line(ctx, bx, RY + 1, bx + bw, RY + 1, C.pass, 2);
      for (let i = 0; i <= 3; i++) {
        const px = bx + (bw * i) / 3;
        line(ctx, px, RY + 1, px, RY + 7, C.pass, 1.6);
      }

      // 驶过之后，桥下打一个小对勾
      if (done) {
        ctx.save();
        ctx.strokeStyle = C.pass;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mid - 5, 99);
        ctx.lineTo(mid - 1.5, 103);
        ctx.lineTo(mid + 5, 95);
        ctx.stroke();
        ctx.restore();
      }
    });

    // 唯一运动主体：一辆车，一路开过三座桥
    car(ctx, carX, CAR_Y, 0.62, finished ? C.pass : C.guide);

    text(ctx, '第 1 章：断了三处', 10, 24, { size: 10, color: C.fail, weight: '700' });
    text(ctx, '现在：三座桥', AW - 10, 24, {
      size: 10,
      color: C.pass,
      weight: '700',
      align: 'right',
    });

    if (finished) {
      const pop = smooth(clamp01((p - 0.8) / 0.1));
      ctx.save();
      ctx.globalAlpha = pop;
      fillRound(ctx, AW / 2 - 64, 108, 128, 17, 8.5, C.pass);
      text(ctx, '三处断口，一次走完', AW / 2, 116.5, {
        size: 9.5,
        color: C.white,
        weight: '700',
        align: 'center',
        baseline: 'middle',
      });
      ctx.restore();
    }
  });

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={AW} height={AH} />;
};

export default An11;
