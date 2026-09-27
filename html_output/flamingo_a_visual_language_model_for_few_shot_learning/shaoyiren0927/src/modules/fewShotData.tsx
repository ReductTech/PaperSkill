import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Lesson = { title: string; visual: string[]; question: string; options: string[]; answer: number; answerText: string; follow: string; followAnswer: string; detail: string };

const LESSONS: Lesson[] = [
  { title:'Interleaved image-text sequence', visual:['[图: 一只 flamingo]','“What is it doing?”','[图: 水边的鸟]','“Describe the scene.”'], question:'什么是 interleaved image-text sequence？', options:['图片和文字在同一序列中交错出现','只有图片的 batch','先把所有图片拼成一张图'], answer:0, answerText:'它是按原始网页或文档顺序，把图片/视频媒体与文字混排成一条序列。', follow:'延伸：为什么顺序不能随意打乱？', followAnswer:'因为文字所在位置决定它在描述哪一张图，顺序本身就是任务上下文。', detail:'可以把序列写成 [image₁, text₁, image₂, text₂, …]。Flamingo 的媒体位置编码与因果生成都依赖这条顺序。' },
  { title:'Image-causal attention', visual:['文字 t₁  →  图像 v₁','文字 t₂  →  图像 v₁, v₂','文字 t₃  →  图像 v₁, v₂, v₃'], question:'image-causal attention 到底限制了什么？', options:['文字只能看见当前位置之前出现的图像','所有文字只能看最后一张图','图像不能被语言模型读取'], answer:0, answerText:'在因果生成中，当前位置的文字不能偷看未来媒体；它只能访问已经出现的图像。', follow:'延伸：这种限制为什么像真实阅读？', followAnswer:'因为模型必须像读者一样沿序列前进，不能利用尚未出现的视觉信息作弊。', detail:'对生成位置 t，允许的视觉集合可写为 v≤t；未来图像不会进入当前 cross-attention 的可见范围。' },
  { title:'最近图像与更早图像', visual:['v₁ ─────┐','v₂ ──┐   │  早先证据仍在上下文','text₃ ←┴───┘'], question:'为什么当前 text token 只 cross-attend 最近的 image，却仍然可以利用更早的图像？', options:['更早图像的信息已写入语言上下文状态','模型偷偷访问未来图片','最近图像会复制全部像素'], answer:0, answerText:'最近图像负责局部对齐，而更早图像的影响已经通过先前生成的语言状态保留下来。', follow:'延伸：这和“只看最近一页”矛盾吗？', followAnswer:'不矛盾：你手里只翻最近一页，但笔记已经携带更早页面的摘要。', detail:'局部 image cross-attention + 自回归语言状态形成“近处精读、远处记忆”的组合。' },
  { title:'M3W construction', visual:['网页文档','文本段落 ↔ 图片锚点','时间顺序 → 多模态序列'], question:'M3W 是怎么构建的？', options:['从网页中保留文本与图片的自然交错顺序','只收集图片标题','随机把图片插入文本'], answer:0, answerText:'M3W 从网页文档中抽取文本和图片锚点，保留它们在页面中的交错顺序。', follow:'延伸：为什么不把图片和文字拆成两个数据集？', followAnswer:'拆开会丢掉“这段话正在解释哪张图”的真实关系，模型也就学不到交错上下文。', detail:'论文描述的 M3W（Multimodal MassiveWeb）从约 4300 万个网页抽取文本与图片，依据 DOM 中的位置插入 <image> 标记，并在图像前与文档末加入 <EOC>；随后随机采样 L=256 个 token，最多取 N=5 张图片。' },
  { title:'Why interleaved data matters', visual:['示例 1：图 → 问题 → 答案','示例 2：图 → 描述','新图 → 新问题 → ?'], question:'为什么 interleaved data 对 few-shot learning 尤其重要？', options:['它把“示例如何定义任务”直接写进训练分布','它只让模型记住更多图片','它会自动替代推理'], answer:0, answerText:'训练时反复看到交错示例，模型才会学会从上下文推断任务，而不仅是识别单张图片。', follow:'延伸：如果训练数据只有独立图文对会怎样？', followAnswer:'模型可能学会配对与描述，却未必学会把多条例子当成临时任务说明书。', detail:'few-shot 的关键统计结构是“示例序列 → 新输入 → 输出”，interleaved data 在训练阶段提供了这种结构的先验。' },
  { title:'In-context learning vs fine-tuning', visual:['ICL: 参数不动','示例进入上下文 → 输出变化','FT: 梯度更新 → 参数改变'], question:'Flamingo 的 in-context learning 和 fine-tuning 的本质区别是什么？', options:['ICL 改参数，fine-tuning 不改参数','ICL 通过上下文改变条件分布，fine-tuning 通过梯度改变参数','两者完全一样'], answer:1, answerText:'in-context learning 不更新模型参数，只改变当前上下文；fine-tuning 则用梯度更新参数。', follow:'延伸：为什么 Flamingo 更适合快速切换任务？', followAnswer:'因为只需替换示例，不必为每个新任务重新训练整套模型。', detail:'ICL：ŷ = fθ(E₁…Eₖ, x)，θ 固定；fine-tuning：θ′ = θ − η∇θL，模型权重发生变化。' },
];

