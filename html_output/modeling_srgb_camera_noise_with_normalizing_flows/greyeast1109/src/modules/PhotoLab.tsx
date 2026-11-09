import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { imageSize, photoUrl, scenes } from '../data/study';
import type { Point, Scene } from '../data/study';
import { ForwardEquation, InverseEquation, LogDensityEquation, MathExpression, NoisyImageSymbol } from './MathExpression';
import { Readout, SourceLink, StudySection, Switcher } from './StudyUI';

export type PhotoState = {
  scene: Scene;
  point: Point;
  onScene: (scene: Scene) => void;
  onPoint: (point: Point) => void;
};

const clampByte = (value: number) => Math.min(255, Math.max(0, Math.round(value)));
const offset = ({ x, y }: Point) => (y * imageSize + x) * 4;
const rgb = (data: ImageData, point: Point) => Array.from(data.data.subarray(offset(point), offset(point) + 3));
const signed = (number: number) => `${number > 0 ? '+' : ''}${number}`;

export function ScenePicker({ scene, onScene }: Pick<PhotoState, 'scene' | 'onScene'>) {
  return <div className="scene-picker">
    <span>照片样本</span>
    <Switcher label="选择照片样本" value={scene.id} options={scenes.map(item => ({ value: item.id, label: item.title }))}
      onChange={id => { const next = scenes.find(item => item.id === id); if (next) onScene(next); }} />
  </div>;
}

export function PointMarker({ point }: { point: Point }) {
  return <span className="point-marker" aria-hidden="true" style={{
    left: `${(point.x + .5) / imageSize * 100}%`, top: `${(point.y + .5) / imageSize * 100}%`,
  }} />;
}

export function PhotoWipe({ left, right, leftLabel, rightLabel, point }: {
  left: string; right: string; leftLabel: string; rightLabel: string; point?: Point;
}) {
  const [split, setSplit] = useState(50);
  return <div className="photo-wipe" style={{ '--split': `${split}%` } as CSSProperties}>
    <img src={left} alt={leftLabel} draggable={false} />
    <img className="wipe-right" src={right} alt={rightLabel} draggable={false} />
    <span className="photo-tag wipe-tag-left">{leftLabel}</span>
    <span className="photo-tag wipe-tag-right">{rightLabel}</span>
    {point && <PointMarker point={point} />}
    <span className="wipe-line" aria-hidden="true"><span>‹ ›</span></span>
    <input className="wipe-range" type="range" min={0} max={100} value={split}
      aria-label="照片对比分割位置" onChange={event => setSplit(Number(event.currentTarget.value))} />
  </div>;
}

function readImage(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('无法读取照片'));
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = imageSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('浏览器无法读取像素');
        ctx.drawImage(img, 0, 0, imageSize, imageSize);
        resolve(ctx.getImageData(0, 0, imageSize, imageSize));
      } catch (error) {
        reject(error);
      }
    };
    img.src = src;
  });
}

function usePhotos(scene: Scene) {
  const [result, setResult] = useState<{
    id: Scene['id']; clean?: ImageData; noisy?: ImageData; failed?: boolean;
  }>();
  useEffect(() => {
    let current = true;
    Promise.all([readImage(photoUrl(scene, 'clean')), readImage(photoUrl(scene, 'noisy'))])
      .then(([clean, noisy]) => { if (current) setResult({ id: scene.id, clean, noisy }); })
      .catch(() => { if (current) setResult({ id: scene.id, failed: true }); });
    return () => { current = false; };
  }, [scene]);
  return result?.id === scene.id ? result : undefined;
}

function PixelCanvas({ data, label, point }: { data?: ImageData; label: string; point?: Point }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = point ? 22 : imageSize;
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    if (!data) {
      ctx.clearRect(0, 0, size, size);
      return;
    }
    if (!point) {
      ctx.putImageData(data, 0, 0);
      return;
    }
    const x = Math.max(0, Math.min(imageSize - size, point.x - Math.floor(size / 2)));
    const y = Math.max(0, Math.min(imageSize - size, point.y - Math.floor(size / 2)));
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(data, -x, -y, x, y, size, size);
  }, [data, point, size]);
  return <canvas className={point ? 'pixel-loupe' : 'pixel-canvas'} ref={ref} width={size} height={size}
    role="img" aria-label={label} />;
}

