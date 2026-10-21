import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTape, drawBar, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const FP16 = 10.86;
const RTN = 23.54;

type Crit = 'act' | 'w' | 'rand';
const DATA: Record<Crit, Record<string, number>> = {
  act: { '0.1': 11.58, '1': 11.39, '3': 11.36 },
  w: { '0.1': 23.41, '1': 22.37, '3': 22.45 },
  rand: { '0.1': 23.54, '1': 24.23, '3': 24.22 },
};
const CRIT_LABEL: Record<Crit, string> = { act: '激活', w: '权重', rand: '随机' };

export const M3Skip: React.FC<WidgetProps> = () => {
  const [criterion, setCriterion] = useState<Crit>('act');
  const [pct, setPct] = useState<'0.1' | '1' | '3'>('1');
  const ppl = DATA[criterion][pct];

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const mark = Math.max(1, Math.round(parseFloat(pct) * 10));
    drawTape(ctx, 50, 60, 260, 140, { levels: 12, fill: mark / 12 });
    drawSceneLabel(ctx, 50, 48, '保护牌', AQ.orange, 13);
    // PPL bars
    const x0 = 420;
    const x1 = 1030;
    const scale = (v: number) => Math.min(1, v / 26);
    drawBar(ctx, x0, 70, x1 - x0, 20, scale(FP16), AQ.green);
    drawBar(ctx, x0, 110, x1 - x0, 20, scale(RTN), AQ.red);
    drawBar(ctx, x0, 150, x1 - x0, 20, scale(ppl), criterion === 'act' ? AQ.blue : AQ.orange);
    // reference lines
    for (const [v, c] of [[FP16, AQ.green], [RTN, AQ.red]] as [number, string][]) {
      const lx = x0 + scale(v) * (x1 - x0);
      ctx.strokeStyle = c;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(lx, 58);
      ctx.lineTo(lx, 186);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawLegend(ctx, x0, 230, [
      { label: 'FP16', color: AQ.green },
      { label: 'RTN', color: AQ.red },
      { label: '当前', color: criterion === 'act' ? AQ.blue : AQ.orange },
    ]);
  }, W, H);

  const cls = criterion === 'act' ? 'good' : 'bad';
  const text =
    criterion === 'act'
      ? `按激活保护：PPL 从 RTN 的 ${RTN} 降到 ${ppl}，接近 FP16 的 ${FP16}。`
      : criterion === 'w'
      ? `按权重选几乎没改善（${ppl}），和随机差不多。`
      : `随机选没有效果（${ppl}）。`;

  return (
    <div>
      <canvas id="cv-m3-skip" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['act', 'w', 'rand'] as Crit[]).map((c) => (
          <button key={c} className={`chip ${criterion === c ? 'selected' : ''}`} onClick={() => setCriterion(c)}>
            依据：{CRIT_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {(['0.1', '1', '3'] as const).map((p) => (
          <button key={p} className={`chip ${pct === p ? 'selected' : ''}`} onClick={() => setPct(p)}>
            比例：{p}%
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M3Skip;
