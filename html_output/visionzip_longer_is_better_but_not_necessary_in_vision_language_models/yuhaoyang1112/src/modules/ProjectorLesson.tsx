import { useState } from 'react';
import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { Term } from '../components/Hint';
import { table1, type ResultBudget } from '../data/table1';
import { paper, supplement } from '../data/tutorial';
import './projector-lesson.css';

const stages = [
  { name: '视觉编码器', state: '冻结权重' },
  { name: '投影层', state: '更新权重' },
  { name: '语言模型', state: '冻结权重' },
] as const;

export default function ProjectorLesson({ budget }: { budget: ResultBudget }) {
  const [stage, setStage] = useState(1);
  const feedback = useContentMotion<HTMLDivElement>(stage + '/' + budget);
  const scores = table1[budget];
  const explanations = [
    <>视觉编码器先从图像提取特征。VisionZip 挑出主导 token，再把相似的剩余特征合并为上下文 token。这一步把 576 个视觉位置压到 {budget} 个，沿用编码器原有的权重。</>,
    <>投影层把每个保留的视觉向量映射到语言模型的词嵌入空间。用压缩后的特征和指令继续训练它，可以调整这 {budget} 个向量怎样被语言模型读到。微调前后都只送出 {budget} 个位置。如果某个细节在这些特征里已经丢失，投影层也无法回到原图再看一眼。</>,
    <>语言模型把投影后的 {budget} 个视觉位置和问题文字一起读进去，按原有权重生成回答。在指令微调时，参考回答用来衡量预测误差，优化器只据此更新前面的投影层。</>,
  ];

  return <section className="vz-results-panel vzs-panel vzp-lesson" id="module-4-3">
    <div className="vz-results-heading">
      <h3><span className="vzs-lab-num">4.3</span> 为什么只微调投影层？</h3>
      <a className="vz-results-cite" href={paper + '#page=4'} target="_blank" rel="noreferrer">正文 §2.4 ↗</a>
    </div>
    <p>LLaVA-1.5 原来用整组 576 个视觉 token 学习图文对齐。压缩后，视觉注意力得分靠前的位置直接保留，其余位置按特征相似度归组。原有的<Term name="投影层">投影层</Term>仍能工作，但它接到的特征组合变了。作者选择在视觉和语言相接的这一层做适配。</p>
    <figure className="vzp-path">
      <figcaption><strong>沿着一张图看，哪一段需要学习？</strong><span>LLaVA-1.5 7B · 微调模式 ‡</span></figcaption>
      <SegmentBar className="vzp-stages" value={stage} role="group" aria-label="查看微调时各模块的职责">
        {stages.map((item, i) => <button key={item.name} type="button" aria-pressed={i === stage} onClick={() => setStage(i)}>
          <strong>{item.name}</strong><small>{item.state}</small>
        </button>)}
      </SegmentBar>
      <div className="vzp-stage-detail" ref={feedback} aria-live="polite">
        <b>{stages[stage].name}</b><span>{explanations[stage]}</span>
      </div>
    </figure>
    <p>同样保留 <strong>{budget} 个 token</strong>，直接使用原权重时，表 1 的平均保留率为 <strong>{scores.free.average.toFixed(1)}%</strong>。只调投影层后升到 <strong>{scores.tuned.average.toFixed(1)}%</strong>。作者为 LLaVA-1.5 7B 抽取了十分之一的指令微调数据，在 8 张 A800 上约用 30 分钟完成训练。这组实验说明少量训练就能改善平均表现。表 1 没有比较解冻整个模型会怎样。 <a className="vz-results-cite" href={paper + '#page=5'} target="_blank" rel="noreferrer">正文表 1 ↗</a></p>
    <details className="vzp-source">
      <summary>换一批指令数据，结果也一样吗？</summary>
      <p>补充表 16 固定模型为 LLaVA-NeXT 7B，仍然只调投影层。保留 160 个 token 时，从 LLaVA-1.5 或 NeXT 各自的指令集抽取十分之一，平均保留率分别为 95.2% 和 95.7%。到 320 个时，顺序反过来，分别为 97.6% 和 97.3%。这项实验改变的是训练数据来源。 <a className="vz-results-cite" href={supplement + '#page=7'} target="_blank" rel="noreferrer">补充表 16 ↗</a></p>
    </details>
  </section>;
}
