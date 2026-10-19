import React from 'react';
import { C, stage, rack, knob, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand turns one trim knob; the rack and the single goal marker are the only
// static props, so the scene stays within one subject + one verb + one goal.
export const AnaCh4: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 2800) / 2800;
    rack(ctx, 130, 34, 300, 74, C.axis);

    const turn = -1.2 + Math.min(1, p < 0.85 ? p / 0.85 : 1) * 2.4;
    knob(ctx, 280, 71, 28, turn, p > 0.7 ? C.orange : C.blue);

    // the hand resting on the knob (part of the single moving subject)
    ctx.beginPath();
    ctx.arc(280, 110, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();

    target(ctx, 320, 34, C.green);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh4;
