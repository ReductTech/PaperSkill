import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDeck,
  drawLabel,
  drawSignalPath,
  lerp,
  useCanvas,
} from '../lib/consoleKit';

// Hero, old-method panel (left): one record is re-cut from scratch.
// A single hand drives a red cutting stylus that engraves a fresh groove over the whole disc while
// the seal sticker peels off; the desk rail in front stays empty because this desk has no
// crossfader. Intrinsic canvas 520x140, one automatic 2.4 s loop, no controls.

const W = 520;
const H = 140;
const LOOP = 2400;

const CX = 250; // disc centre: the composition stays centred in the 520-wide panel
const CY = 76;
const R = 42;
const GROOVE_OUT = 34;
const GROOVE_IN = 13;
const RINGS = 6;
const A0 = -Math.PI / 2; // the cutter rides at the top of the disc
const SHOULDER_X = 476;
const SHOULDER_Y = -6;

const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const ringRadius = (k: number): number => lerp(GROOVE_OUT, GROOVE_IN, k / (RINGS - 1));

// Cut from the rim inward, hold the finished take, then rewind so the loop never jumps.
const engraveAmount = (ph: number): number =>
  ph < 0.78 ? smooth(ph / 0.78) : 1 - smooth((ph - 0.78) / 0.22);

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

export const HeroOld: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const ph = (time % LOOP) / LOOP;
      const cut = engraveAmount(ph);

      clearScene(ctx, W, H);

      // Prop 2 - the desk rail, left empty on purpose: no crossfader on this desk.
      drawSignalPath(
        ctx,
        [
          [34, 104],
          [186, 104],
          [186, 130],
          [34, 130],
          [34, 104],
        ],
        { dashed: true }
      );

      // Prop 1 - the record, ringed in red because it is about to be re-cut.
      drawDeck(ctx, CX, CY, R, { spin: ph, accent: COLORS.bad });

      // The fresh groove: completed rings, the ring under the stylus, then the untouched rest.
      const u = cut * RINGS;
      const activeRing = Math.min(RINGS - 1, Math.floor(u));
      const frac = clamp(u - activeRing, 0, 1);
      for (let k = 0; k < RINGS; k += 1) {
        const rr = ringRadius(k);
        if (k < activeRing) {
          ctx.beginPath();
          ctx.arc(CX, CY, rr, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.bad;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (k === activeRing) {
          if (frac > 0.01) {
            ctx.beginPath();
            ctx.arc(CX, CY, rr, A0, A0 + Math.PI * 2 * frac);
            ctx.strokeStyle = COLORS.bad;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        } else {
          ctx.save();
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.arc(CX, CY, rr, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.axis;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // The seal sticker peels off as the disc is re-cut, and re-seals during the rewind.
      const peel = smooth(cut / 0.72);
      ctx.save();
      ctx.globalAlpha = 1 - 0.65 * peel;
      ctx.translate(CX - 26 - 4 * peel, CY - 22 - 12 * peel);
      ctx.rotate(-0.85 * peel);
      ctx.beginPath();
      ctx.rect(-8, -9, 16, 18);
      ctx.fillStyle = COLORS.bad; // the torn underside of the seal
      ctx.fill();
      ctx.beginPath();
      ctx.rect(-8, -9, 16, 12 - 3 * peel);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // The one moving subject: the hand + red cutting stylus, feeding inward ring by ring.
      const rr = ringRadius(activeRing);
      const tipX = CX + Math.sin(time / 90) * 0.6;
      const tipY = CY - rr + Math.cos(time / 70) * 0.5;
      const handX = tipX - 6;
      const handY = tipY - 20;
      drawHand(ctx, handX, handY);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(handX + 2, handY + 5);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bad;
      ctx.fill();
      // cutting shavings
      for (let i = 0; i < 2; i += 1) {
        const a = time / 120 + i * 2.1;
        ctx.beginPath();
        ctx.arc(tipX + Math.cos(a) * 7, tipY + Math.sin(a) * 5 + 4, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.fader;
        ctx.fill();
      }
      ctx.restore();

      drawLabel(ctx, '每个任务重练', 14, 22, { color: COLORS.bad, size: 15, bold: true });
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
