import React from 'react';
import { C, stage, rack, fader, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// Two hands push one fader each from one shared start line: one stalls red, one lands green.
export const AnaCh10: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3400) / 3400;
    const run = p < 0.5 ? p / 0.5 : 1;
    const hold = p > 0.82 ? (p - 0.82) / 0.18 : 0;
    const lift = hold > 0 ? 1 - hold : 1;

    rack(ctx, 40, 30, 220, 78, C.axis);
    rack(ctx, 300, 30, 220, 78, C.axis);

    fader(ctx, 150, 38, 60, run * 0.35 * lift, C.red);
    fader(ctx, 410, 38, 60, run * 0.72 * lift, C.green);

    // one hand per panel, on the same time basis
    ctx.beginPath();
    ctx.arc(150, 100 - run * 12, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(410, 100 - run * 12, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();

    target(ctx, 168, 30, C.green);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh10;