const TOKENS = [
  { token:'[image₁]', access:'视觉 v₁；没有未来媒体' },
  { token:'“A dog…”', access:'v₁ + 先前文字 token' },
  { token:'[image₂]', access:'新增视觉 v₂，保留已有语言状态' },
  { token:'“It is…”', access:'最近 v₂ + 已写入状态中的 v₁ 摘要' },
  { token:'[image₃]', access:'新增视觉 v₃' },
  { token:'“Answer:”', access:'v₃ + 全部此前语言上下文' },
];

export const FewShotData: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [details, setDetails] = useState(false);
  const [tokens, setTokens] = useState(false);
  const lesson = LESSONS[step];
  const finishQuestion = (i: number) => { setAnswered(true); setDetails(false); };
  const next = () => { if (step < LESSONS.length - 1) { setStep(step + 1); setAnswered(false); setDetails(false); } else setTokens(true); };
  const enterNext = () => { const b = document.querySelector('button.slide-nav-btn-primary:not(:disabled)') as HTMLButtonElement | null; if (b) { b.focus(); b.click(); } };
  return <div className="fewshot-scene">
    {!tokens ? <>
      <div className="fewshot-kicker">DATA LAB · {step + 1} / {LESSONS.length}</div>
      <div className="fewshot-visual">{lesson.visual.map((line, i) => <div key={line} className={i % 2 ? 'data-text' : 'data-image'}>{line}</div>)}</div>
      <div className="fewshot-title">{lesson.title}</div>
      {!answered ? <div className="fewshot-question"><div className="fewshot-q">{lesson.question}</div><div className="fewshot-options">{lesson.options.map((o, i) => <button key={o} type="button" onClick={() => finishQuestion(i)}>{String.fromCharCode(65 + i)} · {o}</button>)}</div></div> : <div className="fewshot-answer"><p>{lesson.answerText}</p><div className="fewshot-follow"><strong>{lesson.follow}</strong><span>{lesson.followAnswer}</span></div><button type="button" onClick={() => setDetails(v => !v)}>{details ? '收起技术细节' : '打开技术细节抽屉'}</button>{details && <div className="fewshot-drawer">{lesson.detail}</div>}<button type="button" className="fewshot-next" onClick={next}>{step < LESSONS.length - 1 ? '继续下一个问题 →' : '进入 4-shot multimodal prompt →'}</button></div>}
    </> : <div className="prompt-lab">
      <div className="fewshot-kicker">4-SHOT MULTIMODAL PROMPT · TOKEN TRACE</div>
      <p>四条例子把任务格式写进上下文。点击每个 token，查看 Flamingo 此刻能访问哪些视觉和语言信息。</p>
      <div className="prompt-strip">{TOKENS.map((t, i) => <button key={t.token} type="button" className="prompt-token" onClick={() => setStep(i % LESSONS.length)}>{t.token}</button>)}</div>
      <div className="token-detail"><strong>当前 token：</strong>{TOKENS[step % TOKENS.length].token}<br/><span>{TOKENS[step % TOKENS.length].access}</span></div>
      <pre>{`[image₁] “A dog runs.” [image₂] “It is…” [image₃] “Answer:”`}</pre>
      <p className="prompt-conclusion">Flamingo 的厉害不只是 architecture，训练数据格式也在塑造它的 few-shot 能力。</p>
      <button type="button" className="fewshot-next" onClick={enterNext}>理解了，进入下一章 →</button>
    </div>}
  </div>;
};
