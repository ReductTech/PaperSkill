import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type Bits = 2 | 4;
type G = 32 | 64 | 128;
const SCORE: Record<G, number> = { 32: 20.77, 64: 21.0, 128: 17.29 };

export const M9Config: React.FC<WidgetProps> = () => {
  const [bits, setBits] = useState<Bits>(2);
  const [G, setG] = useState<G>(32);
  const score = SCORE[G];

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? 'rgba(47,125,79,0.12)' : i === 1 ? 'rgba(47,93,138,0.10)' : 'rgba(123,75,183,0.10)';
      ctx.fillRect(60 + i * 150, 52, 130, 70);
      drawSceneLabel(ctx, 78 + i * 150, 94, i === 0 ? '2bit' : i === 1 ? '4bit' : 'MQA', KV.ink, 13);
    }
    drawBar(ctx, 600, 80, 400, 22, 16 / bits / 8, bits === 2 ? KV.green : KV.blue);
    drawBar(ctx, 600, 140, 400, 22, score / 25, G === 128 ? KV.red : KV.green);
    drawSceneLabel(ctx, 600, 70, `压缩率 ${(16 / bits).toFixed(0)}×`, KV.ink, 12);
    drawSceneLabel(ctx, 600, 130, `GSM8K ${score}`, KV.ink, 12);
    drawLegend(ctx, 600, 230, [
      { label: bits === 2 ? '2bit' : '4bit', color: bits === 2 ? KV.green : KV.blue },
      { label: '组大小', color: KV.purple },
    ]);
  }, W, H);

  const text =
    G === 128
      ? '17.29：组太大，离群值混在一起，明显掉点。'
      : bits === 2
      ? `2bit、G=${G}：${score}，${G === 32 ? '稳' : '略好'}。`
      : `4bit 更稳，但压缩率只有 4×，不如 2bit 的 8×。`;

  return (
    <div>
      <canvas id="cv-m9-config" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${bits === 2 ? 'selected' : ''}`} onClick={() => setBits(2)}>
          2bit
        </button>
        <button className={`chip ${bits === 4 ? 'selected' : ''}`} onClick={() => setBits(4)}>
          4bit
        </button>
      </div>
      <div className="chip-row">
        {([32, 64, 128] as G[]).map((g) => (
          <button key={g} className={`chip ${G === g ? 'selected' : ''}`} onClick={() => setG(g)}>
            G = {g}
          </button>
        ))}
      </div>
      <div className={`feedback ${G === 128 ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M9Config;
