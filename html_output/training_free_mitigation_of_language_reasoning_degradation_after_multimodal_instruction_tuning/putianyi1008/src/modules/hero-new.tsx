import React from 'react';
import { C, stage, guitar, rack, dial, fader, num, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// New method: one extra fader carries the base-LLM signal, and a small push (~0.1)
// brings the language dial back into the green target while vision stays green.
export const HeroNew: React.FC = () => {
  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const t = (now % 3200) / 3200;
    const push = t < 0.6 ? t / 0.6 : 1;
    const a = 0.1 * push;

    rack(ctx, 210, 54, 180, 168, C.blue);
    guitar(ctx, 130, 200, 0.62, C.light, C.dark, 0.9);
    // base signal fader carrying the task-vector contribution
    fader(ctx, 540, 60, 150, a / 0.5, C.orange);
    // the two dials move to their healthy readings
    dial(ctx, 740, 130, 62, -1.05 + push * 0.72, C.green);
    dial(ctx, 920, 130, 62, -0.5, C.green);

    // Both readings are SCHEMATIC. The paper's Table 2 / Table 3 contain neither
    // 0.68 nor 0.74; they are only here to show "a small push is enough". The
    // matching note is rendered under the canvas, not inside it.
    num(ctx, 700, 232, 0.68, C.red, 17);
    num(ctx, 880, 232, 0.74, C.green, 17);

    legend(ctx, 210, 250, [
      ['语言', C.green],
      ['视觉', C.green],
    ]);
  });
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        封面画布上的读数与指针位置是机制示意，用于说明「小幅合并即可把语言通道带回绿区」，不是论文 Table 2 / Table 3 的测量值。
      </div>
    </div>
  );
};

export default HeroNew;
