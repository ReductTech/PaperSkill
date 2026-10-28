import { LocalUnitPair } from './local-unit-pair';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import type { WidgetProps } from './registry';
import { MathText } from '../components/MathText';
import { ExperimentStepNavigation } from '../components/ExperimentStepNavigation';
import './encoder-lab.css';
import './encoder-flow.css';
import { AnimatedUnitPair } from './clip-08-vector-motion';
import './training-vector-motion.css';

type Branch = 'image' | 'text';
type NodeId = `${Branch}-${'input' | 'encoder' | 'project' | 'norm'}` | 'matrix' | 'temperature' | 'output';
type Mode = 'train' | 'infer';
const imageAngles = [25, 105, 205, 300];
const textAngles = [30, 115, 210, 290];
const names = ['猫', '狗', '汽车', '椅子'];
const words = ['cat', 'dog', 'car', 'chair'];
const stages = ['输入', '编码', '投影', '归一化', '比较', '输出'];
const percent = (value: number) => value > 0 && value < .001 ? '<0.1%' : value < 1 && value > .999 ? '>99.9%' : (value * 100).toFixed(1) + '%';
const stageIds = ['input', 'encoder', 'project', 'norm'] as const;
const imageProjection = [[1, 0, -.5], [0, 1, .5]];
const textProjection = [[1, 0, 1], [0, 1, -.5]];
const multiply = (matrix: number[][], vector: number[]) => matrix.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0));
const feature = (branch: Branch, index: number) => {
  const angle = (branch === 'image' ? imageAngles : textAngles)[index] * Math.PI / 180;
  return branch === 'image' ? [2 * Math.cos(angle) + .5, 2 * Math.sin(angle) - .5, 1] : [3 * Math.cos(angle) - 1, 3 * Math.sin(angle) + .5, 1];
};
const projected = (branch: Branch, index: number) => multiply(branch === 'image' ? imageProjection : textProjection, feature(branch, index));
const unit = (branch: Branch, index: number) => { const vector = projected(branch, index); const length = Math.hypot(...vector); return vector.map(value => value / length); };
const dot = (a: number[], b: number[]) => { const value = a.reduce((sum, part, i) => sum + part * b[i], 0); return Math.abs(value) < 1e-12 ? 0 : value; };
const logSumExp = (values: number[]) => { const maximum = Math.max(...values); return maximum + Math.log(values.reduce((sum, value) => sum + Math.exp(value - maximum), 0)); };
const vectorTex = (vector: number[]) => String.raw`\left[${vector.map(value => value.toFixed(2)).join(String.raw`,\,`)}\right]^{\mathsf{T}}`;
const matrixTex = (matrix: number[][]) => String.raw`\begin{bmatrix}${matrix.map(row => row.join(' & ')).join(String.raw`\\`)}\end{bmatrix}`;

function Picture({ index }: { index: number }) {
  return <svg viewBox="0 0 64 48" aria-hidden="true"><rect x="1" y="1" width="62" height="46" rx="9" fill="#e6efe5" /><path d="M2 36Q19 24 36 35T63 33V46H2Z" fill="#d4e3d2" />{index === 0 ? <g fill="#edbe89" stroke="#536c5b" strokeWidth="1.7"><path d="M19 21L19 10L28 17L37 17L46 10L46 22Q50 37 33 39Q16 38 19 21Z" /><path d="M25 25H28M38 25H41M31 30H35" /></g> : index === 1 ? <g fill="#dca773" stroke="#536c5b" strokeWidth="1.7"><ellipse cx="33" cy="26" rx="13" ry="14" /><path d="M23 15Q12 13 15 32L22 29M42 15Q52 13 50 32L43 29" /><path d="M26 25H28M38 25H40M31 31H35" /></g> : index === 2 ? <g stroke="#536c5b" strokeWidth="1.7"><path d="M10 28L18 25L25 15H40L48 25L55 28V36H10Z" fill="#fff" /><path d="M23 25L28 18H37L42 25Z" fill="#a8cfc4" /><circle cx="22" cy="36" r="5" fill="#536c5b" /><circle cx="45" cy="36" r="5" fill="#536c5b" /></g> : <g fill="#e4b27b" stroke="#536c5b" strokeWidth="2"><path d="M22 10H43V27H22Z" /><path d="M18 27H47V33H18ZM22 33V42M43 33V42" /></g>}</svg>;
}

