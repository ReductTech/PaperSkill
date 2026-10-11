import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTape, drawBar, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const FP16 = 10.86;

type Cfg = 'fp16' | 'int3' | 'int2';
const PPL: Record<Cfg, number> = { fp16: 10.86, int3: 11.39, int2: 15.71 };

export const M9Bits: React.FC<WidgetProps> = () => {
  const [cfg, setCfg] = useState<Cfg>('int3');
  const levels = cfg === 'fp16' ? 32 : cfg === 'int3' ? 8 : 4;

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawTape(ctx, 60, 60, 240, 150, { levels, fill: 1, color: cfg === 'int2' ? AQ.purple : AQ.blue });
    drawSceneLabel(ctx, 60, 50, cfg === 'fp16' ? 'FP16' : cfg === 'int3' ? 'INT3-g128' : 'INT2-g64', AQ.ink, 14);
    const x0 = 400;
    const x1 = 1030;
    const scale = (v: number) => Math.min(1, v / 20);
    // FP16 reference
    const rx = x0 + scale(FP16) * (x1 - x0);
    ctx.strokeStyle = AQ.green;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, 60);
    ctx.lineTo(rx, 210);
    ctx.stroke();
    ctx.setLineDash([]);
    drawBar(ctx, x0, 80, x1 - x0, 22, scale(PPL[cfg]), cfg === 'int2' ? AQ.orange : AQ.blue);
    // extreme failure bars for reference
    drawBar(ctx, x0, 150, x1 - x0, 22, scale(23.54), AQ.red);
    drawSceneLabel(ctx, x0, 70, `当前 PPL ${PPL[cfg].toFixed(2)}`, AQ.ink, 13);
    drawSceneLabel(ctx, x0, 140, `INT3 RTN ${23.54}`, AQ.red, 12);
    drawLegend(ctx, x0, 250, [
      { label: 'FP16', color: AQ.green },
      { label: '当前', color: cfg === 'int2' ? AQ.orange : AQ.blue },
      { label: 'RTN', color: AQ.red },
    ]);
  }, W, H);

  const cls = cfg === 'int2' ? 'bad' : 'good';
  const text =
    cfg === 'int3'
      ? 'INT3-g128 的 AWQ 只比 FP16 差一点点（11.39 vs 10.86）。'
      : cfg === 'int2'
      ? '到 INT2，RTN 完全失效（7622）；AWQ 与 GPTQ 正交，组合后降到 15.71（单独 GPTQ 16.65）。'
      : `FP16 基线 PPL ${FP16}，作为参照。`;

  return (
    <div>
      <canvas id="cv-m9-bits" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['fp16', 'int3', 'int2'] as Cfg[]).map((c) => (
          <button key={c} className={`chip ${cfg === c ? 'selected' : ''}`} onClick={() => setCfg(c)}>
            {c === 'fp16' ? 'FP16' : c === 'int3' ? 'INT3-g128 (AWQ)' : 'INT2-g64 (AWQ+GPTQ)'}
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M9Bits;
