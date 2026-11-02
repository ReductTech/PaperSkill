// Chapter 8 analogy (560x140, control-free): one hand runs along the desk and links
// the whole chain — list -> box -> thread -> score — with the light travelling with
// the hand. One subject, one verb, one goal: get the chain connected.
import React, { useRef } from 'react';
import {
  COLORS,
  clearScene,
  drawBox,
  drawItem,
  drawLabel,
  drawLegend,
  drawList,
  drawThread,
  useCanvas,
  clamp,
  lerp,
} from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const smooth = (u: number): number => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H, '一条链');
    const t = (time % 3200) / 3200;
    const handX = lerp(76, 408, smooth(t));

    // list
    drawList(ctx, 24, 22, 66, 86, { lines: 3, active: 1 });

    // the thing and its marker
    drawItem(ctx, 136, 50, 36, 44, { kind: 'bottle', highlight: false });
    const boxOn = handX > 140;
    drawBox(ctx, 154, 72, 56, 62, {
      color: boxOn ? COLORS.thread : COLORS.box,
      weight: boxOn ? 3 : 2,
    });

    // the thread from the marker to the score, lit as the hand passes
    const threadOn = handX > 200;
    drawThread(ctx, [182, 72], [400, 66], { active: threadOn, muted: !threadOn });

    // the score badge at the end of the chain
    const scoreOn = handX > 386;
    ctx.save();
    ctx.beginPath();
    ctx.arc(412, 66, 18, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = scoreOn ? COLORS.thread : COLORS.axis;
    ctx.lineWidth = scoreOn ? 3 : 2;
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, '0.86', 396, 71, {
      color: scoreOn ? COLORS.thread : COLORS.muted,
      size: 14,
      bold: scoreOn,
    });

    // stations light up behind the hand
    const lit = (x: number): boolean => handX > x;
    for (const x of [90, 154, 412]) {
      if (lit(x)) {
        ctx.beginPath();
        ctx.arc(x, x === 412 ? 66 : 72, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.fill();
      }
    }

    // the hand itself: the only moving subject
    ctx.save();
    ctx.beginPath();
    ctx.arc(handX, 106, 7, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(handX + 5, 108);
    ctx.lineTo(handX + 34, 128);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    // light travelling with the hand
    ctx.beginPath();
    ctx.arc(handX, 92, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.tag;
    ctx.fill();

    drawLegend(ctx, 250, 128, [
      { color: COLORS.box, text: '圈' },
      { color: COLORS.thread, text: '对齐分' },
      { color: COLORS.ink, text: '手' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch8Ana;
