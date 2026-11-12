import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { useState } from 'react';
import { paper, pinned } from '../data/tutorial';
import { Term } from '../components/Hint';
import { Coast } from './Coast';
import { TableFive } from './TableFive';

const questions = ['灯塔的塔身是什么颜色？','海面上有什么船？'];

export default function Pipeline() {
  const [q, setQ] = useState(0);
  const feedback = useContentMotion<HTMLParagraphElement>(q);
  return <div className="lesson-body">
    <p className="chapter-lead">换个问题，应该重新选图像里的哪些位置吗？VisionZip 先让视觉编码器读完整张图，再从 <Term name="patch">patch</Term> 特征里选出<Term name="主导 token">主导 token</Term>，把其余位置归给少数<Term name="上下文代表">上下文代表</Term>。做这两步时，问题还没有进入计算。</p>
    <div className="flow-figure vzs-panel" id="module-1-1">
      <div className="panel-heading"><h3><span className="vzs-lab-num">1.1</span> 图像和问题在哪里相遇？</h3><span className="fine">灯塔教学示意 · 流程据正文图 3</span></div>
      <div className="flow-path">
        <div className="flow-stage"><div className="flow-art"><Coast /></div><b>视觉编码</b><small>图像 → patch 特征</small></div>
        <i>→</i><div className="flow-stage active"><span className="flow-mark">V<span>Z</span></span><b>VisionZip</b><small>先选择，再合并</small></div>
        <i>→</i><div className="flow-stage"><span className="projection-icon" aria-hidden="true">≋</span><b><Term name="投影层">模态投影层</Term></b><small>映射到语言空间</small></div>
        <i>→</i><div className="flow-stage"><span className="llm-mark" aria-hidden="true">Aa</span><b>LLM</b><small>图文合在一起推理</small></div>
      </div>
      <fieldset className="question-switch"><legend>换一句问题</legend><SegmentBar value={q} className="vz-question-options">{questions.map((item,i) => <button key={item} aria-pressed={q===i} onClick={() => setQ(i)}>{item}</button>)}</SegmentBar></fieldset>
      <p ref={feedback} className="flow-feedback" aria-live="polite"><b>{q === 0 ? '第一问' : '换问之后'}</b>　{q===0 ? '语言模型收到压缩后的图像特征，以及询问灯塔颜色的文本。' : '语言模型收到同一组图像特征，这次配上询问帆船的文本。图像侧可以直接复用。'}</p>
    </div>
    <p>视觉特征经<Term name="投影层">投影层</Term>映射到语言空间，才和问题一起进入 LLM。同一张图只换问题时，可以把上次保存的视觉表示直接给新一轮使用。</p>
    <details className="source-fold"><summary>出处与口径 · 同图换问的复用条件</summary><p>示意中的问题用于展示数据依赖。复用的前提是图像预处理、视觉模型权重、投影层与压缩配置一致。若保存投影结果，下一问可直接使用；语言端仍需处理新增文本和对话历史。<a href={paper+'#page=8'} target="_blank" rel="noreferrer">正文图 7 · 多轮例子 ↗</a></p>
      <a href={pinned+'visionzip/llava_arch.py#L29-L37'} target="_blank" rel="noreferrer">代码 · 先取视觉塔输出，随后调用 mm_projector ↗</a></details>
    <TableFive />
  </div>;
}
