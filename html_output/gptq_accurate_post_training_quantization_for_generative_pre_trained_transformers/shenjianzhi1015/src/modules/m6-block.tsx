import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawBar, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
const BS = [16, 64, 128, 256] as const;
const THROUGHPUT: Record<number, number> = { 16: 0.35, 64: 0.6, 128: 0.85, 256: 0.92 };
const STABILITY: Record<number, number> = { 16: 0.95, 64: 0.9, 128: 0.82, 256: 0.7 };

export const M6Block: React.FC<WidgetProps> = () => {
  const [B, setB] = useState<number>(128);
  const seg = Math.max(1, Math.round(32 / B));

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPath(ctx, 40, 70, 16, 40, 8, (i) => ({ filled: true, highlight: Math.floor(i / (B / 16)) === 1 }));
    drawSceneLabel(ctx, 40, 58, `块大小 ${B}`, GQ.purple, 13);
    const x0 = 40;
    const x1 = 1030;
    drawBar(ctx, x0, 160, x1 - x0, 22, THROUGHPUT[B], GQ.green);
    drawBar(ctx, x0, 210, x1 - x0, 22, STABILITY[B], GQ.blue);
    drawSceneLabel(ctx, x0, 150, '吞吐', GQ.green, 13);
    drawSceneLabel(ctx, x0, 200, '稳定性', GQ.blue, 13);
    drawLegend(ctx, 700, 250, [
      { label: '吞吐', color: GQ.green },
      { label: '稳定性', color: GQ.blue },
    ]);
    void seg;
  }, W, H);

  const cls = B === 128 ? 'good' : '';
  const text =
    B < 64
      ? '段太短，来回对齐的次数多，GPU 利用率低。'
      : B === 128
      ? '论文的默认值：段内更新、段末全局更新，吞吐与稳定性平衡。'
      : '段更长，吞吐提升有限，且段末对齐更粗。';

  return (
    <div>
      <canvas id="cv-m6-block" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {BS.map((b) => (
          <button key={b} className={`chip ${B === b ? 'selected' : ''}`} onClick={() => setB(b)}>
            B = {b}
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M6Block;
