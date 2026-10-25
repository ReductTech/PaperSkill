import React, { useState } from 'react';
import type { WidgetProps } from './widgetTypes';
import { useLesson, type Segment } from './lessonState';
import { modes, type Metric } from './resultsLabs';

const Badge = ({ children }: { children: React.ReactNode }) => <span className="vl-badge">依据 · {children}</span>;
const Feedback = ({ children }: { children: React.ReactNode }) => <div className="vl-readout" aria-live="polite">{children}</div>;
const Tabs = ({ items, value, choose }: { items: string[]; value: string; choose: (item: string) => void }) =>
  <div className="vl-choices">{items.map(item => <button type="button" key={item} className={item === value ? 'selected' : ''} onClick={() => choose(item)}>{item}</button>)}</div>;

export function MpegDecompositionLab({ onEvidenceFocus }: WidgetProps) {
  const frames = ['I', 'P', 'P', 'P', 'I', 'P'];
  const [frame, setFrame] = useState(1);
  const [block, setBlock] = useState(0);
  const blockX = 39 + (block % 4) * 7;
  const blockY = 35 + Math.floor(block / 4) * 9;
  const motionX = frame % 2 ? 30 : -30;
  const motionY = frame % 3 ? 12 : -12;
  return <div className="vl-lab">
    <Badge>Figure 2</Badge>
    <div className="vl-film compact">{frames.map((kind, index) => <button type="button" key={index} className={(frame === index ? 'selected ' : '') + (kind === 'I' ? 'keyframe' : '')} data-focus={kind === 'I' ? 0 : 1} onClick={() => { setFrame(index); onEvidenceFocus?.(kind === 'I' ? 0 : 1); }}><b>{kind}</b><small>帧 {index + 1}</small></button>)}</div>
    <div className="vl-mini-grid">{Array.from({ length: 16 }, (_, index) => <button type="button" key={index} className={block === index ? 'selected' : ''} data-focus="1" aria-label={'宏块 ' + (index + 1)} onClick={() => { setBlock(index); onEvidenceFocus?.(1); }}>{frames[frame] === 'I' ? '▣' : '↗'}</button>)}</div>
    <div className={'vl-motion-preview ' + (frames[frame] === 'I' ? 'iframe' : 'pframe')} aria-label="选中宏块的画面位置教学动画"><div className="vl-motion-preview-grid"/>{frames[frame] === 'P' && <span className="vl-motion-ghost" style={{ left: `${blockX}%`, top: `${blockY}%` }}/>}<span className="vl-motion-target" aria-hidden="true" style={{ left: `${blockX}%`, top: `${blockY}%`, '--motion-x': `${motionX}px`, '--motion-y': `${motionY}px` } as React.CSSProperties}/><small>{frames[frame] === 'I' ? 'I-frame · 选中宏块位于画面中央区域' : 'P-frame · 实框相对虚线参考框往返移动（教学模拟）'}</small></div>
    <Feedback>{frames[frame] === 'I' ? '当前是 I-frame：宏块 ' + (block + 1) + ' 的外观由关键帧直接提供。' : '当前是 P-frame：选中宏块 ' + (block + 1) + '，运动向量描述它相对前一画面的位移。'}论文直接利用压缩流中的信号。</Feedback>
  </div>;
}

export function VisualBudgetLab() {
  const [frames, setFrames] = useState(1);
  const [view, setView] = useState('输出长度');
  const lesson = useLesson();
  const change = (value: number) => { setFrames(value); lesson.setVisualFrames(value); };
  return <div className="vl-lab">
    <Badge>Appendix A.1</Badge>
    <label className="vl-range">关键帧数量（示意）<input type="range" min="1" max="6" value={frames} onChange={event => change(Number(event.target.value))}/><strong>{frames}</strong></label>
    <Tabs items={['输出长度', '词表容量']} value={view} choose={setView}/>
    <div className="vl-budget-number">{view === '输出长度' ? '≈ ' + frames * 90 : '16,384'}<small>{view === '输出长度' ? 'visual content tokens' : '种可选 code ID'}</small></div>
    <div className="vl-frame-budget" aria-label="关键帧输出 token 数教学示意">{Array.from({ length: frames }, (_, index) => <div key={index}><span>帧 {index + 1}</span><i style={{ width: view === '输出长度' ? '100%' : '35%' }}/><b>{view === '输出长度' ? '≈90' : '码字选择'}</b></div>)}</div>
    <Feedback>{view === '输出长度' ? '论文报告每张 keyframe 平均约 90 个 visual tokens；' + frames + ' 张的合计是教学估算。' : '16,384 是视觉 codebook 的容量，不是每帧输出 16,384 个 token。'}</Feedback>
  </div>;
}

