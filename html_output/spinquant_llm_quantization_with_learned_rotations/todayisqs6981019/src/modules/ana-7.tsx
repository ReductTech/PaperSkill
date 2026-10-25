import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, text } from './kit';

const W = 560;
const H = 140;
const PX0 = 44;
const PY0 = 30;
const PW = 360;
const PH = 84;

// 损失收敛示意曲线（标注「示意」）：从高位降到低位趋平
const lossAt = (x: number) => 6.9 - 1.35 * (1 - Math.exp(-x / 34));
const lx = (x: number) => PX0 + (x / 100) * PW;
const ly = (l: number) => PY0 + ((6.9 - l) / 1.4) * PH;

// ana-7：损失曲线红→绿逐段下降趋平（循环）
export const Ana7: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PX0, PY0, PW, PH);

    const p = (t % 4) / 4;
    const reveal = Math.min(1, p / 0.75);

    // 已画部分按进度变色：起点红 → 末端绿
    ctx.lineWidth = 3;
    const SEG = 26;
    for (let s = 0; s < SEG; s++) {
      const f0 = s / SEG;
      const f1 = (s + 1) / SEG;
      if (f0 > reveal) break;
      const fEnd = Math.min(f1, reveal);
      ctx.strokeStyle = mix(C.red, C.green, fEnd);
      ctx.beginPath();
      ctx.moveTo(lx(f0 * 100), ly(lossAt(f0 * 100)));
      ctx.lineTo(lx(fEnd * 100), ly(lossAt(fEnd * 100)));
      ctx.stroke();
    }

    // 移动采样点
    const tipX = reveal * 100;
    ctx.fillStyle = mix(C.red, C.green, reveal);
    ctx.beginPath();
    ctx.arc(lx(tipX), ly(lossAt(tipX)), 5, 0, Math.PI * 2);
    ctx.fill();

    text(ctx, 'L_Q', PX0 - 12, PY0 + 10, C.ink, 14, 'right');
    text(ctx, '×100 步', PX0 + PW / 2, PY0 + PH + 14, C.muted, 12, 'center');

    // 右侧注释
    text(ctx, '校准集交叉熵', 500, 48, C.ink, 13, 'center');
    text(ctx, '收敛', 500, 76, C.green, 15, 'center');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

function mix(a: string, b: string, k: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * Math.max(0, Math.min(1, k)));
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

export default Ana7;
