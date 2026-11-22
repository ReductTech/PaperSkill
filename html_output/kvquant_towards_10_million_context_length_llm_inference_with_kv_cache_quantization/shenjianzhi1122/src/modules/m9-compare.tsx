import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type M = 'kivi' | 'atom' | 'kvq';
const DATA: Record<M, { name: string; bits: number; ppl: number; note: string; color: string }> = {
  kivi: { name: 'KIVI', bits: 3.05, ppl: 0, note: '2bit + 局部残差，平均约 3bit；长上下文检索偏弱。', color: KQ.blue },
  atom: { name: 'Atom/FlexGen', bits: 3, ppl: 6.05, note: '3bit 均匀/分组，7B 约 5.93-6.17。', color: KQ.orange },
  kvq: { name: 'KVQuant', bits: 3.33, ppl: 5.75, note: '3bit-1% 5.75，掉点 <0.1。', color: KQ.green },
};

export const M9Compare: React.FC<WidgetProps> = () => {
  const [m, setM] = useState<M | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const d = m ? DATA[m] : null;

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    (['kivi', 'atom', 'kvq'] as M[]).forEach((k, i) => {
      const active = m === k;
      const y = 64 + i * 62;
      ctx.strokeStyle = active ? DATA[k].color : KQ.border;
      ctx.lineWidth = active ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(600, y);
      ctx.stroke();
      drawSceneLabel(ctx, 70, y - 10, DATA[k].name, active ? DATA[k].color : KQ.ink, 13);
    });
    if (d) {
      drawBar(ctx, 660, 80, 340, 22, 8 / d.bits, d.color);
      drawSceneLabel(ctx, 660, 70, `${d.bits.toFixed(2)}bit`, KQ.ink, 13);
      if (d.ppl > 0) {
        drawBar(ctx, 660, 140, 340, 22, 5.68 / d.ppl, KQ.green);
        drawSceneLabel(ctx, 660, 130, `PPL ${d.ppl}`, KQ.ink, 12);
      }
    }
    drawSceneLabel(ctx, 70, 250, d ? d.note : '点一条路线，比较比特与精度。', d ? d.color : KQ.muted, 13);
  }, W, H);

  const onClick = (clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    setM(y < 95 ? 'kivi' : y < 157 ? 'atom' : 'kvq');
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientY)}>
        <canvas id="cv-m9-compare" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${m === 'kivi' ? 'selected' : ''}`} onClick={() => setM('kivi')}>
          KIVI
        </button>
        <button className={`chip ${m === 'atom' ? 'selected' : ''}`} onClick={() => setM('atom')}>
          Atom/FlexGen
        </button>
        <button className={`chip ${m === 'kvq' ? 'selected' : ''}`} onClick={() => setM('kvq')}>
          KVQuant
        </button>
      </div>
      <div className={`feedback ${m === 'kvq' ? 'good' : ''}`}>{d ? d.note : '点一条路线，比较比特与精度。'}</div>
    </div>
  );
};

export default M9Compare;
