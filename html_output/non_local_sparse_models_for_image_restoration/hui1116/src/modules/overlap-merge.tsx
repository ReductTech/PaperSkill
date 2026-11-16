import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Stage, bench, colors, rounded } from './paper-canvas';
import { tileShade } from './atom-coding';

type Cell = { x: number; y: number };
const origin = { x: 36, y: 42 };
const columns = 5;
const rows = 4;
const step = 40;
const samples = [
  { name: '甲', x: 0, y: 0, shift: 0.12 },
  { name: '乙', x: 2, y: 0, shift: -0.10 },
  { name: '丙', x: 0, y: 1, shift: 0.04 },
  { name: '丁', x: 2, y: 1, shift: -0.02 },
  { name: '戊', x: 0, y: 0, shift: -0.04 },
];

function estimates({ x, y }: Cell) {
  const brightness = .18 + .10 * x + .06 * y + (x >= 3 ? .08 : 0);
  return samples.map(sample =>
    x >= sample.x && x < sample.x + 3 && y >= sample.y && y < sample.y + 3
      ? brightness + sample.shift : null,
  );
}

function aggregate(cell: Cell) {
  const readings = estimates(cell);
  const contributing = readings.filter((value): value is number => value !== null);
  const sum = contributing.reduce((total, value) => total + value, 0);
  return { readings, sum, count: contributing.length, average: sum / contributing.length };
}

const grid = Array.from({ length: rows }, (_, y) =>
  Array.from({ length: columns }, (_, x) => aggregate({ x, y }).average),
);

const directions = [
  { key: 'ArrowLeft', label: '左移一列', symbol: '←', x: -1, y: 0 },
  { key: 'ArrowUp', label: '上一行', symbol: '↑', x: 0, y: -1 },
  { key: 'ArrowDown', label: '下一行', symbol: '↓', x: 0, y: 1 },
  { key: 'ArrowRight', label: '右移一列', symbol: '→', x: 1, y: 0 },
];

export function OverlapMerge() {
  const [cell, setCell] = useState<Cell>({ x: 2, y: 1 });
  const draggingGrid = useRef(false);
  const { readings, sum, count, average } = aggregate(cell);
  const duplicate = readings[0] !== null && readings[4] !== null;

  function drag(x: number, y: number) {
    if (!draggingGrid.current) return;
    const nextX = Math.max(0, Math.min(columns - 1, Math.floor((x - origin.x) / step)));
    const nextY = Math.max(0, Math.min(rows - 1, Math.floor((y - origin.y) / step)));
    setCell(previous => previous.x === nextX && previous.y === nextY ? previous : { x: nextX, y: nextY });
  }

  function beginDrag(x: number, y: number) {
    draggingGrid.current = x >= origin.x && x < origin.x + columns * step
      && y >= origin.y && y < origin.y + rows * step;
  }

  function canMove(x: number, y: number) {
    return cell.x + x >= 0 && cell.x + x < columns && cell.y + y >= 0 && cell.y + y < rows;
  }

  function move(x: number, y: number) {
    if (canMove(x, y)) setCell({ x: cell.x + x, y: cell.y + y });
  }

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    const direction = directions.find(option => option.key === event.key);
    if (!direction) return;
    event.preventDefault();
    move(direction.x, direction.y);
  }

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    bench(ctx, width, height);
    rounded(ctx, 26, 16, 221, 194, 10, colors.paper, colors.light);
    rounded(ctx, 300, 16, 308, 194, 10, colors.paper, colors.light);

    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'left';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('回填位置', 38, 35);
    ctx.fillText('像素估计', 318, 35);

    grid.forEach((line, y) => line.forEach((value, x) => {
      ctx.fillStyle = tileShade(value);
      ctx.fillRect(origin.x + x * step + 1, origin.y + y * step + 1, step - 2, step - 2);
    }));

    samples.forEach((sample, index) => {
      const extraInset = index === 4 ? 7 : 2;
      const current = readings[index] !== null;
      ctx.strokeStyle = current ? colors.blue : colors.light;
      ctx.lineWidth = current ? 3 : 1;
      ctx.setLineDash(index === 4 ? [6, 4] : []);
      ctx.strokeRect(origin.x + sample.x * step + extraInset, origin.y + sample.y * step + extraInset,
        3 * step - 2 * extraInset, 3 * step - 2 * extraInset);
    });
    ctx.setLineDash([]);
    const currentX = origin.x + cell.x * step;
    const currentY = origin.y + cell.y * step;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(currentX + 3, currentY + 3, step - 6, step - 6);
    ctx.strokeStyle = colors.orange;
    ctx.lineWidth = 4;
    ctx.strokeRect(currentX, currentY, step, step);

    readings.forEach((value, index) => {
      const y = 49 + index * 29;
      rounded(ctx, 319, y, 121, 19, 4, value === null ? colors.bg : colors.light, colors.line);
      if (value !== null) {
        rounded(ctx, 319, y, value * 120, 19, 4, tileShade(value));
        ctx.strokeStyle = colors.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(447, y + 9.5);
        ctx.lineTo(491, 117);
        ctx.stroke();
      }
    });
    rounded(ctx, 502, 80, 75, 75, 9, colors.paper, colors.green);
    rounded(ctx, 508, 86, 63, 63, 4, tileShade(average));
  }

  const feedback = count === 1
    ? '这里只由一块覆盖，结果直接取这份估计。'
    : `这一格有 ${count} 份估计。相加后除以 ${count}，得到 ${average.toFixed(2)}。`;

  return (
    <Stage label="重叠块回填位置、当前像素的多份估计和平均值" draw={draw}
      feedback={feedback} tone={count === 1 ? 'neutral' : 'good'} onPick={beginDrag} onDrag={drag}>
      <div role="group" aria-label="移动当前像素" onKeyDown={keyboard}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {directions.map(({ key, label, symbol, x, y }) => (
          <button key={key} type="button" className="chip" aria-label={label}
            disabled={!canMove(x, y)} onClick={() => move(x, y)}>{symbol}</button>
        ))}
      </div>
      <div aria-live="polite" style={{ lineHeight: 1.55 }}>
        <b>第 {cell.x + 1} 列，第 {cell.y + 1} 行</b>　{count} 份估计
        <br />
        {readings.map((value, index) => value === null ? null : `${samples[index].name} ${value.toFixed(2)}`)
          .filter(Boolean).join('　')}
        <br />
        平均：{sum.toFixed(2)} ÷ {count} = {average.toFixed(2)}
        {duplicate && <><br />甲和戊是同一位置在两个不同相似组中的估计，分别计入。</>}
      </div>
    </Stage>
  );
}