export function VisualPipelineLab({ onEvidenceFocus }: WidgetProps) {
  const stages = ['224×224 keyframe', 'EVA-CLIP 特征', 'LaVIT 视觉 tokenizer', '约 90 visual tokens'];
  const [stage, setStage] = useState(0);
  const [region, setRegion] = useState(0);
  return <div className="vl-lab">
    <Badge>Figure 2 / Appendix A.1</Badge>
    <div className="vl-pipeline">{stages.map((name, index) => <button type="button" key={name} className={stage === index ? 'selected' : ''} onClick={() => { setStage(index); onEvidenceFocus?.(index < 2 ? 0 : 1); }}><span>{index + 1}</span>{name}</button>)}</div>
    <div className={'vl-visual-region stage-' + stage}><div className="vl-image-tile">🌄<span className="vl-image-scan" style={{ left: `${region % 2 * 50}%`, top: `${Math.floor(region / 2) * 50}%` }}/></div><div className="vl-mini-grid">{Array.from({ length: 4 }, (_, index) => <button type="button" key={index} className={region === index ? 'selected' : ''} aria-label={'示意区域 ' + (index + 1)} onClick={() => { setRegion(index); onEvidenceFocus?.(0); }}>▣</button>)}</div><div className="vl-token-cloud">{Array.from({ length: 12 }, (_, index) => <i key={index} className={index % 4 === region ? 'active' : ''}/>)}</div></div>
    <Feedback>当前阶段：{stages[stage]}；选中示意区域 {region + 1}。区域方格仅帮助观察关键帧细节，不能解释为真实 tokenizer 的逐区域输出。</Feedback>
  </div>;
}

export function MotionFoldingLab({ onEvidenceFocus }: WidgetProps) {
  const stages = ['24×20×36×2 输入', '12 层时空 Transformer', '3×9×5 latent 网格', '135 motion tokens'];
  const [stage, setStage] = useState(0);
  const [layer, setLayer] = useState(3);
  const downsample = [3, 6, 9, 12].includes(layer);
  return <div className="vl-lab">
    <Badge>Figure 2 / Appendix A.1</Badge>
    <div className="vl-stepper"><button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)}>← 上一步</button><div>{stages.map((_, index) => <button type="button" key={index} className={stage === index ? 'selected' : ''} onClick={() => { setStage(index); onEvidenceFocus?.(index < 2 ? 0 : 1); }}>{index + 1}</button>)}</div><button type="button" disabled={stage === 3} onClick={() => setStage(stage + 1)}>下一步 →</button></div>
    <div className="vl-fold-heading"><strong>当前张量</strong><span>{stages[stage]}</span></div>
    <div className="vl-fold-grid" style={{ gridTemplateColumns: 'repeat(' + (stage < 2 ? 12 : 9) + ',1fr)' }}>{Array.from({ length: stage < 2 ? 72 : stage === 2 ? 45 : 27 }, (_, index) => <i key={index} className={stage === 3 ? 'quantized' : ''}/>)}</div>
    <div className="vl-layer-strip">{Array.from({ length: 12 }, (_, index) => <button type="button" key={index} className={layer === index + 1 ? 'on' : ''} onClick={() => { setLayer(index + 1); onEvidenceFocus?.(0); }}>{index + 1}{[3, 6, 9, 12].includes(index + 1) ? ' ↓' : ''}</button>)}</div>
    <Feedback>第 {layer} 层{downsample ? '之后有下采样。' : '是普通编码层。'}编码器和解码器各 12 层；最终网格 3×9×5 展开为 135 个 motion tokens。方块不是实际单元数。</Feedback>
  </div>;
}

