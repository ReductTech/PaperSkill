import { useState } from 'react';
import type { WidgetProps } from './registry';
import { MathText } from '../components/MathText';
import { ExperimentStepNavigation } from '../components/ExperimentStepNavigation';
import './encoder-lab.css';

const steps = ['原始输入', '各自编码', '线性投影', 'L2归一化'];
const imageProjection = [[1, 0, 1, 0], [0, 1, 0, 1]];
const textProjection = [[1, 0, 1], [0, 1, 0]];
const examples = [
  { name: '猫', caption: 'a photo of a cat', tokens: ['a', 'photo', 'of', 'a', 'cat'], image: [1, 2, 2, 2], text: [2, 3, 2] },
  { name: '汽车', caption: 'a photo of a car', tokens: ['a', 'photo', 'of', 'a', 'car'], image: [2, -1, 2, -2], text: [5, -5, 7] },
];
const multiply = (matrix: number[][], vector: number[]) => matrix.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0));
const norm = (vector: number[]) => Math.hypot(...vector);
const vectorText = (vector: number[], decimals = 0) => `[${vector.map(value => value.toFixed(decimals)).join(', ')}]`;
const rowTex = (vector: number[], decimals = 0) => String.raw`\left[${vector.map(value => value.toFixed(decimals)).join(String.raw`,\,`)}\right]^{\mathsf T}`;
const columnTex = (vector: number[]) => String.raw`\begin{bmatrix}${vector.join(String.raw`\\`)}\end{bmatrix}`;
const matrixTex = (matrix: number[][]) => String.raw`\begin{bmatrix}${matrix.map(row => row.join(' & ')).join(String.raw`\\`)}\end{bmatrix}`;
const explanations = [
  { title: '先保留两种输入的差别', text: '图片是像素，文字是词元序列。它们还没有共同的数值表示，不能直接计算图文相似度。' },
  { title: '各自提取有用的特征', text: '图像编码器与文本编码器分别处理自己的输入。这里用4维和3维特征来演示，它们的维数不同，还不能直接做点积。' },
  { title: '用两个映射进入同一空间', text: '每条分支都有自己的线性投影。这组示例矩阵把4维图像特征和3维文本特征都变成2维；维数一致只让比较成为可能，语义对齐仍来自训练。' },
  { title: '保留方向，把长度变成1', text: '每个非零向量除以自己的L2长度。现在两个单位向量的点积就是余弦相似度；下面的角度与分数由同一组示例数值精确计算。' },
];

function SamplePicture({ car }: { car: boolean }) {
  return <svg className="enc-sample-picture" viewBox="0 0 280 160" role="img" aria-label={car ? '汽车的原创示意图' : '猫的原创示意图'}>
    <rect width="280" height="160" rx="14" fill="#edf3eb" /><circle cx="232" cy="32" r="16" fill="#f5d9b1" /><path d="M0 127Q62 99 137 122T280 118V160H0Z" fill="#dce8d8" />
    {car ? <g fill="none" stroke="#172a2b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M55 104V87Q55 78 65 77L86 75L108 48H169L192 76L219 83Q227 86 227 97V111H55Z" fill="#fff" /><path d="M94 76L114 54H164L182 76Z" fill="#c8e7df" /><path d="M141 54V76M76 102H91M200 101H214" />
      <circle cx="95" cy="111" r="17" fill="#172a2b" /><circle cx="95" cy="111" r="7" fill="#edf3eb" /><circle cx="191" cy="111" r="17" fill="#172a2b" /><circle cx="191" cy="111" r="7" fill="#edf3eb" />
    </g> : <g fill="none" stroke="#172a2b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M117 104Q100 131 121 139H164Q186 130 163 103" fill="#f5d3a8" /><path d="M174 134Q215 137 207 112Q204 102 193 105" strokeWidth="10" stroke="#d49a60" />
      <path d="M104 66L105 34L128 51Q145 45 161 52L181 34L182 68Q192 100 164 112Q139 124 113 108Q92 97 104 66Z" fill="#f5d3a8" /><path d="M111 58L112 47L122 57M167 58L175 47L175 60" stroke="#d49a60" />
      <path d="M119 80H122M162 80H165M139 88L145 88L142 92ZM142 93V98M142 98L134 101M142 98L150 101M109 94L91 90M110 101L92 104M174 94L193 90M174 101L193 105" />
    </g>}
  </svg>;
}
function NumericVector({ vector, scale, normalized = false }: { vector: number[]; scale: number; normalized?: boolean }) {
  return <div className="enc-vector" aria-label={`向量${vectorText(vector, normalized ? 3 : 0)}，共同刻度负${scale}到正${scale}`}>
    {vector.map((value, index) => <div className="enc-coordinate" key={index}><span className="enc-coordinate-index">{index + 1}</span><div className="enc-coordinate-track"><span style={{ left: `${value < 0 ? 50 - Math.abs(value) / scale * 50 : 50}%`, width: `${Math.abs(value) / scale * 50}%` }} className={value < 0 ? 'is-negative' : ''} /></div><strong>{value.toFixed(normalized ? 3 : 0)}</strong></div>)}
    <div className="enc-vector-scale"><span>−{scale}</span><span>0</span><span>+{scale}</span></div>
  </div>;
}

