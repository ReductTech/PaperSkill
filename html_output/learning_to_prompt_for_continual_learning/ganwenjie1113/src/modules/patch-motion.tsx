import { Sub, WeightedSum } from "./lesson-math";
import { useEffect, useMemo, useRef, useState } from "react";
import birdUrl from "./specimen.svg?inline";
import { PATCH_GRID, PATCH_SIZE } from "./specimen";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";

const CHANNELS = ["R", "G", "B"];
const COUNT = PATCH_SIZE * PATCH_SIZE * CHANNELS.length;
const ROUTE_START = 4880;
const ROUTE_DURATION = 2200;
const OUTPUT_START = ROUTE_START + ROUTE_DURATION;
const DURATION = OUTPUT_START + 1640;
const STOPS = [
  { at: 0, name: "分离 RGB 通道" },
  { at: 1350, name: "按索引展平" },
  { at: ROUTE_START, name: "应用线性投影" },
  { at: DURATION, name: "得到嵌入向量" },
];
const SAMPLE_WEIGHTS = [{ offset: 0, weight: .5 }, { offset: 1, weight: .3 }, { offset: 3, weight: .2 }];

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function blend(from: number, to: number, amount: number) { return from + (to - from) * amount; }

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
}

type Point = readonly [number, number];

function traceCurve(index: number, offset: number) {
  const x = 72 + index * 87;
  const lane = 49 + index * 8;
  const y = 98 + offset * 11;
  const segments: readonly (readonly [Point, Point, Point, Point])[] = [
    [[x, lane], [x + 44, lane], [268, lane - 4], [298, lane + 2]],
    [[298, lane + 2], [323, lane + 7], [328, y], [352, y]],
  ];
  let distance = 0;
  const samples = [{x, y: lane, distance}];
  for (const [a, b, c, d] of segments) {
    for (let i = 1; i <= 48; i++) {
      const t = i / 48;
      const px = cubic(a[0], b[0], c[0], d[0], t);
      const py = cubic(a[1], b[1], c[1], d[1], t);
      const prior = samples[samples.length - 1];
      distance += Math.hypot(px - prior.x, py - prior.y);
      samples.push({x: px, y: py, distance});
    }
  }
  return {segments, samples, distance};
}

const ROUTES = SAMPLE_WEIGHTS.map(({offset}, i) => traceCurve(i, offset));

function atDistance(samples: (typeof ROUTES)[number]["samples"], distance: number) {
  const next = samples.findIndex(sample => sample.distance >= distance);
  if (next <= 0) return samples[next === 0 ? 0 : samples.length - 1];
  const a = samples[next - 1];
  const b = samples[next];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return {x: blend(a.x, b.x, t), y: blend(a.y, b.y, t)};
}

function samplePatch(image: HTMLImageElement, index: number) {
  const sampler = document.createElement("canvas");
  sampler.width = PATCH_GRID * PATCH_SIZE;
  sampler.height = PATCH_GRID * PATCH_SIZE;
  const ctx = sampler.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  const col = index % PATCH_GRID;
  const row = Math.floor(index / PATCH_GRID);
  ctx.drawImage(image, 0, 0, sampler.width, sampler.height);
  const { data } = ctx.getImageData(col * PATCH_SIZE, row * PATCH_SIZE, PATCH_SIZE, PATCH_SIZE);
  return Array.from({ length: COUNT }, (_, i) => data[Math.floor(i / 3) * 4 + i % 3] / 255);
}

function project(values: number[]) {
  return values.map((_, i) => SAMPLE_WEIGHTS.reduce((sum, {offset, weight}) => sum + weight * values[(i + offset) % COUNT], 0));
}

function channelColor(channel: number, value: number) {
  const rgb = [[180, 64, 47], [46, 122, 80], [48, 101, 146]][channel];
  return "rgb(" + rgb.map(component => Math.round(blend(243, component, .22 + .78 * value))).join(",") + ")";
}

