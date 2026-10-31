import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasin, drawBar, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
type Mode = 'fp16' | 'int8' | 'llm';
const MEM: Record<Mode, number> = { fp16: 1, int8: 0.5, llm: 0.51 };
const SPEED: Record<Mode, number> = { fp16: 1, int8: 2.29, llm: 1.81 };
const NAME: Record<Mode, string> = { fp16: 'FP16', int8: '纯 Int8', llm: 'LLM.int8' };

export const M6Precision: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('llm');

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawBasin(ctx, 70, 80, 320, 140, { fill: mode === 'fp16' ? 1 : 0.55 });
    drawSceneLabel(ctx, 70, 70, NAME[mode], LI.ink, 14);
    drawBar(ctx, 520, 90, 480, 22, MEM[mode], mode === 'int8' ? LI.red : LI.green);
    drawBar(ctx, 520, 150, 480, 22, SPEED[mode] / 2.5, mode === 'fp16' ? LI.muted : LI.green);
    drawSceneLabel(ctx, 520, 80, `显存 ${MEM[mode].toFixed(2)}×`, LI.ink, 12);
    drawSceneLabel(ctx, 520, 140, `矩阵乘 ${SPEED[mode].toFixed(2)}×`, LI.ink, 12);
    drawLegend(ctx, 520, 240, [
      { label: '显存', color: mode === 'int8' ? LI.red : LI.green },
      { label: '速度', color: LI.green },
    ]);
  }, W, H);

  const text =
    mode === 'fp16'
      ? 'FP16：显存 1×，速度 1×。'
      : mode === 'int8'
      ? '纯 Int8：显存减半、矩阵乘最快，但离群值会让精度崩。'
      : 'LLM.int8：显存约 1/1.96，175B 矩阵乘 1.81×，精度保持。';

  return (
    <div>
      <canvas id="cv-m6-precision" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['fp16', 'int8', 'llm'] as Mode[]).map((m) => (
          <button key={m} className={`chip ${mode === m ? 'selected' : ''}`} onClick={() => setMode(m)}>
            {NAME[m]}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 'int8' ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M6Precision;
