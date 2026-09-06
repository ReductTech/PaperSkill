import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clamp, clearDesk, drawGuideLine, drawManuscript, drawSceneLabel, drawTargetMark, Feedback, roundedRect } from './cascade-vs-unified';

export const NativeResolutionLens: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [focus, setFocus] = useState(.62); const [dragging, setDragging] = useState(false);
  const setFromX = (x: number) => setFocus(clamp((x - 74) / 410, 0, 1));
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 280); drawSceneLabel(ctx, '把观察窗拖到最需要清晰度的位置', 280, 24, PALETTE.ink, 'center');
    drawManuscript(ctx, 42, 45, 476, 162, PALETTE.blue);
    ctx.save(); ctx.fillStyle = 'rgba(39,68,110,.08)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { roundedRect(ctx, 64 + c * 61, 66 + r * 30, 48, 17, 3); ctx.fill(); } ctx.restore();
    const x = 74 + focus * 410; ctx.save(); ctx.strokeStyle = PALETTE.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, 126, 39, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(217,119,6,.10)'; ctx.fill(); ctx.restore();
    drawGuideLine(ctx, 74, 233, 484, 233, PALETTE.axis, 6); drawGuideLine(ctx, 74, 233, x, 233, PALETTE.orange, 6); drawTargetMark(ctx, x, 233, PALETTE.orange);
    drawSceneLabel(ctx, focus < .33 ? '细小文字' : focus < .67 ? '版面关系' : '密集表格', x, 270, PALETTE.orange, 'center');
  };
  const pointer = (x: number, _y: number, kind: 'down'|'move'|'up') => { if (kind === 'down') { setDragging(true); setFromX(x); } if (kind === 'move' && dragging) setFromX(x); if (kind === 'up') { setFromX(x); setDragging(false); } };
  return <div><PaperCanvas height={280} draw={draw} onPointer={pointer} ariaLabel={`${chapterId}-${moduleId} 原生分辨率观察窗`} />
    <div className="ctrl"><label style={{ display: 'grid', gap: 8 }}>观察位置<input type="range" min="0" max="100" value={Math.round(focus * 100)} onChange={(e) => setFocus(Number(e.target.value) / 100)} /></label></div>
    <Feedback>论文把最大输入图像分辨率从 2K 扩展到 4K，并保持原始长宽比与空间布局；自适应 MLP 再把高分辨率视觉特征压缩成紧凑 token。</Feedback></div>;
};

export default NativeResolutionLens;
