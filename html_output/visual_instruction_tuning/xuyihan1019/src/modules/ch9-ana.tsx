import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLandmark,
  drawLegend,
  drawSpeech,
  useCanvas,
} from '../lib/trailKit';

// §9 analogy (560×140) — one hand flips between three description cards for the same
// spot: short, medium, long. One moving subject (the hand), one goal (the words that
// describe this stretch), 3.3 s automatic loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3300;

const CARDS = [
  { x: 150, lines: 1 },
  { x: 268, lines: 2 },
  { x: 386, lines: 3 },
];
const CARD_W = 110;
const CARD_BOTTOM = 100;

const cardHeight = (lines: number) => 12 + lines * 12;
const cardTop = (lines: number) => CARD_BOTTOM - cardHeight(lines);
const cardCenter = (x: number) => x + CARD_W / 2;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** The hand that turns the cards over: finger down on the card, palm up and to the right. */
function drawHand(ctx: CanvasRenderingContext2D, tipX: number, tipY: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  // index finger
  ctx.beginPath();
  ctx.moveTo(tipX + 15, tipY - 19);
  ctx.lineTo(tipX + 2, tipY);
  ctx.lineWidth = 3.5;
  ctx.stroke();
  // palm
  ctx.beginPath();
  ctx.ellipse(tipX + 20, tipY - 25, 9, 6.5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // thumb
  ctx.beginPath();
  ctx.moveTo(tipX + 13, tipY - 22);
  ctx.lineTo(tipX + 7, tipY - 15);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

export const Ch9Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H, '同一处景');
      drawLandmark(ctx, 64, 106, 'tree');

      const p = (time % LOOP) / LOOP;
      const idx = Math.min(CARDS.length - 1, Math.floor(p * CARDS.length));
      const local = p * CARDS.length - idx;
      const move = easeInOut(Math.min(1, local / 0.4));
      const active = local > 0.35 ? idx : (idx + CARDS.length - 1) % CARDS.length;

      const prev = CARDS[(idx + CARDS.length - 1) % CARDS.length];
      const prevTipY = cardTop(prev.lines) - 6;
      const tipY = cardTop(CARDS[idx].lines) - 6;
      const tipX = cardCenter(prev.x) + (cardCenter(CARDS[idx].x) - cardCenter(prev.x)) * move;

      CARDS.forEach((card, i) => {
        const lift = i === active ? 4 : 0;
        const top = cardTop(card.lines) - lift;
        drawSpeech(ctx, card.x, top, CARD_W, '', {
          lines: card.lines,
          active: i === active,
        });
      });

      drawHand(ctx, tipX, prevTipY + (tipY - prevTipY) * move);

      drawLegend(ctx, 32, 128, [{ color: COLORS.good, text: '正在说的说法' }]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch9Ana;
