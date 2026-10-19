import React from 'react';
import { C, stage, rack, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand walks one marker along a short rail across three tick marks and stops green.
export const AnaCh6: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3400) / 3400;
    const walk = p < 0.82 ? p / 0.82 : 1;
    const x = 140 + 300 * walk;

    rack(ctx, 120, 52, 340, 46, C.axis);
    ctx.strokeStyle = C.warm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 75);
    ctx.lineTo(440, 75);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const tx = 140 + 150 * i;
      ctx.beginPath();
      ctx.arc(tx, 75, 5, 0, Math.PI * 2);
      ctx.fillStyle = x >= tx - 2 ? C.green : C.axis;
      ctx.fill();
    }

    // marker
    ctx.beginPath();
    ctx.arc(x, 62, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.orange;
    ctx.fill();
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // hand
    ctx.beginPath();
    ctx.arc(x, 100, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();

    target(ctx, 440, 44, C.green);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh6;
