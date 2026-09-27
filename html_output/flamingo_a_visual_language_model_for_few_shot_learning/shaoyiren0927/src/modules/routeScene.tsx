import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Question = { q: string; options: string[]; answer: number; explain: string };
type NodeSpec = { name: string; short: string; summary: string; formula: string; concept: string; questions: Question[] };

const NODES: NodeSpec[] = [
  { name:'Vision Encoder', short:'VE', summary:'把 image/video 变成保留空间与时间线索的视觉特征。', formula:'V = Fᵥ(x);  Fᵥ 在 Flamingo 训练中保持 frozen', concept:'图像通常切成 patch；视频先抽帧，再为每帧提取视觉特征。这里负责“看见”，还不负责生成语言。', questions:[
    {q:'输入是什么？',options:['文字 token','image 或 video 帧','最终答案'],answer:1,explain:'视觉编码器直接接收图片或视频帧。'},
    {q:'输出是什么？',options:['密集视觉特征','自然语言句子','类别概率'],answer:0,explain:'输出是空间/时间上的密集视觉特征。'},
    {q:'为什么需要这一模块？',options:['把像素转换成机器可比较的视觉表示','生成完整句子','控制提示长度'],answer:0,explain:'原始像素需要先变成语义特征。'},
    {q:'如果删除会怎样？',options:['模型无法从像素获得视觉语义','输出会更准确','只影响标点'],answer:0,explain:'后续模块将没有可读的视觉证据。'},
    {q:'哪些参数 frozen？',options:['预训练视觉编码器','所有连接器','输出文字'],answer:0,explain:'论文训练时冻结视觉骨干。'},
    {q:'哪些参数 trainable？',options:['视觉骨干全部参数','本节点没有主要可训练参数','输入图片'],answer:1,explain:'主要可训练部分在后续连接器。'}]},
  { name:'Perceiver Resampler', short:'PR', summary:'用少量可学习查询，把任意大小的视觉特征压缩成固定数量表示。', formula:'Z = Perceiver(Q, V),  Z ∈ ℝᴺˣᵈ', concept:'Q 是可学习 latent queries。它们通过交叉注意力读取 V，使图片分辨率或视频帧数变化时，输出长度 N 仍保持固定。', questions:[
    {q:'输入是什么？',options:['密集视觉特征 V','最终句子','标签集合'],answer:0,explain:'Resampler 接收视觉编码器给出的特征。'},
    {q:'输出是什么？',options:['固定数量的视觉表示 Z','更多原始像素','损失函数'],answer:0,explain:'输出长度固定，便于接入语言模型。'},
    {q:'为什么需要这一模块？',options:['控制视觉上下文长度并聚合重点','冻结语言模型','替代全部文字'],answer:0,explain:'它在信息量与计算量之间建立稳定接口。'},
    {q:'如果删除会怎样？',options:['可变长度视觉特征会直接压向语言模型，代价难控','视频会变成音频','文本更短'],answer:0,explain:'视觉 token 数会随分辨率或帧数增长。'},
    {q:'哪些参数 frozen？',options:['latent queries','预训练视觉编码器','交叉注意力权重'],answer:1,explain:'上游视觉骨干冻结。'},
    {q:'哪些参数 trainable？',options:['Perceiver Resampler','输入媒体','Frozen LM 全部参数'],answer:0,explain:'Resampler 是 Flamingo 的主要可训练连接器之一。'}]},
  { name:'Visual Tokens', short:'VT', summary:'固定长度视觉 token 成为语言模型可按需读取的外部记忆。', formula:'Z = {z₁,…,zₙ};  n 固定，d 与桥接维度对齐', concept:'Visual Tokens 不是文字 token，也不会直接出现在答案里。它们保存压缩后的视觉证据，等待交叉注意力读取。', questions:[
    {q:'输入是什么？',options:['Resampler 的固定长度输出','原始音频','答案文本'],answer:0,explain:'它承接 Resampler 的视觉摘要。'},
    {q:'输出是什么？',options:['供交叉注意力读取的视觉记忆','新的图片文件','分类标签'],answer:0,explain:'它们是跨模块传递的视觉表示。'},
    {q:'为什么需要这一模块？',options:['为视觉与语言建立稳定接口','训练新的视觉骨干','删除上下文'],answer:0,explain:'固定形状使后续层能重复读取。'},
    {q:'如果删除会怎样？',options:['视觉信息无法进入跨注意力','语言模型自动看见像素','只损失颜色'],answer:0,explain:'语言通路将缺少视觉键和值。'},
    {q:'哪些参数 frozen？',options:['token 本身不是独立参数','所有提示文本','Resampler'],answer:0,explain:'Visual Tokens 是中间激活，不是一组独立权重。'},
    {q:'哪些参数 trainable？',options:['产生它们的 Resampler 参数','图片像素','语言词表'],answer:0,explain:'训练信号通过 token 回传到 Resampler。'}]},
  { name:'GATED XATTN-DENSE', short:'GX', summary:'在需要时把视觉证据注入语言状态，并用门控保护原有语言能力。', formula:'y = x + tanh(α) · XAttn(x, Z);  α 初始接近 0', concept:'交叉注意力以语言状态为 query，以视觉 token 为 key/value。门控从接近关闭开始，训练后再逐渐学会何时看图。', questions:[
    {q:'输入是什么？',options:['语言隐状态 x 与视觉 token Z','只有像素','只有答案'],answer:0,explain:'它连接视觉流与语言流。'},
    {q:'输出是什么？',options:['融合视觉证据后的语言状态','一张新图片','数据集标签'],answer:0,explain:'结果仍在语言模型的隐空间中。'},
    {q:'为什么需要这一模块？',options:['让语言状态按需读取视觉证据','压缩视频帧','保存模型文件'],answer:0,explain:'这是 Flamingo 的核心跨模态桥。'},
    {q:'如果删除会怎样？',options:['Frozen LM 只能依赖文字上下文','视觉 token 自动变成单词','训练速度无限快'],answer:0,explain:'视觉信息无法影响语言生成。'},
    {q:'哪些参数 frozen？',options:['插入的交叉注意力层','Frozen LM 原有层','门控参数 α'],answer:1,explain:'语言骨干保持冻结。'},
    {q:'哪些参数 trainable？',options:['GATED XATTN-DENSE 与门控','Frozen LM 全部权重','输入提示'],answer:0,explain:'新插入的视觉连接层参与训练。'}]},
  { name:'Frozen LM', short:'LM', summary:'保留大语言模型已有的生成能力，并在视觉证据条件下继续预测文字。', formula:'p(yₜ | y<ₜ, Z)', concept:'语言模型参数冻结，但隐状态会经过插入的门控交叉注意力获得视觉条件，因此仍能生成与图片相关的文字。', questions:[
    {q:'输入是什么？',options:['文字上下文与已融合的视觉状态','原始 JPEG 字节','只有类别编号'],answer:0,explain:'语言模型沿自回归上下文前进。'},
    {q:'输出是什么？',options:['下一文字 token 的概率分布','视频帧','视觉 patch'],answer:0,explain:'它逐 token 生成文本。'},
    {q:'为什么需要这一模块？',options:['复用强大的开放式语言生成能力','压缩图像','定位边界框'],answer:0,explain:'这使输出不被限制在固定标签集合。'},
    {q:'如果删除会怎样？',options:['系统失去自然语言生成器','图片更清晰','Resampler 自动写句子'],answer:0,explain:'视觉表示没有负责表达的语言端。'},
    {q:'哪些参数 frozen？',options:['语言模型原有参数','所有视觉连接器','生成的 token'],answer:0,explain:'冻结可减少训练成本并保留语言能力。'},
    {q:'哪些参数 trainable？',options:['LM 原层全部参数','插入在层间的视觉连接器','词表文本'],answer:1,explain:'训练集中在新插入模块。'}]},
  { name:'Text Output', short:'TXT', summary:'模型最终以自由文本回答问题、描述画面或延续多轮对话。', formula:'ŷₜ = argmax p(yₜ | y<ₜ, Z)  或按分布采样', concept:'输出可以是短答案、描述或对话，不局限于预定义标签。解码策略会影响确定性、多样性与错误风险。', questions:[
    {q:'输入是什么？',options:['LM 的下一 token 分布','另一张必须新增的图片','分类头'],answer:0,explain:'解码器从概率分布中选出下一 token。'},
    {q:'输出是什么？',options:['自由文本','固定视觉特征','训练数据'],answer:0,explain:'终点是自然语言序列。'},
    {q:'为什么需要这一模块？',options:['把内部状态变成用户可读答案','冻结视觉编码器','增加帧率'],answer:0,explain:'模型能力最终必须通过文字交付。'},
    {q:'如果删除会怎样？',options:['只剩内部概率，没有可读结果','答案自动更好','图片变成立体'],answer:0,explain:'数据流无法抵达用户。'},
    {q:'哪些参数 frozen？',options:['输出文本','词表投影通常随 Frozen LM 一起冻结','用户问题'],answer:1,explain:'它复用语言模型的输出头。'},
    {q:'哪些参数 trainable？',options:['本节点通常没有新增的大型训练模块','所有答案字符','相机参数'],answer:0,explain:'主要训练已发生在连接视觉与语言的模块。'}]},
];

