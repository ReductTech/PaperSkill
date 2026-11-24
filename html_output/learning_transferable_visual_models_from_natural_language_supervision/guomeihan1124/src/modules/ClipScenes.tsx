import React, { useMemo, useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const softmax = (xs: number[], temperature: number) => {
  const scaled = xs.map(x => x / temperature);
  const max = Math.max(...scaled);
  const es = scaled.map(x => Math.exp(x - max));
  const sum = es.reduce((a, b) => a + b, 0);
  return es.map(x => x / sum);
};
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function ClipCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const contrastive = moduleId === 'newMethod';
  const phase = Math.min(1, Math.max(0, (progress - .08) / .78));
  return <div className="clip-cover" aria-label={contrastive ? 'CLIP 将相配的图和文拉近' : '固定类别分类器不能处理新概念'}>
    <div className="clip-cover-scene">
      <div className="clip-photo">🐕<span>一只狗在草地上</span></div>
      {contrastive ? <>
        <div className="clip-link good" style={{ transform: `scaleX(${phase})` }} />
        <div className="clip-caption good-card">“a photo of a dog”</div>
        <div className="clip-caption faded">“a photo of a cat”</div>
      </> : <>
        <div className="clip-link bad" style={{ transform: `scaleX(${phase})` }} />
        <div className="clip-caption bad-card">只能从：猫 / 车 / 狗中选</div>
        <div className="clip-caption faded">新概念？需要重新标注与训练</div>
      </>}
    </div>
    <p>{contrastive ? '把真实图文配对的表示拉近，把不匹配的组合推远。' : '传统分类器的输出类别在训练前就被固定。'}</p>
  </div>;
}

export function PairingMatrix() {
  const [pick, setPick] = useState(0);
  const sims = [[.92, .31, .18], [.24, .87, .34], [.13, .29, .90]];
  const captions = ['狗', '自行车', '咖啡杯'];
  return <div className="clip-scene matrix-scene">
    <section><div className="scene-kicker">一个 Batch，3 张图 × 3 段文字</div><h3>点一行，检查真正配对是否在对角线</h3>
      <div className="matrix" role="grid" aria-label="图文余弦相似度矩阵">
        <div className="corner">图 \ 文</div>{captions.map(x => <div className="head" key={x}>“{x}”</div>)}
        {sims.map((row, i) => <React.Fragment key={i}><button className={`row-label ${pick === i ? 'selected' : ''}`} onClick={() => setPick(i)}>图片 {i + 1}</button>{row.map((v, j) => <button key={j} onClick={() => setPick(i)} className={`cell ${i === j ? 'match' : ''}`} style={{ opacity: .35 + v * .65 }}>{v.toFixed(2)}</button>)}</React.Fragment>)}
      </div>
    </section>
    <aside className="explain-panel"><strong>当前查看：图片 {pick + 1}</strong><p>这一行的正确目标是第 {pick + 1} 列。CLIP 在一个大小为 N 的 batch 中比较全部 N×N 个图文组合。</p><div className="formula">S = Î · T̂ᵀ</div><p className="muted">Ĩ、T̂ 是 L2 归一化后的图像与文本嵌入；颜色越深，相似度越高。</p></aside>
  </div>;
}

export function FixedLabelWall() {
  const [open, setOpen] = useState(false);
  return <div className="clip-scene fixed-label-scene">
    <section><div className="scene-kicker">传统监督：标签表预先固定</div><h3>把“红色雨伞”拖进分类器，它没有对应的输出格</h3><div className="label-wall"><div className="photo-chip">☂️<span>红色雨伞</span></div><div className="label-slots">{['狗', '猫', '自行车'].map(x => <span key={x}>{x}</span>)}{open && <span className="new-slot">红色雨伞</span>}</div></div><button className="scene-action" onClick={() => setOpen(!open)}>{open ? '移除临时新类别' : '临时加入新类别'}</button></section>
    <aside className="explain-panel"><strong>{open ? '加入一格仍不等于学会它' : '类别表外的概念没有位置'}</strong><p>{open ? '传统分类器还需要带该标签的数据和训练，才能把这格学成可靠的视觉边界。' : '固定类别监督把“能回答什么”写死在输出层；CLIP 改为比较图像与自然语言描述。'}</p><p className="muted">这是教学对照：CLIP 也会受训练分布影响，但不要求为每个新类单独新建分类头。</p></aside>
  </div>;
}

