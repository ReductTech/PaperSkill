import { useEffect, useRef, useState } from 'react';
import { ablationRows } from '../data/study';
import { LogDensityEquation, MathExpression } from './MathExpression';
import { PaperFigure, Readout, SourceLink, StudySection, StudyTable, Switcher } from './StudyUI';

const toneModes = [{ value: 'curve', label: '非线性色调曲线' }, { value: 'linear', label: '线性对照' }] as const;
const graph = { left: 54, top: 24, right: 455, bottom: 214 };
const plotX = (value: number) => graph.left + (graph.right - graph.left) * value;
const plotY = (value: number) => graph.bottom - (graph.bottom - graph.top) * value;

function ChartGrid({ horizontal, vertical }: { horizontal: string; vertical: string }) {
  return <>
    {[0, .25, .5, .75, 1].map(value => <g key={value} className="chart-grid">
      <line x1={plotX(value)} x2={plotX(value)} y1={graph.top} y2={graph.bottom} />
      <line x1={graph.left} x2={graph.right} y1={plotY(value)} y2={plotY(value)} />
    </g>)}
    <path className="chart-axis" d={`M ${graph.left},${graph.top} V ${graph.bottom} H ${graph.right}`} />
    <text className="chart-text" x={graph.left} y={15}>{vertical}</text>
    <text className="chart-text" x={graph.right} y={244} textAnchor="end">{horizontal}</text>
  </>;
}