function PhotoPane({ label, src, data, point, onPoint }: {
  label: string; src?: string; data?: ImageData; point: Point; onPoint?: (point: Point) => void;
}) {
  const choose = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pixel = (value: number, start: number, size: number) =>
      Math.max(0, Math.min(imageSize - 1, Math.floor((value - start) / size * imageSize)));
    onPoint?.({ x: pixel(event.clientX, bounds.left, bounds.width), y: pixel(event.clientY, bounds.top, bounds.height) });
  };
  return <figure className="photo-pane" data-picker={!!onPoint}>
    <div className="photo-square" tabIndex={onPoint ? 0 : undefined} role={onPoint ? 'group' : undefined}
      aria-label={onPoint ? '带噪图取样区，方向键移动取样点' : undefined}
      onPointerDown={onPoint ? event => { event.currentTarget.setPointerCapture(event.pointerId); choose(event); } : undefined}
      onPointerMove={onPoint ? event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) choose(event); } : undefined}
      onKeyDown={onPoint ? event => {
        const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const step = steps[event.key];
        if (!step) return;
        event.preventDefault();
        event.stopPropagation();
        const size = event.shiftKey ? 8 : 1;
        onPoint({ x: clampByte(point.x + step[0] * size), y: clampByte(point.y + step[1] * size) });
      } : undefined}>
      {src ? <img src={src} alt={label} draggable={false} /> : <PixelCanvas data={data} label={label} />}
      <PointMarker point={point} />
      {data && <PixelCanvas data={data} label={`${label}取样点放大`} point={point} />}
    </div>
    <figcaption>{label}{onPoint && <small>拖动取样</small>}</figcaption>
  </figure>;
}

function residualView(clean: ImageData, noisy: ImageData) {
  const display = new ImageData(imageSize, imageSize);
  for (let i = 0; i < display.data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      display.data[i + channel] = clampByte(128 + 4 * (noisy.data[i + channel] - clean.data[i + channel]));
    }
    display.data[i + 3] = 255;
  }
  return display;
}