export function Clip02({ chapterId, moduleId }: WidgetProps) {
  const [step, setStep] = useState(0);
  const [sample, setSample] = useState(0);
  const [branchView, setBranchView] = useState<'image' | 'text'>('image');
  const example = examples[sample];
  const projected = [multiply(imageProjection, example.image), multiply(textProjection, example.text)];
  const lengths = projected.map(norm);
  const unit = projected.map((vector, i) => vector.map(value => value / lengths[i]));
  const similarity = unit[0].reduce((sum, value, i) => sum + value * unit[1][i], 0);
  const angle = Math.acos(Math.min(1, Math.max(-1, similarity))) * 180 / Math.PI;
  const notes = explanations[step];
  const featureScale = Math.max(1, ...example.image.map(Math.abs), ...example.text.map(Math.abs));
  return <div className="enc-lab enc-compact-lab" data-widget={`${chapterId}-${moduleId}`} onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="enc-lab-topline"><span className="enc-eyebrow">表示转换实验</span><span className="enc-boundary">教学数值 · 未运行真实模型</span></div>
    <div className="enc-workbench">
    <div className="enc-step-nav" role="group" aria-label="表示转换步骤">{steps.map((name, index) => <button type="button" key={name} className={`enc-step-button${step === index ? ' is-active' : ''}`} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><small>{['两种输入', '提取特征', '共同维数', '单位长度'][index]}</small></button>)}</div>
    <ExperimentStepNavigation steps={steps} current={step} onChange={setStep} label="表示转换逐步操作"/>
    <div className="enc-toolbar"><div className="enc-choice-group" role="group" aria-label="选择示例内容"><span>配对内容</span>{examples.map((entry, index) => <button type="button" className={`enc-button${sample === index ? ' is-selected' : ''}`} aria-pressed={sample === index} key={entry.name} onClick={() => setSample(index)}>{entry.name}</button>)}</div><span className="enc-quiet">同一个步骤，同时推进两条分支</span></div>
    <div className="enc-branch-switch" role="group" aria-label="选择要观察的分支"><button type="button" aria-pressed={branchView==='image'} onClick={()=>setBranchView('image')}>图像分支</button><button type="button" aria-pressed={branchView==='text'} onClick={()=>setBranchView('text')}>文本分支</button></div>
    <div className="enc-branches" data-active-branch={branchView}>{[0, 1].map(branch => {
      const image = branch === 0;
      const features = image ? example.image : example.text;
      const encoderTex = image ? 'f_I(x)' : 'f_T(c)';
      return <section key={branch} className={`enc-branch ${image ? 'enc-image-branch' : 'enc-text-branch'}`} aria-label={`${image ? '图像' : '文本'}分支，${steps[step]}`}>
        <div className="enc-branch-heading"><span className="enc-branch-mark">{image ? 'I' : 'T'}</span><div><h5>{image ? '图像分支' : '文本分支'}</h5><span>{image ? 'Image encoder' : 'Text encoder'}</span></div><span className="enc-dimension">{step === 0 ? (image ? 'RGB 像素' : '词元序列') : step === 1 ? `${features.length} 维` : '2 维'}</span></div>
        <div className="enc-stage-content" key={`${sample}-${step}`}>
          {step === 0 && (image ? <><SamplePicture car={sample === 1} /><p className="enc-stage-caption">一张{example.name}的图片 · 输入图像编码器</p></> : <><div className="enc-text-input"><span className="enc-quote-mark">“</span><strong>{example.caption}</strong></div><div className="enc-token-list" aria-label="词元仅示意，不代表实际分词结果">{example.tokens.map((token, i) => <span key={i}>{token}</span>)}</div><p className="enc-stage-caption">分词仅示意 · 输入文本编码器</p></>)}
          {step === 1 && <><div className="enc-operation-label"><MathText tex={encoderTex} /><span>独立学习的表示</span></div><NumericVector vector={features} scale={featureScale} /><div className="enc-math-line"><MathText tex={`${encoderTex} = ${rowTex(features)}`} /></div><p className="enc-stage-caption">中线为0；两条分支使用相同刻度，负值向左。</p></>}
          {step === 2 && <><div className="enc-operation-label"><MathText tex={image ? 'W_I f_I(x)' : 'W_T f_T(c)'} /><span>{features.length} 维 → 2 维</span></div><div className="enc-matrix-operation"><MathText tex={matrixTex(image ? imageProjection : textProjection)} /><MathText tex={String.raw`\times`} /><MathText tex={columnTex(features)} /></div><div className="enc-projection-result"><span>投影结果</span><MathText tex={`${image ? 'v' : 'u'} = ${rowTex(projected[branch])}`} /></div></>}
          {step === 3 && <><div className="enc-operation-label"><MathText tex={image ? String.raw`\hat{\mathbf i}=\frac{\mathbf v}{\lVert\mathbf v\rVert_2}` : String.raw`\hat{\mathbf t}=\frac{\mathbf u}{\lVert\mathbf u\rVert_2}`} /><span>长度归一化</span></div><div className="enc-norm-length"><MathText tex={String.raw`\lVert ${image ? 'v' : 'u'}\rVert_2 = \sqrt{${projected[branch].map(value => `(${value})^2`).join('+')}} = ${lengths[branch].toFixed(0)}`} /></div><NumericVector vector={unit[branch]} scale={1} normalized /><div className="enc-math-line"><MathText tex={String.raw`\frac{${rowTex(projected[branch])}}{${lengths[branch].toFixed(0)}} \approx ${rowTex(unit[branch], 3)}`} /></div><div className="enc-unit-check"><span>归一化后</span><MathText tex={String.raw`\lVert\hat{\mathbf ${image ? 'i' : 't'}}\rVert_2 = ${norm(unit[branch]).toFixed(3)}`} /><span>单位向量</span></div></>}
        </div>
      </section>;
    })}</div>
    </div>
    <div className={`enc-observation${step === 3 ? ' enc-observation-complete' : ''}`} aria-live="polite">
      {step === 3 && <svg className="enc-unit-plot" viewBox="0 0 250 230" role="img" aria-label={`两个单位向量的夹角为${angle.toFixed(2)}度`}><line x1="21" y1="115" x2="229" y2="115" stroke="#dce5df" /><line x1="125" y1="11" x2="125" y2="219" stroke="#dce5df" /><circle cx="125" cy="115" r="88" fill="none" stroke="#dce5df" strokeDasharray="4 4" />{unit.map((vector, i) => <g key={i} stroke={i === 0 ? '#5365ad' : '#bd9254'} fill={i === 0 ? '#5365ad' : '#bd9254'}><line x1="125" y1="115" x2={125 + vector[0] * 88} y2={115 - vector[1] * 88} strokeWidth="4" /><circle cx={125 + vector[0] * 88} cy={115 - vector[1] * 88} r="5" /></g>)}<circle cx="125" cy="115" r="3" fill="#172a2b" /><text x="224" y="109" fill="#657572" fontSize="14">1</text></svg>}
      <div><span className="enc-eyebrow">当前观察 · {String(step + 1).padStart(2, '0')}</span><h5>{notes.title}</h5><p>{notes.text}</p>{step === 3 && <div className="enc-result-inline"><span>图像 <i className="enc-legend-dot" /></span><span>文字 <i className="enc-legend-dot is-text" /></span><span>夹角 <b>{angle.toFixed(2)}°</b></span><span>余弦相似度 <b>{similarity.toFixed(4)}</b></span></div>}</div>
    </div>
    <p className="enc-footnote">公式中的上标 T 表示转置，这里用它把横向列出的数值写成列向量。示例特征与投影矩阵为人为设置，维数缩小为4、3、2以便手算；不是CLIP真实提取的特征。真实模型通过训练联合学习编码器与投影。</p>
  </div>;
}
export default Clip02;
