import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type Bits = 2 | 3 | 4;
const PPL: Record<Bits, number> = { 2: 6.01, 3: 5.75, 4: 5.69 };
const MEM: Record<Bits, number> = { 2: 74.4, 3: 106.4, 4: 138.4 };

export const M9Bits: React.FC<WidgetProps> = () => {
  const [bits, setBits] = useState<Bits>(3);

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 3; i++) {
      const b = ([2, 3, 4] as Bits[])[i];
      ctx.fillStyle = b === bits ? 'rgba(47,125,79,0.16)' : KQ.card;
      ctx.strokeStyle = b === bits ? KQ.green : KQ.border;
      ctx.lineWidth = b === bits ? 3 : 1.5;
      ctx.fillRect(60 + i * 170, 56, 150, 66);
      ctx.strokeRect(60 + i * 170, 56, 150, 66);
      drawSceneLabel(ctx, 78 + i * 170, 96, `${b}bit`, KQ.ink, 14);
    }
    drawBar(ctx, 620, 90, 380, 22, PPL[bits] / 8, bits === 2 ? KQ.orange : KQ.green);
    drawBar(ctx, 620, 150, 380, 22, MEM[bits] / 160, KQ.purple);
    drawSceneLabel(ctx, 620, 80, `PPL ${PPL[bits]}`, KQ.ink, 12);
    drawSceneLabel(ctx, 620, 140, `1M KV ${MEM[bits]}GB`, KQ.ink, 12);
    drawLegend(ctx, 620, 230, [
      { label: '精度', color: KQ.green },
      { label: '显存', color: KQ.purple },
    ]);
  }, W, H);

  const text =
    bits === 3
      ? '3bit：5.75 PPL、1M 约 106GB；需要超过单卡 80GB，或用 2bit。'
      : bits === 2
      ? '2bit：6.01 PPL、1M 约 74GB；单卡 80GB 刚好。'
      : '4bit：5.69 PPL、1M 约 138GB；更稳但更大。';

  return (
    <div>
      <canvas id="cv-m9-bits" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {([2, 3, 4] as Bits[]).map((b) => (
          <button key={b} className={`chip ${bits === b ? 'selected' : ''}`} onClick={() => setBits(b)}>
            {b}bit
          </button>
        ))}
      </div>
      <div className={`feedback ${bits === 3 ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M9Bits;