function sampleThree(items: Question[]) {
  return [...items].sort(() => Math.random() - .5).slice(0, 3);
}

export const RouteScene: React.FC<WidgetProps> = () => {
  const sampled = useMemo(() => NODES.map(n => sampleThree(n.questions)), []);
  const [active, setActive] = useState(0);
  const [question, setQuestion] = useState(0);
  const [done, setDone] = useState<boolean[]>(NODES.map(() => false));
  const [feedback, setFeedback] = useState('从 Vision Encoder 开始。');
  const [puzzle, setPuzzle] = useState(false);
  const [placed, setPlaced] = useState<string[]>([]);

  const node = NODES[active];
  const currentQ = sampled[active][question];
  const answer = (i: number) => {
    const correct = i === currentQ.answer;
    setFeedback((correct ? '正确。' : '再记住这条线索：') + currentQ.explain);
    if (question < 2) setQuestion(question + 1);
    else {
      const next = [...done]; next[active] = true; setDone(next); setQuestion(0);
      if (active === NODES.length - 1) setTimeout(() => setPuzzle(true), 500);
    }
  };
  const selectNode = (i: number) => {
    const unlocked = i === 0 || done[i - 1];
    if (!unlocked) { setFeedback('这段数据还没有走到那里。请先完成前一个节点。'); return; }
    setActive(i); setQuestion(0); setFeedback(done[i] ? NODES[i].summary : `进入 ${NODES[i].name}。随机三问已经生成。`);
  };
  const place = (name: string) => {
    const expected = NODES[placed.length].name;
    if (name !== expected) { setFeedback(`这块暂时接不上。下一块应承接 ${expected}。`); return; }
    setPlaced([...placed, name]); setFeedback(`${name} 已嵌入架构。`);
  };
  const enterNext = () => {
    const next = document.querySelector('button.slide-nav-btn-primary:not(:disabled)') as HTMLButtonElement | null;
    if (next) { next.focus(); next.click(); }
  };

  return <div className="route-scene">
    <div className="route-kicker">FOLLOW THE DATA · 视觉信息正在前进</div>
    <div className="route-map">{NODES.map((n, i) => {
      const unlocked = i === 0 || done[i - 1];
      return <React.Fragment key={n.name}>
        <button type="button" className={`route-node ${active === i ? 'active' : ''} ${done[i] ? 'done' : ''}`} disabled={!unlocked} onClick={() => selectNode(i)}><span>{n.short}</span><small>{n.name}</small></button>
        {i < NODES.length - 1 && <div className={`route-line ${done[i] ? 'done' : ''}`}>→</div>}
      </React.Fragment>;
    })}</div>
    <div className="route-stage">
      <div className="route-stage-head"><span>NODE {active + 1} / {NODES.length}</span><strong>{node.name}</strong></div>
      {!done[active] ? <div className="route-question">
        <div className="route-question-count">RANDOM QUESTION {question + 1} / 3</div>
        <h4>{currentQ.q}</h4>
        <div className="route-options">{currentQ.options.map((o, i) => <button key={o} type="button" onClick={() => answer(i)}>{String.fromCharCode(65 + i)} · {o}</button>)}</div>
      </div> : <div className="route-complete">
        <p>{node.summary}</p>
        <details><summary>打开技术细节抽屉</summary><code>{node.formula}</code><div>{node.concept}</div></details>
        {active < NODES.length - 1 && <button type="button" onClick={() => selectNode(active + 1)}>沿路线前往下一节点 →</button>}
      </div>}
      <div className="route-feedback">SYSTEM · {feedback}</div>
    </div>

    {puzzle && <div className="architecture-window" role="dialog" aria-label="Flamingo 架构拼图">
      <div className="architecture-title">ARCHITECTURE ASSEMBLY</div>
      <p>你已经走完数据路线。现在按顺序把节点嵌回架构框架。</p>
      <pre>{`image/video\n    │\n    ▼\n[ ${placed[0] || '··············'} ]\n    │\n    ▼\n[ ${placed[1] || '··············'} ] → [ ${placed[2] || '··············'} ]\n    │\n    ▼\n[ ${placed[3] || '··············'} ]\n    │\n    ▼\n[ ${placed[4] || '··············'} ] → [ ${placed[5] || '··············'} ]`}</pre>
      <div className="architecture-pieces">{NODES.filter(n => !placed.includes(n.name)).map(n => <button key={n.name} type="button" onClick={() => place(n.name)}>{n.name}</button>)}</div>
      {placed.length === NODES.length && <button type="button" className="architecture-enter" onClick={enterNext}>架构完成 · 进入下一章 →</button>}
    </div>}
  </div>;
};

export const RoutePuzzleSlot: React.FC<WidgetProps> = () => <div className="route-silent" aria-hidden="true" />;
