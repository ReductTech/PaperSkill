import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type M = 'smooth' | 'flex' | 'kivi';
const DATA: Record<M, { name: string; bits: number; note: string; color: string }> = {
  smooth: { name: 'SmoothQuant', bits: 8, note: '8bit 稳，4bit 以下明显掉。', color: KV.blue },
  flex: { name: 'FlexGen', bits: 4, note: '4bit 分组，K/V 同策略。', color: KV.orange },
  kivi: { name: 'KIVI', bits: 2, note: '2bit，K 按列、V 按行。', color: KV.green },
};

export const M9Compare: React.FC<WidgetProps> = () => {
  const [m, setM] = useState<M | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const d = m ? DATA[m] : null;

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    (['smooth', 'flex', 'kivi'] as M[]).forEach((k, i) => {
      const active = m === k;
      const y = 64 + i * 62;
      ctx.strokeStyle = active ? DATA[k].color : KV.border;
      ctx.lineWidth = active ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(600, y);
      ctx.stroke();
      drawSceneLabel(ctx, 70, y - 10, DATA[k].name, active ? DATA[k].color : KV.ink, 13);
    });
    if (d) {
      drawBar(ctx, 660, 80, 340, 22, 8 / d.bits, d.color);
      drawSceneLabel(ctx, 660, 70, `${d.bits}bit`, KV.ink, 13);
    }
    drawSceneLabel(ctx, 70, 250, d ? d.note : '点一条路线，比较压缩能力。', d ? d.color : KV.muted, 13);
  }, W, H);

  const onClick = (clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    setM(y < 95 ? 'smooth' : y < 157 ? 'flex' : 'kivi');
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientY)}>
        <canvas id="cv-m9-compare" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${m === 'smooth' ? 'selected' : ''}`} onClick={() => setM('smooth')}>
          SmoothQuant
        </button>
        <button className={`chip ${m === 'flex' ? 'selected' : ''}`} onClick={() => setM('flex')}>
          FlexGen
        </button>
        <button className={`chip ${m === 'kivi' ? 'selected' : ''}`} onClick={() => setM('kivi')}>
          KIVI
        </button>
      </div>
      <div className={`feedback ${m === 'kivi' ? 'good' : ''}`}>{d ? d.note : '点一条路线，比较压缩能力。'}</div>
    </div>
  );
};

export default M9Compare;
