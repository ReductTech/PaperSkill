import React from 'react';
import { C, stage, guitar, rack, dial, fader, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Old method: the vision-adaptation knob is the only control, the language needle sits
// low in the red zone, and the hand keeps turning without improving anything.
export const HeroOld: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const t = (now % 3200) / 3200;

    // hand: rotates the vision knob back and forth without effect
    const turn = Math.sin(t * Math.PI * 2) * 0.9;
    fader(ctx, 300, 60, 150, 0.42 + turn * 0.05, C.axis);
    rack(ctx, 210, 54, 180, 168, C.axis);
    guitar(ctx, 130, 200, 0.62, C.light, C.dark, 0.9);

    // the two level dials
    dial(ctx, 640, 130, 62, 0.42 + turn * 0.04, C.red);
    dial(ctx, 830, 130, 62, -0.5, C.green);

    // knob the hand keeps turning
    ctx.beginPath();
    ctx.arc(300, 44, 15, 0, Math.PI * 2);
    ctx.fillStyle = C.orange;
    ctx.fill();
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    legend(ctx, 210, 250, [
      ['语言', C.red],
      ['视觉', C.green],
    ]);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default HeroOld;