export function SimilaritySpace() {
  const [caption, setCaption] = useState('a photo of a dog');
  const score = caption.includes('dog') ? .92 : caption.includes('bicycle') ? .31 : .18;
  return <div className="clip-scene similarity-scene">
    <section><div className="scene-kicker">共享空间中的一个查询</div><h3>切换文字描述，看它向图像嵌入靠近还是远离</h3><div className="space-map"><div className="space-photo">🐕<span>图像向量 Î</span></div><div className="space-axis" /><div className="space-text" style={{ left: `${16 + score * 56}%` }}>T̂<br/><small>{caption}</small></div></div><label className="caption-picker">文字描述<select value={caption} onChange={e => setCaption(e.target.value)}><option>a photo of a dog</option><option>a photo of a bicycle</option><option>a photo of a coffee cup</option></select></label></section>
    <aside className="explain-panel"><div className="big-score">{score.toFixed(2)}</div><strong>余弦相似度（教学样例）</strong><p>CLIP 先对两个编码器的输出做 L2 归一化，再计算点积；同向程度越高，相似度越大。</p><p className="muted">位置与数值为说明机制的简化演示，不是从模型实际推理得到的坐标。</p></aside>
  </div>;
}

export function DualEncoder() {
  const [text, setText] = useState('a photo of a dog');
  const examples: Record<string, { vector: string; score: string; match: boolean }> = {
    'a photo of a dog': { vector: '0.69, −0.06', score: '0.92', match: true },
    'a photo of a bicycle': { vector: '−0.18, 0.54', score: '0.31', match: false },
    'a photo of a coffee cup': { vector: '0.27, 0.43', score: '0.18', match: false },
  };
  const current = examples[text];
  return <div className="clip-scene encoder-scene">
    <section className="encoder-flow"><div className="source-card">🐕<span>图像</span></div><div className="encoder-box blue">Image Encoder<br/><small>ResNet 或 ViT</small></div><div className="embedding image-embed">[0.72, −0.10, …]</div></section>
    <section className="encoder-flow"><label className="text-source">文本 <select value={text} onChange={e => setText(e.target.value)}><option>a photo of a dog</option><option>a photo of a bicycle</option><option>a photo of a coffee cup</option></select></label><div className="encoder-box purple">Text Encoder<br/><small>Transformer</small></div><div className={`embedding ${current.match ? 'text-good' : 'text-bad'}`}>[{current.vector}, …]</div></section>
    <aside className="encoder-result"><div className="big-score">{current.score}</div><strong>余弦相似度</strong><p>{current.match ? '相配文本在共享嵌入空间中更接近。' : '不匹配文本应被训练目标推远。'}</p><p className="muted">论文将各编码器输出线性投影到同一多模态空间。</p></aside>
  </div>;
}

