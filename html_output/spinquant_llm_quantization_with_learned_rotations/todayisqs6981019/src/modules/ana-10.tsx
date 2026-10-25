import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, FACTS, clearScene, text } from './kit';

const W = 560;
const H = 140;
const AX0 = 36;
const AXW = 470;
const BASE = 112;
const MAXV = 70;

const ROWS = [
  { name: 'RTN', v: FACTS.rtn7b, col: '#9c6b74' },
  { name: 'GPTQ', v: FACTS.gptq7b, col: C.red },
  { name: 'QuaRot', v: 62.5, col: C.purple },
  { name: 'SpinQuant', v: FACTS.spin7b, col: C.green },
];

const bx = (v: number) => AX0 + (v / MAXV) * AXW;

// ana-10：五条赛道条形从零生长，奖杯落到 SpinQuant 条顶，FP 虚线静止（循环）
export const Ana10: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    const ph = (t % 5) / 5;

    // FP 标线
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(bx(FACTS.fp7b), 14);
    ctx.lineTo(bx(FACTS.fp7b), BASE);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'FP', bx(FACTS.fp7b) + 4, 22, C.ink, 12);

    ROWS.forEach((r, i) => {
      const y = 26 + i * 21;
      const grow = Math.max(0, Math.min(1, (ph - i * 0.06) / 0.42));
      const w = bx(r.v) - AX0;
      ctx.fillStyle = r.col;
      ctx.beginPath();
      ctx.roundRect(AX0, y, Math.max(2, w * grow), 13, 3);
      ctx.fill();
      text(ctx, r.name, AX0 + 6, y + 7, C.white, 10);
      if (grow >= 1) text(ctx, r.v.toFixed(1), bx(r.v) + 6, y + 7, r.col, 12);
      if (r.name === 'SpinQuant' && grow >= 1 && ph > 0.5) {
        const drop = Math.min(1, (ph - 0.5) / 0.12);
        text(ctx, '🏆', bx(r.v) - 6, y - 10 + (1 - drop) * -8, C.ink, 15, 'center');
      }
    });

    text(ctx, '0-shot', AX0 + AXW - 6, BASE + 12, C.muted, 12, 'right');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana10;
