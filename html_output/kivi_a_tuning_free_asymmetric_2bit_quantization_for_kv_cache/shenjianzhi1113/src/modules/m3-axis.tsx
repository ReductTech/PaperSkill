import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCard, drawPage, drawBar, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type Cfg = 'kctv' | 'kttv' | 'kccv' | 'ktcv';
const DATA: Record<Cfg, { name: string; coqa: number; note: string; kAxis: 'c' | 't'; vAxis: 'c' | 't' }> = {
  kctv: { name: 'K-C / V-T', coqa: 63.53, note: 'Key 按列、Value 按行：2bit 仍可用。', kAxis: 'c', vAxis: 't' },
  kttv: { name: 'K-T / V-T', coqa: 52.93, note: 'Value 对了，但 Key 的离群列拖累。', kAxis: 't', vAxis: 't' },
  kccv: { name: 'K-C / V-C', coqa: 2.88, note: 'Value 按列直接崩。', kAxis: 'c', vAxis: 'c' },
  ktcv: { name: 'K-T / V-C', coqa: 2.8, note: '两个方向都错，几乎归零。', kAxis: 't', vAxis: 'c' },
};

export const M3Axis: React.FC<WidgetProps> = () => {
  const [cfg, setCfg] = useState<Cfg>('kttv');
  const d = DATA[cfg];

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawCard(ctx, 60, 60, 300, 90, 8);
    drawPage(ctx, 420, 60, 250, 90);
    if (d.kAxis === 'c') {
      ctx.fillStyle = 'rgba(47,93,138,0.22)';
      ctx.fillRect(60 + 3 * 37.5, 60, 37.5, 90);
    } else {
      ctx.fillStyle = 'rgba(47,93,138,0.22)';
      ctx.fillRect(60, 60 + 3 * 11.25, 300, 11.25);
    }
    if (d.vAxis === 't') {
      ctx.fillStyle = 'rgba(47,125,79,0.22)';
      ctx.fillRect(420, 60 + 3 * 11.25, 250, 11.25);
    } else {
      ctx.fillStyle = 'rgba(192,69,63,0.18)';
      ctx.fillRect(420 + 3 * 31.25, 60, 31.25, 90);
    }
    drawSceneLabel(ctx, 60, 50, 'Key 索引卡', KV.blue, 13);
    drawSceneLabel(ctx, 420, 50, 'Value 正文页', KV.blue, 13);
    drawBar(ctx, 720, 80, 280, 22, d.coqa / 70, d.coqa < 10 ? KV.red : d.coqa > 60 ? KV.green : KV.orange);
    drawSceneLabel(ctx, 720, 70, `CoQA ${d.coqa}`, KV.ink, 12);
    drawSceneLabel(ctx, 60, 210, d.note, KV.ink, 13);
    drawLegend(ctx, 720, 230, [
      { label: 'K 轴', color: KV.blue },
      { label: 'V 轴', color: KV.green },
    ]);
  }, W, H);

  const text = d.coqa < 10 ? `${d.name}：${d.coqa}，几乎崩掉。` : `${d.name}：${d.coqa}，${d.coqa > 60 ? '2bit 仍可用。' : '明显掉点。'}`;

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
      <div className={`feedback ${d.coqa < 10 ? 'bad' : d.coqa > 60 ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M3Axis;