export function SymmetricLoss() {
  const [temperature, setTemperature] = useState(.07);
  const logits = [0.86, .42, .19];
  const probs = softmax(logits, temperature);
  const loss = -Math.log(probs[0]);
  return <div className="clip-scene loss-scene">
    <section><div className="scene-kicker">可操作的简化样例</div><h3>调节温度 τ，观察 Softmax 如何放大正确配对</h3><label className="range-label">温度 τ = {temperature.toFixed(2)}<input type="range" min="0.05" max="0.8" step="0.01" value={temperature} onChange={e => setTemperature(Number(e.target.value))}/></label>
      <div className="prob-bars">{['正确文本','负样本 A','负样本 B'].map((name, i) => <div className="prob" key={name}><span>{name}</span><i><b style={{ width: pct(probs[i]) }} /></i><strong>{pct(probs[i])}</strong></div>)}</div>
    </section>
    <aside className="explain-panel"><div className="formula">L = (L图→文 + L文→图) / 2</div><p>同一张相似度矩阵既按“每张图找文字”做一次交叉熵，也按“每段文字找图”再做一次。</p><div className="loss-number">教学样例损失 {loss.toFixed(3)}</div><p className="muted">τ 是可学习的 logit 缩放参数；这里的数值为演示，不是论文实验结果。</p></aside>
  </div>;
}

export function BidirectionalLoss() {
  const [direction, setDirection] = useState<'image' | 'text'>('image');
  const labels = direction === 'image' ? ['文字 1（正确）', '文字 2', '文字 3'] : ['图片 1（正确）', '图片 2', '图片 3'];
  const probs = direction === 'image' ? [.86, .10, .04] : [.82, .13, .05];
  const loss = -Math.log(probs[0]);
  return <div className="clip-scene bidirectional-scene"><section><div className="scene-kicker">同一张 N×N 相似度矩阵，读两次</div><h3>切换方向，查看一行或一列的交叉熵</h3><div className="direction-switch"><button className={direction === 'image' ? 'active' : ''} onClick={() => setDirection('image')}>图片 → 文字：读一行</button><button className={direction === 'text' ? 'active' : ''} onClick={() => setDirection('text')}>文字 → 图片：读一列</button></div><div className="prob-bars">{labels.map((name, i) => <div className="prob" key={name}><span>{name}</span><i><b className={i === 0 ? 'positive' : ''} style={{ width: pct(probs[i]) }} /></i><strong>{pct(probs[i])}</strong></div>)}</div></section><aside className="explain-panel"><div className="formula">L = (L图→文 + L文→图) / 2</div><p>图片作为查询时，正确文字是目标；文字作为查询时，正确图片也是目标。CLIP 对两个方向的交叉熵取平均。</p><div className="loss-number">当前方向损失：{loss.toFixed(3)}</div><p className="muted">这一页只解释“双向”；温度缩放在下一章单独操作。</p></aside></div>;
}

export function TemperatureLab() {
  const [temperature, setTemperature] = useState(.18);
  const logits = [.86, .42, .19];
  const probs = softmax(logits, temperature);
  return <div className="clip-scene temperature-scene"><section><div className="scene-kicker">logit 缩放的独立实验</div><h3>只调节温度 τ，观察正确配对的概率如何变尖</h3><label className="range-label">温度 τ = {temperature.toFixed(2)}<input type="range" min="0.05" max="0.80" step="0.01" value={temperature} onChange={e => setTemperature(Number(e.target.value))}/></label><div className="prob-bars">{['正确配对', '负样本 A', '负样本 B'].map((name, i) => <div className="prob" key={name}><span>{name}</span><i><b className={i === 0 ? 'positive' : ''} style={{ width: pct(probs[i]) }} /></i><strong>{pct(probs[i])}</strong></div>)}</div></section><aside className="explain-panel"><div className="formula">pᵢ = softmax(sᵢ / τ)</div><p>τ 小时，已有优势的正确 logit 会变得更突出；τ 大时，概率分布更平缓。</p><p className="muted">论文使用可学习的 logit 缩放；这里用固定相似度展示该缩放的效果。</p></aside></div>;
}

