import React from 'react';
import { C, stage, guitar, rack, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand lifts one microphone off the stand and brings it to the guitar's sound hole.
export const AnaCh2: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 2600) / 2600;
    guitar(ctx, 120, 104, 0.5, C.light, C.dark, 0);

    // stand
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(340, 104);
    ctx.lineTo(340, 40);
    ctx.stroke();

    // microphone travels from the stand to the sound hole and holds
    const travel = p < 0.6 ? p / 0.6 : 1;
    const mx = 340 - 130 * travel;
    const my = 44 + 58 * travel;
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx, my + 12);
    ctx.lineTo(mx - 14, my + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 11, 0, Math.PI * 2);
    ctx.fillStyle = C.purple;
    ctx.fill();
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // signal wire to the rack
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.blue;
    ctx.beginPath();
    ctx.moveTo(mx + 12, my);
    ctx.lineTo(470, 60);
    ctx.stroke();
    ctx.setLineDash([]);
    rack(ctx, 470, 44, 54, 40, C.blue);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh2;
