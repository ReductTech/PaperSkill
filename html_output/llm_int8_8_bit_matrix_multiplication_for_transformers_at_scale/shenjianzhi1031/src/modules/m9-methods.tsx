import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
type Method = 'llm' | 'smooth' | 'gptq';
const TEXT: Record<Method, string> = {
  llm: 'LLM.int8：W8A8 + 约 0.1% 的 16 位混合精度，保精度。',
  smooth: 'SmoothQuant：W8A8 纯 INT8，靠等价缩放把难度搬到权重。',
  gptq: 'GPTQ：只量化权重，面向 batch-1 生成。',
};
const COLOR: Record<Method, string> = { llm: LI.purple, smooth: LI.green, gptq: LI.blue };

export const M9Methods: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Method | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const routes: { id: Method; y: number; label: string }[] = [
      { id: 'llm', y: 70, label: 'W8A8 + 混合精度' },
      { id: 'smooth', y: 140, label: 'W8A8 纯 INT8' },
      { id: 'gptq', y: 210, label: '权重量化' },
    ];
    routes.forEach((r) => {
      const active = method === r.id;
      ctx.strokeStyle = active ? COLOR[r.id] : LI.border;
      ctx.lineWidth = active ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(70, r.y);
      ctx.lineTo(980, r.y);
      ctx.stroke();
      drawSceneLabel(ctx, 70, r.y - 12, r.label, active ? COLOR[r.id] : LI.ink, 13);
    });
    if (method) drawSceneLabel(ctx, 70, 258, TEXT[method], COLOR[method], 13);
    drawLegend(ctx, 800, 250, [
      { label: 'LLM.int8', color: LI.purple },
      { label: 'SmoothQuant', color: LI.green },
      { label: 'GPTQ', color: LI.blue },
    ]);
  }, W, H);

  const onCanvasClick = (clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    setMethod(y < 105 ? 'llm' : y < 175 ? 'smooth' : 'gptq');
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientY)}>
        <canvas id="cv-m9-methods" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${method === 'llm' ? 'selected' : ''}`} onClick={() => setMethod('llm')}>
          LLM.int8
        </button>
        <button className={`chip ${method === 'smooth' ? 'selected' : ''}`} onClick={() => setMethod('smooth')}>
          SmoothQuant
        </button>
        <button className={`chip ${method === 'gptq' ? 'selected' : ''}`} onClick={() => setMethod('gptq')}>
          GPTQ
        </button>
      </div>
      <div className={`feedback ${method ? 'good' : ''}`}>{method ? TEXT[method] : '点一条路线，看看方法的定位。'}</div>
    </div>
  );
};

export default M9Methods;
