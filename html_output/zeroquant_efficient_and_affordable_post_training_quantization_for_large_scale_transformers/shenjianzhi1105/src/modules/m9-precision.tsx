import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type P = 'int8' | 'w48' | 'w48attn';
const DATA: Record<P, { name: string; mem: number; acc: number; note: string }> = {
  int8: { name: 'INT8 W8A8', mem: 1, acc: 0.98, note: '零成本、几乎无损，首选。' },
  w48: { name: 'W4/8', mem: 0.34, acc: 0.92, note: '显存约 3× 省，但要 LKD，且不是全 INT4。' },
  w48attn: { name: 'W4/8 + 注意力 FP16', mem: 0.36, acc: 0.97, note: '20B 上注意力输入敏感，留 FP16 才稳。' },
};

export const M9Precision: React.FC<WidgetProps> = () => {
  const [p, setP] = useState<P>('int8');
  const d = DATA[p];

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 3; i++) {
      const active = (['int8', 'w48', 'w48attn'] as P[])[i] === p;
      ctx.fillStyle = active ? 'rgba(47,93,138,0.12)' : ZQ.card;
      ctx.strokeStyle = active ? ZQ.blue : ZQ.border;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.fillRect(70 + i * 170, 56, 150, 62);
      ctx.strokeRect(70 + i * 170, 56, 150, 62);
      drawSceneLabel(ctx, 86 + i * 170, 94, DATA[(['int8', 'w48', 'w48attn'] as P[])[i]].name, active ? ZQ.blue : ZQ.ink, 12);
    }
    drawBar(ctx, 600, 80, 400, 22, d.mem, ZQ.purple);
    drawBar(ctx, 600, 140, 400, 22, d.acc, ZQ.green);
    drawSceneLabel(ctx, 600, 70, `显存 ${(d.mem * 100).toFixed(0)}%`, ZQ.purple, 12);
    drawSceneLabel(ctx, 600, 130, `精度保持 ${(d.acc * 100).toFixed(0)}%`, ZQ.green, 12);
    drawLegend(ctx, 600, 230, [
      { label: '显存↓', color: ZQ.purple },
      { label: '精度↑', color: ZQ.green },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m9-precision" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['int8', 'w48', 'w48attn'] as P[]).map((k) => (
          <button key={k} className={`chip ${p === k ? 'selected' : ''}`} onClick={() => setP(k)}>
            {DATA[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${p === 'int8' ? 'good' : 'good'}`}>{d.note}</div>
    </div>
  );
};

export default M9Precision;