export function ResidualLab({ scene, point, onScene, onPoint }: PhotoState) {
  const photos = usePhotos(scene);
  const clean = photos?.clean;
  const noisy = photos?.noisy;
  const residual = useMemo(() => clean && noisy ? residualView(clean, noisy) : undefined, [clean, noisy]);
  const cleanPixel = clean && rgb(clean, point);
  const noisyPixel = noisy && rgb(noisy, point);
  const delta = cleanPixel && noisyPixel && noisyPixel.map((value, i) => value - cleanPixel[i]);
  return <>
    <div className="lab-panel">
      <ScenePicker scene={scene} onScene={onScene} />
      <div className="photo-triplet">
        <PhotoPane label="干净参考" src={photoUrl(scene, 'clean')} data={clean} point={point} />
        <PhotoPane label="真实带噪" src={photoUrl(scene, 'noisy')} data={noisy} point={point} onPoint={onPoint} />
        <PhotoPane label="残差预览" data={residual} point={point} />
      </div>
      <div className="readout-grid triple">
        <Readout label="干净 RGB" value={cleanPixel?.join(' / ') ?? '—'} />
        <Readout label="带噪 RGB" value={noisyPixel?.join(' / ') ?? '—'} />
        <Readout label={<MathExpression label="残差等于带噪图减干净图">
          <mi>N</mi><mo>=</mo><NoisyImageSymbol /><mo>−</mo><mi>I</mi>
        </MathExpression>} value={delta?.map(signed).join(' / ') ?? '—'} tone="mint" />
      </div>
      <p className="lab-note" role={photos?.failed ? 'status' : undefined}>{photos?.failed ? '照片像素读取失败，请刷新或切换样本重试。' :
        `像素 (${point.x}, ${point.y})。残差图以中灰表示零差，颜色变化放大 4 倍。读数来自论文图 10 的展示图块。`}</p>
    </div>
    <StudySection title="训练前为什么要去量化？">
      <p><strong>整数像素只记录了灰度等级。</strong> 8 位 sRGB 只记录 0 到 255 的整数。可以把整数 120 看作一个宽度为 1 的灰度区间的标签。对连续模型来说，整个区间的概率是密度曲线下的面积。</p>
      <p><strong>只在整数点算密度会奖励尖峰。</strong> 如果训练只查看 120 等整数位置，模型可以把曲线在这些点附近做得又窄又高。峰值升高时，整个区间的面积可能完全没变。去量化在各自的灰度区间内均匀取样，让训练也看到区间内部的位置。</p>
      <div className="dequant-example" aria-label="在一个灰度单位内去量化的示例">
        <Readout label="干净值加扰动" value={<MathExpression label="120 加 0.2 等于 120.2">
          <mn>120</mn><mo>+</mo><mn>0.2</mn><mo>=</mo><mn>120.2</mn>
        </MathExpression>} />
        <Readout label="带噪值加扰动" value={<MathExpression label="122 加 0.7 等于 122.7">
          <mn>122</mn><mo>+</mo><mn>0.7</mn><mo>=</mo><mn>122.7</mn>
        </MathExpression>} />
        <Readout label="再相减得到连续残差" value={<MathExpression label="122.7 减 120.2 等于 2.5">
          <mn>122.7</mn><mo>−</mo><mn>120.2</mn><mo>=</mo><mn>2.5</mn>
        </MathExpression>} tone="mint" />
      </div>
      <p>在这个例子中，直接相减得到整数残差 2。训练时则先给两幅图各自加一个从 <MathExpression label="零到一，包含零，不包含一">
        <mo>[</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>)</mo>
      </MathExpression> 均匀抽取的小数，再相减。得到的 2.5 是一次训练用的连续残差，其中包含两次扰动之差 0.5。</p>
      <SourceLink page={4}>原文第 3–4 节</SourceLink>
    </StudySection>
  </>;
}

function brightnessScale(clean: ImageData, index: number) {
  const values = clean.data;
  const brightness = (values[index] + values[index + 1] + values[index + 2]) / (3 * 255);
  return 3 + 10 * (1 - brightness);
}

function generateSample(clean: ImageData, seed: number) {
  let state = seed >>> 0;
  const uniform = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 1) / 4294967297;
  };
  const image = new ImageData(imageSize, imageSize);
  const zRed = new Float32Array(imageSize * imageSize);
  for (let i = 0; i < clean.data.length; i += 4) {
    const scale = brightnessScale(clean, i);
    for (let channel = 0; channel < 3; channel++) {
      const z = Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
      if (channel === 0) zRed[i / 4] = z;
      image.data[i + channel] = clampByte(clean.data[i + channel] + scale * z);
    }
    image.data[i + 3] = 255;
  }
  return { image, zRed };
}

const flowModes = [{ value: 'forward', label: '→ 正向评分' }, { value: 'inverse', label: '← 反向生成' }] as const;

