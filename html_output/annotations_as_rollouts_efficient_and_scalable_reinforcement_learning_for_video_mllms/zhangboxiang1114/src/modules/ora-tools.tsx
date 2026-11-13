import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { advantageExample, correctMoments, mean, selectBalanced, signed } from './ora-math';

// Internal handoff 2026-10-22: grounded refinement; no authorship notes are rendered.
function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={'ora-pick' + (active ? ' active' : '')} aria-pressed={active} onClick={onClick}>{children}</button>;
}
function Feedback({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <div className={'ora-feedback' + (warning ? ' warning' : '')} role="status">{children}</div>;
}
function Evidence({ children }: { children: React.ReactNode }) { return <p className="ora-citation">{children}</p>; }
function Toy() { return <div className="ora-toy-tag">教学示意 · 公式实时计算 · 非论文实测</div>; }
function NumberCell({ value }: { value: number }) { return <b className={value > 0.0005 ? 'ora-positive' : value < -0.0005 ? 'ora-negative' : ''}>{signed(value)}</b>; }

const intervals = [[14, 45], [45, 80], [66, 92]];
const truth = [40, 70];
const intervalIoU = (range: number[]) => Math.max(0, Math.min(range[1], truth[1]) - Math.max(range[0], truth[0])) / (Math.max(range[1], truth[1]) - Math.min(range[0], truth[0]));

function IntervalRows({ showCandidates, showOracle, showReward }: { showCandidates: boolean; showOracle: boolean; showReward: boolean }) {
  return <div className="ora-intervals">
    <div className="ora-interval-axis"><span>0 秒</span><span>60 秒</span><span>120 秒</span></div>
    <div className="ora-interval-row oracle"><span>参考事件</span><div><i style={{ left: '33.333%', width: '25%' }} /></div><b>40–70 s</b></div>
    {showCandidates && intervals.map((range, index) => <div className="ora-interval-row" key={index}><span>候选 {String.fromCharCode(65 + index)}</span><div><i style={{ left: `${range[0] / 1.2}%`, width: `${(range[1] - range[0]) / 1.2}%` }} /></div><b>{showReward ? `IoU ${intervalIoU(range).toFixed(2)}` : `${range[0]}–${range[1]} s`}</b></div>)}
    {showOracle && <div className="ora-interval-row oracle added"><span>额外标注</span><div><i style={{ left: '33.333%', width: '25%' }} /></div><b>IoU 1.00</b></div>}
  </div>;
}

function Cover({ mode }: { mode: string }) {
  return <div className="ora-cover-scene" role="img" aria-label={mode === 'old' ? '模型候选由标注评分' : '保留模型候选，并将标注作为独立学习目标'}>
    <div className="ora-cover-caption">同一个训练问题</div>
    <div className="ora-cover-candidates"><span>候选 A</span><span>候选 B</span><span>候选 C</span></div>
    <div className="ora-cover-anchor">已知正确标注</div>
    <p>{mode === 'old' ? '提供评分参照' : '评分参照 ＋ 可学习的正确示范'}</p>
    {mode === 'new' && <small>策略比较与标注引导分开计算</small>}
  </div>;
}

function RoleQuiz() {
  const [answer, setAnswer] = useState('');
  const choices = [['SFT', '模仿正确输出'], ['GRPO', '比较采样候选'], ['OraRL', '候选比较 ＋ 正确示范']];
  return <><div className="ora-question">若模型生成的区间都不够准，怎样保留探索，又让正确答案参与学习？</div>
    <div className="ora-picks">{choices.map(([key, label]) => <Pick key={key} active={answer === key} onClick={() => setAnswer(key)}>{key}<small>{label}</small></Pick>)}</div>
    {answer && <div className="ora-role-explain"><b>{answer === 'SFT' ? '直接提高标注输出的概率' : answer === 'GRPO' ? '从已生成的候选中学习优劣' : '多一个正向目标，还要设计比较规则'}</b><p>{answer === 'SFT' ? '监督微调把标注当示范。它能教格式与正确输出，但这里没有对同一问题的多种尝试作任务奖励比较。' : answer === 'GRPO' ? '组相对策略优化按奖励计算候选的相对优势。组里可能缺少足够精确的正例；评分不会自动生成一条正确输出。' : 'OraRL 保留策略生成的候选，把标注序列化成额外输出。接下来的难点是：它的高奖励会不会改变原候选的学习方向？'}</p></div>}
    <Feedback>{answer ? '三种角色都合理。本文研究的是第三种角色怎样安全、有效地进入策略更新。' : '先作一个判断，再比较三种标注角色。'}</Feedback><Evidence>论文证据｜Sec. 1；GRPO 是组相对策略优化，rollout 在本文指一次候选输出。</Evidence></>;
}

function Sampling() {
  const [step, setStep] = useState(0);
  const steps = [
    ['输入查询', '例如：“人物把杯子放回桌上”。目标是输出起止区间，不只是回答做了什么。'],
    ['策略采样', '同一个视频与查询生成三次候选。区间不同，说明当前策略仍在探索。'],
    ['奖励比较', '教学例按时间 IoU 评分：交集长度除以并集长度。B 比 A 更接近标注，但它也不完全正确。'],
    ['精确正例缺席', '这组最好的 B 仍只有 0.63 的 IoU。可靠正例可能缺席，尤其在严格阈值或奖励稀疏时。'],
  ];
  return <><Toy /><div className="ora-step-card"><b>0{step + 1}</b><div><strong>{steps[step][0]}</strong><p>{steps[step][1]}</p></div></div>
    <IntervalRows showCandidates={step > 0} showOracle={false} showReward={step > 1} />
    <div className="ora-step-picks">{steps.map((s, i) => <Pick key={s[0]} active={step === i} onClick={() => setStep(i)}>{i + 1}. {s[0]}</Pick>)}</div>
    <div className="ora-actions"><button disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button><button disabled={step === 3} onClick={() => setStep(step + 1)}>下一步</button></div>
    <Feedback>{step === 3 ? '最高分只是“这组里最好”，不保证它已经正确。这个缺口引出标注作为额外正向目标。' : '参考区间只在训练评分中可用；图中的视频和区间均为教学示意。'}</Feedback><Evidence>研究动机｜Sec. 1；这里用单纯 IoU 帮助理解，不替代论文各任务的完整奖励。</Evidence></>;
}

function OracleGroup() {
  const [add, setAdd] = useState(false);
  return <><Toy /><div className="ora-reference-tray"><span draggable onDragStart={e => e.dataTransfer.setData('text/plain', 'oracle')}>参考区间标注 · 40–70 s</span><small>拖入下方，或使用按钮</small></div>
    <div className="ora-drop-track" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.getData('text/plain') === 'oracle') setAdd(true); }}>
      <div className="ora-candidates"><i>候选 A</i><i>候选 B</i><i>候选 C</i></div>
      <IntervalRows showCandidates showOracle={add} showReward />
      {add && <div className="ora-oracle-row"><b>标注参考</b><i>oracle rollout · 额外加入</i></div>}
    </div>
    <button className="ora-toggle" aria-pressed={add} onClick={() => setAdd(!add)}>{add ? '移除标注' : '加入标注'}</button>
    <div className="ora-stats"><div><small>模型自己生成</small><b>3 条，始终保留</b></div><div><small>参考样本</small><b>{add ? '1 条，额外加入' : '只提供评分'}</b></div><div><small>候选组大小</small><b>{add ? '3 + 1 = 4' : '3'}</b></div></div>
    <Feedback>{add ? '标注被转换成合法模型输出后，计算这条输出的概率并参与训练。它不需要模型先碰巧采到，也不是测试时的额外答案来源。' : '目前标注只用于衡量候选好坏。加入之后，它还成为一条能被提高概率的正确输出。'}</Feedback><Evidence>论文证据｜Sec. 3.2，Eq. (5)。三候选及时间区间为教学设置。</Evidence></>;
}

