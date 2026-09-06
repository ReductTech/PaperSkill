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

/* 类比动画：常去那家店的「老样子」——
   你只发三个字，一杯贴着「少冰 · 半糖」的饮品就从右侧滑到你面前。
   单一运动主体（那杯饮品）、单一动作（滑到你面前）、可见目标（桌上的杯垫）；
   静态道具两件：聊天气泡 + 杯垫。 */

const CYCLE = 6000;
const TABLE_Y = 97;
const DEST_X = 74;
const START_X = AW + 52;
const CUP_TOP = 42;
const CUP_BOT = 90;
const TOP_HALF = 33; // 上口半宽
const BOT_HALF = 26; // 杯底半宽

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

/** 上宽下窄的圆角梯形杯身 */
function cupBody(ctx: CanvasRenderingContext2D, cx: number, fill: string) {
  const r = 5;
  const h = CUP_BOT - CUP_TOP;
  const halfAt = (y: number) => TOP_HALF + ((BOT_HALF - TOP_HALF) * (y - CUP_TOP)) / h;
  const hr = halfAt(CUP_BOT - r);
  ctx.beginPath();
  ctx.moveTo(cx - TOP_HALF, CUP_TOP);
  ctx.lineTo(cx + TOP_HALF, CUP_TOP);
  ctx.lineTo(cx + hr, CUP_BOT - r);
  ctx.quadraticCurveTo(cx + BOT_HALF, CUP_BOT, cx + BOT_HALF - r, CUP_BOT);
  ctx.lineTo(cx - BOT_HALF + r, CUP_BOT);
  ctx.quadraticCurveTo(cx - BOT_HALF, CUP_BOT, cx - hr, CUP_BOT - r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export const An9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const slide = smooth(clamp01((p - 0.22) / 0.42));
    const arrived = p > 0.66;
    const cupColor = arrived ? C.pass : C.guide;
    const cx = START_X + slide * (DEST_X - START_X);

    // 桌面（场景地平线）
    line(ctx, 0, TABLE_Y, AW, TABLE_Y, C.envDark, 2);

    // 静态道具 1：聊天气泡 —— 你只发了三个字
    const bubblePop = smooth(clamp01((p - 0.03) / 0.08));
    ctx.save();
    ctx.globalAlpha = bubblePop;
    fillRound(ctx, 10, 8, 76, 24, 10, C.white, C.emph, 1.6);
    ctx.beginPath();
    ctx.moveTo(34, 31);
    ctx.lineTo(18, 41);
    ctx.lineTo(24, 31);
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.strokeStyle = C.emph;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    text(ctx, '老样子', 48, 20.5, {
      size: 13,
      color: C.ink,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();

    // 静态道具 2：杯垫 —— 饮品要停的位置（可见目标）
    fillRound(ctx, DEST_X - 32, TABLE_Y - 9, 64, 9, 4.5, arrived ? C.pass : C.axis);

    // 唯一运动主体：那杯饮品，从右侧滑到你面前
    // 吸管
    line(ctx, cx + 14, 37, cx + 24, 15, 'rgba(43,39,36,0.6)', 3.5);
    // 杯身
    cupBody(ctx, cx, cupColor);
    // 杯盖
    fillRound(ctx, cx - 37, 34, 74, 9, 3.5, 'rgba(43,39,36,0.78)');
    // 杯身上的偏好标签
    fillRound(ctx, cx - 27, 56, 54, 16, 4, C.white, cupColor, 1.4);
    text(ctx, '少冰 · 半糖', cx, 64.5, {
      size: 8.5,
      color: C.ink,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });

    // 前半段一闪而过的灰色小字：如果店家不记得你，就得全说一遍
    const hint =
      p < 0.1 ? clamp01((p - 0.04) / 0.06) : p < 0.36 ? 1 : 1 - clamp01((p - 0.36) / 0.08);
    if (hint > 0.01) {
      ctx.save();
      ctx.globalAlpha = hint;
      text(ctx, '不记得你，就得说：少冰、半糖、大杯、不要吸管', AW / 2, 116, {
        size: 9,
        color: C.muted,
        align: 'center',
        baseline: 'middle',
      });
      ctx.restore();
    }

    // 结尾徽章
    if (p > 0.72) {
      const pop = smooth(clamp01((p - 0.72) / 0.08));
      ctx.save();
      ctx.globalAlpha = pop;
      fillRound(ctx, AW / 2 - 74, 108, 148, 17, 8.5, C.pass);
      text(ctx, '记得你，所以一句话就够', AW / 2, 116.5, {
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

export default An9;
