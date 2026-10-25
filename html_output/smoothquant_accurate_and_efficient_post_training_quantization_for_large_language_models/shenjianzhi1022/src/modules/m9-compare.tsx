import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Scene = 'context' | 'gen';

export const M9Compare: React.FC<WidgetProps> = () => {
  const [scene, setScene] = useState<Scene | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // two routes
    ctx.strokeStyle = scene === 'context' ? SQ.orange : SQ.blue;
    ctx.lineWidth = scene === 'context' ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 90);
    ctx.lineTo(980, 90);
    ctx.stroke();
    ctx.strokeStyle = scene === 'gen' ? SQ.orange : SQ.blue;
    ctx.lineWidth = scene === 'gen' ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 170);
    ctx.lineTo(980, 170);
    ctx.stroke();
    drawSceneLabel(ctx, 80, 78, '上下文 / 批量：W8A8 强项', scene === 'context' ? SQ.orange : SQ.ink, 13);
    drawSceneLabel(ctx, 80, 158, 'batch-1 生成：权重量化强项', scene === 'gen' ? SQ.orange : SQ.ink, 13);
    drawBar(ctx, 80, 110, 900, 14, scene === 'context' ? 0.9 : 0.3, SQ.green);
    drawBar(ctx, 80, 190, 900, 14, scene === 'gen' ? 0.85 : 0.3, SQ.purple);
    drawLegend(ctx, 80, 250, [
      { label: 'W8A8', color: SQ.green },
      { label: '权重量化', color: SQ.purple },
    ]);
  }, W, H);

  const onCanvasClick = (clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    setScene(y < 130 ? 'context' : 'gen');
  };

  const text =
    scene === 'context'
      ? '批量/上下文：W8A8 用 INT8 GEMM，吞吐收益大。'
      : scene === 'gen'
      ? 'batch-1 生成：权重量化省访存；两者可组合。'
      : '点一条路线，看看哪种量化更适合。';

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientY)}>
        <canvas id="cv-m9-compare" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        <button className={`chip ${scene === 'context' ? 'selected' : ''}`} onClick={() => setScene('context')}>
          上下文/批量
        </button>
        <button className={`chip ${scene === 'gen' ? 'selected' : ''}`} onClick={() => setScene('gen')}>
          单序列生成
        </button>
      </div>
      <div className={`feedback ${scene ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M9Compare;
