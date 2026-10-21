import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §10 analogy — 生活隐喻（双盘混音台）：一只手按下最终混音的开始键
//（目标：让代表本方法的电平条升到最高并停住），几条条同时从同一基准出发，
// 只有绿色那条继续上升。自动循环 3.2 秒。只有这只手在动。

const W = 560;
const H = 140;
const LOOP = 3200;
const BASE_X = 120;
const BAR_W = 400;
const KEY_X = 62;
const KEY_Y = 74;
const BARS = [
  { y: 46, final: 0.44, muted: true, delay: 0.18, dur: 0.26 },
  { y: 72, final: 0.64, muted: true, delay: 0.18, dur: 0.3 },
  { y: 98, final: 0.96, muted: false, delay: 0.18, dur: 0.62 },
];

type AnaState = { loop: number };

function smooth(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Draw a meter and reveal it left-to-right so the fill colour never reads as a failure state. */
function revealBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  final: number,
  progress: number,
  muted: boolean
): void {
  drawLevelMeter(ctx, x, y, w, h, final, { direction: 'up', muted });
  const cut = x + w * clamp(final * progress, 0, 1);
  if (cut < x + w) {
    ctx.beginPath();
    ctx.rect(cut, y, x + w - cut, h);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.stroke();
}

export const Ch10Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<AnaState>({ loop: 0 });

  const { ref } = useCanvas<AnaState>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      const phase = (time % LOOP) / LOOP;
      const pressing = phase < 0.1;

      // the start key (static prop)
      ctx.beginPath();
      ctx.arc(KEY_X, KEY_Y, 17, 0, Math.PI * 2);
      ctx.fillStyle = pressing ? COLORS.fader : COLORS.rail;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();

      // the common start line every bar leaves from
      drawSignalPath(
        ctx,
        [
          [BASE_X, 32],
          [BASE_X, 118],
        ],
        { active: true, dashed: true }
      );

      BARS.forEach((bar) => {
        const progress = smooth((phase - bar.delay) / bar.dur);
        revealBar(ctx, BASE_X, bar.y, BAR_W, 16, bar.final, progress, bar.muted);
        if (!bar.muted && progress >= 1) {
          ctx.beginPath();
          ctx.arc(BASE_X + BAR_W * bar.final, bar.y + 8, 6, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.good;
          ctx.fill();
        }
      });

      // the hand pressing the start key
      ctx.save();
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(KEY_X - 34, KEY_Y - 56);
      ctx.lineTo(KEY_X - 12, KEY_Y - 24);
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(KEY_X - 6, KEY_Y - 22, 10, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(KEY_X - 12 + i * 6, KEY_Y - 16);
        ctx.lineTo(KEY_X - 6 + i * 6, pressing ? KEY_Y - 6 : KEY_Y - 10);
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.ink;
        ctx.stroke();
      }
      ctx.restore();

      drawLabel(ctx, '最终混音', 330, 24, { color: COLORS.ink, size: 15, align: 'center' });
      drawLabel(ctx, '起点', BASE_X, 132, { color: COLORS.muted, size: 13, align: 'center' });
      drawLegend(ctx, 150, 22, [
        { color: COLORS.good, text: '本方法' },
        { color: COLORS.muted, text: '对照' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch10Ana;
