import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, Feedback } from './cascade-vs-unified';

export const DraftWeightCurve: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [position, setPosition] = useState(7); const gamma = 7; const weight = Math.exp(-(position - 1) / gamma);
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 300); const left = 66, top = 46, width = 430, height = 178;
    drawSceneLabel(ctx, '式 (1)：候选越远，损失权重按指数衰减', 280, 24, PALETTE.ink, 'center'); drawGuideLine(ctx, left, top + height, left + width, top + height, PALETTE.axis, 2); drawGuideLine(ctx, left, top, left, top + height, PALETTE.axis, 2);
    ctx.save(); ctx.strokeStyle = PALETTE.purple; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 1; k <= 15; k++) { const x = left + (k - 1) / 14 * width, y = top + height * (1 - Math.exp(-(k - 1) / gamma)); if (k === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); ctx.restore();
    const x = left + (position - 1) / 14 * width, y = top + height * (1 - weight); drawGuideLine(ctx, x, y, x, top + height, PALETTE.orange, 2); drawTargetMark(ctx, x, y, PALETTE.orange);
    drawSceneLabel(ctx, 'k=1', left, 247, PALETTE.muted, 'center'); drawSceneLabel(ctx, 'k=B−1=15', left + width, 247, PALETTE.muted, 'center'); drawSceneLabel(ctx, `k=${position}，wₖ=${weight.toFixed(3)}（γ=7）`, 280, 278, PALETTE.orange, 'center');
  };
  return <div><PaperCanvas height={300} draw={draw} ariaLabel={`${chapterId}-${moduleId} 草稿位置权重曲线`} />
    <div className="ctrl"><label style={{ display: 'grid', gap: 8 }}>有效候选位置 k<input type="range" min="1" max="15" value={position} onChange={(e) => setPosition(Number(e.target.value))} /></label></div>
    <Feedback>块大小 B=16，但式 (2) 对 k=1…B−1 求和；锚点与无效位置由指示函数排除。K=16 指每条序列随机采样的锚点数，不是横轴上限。</Feedback></div>;
};

export default DraftWeightCurve;
