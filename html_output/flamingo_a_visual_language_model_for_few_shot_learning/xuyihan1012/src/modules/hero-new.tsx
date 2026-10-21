import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDeck,
  drawFader,
  drawLabel,
  drawLevelMeter,
  useCanvas,
} from '../lib/consoleKit';

// Hero, new-method panel (right): the two decks stay sealed and only the mixer moves.
// One hand rides the crossfader from centre to the right, the frozen decks keep spinning and the
// output meter settles in the green band. Intrinsic canvas 520x140, one automatic 2.4 s loop.
// Same desk vocabulary and palette as the old panel so the contrast reads instantly.

const W = 520;
const H = 140;
const LOOP = 2400;

const DECK_A = { x: 108, y: 74, r: 34 };
const DECK_B = { x: 196, y: 74, r: 34 };
const FADER = { x: 250, y: 98, len: 150 };
const METER = { x: 300, y: 118, w: 186, h: 13 };
const SHOULDER_X = 486;
const SHOULDER_Y = -4;

const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** The shared hand primitive: a round-capped forearm plus one small hand circle. */
function drawHand(ctx: CanvasRenderingContext2D, hx: number, hy: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(SHOULDER_X, SHOULDER_Y);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.deckB;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export const HeroNew: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const ph = (time % LOOP) / LOOP;
      // Crossfader: centre -> right, hold, then ease home so the loop stays continuous and gentle.
      const up = smooth(ph / 0.6);
      const home = smooth((ph - 0.86) / 0.14);
      const t = 0.5 + 0.5 * up * (1 - home);
      // Output meter follows the blend with meter ballistics and settles in the green band.
      const mUp = smooth((ph - 0.05) / 0.5);
      const mBack = smooth((ph - 0.9) / 0.1);
      const meter = clamp(0.42 + 0.48 * mUp * (1 - mBack) + 0.012 * Math.sin(time / 110), 0, 1);

      clearScene(ctx, W, H);

      // Prop 1 - the two sealed decks, still spinning: they are never re-cut.
      drawDeck(ctx, DECK_A.x, DECK_A.y, DECK_A.r, {
        spin: ph * 2,
        frozen: true,
        accent: COLORS.route,
      });
      drawDeck(ctx, DECK_B.x, DECK_B.y, DECK_B.r, {
        spin: ph * 2 + 0.42,
        frozen: true,
        accent: COLORS.route,
      });

      // Prop 2 - the output meter, settling green.
      drawLevelMeter(ctx, METER.x, METER.y, METER.w, METER.h, meter, { direction: 'up' });

      // The one moving subject: only the crossfader travels, with the hand riding its knob.
      const kx = FADER.x + FADER.len * t;
      drawFader(ctx, FADER.x, FADER.y, FADER.len, t);
      const handY = FADER.y - 20;
      drawHand(ctx, kx, handY);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(kx, handY + 6);
      ctx.lineTo(kx, FADER.y - 5);
      ctx.stroke();
      ctx.restore();

      drawLabel(ctx, '推子接入', 14, 22, { color: COLORS.good, size: 15, bold: true });
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
