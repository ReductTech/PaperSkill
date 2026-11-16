import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawLabel,
  drawName,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// 类比：一只手把一叠名字卡按「远近」一张张摆到尺子上，越像的两张最后挨在一起。
// 560x140，无控件，约 2.9s 循环；只有一个动作主体（手）和一个目标（把像的排到一起）。

const W = 560;
const H = 140;
const CYCLE = 2900;
const NAMES = ['小明', '小红', '小刚', '小美', '小强'];
// 示意相似度：越靠左越像，尺子上的数字就是它
const SIM = [0.86, 0.78, 0.52, 0.3, 0.12];
const SLOT_X = [80, 180, 280, 380, 480];
const CARD_W = 72;
const CARD_Y = 62;

function easeInOut(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ tick: 0 });

  const { ref } = useCanvas<{ tick: number }>(
    (ctx, time) => {
      clearScene(ctx, W, H, '按远近排');
      const p = (time % CYCLE) / CYCLE;
      // 手从左往右走完一排；走到哪一格，哪一格就摆好
      const handX = 50 + easeInOut(clamp(p / 0.84, 0, 1)) * 452;
      const placedCount = SLOT_X.filter((x) => handX >= x - 0.5).length;

      // 尺子：名字卡按距离摆开的参照
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 104);
      ctx.lineTo(520, 104);
      ctx.stroke();
      ctx.restore();

      SLOT_X.forEach((x, i) => {
        const done = i < placedCount;
        ctx.save();
        ctx.strokeStyle = done ? COLORS.chalkDim : COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 104);
        ctx.lineTo(x, 111);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, SIM[i].toFixed(2), x, 126, {
          size: 12,
          color: done ? COLORS.chalkDim : COLORS.axis,
          align: 'center',
        });
      });

      // 空槽位：目标是把一整排摆出来
      SLOT_X.forEach((x, i) => {
        if (i < placedCount) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - CARD_W / 2, CARD_Y, CARD_W, 22);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // 已经摆好的卡：最像的两张（0.86 / 0.78）高亮
      SLOT_X.forEach((x, i) => {
        if (i >= placedCount) return;
        drawName(ctx, x - CARD_W / 2, CARD_Y, {
          text: NAMES[i],
          width: CARD_W,
          active: i < 2,
        });
      });

      // 手上正拿着下一张（略高于已摆好的一排）
      if (placedCount < 5) {
        drawName(ctx, handX - CARD_W / 2, CARD_Y - 10, {
          text: NAMES[placedCount],
          width: CARD_W,
        });
      }

      // 摆到第二张时，「像」的两张之间打勾
      if (placedCount >= 2) drawTick(ctx, 130, 73, { ok: true });

      // 手：只画一只，从左边一路摆到右边
      ctx.save();
      ctx.strokeStyle = COLORS.chalk;
      ctx.lineCap = 'round';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(handX - 12, 130);
      ctx.quadraticCurveTo(handX - 8, 114, handX, 100);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(handX, 96, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.chalk;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(handX, 89);
      ctx.lineTo(handX, 76);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch4Ana;
