import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawStack, drawShelf, drawFolder, drawBar, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type R = 32 | 64 | 96 | 128;
const SCORE: Record<R, number> = { 32: 20.62, 64: 19.86, 96: 20.55, 128: 20.77 };

export const M5Residual: React.FC<WidgetProps> = () => {
  const [R, setR] = useState<R>(32);

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const layers = Math.max(2, Math.round(R / 24));
    drawStack(ctx, 80, 60, 150, 130, layers);
    drawShelf(ctx, 330, 70, 280, 110, 1);
    for (let i = 0; i < 7; i++) drawFolder(ctx, 344 + i * 36, 86, 28, 60, { tone: 'old' });
    drawSceneLabel(ctx, 80, 50, `桌面 ${R} 份（FP16）`, KV.purple, 13);
    drawSceneLabel(ctx, 330, 60, '旧卷微缩（2bit）', KV.green, 13);
    drawBar(ctx, 700, 90, 320, 22, SCORE[R] / 25, SCORE[R] < 20 ? KV.red : KV.green);
    drawSceneLabel(ctx, 700, 80, `GSM8K ${SCORE[R]}`, KV.ink, 12);
    drawLegend(ctx, 700, 230, [
      { label: '全精度', color: KV.purple },
      { label: '2bit', color: KV.green },
    ]);
  }, W, H);

  const text =
    R === 64
      ? '64 反而最低（19.86），不是单调关系；但窗口太小会更糟。'
      : `桌面留 ${R} 份，GSM8K 约 ${SCORE[R]}。`;

  return (
    <div>
      <canvas id="cv-m5-residual" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {([32, 64, 96, 128] as R[]).map((r) => (
          <button key={r} className={`chip ${R === r ? 'selected' : ''}`} onClick={() => setR(r)}>
            R = {r}
          </button>
        ))}
      </div>
      <div className={`feedback ${R === 64 ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M5Residual;
