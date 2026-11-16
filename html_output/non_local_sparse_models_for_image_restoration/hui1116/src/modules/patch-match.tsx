import { useState } from 'react';
import { Stage, colors } from './paper-canvas';

const reference = [0, 0, 4, 0, 0, 4, 0, 0, 4];
const candidates = [
  { label: '近处横纹', cells: [0, 0, 0, 0, 0, 0, 4, 4, 4], x: 175, description: '这块离得最近，条纹方向却不同。' },
  { label: '中间弱纹', cells: [0, 0, 2, 0, 0, 2, 0, 0, 2], x: 326, description: '方向一致，亮度仍有差异。' },
  { label: '远处竖纹', cells: [0, 1, 4, 0, 0, 4, 0, 0, 4], x: 479, description: '远处这块也在搜索窗里。' },
];
const threshold = 9;
const candidateY = 43;
const candidateSize = 78;
const shades = ['#f1eee1', '#dce6d0', '#b8c9a7', '#95ad85', '#6a8962'];

function drawPatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cells: number[],
  outline?: string,
) {
  ctx.fillStyle = colors.light;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 3, size, size, 7);
  ctx.fill();
  ctx.fillStyle = colors.paper;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 7);
  ctx.fill();
  ctx.strokeStyle = outline ?? colors.dark;
  ctx.lineWidth = outline ? 2.5 : 1;
  ctx.stroke();
  const cellSize = (size - 14) / 3;
  cells.forEach((value, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    ctx.fillStyle = shades[value];
    ctx.fillRect(x + 7 + column * cellSize, y + 7 + row * cellSize, cellSize - 1, cellSize - 1);
  });
}

export function PatchMatch() {
  const [selection, setSelection] = useState(0);
  const candidate = candidates[selection];
  const distance = reference.reduce((total, value, index) => total + (value - candidate.cells[index]) ** 2, 0);
  const withinThreshold = distance <= threshold;
  const statusColor = withinThreshold ? colors.green : colors.red;
  const feedback = candidate.description + '平方距离是 ' + distance
    + (withinThreshold ? '，符合入组阈值 ' : '，高于入组阈值 ') + threshold + '。';

  function pick(x: number, y: number) {
    if (y < candidateY || y > candidateY + candidateSize) return;
    const index = candidates.findIndex((item) => x >= item.x && x <= item.x + candidateSize);
    if (index >= 0) setSelection(index);
  }

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = colors.dark;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.roundRect(154, 28, 446, 113, 12);
    ctx.stroke();
    ctx.setLineDash([]);

    drawPatch(ctx, 32, 37, 94, reference, colors.blue);
    candidates.forEach((item, index) => {
      drawPatch(ctx, item.x, candidateY, candidateSize, item.cells, index === selection ? statusColor : undefined);
    });

    const x = 36;
    const length = 568;
    const current = x + distance / 64 * length;
    const cutoff = x + threshold / 64 * length;
    ctx.fillStyle = colors.light;
    ctx.fillRect(x, 192, length, 9);
    ctx.fillStyle = statusColor;
    ctx.fillRect(x, 192, current - x, 9);
    ctx.fillStyle = colors.blue;
    ctx.fillRect(cutoff - 1, 184, 2, 24);
    ctx.fillStyle = colors.orange;
    ctx.beginPath();
    ctx.arc(current, 196.5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.ink;
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('参照砖', 79, 154);
    ctx.textAlign = 'left';
    ctx.fillText('平方距离', x, 182);
  }

  return (
    <Stage label="参照砖与三个候选图像块的距离" draw={draw} feedback={feedback} tone={withinThreshold ? 'good' : 'bad'} onPick={pick}>
      {candidates.map((option, index) => (
        <button
          className={selection === index ? 'chip selected' : 'chip'}
          type="button"
          key={option.label}
          aria-pressed={selection === index}
          onClick={() => setSelection(index)}
        >
          {option.label}
        </button>
      ))}
    </Stage>
  );
}