function Baseline({ switching = false }: { switching?: boolean }) {
  const [gt, setGt] = useState(10);
  const [base, setBase] = useState<'mixed' | 'policy'>('mixed');
  const rewards = [2, 5, 7];
  const example = advantageExample(rewards, switching ? 10 : gt);
  const baseline = switching && base === 'policy' ? example.mu : example.mixedMean;
  const flipped = example.mixedMean > 5;
  return <><Toy />{switching ? <div className="ora-picks"><Pick active={base === 'mixed'} onClick={() => setBase('mixed')}>混合均值</Pick><Pick active={base === 'policy'} onClick={() => setBase('policy')}>策略均值</Pick></div> : <label className="ora-range">标注奖励 r_gt <b>{gt.toFixed(1)}</b><input aria-label="标注奖励" type="range" min="0" max="10" step="0.5" value={gt} onChange={e => setGt(+e.target.value)} /></label>}
    <div className="ora-math"><span>策略均值 μ_op = {example.mu.toFixed(2)}</span><span>混合均值 μ_aug = {example.mixedMean.toFixed(2)}</span></div>
    <div className="ora-bars">{rewards.map((r, i) => <div className="ora-bar-row" key={r}><span>候选 {String.fromCharCode(65 + i)} · r={r}</span><div><i style={{ width: `${r * 10}%` }} /><b style={{ left: `${baseline * 10}%` }} /></div><NumberCell value={r - baseline} /></div>)}</div>
    <p className="ora-chart-key">条长：奖励　竖线：当前基准　右侧：奖励减基准（中心化优势）</p>
    <div className="ora-paired-metrics"><section><small>候选 B 按策略均值</small><NumberCell value={5 - example.mu} /><span>应当相对强化</span></section><section><small>候选 B 按混合均值</small><NumberCell value={5 - example.mixedMean} /><span>{flipped ? '变成相对抑制' : example.mixedMean === 5 ? '临界点：零优势' : '尚未翻转'}</span></section></div>
    <Feedback warning={!switching && flipped || switching && base === 'mixed'}>{switching ? base === 'policy' ? '候选没变，B 的中心化优势回到 +0.333。分开比较基准与标注引导，消除了由标注抬高基准引起的翻转。完整方法还有增益与再中心化，下一章继续检查。' : '把奖励为 10 的标注计入均值后，B 的中心化优势从 +0.333 变成 −1.000。改变的是参照，不是候选质量。' : gt > 6 ? `混合均值已超过 5：B 的中心化优势变为 ${signed(5 - example.mixedMean)}。它明明优于策略平均，却收到反方向信号。` : gt === 6 ? 'r_gt=6 是本例的临界值：混合均值刚好为 5，B 的优势为零。继续升高才会翻转。' : '本例只有 r_gt>6 才会翻转 B。标注高于策略均值还不够，B 也必须落在两种均值之间。'}</Feedback>
    <Evidence>机制证据｜Sec. 3.2，Eq. (6)。翻转区间 μ_op&lt;r_i&lt;μ_aug；此处展示中心化值，未除以标准差。</Evidence></>;
}

