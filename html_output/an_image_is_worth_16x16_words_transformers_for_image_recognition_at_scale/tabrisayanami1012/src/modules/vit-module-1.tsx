import React, { useRef, useState } from 'react';
import { clearScene, drawLabel, drawPaper, Feedback, palette, roundRect, useDrawing } from './vit-kit';

export const Widget1: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'local' | 'global'>('local');
  const reachable = mode === 'local' ? 9 : 49;

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    drawPaper(ctx, 65, 12, 310, 253);

    const gridX = 108;
    const gridY = 27;
    const step = 32;
    // The collage stays unchanged. Only the access mask changes with mode.
    ctx.fillStyle = palette.light;
    ctx.fillRect(gridX, gridY, 222, 222);
    ctx.fillStyle = palette.orange;
    ctx.beginPath();
    ctx.moveTo(gridX + 36, gridY + 108);
    ctx.lineTo(gridX + 112, gridY + 39);
    ctx.lineTo(gridX + 186, gridY + 108);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.support;
    ctx.fillRect(gridX + 59, gridY + 108, 108, 91);
    ctx.fillStyle = palette.blue;
    ctx.fillRect(gridX + 105, gridY + 149, 30, 50);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(gridX + 72, gridY + 126, 24, 24);

    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const active = mode === 'global' || (Math.abs(row - 3) <= 1 && Math.abs(col - 3) <= 1);
        const x = gridX + col * step;
        const y = gridY + row * step;
        ctx.fillStyle = active ? 'rgba(34,141,92,0.19)' : 'rgba(245,248,240,0.82)';
        ctx.fillRect(x, y, 30, 30);
        ctx.strokeStyle = active ? palette.green : palette.border;
        ctx.lineWidth = active ? 1.8 : 1;
        ctx.strokeRect(x, y, 30, 30);
      }
    }
    ctx.strokeStyle = palette.orange;
    ctx.lineWidth = 4;
    ctx.strokeRect(gridX + 3 * step - 2, gridY + 3 * step - 2, 34, 34);

    const trackX = 510;
    const trackWidth = 430;
    for (const [index, count] of [9, 49].entries()) {
      const y = 73 + index * 108;
      const selected = (index === 0 && mode === 'local') || (index === 1 && mode === 'global');
      roundRect(ctx, trackX, y, trackWidth, 31, 8, palette.border);
      roundRect(ctx, trackX, y, trackWidth * count / 49, 31, 8, selected ? palette.blue : palette.light);
      if (selected) {
        ctx.strokeStyle = palette.orange;
        ctx.lineWidth = 3;
        ctx.strokeRect(trackX - 5, y - 5, trackWidth + 10, 41);
      }
      drawLabel(ctx, index === 0 ? '局部' : '全局', trackX, y - 15, palette.text);
      ctx.fillStyle = palette.text;
      ctx.font = '600 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(count), trackX + trackWidth + 22, y + 24);
    }
  });

  const feedback = mode === 'local'
    ? '这一步只参考中央格附近的3×3＝9个位置（含自身），不是整张49格的房屋画。但再多做几层局部组合，远处的信息也能逐步传过来；这就是为什么不能说CNN永远看不到屋顶另一边。'
    : '全局注意力：中央格本次可以连接全部 49 个位置。可以连接不等于已经学会有用关系，也不等于准确率更高；是否学好仍与数据和训练有关。';

  return (
    <div data-mode="hybrid" data-patterns="P4" onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <div className="chip-row" role="group" aria-label="选择单层连接方式">
        <button type="button" className={`chip${mode === 'local' ? ' selected' : ''}`} aria-pressed={mode === 'local'} onClick={() => setMode('local')}>单层局部窗口</button>
        <button type="button" className={`chip${mode === 'global' ? ' selected' : ''}`} aria-pressed={mode === 'global'} onClick={() => setMode('global')}>单层全局注意力</button>
      </div>
      <canvas ref={canvasRef} width={1080} height={280} aria-label={`7乘7图块的一次连接范围示意：${mode === 'local' ? '局部窗口' : '全局注意力'}，可连接${reachable}个位置，橙框为固定中央格。右侧两条共用49上限。`} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <Feedback>{feedback}</Feedback>
    </div>
  );
};
