import React from 'react';
import { C, stage, guitar, useStudioCanvas } from './studiokit';

const W = 560;
const H = 140;

// One hand pulls one cable out of one guitar and plugs it into the guitar beside it.
export const AnaCh3: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const p = (now % 3000) / 3000;
    guitar(ctx, 110, 104, 0.48, C.light, C.dark, 0);
    guitar(ctx, 420, 104, 0.48, C.light, C.dark, 0.7);

    // sockets
    ctx.fillStyle = C.axis;
    ctx.fillRect(146, 96, 10, 10);
    ctx.fillRect(456, 96, 10, 10);

    const travel = p < 0.55 ? p / 0.55 : 1;
    const px = 151 + 310 * travel;
    const py = 96 - Math.sin(travel * Math.PI) * 46;

    // cable trailing behind the plug
    ctx.strokeStyle = C.warm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px - 60, py + 40, 40, 120);
    ctx.stroke();

    // plug
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = travel < 0.5 ? C.red : C.green;
    ctx.fill();
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // socket indicator light
    ctx.beginPath();
    ctx.arc(465, 132, 5, 0, Math.PI * 2);
    ctx.fillStyle = travel < 0.98 ? C.red : C.green;
    ctx.fill();
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
};

export default AnaCh3;
