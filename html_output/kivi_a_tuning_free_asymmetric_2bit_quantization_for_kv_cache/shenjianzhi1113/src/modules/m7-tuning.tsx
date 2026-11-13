import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFolder, drawBar, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type Mode = 'qat' | 'ptq' | 'kivi';
const DATA: Record<Mode, { name: string; cost: number; bits: number; note: string; color: string }> = {
  qat: { name: 'QAT', cost: 1, bits: 2, note: '要训练、要数据，成本最高。', color: KV.blue },
  ptq: { name: '校准 PTQ', cost: 0.45, bits: 4, note: '要校准集，4bit 以下明显掉。', color: KV.orange },
  kivi: { name: 'KIVI', cost: 0.05, bits: 2, note: '免微调、免校准，2bit 可用。', color: KV.green },
};

export const M7Tuning: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('qat');
  const d = DATA[mode];

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawFolder(ctx, 80, 70, 90, 90, { tone: mode === 'kivi' ? 'normal' : 'hot' });
    drawSceneLabel(ctx, 80, 60, mode === 'kivi' ? '直接上岗' : '先培训', mode === 'kivi' ? KV.green : KV.red, 13);
    drawBar(ctx, 520, 90, 480, 22, d.cost, d.color);
    drawBar(ctx, 520, 150, 480, 22, 1 - (d.bits - 2) / 6, KV.purple);
    drawSceneLabel(ctx, 520, 80, `部署成本 ${(d.cost * 100).toFixed(0)}%`, KV.ink, 12);
    drawSceneLabel(ctx, 520, 140, `可用位宽 ${d.bits}bit`, KV.ink, 12);
    drawLegend(ctx, 520, 230, [
      { label: '成本↓', color: KV.blue },
      { label: '位宽↓', color: KV.purple },
    ]);
  }, W, H);

  const text = d.note;

  return (
    <div>
      <canvas id="cv-m7-tuning" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['qat', 'ptq', 'kivi'] as Mode[]).map((m) => (
          <button key={m} className={`chip ${mode === m ? 'selected' : ''}`} onClick={() => setMode(m)}>
            {DATA[m].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 'kivi' ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M7Tuning;