function SynchronizedComparison() {
  const [selected, setSelected] = useState(1);
  const rewards = [2, 5, 7];
  const x = advantageExample(rewards, 10);
  return <><Toy /><div className="ora-picks">{rewards.map((r, i) => <Pick key={r} active={selected === i} onClick={() => setSelected(i)}>候选 {String.fromCharCode(65 + i)} · r={r}</Pick>)}</div>
    <div className="ora-two-col"><section><small>朴素混合 · 中心化值</small><strong>奖励 − 混合均值</strong><NumberCell value={rewards[selected] - x.mixedMean} /><p>标注改变了候选比较的基准。</p></section><section><small>OraRL · 初始策略优势</small><strong>奖励 − 策略均值</strong><NumberCell value={x.base[selected]} /><p>这一步只比较模型自己的候选；下一步再加入有界引导。</p></section></div>
    <Feedback>{selected === 1 ? 'B 揭示了关键风险：正负号翻转意味着学习方向反了，不只是数值变小。' : '这个候选在两种基准下符号相同。并非所有候选都会翻转，B 才是落在翻转区间中的例子。'}</Feedback><Evidence>该对照只隔离 Eq. (6) 的基准效应；下面的计算器展示 Eqs. (7)–(10) 的后续步骤。</Evidence></>;
}