export function SequenceBuilderLab({ onEvidenceFocus }: WidgetProps) {
  const lesson = useLesson();
  const [boundaries, setBoundaries] = useState(true);
  const add = (segment: Segment) => { lesson.setSegments([...lesson.segments, segment]); onEvidenceFocus?.(segment === 'MOV' ? 1 : 0); };
  const change = (index: number, delta: number) => {
    const next = [...lesson.segments];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    lesson.setSegments(next);
  };
  return <div className="vl-lab">
    <Badge>Figure 2</Badge>
    <div className="vl-choices"><button type="button" onClick={() => add('IMG')}>+ 图像段</button><button type="button" onClick={() => add('MOV')}>+ 运动段</button><button type="button" onClick={() => add('TEXT')}>+ 文本段</button><button type="button" onClick={() => lesson.setSegments([])}>清空</button></div>
    <label className="vl-toggle"><input type="checkbox" checked={boundaries} onChange={event => setBoundaries(event.target.checked)}/> 显示 IMG/MOV 边界</label>
    <div className="vl-segment-list">{lesson.segments.length ? lesson.segments.map((item, index) => <div className={'vl-segment-item ' + item.toLowerCase()} key={index} data-focus={item === 'MOV' ? 1 : 0}>
      <b>{boundaries && item !== 'TEXT' ? '[' + item + '] ' : ''}{item === 'IMG' ? 'v₁ … v₉₀' : item === 'MOV' ? 'm₁ … m₁₃₅' : '文字 tokens'}{boundaries && item !== 'TEXT' ? ' [/' + item + ']' : ''}</b>
      <div><button type="button" aria-label="左移" disabled={index === 0} onClick={() => change(index, -1)}>←</button><button type="button" aria-label="右移" disabled={index === lesson.segments.length - 1} onClick={() => change(index, 1)}>→</button><button type="button" aria-label="删除" onClick={() => lesson.setSegments(lesson.segments.filter((_, position) => position !== index))}>×</button></div>
    </div>) : <span className="vl-empty">添加一组成组的 token</span>}</div>
    <Feedback>{boundaries ? 'Figure 2 的视觉段与运动段有边界；文本保持普通 token 序列。' : '隐藏边界后仍有同样的内容 token，但读者无法从显示判断各段模态；这是教学模拟。'} 当前约 {lesson.visual + lesson.motion} 个视频内容 tokens，文本及特殊标记未计。</Feedback>
  </div>;
}

export function NextTokenLab() {
  const lesson = useLesson();
  const [position, setPosition] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [guess, setGuess] = useState<string | null>(null);
  const tokens = lesson.segments.flatMap(item => item === 'IMG' ? ['[IMG]', '视觉内容', '[/IMG]'] : item === 'MOV' ? ['[MOV]', '运动内容', '[/MOV]'] : ['文本内容']);
  const vocabulary = ['[IMG]', '视觉内容', '[/IMG]', '[MOV]', '运动内容', '[/MOV]', '文本内容'];
  const loadExample = () => { lesson.setSegments(['IMG', 'MOV', 'TEXT']); setPosition(0); setGuess(null); };
  const safePosition = Math.min(position, Math.max(0, tokens.length - 1));
  const target = tokens[safePosition + 1];
  const decoys = vocabulary.filter(token => token !== target && token !== tokens[safePosition]);
  const decoyStart = decoys.length ? (safePosition * 2) % decoys.length : 0;
  const options = target ? [target, decoys[decoyStart], decoys[(decoyStart + 1) % Math.max(1,decoys.length)]].filter(Boolean).sort((a,b) => ((a.length * 7 + safePosition) % 11) - ((b.length * 7 + safePosition) % 11)) : [];
  const accept = () => { if (guess === target) { setPosition(safePosition + 1); setGuess(null); } };
  return <div className="vl-lab">
    <Badge>Eq.5</Badge>
    {!tokens.length && <button type="button" className="vl-primary-action" onClick={loadExample}>载入示例序列</button>}
    <div className="vl-token-steps">{tokens.map((token, index) => <button type="button" key={index} disabled={index > safePosition} className={`${index === safePosition ? 'selected ' : ''}${index < safePosition ? 'past' : ''}`} onClick={() => { setPosition(index); setGuess(null); }}>{token}</button>)}</div>
    {!!tokens.length && <div className="vl-prediction-track"><div className="vl-prediction-fill" style={{ width: `${Math.min(100,(safePosition + 1) / Math.max(1,tokens.length - 1) * 100)}%` }}/><span style={{ left: `${Math.min(100,(safePosition + 1) / Math.max(1,tokens.length - 1) * 100)}%` }}>↓</span></div>}
    {!!tokens.length && <div className="vl-next-token-workbench"><div className="vl-context-window"><small>当前上下文 {reveal ? '· 展开' : '· 最近 token'}</small><div>{(reveal ? tokens.slice(0,safePosition+1) : tokens.slice(safePosition,safePosition+1)).map((token,index)=><span key={index}>{token}</span>)}</div></div><div className="vl-next-arrow">→<small>预测</small></div><div className={'vl-next-slot ' + (guess === target ? 'correct' : guess ? 'incorrect' : '')}><small>下一个 token</small><b>{guess === target ? target : guess ? '再想一想' : '？'}</b></div></div>}
    {!!tokens.length && target && <div className="vl-next-candidates"><div><b>选择下一 token</b><small>候选顺序已打乱</small></div><div className="vl-choices">{options.map(token=><button type="button" key={token} className={`${guess === token ? 'selected ' : ''}${guess === token && token === target ? 'correct' : guess === token ? 'incorrect' : ''}`} onClick={()=>setGuess(token)}>{token}</button>)}</div></div>}
    {!!tokens.length && <div className="vl-choices"><button type="button" disabled={guess !== target || !target} onClick={accept}>{target ? '确认并继续 →' : '序列已到末尾'}</button><button type="button" onClick={() => setReveal(!reveal)}>{reveal ? '收起上下文' : '展开完整上下文'}</button><button type="button" onClick={loadExample}>重置示例</button></div>}
    <Feedback>{!tokens.length ? '先在上方构造序列，或载入示例。' : !target ? '已走到序列末尾；添加一个 segment 可继续预测。' : guess === target ? '预测正确。模型根据当前及之前的 token 预测下一个 token。' : guess ? '这个候选与序列中的下一个 token 不符，再试一次。' : '先读当前上下文，再从候选中判断下一个 token。'} Eq.5 的训练目标是根据此前 token 预测下一个 token。</Feedback>
  </div>;
}

