import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type M = 'qat' | 'ptq' | 'zq';
const DATA: Record<M, { name: string; acc: number; time: number; note: string; color: string }> = {
  qat: { name: 'QAT', acc: 83.37, time: 2900, note: '83.37，但要 2900 秒重训练。', color: ZQ.blue },
  ptq: { name: 'PTQ', acc: 77.41, time: 6, note: '77.41，6 秒但掉 6.5 分。', color: ZQ.red },
  zq: { name: 'ZeroQuant', acc: 83.75, time: 0.01, note: '83.75，0 秒，接近 FP16 83.95。', color: ZQ.green },
};

export const M9Compare: React.FC<WidgetProps> = () => {
  const [m, setM] = useState<M | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const d = m ? DATA[m] : null;

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    (['qat', 'ptq', 'zq'] as M[]).forEach((k, i) => {
      const active = m === k;
      const y = 64 + i * 62;
      ctx.strokeStyle = active ? DATA[k].color : ZQ.border;
      ctx.lineWidth = active ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(600, y);
      ctx.stroke();
      drawSceneLabel(ctx, 70, y - 10, DATA[k].name, active ? DATA[k].color : ZQ.ink, 13);
    });
    if (d) {
      drawBar(ctx, 660, 70, 340, 20, d.acc / 100, d.color);
      drawBar(ctx, 660, 130, 340, 20, Math.min(1, d.time / 3000), d.color);
      drawSceneLabel(ctx, 660, 60, `精度 ${d.acc}`, ZQ.ink, 12);
      drawSceneLabel(ctx, 660, 120, `时间 ${d.time < 1 ? '<1' : d.time}s`, ZQ.ink, 12);
    }
    drawSceneLabel(ctx, 70, 250, d ? d.note : '点一条路线，比较精度与成本。', d ? d.color : ZQ.muted, 13);
  }, W, H);

  const onClick = (clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    setM(y < 95 ? 'qat' : y < 157 ? 'ptq' : 'zq');
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientY)}>
        <canvas id="cv-m9-compare" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${m === 'qat' ? 'selected' : ''}`} onClick={() => setM('qat')}>
          QAT
        </button>
        <button className={`chip ${m === 'ptq' ? 'selected' : ''}`} onClick={() => setM('ptq')}>
          PTQ
        </button>
        <button className={`chip ${m === 'zq' ? 'selected' : ''}`} onClick={() => setM('zq')}>
          ZeroQuant
        </button>
      </div>
      <div className={`feedback ${m === 'ptq' ? 'bad' : m ? 'good' : ''}`}>{d ? d.note : '点一条路线，比较精度与成本。'}</div>
    </div>
  );
};

export default M9Compare;
