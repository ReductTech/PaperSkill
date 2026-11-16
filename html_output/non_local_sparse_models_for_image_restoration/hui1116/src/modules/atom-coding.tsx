import { useState } from 'react';
import { Stage, bench, colors, rounded } from './paper-canvas';

export const patchAtoms = [
  [0.5, 0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5, 0.5],
];

export function patchValues(coefficients: number[], atoms: number[][] = patchAtoms) {
  return atoms[0].map((_, pixel) =>
    atoms.reduce((total, atom, index) => total + atom[pixel] * coefficients[index], 0),
  );
}

export function dotPatch(a: number[], b: number[]) {
  return a.reduce((total, value, index) => total + value * b[index], 0);
}

export function squaredError(a: number[], b: number[]) {
  return a.reduce((total, value, index) => total + (value - b[index]) ** 2, 0);
}

export function tileShade(value: number) {
  const shade = Math.round(34 + Math.max(0, Math.min(1, value)) * 198);
  return `rgb(${shade}, ${shade}, ${shade})`;
}

export function drawPatch(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  values: number[], border = colors.light,
) {
  rounded(ctx, x, y, size, size, 7, colors.paper, border);
  const inset = 4;
  const cell = (size - 2 * inset) / 2;
  values.forEach((value, index) => {
    ctx.fillStyle = tileShade(value);
    ctx.fillRect(x + inset + index % 2 * cell, y + inset + Math.floor(index / 2) * cell, cell, cell);
  });
}

const templates = [
  { name: '亮底', x: 36, y: 46 },
  { name: '左右纹', x: 138, y: 46 },
  { name: '上下纹', x: 36, y: 127 },
  { name: '交错纹', x: 138, y: 127 },
];
const observed = patchValues([0.56, 0.28, -0.18, 0.04]);
const tolerance = 0.05;

export function AtomCoding() {
  const [mask, setMask] = useState(0);
  const selected = (index: number) => (mask & (1 << index)) !== 0;
  const coefficients = patchAtoms.map((atom, index) => selected(index) ? dotPatch(observed, atom) : 0);
  const reconstruction = patchValues(coefficients);
  const residual = squaredError(observed, reconstruction);
  const count = coefficients.filter(value => value !== 0).length;
  const feasible = residual <= tolerance;
  const minimal = feasible && count === 2;

  function toggle(index: number) {
    setMask(previous => previous ^ (1 << index));
  }

  function pick(x: number, y: number) {
    const index = templates.findIndex(template =>
      x >= template.x && x <= template.x + 84 && y >= template.y && y <= template.y + 68,
    );
    if (index >= 0) toggle(index);
  }

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    bench(ctx, width, height);
    rounded(ctx, 24, 32, 211, 171, 10, colors.paper, colors.light);
    rounded(ctx, 485, 38, 126, 163, 9, '#fff', colors.line);
    const reconstructionColor = count === 0 ? colors.blue
      : !feasible ? colors.red : minimal ? colors.green : colors.orange;
    templates.forEach(({ x, y }, index) => {
      const active = selected(index);
      rounded(ctx, x, y, 84, 68, 6, active ? '#e5ecf5' : colors.bg, active ? colors.blue : colors.line);
      drawPatch(ctx, x + 17, y + 9, 50, patchAtoms[index].map(value => 0.5 + value * 0.72));
      if (active) {
        rounded(ctx, x + 66, y + 8, 10, 10, 4, colors.orange);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = colors.blue;
        ctx.strokeRect(x + 3, y + 3, 78, 62);
      }
    });
    drawPatch(ctx, 261, 71, 83, observed, colors.blue);
    drawPatch(ctx, 373, 71, 83, reconstruction, reconstructionColor);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'center';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('含噪块', 303, 57);
    ctx.fillText('重建块', 414, 57);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(543, 50);
    ctx.lineTo(543, 191);
    ctx.stroke();
    coefficients.forEach((value, index) => {
      const position = 65 + index * 36;
      const extent = value * 93;
      rounded(ctx, 494, position, 107, 10, 4, colors.bg);
      if (selected(index)) {
        rounded(ctx, Math.min(543, 543 + extent), position, Math.abs(extent), 10, 3, colors.blue);
        ctx.fillStyle = colors.orange;
        ctx.fillRect(541 + extent, position - 2, 4, 14);
      }
    });
  }

  const feedback = count === 0
    ? '试着选一枚模板，观察重建与含噪块的差距。'
    : !feasible
      ? '平方残差仍高于容差。试试换一枚原子，或增加一枚。'
      : minimal
        ? '两枚原子已满足容差。这是此例中原子数最少的可行组合。'
        : '误差已达标。试着去掉一枚原子，保留足够的拟合精度。';

  return (
    <Stage label="四枚纹样模板、含噪块、重建块与带符号系数" draw={draw}
      onPick={pick} feedback={feedback} tone={minimal ? 'good' : count > 0 && !feasible ? 'bad' : 'neutral'}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {templates.map(({ name }, index) => (
          <button key={name} type="button" className={selected(index) ? 'chip selected' : 'chip'}
            aria-pressed={selected(index)} onClick={() => toggle(index)}>{name}</button>
        ))}
      </div>
      <div aria-live="polite" style={{ lineHeight: 1.55 }}>
        <b>原子数 {count} / 4</b>　平方残差 {residual.toFixed(3)}　容差 0.050
        <br />
        系数：{coefficients.map((value, index) => `${templates[index].name} ${value.toFixed(2)}`).join('　')}
      </div>
    </Stage>
  );
}