export function EmcLab({ onEvidenceFocus }: WidgetProps) {
  const [direct, setDirect] = useState(true);
  const [feature, setFeature] = useState(true);
  const [example, setExample] = useState('列车');
  const changeFeature = (value: boolean) => { setFeature(value); onEvidenceFocus?.(value ? 0 : 1); };
  return <div className="vl-lab">
    <Badge>Figure 3(a) / Figure 10</Badge>
    <div className="vl-wire-box"><label><input type="checkbox" checked={direct} onChange={event => setDirect(event.target.checked)}/> 直接 motion input</label><label><input type="checkbox" checked={feature} onChange={event => changeFeature(event.target.checked)}/> Motion feature cross-attention（EMC）</label></div>
    <div className="vl-decoder-paths"><span>Motion vectors</span><span className={direct ? 'on' : ''}>↘ 直接输入</span><span className={feature ? 'on' : ''}>↗ 特征条件</span><span>3D U-Net</span></div>
    <Tabs items={['列车', '鱼']} value={example} choose={setExample}/>
    <div className={'vl-emc-preview ' + (feature ? 'feature-on' : 'feature-off')}><div className="vl-emc-scene"><span className="vl-emc-subject" key={example + String(feature)}>{example === '列车' ? '🚆' : '🐟'}</span><div className="vl-emc-track"/></div><div className="vl-emc-state"><b>{feature ? '运动特征参与重建' : '移除 EMC'}</b><small>教学动画：位移幅度仅表示定性差异，不是模型生成帧。</small></div></div>
    <Feedback>{direct && feature ? '两条运动条件路径都连接。' : direct && !feature ? '只剩直接输入：对应 Figure 10 的 w/o EMC 对照。' : '这个开关组合是教学模拟，论文没有单独报告。'} 当前查看{example}案例；Figure 10 支持重建保真度的定性判断，没有数值 FVD。</Feedback>
  </div>;
}

export function DecodeFlowLab({ onEvidenceFocus }: WidgetProps) {
  const nodes = ['Visual tokens', '关键帧 U-Net', 'Motion tokens', '3D U-Net', '连续视频'];
  const [step, setStep] = useState(0);
  const [sigma, setSigma] = useState(30);
  return <div className="vl-lab">
    <Badge>Figure 3(a) / Eq.3</Badge>
    <div className="vl-decoder-grid">{nodes.map((node, index) => <button type="button" key={node} className={step === index ? 'selected' : ''} onClick={() => { setStep(index); onEvidenceFocus?.(index < 2 ? 0 : 1); }}><b>0{index + 1}</b><span>{node}</span></button>)}</div>
    <div className="vl-edm-demo"><label>Eq.3 教学噪声 σ <input type="range" min="0" max="100" value={sigma} onChange={event => { setSigma(Number(event.target.value)); onEvidenceFocus?.(1); }}/><b>{sigma}%</b></label><div className="vl-edm-bars"><span style={{ width: String(Math.max(8, sigma)) + '%' }}/></div></div>
    <div className="vl-reconstruction" aria-label="噪声与重建阶段教学预览"><div className="vl-reconstruction-scene"><span className="vl-reconstruction-sun"/><span className="vl-reconstruction-hill"/><span className="vl-reconstruction-object" style={{ left: `${14 + step * 15}%` }}>▶</span><span className="vl-reconstruction-noise" style={{ opacity: sigma / 140 }} /></div><div className="vl-reconstruction-progress">{nodes.map((node, index) => <i key={node} className={index <= step ? 'on' : ''}/>)}</div><small>教学动画 · 拖动 σ 观察噪声遮挡，点选节点观察解码进度</small></div>
    <Feedback>当前节点：{nodes[step]}。噪声示意为 {sigma}%；Eq.3 训练目标是对加噪视频的重建误差取加权期望，这里没有运行实际扩散模型。</Feedback>
  </div>;
}

