import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Comp = 'linear' | 'bmm' | 'ln' | 'softmax' | 'relu' | 'residual';
const COMPS: { id: Comp; label: string; int8: boolean; note: string }[] = [
  { id: 'linear', label: 'Linear', int8: true, note: '计算密集，INT8 收益最大。' },
  { id: 'bmm', label: 'BMM', int8: true, note: '注意力里的批量矩阵乘，INT8 收益大。' },
  { id: 'ln', label: 'LayerNorm', int8: false, note: '轻量逐元素，FP16，量化收益小、风险大。' },
  { id: 'softmax', label: 'Softmax', int8: false, note: '轻量逐元素，FP16。' },
  { id: 'relu', label: 'ReLU', int8: false, note: '轻量逐元素，FP16。' },
  { id: 'residual', label: 'Residual', int8: false, note: '残差相加，FP16。' },
];

export const M8Map: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<Comp | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    COMPS.forEach((c, i) => {
      const cx = 130 + (i % 3) * 300;
      const cy = 90 + Math.floor(i / 3) * 110;
      const active = sel === c.id;
      ctx.fillStyle = c.int8 ? 'rgba(124,58,237,0.14)' : 'rgba(39,68,110,0.10)';
      ctx.strokeStyle = active ? SQ.orange : c.int8 ? SQ.purple : SQ.blue;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 30, cy + 52, c.label, active ? SQ.orange : SQ.ink, 12);
    });
    drawSceneLabel(ctx, 130, 40, 'Transformer Block', SQ.ink, 14);
    drawLegend(ctx, 700, 250, [
      { label: 'INT8', color: SQ.purple },
      { label: 'FP16', color: SQ.blue },
    ]);
  }, W, H);

  const onCanvasClick = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const i = Math.round((x - 130) / 300);
    const j = Math.floor((y - 90 + 34) / 110);
    const idx = j * 3 + i;
    if (i >= 0 && i < 3 && j >= 0 && j < 2 && idx >= 0 && idx < COMPS.length) setSel(COMPS[idx].id);
  };

  const cur = COMPS.find((c) => c.id === sel) || null;
  const text = cur ? `${cur.label}：${cur.note}` : '点一个组件，看看它用 INT8 还是 FP16。';

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientX, e.clientY)}>
        <canvas id="cv-m8-map" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {COMPS.map((c) => (
          <button key={c.id} className={`chip ${sel === c.id ? 'selected' : ''}`} onClick={() => setSel(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${sel ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M8Map;
