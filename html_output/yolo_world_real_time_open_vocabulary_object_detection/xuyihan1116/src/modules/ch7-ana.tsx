import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDesks,
  drawKid,
  drawRoster,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// 类比：一只手沿着讲台把「册子 → 教室 → 勾」依次串起来，走到哪一站，哪一站就亮。
// 560x140，无控件，约 3.2s 循环；一个动作主体（手）+ 一个目标（把整条链接通）。

const W = 560;
const H = 140;
const CYCLE = 3200;
const STOPS = [78, 283, 486];
const LINE_Y = 86;

// 手的行走关键帧：停一下、亮一站，再走
const KEYS = [
  { t: 0, x: 36 },
  { t: 0.18, x: STOPS[0] },
  { t: 0.3, x: STOPS[0] },
  { t: 0.48, x: STOPS[1] },
  { t: 0.6, x: STOPS[1] },
  { t: 0.78, x: STOPS[2] },
  { t: 1, x: STOPS[2] },
];

function easeInOut(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

function handX(p: number): number {
  for (let i = 1; i < KEYS.length; i += 1) {
    if (p <= KEYS[i].t) {
      const a = KEYS[i - 1];
      const b = KEYS[i];
      const span = b.t - a.t;
      const u = span <= 0 ? 1 : (p - a.t) / span;
      return a.x + (b.x - a.x) * easeInOut(u);
    }
  }
  return KEYS[KEYS.length - 1].x;
}

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ tick: 0 });

  const { ref } = useCanvas<{ tick: number }>(
    (ctx, time) => {
      clearScene(ctx, W, H, '一条链');
      const p = (time % CYCLE) / CYCLE;
      const hx = handX(p);
      const lit = STOPS.map((s) => hx >= s - 1);

      // 底下的连线（先画，随后被三件实物挡住）
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(STOPS[0], LINE_Y);
      ctx.lineTo(STOPS[2], LINE_Y);
      ctx.stroke();
      ctx.restore();

      // 已经走过的段落点亮成琥珀
      ctx.save();
      ctx.strokeStyle = COLORS.book;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(STOPS[0], LINE_Y);
      ctx.lineTo(Math.min(hx, STOPS[2]), LINE_Y);
      ctx.stroke();
      ctx.restore();

      // 三件实物：册子、教室、勾
      drawRoster(ctx, 28, 28, 92, 40, { lines: 3 });
      drawDesks(ctx, 222, 22, 126, 46, { rows: 2, cols: 3 });
      drawKid(ctx, 243, 40, 0.85, { kind: 'look' });
      drawKid(ctx, 285, 40, 0.85);
      drawKid(ctx, 327, 40, 0.85);

      ctx.save();
      ctx.fillStyle = COLORS.roster;
      ctx.fillRect(470, 34, 32, 32);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(470, 34, 32, 32);
      ctx.restore();
      drawTick(ctx, 486, 50, { ok: true });

      // 实物到连线的小接头
      ctx.save();
      ctx.strokeStyle = COLORS.chalkDim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(74, 68);
      ctx.lineTo(STOPS[0], LINE_Y);
      ctx.moveTo(285, 68);
      ctx.lineTo(STOPS[1], LINE_Y);
      ctx.moveTo(486, 66);
      ctx.lineTo(STOPS[2], LINE_Y);
      ctx.stroke();
      ctx.restore();

      // 站点：走过就亮
      STOPS.forEach((s, i) => {
        ctx.save();
        if (lit[i]) {
          ctx.beginPath();
          ctx.arc(s, LINE_Y, 13, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.book;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = COLORS.book;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(s, LINE_Y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = lit[i] ? COLORS.book : COLORS.chalkDim;
        ctx.fill();
        ctx.restore();
      });

      // 手：沿着这条线走，手指点着当前这一站
      ctx.save();
      ctx.strokeStyle = COLORS.chalk;
      ctx.lineCap = 'round';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hx - 12, 130);
      ctx.quadraticCurveTo(hx - 8, 114, hx, 104);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, 100, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.chalk;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx, 93);
      ctx.lineTo(hx, 84);
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

export default Ch7Ana;