function TonePatch({ value, gamma, label }: { value: number; gamma: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(80, 80);
    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 80; x++) {
        const offset = (y * 80 + x) * 4;
        const texture = .012 * Math.sin(x * .27) * Math.cos(y * .34);
        const grain = .025 * Math.sin(x * 178.13 + y * 392.17);
        const pixel = Math.pow(Math.min(1, Math.max(0, value + texture + grain)), gamma) * 255;
        image.data.set([pixel, pixel, pixel, 255], offset);
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [value, gamma]);
  return <figure className="tone-patch"><canvas width={80} height={80} ref={ref} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

export function IspLab() {
  const [mode, setMode] = useState<'curve' | 'linear'>('curve');
  const [brightness, setBrightness] = useState(.18);
  const gamma = mode === 'curve' ? .45 : 1;
  const tone = (value: number) => value ** gamma;
  const perturbation = .025;
  const output = tone(brightness + perturbation) - tone(brightness);
  const slope = gamma * brightness ** (gamma - 1);
  const curve = Array.from({ length: 101 }, (_, index) => `${plotX(index / 100)},${plotY(tone(index / 100))}`).join(' ');
  const x0 = plotX(brightness), x1 = plotX(brightness + perturbation);
  const y0 = plotY(tone(brightness)), y1 = plotY(tone(brightness + perturbation));
  return <>
    <div className="lab-panel">
      <div className="animation-guide" aria-label="色调曲线的两种对照">
        <article data-active={mode === 'curve'}>
          <h2>非线性色调曲线 <MathExpression label="T 括号 x 等于 x 的零点四五次方">
            <mi>T</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>0.45</mn></msup>
          </MathExpression></h2>
          <p>看同样大小的亮度扰动在暗处和亮处会变成多大。这里暗处曲线较陡，扰动容易被放大。亮处曲线较平，扰动会缩小。</p>
        </article>
        <article data-active={mode === 'linear'}>
          <h2>线性对照 <MathExpression label="T 括号 x 等于 x">
            <mi>T</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>x</mi>
          </MathExpression></h2>
          <p>亮度原样通过，斜率始终为 1。无论取样点在哪，输出扰动都和输入一样大。</p>
        </article>
      </div>
      <p className="animation-caption">两个小图块来自同一输入。左边是处理前的颗粒，右边是经过当前曲线后的结果。</p>
      <Switcher label="选择色调曲线" value={mode} options={toneModes} onChange={setMode} />
      <div className="chart-pair">
        <svg viewBox="0 0 480 255" role="img" aria-label="色调曲线，显示固定输入扰动对应的输出扰动">
          <ChartGrid horizontal="输入亮度" vertical="输出亮度" />
          <polyline className="curve-line" points={curve} />
          <path className="chart-guide" d={`M ${x0},${graph.bottom} V ${y0} H ${graph.left} M ${x1},${graph.bottom} V ${y1} H ${graph.left}`} />
          <path className="chart-emphasis" d={`M ${x0},${y0} H ${x1} V ${y1}`} />
          <circle className="chart-dot" cx={x0} cy={y0} r={5} /><circle className="chart-dot" cx={x1} cy={y1} r={5} />
        </svg>
        <div className="tone-patches">
          <TonePatch value={brightness} gamma={1} label="处理前，同一扰动" />
          <TonePatch value={brightness} gamma={gamma} label="处理后，扰动被映射" />
        </div>
      </div>
      <label className="range-row"><span>输入亮度</span><input type="range" min={.04} max={.94} step={.01}
        value={brightness} onChange={event => setBrightness(Number(event.currentTarget.value))} /><output>{brightness.toFixed(2)}</output></label>
      <div className="readout-grid triple">
        <Readout label={<>输入扰动 <MathExpression label="德尔塔 x"><mi>Δ</mi><mi>x</mi></MathExpression></>} value={perturbation.toFixed(3)} />
        <Readout label={<>局部斜率 <MathExpression label="T 在 x 处的导数"><msup><mi>T</mi><mo>′</mo></msup><mo>(</mo><mi>x</mi><mo>)</mo></MathExpression></>} value={slope.toFixed(2)} />
        <Readout label={<>输出扰动 <MathExpression label="德尔塔 y"><mi>Δ</mi><mi>y</mi></MathExpression></>} value={output.toFixed(3)} tone="mint" />
      </div>
      <p className="lab-note">{mode === 'linear' ? '线性对照中斜率恒定，同样的输入扰动在各亮度位置都产生同样大的输出扰动。' :
        `当前输出扰动约为输入的 ${(output / perturbation).toFixed(2)} 倍。改变亮度会改变曲线斜率，即使输入扰动相同。`}</p>
      <p className="evidence-note">橙线的横段表示输入亮度差，竖段表示映射后的亮度差 <MathExpression label="德尔塔 y 等于 T 括号 x 加德尔塔 x 减 T 括号 x">
        <mi>Δ</mi><mi>y</mi><mo>=</mo><mi>T</mi><mo>(</mo><mi>x</mi><mo>+</mo><mi>Δ</mi><mi>x</mi><mo>)</mo><mo>−</mo><mi>T</mi><mo>(</mo><mi>x</mi><mo>)</mo>
      </MathExpression>。曲线和灰度图块都是教学示意。</p>
    </div>
    <StudySection title="真实照片里的噪声规律">
      <PaperFigure number={2} alt="原文图 2，五种手机在红绿蓝通道的噪声方差随干净亮度变化" />
      <p>原文图 2 分别展示 RGB 三个通道。横轴为干净图像强度，纵轴为噪声方差。曲线随相机和颜色通道而变，很难用一条直线描述。真实 ISP 还包含颜色混合和邻域处理。</p>
      <SourceLink page={2}>原文图 2</SourceLink>
    </StudySection>
  </>;
}

export function LikelihoodLab() {
  const [scale, setScale] = useState(1);
  const density = (value: number) => Math.exp(-.5 * (value / scale) ** 2) / (scale * Math.sqrt(2 * Math.PI));
  const sx = (value: number) => plotX((value + 7) / 14);
  const sy = (value: number) => plotY(value / 1.05);
  const path = (min: number, max: number, count: number) => Array.from({ length: count + 1 }, (_, index) => {
    const value = min + (max - min) * index / count;
    return `${sx(value)},${sy(density(value))}`;
  }).join(' ');
  return <>
    <div className="lab-panel">
      <div className="density-layout">
        <svg viewBox="0 0 480 255" role="img" aria-label="随尺度变化的归一化高斯密度，阴影区间的概率保持 68.27%">
          <ChartGrid horizontal="残差" vertical="概率密度" />
          <polygon className="chart-fill" points={`${sx(-scale)},${graph.bottom} ${path(-scale, scale, 80)} ${sx(scale)},${graph.bottom}`} />
          <polyline className="curve-line" points={path(-7, 7, 250)} />
          {[-scale, scale].map(value => <line key={value} className="chart-emphasis" x1={sx(value)} x2={sx(value)} y1={graph.bottom} y2={sy(density(value))} />)}
        </svg>
        <div className="density-aside">
          <Readout label="阴影区间的概率" value="68.27%" tone="mint" />
          <Readout label={<>雅可比绝对值 <MathExpression label="a 分之一"><mfrac><mn>1</mn><mi>a</mi></mfrac></MathExpression></>} value={(1 / scale).toFixed(3)} />
          <Readout label="密度峰值" value={density(0).toFixed(3)} />
        </div>
      </div>
      <label className="range-row"><span>尺度 a</span><input type="range" min={.4} max={3} step={.05} value={scale}
        onChange={event => setScale(Number(event.currentTarget.value))} /><output>{scale.toFixed(2)}</output></label>
      <p className="lab-note">区间 <MathExpression label={`负 ${scale.toFixed(2)} 到 ${scale.toFixed(2)}`}>
        <mo>[</mo><mo>−</mo><mn>{scale.toFixed(2)}</mn><mo>,</mo><mn>{scale.toFixed(2)}</mn><mo>]</mo>
      </MathExpression> 始终对应标准高斯的 <MathExpression label="负一到一"><mo>[</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>1</mn><mo>]</mo></MathExpression>。空间拉伸时密度降低，积分后的概率质量保持不变。</p>
    </div>
    <StudySection title="怎样从密度计算走到参数更新？">
      <MathExpression block label="z 等于 n 除以 a，残差密度等于标准高斯密度除以 a">
        <mi>z</mi><mo>=</mo><mfrac><mi>n</mi><mi>a</mi></mfrac><mo>，</mo>
        <mi>p</mi><mo>(</mo><mi>n</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mi>φ</mi><mo>(</mo><mi>z</mi><mo>)</mo></mrow><mi>a</mi></mfrac>
      </MathExpression>
      <p>标准高斯密度用 <MathExpression label="phi 括号 z"><mi>φ</mi><mo>(</mo><mi>z</mi><mo>)</mo></MathExpression> 表示。正向变换的导数是 <MathExpression label="a 分之一"><mfrac><mn>1</mn><mi>a</mi></mfrac></MathExpression>。高维流用雅可比行列式的绝对值表示同样的体积变化。</p>
      <LogDensityEquation />
      <ol className="training-steps">
        <li>取一批真实残差和对应条件，正向得到 z 及各层的体积变化。</li>
        <li>算出这些残差的对数密度，取负得到训练损失。真实残差的平均对数密度越高，损失越低。</li>
        <li>用 Adam 更新可逆流的参数，再用下一批真实残差重复这个过程。</li>
      </ol>
      <p>把一批 <MathExpression label="M"><mi>M</mi></MathExpression> 个训练样本的负对数似然取平均，训练损失可写成</p>
      <MathExpression block label="训练损失是 M 个样本的平均负对数似然">
        <msub><mi>ℒ</mi><mtext>NLL</mtext></msub><mo>=</mo><mo>−</mo><mfrac><mn>1</mn><mi>M</mi></mfrac>
        <munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover>
        <mi mathvariant="normal">log</mi><mspace width="0.16em" />
        <mrow><msub><mi>p</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>N</mi><mi>i</mi></msub><mo>|</mo><msub><mi>I</mi><mi>i</mi></msub><mo>,</mo><msub><mi>c</mi><mi>i</mi></msub><mo>,</mo><msub><mi>g</mi><mi>i</mi></msub><mo>)</mo></mrow>
      </MathExpression>
      <p>SIDD-Medium 的图块大小为 32×32，按图块随机划分为 80% 训练和 20% 验证。</p>
      <SourceLink page={3}>原文式 (3)、式 (4)</SourceLink>
    </StudySection>
  </>;
}

const layers = [
  { name: '条件线性', short: 'CL', inputs: ['相机', 'ISO'], count: 4,
    formula: <MathExpression label="y 等于 x 逐元素乘条件尺度 s 加条件偏移 t">
      <mi>y</mi><mo>=</mo><mi>x</mi><mo>⊙</mo><mi>s</mi><mo>(</mo><mi>c</mi><mo>,</mo><mi>g</mi><mo>)</mo><mo>+</mo><mi>t</mi><mo>(</mo><mi>c</mi><mo>,</mo><mi>g</mi><mo>)</mo>
    </MathExpression>,
    copy: '相机与 ISO 组合决定每个颜色通道的缩放与偏移。相同的通道参数应用到该通道的所有像素。' },
  { name: '通道混合', short: '1×1 卷积', inputs: [], count: 8,
    formula: <MathExpression label="y 等于 W 乘 x，W 的行列式非零">
      <mi>y</mi><mo>=</mo><mi>W</mi><mi>x</mi><mo>，</mo><mi mathvariant="normal">det</mi><mspace width="0.16em" /><mi>W</mi><mo>≠</mo><mn>0</mn>
    </MathExpression>,
    copy: '每个像素上的 RGB 向量乘以同一个可逆矩阵。通道组合改变后，后续耦合层可以处理新的组合。' },
  { name: '条件耦合', short: 'CAC', inputs: ['干净图', '相机', 'ISO', '保留组'], count: 8,
    formula: <MathExpression label="A 组保持不变，B 组逐元素乘 s 再加 t">
      <msup><mi>y</mi><mi>A</mi></msup><mo>=</mo><msup><mi>x</mi><mi>A</mi></msup><mo>，</mo>
      <msup><mi>y</mi><mi>B</mi></msup><mo>=</mo><msup><mi>x</mi><mi>B</mi></msup><mo>⊙</mo><mi>s</mi><mo>+</mo><mi>t</mi>
    </MathExpression>,
    copy: '保留组与干净图参与预测。相机和 ISO 调节对数尺度，缩放与偏移作用于另一组。求逆时可以用保留组重算参数。' },
] as const;
const nodes = [0, 1, 2, 1, 2] as const;
const conditions = ['干净图', '相机', 'ISO', '保留组'] as const;

export function ArchitectureLab() {
  const [selected, setSelected] = useState(0);
  const layer = layers[nodes[selected]];
  const activeConditions: readonly string[] = layer.inputs;
  return <>
    <div className="lab-panel">
      <div className="diagram-heading"><div><strong>一个流块</strong><span>整网重复 4 次</span></div><span className="diagram-shape">32 × 32 × 3</span></div>
      <div className="condition-line" aria-label="所选层接收的条件">
        {conditions.map(name => <span key={name} data-active={activeConditions.includes(name)}>{name}{name === '保留组' && <> <MathExpression label="x 上标 A"><msup><mi>x</mi><mi>A</mi></msup></MathExpression></>}</span>)}
      </div>
      <div className="architecture-track" role="group" aria-label="流块中的五个变换">
        {nodes.map((kind, index) => <button key={index} type="button" aria-label={`${index + 1} ${layers[kind].name}`}
          aria-pressed={index === selected} data-path={index <= selected} onClick={() => setSelected(index)}>
          <small>{String(index + 1).padStart(2, '0')}</small><strong>{layers[kind].short}</strong><span>{layers[kind].name}</span>
        </button>)}
      </div>
      <div className="architecture-feedback" aria-live="polite">
        <div><span className="lab-kicker">{layer.name} · 整网 {layer.count} 层</span><p className="architecture-formula">{layer.formula}</p></div>
        <p>{layer.copy}</p>
      </div>
      <p className="evidence-note">每个条件耦合步骤 CCS 由一个可逆 1×1 卷积和一个条件仿射耦合层组成。流块保持输入形状。</p>
    </div>
    <StudySection title="哪些条件和层有效？原文消融实验（表 2）">
      <StudyTable columns={['流块配置', 'NLL ↓', '边际 KL ↓']} rows={ablationRows} />
      <p>在相同测试协议下，完整条件的两步 CCS 优于只使用单一条件的对应版本。加上 CL 并增加流块后，两个指标进一步降低。</p>
      <SourceLink page={7}>原文表 2</SourceLink>
    </StudySection>
  </>;
}
