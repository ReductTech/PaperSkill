import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCase, drawItem, drawBar, drawSceneLabel, drawLegend, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const CTX = ['32K', '128K', '1M', '10M'];
const FP16 = [16, 64, 512, 4883];
const KV2 = [2, 8, 64, 611];
const CAP = 80;

export const M1Trunk: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(1);
  const fp16 = FP16[idx];
  const kv2 = KV2[idx];
  const fits = kv2 <= CAP;

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawCase(ctx, 60, 60, 300, 150, Math.min(1, kv2 / CAP));
    for (let i = 0; i < 5; i++) {
      drawItem(ctx, 84 + (i % 3) * 84, 92 + Math.floor(i / 3) * 48, 64, 38, { big: !fits && i > 2 });
    }
    drawSceneLabel(ctx, 60, 50, `2bit KV ${kv2}GB`, fits ? KQ.green : KQ.red, 13);
    const x0 = 520;
    const x1 = 1040;
    drawBar(ctx, x0, 90, x1 - x0, 22, Math.min(1, fp16 / 512), fp16 > CAP ? KQ.red : KQ.blue);
    drawBar(ctx, x0, 145, x1 - x0, 22, Math.min(1, kv2 / 512), fits ? KQ.green : KQ.red);
    drawSceneLabel(ctx, x0, 80, `FP16 KV ${fp16}GB`, KQ.ink, 12);
    drawSceneLabel(ctx, x0, 135, `2bit KV ${kv2}GB`, KQ.ink, 12);
    const cx = x0 + Math.min(1, CAP / 512) * (x1 - x0);
    ctx.strokeStyle = KQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, 60);
    ctx.lineTo(cx, 200);
    ctx.stroke();
    drawSceneLabel(ctx, cx + 6, 210, '80GB', KQ.orange, 12);
    drawLegend(ctx, x0, 245, [
      { label: 'FP16', color: KQ.red },
      { label: '2bit', color: KQ.green },
    ]);
  }, W, H);

  const text = !fits
    ? `上下文 ${CTX[idx]}：2bit KV 约 ${kv2}GB，单卡 80GB 装不下；需要 8 卡（约 ${(kv2 / 8).toFixed(0)}GB/卡）。`
    : idx >= 2
    ? `上下文 ${CTX[idx]}：2bit KV 约 ${kv2}GB，单卡 80GB 刚好；FP16 要 ${fp16}GB。`
    : `上下文 ${CTX[idx]}：FP16 ${fp16}GB 已很紧，2bit 只要 ${kv2}GB。`;

  return (
    <div>
      <canvas id="cv-m1-trunk" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {CTX.map((c, i) => (
          <button key={c} className={`chip ${idx === i ? 'selected' : ''}`} onClick={() => setIdx(i)}>
            {c}
          </button>
        ))}
      </div>
      <div className={`feedback ${fits ? 'good' : 'bad'}`}>{text}</div>
    </div>
  );
};

export default M1Trunk;