function VectorBars({ values, branch, ready }: { values: number[]; branch: Branch; ready: boolean }) {
  return <div className={`enc-flow-bars${ready ? '' : ' is-waiting'}`} aria-hidden="true">{values.map((value, i) => <div className="enc-flow-bar-row" key={i}><span>{i + 1}</span><div><i style={{ left: `${value < 0 ? 50 + value / 4.2 * 50 : 50}%`, width: `${Math.abs(value) / 4.2 * 50}%`, background: branch === 'image' ? '#5365ad' : '#bd9254' }} /></div><b>{ready ? value.toFixed(2) : '—'}</b></div>)}</div>;
}

export function Clip08({ chapterId, moduleId }: WidgetProps) {
  const uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState<Mode>('infer');
  const [batch, setBatch] = useState(3);
  const [images, setImages] = useState(2);
  const [classes, setClasses] = useState(3);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const detailOrigin = useRef<HTMLButtonElement | null>(null);
  const detailId = 'encoder-detail-' + uid;
  const closeDetail = () => {
    setSelected(null);
    if (detailOrigin.current?.isConnected) detailOrigin.current.focus({ preventScroll: true });
  };
  const detailTriggerProps = (node: NodeId) => ({
    'aria-expanded': selected === node,
    'aria-controls': detailId,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (selected === node) { closeDetail(); return; }
      detailOrigin.current = event.currentTarget;
      setSelected(node);
    },
  });
  useEffect(() => {
    if (!selected || !detailRef.current) return;
    const panel = detailRef.current;
    panel.focus({ preventScroll: true });
    const bar = panel.closest('.enc-focus-workbench')?.querySelector<HTMLElement>('.experiment-step-nav');
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const barHeight = bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().height + 8 : 0;
    const protectedTop = headerHeight + barHeight + 16;
    const rect = panel.getBoundingClientRect();
    panel.style.scrollMarginTop = protectedTop + 'px';
    if (rect.top < protectedTop || rect.bottom > window.innerHeight - 16) {
      panel.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [selected]);
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const [step, setStep] = useState(0);
  const [branchView,setBranchView]=useState<Branch>('image');
  const training = mode === 'train';
  const rows = training ? batch : images;
  const columns = training ? batch : classes;
  const rowIndex = Math.min(cell[0], rows - 1);
  const colIndex = Math.min(cell[1], columns - 1);
  const scores = Array.from({ length: rows }, (_, i) => Array.from({ length: columns }, (_, j) => dot(unit('image', i), unit('text', j))));
  const tau = .2;
  const logits = scores.map(row => row.map(value => value / tau));
  const imageLoss = training ? logits.reduce((sum, row, i) => sum + logSumExp(row) - row[i], 0) / rows : 0;
  const textLoss = training ? logits[0].reduce((sum, _, j) => { const column = logits.map(row => row[j]); return sum + logSumExp(column) - column[j]; }, 0) / columns : 0;
  const predictions = scores.map(row => row.indexOf(Math.max(...row)));
  const probabilities = logits[rowIndex].map(value => Math.exp(value - logSumExp(logits[rowIndex])));
  const selectedScore = scores[rowIndex][colIndex];
  const pairAngle = Math.acos(Math.max(-1, Math.min(1, selectedScore))) * 180 / Math.PI;
  const moveTo = (next: number) => { setStep(next); setSelected(null); };
  const switchMode = (next: Mode) => { setMode(next); setCell([0, 0]); setStep(0); setSelected(null);  };
  const instructions = [
    `两种输入分别进入自己的分支。当前有 ${rows} 张图片、${columns} ${training ? '段配套文字' : '个候选类别描述'}。`,
    '编码器把输入变成特征。色条显示当前选中样本的示意特征，左侧表示负值，右侧表示正值。',
    '两个独立投影把特征映射到同一空间。下方数值由示例矩阵相乘得到，并非真实编码器输出。',
    '每个向量除以自己的长度；单位圆上的位置保留方向。相近的图文方向对应较高相似度。',
    `所有图像向量与所有文本向量逐一做点积，得到 ${rows} × ${columns} 矩阵。点击格子，把一对向量连起来看。`,
    training ? '按行、按列计算交叉熵并平均。这里算出示例损失，展示学习目标；没有执行模型参数更新。' : '每行经温度缩放并比较分数，选出一个候选类别。这里不更新模型参数；正温度不会改变排序。',
  ];
  const detailFor = (id: NodeId) => {
    const branch: Branch = id.startsWith('text') ? 'text' : 'image';
    const index = branch === 'image' ? rowIndex : colIndex;
    const prefix = branch === 'image' ? 'I' : 'T';
    const n = branch === 'image' ? rows : columns;
    const branchName = branch === 'image' ? '图像' : '文本';
    if (id.endsWith('input')) return { title: `${branchName}输入`, tex: `${training ? 'N' : branch === 'image' ? 'B' : 'K'}=${n}`, text: branch === 'image' ? '图片先经过预处理，再送入图像编码器。选中样本会贯穿整条路径；圆形标记始终表示图像。' : training ? '每段文字与同序号图片构成原始配对；同批其他文字作为比较对象。菱形标记始终表示文本。' : '类别名称放入“a photo of a …”等提示模板后编码。文本向量可预先计算并复用。', note: '输入数据本身没有可训练参数。' };
    if (id.endsWith('encoder')) return { title: `${branchName}编码器`, tex: String.raw`\mathbf{h}_{${prefix}}=${vectorTex(feature(branch, index))}`, text: branch === 'image' ? '真实 CLIP 使用 ResNet 或 ViT 提取图像特征。这里直接给定一个3维示例特征，让后面的运算可追踪。' : '真实文本分支经过分词、词嵌入与 Transformer，产生整段描述的表示。这里直接给定3维示例特征，不执行语言生成。', note: training ? '真实预训练会联合更新两个编码器、两个投影和温度参数。' : '零样本使用时编码器参数保持固定。' };
    if (id.endsWith('project')) return { title: `${branchName}线性投影`, tex: String.raw`W_{${prefix}}=${matrixTex(branch === 'image' ? imageProjection : textProjection)},\quad W_{${prefix}}\mathbf{h}_{${prefix}}=${vectorTex(projected(branch, index))}`, text: '这里用独立的 2×3 示例矩阵把3维特征变成2维。映射到同维空间只是比较的条件，语义对齐需要配对训练。', note: training ? '真实预训练时投影矩阵可学习；本演示固定矩阵，不模拟参数优化。' : '零样本使用时投影矩阵保持固定。' };
    if (id.endsWith('norm')) return { title: `${branchName} L2 归一化`, tex: String.raw`\frac{${vectorTex(projected(branch, index))}}{${Math.hypot(...projected(branch, index)).toFixed(2)}}=${vectorTex(unit(branch, index))}`, text: '非零向量除以自身长度后，长度变成1，方向不变。单位圆同时显示所有当前样本；当前选中组合用实线连接到原点。', note: '归一化没有独立参数；训练时梯度仍能经过它回传。显示数值四舍五入，计算使用完整精度。' };
    if (id === 'matrix') return { title: `图片 I${rowIndex + 1} × 文本 T${colIndex + 1}`, tex: String.raw`s_{${rowIndex + 1},${colIndex + 1}}=\hat{\mathbf{i}}_{${rowIndex + 1}}^{\mathsf{T}}\hat{\mathbf{t}}_{${colIndex + 1}}=\cos(${pairAngle.toFixed(1)}^\circ)\approx ${selectedScore.toFixed(3)}`, text: training ? '矩阵每格来自一个图文组合。靛蓝边框标出同序号原始配对；双向损失会同时比较每一行与每一列。' : `图片 I${rowIndex + 1} 在当前候选中，最高分是 T${predictions[rowIndex] + 1}（${names[predictions[rowIndex]]}）。增加候选后，原来的相似度不变，但概率分母和可选类别会改变。`, note: `当前比较 ${rows * columns} 个图文组合。所有点积都来自图中显示的二维单位向量。` };
    if (id === 'temperature') return { title: '正温度缩放', tex: String.raw`\tau=e^{-t}>0,\quad z_{${rowIndex + 1},${colIndex + 1}}=\frac{${selectedScore.toFixed(3)}}{${tau}}\approx ${(selectedScore / tau).toFixed(3)}`, text: '原论文学习对数缩放参数 t，再通过指数保证缩放为正。这里固定温度 0.2；它改变 Softmax 集中程度，不改变相似度排序。', note: training ? '真实预训练会学习此标量参数，本演示只做固定温度的前向计算。' : '使用预训练得到的缩放参数，整个预测过程不更新参数。' };
    return { title: training ? '双向交叉熵' : '逐行零样本预测', tex: training ? String.raw`\mathcal L=\frac{${imageLoss.toFixed(4)}+${textLoss.toFixed(4)}}{2}\approx ${((imageLoss + textLoss) / 2).toFixed(4)}` : String.raw`\hat{y}_{i}=\underset{k}{\operatorname{argmax}}\;s_{ik}`, text: training ? '按行让图片找到原配文字，按列让文字找到原配图片，再平均两个方向。在真实训练中，该损失通过反向传播更新编码器、投影与温度。' : '每张图片在候选类别中取最高分，不需要另训练分类头。若真实类别不在候选里，模型仍会选出一个最高分项。', note: training ? '此处只计算教学示例损失；这个演示不是模型训练过程。' : '这里的概率只是在当前候选集合中的相对分配，不代表经过校准的真实正确率。' };
  };
  const detailPanel = selected ? (() => { const detail = detailFor(selected); return <section ref={detailRef} id={detailId} className="enc-flow-detail" aria-label="节点详情" tabIndex={-1} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeDetail(); } }}><div><h5>{detail.title}</h5><button type="button" className="enc-flow-close" onClick={closeDetail} aria-label="关闭节点详情">收起 ×</button></div><MathText tex={detail.tex} display explanation={detail.text} /><p>{detail.text}</p><small>{detail.note}</small></section>; })() : null;
  const cx = 180, cy = 162, radius = 118;
  const position = (branch: Branch, index: number) => { const [x, y] = unit(branch, index); return { x: cx + x * radius, y: cy - y * radius }; };

  const countControls = <div className="enc-count-controls">{(training ? [{ name: '配对数 N', value: batch, set: setBatch }] : [{ name: '图片数 B', value: images, set: setImages }, { name: '候选数 K', value: classes, set: setClasses }]).map(control => <div className="enc-counter" key={control.name}><span>{control.name}</span><button type="button" aria-label={`减少${control.name}`} disabled={control.value === 2} onClick={() => { control.set(current => current - 1); setCell([0, 0]); setStep(current => Math.max(current, 4)); setSelected(null); }}>−</button><output>{control.value}</output><button type="button" aria-label={`增加${control.name}`} disabled={control.value === 4} onClick={() => { control.set(current => current + 1); setCell([0, 0]); setStep(current => Math.max(current, 4)); setSelected(null); }}>+</button></div>)}<div className="enc-shape-summary"><MathText tex={training ? String.raw`N\times N` : String.raw`B\times K`} /><span>=</span><b>{rows} × {columns}</b></div></div>;
  const sampleControls = <div className="enc-stage-samples"><label><span>追踪图片</span><select aria-label="追踪图片" value={rowIndex} onChange={event=>{setCell([Number(event.target.value),colIndex]);setBranchView('image');setSelected(null);}}>{Array.from({length:rows},(_,i)=><option key={i} value={i}>I{i+1} · {names[i]}</option>)}</select></label>{step!==5 && <label><span>{training?'配套文字':'候选描述'}</span><select aria-label="追踪文本" value={colIndex} onChange={event=>{setCell([rowIndex,Number(event.target.value)]);setBranchView('text');setSelected(null);}}>{Array.from({length:columns},(_,i)=><option key={i} value={i}>T{i+1} · {names[i]}</option>)}</select></label>}</div>;
  const normCards = <div className="enc-normalized-cards">{(['image','text'] as const).map(branch=>{const index=branch==='image'?rowIndex:colIndex;return <div key={branch} className={`enc-stage-result is-${branch}`}><span>{branch==='image'?'图像':'文本'} · {branch==='image'?'I':'T'}{index+1}</span><MathText display tex={vectorTex(unit(branch,index))}/><small>长度 = 1 · 保留方向</small><button type="button" className="enc-detail-trigger" {...detailTriggerProps(`${branch}-norm`)}>查看归一化计算 <span>↗</span></button></div>})}</div>;
  return <div className="enc-lab enc-flow-lab enc-focus-lab" data-widget={`${chapterId}-${moduleId}`} data-flow-step={step} onKeyDown={event=>{if(event.key.startsWith('Arrow'))event.stopPropagation();}}>
    <div className="enc-lab-topline"><span className="enc-eyebrow">双塔结构 · 点选一步，看一次变化</span><span className="enc-boundary">二维教学示例</span></div>
    <div className="enc-toolbar"><div className="enc-choice-group" role="group" aria-label="模型阶段"><button type="button" className={`enc-button${training?' is-selected':''}`} aria-pressed={training} onClick={()=>switchMode('train')}>预训练</button><button type="button" className={`enc-button${!training?' is-selected':''}`} aria-pressed={!training} onClick={()=>switchMode('infer')}>零样本使用</button></div><span className="enc-phase-note">{training?'预训练目标示意 · 本页不更新参数':'模型参数固定'}</span></div>
    <div className="enc-focus-workbench">
      <nav className="enc-flow-timeline" aria-label="数据流步骤">{stages.map((title,index)=><button type="button" key={title} className={step===index?'is-current':''} aria-current={step===index?'step':undefined} onClick={()=>moveTo(index)}><span>{String(index+1).padStart(2,'0')}</span><strong>{title}</strong></button>)}</nav>
      <ExperimentStepNavigation steps={stages} current={step} onChange={moveTo} label="双塔结构逐步操作"/>
      <div className="enc-focus-tools">{step>=4?countControls:sampleControls}</div>
      {step<3 && <div className="enc-branch-switch" role="group" aria-label="选择要观察的分支"><button type="button" aria-pressed={branchView==='image'} onClick={()=>setBranchView('image')}>图像分支</button><button type="button" aria-pressed={branchView==='text'} onClick={()=>setBranchView('text')}>文本分支</button></div>}
      <div className="enc-focus-stage" key={step}>
        {step<3 && <div className="enc-stage-pair" data-active-branch={branchView}>{(['image','text'] as const).map(branch=>{const index=branch==='image'?rowIndex:colIndex;const n=branch==='image'?rows:columns;const stage=stageIds[step];return <section key={branch} className={`enc-stage-result is-${branch}`} aria-label={`${branch==='image'?'图像':'文本'}计算路径`}><header><span className="enc-flow-branch-dot"/><h5>{branch==='image'?'图像分支':'文本分支'}</h5><small>{branch==='image'?'I':'T'}{index+1} · {names[index]}</small></header>{step===0?<div className="enc-focus-input">{branch==='image'?<Picture index={index}/>:<><span className="enc-input-type">Aa</span><strong>a photo of a {words[index]}</strong><div className="enc-focus-tokens">{['a','photo','of','a',words[index]].map((word,i)=><span key={i}>{word}</span>)}</div></>}<small>{n} {branch==='image'?'张图片 · 像素输入':'段描述 · 分词仅示意'}</small></div>:<><div className="enc-focus-transform"><span>{step===1?branch==='image'?'ResNet / ViT':'Transformer':'独立线性映射'}</span><b>{step===1?'3 维特征':'3 维 → 2 维'}</b></div><VectorBars branch={branch} values={step===1?feature(branch,index):projected(branch,index)} ready/><MathText display tex={vectorTex(step===1?feature(branch,index):projected(branch,index))}/></>}<button type="button" className="enc-detail-trigger" {...detailTriggerProps(`${branch}-${stage}`)}>查看{step===0?'输入说明':step===1?'编码说明':'投影计算'} <span>↗</span></button></section>})}</div>}
        {step===3 && <div className="enc-flow-comparison"><section className="enc-flow-space" aria-label="共享空间中的图文向量"><div className="enc-flow-section-heading"><h5>同一空间，看方向</h5><span className="enc-flow-live-label">{step >= 3 ? '归一化完成' : '等待归一化'}</span></div><div className="enc-space-plot"><svg className="enc-space-svg" viewBox="0 0 360 332" role="group" aria-label={step >= 3 ? `二维单位圆，当前图片I${rowIndex + 1}和文本T${colIndex + 1}夹角${pairAngle.toFixed(1)}度，余弦相似度${selectedScore.toFixed(3)}` : '单位圆等待归一化向量；推进到第四步查看'}><defs><marker id={`${uid}-image-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#5365ad" /></marker><marker id={`${uid}-text-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#bd9254" /></marker></defs><path d="M20 162H340M180 13V311" stroke="#dddfe5" /><circle cx={cx} cy={cy} r={radius} fill="#fcfbf8" stroke="#d4d8e2" strokeDasharray="4 5" /><g className={`enc-space-vectors${step >= 3 ? ' is-visible' : ''}`} aria-hidden={step < 3}><AnimatedUnitPair imageAngle={imageAngles[rowIndex]} textAngle={textAngles[colIndex]} uid={uid} projection={false}/>{(['image', 'text'] as const).flatMap(branch => Array.from({ length: branch === 'image' ? rows : columns }, (_, index) => {
      const point = position(branch, index); const tracked = branch === 'image' ? index === rowIndex : index === colIndex;
      return <g key={`${branch}${index}`} className={`enc-space-point is-${branch}${tracked ? ' is-tracked' : ''}`} role="button" tabIndex={step >= 3 ? 0 : -1} aria-label={`追踪${branch === 'image' ? '图片' : '文本'}${index + 1}：${names[index]}`} onClick={() => { if (step < 3) return; setCell(branch === 'image' ? [index, colIndex] : [rowIndex, index]);  }} onKeyDown={event => { if (step >= 3 && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setCell(branch === 'image' ? [index, colIndex] : [rowIndex, index]);  } }}><circle cx={point.x} cy={point.y} r="15" fill="transparent" />{branch === 'image' ? <circle cx={point.x} cy={point.y} r={tracked ? 7 : 5} fill="#5365ad" stroke="white" strokeWidth="2" /> : <path d={`M${point.x} ${point.y - 8}l8 8-8 8-8-8Z`} fill="#bd9254" stroke="white" strokeWidth="2" />}</g>;
    }))}</g></svg><span className="enc-space-label is-axis" style={{ left: '87%', top: '45%' }} aria-hidden="true">1</span><span className="enc-space-label is-axis" style={{ left: '54%', top: '10%' }} aria-hidden="true">1</span><span className="enc-space-label is-axis" style={{ left: '54%', top: '54%' }} aria-hidden="true">0</span>{step >= 3 && (['image', 'text'] as const).flatMap(branch => Array.from({ length: branch === 'image' ? rows : columns }, (_, index) => { const [x, y] = unit(branch, index); const labelRadius = radius + (branch === 'image' ? 18 : -21); return <span aria-hidden="true" key={`label-${branch}${index}`} className={`enc-space-label is-${branch}`} style={{ left: ((cx + x * labelRadius) / 360 * 100) + '%', top: ((cy - y * labelRadius) / 332 * 100) + '%' }}>{branch === 'image' ? 'I' : 'T'}{index + 1}</span>; }))}{step < 3 && <div className="enc-space-empty"><strong>两条路径在这里对齐</strong><button type="button" className="enc-button" onClick={() => moveTo(3)}>查看归一化向量</button></div>}</div><div className="enc-flow-pair-readout"><span>● I{rowIndex + 1}（{names[rowIndex]}）</span><span>◆ T{colIndex + 1}（{names[colIndex]}）</span><strong>{step >= 3 ? `${pairAngle.toFixed(1)}° · 相似度 ${selectedScore.toFixed(3)}` : '逐步生成 → 投影 → 归一化'}</strong></div></section>{normCards}</div>}
        {step===4 && <div className="enc-flow-comparison"><section className="enc-flow-space" aria-label="共享空间中的图文向量"><div className="enc-flow-section-heading"><h5>同一空间，看方向</h5><span className="enc-flow-live-label">{step >= 3 ? '归一化完成' : '等待归一化'}</span></div><div className="enc-space-plot"><svg className="enc-space-svg" viewBox="0 0 360 332" role="group" aria-label={step >= 3 ? `二维单位圆，当前图片I${rowIndex + 1}和文本T${colIndex + 1}夹角${pairAngle.toFixed(1)}度，余弦相似度${selectedScore.toFixed(3)}` : '单位圆等待归一化向量；推进到第四步查看'}><defs><marker id={`${uid}-image-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#5365ad" /></marker><marker id={`${uid}-text-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#bd9254" /></marker></defs><path d="M20 162H340M180 13V311" stroke="#dddfe5" /><circle cx={cx} cy={cy} r={radius} fill="#fcfbf8" stroke="#d4d8e2" strokeDasharray="4 5" /><g className={`enc-space-vectors${step >= 3 ? ' is-visible' : ''}`} aria-hidden={step < 3}><AnimatedUnitPair imageAngle={imageAngles[rowIndex]} textAngle={textAngles[colIndex]} uid={uid} projection={true}/>{(['image', 'text'] as const).flatMap(branch => Array.from({ length: branch === 'image' ? rows : columns }, (_, index) => {
      const point = position(branch, index); const tracked = branch === 'image' ? index === rowIndex : index === colIndex;
      return <g key={`${branch}${index}`} className={`enc-space-point is-${branch}${tracked ? ' is-tracked' : ''}`} role="button" tabIndex={step >= 3 ? 0 : -1} aria-label={`追踪${branch === 'image' ? '图片' : '文本'}${index + 1}：${names[index]}`} onClick={() => { if (step < 3) return; setCell(branch === 'image' ? [index, colIndex] : [rowIndex, index]);  }} onKeyDown={event => { if (step >= 3 && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setCell(branch === 'image' ? [index, colIndex] : [rowIndex, index]);  } }}><circle cx={point.x} cy={point.y} r="15" fill="transparent" />{branch === 'image' ? <circle cx={point.x} cy={point.y} r={tracked ? 7 : 5} fill="#5365ad" stroke="white" strokeWidth="2" /> : <path d={`M${point.x} ${point.y - 8}l8 8-8 8-8-8Z`} fill="#bd9254" stroke="white" strokeWidth="2" />}</g>;
    }))}</g></svg><span className="enc-space-label is-axis" style={{ left: '87%', top: '45%' }} aria-hidden="true">1</span><span className="enc-space-label is-axis" style={{ left: '54%', top: '10%' }} aria-hidden="true">1</span><span className="enc-space-label is-axis" style={{ left: '54%', top: '54%' }} aria-hidden="true">0</span>{step >= 3 && (['image', 'text'] as const).flatMap(branch => Array.from({ length: branch === 'image' ? rows : columns }, (_, index) => { const [x, y] = unit(branch, index); const labelRadius = radius + (branch === 'image' ? 18 : -21); return <span aria-hidden="true" key={`label-${branch}${index}`} className={`enc-space-label is-${branch}`} style={{ left: ((cx + x * labelRadius) / 360 * 100) + '%', top: ((cy - y * labelRadius) / 332 * 100) + '%' }}>{branch === 'image' ? 'I' : 'T'}{index + 1}</span>; }))}{step < 3 && <div className="enc-space-empty"><strong>两条路径在这里对齐</strong><button type="button" className="enc-button" onClick={() => moveTo(3)}>查看归一化向量</button></div>}</div><div className="enc-flow-pair-readout"><span>● I{rowIndex + 1}（{names[rowIndex]}）</span><span>◆ T{colIndex + 1}（{names[colIndex]}）</span><strong>{step >= 3 ? `${pairAngle.toFixed(1)}° · 相似度 ${selectedScore.toFixed(3)}` : '逐步生成 → 投影 → 归一化'}</strong></div><p className="enc-projection-guide"><i aria-hidden="true"/><span>空心点是文本向量在图像方向上的投影。投影越靠近图像箭头，相似度越接近 1；落在反方向则为负。</span></p></section><section className="enc-flow-matrix-panel" aria-label="图文相似度矩阵"><div className="enc-flow-section-heading"><h5>逐对比较</h5><MathText tex={String.raw`S=IT^{\mathsf{T}}`}/></div><div className="enc-score-matrix" style={{gridTemplateColumns:`28px repeat(${columns},minmax(38px,1fr))`}}><span/>{Array.from({length:columns},(_,j)=><span className={`enc-matrix-label${colIndex===j?' is-tracked':''}`} data-branch="text" key={j}>T{j+1}</span>)}{scores.map((row,i)=><div className="enc-matrix-row" key={i}><span className={`enc-matrix-label${rowIndex===i?' is-tracked':''}`} data-branch="image">I{i+1}</span>{row.map((value,j)=><button type="button" key={j} aria-label={`选择图片${i+1}和${training?'文字':'类别'}${j+1}，相似度${value.toFixed(3)}${training&&i===j?'，原始配对':''}`} aria-pressed={rowIndex===i&&colIndex===j} className={`enc-score-cell is-computed${training&&i===j?' is-diagonal':''}${rowIndex===i&&colIndex===j?' is-selected':''}`} style={{backgroundColor:value>=0?`rgba(83,101,173,${.06+value*.2})`:`rgba(189,146,84,${.06-value*.12})`}} onClick={()=>{setCell([i,j]);setSelected(null);}}>{value.toFixed(2)}</button>)}</div>)}</div><div className="enc-local-readout" aria-live="polite"><span>I{rowIndex+1} · {names[rowIndex]} <i>×</i> T{colIndex+1} · {names[colIndex]}</span><LocalUnitPair imageAngle={imageAngles[rowIndex]} textAngle={textAngles[colIndex]} uid={uid+"-local"}/><strong>{selectedScore.toFixed(3)}<small>夹角 {pairAngle.toFixed(1)}°</small></strong><div className="enc-projection-scale" aria-hidden="true"><div><i style={{left:`${(selectedScore+1)*50}%`}}/></div><span><em>−1 · 反向</em><em>0</em><em>1 · 同向</em></span></div></div><p className="enc-flow-matrix-caption">{training?'靛蓝边框为原始配对。点选格子，对照图中向量。':'点选一个格子，图中方向与这里的读数一起变化。'}</p><button type="button" className="enc-detail-trigger" {...detailTriggerProps('matrix')}>查看这一次点积 <span>↗</span></button></section></div>}
        {step===5 && <section className="enc-output-stage" aria-label={training?'双向损失输出':'零样本预测输出'}><div className="enc-output-summary"><span>{training?'同一组图文，两个检索方向':'每张图片，选择最相似的候选'}</span><h5>{training?'双向交叉熵':'零样本预测'}</h5>{training?<strong className="enc-output-value">{((imageLoss+textLoss)/2).toFixed(4)}<small>示例损失 L</small></strong>:<div className="enc-output-winner"><Picture index={rowIndex}/><span>I{rowIndex+1} · {names[rowIndex]}<b>→ {names[predictions[rowIndex]]}</b></span></div>}{!training && sampleControls}</div><div className="enc-output-distribution">{training?<><div className="enc-loss-direction"><span>图片 → 文字</span><b>{imageLoss.toFixed(4)}</b></div><div className="enc-loss-direction"><span>文字 → 图片</span><b>{textLoss.toFixed(4)}</b></div><p>按行、按列计算交叉熵，再取平均。这里没有执行参数更新。</p></>:<div className="enc-flow-probabilities" aria-label={`图片${rowIndex+1}的候选概率`}>{probabilities.map((probability,j)=><div key={j}><span>{names[j]}</span><div><i style={{width:`${probability*100}%`}}/></div><b>{percent(probability)}</b></div>)}<p>{predictions.map((p,i)=>`I${i+1} → ${names[p]}`).join('　·　')}</p></div>}<button type="button" className="enc-detail-trigger" {...detailTriggerProps('temperature')}>温度缩放 <MathText tex="Z=S/0.2"/><span>↗</span></button><button type="button" className="enc-detail-trigger" {...detailTriggerProps('output')}>查看{training?'损失':'预测'}原理 <span>↗</span></button></div><div className="enc-output-formula"><MathText display tex={training?String.raw`\mathcal{L}=\frac{${imageLoss.toFixed(4)}+${textLoss.toFixed(4)}}{2}`:String.raw`\hat y_i=\operatorname*{argmax}_{k}\;s_{ik}`}/></div></section>}
      </div>
      {detailPanel}
      <p className="enc-flow-instruction" aria-live="polite"><b>{String(step+1).padStart(2,'0')} / {stages[step]}</b>{instructions[step]}</p>
    </div>
    <p className="enc-footnote">色条、单位圆、相似度与损失来自同一组固定示例向量。实际 CLIP 维数更高；这里的3维与2维只为看清计算，图文方向并非在演示中学到。候选概率不是现实正确率。</p>
  </div>;
}
