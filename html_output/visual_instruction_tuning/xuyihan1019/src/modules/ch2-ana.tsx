import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLandmark,
  drawLegend,
  drawPage,
  drawTrail,
  useCanvas,
} from '../lib/trailKit';

// §2 analogy (560×140) — the guide's hand points at one landmark at a time and one
// description line lands in the record page beside it. One moving subject (the hand),
// one goal (three lines of words), 3.2 s automatic loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3200;

type SpotKind = 'tree' | 'bench' | 'fountain';

const SPOTS: Array<{ kind: SpotKind; x: number; tipY: number }> = [
  { kind: 'tree', x: 84, tipY: 72 },
  { kind: 'bench', x: 196, tipY: 98 },
  { kind: 'fountain', x: 308, tipY: 86 },
];

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** The pointing hand: index finger at the landmark, palm up and to the right. */
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

export const Ch2Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H, '看见就说');
      drawTrail(ctx, [[28, 106], [352, 104]], { dashed: true });

      const p = (time % LOOP) / LOOP;
      const step = Math.min(SPOTS.length - 1, Math.floor(p * SPOTS.length));
      const local = p * SPOTS.length - step;
      const spot = SPOTS[step];
      const prev = step === 0 ? { x: 36, tipY: 82 } : SPOTS[step - 1];
      const move = easeInOut(Math.min(1, local / 0.6));
      const tipX = prev.x + (spot.x - prev.x) * move;
      const tipY = prev.tipY + (spot.tipY - prev.tipY) * move;
      const landed = Math.min(3, step + (local > 0.55 ? 1 : 0));

      // goal: the record page, one description line per landmark
      drawPage(ctx, 394, 16, 138, 92, {
        lines: landed,
        rows: 3,
        highlight: landed > 0 ? landed - 1 : undefined,
      });
      // slots still waiting for their line
      const rowH = (92 - 14) / 3;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      for (let i = landed; i < 3; i += 1) {
        const ry = 16 + 8 + i * rowH + rowH * 0.45;
        ctx.beginPath();
        ctx.moveTo(404, ry);
        ctx.lineTo(520, ry);
        ctx.stroke();
      }
      ctx.restore();

      for (const s of SPOTS) {
        drawLandmark(ctx, s.x, 106, s.kind, { highlight: s === spot && local > 0.45 });
      }
      drawHand(ctx, tipX, tipY);

      drawLegend(ctx, 32, 128, [
        { color: COLORS.good, text: '说出的描述' },
        { color: COLORS.fader, text: '正指着的景物' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch2Ana;
