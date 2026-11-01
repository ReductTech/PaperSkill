import { useState } from 'react';
import { Source } from './Interactions';
import './styles/demonstrations.css';

export function DemonstrationSources() {
  return <div className="demo-sources">
    <div className="demo-flow" aria-label="三个原始数据集，经 Gemini 生成交错式 CoT、质量筛选，形成 SFT 数据集">
      <div className="demo-origin"><span>原始数据与人工推理标注</span><strong>MINERVA <i>/</i> CausalVQA <i>/</i> Social Genome</strong></div>
      <span className="demo-flow-arrow" aria-hidden="true">↓</span>
      <div className="demo-flow-step"><strong>Gemini 2.5 Pro</strong><span>生成新的交错式 CoT，可包含视觉工具调用</span></div>
      <span className="demo-flow-arrow" aria-hidden="true">↓</span>
      <div className="demo-flow-step"><strong>质量筛选</strong><span>答案、与人工 CoT 的语义相似度、格式</span></div>
      <span className="demo-flow-arrow" aria-hidden="true">↓</span>
      <div className="demo-flow-end"><strong>SFT 数据集</strong><span>3,373 条示范</span></div>
    </div>
  </div>;
}

type Candidate = { label: string; question: string; truth: string; answer: string; similarity: number; trace: string; reason: string };
const candidates: readonly Candidate[] = [
  { label: '候选 A', question: '视频里，杯子最后被放在哪里？', truth: '桌子右侧', answer: '桌子右侧', similarity: 88, trace: '<think>初始帧看不清落点；<retrieve>杯子放下后的桌面</retrieve>。新增帧显示杯子在桌子右侧。</think><answer>桌子右侧</answer>', reason: '答案、相似度和格式均通过。' },
  { label: '候选 B', question: '骑车人转弯前举起了哪只手？', truth: '左手', answer: '右手', similarity: 91, trace: '<think>转弯前的画面里，骑车人举起右手示意。</think><answer>右手</answer>', reason: '最终答案与标注不符；论文流程允许从原输入重新生成，最多重试两次。' },
  { label: '候选 C', question: '小狗越过栅栏后跑向哪里？', truth: '花坛', answer: '花坛', similarity: 80, trace: '<think>小狗先看向远处的路牌，随后跑到花坛旁。</think><answer>花坛</answer>', reason: '答案虽然正确，但 BGE-M3 相似度恰好 80%，未超过门槛。' },
  { label: '候选 D', question: '行人躲雨时走进了什么地方？', truth: '公交站亭', answer: '公交站亭', similarity: 86, trace: '<think>雨变大后，行人走向路边有顶棚的公交站亭。</think><answer>公交站亭', reason: '缺少 </answer> 结束标记，格式检查不通过。' },
];

const requiredFormat = (trace: string) => {
  const tags = ['<think>', '</think>', '<answer>', '</answer>'];
  return tags.every(tag => trace.includes(tag)) && trace.indexOf('<think>') < trace.indexOf('</think>') && trace.indexOf('</think>') < trace.indexOf('<answer>') && trace.indexOf('<answer>') < trace.indexOf('</answer>');
};

export function DemonstrationFilter() {
  const [selected, setSelected] = useState(0);
  const sample = candidates[selected];
  const answerOK = sample.answer === sample.truth;
  const similarityOK = sample.similarity > 80;
  const formatOK = requiredFormat(sample.trace);
  const keep = answerOK && similarityOK && formatOK;
  return <div className="demo-filter">
    <div className="demo-filter-head"><strong>选择一条候选推理</strong></div>
    <div className="demo-candidates" role="group" aria-label="选择教学模拟 CoT 候选样本">
      {candidates.map((item, index) => <button type="button" key={item.label} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.label}</button>)}
    </div>
    <div className="demo-sample" aria-live="polite" aria-atomic="true">
      <span className="demo-sim-label">教学模拟，非论文真实样本；相似度为模拟数值</span>
      <h3>{sample.question}</h3>
      <div className="demo-trace"><span>Gemini 候选 CoT 片段</span><code>{sample.trace}</code></div>
      <div className="demo-checks" aria-label="筛选结果">
        <div><span>答案核验</span><strong className={answerOK ? 'pass' : 'fail'}>{answerOK ? '通过' : '未通过'}</strong><small>标注：{sample.truth} · 候选：{sample.answer}</small></div>
        <div><span>BGE-M3 语义相似度</span><strong className={similarityOK ? 'pass' : 'fail'}>{sample.similarity}% · {similarityOK ? '通过' : '未通过'}</strong><small>与人工 CoT 比较；须严格 &gt; 80%</small></div>
        <div><span>格式检查</span><strong className={formatOK ? 'pass' : 'fail'}>{formatOK ? '通过' : '未通过'}</strong><small>检查必要的推理与答案标记</small></div>
      </div>
      <div className={`demo-verdict ${keep ? 'keep' : 'discard'}`}><strong>{keep ? '保留这条示范' : '淘汰这条候选'}</strong><span>{sample.reason}</span></div>
    </div>
  </div>;
}

const segments = [
  { name: '纯文本 CoT', value: 1765, className: 'text' },
  { name: '检索 CoT', value: 1026, className: 'retrieval' },
  { name: '生成 CoT', value: 582, className: 'generation' },
] as const;

export function DemonstrationComposition() {
  return <div className="demo-composition">
    <div className="demo-total"><span>筛选后 SFT 示范</span><strong>3,373 <small>条</small></strong></div>
    <figure className="demo-chart">
      <div className="demo-chart-bar" role="img" aria-label="3,373 条示范中，纯文本 CoT 1,765 条，检索 CoT 1,026 条，生成 CoT 582 条">
        {segments.map(segment => <span key={segment.name} className={segment.className} style={{ flexGrow: segment.value }} />)}
      </div>
      <figcaption>{segments.map(segment => <div key={segment.name}><i className={segment.className}/><span>{segment.name}</span><strong>{segment.value.toLocaleString('en-US')} 条</strong></div>)}</figcaption>
    </figure>
    <p className="demo-frame-share"><strong>1,608 条 · 47.67%</strong> 带新增视觉帧，即检索与生成两类之和。</p>
    <figure className="demo-paper-figure"><a href="./paper/figure-2.png" target="_blank" rel="noreferrer" aria-label="打开论文 Figure 2 原图"><img src="./paper/figure-2.png" alt="论文 Figure 2：MINERVA、CausalVQA、Social Genome 三个来源及任务类型的组成"/></a><figcaption>论文 Figure 2 展示三个来源及其任务类型分布。<Source where="§3.4 · Figure 2"/></figcaption></figure>
    <p className="demo-ending">高质量示范既包含主动获取视觉信息的行为，也包含无需额外工具的普通推理。</p>
  </div>;
}
