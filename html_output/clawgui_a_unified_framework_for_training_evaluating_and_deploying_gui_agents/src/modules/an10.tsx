import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, AW, AH, C, text, fillRound, line as kitLine } from './kit';

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

/* 类比动画：练过的小个子跑赢没练过的大块头 ——
   左右各一个面板，每个面板只有一个跑者在动、只有一条终点线要冲。
   决定成绩的不是体格，而是有没有经过正确的训练。 */

const CYCLE = 5800;
const GROUND = 94;
const FINISH_X = 100; // 面板内的终点线横坐标
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);
/** 归一化速度：起步与停下时腿的摆幅自然收敛到 0 */
const spd = (u: number) => Math.min(1, (6 * u * (1 - u)) / 1.35);

/** 圆脑袋 + 圆角矩形身子 + 两条摆动的腿 */
function runner(
  ctx: CanvasRenderingContext2D,
  x: number,
  s: number,
  wMul: number,
  color: string,
  ph: number,
  amp: number
) {
  const hipY = GROUND - 16 * s;
  const legLen = 16 * s;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.4 * s;
  ctx.lineCap = 'round';
  [amp * Math.sin(ph), -amp * Math.sin(ph)].forEach((a) => {
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x + Math.sin(a) * legLen, hipY + Math.cos(a) * legLen);
    ctx.stroke();
  });
  ctx.restore();
  fillRound(ctx, x - 7 * s * wMul, hipY - 24 * s, 14 * s * wMul, 26 * s, 6 * s, color);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, hipY - 30 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
}

export const An10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const uBig = smooth(clamp01((p - 0.05) / 0.72)); // 没练过：慢，且到不了终点
    const uSmall = smooth(clamp01((p - 0.05) / 0.42)); // 练过：快，先冲线
    const settled = p > 0.62;

    line(ctx, 122, 8, 122, AH - 8, C.axis, 1, [4, 4]);

    /** 一个面板：ox 左边界，u 行进进度，endX 终止位置，win 是否冲线 */
    const panel = (
      ox: number,
      u: number,
      endX: number,
      s: number,
      wMul: number,
      cadence: number,
      win: boolean
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, 121, AH);
      ctx.clip();

      // 跑道地面
      line(ctx, ox + 6, GROUND, ox + 116, GROUND, C.envDark, 2);

      // 可见目标：终点线（旗杆 + 方格旗）
      const fx = ox + FINISH_X;
      line(ctx, fx, 40, fx, GROUND, C.envDark, 2);
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? C.ink : C.white;
          ctx.fillRect(fx + 1 + c * 5, 40 + r * 5.5, 5, 5.5);
        }
      }
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 1, 40, 15, 11);
      text(ctx, '终点', fx + 8.5, 35, {
        size: 8.5,
        color: C.muted,
        align: 'center',
        baseline: 'bottom',
      });

      // 唯一运动主体：这个面板里的那一个跑者
      const x = ox + 14 + u * (endX - 14);
      const color = settled ? (win ? C.pass : C.fail) : C.guide;
      runner(ctx, x, s, wMul, color, t / cadence, 0.55 * spd(u));
      ctx.restore();
    };

    panel(0, uBig, 64, 1.2, 1.5, 130, false); // 块头大 · 没练过
    panel(123, uSmall, 112, 0.8, 1, 85, true); // 个子小 · 练过

    text(ctx, '块头大 · 没练过', 9, 19, { size: 10, color: C.ink, weight: '700' });
    text(ctx, '个子小 · 练过', 132, 19, { size: 10, color: C.ink, weight: '700' });

    if (settled) {
      const pop = smooth(clamp01((p - 0.62) / 0.1));
      ctx.save();
      ctx.globalAlpha = pop;
      fillRound(ctx, 32, 107, 56, 17, 8.5, C.fail);
      text(ctx, '还在半路', 60, 115.5, {
        size: 10,
        color: C.white,
        weight: '700',
        align: 'center',
        baseline: 'middle',
      });
      fillRound(ctx, 153, 107, 60, 17, 8.5, C.pass);
      text(ctx, '练过的先到', 183, 115.5, {
        size: 10,
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

export default An10;