export function ClipChainLab({ onEvidenceFocus }: WidgetProps) {
  const lesson = useLesson();
  const [boundary, setBoundary] = useState(1);
  const [example, setExample] = useState(0);
  const count = lesson.clips;
  const update = (value: number) => { lesson.setClips(value); setBoundary(Math.min(boundary, value - 1)); };
  return <div className="vl-lab">
    <Badge>Figure 3(b) / Figure 9</Badge>
    <div className="vl-choices"><button type="button" disabled={count >= 8} onClick={() => update(count + 1)}>+ 下一段 clip</button><button type="button" disabled={count <= 2} onClick={() => update(count - 1)}>− 一段 clip</button></div>
    <div className="vl-clip-strip">{Array.from({ length: count }, (_, index) => <button type="button" key={index} className={'vl-clip ' + (boundary === index ? 'selected' : '')} onClick={() => setBoundary(index)}><strong>Clip {index + 1}</strong><div className="vl-clip-track"><i/><i/><i/><i/></div><small>{index === 0 ? '起始片段' : '边界 ' + index}</small></button>)}</div>
    <div className="vl-choices" aria-label="Figure 9 原图案例">{['柯基', '海滩汽车', '林间小屋'].map((name, index) => <button type="button" key={name} className={example === index ? 'selected' : ''} onClick={() => { setExample(index); onEvidenceFocus?.(index); }}>{name}</button>)}</div>
    <Feedback>当前 {count} 段，约 {count * 90} visual + {count * 135} motion = {count * 225} 个视频内容 tokens。{boundary === 0 ? '起始片段没有前一段边界。' : '选中边界 ' + boundary + '：前一段末帧将约束下一段。'} 未计文本和特殊标记，也不是完整上下文预算。</Feedback>
  </div>;
}

export function DdimLab({ onEvidenceFocus }: WidgetProps) {
  const steps = ['前一 clip 末帧', 'DDIM 逐步反演', '带噪状态', '下一关键帧初始噪声'];
  const [step, setStep] = useState(0);
  const [constraint, setConstraint] = useState(true);
  return <div className="vl-lab">
    <Badge>Eq.4 / Figure 5</Badge>
    <div className="vl-stepper"><button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>← 上一步</button><div>{steps.map((_, index) => <button type="button" key={index} className={step === index ? 'selected' : ''} onClick={() => setStep(index)}>{index + 1}</button>)}</div><button type="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>下一步 →</button></div>
    <div className="vl-stage-card"><span className="vl-stage-index">0{step + 1}</span><div><h3>{steps[step]}</h3><p>从前一段末帧得到下一段的受约束起点。</p></div></div>
    <div className="vl-seam-preview" aria-label="跨片段边界的教学动画"><div><small>前一 clip 末帧</small><span className="vl-seam-object">●</span></div><div><small>下一 clip 起点</small><span className="vl-seam-object" style={{ left: constraint ? `${36 + step * 2}%` : `${59 + step * 4}%`, top: constraint ? '51%' : '28%' }}>●</span></div><b className={constraint ? 'linked' : ''}>{constraint ? '边界连续' : '边界偏移'}</b></div>
    <label className="vl-toggle"><input type="checkbox" checked={constraint} onChange={event => { setConstraint(event.target.checked); onEvidenceFocus?.(event.target.checked ? 1 : 0); }}/> 使用 noise constraint</label>
    <Feedback>{constraint ? 'Figure 5 中有约束的跨 clip 外观更一致。' : '无约束的定性对照在 Figure 5 中展示更明显的跨段变化。'}步骤动画是 Eq.4 的教学示意。</Feedback>
  </div>;
}

