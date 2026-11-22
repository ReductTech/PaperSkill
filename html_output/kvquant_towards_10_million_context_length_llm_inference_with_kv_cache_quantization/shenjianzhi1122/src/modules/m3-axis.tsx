import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCube, drawItem, drawBar, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type Cfg = 'tt' | 'ct';
const DATA: Record<Cfg, { name: string; ppl: number; note: string }> = {
  tt: { name: '全部按件', ppl: 9.57, note: 'Key 的离群类别被按件压缩，拖累整体。' },
  ct: { name: 'Key 按类别', ppl: 5.75, note: 'Key 按类别、Value 按件，改善 3.82 PPL。' },
};

export const M3Axis: React.FC<WidgetProps> = () => {
  const [cfg, setCfg] = useState<Cfg>('tt');
  const d = DATA[cfg];

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 4; i++) drawCube(ctx, 60 + i * 60, 56, 48, 46, {});
    for (let i = 0; i < 4; i++) drawItem(ctx, 420 + i * 60, 60, 46, 42, {});
    ctx.fillStyle = cfg === 'ct' ? 'rgba(47,93,138,0.18)' : 'rgba(192,69,63,0.14)';
    if (cfg === 'ct') ctx.fillRect(60, 56, 48, 46);
    else ctx.fillRect(60, 56, 228, 46);
    drawSceneLabel(ctx, 60, 48, 'Key 分类清单', KQ.blue, 13);
    drawSceneLabel(ctx, 420, 48, 'Value 单件物品', KQ.blue, 13);
    drawBar(ctx, 760, 90, 240, 22, d.ppl / 12, d.ppl > 7 ? KQ.red : KQ.green);
    drawSceneLabel(ctx, 760, 80, `PPL ${d.ppl}`, KQ.ink, 12);
    drawSceneLabel(ctx, 60, 210, d.note, KQ.ink, 13);
  }, W, H);

  const text = cfg === 'tt' ? `${d.name}：${d.ppl}，明显掉点。` : `${d.name}：${d.ppl}，3bit 仍可用。`;

  return (
    <div>
      <canvas id="cv-m3-axis" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(DATA) as Cfg[]).map((k) => (
          <button key={k} className={`chip ${cfg === k ? 'selected' : ''}`} onClick={() => setCfg(k)}>
            {DATA[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${cfg === 'tt' ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M3Axis;
