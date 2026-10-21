import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawWalker,
  drawPage,
  drawLabel,
  useCanvas,
} from '../lib/trailKit';

// Hero, new method: the guide holds a thin translator booklet and turns one page of it
// while the companion walks the trail steadily. The page turn is the only moving subject.
const W = 520;
const H = 140;
const LOOP = 2400;
const TAU = Math.PI * 2;

const BOOK_X = 198;
const BOOK_Y = 86;
const BOOK_W = 58;
const BOOK_H = 26;
const SPINE_X = BOOK_X + BOOK_W / 2;
const PAGE_W = 26;
const PAGE_H = 22;

export const HeroNew: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>((ctx, time) => {
    clearScene(ctx, W, H);
    const p = (time % LOOP) / LOOP;
    const turn = Math.cos(TAU * p); // right page → edge-on → left page → back

    drawGuide(ctx, 148, 116, { eye: true, scale: 1.6 });
    drawPage(ctx, BOOK_X, BOOK_Y, BOOK_W, BOOK_H, { lines: 2 });

    // The turning page is drawn as a signed-width leaf anchored on the booklet spine.
    const edgeX = SPINE_X + PAGE_W * turn;
    ctx.save();
    ctx.fillStyle = COLORS.axis;
    ctx.fillRect(SPINE_X, BOOK_Y + 2, PAGE_W * turn, PAGE_H);
    if (Math.abs(turn) > 0.25) {
      const lineW = Math.max(0, Math.abs(PAGE_W * turn) - 8);
      const lineX = turn > 0 ? SPINE_X + 4 : SPINE_X - 4 - lineW;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(lineX, BOOK_Y + 11, lineW, 2);
      ctx.fillRect(lineX, BOOK_Y + 17, lineW, 2);
    }
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = COLORS.muted;
    ctx.fillRect(turn >= 0 ? edgeX - 2 : edgeX, BOOK_Y + 2, 2, PAGE_H);
    ctx.restore();

    // The hand holding the free edge of the page.
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(edgeX, BOOK_Y + BOOK_H - 5, 3, 0, TAU);
    ctx.fill();

    drawWalker(ctx, 334, 116, { walking: true, scale: 1.6 });

    drawLabel(ctx, '薄本对齐', 16, 40, { color: COLORS.good, size: 15, bold: true });
  }, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
