import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './coop-kit';
import './early-labs.css';

const STEPS = [
  { title: '文字', change: '先分清描述用语和类别名称。', detail: '在这句提示中，“a photo of a”是上下文，也就是类别名称周围的描述用语；“golden retriever”（金毛犬）是类别名称。' },
  { title: '输入向量', change: '文字片段被表示为一组组数字。', detail: '分词器先把文字拆成 token（文本片段，不一定是完整单词）。每个 token 对应一组数字，称为词嵌入向量；编码器再把整串输入转换成一个类别的文本特征。' },
  { title: '可学习上下文', change: '上下文从固定的词向量，换成可更新的数字参数。', detail: 'CoOp 保留类别名称的固定词嵌入，只让上下文向量接受训练更新。文本编码器被冻结，意思是其预训练权重保持固定；这里还没有执行训练。' },
];
const CONTEXT = ['a', 'photo of', 'a'];
const VECTOR_VALUES = [[0.12, -0.08, 0.31], [0.24, 0.46, -0.17], [-0.19, 0.35, 0.62]];

export const EmbeddingLab: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const stage = STEPS[step];
  const move = (next: number) => { setStep(next); setAnswer(null); };
  return <div className="el-lab" onKeyDown={e => {
    const target = e.target as HTMLElement;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      && target.closest('button, input, select, textarea, [role="slider"]')) e.stopPropagation();
  }}>
    <div className="ctrl" role="group" aria-label="逐步查看文本表示">
      {STEPS.map((s, i) => <button type="button" key={s.title} className={'chip' + (step === i ? ' selected' : '')} aria-pressed={step === i} onClick={() => move(i)}>{i + 1}. {s.title}</button>)}
    </div>
    <p><strong>这一步看什么：</strong>{stage.change} {stage.detail}</p>
    <div className="el-embedding-stage" data-step={step}>
      <div className="el-stage-heading"><span>同一段提示的三种观察方式</span><strong>{['先读懂这句话', '文字，变成一组组数字', '让上下文成为可学习参数'][step]}</strong></div>
      <div className="el-embedding-input">
        <div className="el-embedding-context"><span>{step === 2 ? '可学习的上下文' : '上下文：描述用语'}</span><div className="el-token-cards">
          {CONTEXT.map((word, i) => <div className="el-token-card" key={i} style={{ '--el-index': i } as React.CSSProperties}>
            <div className="el-token-word">{word}</div>
            <div className="el-token-numbers"><strong>{step === 2 ? `v${['₁','₂','₃'][i]}` : '词向量'}</strong><span>{VECTOR_VALUES[i].map((v,j) => <i key={j} style={{ height: `${22 + Math.abs(v) * 50}px` }} />)}</span></div>
            <small>{step === 0 ? '描述片段' : step === 1 ? '固定' : '可以更新'}</small>
          </div>)}
        </div></div>
        <span className="el-input-plus" aria-hidden="true">＋</span>
        <div className="el-embedding-class"><span>类别名称 · 始终固定</span><div><strong>golden<br />retriever</strong><span>金毛犬</span></div></div>
      </div>
      <div className="el-embedding-output">
        <div className="el-frozen-encoder"><svg width="36" height="42" viewBox="0 0 36 42" aria-hidden="true"><path d="M9 17V11a9 9 0 0 1 18 0v6" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="3" y="17" width="30" height="23" rx="6" fill="currentColor"/><path d="M18 25v7" stroke="white" strokeWidth="3"/></svg><strong>文本编码器</strong><span>预训练权重固定</span></div>
        <span className="el-flow-arrow" aria-hidden="true">→</span>
        <div className="el-output-feature" key={step}><span className="el-feature-mark"><i/><i/><i/></span><div><strong>一个类别文本特征</strong><span>代表整段描述</span></div></div>
      </div>
      <p className="el-stage-footnote">上方按概念分组，不对应真实 token 数量；数字条仅为表示方式的示意。</p>
    </div>
    <p className="note">{step === 0 ? '从左往右读：多个文本片段经过数字化和编码，最终得到代表这整个类别描述的一个特征；示意方块不对应真实的分词数量。'
      : step === 1 ? '左边每个输入向量对应一个 token；右边只有一个代表整段提示的文本特征。中间带锁的编码器负责转换，图中省略了内部细节。'
      : '橙色的三个上下文向量允许训练更新，蓝色部分固定。此处 M=3 只是结构例子；显示的数字是示意值，画面展示结构替换，不是一次训练的前后结果。'}</p>
    <div className="ctrl">
      <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => move(step - 1)}>上一步</button>
      <span aria-live="polite">第 {step + 1} / 3 步</span>
      <button type="button" className="tiny" disabled={step === 2} onClick={() => move(step + 1)}>下一步</button>
      <button type="button" className="tiny ghost" onClick={() => move(0)}>重置</button>
    </div>
    {step === 2 && <div className="ctrl" role="group" aria-label="理解检查：CoOp直接更新什么">
      <span>开始训练时，CoOp 直接更新哪一项？</span>
      {[['input', '输入的上下文向量'], ['encoder', '文本编码器权重'], ['output', '独立的输出类别向量']].map(([value, label]) => <button type="button" key={value} className={'chip' + (answer === value ? ' selected' : '')} aria-pressed={answer === value} onClick={() => setAnswer(value)}>{label}</button>)}
    </div>}
    <Feedback tone={answer === null ? 'neutral' : answer === 'input' ? 'good' : 'bad'}>
      {answer === 'input' ? '对。更新的是输入端的上下文向量。输出文本特征会通过固定的编码器重新计算，不能被当作独立参数随意修改。'
        : answer === 'encoder' ? '文本编码器参与计算，但不更新预训练权重。橙色上下文才是本方法允许训练修改的参数。'
        : answer === 'output' ? '输出会随输入改变，但不是独立参数。先更新上下文，再通过编码器得到新的输出；下一章可以亲手验证这一点。'
        : step === 0 ? '先记住两个部分：上下文负责描述，类别名称说明“是哪一类”。CoOp 要改变的是前一部分的输入表示。'
        : step === 1 ? '输入向量是一段文字的组成材料，最终文本特征代表整段描述。二者都用数字表示，但不是同一层的东西。'
        : '“软提示”指直接学习这些连续数值，不要求把它们翻译成单词。M 只统计上下文向量，不包含类别名称、特殊符号或填充位置。'}
    </Feedback>
    <details>
      <summary>向量有多长，最后怎样得到一个文本特征？</summary>
      <p>依据第 4 页 §3.1 与第 5 页 §3.2 式（2）。论文所述设置的输入词嵌入宽度 d=512；图中只展开一个向量的 3 个示意坐标，不是真实 CLIP 数值，也未把所有输入和输出宽度都设为 512。</p>
      <p>CLIP 取文本编码器在结束符号 EOS 位置的隐藏表示，再经过投影与归一化，得到用于比较的文本特征。投影将它映射到图文比较的空间；归一化将长度统一，便于比较方向。</p>
    </details>
    <details>
      <summary>最近的词，能“翻译”出软提示吗？</summary>
      <p>论文第 10–11 页的表 4，寻找已学习向量在词表中的欧氏距离最近邻。Pets 的结果中出现了 <code>fluffy</code>（距离 1.6099）与 <code>paw</code>（距离 1.3055），但完整序列没有组成有意义的句子。</p>
      <p>这是论文训练后向量的检索结果，不是上图示意数字解码出来的词。最近邻可以提供线索，不能保证准确表达向量的含义。</p>
    </details>
  </div>;
};