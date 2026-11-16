import { useEffect, useRef, useState } from 'react';
import { Stage, bench, colors, rounded } from './paper-canvas';
import { dotPatch, drawPatch, patchAtoms, patchValues, squaredError } from './atom-coding';

const atoms = [patchAtoms[1], patchAtoms[0], patchAtoms[2], patchAtoms[3]];
const observed = [[.45, .50, 0, 0], [.48, 0, .51, 0], [.50, 0, 0, -.52]]
  .map(coefficients => patchValues(coefficients, atoms));
const clean = [[.45, 0, 0, 0], [.48, 0, 0, 0], [.50, 0, 0, 0]]
  .map(coefficients => patchValues(coefficients, atoms));

function trace(supports: number[][]) {
  const coefficients = observed.map((patch, patchIndex) =>
    atoms.map((atom, atomIndex) => supports[patchIndex].includes(atomIndex) ? dotPatch(patch, atom) : 0),
  );
  const blocks = coefficients.map(column => patchValues(column, atoms));
  const residuals = observed.map((patch, patchIndex) =>
    patch.map((value, pixelIndex) => value - blocks[patchIndex][pixelIndex]),
  );
  const cleanError = clean.reduce((sum, block, index) => sum + squaredError(block, blocks[index]), 0);
  const observedError = observed.reduce((sum, block, index) => sum + squaredError(block, blocks[index]), 0);
  return {
    supports, coefficients, blocks, residuals, cleanError, observedError,
    activeRows: new Set(supports.flat()),
  };
}

function strongest(scores: number[], support: number[]) {
  let selected = -1;
  scores.forEach((score, index) => {
    if (!support.includes(index) && (selected === -1 || score > scores[selected])) {
      selected = index;
    }
  });
  return selected;
}

type Trace = ReturnType<typeof trace>;

function pursue(previous: Trace, jointly: boolean) {
  const scores = previous.residuals.map(residual => atoms.map(atom => Math.abs(dotPatch(residual, atom))));
  if (jointly) {
    const totals = atoms.map((_, atomIndex) => scores.reduce((sum, patch) => sum + patch[atomIndex], 0));
    const shared = [...previous.supports[0], strongest(totals, previous.supports[0])];
    return trace(previous.supports.map(() => shared));
  }
  return trace(previous.supports.map((support, index) => [...support, strongest(scores[index], support)]));
}

function buildTrace(jointly: boolean) {
  const initial = trace(observed.map(() => []));
  const first = pursue(initial, jointly);
  return [initial, first, pursue(first, jointly)];
}

const separate = buildTrace(false);
const shared = buildTrace(true);
const phases = [
  { value: 0, label: '输入' },
  { value: 1, label: '第 1 轮' },
  { value: 2, label: '第 2 轮' },
] as const;
const firstSharedCoefficients = shared[1].coefficients.map(column => column[0]);
const firstSharedScore = firstSharedCoefficients.reduce((sum, value) => sum + Math.abs(value), 0);
const notes = [
  '两侧从相同的三块含噪图块出发。三块都含有 1 号原子代表的左右纹，也各自带有不同的干扰。',
  `独立编码给每块单独打分，图块 1 到 3 分别选中第 2、3、4 行。联合编码共同选中总分最高的第 1 行（${firstSharedScore.toFixed(2)}），三块各自的系数为 ${firstSharedCoefficients.map(value => value.toFixed(2)).join('、')}。`,
  '联合编码又选入第 4 行，只有第 3 块在这一行的系数非零。第 4 行带入了干扰，含噪输入的残差下降，干净参考的误差随之上升。',
];

export function SharedCoding() {
  const [phase, setPhase] = useState<(typeof phases)[number]['value']>(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);

  function selectPhase(nextPhase: typeof phase) {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
    setRunning(false);
    setPhase(nextPhase);
  }

  function start() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    selectPhase(reduceMotion ? 2 : 0);
    if (reduceMotion) return;
    setRunning(true);
    timers.current = [
      window.setTimeout(() => setPhase(1), 650),
      window.setTimeout(() => selectPhase(2), 1450),
    ];
  }

  const independent = separate[phase];
  const joint = shared[phase];

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    bench(ctx, width, height);
    ([independent, joint] as const).forEach((result, side) => {
      const x = side === 0 ? 26 : 332;
      const prior = (side === 0 ? separate : shared)[Math.max(0, phase - 1)];
      const label = side === 0 ? '独立编码' : '联合编码';
      const columnCenters = [x + 86, x + 159, x + 232];
      rounded(ctx, x, 25, 282, 210, 10, colors.paper, colors.light);
      ctx.fillStyle = colors.ink;
      ctx.textAlign = 'left';
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillText(label, x + 14, 48);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = 'right';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(phase === 0 ? '含噪输入' : '重建图块', x + 268, 48);

      const displayBlocks = phase === 0 ? observed : result.blocks;
      displayBlocks.forEach((patch, column) => {
        const center = columnCenters[column];
        ctx.fillStyle = colors.ink;
        ctx.textAlign = 'center';
        ctx.fillText(`图块 ${column + 1}`, center, 70);
        drawPatch(ctx, center - 27, 77, 54, patch.map(value => 0.5 + value));
      });

      atoms.forEach((_, row) => {
        const top = 142 + row * 21;
        const active = result.activeRows.has(row);
        if (active) {
          rounded(ctx, x + 11, top, 260, 18, 4, colors.bg,
            prior.activeRows.has(row) ? colors.line : colors.orange,
          );
        }
        ctx.fillStyle = active ? colors.ink : colors.muted;
        ctx.fillText(`原子 ${row + 1}`, x + 34, top + 13);
        result.coefficients.forEach((column, columnIndex) => {
          const value = column[row];
          const center = columnCenters[columnIndex];
          rounded(ctx, center - 27, top + 3, 54, 12, 3, '#ffffff', colors.line);
          ctx.fillStyle = colors.muted;
          ctx.fillRect(center, top + 5, 1, 8);
          if (Math.abs(value) > 1e-8) {
            const extent = value * 47;
            const stroke = side === 1
              ? row === 0 ? colors.green : colors.orange
              : phase === 1 ? colors.red : colors.blue;
            rounded(ctx, Math.min(center, center + extent), top + 6, Math.abs(extent), 6, 3, stroke);
          }
        });
      });
    });
  }

  return (
    <Stage label="同一组图块的独立编码和联合编码。系数矩阵的每行是一个原子，每列是一个图块。"
      height={262} draw={draw}
      feedback={notes[phase]} tone={phase === 1 ? 'good' : 'neutral'}>
      <div className="chip-row" role="group" aria-label="编码演示阶段" style={{ marginBottom: 0 }}>
        {phases.map(({ value, label }) => (
          <button key={value} type="button" className={phase === value ? 'chip selected' : 'chip'}
            aria-pressed={phase === value} onClick={() => selectPhase(value)}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" className="chip" onClick={start} disabled={running}>
        {running ? '自动播放中' : '自动播放'}
      </button>
      <div aria-live="polite" style={{ flexBasis: '100%', lineHeight: 1.55 }}>
        <b>{phases[phase].label}</b>　独立启用 {independent.activeRows.size} 行，联合启用 {joint.activeRows.size} 行
        <br />
        <span>对干净块的平方误差　独立 {independent.cleanError.toFixed(4)}，联合 {joint.cleanError.toFixed(4)}</span>
        <br />
        <span>对含噪块的平方残差　独立 {independent.observedError.toFixed(4)}，联合 {joint.observedError.toFixed(4)}</span>
      </div>
    </Stage>
  );
}