const trainingStages = [
  { title: 'Stage 1 · Tokenizer + Detokenizer', sources: ['WebVid-10M 视频', 'InterVid-14M-aesthetics 子集'], goal: '用纯视频学习运动压缩和视频重建；InterVid 子集仅补充 detokenizer 训练。' },
  { title: 'Stage 2 · 生成式预训练', sources: ['WebVid-10M', '93M image-text', 'RedPajama 文本'], goal: '联合学习视频、图像、文本的自回归序列。' },
  { title: 'Stage 3 · 指令微调', sources: ['665K 图文指令', '100K 视频文本指令'], goal: '改善图像与视频指令跟随。' },
];
export function TrainingStageLab() {
  const [stage, setStage] = useState(0);
  const [source, setSource] = useState(0);
  const [replay, setReplay] = useState(0);
  const current = trainingStages[stage];
  return <div className="vl-lab">
    <Badge>Section 3.3 / Appendix A.2</Badge>
    <Tabs items={trainingStages.map(item => item.title)} value={current.title} choose={item => { setStage(trainingStages.findIndex(row => row.title === item)); setSource(0); }}/>
    <div className="vl-stage-card"><span className="vl-stage-index">0{stage + 1}</span><div><h3>{current.title}</h3><p>{current.goal}</p></div></div>
    <Tabs items={current.sources} value={current.sources[source]} choose={item => setSource(current.sources.indexOf(item))}/>
    <div className="vl-training-flow" key={`${stage}-${source}-${replay}`}><span>{current.sources[source]}</span><div className="vl-training-line"><i/></div><span>{stage === 0 ? source === 1 ? '仅 Detokenizer 视频重建' : '运动 token 与视频重建' : stage === 1 ? '多模态序列预测' : '指令响应'}</span></div>
    <button type="button" className="vl-replay" onClick={() => setReplay(replay + 1)}>↻ 重播数据流</button>
    <Feedback>当前查看：{current.sources[source]}。{stage === 0 && source === 1 ? '附录 A.2 的约 30 万条 InterVid 视频仅用于 detokenizer 的补充训练；论文报告的实验使用仅以 WebVid-10M 训练的检查点。' : ''}30K / 100K / 60K 是 Table 8 的模块训练步数，不能当作三个 Stage 的比例。</Feedback>
  </div>;
}

const configRows = [
  { name: 'Language Model', fields: { 'Training steps': '30K', 'Global batch': '2048', 'GPU': '128 NVIDIA A100', 'Training time': '60h', '输入长度': '2048' } },
  { name: 'Tokenizer', fields: { 'Training steps': '100K', 'Global batch': '512', 'GPU': '64 NVIDIA A100', 'Training time': '10h', '运动码本': '1024' } },
  { name: 'Detokenizer', fields: { 'Training steps': '60K', 'Global batch': '128', 'GPU': '64 NVIDIA A100', 'Training time': '48h', '生成结构': 'Keyframe U-Net + 3D U-Net' } },
];
export function TrainingConfigLab({ onEvidenceFocus }: WidgetProps) {
  const [module, setModule] = useState(0);
  const [field, setField] = useState('Training steps');
  const current = configRows[module];
  const fields = Object.entries(current.fields);
  const comparison = ['Training steps', 'Global batch', 'GPU', 'Training time'].includes(field) ? configRows.map(row => ({ name: row.name, value: Number(row.fields[field as keyof typeof row.fields]?.match(/\d+/)?.[0] ?? 0) })) : [];
  const maxComparison = Math.max(...comparison.map(row => row.value), 1);
  return <div className="vl-lab">
    <Badge>Table 8</Badge>
    <Tabs items={configRows.map(row => row.name)} value={current.name} choose={item => { setModule(configRows.findIndex(row => row.name === item)); setField('Training steps'); onEvidenceFocus?.(0); }}/>
    <div className="vl-config-grid">{fields.map(([name, value]) => <button type="button" key={name} className={'vl-config-cell ' + (field === name ? 'selected' : '')} onClick={() => { setField(name); onEvidenceFocus?.(1); }}><small>{name}</small><strong>{value}</strong></button>)}</div>
    {comparison.length > 0 && <div className="vl-config-compare" aria-label={`${field} 跨模块对照`}>{comparison.map(row => <div key={row.name} className={row.name === current.name ? 'selected' : ''}><span>{row.name}</span><i><em style={{ width: `${row.value / maxComparison * 100}%` }}/></i><b>{configRows.find(item => item.name === row.name)?.fields[field as keyof typeof current.fields]}</b></div>)}</div>}
    <Feedback>{current.name} 的 {field}：{current.fields[field as keyof typeof current.fields]}。这些是模块配置，不对应 Stage 1/2/3 的时长比例。</Feedback>
  </div>;
}

