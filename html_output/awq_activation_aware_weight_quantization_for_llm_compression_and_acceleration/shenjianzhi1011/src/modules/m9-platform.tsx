import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;

type Plat = 'a100' | '4090' | 'orin' | '4070' | 'pi';
const PLATS: { id: Plat; label: string; tps: number; note: string }[] = [
  { id: 'a100', label: 'A100', tps: 155.3, note: 'VILA-7B AWQ' },
  { id: '4090', label: 'RTX 4090', tps: 168.1, note: 'VILA-7B AWQ' },
  { id: 'orin', label: 'Jetson Orin', tps: 35.6, note: 'VILA-7B AWQ（64GB 可跑 70B）' },
  { id: '4070', label: 'RTX 4070', tps: 33, note: 'Llama-2-13B，仅 8GB 显存' },
  { id: 'pi', label: '树莓派 4B', tps: 0.7, note: '7B 模型，0.7 tokens/s' },
];

export const M9Platform: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<Plat | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    PLATS.forEach((p, i) => {
      const cx = 110 + i * 200;
      const active = sel === p.id;
      ctx.fillStyle = active ? AQ.green : AQ.card;
      ctx.strokeStyle = active ? AQ.green : AQ.blue;
      ctx.lineWidth = active ? 3 : 2;
      ctx.fillRect(cx - 44, 60, 88, 60);
      ctx.strokeRect(cx - 44, 60, 88, 60);
      drawSceneLabel(ctx, cx, 95, p.label, active ? '#fff' : AQ.ink, 13, 'center');
    });
    const cur = PLATS.find((p) => p.id === sel);
    drawBar(ctx, 110, 180, 800, 26, cur ? Math.min(1, cur.tps / 170) : 0, cur ? AQ.green : AQ.border);
    drawSceneLabel(ctx, 110, 170, cur ? `${cur.tps} tokens/s` : '点一台设备', cur ? AQ.green : AQ.muted, 14);
  }, W, H);

  const onCanvasClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 110) / 200);
    if (i >= 0 && i < PLATS.length) setSel(PLATS[i].id);
  };

  const cur = PLATS.find((p) => p.id === sel) || null;
  const text = cur ? `${cur.label}：${cur.tps} tokens/s；${cur.note}。` : '点一台设备，看它能跑多快。';

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientX)}>
        <canvas id="cv-m9-platform" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {PLATS.map((p) => (
          <button key={p.id} className={`chip ${sel === p.id ? 'selected' : ''}`} onClick={() => setSel(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${cur ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M9Platform;
