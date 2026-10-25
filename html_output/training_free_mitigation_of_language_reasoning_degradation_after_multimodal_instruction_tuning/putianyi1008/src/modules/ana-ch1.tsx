import React from 'react';
import { C, stage, guitar, dial, knob, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand turns one tuning peg; as the string tightens toward the green target,
// a second needle on the same dial sinks toward the red zone.
export const AnaCh1: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 2800) / 2800;
    const turn = Math.sin(p * Math.PI * 2);
    guitar(ctx, 130, 108, 0.5, C.light, C.dark, 0.55 + turn * 0.4);
    dial(ctx, 400, 72, 46, -0.5 + turn * 0.15, C.green);
    dial(ctx, 400, 72, 30, 0.2 + turn * 0.5, C.red);
    target(ctx, 452, 44, C.green);
    knob(ctx, 300, 108, 16, turn * 0.9, C.orange);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh1;
