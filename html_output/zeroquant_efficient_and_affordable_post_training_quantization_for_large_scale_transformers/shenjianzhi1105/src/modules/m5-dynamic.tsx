import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCustomer, drawGarment, drawBar, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type Mode = 'static' | 'dynamic';
const ACC: Record<Mode, number> = { static: 37.8, dynamic: 38.7 };
const PPL: Record<Mode, number> = { static: 26.2, dynamic: 21.7 };

export const M5Dynamic: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('static');

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    if (mode === 'static') {
      ctx.fillStyle = ZQ.card;
      ctx.strokeStyle = ZQ.red;
      ctx.lineWidth = 2;
      ctx.fillRect(70, 70, 110, 120);
      ctx.strokeRect(70, 70, 110, 120);
      for (let i = 0; i < 5; i++) drawSceneLabel(ctx, 84, 96 + i * 20, `尺码 ${i + 1}`, ZQ.red, 11);
    } else {
      for (let i = 0; i < 5; i++) {
        drawCustomer(ctx, 90 + i * 34, 190, 22, { range: 10 + i * 5, highlight: i === 2 });
        drawGarment(ctx, 78 + i * 34, 90, 26, 40, { fit: 'good' });
      }
    }
    drawSceneLabel(ctx, 70, 60, mode === 'static' ? '一张尺码表' : '逐人量体', mode === 'static' ? ZQ.red : ZQ.green, 13);
    drawBar(ctx, 520, 80, 480, 22, ACC[mode] / 45, mode === 'static' ? ZQ.red : ZQ.green);
    drawBar(ctx, 520, 140, 480, 22, PPL[mode] / 30, mode === 'static' ? ZQ.red : ZQ.green);
    drawSceneLabel(ctx, 520, 70, `平均准确率 ${ACC[mode]}`, ZQ.ink, 12);
    drawSceneLabel(ctx, 520, 130, `Wikitext-2 PPL ${PPL[mode]}`, ZQ.ink, 12);
    drawLegend(ctx, 520, 230, [
      { label: '准确率↑', color: ZQ.green },
      { label: 'PPL↓', color: ZQ.red },
    ]);
  }, W, H);

  const text =
    mode === 'static'
      ? '固定范围：平均 37.8、PPL 26.2，生成任务明显掉。'
      : '逐 token 现算：平均 38.7、PPL 21.7，接近 FP16 38.9/21.5，且免校准。';

  return (
    <div>
      <canvas id="cv-m5-dynamic" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'static' ? 'selected' : ''}`} onClick={() => setMode('static')}>
          静态
        </button>
        <button className={`chip ${mode === 'dynamic' ? 'selected' : ''}`} onClick={() => setMode('dynamic')}>
          动态
        </button>
      </div>
      <div className={`feedback ${mode === 'static' ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M5Dynamic;
