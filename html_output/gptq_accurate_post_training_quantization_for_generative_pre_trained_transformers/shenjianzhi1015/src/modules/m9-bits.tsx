import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawBar, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
const FP16 = 8.34;
type Cfg = 'fp16' | 'int4' | 'int3' | 'int3g' | 'int2g' | 'tern';
const PPL: Record<Cfg, number> = { fp16: 8.34, int4: 8.37, int3: 8.68, int3g: 8.45, int2g: 8.94, tern: 9.2 };
const LABEL: Record<Cfg, string> = {
  fp16: 'FP16',
  int4: '4-bit',
  int3: '3-bit',
  int3g: '3-bit g128',
  int2g: '2-bit g32',
  tern: '三值 g8',
};

export const M9Bits: React.FC<WidgetProps> = () => {
  const [cfg, setCfg] = useState<Cfg>('int3');
  const widths: Record<Cfg, number> = { fp16: 40, int4: 30, int3: 22, int3g: 22, int2g: 16, tern: 12 };

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const tw = widths[cfg];
    let x = 50;
    for (let i = 0; i < 10; i++) {
      const color = cfg === 'tern' ? (i % 3 === 0 ? GQ.stone : i % 3 === 1 ? GQ.blue : GQ.stoneEdge) : GQ.stone;
      ctx.fillStyle = color;
      ctx.strokeStyle = GQ.stoneEdge;
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, 100, tw, tw);
      ctx.strokeRect(x, 100, tw, tw);
      x += tw + 10;
    }
    drawSceneLabel(ctx, 50, 88, LABEL[cfg], GQ.ink, 14);
    // PPL bars
    const x0 = 560;
    const x1 = 1030;
    const scale = (v: number) => Math.min(1, (v - 8) / 2);
    const rx = x0 + scale(FP16) * (x1 - x0);
    ctx.strokeStyle = GQ.green;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, 60);
    ctx.lineTo(rx, 200);
    ctx.stroke();
    ctx.setLineDash([]);
    drawBar(ctx, x0, 90, x1 - x0, 22, scale(PPL[cfg]), cfg === 'int2g' || cfg === 'tern' ? GQ.orange : GQ.blue);
    drawSceneLabel(ctx, x0, 80, `PPL ${PPL[cfg].toFixed(2)}`, GQ.ink, 13);
    drawLegend(ctx, x0, 240, [
      { label: 'FP16 8.34', color: GQ.green },
      { label: '当前', color: cfg === 'int2g' || cfg === 'tern' ? GQ.orange : GQ.blue },
    ]);
  }, W, H);

  const cls = cfg === 'fp16' || cfg === 'int4' || cfg === 'int3g' ? 'good' : '';
  const text =
    cfg === 'int4'
      ? '几乎无损：8.37 vs FP16 8.34。'
      : cfg === 'int3g'
      ? '分组把 3 位拉回 8.45。'
      : cfg === 'int2g'
      ? '2 位加分组到 8.94，仍可用。'
      : cfg === 'tern'
      ? '只剩三种砖，PPL 9.20，适合特殊硬件。'
      : cfg === 'int3'
      ? '3 位：8.68，比 4 位差一点但远好于 RTN。'
      : `FP16 基线 PPL ${FP16}，作为参照。`;

  return (
    <div>
      <canvas id="cv-m9-bits" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['fp16', 'int4', 'int3', 'int3g', 'int2g', 'tern'] as Cfg[]).map((c) => (
          <button key={c} className={`chip ${cfg === c ? 'selected' : ''}`} onClick={() => setCfg(c)}>
            {LABEL[c]}
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M9Bits;
