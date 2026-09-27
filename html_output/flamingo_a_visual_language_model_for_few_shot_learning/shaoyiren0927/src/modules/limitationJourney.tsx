import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Source = '架构本身' | '继承自 LLM' | '当前训练范式';

type Limitation = {
  title: string;
  scene: string;
  question: string;
  source: Source;
  nuance: string;
  detail: string;
  symbol: 'eye' | 'thread' | 'target' | 'cards' | 'clock' | 'crowd';
};

const SOURCES: Source[] = ['架构本身', '继承自 LLM', '当前训练范式'];

const LIMITATIONS: Limitation[] = [
  {
    title: '幻觉与 ungrounded guesses',
    scene: '图中没有第二只鸟，模型却把语言上“很像真的”续写，当成了视觉事实。',
    question: '它最主要从哪里来？',
    source: '继承自 LLM',
    nuance: '主要继承自生成式语言模型；视觉—语言对齐不充分会进一步放大它。',
    detail: 'Flamingo 的输出仍由冻结语言模型按 token 自回归生成。最大似然训练奖励“像训练文本的续写”，却不直接验证每个名词是否有可见证据。Cross-attention 提供视觉条件，但没有内置的事实核验器或拒答校准器。',
    symbol: 'eye',
  },
  {
    title: '长序列泛化问题',
    scene: '示例、图像和对话不断延伸；越靠后的问题，需要穿过越来越长的上下文。',
    question: '它最主要从哪里来？',
    source: '当前训练范式',
    nuance: '论文首先把它列为继承自预训练 LM 的弱点；训练长度分布与上下文架构会决定这种弱点被放大到什么程度。',
    detail: '论文 Discussion 明确指出，预训练 LM 对长于训练序列的输入泛化较差。Flamingo 的有限长度、有限图像数训练分布可能延续这一问题；image-causal attention 虽限制直接读取最近图像，更早信息仍要经语言隐藏状态传递。',
    symbol: 'thread',
  },
  {
    title: 'Classification 落后于 contrastive models',
    scene: '开放式生成擅长“说答案”，却未必像专门对比模型那样擅长拉开类别边界。',
    question: '它最主要从哪里来？',
    source: '当前训练范式',
    nuance: '主要是训练目标与任务不完全匹配，而不是“生成模型一定不能分类”。',
    detail: 'Flamingo 以条件语言建模为主，优化的是正确文本的生成概率；contrastive models 直接学习图文匹配空间和类别间相对距离。在封闭类别判别中，后者的目标与评估更一致，因此往往更有优势。',
    symbol: 'target',
  },
  {
    title: '对 demonstrations 敏感',
    scene: '同一批示例只换一个顺序，模型对任务规则和答案格式的判断就可能改变。',
    question: '它最主要从哪里来？',
    source: '继承自 LLM',
    nuance: '这是 in-context learning 的典型脆弱性，多模态示例的质量、顺序和格式会进一步放大波动。',
    detail: '推理时没有参数更新，任务是从上下文中临时推断出来的。示例既是证据，也是“任务说明书”；若示例带有偏差、顺序效应或格式歧义，条件分布 p(y | demonstrations, x) 就会随之改变。',
    symbol: 'cards',
  },
  {
    title: 'Shots 增多后的 inference cost',
    scene: '每加入一张示范图，都会再带来一组 visual tokens 和更多文本 token。',
    question: '它最主要从哪里来？',
    source: '架构本身',
    nuance: '论文把它归为 in-context learning 的推理代价；Transformer 上下文与逐 token 解码会进一步放大这种代价。',
    detail: '论文指出，in-context learning 的 inference compute cost 和绝对性能会随着 shots 超过低数据区间而变差。每张图经 Resampler 变成固定数量的 visual tokens，但图像数量增加仍会线性增加视觉记忆；文本自注意力通常随上下文长度呈二次增长，生成又要逐 token 执行。',
    symbol: 'clock',
  },
  {
    title: '社会风险',
    scene: '网页规模的数据把知识带进模型，也把偏见、伤害性关联和隐私风险一并带了进来。',
    question: '它最主要从哪里来？',
    source: '当前训练范式',
    nuance: '主要来自大规模网络数据与评估覆盖不足，同时也继承了冻结语言模型已有的社会偏差。',
    detail: '多来源网页数据难以做到完全审计；冻结 LM 会保留原有偏差，视觉输入又引入对人物、场景和文化符号的新推断风险。基准分数不能替代分群评估、红队测试、数据治理与部署约束。',
    symbol: 'crowd',
  },
];

