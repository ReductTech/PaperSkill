import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawGarment, drawMaster, drawArrow, drawBar, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type Mode = 'none' | 'lkd';
const ACC: Record<Mode, number> = { none: 33.4, lkd: 36.6 };
const PPL: Record<Mode, number> = { none: 92.1, lkd: 31.1 };

export const M7Lkd: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('none');

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    if (mode === 'lkd') {
      drawMaster(ctx, 100, 200, 34);
      drawArrow(ctx, 140, 150, 200, 140, ZQ.purple);
    }
    drawGarment(ctx, 220, 70, 96, 120, { fit: mode === 'lkd' ? 'good' : 'bad' });
    drawSceneLabel(ctx, 70, 60, mode === 'lkd' ? '师傅纠正' : '没人纠正', mode === 'lkd' ? ZQ.purple : ZQ.red, 13);
    drawBar(ctx, 520, 80, 480, 22, ACC[mode] / 45, mode === 'none' ? ZQ.red : ZQ.green);
    drawBar(ctx, 520, 140, 480, 22, Math.min(1, PPL[mode] / 100), mode === 'none' ? ZQ.red : ZQ.green);
    drawSceneLabel(ctx, 520, 70, `平均准确率 ${ACC[mode]}`, ZQ.ink, 12);
    drawSceneLabel(ctx, 520, 130, `Wikitext-2 PPL ${PPL[mode]}`, ZQ.ink, 12);
    drawLegend(ctx, 520, 230, [
      { label: '准确率↑', color: ZQ.green },
      { label: 'PPL↓', color: ZQ.red },
    ]);
  }, W, H);

  const text =
    mode === 'none'
      ? 'W4/8 直接量化：平均 33.4、PPL 92.1，生成崩。'
      : '逐层蒸馏：36.6 / 31.1，1.1 小时单卡。';

  return (
    <div>
      <canvas id="cv-m7-lkd" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'none' ? 'selected' : ''}`} onClick={() => setMode('none')}>
          无 LKD
        </button>
        <button className={`chip ${mode === 'lkd' ? 'selected' : ''}`} onClick={() => setMode('lkd')}>
          +LKD
        </button>
      </div>
      <div className={`feedback ${mode === 'none' ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M7Lkd;
