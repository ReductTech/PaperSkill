import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDesks,
  drawKid,
  drawLegend,
  drawName,
  drawRing,
  drawRoster,
  drawTick,
  lerp,
  useCanvas,
} from '../lib/classKit';

// Analogy card for §1: a hand leafs an old hard-covered roster to its last page while two
// children in the back row stay dim and unticked. 560x140, control-free, 3 s loop.

const W = 560;
const H = 140;
const LOOP = 3000;

const NAMES = ['小红', '小刚', '小美', '阿强'];
const BOOK = { x: 60, y: 10, w: 150, h: 92 };
const PAGE = { x: 68, y: 18, w: 134, h: 76 };
const DESK = { x: 250, y: 12, w: 286, h: 104, rows: 2, cols: 3 };
const CW = DESK.w / DESK.cols;
const CH = DESK.h / DESK.rows;
const MISSED: Array<[number, number]> = [
  [1, 1],
  [1, 2],
];

function kidAt(r: number, c: number): [number, number] {
  return [DESK.x + c * CW + CW / 2, DESK.y + r * CH + CH * 0.62];
}

function isMissed(r: number, c: number): boolean {
  return MISSED.some(([mr, mc]) => mr === r && mc === c);
}

/** The teacher's hand: a small palm with three fingers, drawn just off the page edge. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const mitt = () => {
    // fingers point left, so the palm sits to the right of whatever is being held
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.quadraticCurveTo(9, -2, 5, -5);
    ctx.quadraticCurveTo(2, -6, 0, -5);
    ctx.quadraticCurveTo(-2, -11, -5, -10);
    ctx.quadraticCurveTo(-7, -9, -6, -5);
    ctx.quadraticCurveTo(-9, -10, -11, -8);
    ctx.quadraticCurveTo(-12, -6, -9, -3);
    ctx.quadraticCurveTo(-13, -5, -14, -2);
    ctx.quadraticCurveTo(-14, 1, -10, 2);
    ctx.quadraticCurveTo(-9, 7, -2, 8);
    ctx.quadraticCurveTo(5, 8, 8, 6);
    ctx.closePath();
  };
  // chalk body with a dark ink rim: readable over paper and over the board
  mitt();
  ctx.fillStyle = COLORS.chalk;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -1);
  ctx.lineTo(1, -1);
  ctx.moveTo(-6, 3);
  ctx.lineTo(1, 3);
  ctx.stroke();
  ctx.restore();
}

export const Ch1Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ loop: 0 });

  const { ref } = useCanvas<{ loop: number }>((ctx, time) => {
    clearScene(ctx, W, H, '旧册子');

    const t = (time % LOOP) / LOOP;
    const turnT = clamp(t / 0.66, 0, 1);
    const pages = turnT * NAMES.length;
    const row = Math.min(NAMES.length - 1, Math.floor(pages));
    const frac = pages - Math.floor(pages);
    const holdT = clamp((t - 0.7) / 0.3, 0, 1);

    // hard cover of the old roster
    ctx.save();
    ctx.beginPath();
    ctx.rect(BOOK.x, BOOK.y, BOOK.w, BOOK.h);
    ctx.fillStyle = COLORS.board2;
    ctx.fill();
    ctx.strokeStyle = COLORS.book;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(BOOK.x + 6, BOOK.y + 3);
    ctx.lineTo(BOOK.x + 6, BOOK.y + BOOK.h - 3);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // the fixed old roster, one row highlighted as it is read
    drawRoster(ctx, PAGE.x, PAGE.y, PAGE.w, PAGE.h, { lines: NAMES.length, active: row, labels: NAMES });

    // the leafed page: a paper edge sweeping from the right rim back to the binding
    const edgeX = lerp(PAGE.x + PAGE.w - 6, PAGE.x - 2, frac);
    const leafAlpha = 0.95 * (1 - holdT);
    if (leafAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = leafAlpha;
      ctx.beginPath();
      ctx.rect(PAGE.x, PAGE.y, PAGE.w, PAGE.h);
      ctx.clip();
      // shadow cast by the lifted page
      ctx.beginPath();
      ctx.moveTo(edgeX + 1, PAGE.y);
      ctx.quadraticCurveTo(edgeX - 7, PAGE.y + PAGE.h * 0.55, edgeX - 2, PAGE.y + PAGE.h);
      ctx.lineTo(edgeX - 13, PAGE.y + PAGE.h);
      ctx.quadraticCurveTo(edgeX - 17, PAGE.y + PAGE.h * 0.5, edgeX - 8, PAGE.y);
      ctx.closePath();
      ctx.globalAlpha = leafAlpha * 0.3;
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
      // the page itself
      ctx.globalAlpha = leafAlpha;
      ctx.beginPath();
      ctx.moveTo(edgeX + 11, PAGE.y);
      ctx.quadraticCurveTo(edgeX + 7, PAGE.y + PAGE.h * 0.5, edgeX + 2, PAGE.y + PAGE.h);
      ctx.lineTo(edgeX - 6, PAGE.y + PAGE.h);
      ctx.quadraticCurveTo(edgeX - 4, PAGE.y + PAGE.h * 0.5, edgeX - 1, PAGE.y);
      ctx.closePath();
      ctx.fillStyle = COLORS.roster;
      ctx.fill();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // the classroom: four children get ticked, the two at the back never do
    drawDesks(ctx, DESK.x, DESK.y, DESK.w, DESK.h, { rows: DESK.rows, cols: DESK.cols });
    for (let r = 0; r < DESK.rows; r += 1) {
      for (let c = 0; c < DESK.cols; c += 1) {
        const [kx, ky] = kidAt(r, c);
        const miss = isMissed(r, c);
        drawKid(ctx, kx, ky, 1.45, { kind: 'sit', dim: miss });
        if (!miss) drawTick(ctx, kx + 17, ky - 21, { ok: true });
      }
    }

    // the two unlisted children: dim, no tick, only a faint pulsing ring while the hand rests
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
    MISSED.forEach(([r, c]) => {
      const [kx, ky] = kidAt(r, c);
      ctx.save();
      ctx.globalAlpha = 0.16 + 0.34 * holdT * pulse;
      drawRing(ctx, kx, ky - 6, 20, { color: COLORS.chalkDim, weight: 2, dashed: true });
      ctx.restore();
    });

    // the name the teacher is looking for, held under the book
    drawName(ctx, PAGE.x, PAGE.y + PAGE.h + 10, { text: '找小明', active: true, width: 76 });

    // one hand: it keeps the leaf moving, then comes to rest past the cover
    const handX = lerp(edgeX + 10, BOOK.x + BOOK.w + 14, holdT);
    const handY = lerp(PAGE.y + PAGE.h * 0.6, BOOK.y + BOOK.h * 0.78, holdT);
    drawHand(ctx, handX, handY, -0.2 - (1 - frac) * 0.3);

    drawLegend(ctx, DESK.x, 128, [
      { color: COLORS.fast, text: '点到名' },
      { color: COLORS.chalkDim, text: '没写上' },
    ]);
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Ana;
