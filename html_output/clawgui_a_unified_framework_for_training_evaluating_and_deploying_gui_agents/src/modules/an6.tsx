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

/* 类比动画：教练什么时候开口
   左「只在终点评分」：全程一句话都没有，开到终点才给一个「不合格」——
     可到底是哪个路口出的问题，学员无从知道。
   右「每个路口点一句」：车每经过一个路口，教练当场点评一句
     （绿「这把不错」/ 橙「这里该减速」），一路都知道自己开得对不对。

   每个面板只有一辆车在动、只有「向右开完全程」这一个动作，可见目标是终点线；
   教练本人不入画，只以一句点评文字出现，因此不构成第二个运动主体。 */

const CYCLE = 6600;
const RY = 62;
const RH = 26;
const CAR_Y = RY + RH / 2;
const CHECKS = [34, 58, 82]; // 面板内三个路口的 x 偏移（终点线在 98）
const REMARK = [
  { ok: true, label: '这把不错' },
  { ok: false, label: '这里该减速' },
  { ok: true, label: '稳住了' },
];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

export const An6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(AW, AH, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;
    const u = smooth(clamp01((p - 0.06) / 0.62));
    const settled = p > 0.78;
    const pop = smooth(clamp01((p - 0.78) / 0.09));

    // 中缝竖直虚线
    line(ctx, 122, 8, 122, AH - 8, C.axis, 1, [4, 4]);

    /** 一个面板：ox 左边界，live = 教练是否每个路口都点评 */
    const panel = (ox: number, live: boolean) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, 121, AH);
      ctx.clip();

      text(ctx, live ? '每个路口点一句' : '只在终点评分', ox + 8, 20, {
        size: 11,
        color: C.ink,
        weight: '700',
      });

      road(ctx, ox + 6, RY, 109, RH, u * 90);

      // 三个路口：路面上的浅色横道
      CHECKS.forEach((cx) => {
        ctx.fillStyle = 'rgba(243,239,228,0.65)';
        ctx.fillRect(ox + cx - 1.5, RY, 3, RH);
      });

      // 终点线（可见目标）
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? C.ink : C.white;
        ctx.fillRect(ox + 98, RY + i * 6.5, 4, 6.5);
      }

      const carX = ox - 16 + u * 118;
      car(ctx, carX, CAR_Y, 0.85, settled ? (live ? C.pass : C.fail) : C.guide);

      if (live) {
        // 右侧：车每过一个路口，当场留下一句点评
        CHECKS.forEach((cx, i) => {
          const passAt = (cx + 16) / 118;
          if (u < passAt) return;
          const a = smooth(clamp01((u - passAt) / 0.07));
          const fade = 1 - smooth(clamp01((u - passAt - 0.18) / 0.1));
          const ok = REMARK[i].ok;
          // 路口上方的小圆点：一路留着，标出这一步的好坏
          ctx.save();
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(ox + cx, RY - 9, 4, 0, Math.PI * 2);
          ctx.fillStyle = ok ? C.pass : C.emph;
          ctx.fill();
          ctx.restore();
          // 当场的一句点评：说完就淡出，避免三句堆在一起
          const alpha = settled ? 0 : a * Math.max(fade, 0);
          if (alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = alpha;
            text(ctx, REMARK[i].label, ox + 60, 40, {
              size: 10,
              color: ok ? C.pass : C.emph,
              weight: '700',
              align: 'center',
            });
            ctx.restore();
          }
        });
      } else if (!settled) {
        // 左侧：全程没有任何反馈
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(t / 520));
        text(ctx, '⋯⋯', ox + 60, 40, {
          size: 14,
          color: C.muted,
          weight: '700',
          align: 'center',
        });
        ctx.restore();
      }

      // 终点判定
      if (settled) {
        ctx.save();
        ctx.globalAlpha = pop;
        fillRound(ctx, ox + 18, 99, 86, 17, 8.5, live ? C.pass : C.fail);
        text(ctx, live ? '每一步都有数' : '只知道：不合格', ox + 61, 107.5, {
          size: 9.5,
          color: C.white,
          weight: '700',
          align: 'center',
          baseline: 'middle',
        });
        ctx.globalAlpha = smooth(clamp01((p - 0.85) / 0.08));
        text(ctx, live ? '哪个路口该改，当场就知道' : '问题出在哪个路口？无从知道', ox + 61, 125, {
          size: 8.5,
          color: C.muted,
          align: 'center',
        });
        ctx.restore();
      }

      ctx.restore();
    };

    panel(0, false); // 只在终点给一个结论
    panel(123, true); // 每个路口都有一句点评

    ctx.globalAlpha = 1;
  });

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={AW} height={AH} />;
};

export default An6;
