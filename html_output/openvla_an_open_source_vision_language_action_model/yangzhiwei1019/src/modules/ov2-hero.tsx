import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench, plank, ink, plane, curl } from './ov2-analogy';

const W = 440;
const H = 150;

export const Ov2Hero: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx, t) => {
      field(ctx, W, H);
      bench(ctx, W, H, 122);
      plank(ctx, 24, 84, W - 48, 34, !isNew);
      ink(ctx, 24, W - 24, 101, isNew ? V.orange : V.red);
      const x = 75 + t * (W - 160);
      if (isNew) {
        plane(ctx, x, 98, 1.0, 0, V.blue);
        curl(ctx, x - 30, 78, 10, V.green, 0.8);
        curl(ctx, x - 48, 84, 7, V.green, 0.45);
      } else {
        plane(ctx, x, 98, 1.0, Math.sin(t * Math.PI * 10) * 0.11, V.red);
        curl(ctx, x - 30, 76, 7, V.red, 0.55);
        ctx.strokeStyle = V.red;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 32 + i * 16, 84);
          ctx.lineTo(x - 29 + i * 16, 77);
          ctx.stroke();
        }
      }
    }, 3000);
  }, [isNew]);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ov2Hero;
