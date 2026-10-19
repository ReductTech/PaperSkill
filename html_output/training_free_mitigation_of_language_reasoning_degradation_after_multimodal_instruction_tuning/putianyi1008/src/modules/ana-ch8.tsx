import React from 'react';
import { C, stage, rack, knob, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand turns one three-position trim switch through its three detents.
export const AnaCh8: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3400) / 3400;
    const pos = p < 0.82 ? Math.min(2, Math.floor((p / 0.82) * 3)) : 2;
    const ang = -0.95 + pos * 0.95;

    rack(ctx, 150, 26, 260, 82, C.axis);
    knob(ctx, 280, 67, 28, ang, C.orange);

    // three detent ticks
    for (let i = 0; i < 3; i++) {
      const a = -0.95 + i * 0.95;
      const tx = 280 + Math.sin(a) * 44;
      const ty = 67 - Math.cos(a) * 44;
      ctx.beginPath();
      ctx.arc(tx, ty, i === pos ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === pos ? C.green : C.axis;
      ctx.fill();
    }

    // the channel's remaining signal bar shrinks as the switch advances
    const w = 200 - pos * 55;
    ctx.fillStyle = C.axis;
    ctx.fillRect(150, 118, 200, 8);
    ctx.fillStyle = pos === 1 ? C.green : C.orange;
    ctx.fillRect(150, 118, w, 8);

    // hand
    ctx.beginPath();
    ctx.arc(224, 104, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();

    target(ctx, 350, 26, C.green);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh8;
