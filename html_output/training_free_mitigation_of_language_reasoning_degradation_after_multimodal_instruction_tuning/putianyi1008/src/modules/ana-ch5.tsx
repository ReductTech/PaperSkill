import React from 'react';
import { C, stage, rack, fader, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand pushes one master fader up to the green target band.
export const AnaCh5: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3200) / 3200;
    const v = p < 0.7 ? p / 0.7 : 1;
    rack(ctx, 120, 26, 320, 84, C.axis);
    fader(ctx, 280, 32, 72, v * 0.55, C.orange);

    // the two dials move in opposite directions
    const ly = 66 - v * 18;
    const vy = 66 + v * 14;
    ctx.beginPath();
    ctx.arc(180, ly, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(180, vy, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();

    target(ctx, 300, 32, C.green);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh5;
