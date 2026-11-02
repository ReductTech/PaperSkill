import { useState } from 'react';
import { S, Slider, Feedback, Record, fmt } from './le-kit';
import './le.css';
import './late.css';

const resultSets = [
  { name: 'RoBERTa · QQP · 秩 8', source: '论文表 3', lambdas: [.1, .3, .5, .7, .9], accuracy: [-3.3, -1.6, -.6, 0, .1], forgetting: [-52, -50.6, -45, -33.2, -13] },
  { name: 'LLaMA2 · MetaMath · 秩 256', source: '论文表 4', lambdas: [.3, .5, .7, .9], accuracy: [-.1, 1.8, .5, -.8], forgetting: [-33.3, -25.2, -15.5, -5.2] },
  { name: 'RoBERTa · MNLI · 秩 1', source: '论文表 3', lambdas: [.1, .3, .5, .7, .9], accuracy: [-18.7, -8.3, -2.7, -.6, 0], forgetting: [-13.3, -14.5, -13.7, -11, -5.1] },
];

function SignedPlot({ title, values, lambdas, selected, min, max, goodNegative, onSelect }: {
  title: string; values: number[]; lambdas: number[]; selected: number; min: number; max: number; goodNegative?: boolean; onSelect: (n: number) => void;
}) {
  const y = (n: number) => 58 + (max - n) / (max - min) * 95;
  return <div className="le-late-plot" aria-label={title}>
    <strong className="le-late-plot-title">{title}</strong>
    <div className="le-late-plot-field">
      <div className="le-late-zero" style={{ top: y(0) }}><span>0</span></div>
      {values.map((value, i) => <button key={lambdas[i]} className={`le-late-dot ${selected === i ? 'selected' : ''}`} style={{ left: `${12 + i * 76 / (values.length - 1)}%`, top: y(value), color: value === 0 ? '#27446e' : ((value < 0) === !!goodNegative ? '#228d5c' : '#c43f52') }} onClick={() => onSelect(i)} aria-label={`选择缩放系数 ${lambdas[i]}，${title} ${value}%`}>
        <b>{value > 0 ? '+' : ''}{fmt(value, 1)}%</b><i />
      </button>)}
      <div className="le-late-x-ticks">{lambdas.map((v, i) => <span key={v} style={{ left: `${12 + i * 76 / (values.length - 1)}%` }}>{fmt(v, 1)}</span>)}</div>
    </div>
    <div className="le-late-axis-label"><S meaning="λ：对每个权重矩阵中最大入侵奇异项的缩放系数；1 为保持不变。">λ</S> · 实测档位</div>
  </div>;
}

export function LoraResults() {
  const [config, setConfig] = useState(0);
  const [index, setIndex] = useState(3);
  const data = resultSets[config];
  const lambda = data.lambdas[index];
  const choose = (value: number) => { setConfig(value); setIndex(resultSets[value].lambdas.indexOf(.7)); };
  return <div className="le-page le-late-results">
    <div className="le-late-result-head">
      <label>实验设置 <select aria-label="实验设置" value={config} onChange={e => choose(Number(e.target.value))}>{resultSets.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}</select></label>
      <span>{data.source} · 相对未干预模型的变化</span>
      <button className="le-btn" onClick={() => { setConfig(0); setIndex(3); }}>重置</button>
    </div>
    <div className="le-late-plots">
      <SignedPlot title="测试准确率相对变化（%）" values={data.accuracy} lambdas={data.lambdas} selected={index} min={-20} max={3} onSelect={setIndex} />
      <SignedPlot title="微调诱发遗忘的变化（%）" values={data.forgetting} lambdas={data.lambdas} selected={index} min={-55} max={0} goodNegative onSelect={setIndex} />
    </div>
    <div className="le-late-result-control">
      <div className="le-late-record"><Record count={1}/></div>
      <label className="le-late-discrete"><span>缩放系数 <S meaning="λ：仅改变所选入侵奇异项的幅度。此处只可选择作者表中报告的档位。">λ</S> = <b>{fmt(lambda, 1)}</b></span>
        <input aria-label="论文实测缩放档位" type="range" min="0" max={data.lambdas.length - 1} step="1" value={index} onChange={e => setIndex(Number(e.target.value))}/>
      </label>
      <p>准确率变化越高越好；遗忘变化越低越好。</p>
    </div>
    <Feedback tone={data.accuracy[index] < -2 ? 'orange' : 'green'}>
      λ = {fmt(lambda, 1)}：准确率{data.accuracy[index] === 0 ? '相对变化约 0%' : `相对${data.accuracy[index] > 0 ? '增加' : '下降'} ${fmt(Math.abs(data.accuracy[index]), 1)}%`}，遗忘减少 {fmt(-data.forgetting[index], 1)}%。{data.accuracy[index] < -2 ? '这档干预带来明显任务代价。' : '该设置下，保持能力有所改善。'}
    </Feedback>
  </div>;
}

