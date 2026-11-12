import { useState } from 'react';
import { Hint, Term } from '../components/Hint';
import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { paper, pinned, supplement } from '../data/tutorial';
import { Coast } from './Coast';
import './results.css';
import './high-resolution.css';

const budgets = [160, 320, 640] as const;
type Budget = typeof budgets[number];
const settings = {
  160: { dominant: 135, contextual: 25, average: 92.0 },
  320: { dominant: 270, contextual: 50, average: 95.0 },
  640: { dominant: 540, contextual: 100, average: 97.6 },
};

// Table 2, training-free rows. Each pair contains the printed raw and relative scores.
const tasks = [
  { name: 'GQA', baseline: 64.2, 160: [55.5, 86.4], 320: [59.3, 92.3], 640: [61.3, 95.5] },
  { name: 'MMB', baseline: 67.9, 160: [60.1, 88.5], 320: [63.1, 92.9], 640: [66.3, 97.6] },
  { name: 'MME', baseline: 1842, 160: [1630, 88.5], 320: [1702, 92.4], 640: [1787, 97.0] },
  { name: 'SQA', baseline: 70.2, 160: [68.3, 97.3], 320: [67.3, 95.9], 640: [68.1, 97.0] },
  { name: 'VQAv2', baseline: 80.1, 160: [71.4, 89.1], 320: [76.2, 95.1], 640: [79.1, 98.8] },
  { name: 'TextVQA', baseline: 61.3, 160: [56.2, 91.7], 320: [58.9, 96.1], 640: [60.2, 98.2] },
  { name: 'MMMU', baseline: 35.1, 160: [36.1, 102.8], 320: [35.3, 100.5], 640: [34.7, 98.9] },
] as const;

function BudgetControl({ value, change, label }: { value: Budget; change: (value: Budget) => void; label: string }) {
  return <div>
    <span className="vz-choice-title">{label}</span>
    <SegmentBar className="vz-choice-line" value={value} role="group" aria-label={label}>
      {budgets.map(budget =>
        <button type="button" key={budget} aria-pressed={value === budget} onClick={() => change(budget)}>{budget}</button>
      )}
    </SegmentBar>
  </div>;
}

type BudgetProps = { budget: Budget; setBudget: (value: Budget) => void };

function ViewBudget({ budget, setBudget }: BudgetProps) {
  const { dominant, contextual } = settings[budget];
  const feedback = useContentMotion<HTMLDivElement>(budget);
  return <section className="vz-results-panel vzs-panel" id="module-5-1">
    <div className="vz-results-heading">
      <h3><span className="vzs-lab-num">5.1</span> 整张图的名额，五个视图怎么分？</h3>
      <a className="vz-results-cite" href={supplement + '#page=2'} target="_blank" rel="noreferrer">补充表 7 ↗</a>
    </div>
    <p>把灯塔全景缩小，船和岸的位置关系还在，塔窗却只剩几个像素。论文里的 LLaVA-NeXT 同时读缩小的全图和四块局部。五份视图分别经过视觉编码器，每份原有 576 个<Term name="视觉 token"/>，合计 2,880 个。</p>
    <div className="vzhr-views" role="group" aria-label="论文五视图设置的灯塔示意">
      <figure className="vzhr-view"><div className="vzhr-scene"><Coast/></div><figcaption><strong>1 张全图</strong><span>保留场景关系</span></figcaption></figure>
      <span className="vzhr-plus" aria-hidden="true">+</span>
      <figure className="vzhr-view"><div className="vzhr-scene vzhr-crops"><Coast/></div><figcaption><strong>4 张局部</strong><span>分块读取细节</span></figcaption></figure>
    </div>
    <div className="vz-results-controls">
      <BudgetControl value={budget} change={setBudget} label="五个视图合计保留"/>
    </div>
    <div ref={feedback} className="vzhr-allocation" aria-live="polite">
      <div><span>拆到每个视图</span><b>{dominant / 5} <small>主导</small> + {contextual / 5} <small>上下文</small></b><span>每份从 576 个缩到 {budget / 5} 个</span></div>
      <div><span>五个视图合计</span><b>{dominant} <small>主导</small> + {contextual} <small>上下文</small></b><span>总计 {budget} 个，占原预算的 {(budget / 2880 * 100).toFixed(1)}%</span></div>
    </div>
    <p className="vz-results-note">补充表 7 给的是五个视图合计的两类名额。每个视图的数字按相同预算拆算。作者的实现先逐视图压缩，再把全图与局部特征拼起来；实际局部网格可随图像尺寸变化。<a className="vz-results-cite" href={pinned + 'visionzip/llava_arch.py#L91-L123'} target="_blank" rel="noreferrer">查看实现 ↗</a></p>
  </section>;
}

