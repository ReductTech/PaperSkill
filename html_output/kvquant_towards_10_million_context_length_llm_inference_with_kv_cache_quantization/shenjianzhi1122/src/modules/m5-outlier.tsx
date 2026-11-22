import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawItem, drawHardBox, drawBar, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const PPL = [5.94, 5.86, 5.75, 5.74, 5.74, 5.75, 5.76];

export const M5Outlier: React.FC<WidgetProps> = () => {
  const [pct, setPct] = useState(0);
  const ppl = PPL[pct];

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 10; i++) {
      const big = i < Math.round(pct / 3 * 10);
      drawItem(ctx, 70 + (i % 5) * 64, 70 + Math.floor(i / 5) * 56, 52, 40, { big });
    }
    drawHardBox(ctx, 420, 76, 90, 70);
    drawSceneLabel(ctx, 420, 66, '硬盒', KQ.red, 13);
    drawBar(ctx, 600, 100, 400, 24, ppl / 7, pct === 0 || pct >= 5 ? KQ.red : KQ.green);
    drawSceneLabel(ctx, 600, 90, `PPL ${ppl.toFixed(2)}`, KQ.ink, 12);
    drawSceneLabel(ctx, 70, 210, `每向量挑 ${(pct * 0.5).toFixed(1)}% 离群值`, KQ.ink, 13);
  }, W, H);

  const text =
    pct === 0
      ? '离群值混在袋里，撑大范围，PPL 5.94。'
      : pct <= 2
      ? '每向量挑 1%，PPL 5.75（改善 0.19），硬盒很小。'
      : '收益趋平，硬盒反而变大。';

  return (
    <div>
      <canvas id="cv-m5-outlier" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          离群比例 <span className="val">{(pct * 0.5).toFixed(1)}%</span>
        </label>
        <input type="range" min={0} max={6} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
      </div>
      <div className={`feedback ${pct === 0 || pct >= 5 ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M5Outlier;
