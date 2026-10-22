import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasket, drawGrid, drawBar, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Scheme = 'o1' | 'o2' | 'o3';
const LAT: Record<Scheme, number> = { o1: 246.7, o2: 240.2, o3: 227.6 };
const DESC: Record<Scheme, string> = {
  o1: 'per-token 动态：最细，延迟 246.7ms。',
  o2: 'per-tensor 动态：240.2ms。',
  o3: 'per-tensor 静态：227.6ms，最快；精度允许时推荐。',
};

export const M6Scheme: React.FC<WidgetProps> = () => {
  const [scheme, setScheme] = useState<Scheme>('o3');

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawBasket(ctx, 90, 80, 180, 80, { highlight: true });
    if (scheme === 'o1') drawGrid(ctx, 92, 82, 176, 76, 4, 1);
    else drawGrid(ctx, 92, 82, 176, 76, 1, 1);
    drawSceneLabel(ctx, 90, 68, scheme === 'o1' ? 'per-token' : scheme === 'o2' ? '动态' : '静态', SQ.ink, 13);
    drawBar(ctx, 420, 80, 560, 18, 343.0 / 400, SQ.red);
    drawBar(ctx, 420, 120, 560, 18, LAT[scheme] / 400, SQ.green);
    drawSceneLabel(ctx, 420, 70, `FP16 343.0ms`, SQ.red, 12);
    drawSceneLabel(ctx, 420, 110, `当前 ${LAT[scheme]}ms`, SQ.green, 12);
    drawLegend(ctx, 420, 220, [
      { label: 'FP16', color: SQ.red },
      { label: 'SmoothQuant', color: SQ.green },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m6-scheme" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['o1', 'o2', 'o3'] as Scheme[]).map((s) => (
          <button key={s} className={`chip ${scheme === s ? 'selected' : ''}`} onClick={() => setScheme(s)}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={`feedback ${scheme === 'o3' ? 'good' : ''}`}>{DESC[scheme]}</div>
    </div>
  );
};

export default M6Scheme;