function BenchmarkReadout({ budget, setBudget }: BudgetProps) {
  const [index, setIndex] = useState(3);
  const task = tasks[index];
  const raw = (score: number) => task.name === 'MME' ? String(score) : score.toFixed(1);
  const [score, relative] = task[budget];
  const feedback = useContentMotion<HTMLDivElement>(budget + '/' + index);
  return <section className="vz-results-panel vzs-panel" id="module-5-2">
    <div className="vz-results-heading">
      <h3><span className="vzs-lab-num">5.2</span> 名额翻倍，哪些任务真的涨分？</h3>
      <a className="vz-results-cite" href={paper + '#page=6'} target="_blank" rel="noreferrer">正文表 2 ↗</a>
    </div>
    <p>试着把预算从 160 调到 320，先看科学问答 SQA，再换成图像推理 GQA。两项实验共用同一个免训练模型，增加的名额一样，分数却朝不同方向变动。</p>
    <div className="vz-results-controls">
      <BudgetControl value={budget} change={setBudget} label="表 2 的整图预算"/>
      <label className="vz-benchmark-label"><span className="vz-choice-title">比较哪个任务</span>
        <select value={index} onChange={e => setIndex(Number(e.currentTarget.value))}>
          {tasks.map((entry, i) => <option key={entry.name} value={i}>{entry.name}</option>)}
        </select>
      </label>
    </div>
    <div className="vzhr-scores">
      <table aria-label={task.name + ' 单项原始分和相对完整模型的保留率'}>
        <thead><tr><th scope="col">视觉 token</th><th scope="col">{task.name} 原始分</th><th scope="col">单项保留率</th></tr></thead>
        <tbody>
          <tr><th scope="row">2,880 <small>原版</small></th><td>{raw(task.baseline)}</td><td>100%</td></tr>
          {budgets.map(n => <tr key={n} className={n === budget ? 'vzhr-selected' : undefined}>
            <th scope="row">{n}</th><td>{raw(task[n][0])}</td><td>{task[n][1].toFixed(1)}%</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="vz-results-feedback" ref={feedback} aria-live="polite">
      <strong>{budget} 个视觉 token · {task.name} 得 {raw(score)} 分</strong>
      <span>完整模型在这项上得 {raw(task.baseline)} 分。表 2 报告的<Hint title="单项保留率" text="压缩后得分除以同任务的完整模型得分，再乘以 100%。论文表中两行分别显示原始分与相对得分，均经过取舍。">单项保留率</Hint>为 <b>{relative.toFixed(1)}%</b>，同预算下七项任务的平均保留率为 <b>{settings[budget].average.toFixed(1)}%</b>。</span>
    </div>
    <p className="vz-results-note">预算从 160 翻到 320，七项平均从 92.0% 升到 95.0%。其中 SQA 从 68.3 降到 67.3，MMMU 从 36.1 降到 35.3。这里读的是同一张表的观测分数；判断差异能否稳定复现，还需要重复实验。</p>
  </section>;
}

export default function HighResolution() {
  const [budget, setBudget] = useState<Budget>(160);
  return <div className="vz-results vzhr">
    <ViewBudget budget={budget} setBudget={setBudget}/>
    <BenchmarkReadout budget={budget} setBudget={setBudget}/>
  </div>;
}
