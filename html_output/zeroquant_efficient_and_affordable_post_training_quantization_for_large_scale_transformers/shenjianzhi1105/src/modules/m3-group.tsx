import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPattern, drawBar, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type G = 1 | 48 | 64 | 128;
const ACC: Record<G, number> = { 1: 35.85, 48: 81.06, 64: 81.2, 128: 81.4 };

export const M3Group: React.FC<WidgetProps> = () => {
  const [groups, setGroups] = useState<G>(1);

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPattern(ctx, 60, 60, 420, 120, groups);
    drawSceneLabel(ctx, 60, 50, groups === 1 ? '整批一个纸样' : `分成 ${groups} 组`, groups === 1 ? ZQ.red : ZQ.blue, 13);
    drawBar(ctx, 600, 80, 400, 22, ACC[groups] / 100, groups === 1 ? ZQ.red : ZQ.green);
    drawBar(ctx, 600, 140, 400, 22, Math.min(1, groups / 128), ZQ.purple);
    drawSceneLabel(ctx, 600, 70, `GLUE 平均 ${ACC[groups].toFixed(2)}`, ZQ.ink, 12);
    drawSceneLabel(ctx, 600, 130, `相对开销 ${(Math.min(1, groups / 128) * 100).toFixed(0)}%`, ZQ.purple, 12);
    drawLegend(ctx, 600, 230, [
      { label: '精度', color: groups === 1 ? ZQ.red : ZQ.green },
      { label: '开销', color: ZQ.purple },
    ]);
  }, W, H);

  const text =
    groups === 1
      ? '整矩阵一个缩放，W4/8 直接退化成随机（35.85）。'
      : groups <= 64
      ? '分组救回精度（约 81），也是论文给 BERT 的配置。'
      : '更细，但缩放/内核开销更大。';

  return (
    <div>
      <canvas id="cv-m3-group" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {([1, 48, 64, 128] as G[]).map((g) => (
          <button key={g} className={`chip ${groups === g ? 'selected' : ''}`} onClick={() => setGroups(g)}>
            {g} 组
          </button>
        ))}
      </div>
      <div className={`feedback ${groups === 1 ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M3Group;