function MetricRows({ metric, baseline }: { metric: Metric; baseline: string }) {
  const rows = metric.rows.filter(row => row.name === 'Video-LaVIT' || row.name === baseline);
  const max = Math.max(...rows.map(row => row.value));
  return <div className="vl-arena-bars">{rows.map(row => <div key={row.name} className={row.name === 'Video-LaVIT' ? 'ours' : ''}><span>{row.name}</span><div><i style={{ width: String(Math.max(5, row.value / max * 100)) + '%' }}/></div><b>{row.value}</b></div>)}</div>;
}
export function UnderstandingLab() {
  const [task, setTask] = useState('图像理解');
  const [metricName, setMetricName] = useState('VQAv2');
  const dataset = modes[task];
  const metric = dataset[metricName];
  const [baseline, setBaseline] = useState(metric.rows[1]?.name || '');
  const chooseTask = (name: string) => { setTask(name); const first = Object.keys(modes[name])[0]; setMetricName(first); setBaseline(modes[name][first].rows[1]?.name || ''); };
  const chooseMetric = (name: string) => { setMetricName(name); setBaseline(dataset[name].rows[1]?.name || ''); };
  return <div className="vl-lab">
    <Badge>Tables 1–3</Badge>
    <Tabs items={['图像理解', '视频理解']} value={task} choose={chooseTask}/>
    <label className="vl-select-label">数据集<select value={metricName} onChange={event => chooseMetric(event.target.value)}>{Object.keys(dataset).map(name => <option key={name}>{name}</option>)}</select></label>
    <Tabs items={metric.rows.filter(row => row.name !== 'Video-LaVIT').map(row => row.name)} value={baseline} choose={setBaseline}/>
    <div className="vl-metric-heading"><strong>{metricName}</strong><span>{metric.direction} {metric.direction === '↑' ? '越高越好' : '越低越好'}</span></div>
    <MetricRows metric={metric} baseline={baseline}/>
    <Feedback>{metric.protocol} {metric.explain} 当前只与同一表中的 {baseline} 对照。</Feedback>
  </div>;
}

export function GenerationLab({ onEvidenceFocus }: WidgetProps) {
  const [task, setTask] = useState('视频生成');
  const [metricName, setMetricName] = useState('MSR-VTT FVD');
  const [caseName, setCaseName] = useState('山鹰');
  const dataset = modes[task];
  const metric = dataset[metricName];
  const chooseTask = (name: string) => { setTask(name); setMetricName(Object.keys(modes[name])[0]); };
  return <div className="vl-lab">
    <Badge>Tables 4–5 / Figure 4</Badge>
    <Tabs items={['视频生成', '长视频']} value={task} choose={chooseTask}/>
    <label className="vl-select-label">评价指标<select value={metricName} onChange={event => setMetricName(event.target.value)}>{Object.keys(dataset).map(name => <option key={name}>{name}</option>)}</select></label>
    <div className="vl-metric-heading"><strong>{metricName}</strong><span>{metric.direction} {metric.direction === '↑' ? '越高越好' : '越低越好'}</span></div>
    <div className="vl-arena-bars">{metric.rows.map(row => <div key={row.name} className={row.name === 'Video-LaVIT' ? 'ours' : ''}><span>{row.name}</span><div><i style={{ width: `${Math.max(5, row.value / Math.max(...metric.rows.map(item => item.value)) * 100)}%` }}/></div><b>{row.value}</b></div>)}</div>
    {task === '视频生成' && <Tabs items={['山鹰', '蒸汽列车', '登山', '柯基']} value={caseName} choose={item => { setCaseName(item); onEvidenceFocus?.(['山鹰', '蒸汽列车'].includes(item) ? 0 : 1); }}/>}
    <Feedback>{metric.protocol} {metric.explain} {task === '视频生成' ? `Figure 4 的${caseName}是定性案例，不能当作指标数值。` : '长视频的定性案例见第 7 章 Figure 9；本节的 Figure 4 原图展示短视频生成。'}</Feedback>
  </div>;
}

