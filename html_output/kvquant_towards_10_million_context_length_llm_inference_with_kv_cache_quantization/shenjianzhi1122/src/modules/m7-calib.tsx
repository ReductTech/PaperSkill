import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawScale, drawCube, drawBar, drawSceneLabel, drawLegend, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type Mode = 'key' | 'value';

export const M7Calib: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('key');

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawCube(ctx, 80, 70, 160, 90, {});
    drawScale(ctx, 80, 190, 260, 14, mode === 'key' ? 0.4 : 0.7);
    drawSceneLabel(ctx, 80, 60, mode === 'key' ? '出发前试装' : '现场称重', mode === 'key' ? KQ.blue : KQ.green, 13);
    drawBar(ctx, 600, 90, 400, 22, mode === 'key' ? 0.3 : 0.55, mode === 'key' ? KQ.blue : KQ.green);
    drawBar(ctx, 600, 150, 400, 22, mode === 'key' ? 0.9 : 0.98, KQ.purple);
    drawSceneLabel(ctx, 600, 80, '准备成本', KQ.ink, 12);
    drawSceneLabel(ctx, 600, 140, '精度保持', KQ.ink, 12);
    drawLegend(ctx, 600, 230, [
      { label: '成本', color: KQ.blue },
      { label: '精度', color: KQ.purple },
    ]);
  }, W, H);

  const text =
    mode === 'key'
      ? 'Key 离线：16×2K 校准，按通道缩放一次算好，推理时不用更新。'
      : 'Value 在线：按 token 现算缩放/阈值，阈值 offload CPU，精度更稳。';

  return (
    <div>
      <canvas id="cv-m7-calib" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'key' ? 'selected' : ''}`} onClick={() => setMode('key')}>
          Key 离线
        </button>
        <button className={`chip ${mode === 'value' ? 'selected' : ''}`} onClick={() => setMode('value')}>
          Value 在线
        </button>
      </div>
      <div className={`feedback ${mode === 'value' ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M7Calib;