const tasks = ['MNLI', 'QQP', 'SST-2', 'SIQA', 'WinoGrande', 'FEVER'];
export function LoraContinual() {
  const [step, setStep] = useState(1);
  const [full, setFull] = useState(false);
  return <div className="le-page le-late-continual">
    <div className="le-late-sequence">
      <div className="le-late-tape"><Record count={step}/></div>
      <div className="le-late-task-list">{tasks.map((task, i) => <button key={task} className={`le-late-task ${i < step ? 'done' : ''} ${i === step - 1 ? 'current' : ''}`} onClick={() => setStep(i + 1)} aria-pressed={i === step - 1}><b>{i + 1}</b><span>{task}</span>{i < step && <em>已合并</em>}</button>)}</div>
      <div className="le-late-sequence-status" aria-live="polite">{step < tasks.length ? <>已完成 <strong>{step}</strong> 个任务</> : <>六项任务训练结束</>}</div>
    </div>
    <div className="le-late-continual-evidence">
      <div className="le-late-figure-head"><strong>{full ? '六项任务的持续学习曲线' : 'MNLI 与 QQP 的保持情况'}</strong><button className="le-btn" onClick={() => setFull(v => !v)}>{full ? '放大前两项' : '查看完整图'}</button></div>
      {!full && <div className="le-late-legend"><span><i style={{background:'#2450fc'}}/>全参数</span><span><i style={{background:'#ffc60a'}}/>秩 1</span><span><i style={{background:'#ffa10a'}}/>秩 8</span><span><i style={{background:'#ff670a'}}/>秩 64</span></div>}
      <div className={`le-late-figure ${full ? 'full' : 'detail'}`}><img src={full ? './images/continual-full.png' : './images/continual-pair.png'} alt="论文图17：依次训练六项任务后的准确率；全参模型与秩1、8、64的LoRA曲线。"/></div>
      <p className="le-late-figure-caption">论文图 17：横轴为已训练任务，纵轴为准确率。</p>
    </div>
    <div className="le-late-merge-rule">
      <span><S meaning="W：当前主干权重；每个任务后把该任务的低秩更新合并进去。">W</S> ← <S meaning="W：合并前主干权重。">W</S> + <S meaning="α/r：LoRA 分支的缩放系数。">α/r</S> · <S meaning="B、A：本任务训练的两个低秩因子。">BA</S></span>
      <span>{step < tasks.length ? <>合并 {tasks[step - 1]} 后，为 {tasks[step]} 重新初始化适配器。</> : <>FEVER 的更新已合并，六项任务训练结束。</>}</span>
      <button className="le-btn" onClick={() => { setStep(1); setFull(false); }}>重置</button>
    </div>
    <Feedback>每个任务的评价都单独重训分类头，再测试其数据集；图中曲线对应这一评价设置。</Feedback>
  </div>;
}