function drawPatch(ctx: CanvasRenderingContext2D, values: number[], output: number[], position: number) {
  const split = clamp(position / 1100);
  const projection = clamp((position - 3920) / 730);
  const matrix = clamp((position - 4680) / 200);
  const contribution = clamp((position - ROUTE_START) / ROUTE_DURATION);
  const visibleOutput = clamp((position - OUTPUT_START) / (DURATION - OUTPUT_START));
  ctx.clearRect(0, 0, 760, 286);
  ctx.fillStyle = "#f2f5ed";
  ctx.fillRect(0, 0, 760, 286);
  for (let i = 0; i < COUNT; i++) {
    const channel = i % 3;
    const pixel = Math.floor(i / 3);
    const col = pixel % PATCH_SIZE;
    const row = Math.floor(pixel / PATCH_SIZE);
    // Each position is tracked by its original (row, column, channel) identity.
    const flatten = clamp((position - 1350 - i * .46) / 2150);
    const planeX = blend(298 + channel * 26, 72 + channel * 231, split);
    const planeY = blend(54 + channel * 15, 70, split);
    const flatX = blend(42, 34, projection) + (i % 48) * blend(14.1, 5.9, projection);
    const flatY = blend(72, 94, projection) + Math.floor(i / 48) * blend(9.4, 8.7, projection);
    const x = blend(planeX + col * 8.9, flatX, flatten);
    const y = blend(planeY + row * 8.9, flatY, flatten);
    ctx.fillStyle = channelColor(channel, values[i]);
    ctx.fillRect(x, y, blend(8.25, blend(12.5, 5.2, projection), flatten), blend(8.25, 7.8, flatten));
  }
  if (matrix > 0) {
    ctx.globalAlpha = matrix;
    ctx.strokeStyle = "#8ca78f";
    ctx.lineWidth = 1;
    ctx.strokeRect(346, 88, 65, 144);
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 5; col++) {
        const coefficient = SAMPLE_WEIGHTS.find(({offset}) => (col + offset) % COUNT === row)?.weight ?? 0;
        ctx.fillStyle = coefficient > 0 ? channelColor(1, coefficient) : "#e4ebe0";
        ctx.fillRect(352 + col * 11, 94 + row * 11, 8, 8);
      }
    }
    const colors = ["#a34f3d", "#397655", "#426e8d"];
    for (let i = 0; i < SAMPLE_WEIGHTS.length; i++) {
      const { offset } = SAMPLE_WEIGHTS[i];
      const y = 98 + offset * 11;
      const color = colors[i];
      const route = ROUTES[i];
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.strokeRect(33 + offset * 5.9, 93, 7, 10);
      ctx.strokeRect(351, y - 5, 10, 10);
      ctx.globalAlpha = matrix * .22;
      ctx.beginPath();
      ctx.moveTo(...route.segments[0][0]);
      for (const [, b, c, d] of route.segments) ctx.bezierCurveTo(...b, ...c, ...d);
      ctx.stroke();
      const head = (contribution * 1.3 - i * .14) * route.distance;
      for (let n = 0; n < 16; n++) {
        const distance = head - n * 2.7;
        if (distance < 0 || distance > route.distance) continue;
        const {x: px, y: py} = atDistance(route.samples, distance);
        ctx.globalAlpha = matrix * (1 - n / 16) ** 1.5;
        ctx.beginPath(); ctx.arc(px, py, n === 0 ? 3.1 : 2.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = matrix;
    }
    ctx.strokeStyle = "#709578";
    for (const {offset} of SAMPLE_WEIGHTS) {
      const y = 98 + offset * 11;
      ctx.beginPath();
      ctx.moveTo(362, y);
      ctx.bezierCurveTo(392, y, 404, 98, 416, 98);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(446, 98); ctx.lineTo(452, 98); ctx.stroke();
    if (visibleOutput > 0) {
      ctx.fillStyle = "#326a50";
      for (let n = 0; n < 12; n++) {
        const t = visibleOutput * 2 - n * .025;
        if (t < 0 || t > 1) continue;
        ctx.globalAlpha = (1 - n / 12) ** 1.5;
        ctx.beginPath(); ctx.arc(blend(446, 452, t), 98, n === 0 ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (let i = 0; i < COUNT; i++) {
      const opacity = clamp(visibleOutput * 1.22 - i / COUNT * .22);
      if (opacity === 0) continue;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = channelColor(1, output[i]);
      ctx.fillRect(452 + (i % 48) * 5.7, 94 + Math.floor(i / 48) * 8.7, 5, 7.8);
    }
    ctx.globalAlpha = 1;
  }
}

export function PatchMotion({ index }: { index: number }) {
  const [values, setValues] = useState<number[]>();
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const playback = useLessonPlayback(DURATION);
  const output = useMemo(() => values ? project(values) : [], [values]);
  const split = clamp(playback.position / 1100);
  const labels = clamp((playback.position - 4680) / 200);
  const stage = STOPS.filter(stop => playback.position >= stop.at).length - 1;

  useEffect(() => {
    const image = new Image(224, 224);
    let active = true;
    image.src = birdUrl;
    image.decode().then(() => {
      if (active) setValues(samplePatch(image, index));
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [index]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx && values) drawPatch(ctx, values, output, playback.position);
  }, [values, output, playback.position]);

  return <div className="patch-motion">
    {values ? <>
      <PlaybackControls playback={playback} label="Patch 展平与投影进度" />
      <div className="motion-stops" aria-label="跳到计算步骤">
        {STOPS.map(({ at, name }, i) => <button type="button" key={at} className="lesson-choice"
          aria-pressed={i === stage} onClick={() => playback.seek(at)}>{i + 1}. {name}</button>)}
      </div>
      <div className="patch-motion-stage">
        <canvas ref={canvas} width="760" height="286" className="patch-motion-canvas"
          aria-label="所选 Patch 的 RGB 通道、展平向量与线性投影。下面提供同一运算的数值说明。" />
        {playback.position < 1350 && <div className="projection-labels" style={{opacity: clamp((split - .25) / .5)}}>
          {CHANNELS.map((channel, i) => <span key={channel} className={"projection-term term-" + i} style={{
            left: blend(298 + i * 26, 72 + i * 231, split) / 7.6 + "%",
            top: (blend(54 + i * 15, 70, split) - 24) / 2.86 + "%",
          }}><math><mi mathvariant="normal">{channel}</mi><mo>·</mo><mn>{PATCH_SIZE}</mn><mo>×</mo><mn>{PATCH_SIZE}</mn></math></span>)}
        </div>}
        {playback.position >= 1350 && labels === 0 && <div className="projection-labels">
          <span className="flatten-range"><math><Sub base="x" index={0} /><mo>→</mo><Sub base="x" index={COUNT - 1} /></math></span>
          <span className="flatten-caption">每行连续 <math><mn>48</mn></math> 项，折行只为阅读</span>
        </div>}
        {labels > 0 && <div className="projection-labels" style={{opacity: labels}}>
          {SAMPLE_WEIGHTS.map(({offset,weight}, i) => <span key={offset} className={"projection-term term-" + i}
            style={{left: (34 + i * 87) / 7.6 + "%"}}>
            <math><Sub base="x" index={offset} /><mo>×</mo><mn>{weight}</mn></math>
          </span>)}
          <span className="projection-matrix-name"><math><mi>W</mi></math> 局部</span>
          <span className="projection-sigma" aria-label="求和"><math><mo>∑</mo></math></span>
          <span className="projection-input-name">输入 <math><mi>x</mi><mo>∈</mo><msup><mi>ℝ</mi><mn>{COUNT}</mn></msup></math></span>
          <span className="projection-output-name">输出 <math><mi>z</mi><mo>∈</mo><msup><mi>ℝ</mi><mn>{COUNT}</mn></msup></math></span>
        </div>}
      </div>
      <p className="motion-status">{playback.position < 1350 ? <>同一块图像分成 R、G、B 三张 <math><mn>{PATCH_SIZE}</mn><mo>×</mo><mn>{PATCH_SIZE}</mn></math> 平面。</> :
        playback.position < 3920 ? "每个格子带着原值移动到新索引。展平只改变顺序。" :
        playback.position < ROUTE_START ? <>把向量放到计算区左侧。下一步追踪 <math><Sub base="x" index={0} /><mo>、</mo><Sub base="x" index={1} /><mo>、</mo><Sub base="x" index={3} /></math>。</> :
        playback.position < OUTPUT_START ? "三条有色拖尾分别指向第一列的三个非零系数。" :
        <>三项贡献相加得到 <math><Sub base="z" index={0} /></math>。其他列用同一规则得到其余输出。</>}</p>
      <div className="patch-motion-detail">
        <p><strong>展平顺序</strong><br />按行、列扫描，每个像素依次取 R、G、B。首个像素的三项为 {values.slice(0, 3).map(value => value.toFixed(3)).join("、")}。</p>
        <p><strong>投影示例 · 第 1 个输出坐标</strong><br />
          <span className="projection-equation"><WeightedSum terms={SAMPLE_WEIGHTS.map(({offset,weight}) => ({
            weight, value: values[offset],
          }))} result={output[0]} /></span></p>
      </div>
      <p className="rk-note">输入从同一张图采样并缩放到 0–1。示例矩阵在每列取三个非零系数，循环使用同一索引规则。真实 ViT 使用学习到的投影权重，画面只跟踪第一列的三条贡献路径。</p>
    </> : <p>{error ? "暂时无法读取插图像素，可以从上方图解查看展平和投影关系。" : "正在读取所选 Patch 的 RGB 数值…"}</p>}
  </div>;
}
