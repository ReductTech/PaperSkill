import { useMemo, useState } from 'react';
import { colors, rounded, Stage } from './paper-canvas';

const WIDTH = 48;
const HEIGHT = 32;
const PATCH = 6;
const READ_SD = 0.018;
const A = PATCH * PATCH;
const cells = Array.from({ length: A }, (_, i) => [i % PATCH, Math.floor(i / PATCH)]);
const regions = [
  { id: 'all', label: '全图', includes: () => true },
  { id: 'dark', label: '暗部', includes: (value: number) => value < .30 },
  { id: 'bright', label: '亮部', includes: (value: number) => value >= .55 },
] as const;

const atomRules: ((x: number, y: number) => number)[] = [
  (x) => x < 2 ? -1 : 1,
  (x) => x < 3 ? -1 : 1,
  (x) => x < 4 ? -1 : 1,
  (_, y) => y < 2 ? -1 : 1,
  (_, y) => y < 3 ? -1 : 1,
  (_, y) => y < 4 ? -1 : 1,
  (x, y) => x + y < 6 ? -1 : 1,
  (x, y) => x - y < 0 ? -1 : 1,
  (x) => x % 2 === 0 ? -1 : 1,
  (_, y) => y % 2 === 0 ? -1 : 1,
  (x, y) => (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? -1 : 1,
];

const atoms = atomRules.map(rule => {
  const values = cells.map(([x, y]) => rule(x, y));
  const mean = values.reduce((a, b) => a + b, 0) / A;
  const centered = values.map(v => v - mean);
  const norm = Math.hypot(...centered);
  return centered.map(v => v / norm);
});

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function cleanScene() {
  return Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
    const x = index % WIDTH;
    const y = Math.floor(index / WIDTH);
    const left = x < 23;
    const lintel = y < 8;
    const stripes = y < 25 && y % 6 >= 3;
    const tileTone = x % 8 < 2 && stripes ? .12 : 0;
    const arch = ((x - 32) / 10) ** 2 + ((y - 15) / 11) ** 2 < 1;
    const border = x === 21 || x === 22 || y === 25 || y === 26;
    const base = left ? .16 + tileTone : .53 + tileTone;
    const brightness = border ? .77 : lintel ? base * .65 : arch ? .81 : base;
    const channel = y % 2 === 0 ? (x % 2 === 0 ? .98 : 1) : (x % 2 === 0 ? 1 : .83);
    return clamp(brightness * channel);
  });
}

const clean = cleanScene();

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + .5) / 4294967296;
  };
}

function sample(photons: number) {
  const shot = seededRandom(701);
  const read = seededRandom(2009);
  return clean.map(value => {
    const limit = Math.exp(-value * photons);
    let product = shot();
    let count = 0;
    while (product > limit) {
      product *= shot();
      count += 1;
    }
    const gaussian = Math.sqrt(-2 * Math.log(read())) * Math.cos(2 * Math.PI * read());
    return count / photons + READ_SD * gaussian;
  });
}

function starts(length: number) {
  const positions: number[] = [];
  for (let s = 0; s < length - PATCH; s += 3) positions.push(s);
  positions.push(length - PATCH);
  return positions;
}

const X = starts(WIDTH / 2);
const Y = starts(HEIGHT / 2);

function makePatches(data: number[], planeX: number, planeY: number) {
  return Y.flatMap(startY => X.map(startX => {
    const pixels = cells.map(([x, y]) => ((startY + y) * 2 + planeY) * WIDTH + (startX + x) * 2 + planeX);
    const values = pixels.map(index => data[index]);
    const mean = values.reduce((total, value) => total + value, 0) / A;
    return { pixels, values, centered: values.map(value => value - mean) };
  }));
}

type Patch = ReturnType<typeof makePatches>[number];