const evidence = [
  { title: '相关关系', heading: '入侵维度越多，预训练遗忘往往越明显', body: 'RoBERTa 的学习率扫描中，Spearman 相关系数为 0.971；LLaMA2 跨训练轮次为 0.59。作者随后用定向缩放检验这种联系。', detail: 'RoBERTa：p ≪ 0.001；LLaMA2：p = 0.0006。', memo: '同时记录方向变化和保持表现。' },
  { title: '定向对照', heading: '改变入侵项与改变相邻原始方向，效果不同', body: '作者选取奇异值接近的相邻非入侵方向作对照。减弱入侵项降低预训练损失；减弱相邻原始方向会提高损失，并更明显地损害任务表现。', detail: '对照保持相近的奇异值量级，比较所干预方向的身份。', memo: '干预的位置和强度都要保留记录。' },
  { title: '研究迁移', heading: '单次适配与连续学习，关注不同保持能力', body: '图6中，LoRA通常较好地保持预训练与域外能力，RoBERTa的任务成绩接近。图17中，连续训练的低秩LoRA更快遗忘旧任务。', detail: '迁移到视觉语言模型时，可同时记录旧类准确率、零样本表现和入侵数量。', memo: '下一步用小模型验证跨任务关系。' },
];
function Headphones() {
  return <svg viewBox="0 0 300 250" aria-hidden="true"><path d="M55 150V116a95 95 0 0 1 190 0v34" fill="none" stroke="#b99c79" strokeWidth="29"/><path d="M55 150V116a95 95 0 0 1 190 0v34" fill="none" stroke="#27446e" strokeWidth="12"/><rect x="26" y="126" width="60" height="100" rx="24" fill="#27446e"/><rect x="214" y="126" width="60" height="100" rx="24" fill="#27446e"/><rect x="70" y="137" width="23" height="78" rx="10" fill="#e8e9e5"/><rect x="207" y="137" width="23" height="78" rx="10" fill="#e8e9e5"/></svg>;
}
export function LoraBoundaries() {
  const [selected, setSelected] = useState(1);
  const entry = evidence[selected];
  return <div className="le-page le-late-boundaries">
    <div className="le-late-evidence-nav">{evidence.map((e, i) => <button key={e.title} className={`le-btn ${selected === i ? 'is-active' : ''}`} aria-pressed={selected === i} onClick={() => setSelected(i)}>{i + 1}　{e.title}</button>)}</div>
    <article className="le-late-evidence-text" aria-live="polite">
      <h3>{entry.heading}</h3><p>{entry.body}</p><div className="le-late-evidence-detail">{entry.detail}</div>
      <p className="le-late-sensitivity">计数会随 <S meaning="ε：判断奇异方向匹配程度的阈值。">ε</S> 和 <S meaning="k：按奇异值排序后接受检查的微调方向数量。">k</S> 改变；同一结论应联系对应的模型、层和任务。</p>
    </article>
    <aside className="le-late-notebook"><Headphones/><div className="le-late-memo"><b>试听笔记</b><p>{entry.memo}</p></div></aside>
    <div className="le-late-boundary-foot"><span>正文第 4–5 节，附录 F、G、L</span><button className="le-btn" onClick={() => setSelected(1)}>重置</button></div>
  </div>;
}

const options = [{ lambda: .3, cost: 1.6, benefit: 50.6 }, { lambda: .7, cost: 0, benefit: 33.2 }, { lambda: 1, cost: 0, benefit: 0 }];
export function LoraChallenge() {
  const [tolerance, setTolerance] = useState(.5);
  const [selected, setSelected] = useState(1);
  const feasible = options.map(option => option.cost <= tolerance + 1e-9);
  const best = options.reduce((answer, option, i) => feasible[i] && option.benefit > options[answer].benefit ? i : answer, 2);
  const picked = options[selected];
  return <div className="le-page le-late-challenge">
    <div className="le-late-challenge-intro">基于表 3 的选参演算：RoBERTa · QQP · 秩 8</div>
    <div className="le-late-console">{options.map((option, i) => <button key={option.lambda} onClick={() => setSelected(i)} aria-pressed={selected === i} aria-label={`选择缩放系数 ${option.lambda}`} className={`le-late-channel ${selected === i ? 'selected' : ''} ${feasible[i] ? 'feasible' : 'blocked'}`}>
      <strong>λ = {fmt(option.lambda, 1)}</strong>
      <div className="le-late-fader"><div className="le-late-fader-slot"/><div className="le-late-fader-knob" style={{bottom: `${15 + option.lambda * 90}px`}}><i/></div></div>
      <span>任务损失 {fmt(option.cost, 1)}%</span><b>遗忘减少 {fmt(option.benefit, 1)}%</b><em>{feasible[i] ? '满足容忍范围' : '超出容忍范围'}</em>
    </button>)}</div>
    <div className="le-late-tolerance"><Slider label="允许的任务准确率相对损失" value={tolerance} min={0} max={2} step={.1} onChange={setTolerance} unit="%"/><button className="le-btn" onClick={() => { setTolerance(.5); setSelected(1); }}>重置</button></div>
    <Feedback tone={!feasible[selected] ? 'red' : selected === best ? 'green' : 'blue'}>{!feasible[selected] ? `所选 λ = ${fmt(picked.lambda, 1)} 使任务准确率相对下降 ${fmt(picked.cost, 1)}%，超过 ${fmt(tolerance, 1)}% 的容忍范围。` : selected === best ? `在这三个候选中，λ = ${fmt(picked.lambda, 1)} 满足约束，且遗忘减少最多：${fmt(picked.benefit, 1)}%。` : `当前选择满足约束；λ = ${fmt(options[best].lambda, 1)} 在同一容忍范围内可减少更多遗忘。`}</Feedback>
    <p className="le-late-challenge-note">λ = 1 是未干预参照。实际选参时在验证集检查任务保持，再测试后续任务。</p>
  </div>;
}
