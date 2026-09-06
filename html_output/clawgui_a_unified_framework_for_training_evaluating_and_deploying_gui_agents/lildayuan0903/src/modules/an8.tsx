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

/* 类比动画：两台没对齐的体重秤
   同一个人（全画布唯一的运动主体）先站上左边那台秤，读数跳出来；
   下来走到右边，再站上第二台，读数又是另一个数。
   左秤指针起点就没归零（红色偏移标记），右秤已归零（绿色标记）。
   结论：同一个人，两个数——差的是秤，不是人。

   单一运动主体：两台秤是纯静态道具（共 2 个），人分前后半个周期依次站上去，
   全程只有「走过去 → 站上秤」这一个物理动作、一个可见目标（读数）。 */

const CYCLE = 7200;
const FLOOR_Y = 110; // 地面
const BASE_H = 14; // 秤底座高度
const STAND_Y = FLOOR_Y - BASE_H; // 站在秤上时的脚底高度
const LX = 62; // 左秤中心
const RX = 182; // 右秤中心

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

/** 一台秤：圆角矩形底座 + 上方一个小显示屏 + 一个归零刻度标记 */
function scale(ctx: CanvasRenderingContext2D, cx: number, zeroed: boolean, reading: string, show: number) {
  const mark = zeroed ? C.pass : C.fail;

  // 底座 + 踏板
  fillRound(ctx, cx - 32, STAND_Y, 64, BASE_H, 4, C.envDark);
  fillRound(ctx, cx - 26, STAND_Y + 2.5, 52, 4, 2, 'rgba(255,255,255,0.3)');

  // 显示屏
  fillRound(ctx, cx - 25, 10, 50, 22, 6, C.white, mark, 1.8);
  if (show > 0.001) {
    ctx.save();
    ctx.globalAlpha = show;
    text(ctx, reading, cx, 22, {
      size: 16,
      color: C.ink,
      weight: '800',
      align: 'center',
      baseline: 'middle',
      mono: true,
    });
    ctx.restore();
  } else {
    text(ctx, '—', cx, 22, {
      size: 13,
      color: C.axis,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });
  }

  // 刻度条 + 零位刻线（零位刻线画得比指针长，好看出指针有没有压在零位上）
  line(ctx, cx - 20, 43, cx + 20, 43, C.axis, 1.6);
  line(ctx, cx, 37, cx, 49, C.muted, 1.8);

  // 指针：归零的正好压在零位上，没归零的偏出去一截
  const off = zeroed ? 0 : 11;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + off, 42);
  ctx.lineTo(cx + off - 4.5, 34);
  ctx.lineTo(cx + off + 4.5, 34);
  ctx.closePath();
  ctx.fillStyle = mark;
  ctx.fill();
  ctx.restore();

  text(ctx, zeroed ? '已归零' : '起点没归零', cx, 59, {
    size: 9.5,
    color: mark,
    weight: '700',
    align: 'center',
  });
}

/** 一个人：一个圆脑袋 + 一个圆角矩形身子 */
function person(ctx: CanvasRenderingContext2D, x: number, footY: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  fillRound(ctx, x - 7.5, footY - 21, 15, 21, 5.5, C.guide);
  ctx.beginPath();
  ctx.arc(x, footY - 27.5, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = C.guide;
  ctx.fill();
  ctx.restore();
}

export const An8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const seg = (a: number, b: number) => smooth(clamp01((p - a) / (b - a)));
    const outro = 1 - smooth(clamp01((p - 0.955) / 0.045));

    // 走过去 → 站上左秤 → 下来 → 走过去 → 站上右秤
    const x = -16 + seg(0, 0.12) * (LX + 16) + seg(0.51, 0.63) * (RX - LX);
    const lift = clamp01(seg(0.12, 0.19) - seg(0.44, 0.51) + seg(0.63, 0.7));
    const footY = FLOOR_Y - BASE_H * lift;

    const showL = smooth(clamp01((p - 0.22) / 0.05)) * outro;
    const showR = smooth(clamp01((p - 0.73) / 0.05)) * outro;

    // 地面
    line(ctx, 6, FLOOR_Y, AW - 6, FLOOR_Y, C.axis, 1.5);

    scale(ctx, LX, false, '68', showL);
    scale(ctx, RX, true, '61', showR);
    person(ctx, x, footY, outro);

    text(ctx, '示意', AW - 6, 12, { size: 9, color: C.muted, align: 'right' });

    const pop = smooth(clamp01((p - 0.85) / 0.08)) * outro;
    if (pop > 0.001) {
      ctx.save();
      ctx.globalAlpha = pop;
      text(ctx, '同一个人，两个数——差的是秤，不是人。', AW / 2, 124, {
        size: 10,
        color: C.ink,
        weight: '700',
        align: 'center',
      });
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  });

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={AW} height={AH} />;
};

export default An8;
