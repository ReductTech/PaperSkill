import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPole, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Model = 'opt' | 'bloom' | 'glm' | 'llama';
const ALPHA: Record<Model, number> = { opt: 0.5, bloom: 0.5, glm: 0.75, llama: 0.85 };
const NAME: Record<Model, string> = { opt: 'OPT', bloom: 'BLOOM', glm: 'GLM-130B', llama: 'Llama-2' };

export const M5Model: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState<Model>('opt');
  const a = ALPHA[model];
  const tilt = (a - 0.5) * 0.6;

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPole(ctx, 70, 90, 360, tilt, { leftRocks: 4, rightRocks: 4 });
    drawSceneLabel(ctx, 70, 78, NAME[model], SQ.ink, 14);
    // alpha axis
    const x0 = 600;
    const x1 = 1030;
    const y = 120;
    ctx.strokeStyle = SQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(34,141,92,0.15)';
    ctx.fillRect(x0 + 0.4 * (x1 - x0), y - 12, 0.2 * (x1 - x0), 24);
    const px = x0 + a * (x1 - x0);
    ctx.fillStyle = SQ.orange;
    ctx.beginPath();
    ctx.arc(px, y, 8, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y - 26, `α = ${a.toFixed(2)}`, SQ.orange, 15);
    drawSceneLabel(ctx, x0, y + 40, '0', SQ.muted, 12);
    drawSceneLabel(ctx, x1 - 10, y + 40, '1', SQ.muted, 12);
    drawLegend(ctx, x0, 240, [{ label: '甜区', color: SQ.green }]);
  }, W, H);

  const text =
    model === 'glm'
      ? 'GLM-130B：激活离群更严重，α=0.75，多搬一些到权重。'
      : model === 'llama'
      ? 'Llama-2：论文 Table 7 用 α=0.85（70B 为 0.9）。'
      : `${NAME[model]}：α=0.5 就够。`;

  return (
    <div>
      <canvas id="cv-m5-model" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['opt', 'bloom', 'glm', 'llama'] as Model[]).map((m) => (
          <button key={m} className={`chip ${model === m ? 'selected' : ''}`} onClick={() => setModel(m)}>
            {NAME[m]}
          </button>
        ))}
      </div>
      <div className={`feedback ${model === 'opt' || model === 'bloom' ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M5Model;