const ablationRows = {
  'Motion on/off': [
    ['MSVD ↑', 67.3, 73.2], ['ActivityNet ↑', 47.4, 50.1],
    ['UCF-101 IS ↑', 29.56, 44.26], ['UCF-101 FVD ↓', 442.80, 280.57],
  ],
  '135 vs 256 tokens': [
    ['MSVD ↑', 69.2, 73.2], ['ActivityNet ↑', 48.8, 50.1],
    ['UCF-101 IS ↑', 37.57, 44.26], ['UCF-101 FVD ↓', 281.24, 280.57],
  ],
} as const;
export function AblationFocusedLab({ onEvidenceFocus }: WidgetProps) {
  const [kind, setKind] = useState('Motion on/off');
  const [row, setRow] = useState(0);
  const rows = kind === 'EMC on/off' ? null : ablationRows[kind as keyof typeof ablationRows];
  const selected = rows?.[row];
  return <div className="vl-lab">
    <Badge>Tables 6–7 / Figure 10</Badge>
    <Tabs items={['Motion on/off', '135 vs 256 tokens', 'EMC on/off']} value={kind} choose={name => { setKind(name); setRow(0); onEvidenceFocus?.(name === 'Motion on/off' ? 0 : 1); }}/>
    {rows ? <div className="vl-ablation-table"><div className="head"><span>指标</span><span>{kind === 'Motion on/off' ? 'w/o motion' : 'N=256'}</span><span>{kind === 'Motion on/off' ? 'w/ motion' : 'N=135'}</span></div>{rows.map(([name, first, second], index) => <button type="button" key={name} className={'vl-ablation-row ' + (row === index ? 'selected' : '')} onClick={() => { setRow(index); onEvidenceFocus?.(kind === 'Motion on/off' ? 0 : 1); }}><span>{name}</span><b>{first}</b><b>{second}</b></button>)}</div> : <div className="vl-emc-evidence"><p><b>Figure 10 · 定性结果</b></p><p>有 EMC 时，运动特征通过 cross-attention 帮助重建列车与鱼的运动；去掉这条路径后，示例中的动作明显减弱。原图可在第 6 章查看。</p></div>}
    {selected && <div className="vl-ablation-compare"><div><small>{kind === 'Motion on/off' ? 'w/o motion' : 'N=256'}</small><i style={{ width: `${selected[1] / Math.max(selected[1], selected[2]) * 100}%` }}/><b>{selected[1]}</b></div><div><small>{kind === 'Motion on/off' ? 'w/ motion' : 'N=135'}</small><i style={{ width: `${selected[2] / Math.max(selected[1], selected[2]) * 100}%` }}/><b>{selected[2]}</b></div><span>{selected[0].endsWith('↓') ? '↓ 越低越好' : '↑ 越高越好'}</span></div>}
    <Feedback>{selected ? selected[0] + '：' + selected[1] + ' → ' + selected[2] + '。' : 'Figure 10 是定性重建对照，没有报告 FVD 数值。'}{kind === '135 vs 256 tokens' ? ' Table 7 只比较 256 与 135 两个离散设置，不支持连续性能曲线。' : kind === 'Motion on/off' ? ' Table 6 的理解与生成基线设置不同，应按任务分别阅读。' : ''}</Feedback>
  </div>;
}

const risks = [
  { name: '上下文长度', detail: 'Appendix C 指出 4096 context window 限制很长视频生成。' },
  { name: '训练视频偏短', detail: 'WebVid 视频平均约 15 秒，场景变化少，可能造成跨 clip 关键帧相似。' },
  { name: '训练成本', detail: '作者指出大规模视频训练成本仍高。' },
  { name: '生成风险', detail: 'Impact Statement 提到幻觉、偏见、有害回答与虚假信息风险。' },
];
const claims = [
  { name: 'motion tokens 改善所测视频任务', supported: true, source: 'Table 6 的 MSVD、ActivityNet 与 UCF-101 有/无 motion 对照；图像指标另见 Appendix Table 9' },
  { name: '任意增加 token 数都能提升效果', supported: false, source: 'Table 7 只比较 135 与 256 两个设置' },
  { name: 'EMC 改善示例重建', supported: true, source: 'Figure 10 的定性对照' },
];
export function ReviewerLab() {
  const [risk, setRisk] = useState(0);
  const [claim, setClaim] = useState(0);
  const [judgement, setJudgement] = useState<boolean | null>(null);
  return <div className="vl-lab">
    <Badge>Tables 6–7 / Figure 10 / Appendix C / Impact Statement</Badge>
    <Tabs items={risks.map(item => item.name)} value={risks[risk].name} choose={name => setRisk(risks.findIndex(item => item.name === name))}/>
    <div className="vl-stage-card"><span className="vl-stage-index">⚖</span><div><h3>{risks[risk].name}</h3><p>{risks[risk].detail}</p></div></div>
    <Tabs items={claims.map(item => item.name)} value={claims[claim].name} choose={name => { setClaim(claims.findIndex(item => item.name === name)); setJudgement(null); }}/>
    <div className="vl-judgement"><div className="vl-judgement-scale"><span style={{ transform: judgement === null ? 'rotate(0deg)' : judgement === claims[claim].supported ? 'rotate(-8deg)' : 'rotate(8deg)' }}/><i>证据</i><i>结论</i></div><div className="vl-choices"><button type="button" className={judgement === true ? 'selected' : ''} onClick={() => setJudgement(true)}>证据支持</button><button type="button" className={judgement === false ? 'selected' : ''} onClick={() => setJudgement(false)}>证据不足</button></div></div>
    <Feedback>{judgement === null ? '先根据表格或原图判断这项结论，再查看解释。' : `${judgement === claims[claim].supported ? '判断正确。' : '再看证据边界：'}${claims[claim].supported ? '有论文证据：' : '证据不足：'}${claims[claim].source}。`}</Feedback>
  </div>;
}
