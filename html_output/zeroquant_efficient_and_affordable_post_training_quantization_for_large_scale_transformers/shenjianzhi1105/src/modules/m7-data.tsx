import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type D = 'random' | 'wiki' | 'orig';
const DATA: Record<D, { name: string; acc: number; ppl: number }> = {
  random: { name: '随机数据', acc: 34.5, ppl: 40.6 },
  wiki: { name: 'Wikipedia', acc: 36.2, ppl: 30.4 },
  orig: { name: '原始数据', acc: 36.6, ppl: 31.1 },
};

export const M7Data: React.FC<WidgetProps> = () => {
  const [data, setData] = useState<D>('random');
  const areaRef = useRef<HTMLDivElement>(null);
  const d = DATA[data];

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    (['random', 'wiki', 'orig'] as D[]).forEach((k, i) => {
      const active = data === k;
      const x = 60 + i * 180;
      ctx.fillStyle = active ? 'rgba(47,93,138,0.12)' : ZQ.card;
      ctx.strokeStyle = active ? ZQ.blue : ZQ.border;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.fillRect(x, 56, 150, 64);
      ctx.strokeRect(x, 56, 150, 64);
      drawSceneLabel(ctx, x + 16, 94, DATA[k].name, active ? ZQ.blue : ZQ.ink, 13);
    });
    drawBar(ctx, 640, 80, 360, 22, d.acc / 45, ZQ.green);
    drawBar(ctx, 640, 140, 360, 22, Math.min(1, d.ppl / 50), ZQ.red);
    drawSceneLabel(ctx, 640, 70, `平均准确率 ${d.acc}`, ZQ.ink, 12);
    drawSceneLabel(ctx, 640, 130, `PPL ${d.ppl}`, ZQ.ink, 12);
    drawSceneLabel(ctx, 60, 180, 'LKD 目标只看输出一致，不需要标签', ZQ.muted, 13);
  }, W, H);

  const onClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(2, Math.floor((x - 60) / 180)));
    setData((['random', 'wiki', 'orig'] as D[])[i]);
  };

  const text =
    data === 'random'
      ? '34.5 / 40.6：随机数据也能学层内依赖。'
      : data === 'wiki'
      ? '36.2 / 30.4，接近原始数据 36.6 / 31.1。'
      : '36.6 / 31.1：有原始数据时最好，但优势不大。';

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientX)}>
        <canvas id="cv-m7-data" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${data === 'random' ? 'selected' : ''}`} onClick={() => setData('random')}>
          随机数据
        </button>
        <button className={`chip ${data === 'wiki' ? 'selected' : ''}`} onClick={() => setData('wiki')}>
          Wikipedia
        </button>
        <button className={`chip ${data === 'orig' ? 'selected' : ''}`} onClick={() => setData('orig')}>
          原始数据
        </button>
      </div>
      <div className={`feedback ${data === 'random' ? '' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M7Data;
