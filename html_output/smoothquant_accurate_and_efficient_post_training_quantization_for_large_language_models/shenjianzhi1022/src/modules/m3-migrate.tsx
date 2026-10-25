import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasket, drawGrid, drawBar, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Gran = 'tensor' | 'token' | 'channel';
const ACC: Record<Gran, number> = { tensor: 32.3, token: 31.7, channel: 71.4 };
const OK: Record<Gran, boolean> = { tensor: true, token: true, channel: false };
const LABEL: Record<Gran, string> = { tensor: 'per-tensor', token: 'per-token', channel: 'per-channel' };

export const M3Migrate: React.FC<WidgetProps> = () => {
  const [gran, setGran] = useState<Gran>('tensor');

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawBasket(ctx, 100, 70, 180, 80, { highlight: true });
    if (gran === 'tensor') drawGrid(ctx, 102, 72, 176, 76, 1, 1);
    else if (gran === 'token') drawGrid(ctx, 102, 72, 176, 76, 4, 1);
    else drawGrid(ctx, 102, 72, 176, 76, 1, 6);
    drawSceneLabel(ctx, 100, 58, LABEL[gran], SQ.ink, 13);
    drawBar(ctx, 440, 80, 440, 24, ACC[gran] / 80, gran === 'channel' ? SQ.blue : SQ.red);
    drawSceneLabel(ctx, 440, 70, `精度 ${ACC[gran]}%`, gran === 'channel' ? SQ.blue : SQ.red, 13);
    drawSceneLabel(ctx, 440, 140, OK[gran] ? 'INT8 GEMM：兼容' : 'INT8 GEMM：不兼容', OK[gran] ? SQ.green : SQ.red, 14);
    drawLegend(ctx, 440, 230, [
      { label: '精度', color: gran === 'channel' ? SQ.blue : SQ.red },
      { label: '兼容', color: OK[gran] ? SQ.green : SQ.red },
    ]);
  }, W, H);

  const text =
    gran === 'tensor'
      ? 'per-tensor：精度崩到 32.3%，但 GEMM 兼容。'
      : gran === 'token'
      ? 'per-token：31.7%，只比 per-tensor 好一点。'
      : 'per-channel：71.4% 接近 FP16，但 INT8 GEMM 不支持内维缩放。';

  return (
    <div>
      <canvas id="cv-m3-migrate" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['tensor', 'token', 'channel'] as Gran[]).map((g) => (
          <button key={g} className={`chip ${gran === g ? 'selected' : ''}`} onClick={() => setGran(g)}>
            {LABEL[g]}
          </button>
        ))}
      </div>
      <div className={`feedback ${gran === 'channel' ? '' : 'bad'}`}>{text}</div>
    </div>
  );
};

export default M3Migrate;
