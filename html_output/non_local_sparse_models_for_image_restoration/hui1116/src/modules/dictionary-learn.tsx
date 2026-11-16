import { useState } from 'react';
import { drawPatch, patchAtoms } from './atom-coding';
import { Stage, bench, colors, rounded } from './paper-canvas';

const initialAtom = patchAtoms[2];
const imagePatches = [
  [.31, -.28, .35, -.33],
  [.38, -.41, .36, -.35],
  [.43, -.39, .40, -.43],
];
const coefficients = [.60, .75, .82];

// With one unit-norm atom and fixed coefficients, the least-squares update
// points in the direction of the coefficient-weighted sum of the patches.
const weightedSum = initialAtom.map((_, pixel) =>
  imagePatches.reduce((total, patch, index) => total + coefficients[index] * patch[pixel], 0),
);
const norm = Math.hypot(...weightedSum);
const adaptedAtom = weightedSum.map(value => value / norm);

const modes = [
  { name: 'SC', adapts: false, psnr: 25.83, coding: '每块独立选原子。' },
  { name: 'LSC', adapts: true, psnr: 26.18, coding: '每块仍独立选原子。' },
  { name: 'LSSC', adapts: true, psnr: 26.57, coding: '相似块共同选原子，再各自估计系数。' },
];

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, heading = false) {
  ctx.font = heading ? '700 17px system-ui, sans-serif' : '500 14px system-ui, sans-serif';
  ctx.fillStyle = heading ? colors.ink : colors.muted;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

export function DictionaryLearn() {
  const [mode, setMode] = useState(0);
  const active = modes[mode];
  const displayedAtom = active.adapts ? adaptedAtom : initialAtom;
  const orientation = active.adapts ? '左亮右暗' : '上亮下暗';
  const update = active.adapts ? '用图块更新原子' : '沿用离线原子';

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    bench(ctx, width, height);
    rounded(ctx, 22, 16, 164, 153, 9, colors.paper, colors.line);
    rounded(ctx, 219, 16, 202, 153, 9, colors.paper, active.adapts ? colors.blue : colors.line);
    rounded(ctx, 454, 16, 164, 153, 9, colors.paper, active.adapts ? colors.green : colors.line);

    label(ctx, '离线原子', 104, 44, true);
    drawPatch(ctx, 69, 55, 70, initialAtom.map(value => 0.5 + value * 0.8));
    label(ctx, '上亮下暗', 104, 148);

    label(ctx, '当前图像的图块', 320, 44, true);
    imagePatches.forEach((patch, index) => {
      const x = 240 + index * 55;
      drawPatch(ctx, x, 65, 50, patch.map(value => 0.5 + value));
      label(ctx, coefficients[index].toFixed(2), x + 25, 136);
    });
    label(ctx, '固定系数', 320, 155);

    if (active.adapts) {
      ctx.beginPath();
      ctx.moveTo(425, 91);
      ctx.lineTo(448, 91);
      ctx.lineTo(441, 85);
      ctx.moveTo(448, 91);
      ctx.lineTo(441, 97);
      ctx.strokeStyle = colors.blue;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    label(ctx, '用于编码的原子', 536, 44, true);
    drawPatch(ctx, 501, 55, 70, displayedAtom.map(value => 0.5 + value * 0.8),
      active.adapts ? colors.green : colors.light);
    label(ctx, orientation, 536, 148);
  }

  return (
    <div className="paper-experiment">
      <Stage label={`离线原子上亮下暗，当前图块左亮右暗。${active.name} 用于编码的原子${orientation}。`}
        draw={draw} height={195} feedback={`${active.name} ${update}。${active.coding}`}
        tone={active.adapts ? 'good' : 'neutral'}>
        <div className="chip-row" role="group" aria-label="字典与编码设置" style={{ marginBottom: 0 }}>
          {modes.map((item, index) => (
            <button key={item.name} type="button" className={`chip${mode === index ? ' selected' : ''}`}
              aria-pressed={mode === index} onClick={() => setMode(index)}>
              {item.name}
            </button>
          ))}
        </div>
      </Stage>
      <table className="paper-metrics">
        <caption>论文表 2 · 12 张图的平均 PSNR（dB），高斯白噪声 σ = 50</caption>
        <thead><tr>{modes.map(item => <th key={item.name} scope="col">{item.name}</th>)}</tr></thead>
        <tbody><tr>{modes.map((item, index) => (
          <td key={item.name} className={index === mode ? 'paper-emphasis' : undefined}>
            {item.psnr.toFixed(2)}
          </td>
        ))}</tr></tbody>
      </table>
      <p className="paper-experiment-note">演示里的 LSC 和 LSSC 显示同一次原子更新。论文的 LSSC 在字典适配和最终编码时都利用了相似组。</p>
    </div>
  );
}