const RESEARCH = [
  {
    q: '怎样让模型只在“看见证据”时断言，并在证据不足时可靠地说不知道？',
    hint: '可以从可定位的视觉证据、检索核验、不确定性校准与可学习的拒答机制一起思考。',
    direction: '研究方向：把生成答案与证据定位、事实验证和置信度校准联合训练；评估时不只看答案对错，也检查答案是否真正由图像支持。',
  },
  {
    q: '怎样处理更多图片、更长视频和更多 shots，同时不让推理成本失控？',
    hint: '想想哪些视觉记忆必须保留，哪些可以检索、压缩或延迟读取。',
    direction: '研究方向：分层视觉记忆、按需检索、稀疏 cross-attention、缓存复用，以及能在长上下文中保持稳定的训练课程。',
  },
  {
    q: '怎样让 few-shot 学习对示例顺序更稳健，同时补上分类与社会公平方面的缺口？',
    hint: '可以把示例选择、顺序不变性、生成目标与对比目标放在同一个系统里考虑。',
    direction: '研究方向：自动挑选与重排 demonstrations，联合生成—对比目标，并对不同人群、语言和场景做系统化稳健性评估。',
  },
];

function LimitationVisual({ kind, step }: { kind: Limitation['symbol']; step: number }) {
  const common = { fill: 'none', stroke: '#f1e7ad', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="limit-visual" viewBox="0 0 420 190" role="img" aria-label={`局限示意图 ${step + 1}`}>
      <path d="M24 155 C120 132 268 171 397 130" stroke="#789584" strokeWidth="2" fill="none" />
      {kind === 'eye' && <><path {...common} d="M78 94 Q210 24 342 94 Q210 164 78 94Z"/><circle {...common} cx="210" cy="94" r="38"/><path {...common} d="M194 95 l16 13 31-43"/><text x="210" y="176">语言很确信 ≠ 图像有证据</text></>}
      {kind === 'thread' && <><path {...common} d="M42 58 H122 C154 58 142 126 177 126 H245 C277 126 269 58 306 58 H382"/><circle cx="43" cy="58" r="10" fill="#e9dc98"/><circle cx="382" cy="58" r="10" fill="#e9dc98"/><path {...common} d="M210 39 v110"/><text x="210" y="176">距离越长，早期信息越难保持</text></>}
      {kind === 'target' && <><circle {...common} cx="210" cy="91" r="64"/><circle {...common} cx="210" cy="91" r="34"/><path {...common} d="M88 130 L201 94"/><path {...common} d="M88 130 l25 1-13-21"/><text x="210" y="176">会生成，不等于最会划分类别</text></>}
      {kind === 'cards' && <><g transform="translate(115 43) rotate(-8 45 55)"><rect {...common} width="90" height="110"/><text x="45" y="64">A</text></g><g transform="translate(216 43) rotate(8 45 55)"><rect {...common} width="90" height="110"/><text x="45" y="64">B</text></g><path {...common} d="M173 28 h76 m-10-10 10 10-10 10"/><text x="210" y="176">换顺序，也可能换理解</text></>}
      {kind === 'clock' && <><circle {...common} cx="210" cy="88" r="66"/><path {...common} d="M210 45 v46 l35 21"/><path {...common} d="M77 67 h48 m-38 18 h38 m170-18 h48 m-48 18 h38"/><text x="210" y="176">更多 shots 带来更长上下文</text></>}
      {kind === 'crowd' && <><circle {...common} cx="210" cy="54" r="21"/><circle {...common} cx="139" cy="78" r="17"/><circle {...common} cx="281" cy="78" r="17"/><path {...common} d="M171 135 q5-50 39-50t39 50 M107 139 q4-42 32-42 19 0 27 20 M313 139 q-4-42-32-42-19 0-27 20"/><text x="210" y="176">规模扩大，也会扩大未审计的风险</text></>}
      <text className="limit-step-mark" x="28" y="32">0{step + 1}</text>
    </svg>
  );
}