const rewardScenarios = [
  { name: '仍有差距', rewards: [2, 5, 7] }, { name: '已经接近标注', rewards: [8, 9, 10] },
  { name: '策略奖励全为零', rewards: [0, 0, 0] }, { name: '极弱正例', rewards: [0, 4, 4.01, 8.01] },
];
function DirectionCalculator() {
  const [scenario, setScenario] = useState(0);
  const [gt, setGt] = useState(10);
  const [show, setShow] = useState(false);
  const rewards = rewardScenarios[scenario].rewards;
  const x = advantageExample(rewards, gt);
  const residual = x.base.some((a, i) => a > 0 && x.policy[i] < 0);
  return <><Toy /><div className="ora-picks">{rewardScenarios.map((s, i) => <Pick key={s.name} active={scenario === i} onClick={() => setScenario(i)}>{s.name}</Pick>)}</div>
    <label className="ora-range">标注奖励 r_gt <b>{gt.toFixed(1)}</b><input aria-label="引导计算器标注奖励" type="range" min="1" max="12" step="0.5" value={gt} onChange={e => setGt(+e.target.value)} /></label>
    <div className="ora-math"><span>策略奖励 [{rewards.join(', ')}]</span><span>μ_op={x.mu.toFixed(3)}</span></div>
    <div className="ora-stats"><div><small>差距权重 w_q</small><b>{x.weight.toFixed(3)}</b><span>差距缩小，引导减弱</span></div><div><small>方向增益 g_q</small><b>{x.gain.toFixed(3)}</b><span>只先放大正策略优势</span></div><div><small>独立标注优势 A_gt</small><b>{x.oracle.toFixed(3)}</b><span>单独受限，不再乘 g_q</span></div></div>
    <div className="ora-table-wrap"><table className="ora-table"><caption>同一组奖励：初始比较 → 正值增益 → 再中心化</caption><thead><tr><th>奖励 r</th><th>初始 A⁽⁰⁾</th><th>增益 U</th><th>最终 Aᵒᵖ</th></tr></thead><tbody>{rewards.map((r, i) => <tr key={i}><th>{r}</th><td><NumberCell value={x.base[i]} /></td><td><NumberCell value={x.amplified[i]} /></td><td><NumberCell value={x.policy[i]} /></td></tr>)}</tbody></table></div>
    <Feedback warning={residual}>{x.sigma < 1e-8 ? '策略候选彼此没有奖励差异，因此策略优势都是零；标注仍可提供很小的启动信号，上限为 0.05。' : residual ? '留意：初始的微弱正优势在再中心化后变成负值。这是另一种残余翻转，解释了 Table 14 为什么仍有 1.9%，裁剪后仍有 0.3%。' : x.weight < 1e-8 ? '策略均值已达到或超过标注奖励：w_q=0，独立标注优势归零。标注不应持续主导学习。' : '先按策略均值比较，再拉开正负候选，并减去 U 的均值以恢复零和。标注优势另算，不能把两条引导重复相乘。'}</Feedback>
    <button className="ora-toggle" aria-expanded={show} onClick={() => setShow(!show)}>{show ? '收起计算细节' : '展开计算细节'}</button>
    {show && <div className="ora-eq"><code>σ_aug / (σ_op+ε) = {x.ratio.toFixed(3)}；g_q = clip(s¹ᐟ⁴, 1, 4)</code><code>δ = {x.gap.toFixed(3)}；w_q = δ²；mean(U) = {x.shift.toFixed(3)}</code><code>A_max⁺ = {x.maxPositive.toFixed(3)}；A_gt = min(2w_q, clip(1.2A_max⁺, 0.05, 1))</code><small>标准差按总体标准差演示；ε=10⁻⁸。停止梯度指不通过优势权重反传，并非停止学习 oracle 输出本身。</small></div>}
    <Evidence>公式证据｜Sec. 3.2，Eqs. (7)–(10)；残余翻转解释见 Sec. 4.10。所有中间量由当前奖励联动计算。</Evidence></>;
}

