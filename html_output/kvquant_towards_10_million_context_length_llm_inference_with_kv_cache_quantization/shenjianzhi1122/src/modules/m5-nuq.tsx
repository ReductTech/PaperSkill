import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCube, drawBar, drawSceneLabel, drawLegend, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type Mode = 'uniform' | 'nuq';
const PPL: Record<Mode, number> = { uniform: 6.04, nuq: 5.75 };

export const M5Nuq: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('uniform');

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawCube(ctx, 80, 60, 320, 120, {});
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const xx = 96 + t * 288;
      ctx.strokeStyle = KQ.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xx, 66);
      ctx.lineTo(xx, 174);
      ctx.stroke();
    }
    if (mode === 'nuq') {
      for (let i = 0; i < 6; i++) {
        const t = 0.5 + 0.45 * Math.sin(i * 1.3);
        const xx = 96 + t * 288;
        ctx.strokeStyle = KQ.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(xx, 60);
        ctx.lineTo(xx, 180);
        ctx.stroke();
      }
    }
    drawSceneLabel(ctx, 80, 50, mode === 'uniform' ? '等距档位' : '敏感度档位', mode === 'uniform' ? KQ.red : KQ.green, 13);
    drawBar(ctx, 560, 100, 440, 24, PPL[mode] / 8, mode === 'uniform' ? KQ.red : KQ.green);
    drawSceneLabel(ctx, 560, 90, `PPL ${PPL[mode]}`, KQ.ink, 12);
    drawLegend(ctx, 560, 230, [
      { label: '档位', color: KQ.orange },
      { label: 'nuq', color: KQ.green },
    ]);
  }, W, H);

  const text = mode === 'uniform' ? '等距档位，在非均匀分布下浪费档位。' : '按 Fisher 敏感度学档位，改善 0.29 PPL。';

  return (
    <div>
      <canvas id="cv-m5-nuq" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'uniform' ? 'selected' : ''}`} onClick={() => setMode('uniform')}>
          均匀
        </button>
        <button className={`chip ${mode === 'nuq' ? 'selected' : ''}`} onClick={() => setMode('nuq')}>
          nuq
        </button>
      </div>
      <div className={`feedback ${mode === 'uniform' ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M5Nuq;
