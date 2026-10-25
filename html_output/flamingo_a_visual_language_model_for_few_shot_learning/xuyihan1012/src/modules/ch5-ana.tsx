import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDeck,
  drawFader,
  drawLabel,
  drawLegend,
  drawSignalPath,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §5 analogy — 生活隐喻（双盘混音台）：一只手把监听切换器从左侧拨到右侧，
// 监听窗口只对准当前那一路（目标：让被监听的那一路亮起，另一路变暗）。
// 自动循环 3.2 秒。只有切换器的手柄在动；两张唱盘是静止道具。

const W = 560;
const H = 140;
const LOOP = 3200;
const DECK_A_X = 118;
const DECK_B_X = 442;
const DECK_Y = 62;
const DECK_R = 33;
const RAIL_X = 200;
const RAIL_LEN = 160;
const RAIL_Y = 112;

type AnaState = { loop: number };

/** Smoothstep, used only for the live animation timing (not a drawing helper). */
function smooth(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

/** A stylised hand gripping the selector knob from above. Uses the shared palette. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  // forearm coming in from the upper right
  ctx.beginPath();
  ctx.moveTo(x + 34, y - 62);
  ctx.lineTo(x + 14, y - 26);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // fingers reaching down to the knob
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 6 + i * 6, y - 22);
    ctx.lineTo(x - 4 + i * 6, y - 8);
    ctx.stroke();
  }
  // palm
  ctx.beginPath();
  ctx.arc(x, y - 26, 10, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.fader;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.restore();
}

export const Ch5Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<AnaState>({ loop: 0 });

  const { ref } = useCanvas<AnaState>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      const phase = (time % LOOP) / LOOP;
      let t: number;
      if (phase < 0.3) t = 0;
      else if (phase < 0.46) t = smooth((phase - 0.3) / 0.16);
      else if (phase < 0.8) t = 1;
      else t = 1 - smooth((phase - 0.8) / 0.2);

      const leftLit = t < 0.5;
      const knobX = RAIL_X + RAIL_LEN * t;

      // the two monitor sources (static props)
      ctx.globalAlpha = leftLit ? 1 : 0.4;
      drawDeck(ctx, DECK_A_X, DECK_Y, DECK_R, { spin: 0, frozen: false, accent: leftLit ? COLORS.route : COLORS.platter });
      ctx.globalAlpha = leftLit ? 0.4 : 1;
      drawDeck(ctx, DECK_B_X, DECK_Y, DECK_R, { spin: 0, frozen: false, accent: leftLit ? COLORS.platter : COLORS.route });
      ctx.globalAlpha = 1;

      // monitor window: the blue ring around the source currently being monitored
      const litX = leftLit ? DECK_A_X : DECK_B_X;
      ctx.beginPath();
      ctx.arc(litX, DECK_Y, DECK_R + 7, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.route;
      ctx.stroke();

      // dashed monitor route from the lit source down to the selector knob
      drawSignalPath(
        ctx,
        [
          [litX, DECK_Y + DECK_R + 8],
          [litX, RAIL_Y - 10],
          [knobX, RAIL_Y - 10],
        ],
        { active: true, dashed: true }
      );

      // the selector rail and its single orange knob (the moving subject)
      drawFader(ctx, RAIL_X, RAIL_Y, RAIL_LEN, t, {});
      drawHand(ctx, knobX, RAIL_Y - 4);

      drawLabel(ctx, '监听切换', 280, 20, { color: COLORS.ink, size: 15, align: 'center' });
      drawLabel(ctx, leftLit ? '选中左' : '选中右', litX, 22, {
        color: COLORS.route,
        size: 15,
        align: 'center',
        bold: true,
      });
      drawLegend(ctx, 18, 128, [
        { color: COLORS.route, text: '当前监听' },
        { color: COLORS.muted, text: '被忽略' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch5Ana;