export const LimitationJourney: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<Source | null>(null);
  const [detail, setDetail] = useState(false);
  const [stage, setStage] = useState<'limits' | 'research' | 'recap'>('limits');
  const [researchStep, setResearchStep] = useState(0);
  const [ideas, setIdeas] = useState(['', '', '']);
  const [reveal, setReveal] = useState(false);

  const issue = LIMITATIONS[step];
  const nextIssue = () => {
    if (step < LIMITATIONS.length - 1) {
      setStep(v => v + 1);
      setChoice(null);
      setDetail(false);
    } else {
      setStage('research');
    }
  };

  const nextResearch = () => {
    if (researchStep < RESEARCH.length - 1) {
      setResearchStep(v => v + 1);
      setReveal(false);
    } else {
      setStage('recap');
    }
  };

  if (stage === 'research') {
    const item = RESEARCH[researchStep];
    return (
      <div className="limit-journey research-stage">
        <div className="limit-progress"><i style={{ width: `${((researchStep + 1) / RESEARCH.length) * 100}%` }} /></div>
        <div className="limit-kicker">AFTER THE PAPER · 研究问题 {researchStep + 1} / 3</div>
        <div className="research-orbit" aria-hidden="true"><span>?</span><i/><i/><i/></div>
        <h3>{item.q}</h3>
        <p>{item.hint}</p>
        <label className="brainstorm-label">
          先写下你的一个想法
          <textarea value={ideas[researchStep]} onChange={e => setIdeas(v => v.map((x, i) => i === researchStep ? e.target.value : x))} placeholder="例如：让模型指向它依据的图像区域……" />
        </label>
        {!reveal ? <button type="button" className="limit-primary" onClick={() => setReveal(true)}>对照一个可研究的方向 →</button> : <>
          <div className="research-direction">{item.direction}</div>
          <button type="button" className="limit-primary" onClick={nextResearch}>{researchStep < 2 ? '保留想法，进入下一个问题 →' : '完成脑暴，回看整篇论文 →'}</button>
        </>}
      </div>
    );
  }

  if (stage === 'recap') {
    return (
      <div className="limit-journey recap-stage">
        <div className="limit-kicker">FINAL RECAP · 从能力回到边界</div>
        <h3>Flamingo 打开了一扇门，但没有替我们解决门后的所有问题。</h3>
        <div className="recap-line" aria-label="全文复盘">
          <span>交错数据<br/><small>塑造 few-shot</small></span><b>→</b>
          <span>视觉桥接<br/><small>连接冻结骨干</small></span><b>→</b>
          <span>上下文适配<br/><small>无需任务微调</small></span><b>→</b>
          <span>真实边界<br/><small>事实、成本与风险</small></span>
        </div>
        <p>整体结论：Flamingo 最重要的贡献，是证明通用视觉语言模型可以通过少量交错示例快速适配许多任务；它的局限也提醒我们，开放式生成能力、视觉 grounding、长上下文效率和社会可靠性必须被一起设计，而不能只追逐更多参数或更多 shots。</p>
        <div className="recap-verdict">真正理解一篇论文，不只知道它为何有效，也知道它何时可能失效，以及下一步该问什么。</div>
      </div>
    );
  }

  return (
    <div className="limit-journey">
      <div className="limit-progress"><i style={{ width: `${((step + 1) / LIMITATIONS.length) * 100}%` }} /></div>
      <div className="limit-kicker">LIMITATION TRACE · {step + 1} / {LIMITATIONS.length}</div>
      <div className="limit-layout" key={issue.title}>
        <LimitationVisual kind={issue.symbol} step={step} />
        <div className="limit-copy">
          <h3>{issue.title}</h3>
          <p>{issue.scene}</p>
          <strong>{issue.question}</strong>
          <div className="source-choices">
            {SOURCES.map(source => <button type="button" key={source} className={choice === source ? (source === issue.source ? 'is-correct' : 'is-wrong') : ''} onClick={() => { setChoice(source); setDetail(false); }}>{source}</button>)}
          </div>
        </div>
      </div>
      {choice && <div className="limit-answer" aria-live="polite">
        <div><b>{choice === issue.source ? '判断成立。' : '这个角度有关，但不是最主要来源。'}</b> {issue.nuance}</div>
        <button type="button" onClick={() => setDetail(v => !v)}>{detail ? '收起技术细节' : '查看技术细节'}</button>
        {detail && <p>{issue.detail}</p>}
        <button type="button" className="limit-primary" onClick={nextIssue}>{step < LIMITATIONS.length - 1 ? '沿着问题继续 →' : '进入三个未来研究问题 →'}</button>
      </div>}
    </div>
  );
};