const pruneRows = [{ k: 0, K: 8, t: 92.5, m: 62.4, a: 63.1 }, { k: 0.25, K: 6, t: 75.0, m: 60.0, a: 62.8 }, { k: 0.5, K: 4, t: 62.4, m: 50.9, a: 62.7 }, { k: 0.75, K: 2, t: 45.0, m: 47.5, a: 60.2 }];
function Pruning() {
  const [kappa, setKappa] = useState(0.5);
  const row = pruneRows.find(r => r.k === kappa)!;
  const advantages = [-1.6, -1.1, -0.6, -0.2, 0.2, 0.6, 1.1, 1.6];
  const selected = selectBalanced(advantages, 0.8, row.K);
  return <><div className="ora-picks">{pruneRows.map(r => <Pick key={r.k} active={kappa === r.k} onClick={() => setKappa(r.k)}>κ={r.k}</Pick>)}</div>
    <div className="ora-prune-heading">选择规则演示 <span>先算优势，再挑参与更新的样本</span></div>
    <div className="ora-sample-grid">{advantages.map((a, i) => <div key={i} className={'ora-sample ' + (selected.indices.includes(i) ? 'kept' : 'discarded')}><small>策略 {i + 1}</small><NumberCell value={a} /><span>{selected.indices.includes(i) ? '保留' : '不参与更新'}</span></div>)}<div className="ora-sample kept oracle"><small>标注</small><b>+0.800</b><span>始终保留</span></div></div>
    <Evidence>上方优势值是教学示意。oracle 占一个正向名额，其余名额尽量平衡正负，并在各符号内按绝对值选强信号。</Evidence>
    <div className="ora-retain"><span>下方为论文 Table 16</span><strong>K={row.K}</strong><code>⌊8(1−{kappa})⌋</code></div>
    <div className="ora-stats"><div><small>每步时间 ↓</small><b>{row.t.toFixed(1)} s</b></div><div><small>每卡峰值显存 ↓</small><b>{row.m.toFixed(1)} GB</b></div><div><small>三任务平均 ↑</small><b>{row.a.toFixed(1)}</b></div></div>
    <Feedback>当前相对 κ=0 节省 {(92.5 - row.t).toFixed(1)} 秒/步，平均分变化 {(row.a - 63.1).toFixed(1)} 分。{kappa === 0.5 ? '论文采用这档：保留 oracle、1 条正策略样本和 2 条负策略样本。' : '观察名额变化怎样影响正、负方向；速度和效果要一起看。'}</Feedback>
    <Evidence>实测｜Table 16，固定 n=8，增强组有 9 条；K 包含 oracle，预算仍按原来的 8 条策略样本计算，κ=0 时 K=8 而非 9。</Evidence></>;
}

function MomentCorrection() {
  const [preset, setPreset] = useState(0);
  const [corrected, setCorrected] = useState(false);
  const examples = [{ name: '常规组', a: [-1.6, -1.1, 1.6, 0.8], rms: 0.8 }, { name: '标注被中心化成负值', a: [3, 2, -1, 0.2], rms: 0.9 }];
  const item = examples[preset];
  const x = correctMoments(item.a, item.rms);
  const values = corrected ? x.corrected : item.a;
  return <><Toy /><div className="ora-picks">{examples.map((e, i) => <Pick key={e.name} active={preset === i} onClick={() => setPreset(i)}>{e.name}</Pick>)}</div>
    <div className="ora-picks"><Pick active={!corrected} onClick={() => setCorrected(false)}>裁剪后</Pick><Pick active={corrected} onClick={() => setCorrected(true)}>完成校正</Pick></div>
    <div className="ora-sample-grid compact">{values.map((a, i) => <div key={i} className={'ora-sample kept' + (i === values.length - 1 ? ' oracle' : '')}><small>{i === values.length - 1 ? '标注' : `策略 ${i + 1}`}</small><NumberCell value={a} /></div>)}</div>
    <div className="ora-balance"><span>保留组均值<strong>{mean(values).toFixed(3)}</strong></span><span>标注优势<strong>{signed(values[values.length - 1])}</strong></span><span>缩放系数 λ<strong>{corrected ? x.scale.toFixed(3) : '尚未应用'}</strong></span></div>
    <Feedback>{corrected ? `${x.projectedOracle ? '只减均值会把标注变成负值，因此将标注优势投影为 0，再把偏移分给其他样本。' : '先减去保留组均值，此例标注仍为正，无需额外投影。'}最后按 λ 缩放，保持零和与标注非负；λ 限于 [0.25,1]。` : '裁剪后保留组不再自动零和。因为 oracle 一定保留、又偏向强信号，直接更新可能产生均值与尺度偏移。'}</Feedback>
    <Evidence>公式演算｜Eqs. (12)–(13)。零和指整个保留组（含 oracle），不是仅策略子组。策略 RMS 为零时跳过尺度匹配。</Evidence></>;
}