export function PromptClassifier() {
  const [template, setTemplate] = useState('a photo of a {label}');
  const [target, setTarget] = useState('狗');
  const classes = ['狗','猫','自行车'];
  const scores = classes.map(c => c === target ? .78 : c === '猫' ? .16 : .06);
  return <div className="clip-scene prompt-scene">
    <section className="prompt-controls"><h3>把类别写成文本，就得到零样本分类器</h3><label>候选图片<select value={target} onChange={e => setTarget(e.target.value)}>{classes.map(x => <option key={x}>{x}</option>)}</select></label><label>Prompt<select value={template} onChange={e => setTemplate(e.target.value)}><option>a photo of a {'{label}'}</option><option>a blurry photo of a {'{label}'}</option><option>this is a {'{label}'}</option></select></label><div className="prompt-visual">{target === '狗' ? '🐕' : target === '猫' ? '🐈' : '🚲'}</div></section>
    <section className="class-list">{classes.map((c, i) => <div className={`class-score ${i === 0 ? '' : ''}`} key={c}><span>“{template.replace('{label}', c)}”</span><i><b className={c === target ? 'winner' : ''} style={{ width: pct(scores[i]) }} /></i><strong>{pct(scores[i])}</strong></div>)}<p className="feedback">预测：<b>{target}</b>。真实 CLIP 会编码全部候选文本，再按相似度经 Softmax 归一化。</p></section>
  </div>;
}

export function PromptEnsemble() {
  const [count, setCount] = useState(1);
  const confidence = [64, 72, 76][count - 1];
  return <div className="clip-scene ensemble-scene"><section><h3>多个模板不是“新训练”，而是对文本特征做集成</h3><div className="template-stack">{['a photo of a {label}','a blurry photo of a {label}','a photo of the large {label}'].slice(0, count).map((x, i) => <div key={x} className={`template-card t${i}`}>{x.replace('{label}','dog')}</div>)}</div><label className="range-label">使用模板数：{count}<input type="range" min="1" max="3" step="1" value={count} onChange={e => setCount(Number(e.target.value))}/></label></section><aside className="explain-panel"><div className="ring" style={{ '--p': `${confidence}%` } as React.CSSProperties}>{confidence}%</div><p>教学示意：将多个模板的文本嵌入平均后再归一化，可减轻单一措辞的偶然偏差。</p><p className="muted">论文在多数据集上使用 prompt engineering 与模板集成；环图数值不是论文基准分数。</p></aside></div>;
}

export function EvidenceScene() {
  return <div className="clip-scene evidence-scene"><section><div className="scene-kicker">论文报告的结论</div><h3>零样本 CLIP 在 ImageNet 上匹配原始 ResNet-50 的准确率</h3><div className="evidence-bars"><div><span>原始 ResNet-50</span><i><b style={{ width: '76%' }} /></i><strong>匹配</strong></div><div><span>CLIP 零样本</span><i><b className="green" style={{ width: '76%' }} /></i><strong>无需 ImageNet 训练集</strong></div></div></section><aside className="explain-panel"><p>这不是说 CLIP 在所有任务上都优于专用模型；论文在 30 多个视觉数据集上衡量了零样本迁移。</p><p className="muted">比较条件：ImageNet 零样本分类；论文摘要说明 CLIP 未使用该数据集的 128 万训练样本。</p></aside></div>;
}

export function LimitsScene() {
  const [focus, setFocus] = useState(0);
  const limits = [['细粒度与计数','相近类别、物体计数等任务仍可能较弱。'],['分布外数据','大规模网页数据不等于覆盖一切分布；论文以 MNIST 为例讨论。'],['社会影响','互联网图文监督可能继承偏见，类别设计也会改变输出。']];
  return <div className="clip-scene limits-scene"><section className="limit-tabs">{limits.map((x,i) => <button key={x[0]} className={focus===i?'active':''} onClick={()=>setFocus(i)}>{x[0]}</button>)}</section><section className="limit-body"><div className="limit-illustration">{focus===0?'🔎':focus===1?'🧩':'⚖️'}</div><div><h3>{limits[focus][0]}</h3><p>{limits[focus][1]}</p><p className="muted">边界不是否定 CLIP 的零样本能力，而是提醒：具体部署必须针对具体任务和风险评估。</p></div></section></div>;
}
