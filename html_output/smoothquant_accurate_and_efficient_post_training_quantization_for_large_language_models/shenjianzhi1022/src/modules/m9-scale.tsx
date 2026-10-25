import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Cfg = 'opt' | 'b530' | 'decode';
const TEXT: Record<Cfg, string> = {
  opt: 'OPT-175B：4 卡代替 8 卡，延迟相近。',
  b530: 'MT-NLG 530B：8 卡单节点，显存约减半。',
  decode: '解码阶段：每 token 最高 1.42×。',
};

export const M9Scale: React.FC<WidgetProps> = () => {
  const [cfg, setCfg] = useState<Cfg>('opt');

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    if (cfg === 'opt') {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i < 4 ? SQ.green : SQ.border;
        ctx.fillRect(70 + i * 46, 70, 38, 60);
      }
      drawBar(ctx, 500, 80, 480, 20, 4 / 8, SQ.green);
      drawSceneLabel(ctx, 500, 70, '卡数 8 → 4', SQ.green, 13);
    } else if (cfg === 'b530') {
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i < 8 ? SQ.green : SQ.border;
        ctx.fillRect(60 + i * 26, 60, 20, 50);
      }
      drawBar(ctx, 520, 70, 460, 18, 527 / 1100, SQ.green);
      drawBar(ctx, 520, 110, 460, 18, 1, SQ.red);
      drawSceneLabel(ctx, 520, 60, '显存 1040 → 527GB', SQ.green, 12);
    } else {
      drawBar(ctx, 70, 80, 900, 20, 314 / 422, SQ.green);
      drawBar(ctx, 70, 120, 900, 20, 1, SQ.red);
      drawSceneLabel(ctx, 70, 70, 'SmoothQuant 314ms', SQ.green, 12);
      drawSceneLabel(ctx, 70, 110, 'FP16 422ms', SQ.red, 12);
    }
    drawLegend(ctx, 70, 240, [
      { label: 'SmoothQuant', color: SQ.green },
      { label: 'FP16', color: SQ.red },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m9-scale" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${cfg === 'opt' ? 'selected' : ''}`} onClick={() => setCfg('opt')}>
          OPT-175B
        </button>
        <button className={`chip ${cfg === 'b530' ? 'selected' : ''}`} onClick={() => setCfg('b530')}>
          MT-NLG 530B
        </button>
        <button className={`chip ${cfg === 'decode' ? 'selected' : ''}`} onClick={() => setCfg('decode')}>
          解码阶段
        </button>
      </div>
      <div className="feedback good">{TEXT[cfg]}</div>
    </div>
  );
};

export default M9Scale;