const experiments = [
  { name: 'GRPO', zh: '只用策略采样', scores: [58.1, 63.9, 58.9, 60.3] },
  { name: 'Naive GT', zh: '直接加入真值', scores: [57.2, 52.0, 57.0, 55.4] },
  { name: 'Reward shaping', zh: '奖励整形', scores: [60.4, 64.0, 59.2, 61.2] },
  { name: 'OraRL', zh: '解耦引导与裁剪', scores: [60.5, 67.1, 60.6, 62.7] },
];
function ControlledExperiment() {
  const [method, setMethod] = useState(3);
  const row = experiments[method];
  return <><div className="ora-picks">{experiments.map((e, i) => <Pick key={e.name} active={method === i} onClick={() => setMethod(i)}>{e.name}<small>{e.zh}</small></Pick>)}</div>
    <div className="ora-table-wrap"><table className="ora-table"><caption>论文 Table 13 · 同一受控三任务协议 · ↑ 越高越好</caption><thead><tr><th>方法</th><th>时序定位</th><th>跟踪</th><th>分割</th><th>平均</th></tr></thead><tbody>{experiments.map((e, i) => <tr key={e.name} className={method === i ? 'selected' : ''}><th>{['GRPO', '朴素 GT', '奖励整形', 'OraRL'][i]}</th>{e.scores.map((s, j) => <td key={j}>{s.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
    <div className="ora-result"><span>{row.zh} · 相对 GRPO 的三任务平均</span><strong>{(row.scores[3] - 60.3).toFixed(1)} 分</strong></div>
    <Feedback>{method === 1 ? '负面结果最有启发：答案虽然正确，直接混入却让跟踪下降 11.9 分。正确标注不保证正确的优化信号。' : method === 2 ? '奖励整形改善了混入标注后的优化，但需要任务相关的奖励变换。OraRL 在本协议中以原始奖励得到更高平均。' : method === 3 ? 'OraRL 在这组三任务中都优于 GRPO。这里比较协议一致，才适合分析设计收益。它不是 Table 1 的最终 TimeLens 对比。' : '先记住受控基线，再看直接加标注为何退步，以及后续设计能恢复多少。'}</Feedback>
    <details><summary>为什么仍然报告 1.9% 与 0.3% 的翻转？</summary><p>Table 14 中 22.4% 是朴素混合的 rollout 翻转率；OraRL 裁剪前为 1.9%，裁剪后为 0.3%。分母对应 GRPO 正优势候选，裁剪后只统计保留且参与梯度的候选。残余来自方向增益后的再中心化。42.5% 与 8.3% 则按组统计，不能与 rollout 比例混读。</p></details>
    <Evidence>论文实测｜Tables 13–14，Sec. 4.9–4.10；不同任务的分数各按原指标记，平均是论文约定的跨任务汇总。</Evidence></>;
}

function Ablations() {
  const [selected, setSelected] = useState(0);
  const rows = [
    ['完整 OraRL', 62.7, '作为比较基准。'], ['移除方向增益', 61.2, '只保留干净比较基准还不够，正向候选仍需要适度拉开。'],
    ['移除独立标注优势', 61.3, 'oracle 的直接正向目标有贡献，不能只把它当作增益参数。'],
    ['移除奖励差权重', 61.6, '策略接近标注时，衰减指导强度的设计有帮助。'],
    ['移除符号平衡', 62.1, '只按幅度选择会使不同任务的收益失衡。'],
    ['移除裁剪', 63.1, '质量略高，但 Table 16 的每步成本也更高。'],
    ['移除矩校正', 62.0, '裁剪之后恢复均值与尺度可以挽回部分效果损失。'],
  ] as const;
  const row = rows[selected];
  return <><div className="ora-picks">{rows.map((r, i) => <Pick key={r[0]} active={selected === i} onClick={() => setSelected(i)}>{r[0]}</Pick>)}</div><div className="ora-paired-metrics"><section><small>{row[0]} · 三任务平均</small><strong>{row[1].toFixed(1)}</strong></section><section><small>相对完整 OraRL</small><strong>{(row[1] - 62.7).toFixed(1)} 分</strong></section></div><Feedback>{row[2]} 消融支持组件在本协议内的作用，不证明它对所有数据和模型都必要。</Feedback><Evidence>论文实测｜Table 15；同初始化、数据、采样预算与优化日程。无裁剪的质量收益需结合效率表判断。</Evidence></>;
}

function Benchmark() {
  const [dataSet, setDataSet] = useState(0);
  const [metric, setMetric] = useState<'mIoU' | 'R1@0.7'>('mIoU');
  const sets = [{ n: 'Charades-TimeLens', m: [61.8, 58.6], r: [42.4, 38.9] }, { n: 'ActivityNet-TimeLens', m: [63.6, 58.6], r: [53.3, 46.6] }, { n: 'QVHighlights-TimeLens', m: [72.5, 70.2], r: [64, 61.2] }];
  const current = sets[dataSet], values = metric === 'mIoU' ? current.m : current.r;
  return <><div className="ora-picks">{sets.map((s, i) => <Pick key={s.n} active={dataSet === i} onClick={() => setDataSet(i)}>{s.n.replace('-TimeLens', '')}</Pick>)}</div><div className="ora-picks"><Pick active={metric === 'mIoU'} onClick={() => setMetric('mIoU')}>mIoU</Pick><Pick active={metric === 'R1@0.7'} onClick={() => setMetric('R1@0.7')}>R1@0.7</Pick></div>
    <p className="ora-selected-set">{current.n} · {metric} ↑</p>
    {values.map((v, i) => <div key={i} className={'ora-benchmark-bar ' + (i ? 'muted' : '')}><div><span>{i ? 'TimeLens2-8B' : 'Video-ORA-9B'}</span><b>{v.toFixed(1)}</b></div><div className="ora-score-track"><i style={{ width: `${v}%` }} /></div></div>)}
    <Feedback>本划分上高 {(values[0] - values[1]).toFixed(1)} 个百分点。{metric === 'mIoU' ? 'mIoU 对每个问题的区间重叠作平均，关注整体边界贴合程度。' : 'R1@0.7 统计首个预测的时间 IoU 达到 0.7 的查询比例，是更严格的命中标准。'}这两种指标都越高越好。</Feedback>
    <Evidence>论文实测｜Table 1。模型分别为 9B 与 8B，也有训练差异；这是系统对比，不能把全部差值归因于单一算法组件。</Evidence></>;
}

function TaskFamilies() {
  const [family, setFamily] = useState(0);
  const tasks = [
    ['时序定位', '视频 ＋ 事件描述', '起止时间区间', 'mIoU / R1@0.7'], ['空间定位', '视频帧 ＋ 指代表达', '目标边界框', 'R@0.5'],
    ['视频分割', '视频 ＋ 目标描述', '带时间戳的框/点提示，再得到掩码', 'cIoU / J&F'], ['目标跟踪', '视频 ＋ 目标', '跨帧边界框轨迹', 'AO'],
    ['时空定位', '视频 ＋ 事件/目标描述', '时间区间 ＋ 采样帧目标框', 'tIoU / sIoU'], ['视频问答', '视频 ＋ 内容问题', '答案文本或选项', '准确率'], ['空间理解', '视频 ＋ 空间关系问题', '文字答案', '依基准汇总分数'],
  ];
  const t = tasks[family];
  return <><div className="ora-task-picks">{tasks.map((x, i) => <Pick key={x[0]} active={family === i} onClick={() => setFamily(i)}>{x[0]}</Pick>)}</div><div className="ora-task-detail"><small>同一训练思想 · 不同任务适配器</small><strong>{t[0]}</strong><p>输入：{t[1]}</p><p>可序列化输出：{t[2]}</p><span>对应指标：{t[3]}</span></div><Feedback>统一的是“标注进入候选组、解耦优势、选择更新样本”的原则。每组仍使用自己的任务适配器和奖励，不把不同任务的原始分数混在一组里归一化。</Feedback><Evidence>论文证据｜Sec. 3.3，Appendix C，Figure 4。时序定位是其中一个任务族。</Evidence></>;
}

function FinalResult() {
  const [revealed, setRevealed] = useState(false);
  const [limit, setLimit] = useState('标注条件');
  const [answer, setAnswer] = useState('');
  const limits: Record<string, string> = { '标注条件': '标注要能被转换为模型可接受的合法输出；含糊、部分缺失或带噪标注尚未被系统验证。', '质量与成本': '不裁剪的三任务平均略高；论文选 κ=0.5 是质量与训练成本的折中，不是各指标的绝对最高分。', '比较条件': '66.0 与 62.5 是三划分等权宏平均 mIoU。主表模型规模、数据与训练方案有差异；组件效果应回看受控消融。' };
  return <>{!revealed ? <><button className="ora-toggle" onClick={() => setRevealed(true)}>揭晓结果</button><Feedback>回想这条因果链：可靠目标 → 避免比较基准被抬高 → 有界引导 → 平衡选择与校正。</Feedback></> : <><div className="ora-final"><div><small>TimeLens2-8B</small><b>62.5</b><span>三划分宏平均 mIoU</span></div><i>→</i><div className="winner"><small>Video-ORA-9B</small><b>66.0</b><span>三划分宏平均 mIoU</span></div></div><div className="ora-picks">{Object.keys(limits).map(k => <Pick key={k} active={limit === k} onClick={() => setLimit(k)}>{k}</Pick>)}</div><Feedback>{limits[limit]}</Feedback>
      <div className="ora-question">最后检查：怎样更准确地解释“66.0 高于 62.5”？</div><div className="ora-picks"><Pick active={answer === 'all'} onClick={() => setAnswer('all')}>全部提升都由 OraRL 单独带来</Pick><Pick active={answer === 'bounded'} onClick={() => setAnswer('bounded')}>主表看系统结果，消融看组件作用</Pick></div>{answer && <Feedback warning={answer === 'all'}>{answer === 'bounded' ? '对。这样既能说明方法表现，也能承认比较条件，论证更完整。' : '还不能这样归因。不同模型规模和训练设置共同影响主表，因果解释应借助相同协议下的组件消融。'}</Feedback>}</>}
    <Evidence>原文：<a href="https://arxiv.org/pdf/2608.20492" target="_blank" rel="noreferrer">论文 PDF</a> · <a href="https://orarl.github.io/" target="_blank" rel="noreferrer">官方项目页</a>。作者 Yunheng Li 等；arXiv v1 预印本，2026。</Evidence></>;
}

export const OraTools: React.FC<WidgetProps> = ({ moduleId }) => {
  const content: Record<string, React.ReactNode> = {
    old: <Cover mode="old" />, new: <Cover mode="new" />, '1.1': <RoleQuiz />, '2.1': <Sampling />, '3.1': <OracleGroup />,
    '4.1': <Baseline />, '5.1': <Baseline switching />, '6.1': <SynchronizedComparison />, '6.2': <DirectionCalculator />,
    '7.1': <Pruning />, '7.2': <MomentCorrection />, '8.1': <ControlledExperiment />, '8.2': <Ablations />,
    '9.1': <Benchmark />, '9.2': <TaskFamilies />, '10.1': <FinalResult />,
  };
  return <div className="ora-widget" onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>{content[moduleId] || <Feedback>请选择本章交互。</Feedback>}</div>;
};
