import React from 'react';
import { C, stage, rack, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand raises one ear cup to the head and settles it into place.
export const AnaCh9: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3000) / 3000;
    const lift = p < 0.55 ? p / 0.55 : 1;
    const wobble = p > 0.55 && p < 0.8 ? Math.sin((p - 0.55) * Math.PI * 12) * 2.2 : 0;

    // headband
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(260, 92, 32, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();

    // left cup fixed
    rack(ctx, 226, 74, 16, 34, C.purple, true);
    // right cup rises then settles
    const cy = 78 + lift * 22 + wobble;
    rack(ctx, 294, cy - 17, 16, 34, lift >= 1 ? C.green : C.purple, true);

    // hand holding the cup
    ctx.beginPath();
    ctx.arc(324, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();

    // the meter behind stays still
    rack(ctx, 420, 52, 90, 40, C.axis);
    ctx.fillStyle = C.axis;
    ctx.fillRect(432, 70, 66, 6);
    ctx.fillStyle = C.blue;
    ctx.fillRect(432, 70, 40, 6);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh9;
