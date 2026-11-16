import { useState } from 'react';
import { Stage, colors } from './paper-canvas';

type Rgb = [number, number, number];

const tile: Rgb[] = [
  [151, 181, 196], [163, 178, 182], [173, 168, 133], [181, 165, 119],
  [147, 175, 190], [161, 170, 173], [177, 165, 125], [185, 161, 106],
  [152, 170, 183], [169, 165, 149], [184, 160, 110], [160, 172, 165],
  [160, 170, 161], [174, 163, 129], [144, 177, 181], [149, 179, 188],
];
const phases = ['Bayer 观测', '候选偏离观测', '符合观测的候选'];
const channelLetters = ['R', 'G', 'B'];
const edits = new Set([1, 6, 12]);

function channelAt(index: number) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  return row % 2 === 0 ? (col % 2 === 0 ? 1 : 0) : (col % 2 === 0 ? 2 : 1);
}

function rgb(values: Rgb) {
  return `rgb(${values.join(',')})`;
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 14, color = colors.ink, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.fillText(value, x, y);
}

export function MaskedRebuild() {
  const [step, setStep] = useState(0);
  const currentFeedback = [
    '16 个分量来自传感器，另外 32 个分量等待估计。',
    '三个已测分量偏离了观测，候选违反掩码约束。',
    '全部已测值都吻合。待估值仍由字典和相似块约束。',
  ][step];
  const tone = step === 0 ? 'neutral' : step === 1 ? 'bad' : 'good';

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, width, height);
    text(ctx, 'Bayer 观测', 34, 33, 16, colors.ink, 700);
    text(ctx, '重建候选', 235, 33, 16, colors.ink, 700);
    const cell = 36;

    tile.forEach((reference, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const c = channelAt(index);
      const candidates: Rgb = [...reference];
      const observed: Rgb = [225, 225, 225];
      observed[c] = Math.max(95, reference[c] - 35);
      observed[(c + 1) % 3] = Math.max(25, reference[c] - 105);
      observed[(c + 2) % 3] = Math.max(25, reference[c] - 105);
      if (step === 1 && edits.has(index)) candidates[c] += 18;

      const fromX = 34 + col * cell;
      const toX = 235 + col * cell;
      const y = 50 + row * cell;

      ctx.fillStyle = rgb(observed);
      ctx.fillRect(fromX, y, cell - 2, cell - 2);
      text(ctx, channelLetters[c], fromX + 12, y + 21, 13, '#ffffff', 700);

      ctx.fillStyle = step ? rgb(candidates) : colors.bg;
      ctx.fillRect(toX, y, cell - 2, cell - 2);
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(toX, y, cell - 2, cell - 2);
      if (!step) {
        ctx.beginPath();
        ctx.moveTo(toX + 7, y + cell - 8);
        ctx.lineTo(toX + cell - 8, y + 7);
        ctx.stroke();
      } else if (step === 2 || edits.has(index)) {
        ctx.strokeStyle = step === 2 ? colors.green : colors.red;
        ctx.lineWidth = 2;
        ctx.strokeRect(toX + 2, y + 2, cell - 6, cell - 6);
      }
    });

    text(ctx, '已测分量 16 / 48', 424, 69, 17, colors.blue, 700);
    text(ctx, '待估分量 32', 424, 103, 16, colors.muted);
    text(ctx, '观测残差平方和', 424, 146, 15, colors.ink, 700);
    const residual = step === 0 ? '尚无候选' : step === 1 ? String(edits.size * 18 ** 2) : '0';
    const accent = step === 0 ? colors.muted : step === 1 ? colors.red : colors.green;
    text(ctx, residual, 424, 183, step ? 27 : 15, accent, 700);
  }

  return (
    <Stage label="Bayer 采样、预置候选与对应的观测残差平方和" draw={draw} feedback={currentFeedback} tone={tone}>
      <button type="button" className="chip" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button>
      <span aria-live="polite">{step + 1} / 3 · {phases[step]}</span>
      <button type="button" className="chip" disabled={step === 2} onClick={() => setStep(step + 1)}>下一步</button>
    </Stage>
  );
}
