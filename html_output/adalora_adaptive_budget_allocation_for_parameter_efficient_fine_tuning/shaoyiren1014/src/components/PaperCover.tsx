import type {RefObject} from 'react';

type Props={mainRef:RefObject<HTMLElement|null>;resume:boolean;onEnter:()=>void};

export default function PaperCover({mainRef,resume,onEnter}:Props){
 return <main ref={mainRef} className="paper-cover" tabIndex={-1} aria-labelledby="paper-cover-title">
  <h1 id="paper-cover-title"><span>AdaLoRA</span><span className="paper-cover-subtitle">Adaptive Budget Allocation for<br className="paper-cover-break"/> Parameter-Efficient Fine-Tuning</span></h1>
  <dl className="paper-cover-intro">
   <div><dt>核心思想</dt><dd>根据训练中估计的重要性，动态调整各处的低秩适配容量，把有限预算用在更需要的地方。</dd></div>
   <div><dt>背景</dt><dd>大模型微调的资源有限，而不同模块对新任务的适配需求可能不同。</dd></div>
   <div><dt>作用</dt><dd>让有限参数的分配更有依据，在论文验证的语言任务中通常能取得更有竞争力的效果。</dd></div>
  </dl>
  <p className="paper-cover-keywords"><span>关键词</span>参数高效微调 · LoRA · 低秩适配 · 自适应 Rank · 重要性估计 · 预算分配</p>
  <button className="primary-button paper-cover-enter" onClick={onEnter}>{resume?'继续学习':'开始学习'} <span aria-hidden="true">→</span></button>
 </main>;
}
