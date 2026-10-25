import React from 'react';
import { C, stage, dial, target, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand nudges one needle in time with one metronome arm until it rests on the mark.
export const AnaCh7: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3000) / 3000;
    const swing = Math.sin(p * Math.PI * 4);
    const settle = p < 0.75 ? 1 - p / 0.75 : 0;
    const ang = -0.35 + swing * 0.42 * settle;

    // metronome arm on the left
    ctx.save();
    ctx.translate(120, 104);
    ctx.rotate(swing * 0.45);
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -62);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -62, 6, 0, Math.PI * 2);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.restore();

    dial(ctx, 380, 72, 48, ang, settle > 0.2 ? C.red : C.green);
    target(ctx, 428, 44, C.green);

    // the hand that keeps nudging the needle
    ctx.beginPath();
    ctx.arc(300, 100, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.text;
    ctx.fill();
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh7;