function chooseSupport(ref: Patch, patches: Patch[]) {
  const matches = patches
    .filter(candidate => candidate !== ref)
    .map(candidate => ({
      patch: candidate,
      error: candidate.centered.reduce((total, value, i) => total + (value - ref.centered[i]) ** 2, 0),
    }))
    .sort((a, b) => a.error - b.error)
    .slice(0, 2)
    .map(match => match.patch);
  const group = [ref, ...matches];
  let bestIndex = 0;
  let bestScore = -1;
  for (const [index, atom] of atoms.entries()) {
    const score = group.reduce((total, patch) => {
      const coefficient = patch.centered.reduce((dot, value, i) => dot + value * atom[i], 0);
      return total + coefficient ** 2;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return atoms[bestIndex];
}

function rebuild(
  patches: { patch: Patch; atom: number[] }[],
  variance?: number[],
) {
  const totals = Array<number>(WIDTH * HEIGHT).fill(0);
  const visits = Array<number>(WIDTH * HEIGHT).fill(0);
  for (const { patch, atom } of patches) {
    let aa = 0;
    let ab = 0;
    let bb = 0;
    let ay = 0;
    let by = 0;
    patch.pixels.forEach((pixel, i) => {
      const weight = variance ? 1 / variance[pixel] : 1;
      aa += weight;
      ab += weight * atom[i];
      bb += weight * atom[i] ** 2;
      ay += weight * patch.values[i];
      by += weight * atom[i] * patch.values[i];
    });
    // Two-parameter weighted least squares for the constant and the selected atom.
    const determinant = aa * bb - ab * ab;
    const offset = (bb * ay - ab * by) / determinant;
    const coefficient = (aa * by - ab * ay) / determinant;
    patch.pixels.forEach((pixel, i) => {
      totals[pixel] += offset + coefficient * atom[i];
      visits[pixel] += 1;
    });
  }
  return totals.map((sum, index) => clamp(sum / visits[index]));
}

function assess(values: number[]) {
  const errors = values.map((value, index) => (value - clean[index]) ** 2);
  const rmse = regions.map(({ includes }) => {
    const selected = errors.filter((_, index) => includes(clean[index]));
    return Math.sqrt(selected.reduce((sum, value) => sum + value, 0) / selected.length);
  });
  return { psnr: -20 * Math.log10(rmse[0]), rmse };
}

function run(photons: number) {
  const input = sample(photons);
  const projections = [0, 1, 2, 3].flatMap(plane => {
    const patches = makePatches(input, plane % 2, Math.floor(plane / 2));
    return patches.map(patch => ({ patch, atom: chooseSupport(patch, patches) }));
  });
  const uniform = rebuild(projections);
  const variance = uniform.map(pilot => Math.max(.015, pilot) / photons + READ_SD ** 2);
  const adaptive = rebuild(projections, variance);
  return { input, uniform, adaptive, baseline: assess(input), first: assess(uniform), second: assess(adaptive) };
}

function drawMosaic(ctx: CanvasRenderingContext2D, values: number[], x: number, region: number) {
  const y = 46;
  const cell = 5;
  rounded(ctx, x - 4, y - 4, WIDTH * cell + 8, HEIGHT * cell + 8, 5, colors.paper, colors.line);
  values.forEach((value, index) => {
    const row = Math.floor(index / WIDTH);
    const col = index % WIDTH;
    const shade = Math.round(255 * value ** .64);
    const red = row % 2 === 0 && col % 2 === 0;
    const blue = row % 2 === 1 && col % 2 === 1;
    const tint = red ? [1, .88, .86] : blue ? [.88, .93, 1] : [.92, 1, .90];
    ctx.fillStyle = 'rgb(' + tint.map(factor => Math.round(factor * shade)).join(',') + ')';
    ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
    if (!regions[region].includes(clean[index])) {
      ctx.fillStyle = 'rgb(247 246 239 / 72%)';
      ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
    }
  });
}

export function RawTest() {
  const [photons, setPhotons] = useState(60);
  const [region, selectRegion] = useState(0);
  const { uniform, adaptive, baseline, first, second } = useMemo(() => run(photons), [photons]);
  const area = regions[region].label;
  const delta = first.rmse[region] - second.rmse[region];
  const comparison = delta > .0005 ? '方差加权的误差较低' : delta < -.0005 ? '等权拟合的误差较低' : '两种拟合的误差接近';
  const scores = [
    { method: '含噪输入', ...baseline },
    { method: '等权拟合', ...first },
    { method: '方差加权', ...second },
  ];
  return (
    <div className="paper-experiment">
      <Stage
        label={`同一合成 Bayer 样本的等权拟合与方差加权马赛克预览，当前突出${area}`}
        draw={(ctx, width, height) => {
          rounded(ctx, 0, 0, width, height, 10, colors.bg);
          ctx.textAlign = 'center';
          ctx.font = '600 20px system-ui';
          ctx.fillStyle = colors.ink;
          ctx.fillText('等权拟合', 174, 30);
          ctx.fillText('方差加权', 466, 30);
          drawMosaic(ctx, uniform, 54, region);
          drawMosaic(ctx, adaptive, 346, region);
        }}
        feedback={`当前样本的${area}中，${comparison}。加权效果取决于方差估计与图块结构。`}
        tone={delta > .0005 ? 'good' : 'neutral'}
      >
        <label htmlFor="raw-photons">光子数参数 λ <span className="val">{photons}</span></label>
        <input id="raw-photons" type="range" min={30} max={150} step={10} value={photons} onChange={event => setPhotons(Number(event.target.value))} />
        <div className="chip-row" role="group" aria-label="误差统计区域">
          {regions.map(({ id, label }, index) => (
            <button type="button" className={'chip' + (index === region ? ' selected' : '')} aria-pressed={index === region} key={id} onClick={() => selectRegion(index)}>
              {label}
            </button>
          ))}
        </div>
      </Stage>
      <table className="paper-metrics">
        <caption>合成 RAW 误差对照</caption>
        <thead><tr><th scope="col">方法</th><th scope="col">全图 PSNR<br />（dB ↑）</th><th scope="col">{area} RMSE<br />（↓）</th></tr></thead>
        <tbody>
          {scores.map(({ method, psnr, rmse }) => (
            <tr key={method}><th scope="row">{method}</th><td>{psnr.toFixed(2)}</td><td>{rmse[region].toFixed(3)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="paper-experiment-note">暗部和亮部按归一化真值划分，暗部低于 0.30，亮部至少为 0.55。切换区域只改变统计和高亮范围。</p>
    </div>
  );
}