export function FlowLab({ scene, point, onScene }: PhotoState) {
  const [mode, setMode] = useState<'forward' | 'inverse'>('forward');
  const [seed, setSeed] = useState(1);
  const photos = usePhotos(scene);
  const clean = photos?.clean;
  const noisy = photos?.noisy;
  const inverse = mode === 'inverse';
  const sample = useMemo(() => inverse && clean ? generateSample(clean, seed) : undefined, [inverse, clean, seed]);
  const index = offset(point);
  const scale = clean && brightnessScale(clean, index);
  const observed = clean && noisy ? noisy.data[index] - clean.data[index] : undefined;
  const z = inverse ? sample?.zRed[index / 4] : observed !== undefined && scale ? observed / scale : undefined;
  const residual = inverse && z !== undefined && scale ? z * scale : observed;
  const logDensity = z !== undefined && scale ? -.5 * z * z - .5 * Math.log(2 * Math.PI) - Math.log(scale) : undefined;
  const read = (value?: number) => value?.toFixed(2) ?? '—';
  return <>
    <div className="lab-panel">
      <div className="animation-guide" aria-label="可逆流的两个方向">
        <article data-active={!inverse}>
          <h2>正向评分</h2>
          <p>把真实残差变成高斯空间里的潜变量，用它计算真实残差的密度。</p>
          <ForwardEquation />
        </article>
        <article data-active={inverse}>
          <h2>反向生成</h2>
          <p>从标准高斯抽一个样本，用逆变换生成新残差，再加到干净图上。</p>
          <InverseEquation />
        </article>
      </div>
      <p className="animation-caption">两个方向都固定干净图、相机和 ISO。动画用选中像素的缩放演示这条路径。</p>
      <div className="control-line"><Switcher label="流变换方向" value={mode} options={flowModes} onChange={setMode} />
        <ScenePicker scene={scene} onScene={onScene} /></div>
      <div className="flow-layout">
        <PhotoPane label={inverse ? '教学合成结果' : '真实带噪输入'} src={inverse ? undefined : photoUrl(scene, 'noisy')}
          data={inverse ? sample?.image : noisy} point={point} />
        <div className="flow-info">
          <div className="flow-track" data-direction={mode} key={mode} aria-label={inverse ? '从高斯到残差' : '从残差到高斯'}>
            <div className="flow-node" data-active={inverse ? 'end' : 'start'}><small>残差 N</small><strong>{read(residual)}</strong></div>
            <span aria-hidden="true" className="flow-connector">{inverse ? '←' : '→'}</span>
            <div className="flow-node transform-node"><small>{inverse ? '逆变换' : '正变换'}</small><strong>
              <MathExpression label={inverse ? '乘以尺度 s' : '除以尺度 s'}><mo>{inverse ? '×' : '÷'}</mo><mi>s</mi></MathExpression>
            </strong></div>
            <span aria-hidden="true" className="flow-connector">{inverse ? '←' : '→'}</span>
            <div className="flow-node" data-active={inverse ? 'start' : 'end'}><small>潜变量 z</small><strong>{read(z)}</strong></div>
          </div>
          <div className="readout-grid flow-readouts">
            <Readout label="条件尺度 s" value={read(scale)} />
            <Readout label={inverse ? '合成后的 R 值' : '教学对数密度'} value={inverse ? sample?.image.data[index] ?? '—' : read(logDensity)} tone="mint" />
          </div>
          {inverse && <button className="action-button" type="button" onClick={() => setSeed(value => value + 1)}>重新抽样 <span aria-hidden="true">↻</span></button>}
          <p className="lab-note" aria-live="polite">{photos?.failed ? '照片像素读取失败，请刷新或切换样本重试。' : inverse
            ? <>种子 {seed}。将高斯样本乘以尺度 <MathExpression label="N 等于 s 乘 z"><mi>N</mi><mo>=</mo><mi>s</mi><mi>z</mi></MathExpression>，再把得到的残差加回干净图。</>
            : <>用观测残差计算 <MathExpression label="z 等于 N 除以 s"><mi>z</mi><mo>=</mo><mfrac><mi>N</mi><mi>s</mi></mfrac></MathExpression>，并在基分布密度中计入雅可比修正。</>}</p>
        </div>
      </div>
      <p className="evidence-note">数值对应像素 ({point.x}, {point.y}) 的 R 通道。尺度随干净像素亮度变化，是教学用的逐像素仿射流。</p>
    </div>
    <StudySection title="映射到高斯以后，怎样给原残差评分？">
      <p>正向流先给出 z，标准高斯密度公式可以为这个 z 打分。但原残差空间经过了拉伸或压缩，还需要补偿局部体积变化，才得到原残差的密度。</p>
      <LogDensityEquation />
      <p>这里用一个像素的仿射流演示。论文对整个残差图块做可逆变换，并把各层的对数雅可比项相加。训练会调整这些变换，让真实残差映射后的分布逐渐接近标准高斯。</p>
      <SourceLink page={3}>原文式 (3)</SourceLink>
    </StudySection>
  </>;
}
