import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice } from './common';
import { assetUrl, handleImageError } from './asset-url';

type EvidenceKey = 'understanding' | 'generation' | 'speed' | 'intergen';

const EVIDENCE_ROWS: Array<{
  id: EvidenceKey; label: string; claim: string; evidence: string; source: string; condition: string; boundary: string;
}> = [
  { id: 'understanding', label: '理解', claim: '统一模型的理解能力具有竞争力', evidence: 'MMStar：LLaDA2.0-Uni 64.1，Qwen2.5-VL-7B 63.9。', source: '论文 Table 2 · 越高越好', condition: '只在同一 benchmark、同一表格与相同指标定义下比较；专用 VLM 与统一模型的目标不同。', boundary: '不能推出所有理解任务均领先。DocVQA、OCRBench 与 ChartQA 等任务仍有明显追赶空间。' },
  { id: 'generation', label: '生成 / 编辑', claim: '统一主干同时保住了生成与编辑能力', evidence: 'GenEval Overall 0.89；DPG-Bench Overall 87.76；ImgEdit Overall 3.92。', source: '论文 Table 3、4、9 · 三种不同量纲', condition: '0–1、百分制和1–5分必须分别读取，只能与各自表内方法比较。', boundary: '不能跨任务求和或平均得到所谓“综合生成分”，定性图片也不等同于人工盲测。' },
  { id: 'speed', label: '速度', claim: '主干和图像 Decoder 分别得到加速', evidence: 'SPRINT 平均 TPS 约1.6×；8步 Decoder 为2.90s，50步基线为32.95s，约11.4×。', source: '论文 SPRINT 实验与 Table 14', condition: 'Decoder 时间口径为单张 GPU、1024×1024、batch=1、BF16；质量为GenEval 0.87 vs 0.89。', boundary: '1.6×与11.4×作用于不同阶段，不能相乘，也不能外推到所有硬件、分辨率和批量。' },
  { id: 'intergen', label: '交错能力', claim: '论文展示了统一图文交错建模的潜力', evidence: 'InterGen 包含150个任务，并给出交错生成与交错推理的定性样例。', source: '论文 Figure 6–8 · VLM-as-judge', condition: '评测规模较小，主要依赖 Gemini-3 与 Qwen3-VL 等视觉语言模型裁判。', boundary: '更稳妥的表述是 promising evidence，不能升级为“通用多模态推理已经解决”。' },
];

export const MetricsDashboard: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<EvidenceKey>('understanding');
  const row = EVIDENCE_ROWS.find((item) => item.id === active) ?? EVIDENCE_ROWS[0];
  return (
    <div className="ll-widget evidence-matrix-widget">
      <div className="evidence-matrix-intro"><div><small>Step 6.1 · Evidence Matrix</small><h4>先选论文主张，再沿证据链向右检查</h4></div><span>主张 → 数据 → 条件 → 边界</span></div>
      <div className="evidence-row-tabs" role="tablist" aria-label="选择需要核对的论文主张">
        {EVIDENCE_ROWS.map((item) => <button type="button" role="tab" aria-selected={item.id === active} key={item.id} className={item.id === active ? 'is-active' : ''} onClick={() => setActive(item.id)}><span>{item.label}</span><b>{item.claim}</b></button>)}
      </div>
      <article className="evidence-chain" key={row.id}>
        <section className="is-claim"><small>01 · 允许提出的主张</small><strong>{row.claim}</strong></section><i aria-hidden="true">→</i>
        <section className="is-data"><small>02 · 论文证据</small><strong>{row.evidence}</strong><em>{row.source}</em></section><i aria-hidden="true">→</i>
        <section className="is-condition"><small>03 · 成立条件</small><p>{row.condition}</p></section><i aria-hidden="true">→</i>
        <section className="is-boundary"><small>04 · 不能推出</small><p>{row.boundary}</p></section>
      </article>
      <Notice tone="green">当前卡片只比较同表、同量纲和同协议证据；切换主张时，条件与结论边界必须一起切换。</Notice>
    </div>
  );
};

type Verdict = 'supported' | 'overclaim' | 'future';
const VERDICTS: Record<Verdict, { label: string; short: string }> = {
  supported: { label: '论文支持', short: '有对应证据与条件' }, overclaim: { label: '过度推断', short: '超出了证据边界' }, future: { label: '未来工作', short: '论文尚未完成' },
};
const CLAIMS: Array<{ text: string; verdict: Verdict; source: string; explanation: string }> = [
  { text: 'LLaDA2.0-Uni 在 MMStar 上与 Qwen2.5-VL-7B 基本持平。', verdict: 'supported', source: 'Table 2：64.1 vs 63.9', explanation: '这是同一 benchmark 中的直接比较，但只能支持 MMStar 这一项。' },
  { text: 'LLaDA2.0-Uni 已经在所有多模态理解任务上领先专用 VLM。', verdict: 'overclaim', source: 'Table 2 同时显示 OCR、文档和图表任务差距', explanation: '论文结论是具有竞争力，不是所有理解任务全面第一。' },
  { text: '8步 Decoder 在论文指定协议下约加速11.4×，GenEval 从0.89变为0.87。', verdict: 'supported', source: 'Table 14：2.90s vs 32.95s', explanation: '速度、质量和测试口径都被同时保留，因此这是一条可复述的限定结论。' },
  { text: 'InterGen 的150个任务已经证明通用多模态推理问题得到解决。', verdict: 'overclaim', source: 'Figure 6–8：小规模、VLM-as-judge', explanation: '这些实验说明潜力，但评测规模与裁判方式不足以支持“已经解决”。' },
  { text: '扩大交错数据与模型容量、改善细节并研究统一 dLLM 的 RL。', verdict: 'future', source: '论文 Limitation / Future Work', explanation: '这是作者明确留下的后续方向，不能写成当前模型已经具备的能力。' },
];
const INTERGEN_TASKS = [
  { id: 'skateboard', label: '滑板故事', type: 'Story Telling', file: 'intergen-task-skateboard.png', steps: [
    { title: '建立人物与场景', text: '读取“滑板手、混凝土花坛、城市广场”等条件，先固定人物身份与环境。' },
    { title: '动作连续推进', text: '人物从腾空过渡到落地滑行，上一幅图成为下一段文字与图像的视觉上下文。' },
    { title: '完成故事片段', text: '继续保持服装、主体与城市背景一致，形成连续的三段图文叙事。' },
  ] },
  { id: 'hydraulic', label: '液压机预测', type: 'Event Forecasting', file: 'intergen-task-hydraulic.png', steps: [
    { title: '读取初始状态', text: '识别液压机正在压向易拉罐，以及问题“接下来会发生什么”。' },
    { title: '预测形变过程', text: '模型用文字描述罐体弯曲、变形，并生成与过程对应的中间画面。' },
    { title: '生成结果状态', text: '继续利用前一步图文上下文，预测易拉罐最终被压扁的结果。' },
  ] },
  { id: 'cola', label: '可乐鸡翅', type: 'Explanation', file: 'intergen-task-cola.png', steps: [
    { title: '煎制鸡翅', text: '先生成“煎至两面金黄”的文字步骤和对应画面。' },
    { title: '加入可乐焖煮', text: '前一步结果继续作为条件，生成第二段做法与过程图。' },
    { title: '收汁完成', text: '最后生成收汁、撒芝麻的说明与成品图，完成图文交错食谱。' },
  ] },
] as const;

const REASON_CASES = {
  pulley: { label: '滑轮受力', files: [1, 2, 3, 4, 5].map((index) => `intergen-reason-pulley-${index}.png`), steps: [
    { title: '读取物理结构', text: '先识别滑轮、绳索与两侧物体的连接关系。' },
    { title: '标注右侧受力', text: '在图中逐步加入张力与重力方向，把视觉信息转成可检查的中间状态。' },
    { title: '检查方向关系', text: '保持原始装置不变，对照受力箭头检查推演是否自洽。' },
    { title: '补全左侧受力', text: '继续加入另一侧物体的张力与重力，形成完整受力图。' },
    { title: '形成最终判断', text: '综合两侧标注得到该样例的最终推演状态；这里展示过程，不额外补写论文图外答案。' },
  ] },
  chess: { label: '国际象棋', files: [1, 2, 3, 4, 5].map((index) => `intergen-reason-chess-${index}.png`), steps: [
    { title: '读取当前棋盘', text: '从棋盘图像中识别双方棋子与当前局面。' },
    { title: '生成候选局面', text: '模型把候选变化重新表示为图像，使后续推理能够继续读取局面。' },
    { title: '检查关键应手', text: '高亮变化后的关键位置，比较候选分支带来的局面差异。' },
    { title: '继续展开分支', text: '将新棋盘作为下一步视觉上下文，继续执行图文交错推演。' },
    { title: '汇总推演结果', text: '根据连续局面形成最终选择；示意严格停留在论文 Figure 8 给出的可见过程。' },
  ] },
} as const;

export const InterGenLimits: React.FC<WidgetProps> = () => {
  const [figureMode, setFigureMode] = useState<'tasks' | 'reasoning'>('tasks');
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskStep, setTaskStep] = useState(0);
  const [reasonCase, setReasonCase] = useState<keyof typeof REASON_CASES>('pulley');
  const [reasonStep, setReasonStep] = useState(0);
  const [claimIndex, setClaimIndex] = useState(0);
  const [choice, setChoice] = useState<Verdict | ''>('');
  const [solved, setSolved] = useState<number[]>([]);
  const claim = CLAIMS[claimIndex];
  const task = INTERGEN_TASKS[taskIndex];
  const reasoning = REASON_CASES[reasonCase];
  const correct = choice === claim.verdict;
  const completed = solved.length === CLAIMS.length;
  const progress = useMemo(() => Math.round((solved.length / CLAIMS.length) * 100), [solved.length]);
  const answer = (verdict: Verdict) => { setChoice(verdict); if (verdict === claim.verdict) setSolved((items) => items.includes(claimIndex) ? items : [...items, claimIndex]); };
  const moveClaim = (direction: -1 | 1) => { setClaimIndex((index) => Math.max(0, Math.min(CLAIMS.length - 1, index + direction))); setChoice(''); };
  return (
    <div className="ll-widget conclusion-judge-widget">
      <section className="intergen-step-explorer">
        <header className="intergen-mode-tabs">
          <button type="button" className={figureMode === 'tasks' ? 'is-active' : ''} onClick={() => setFigureMode('tasks')}><small>Figure 6</small><b>任务构成</b></button>
          <button type="button" className={figureMode === 'reasoning' ? 'is-active' : ''} onClick={() => setFigureMode('reasoning')}><small>Figure 8</small><b>推理样例</b></button>
        </header>
        {figureMode === 'tasks' ? <>
          <div className="intergen-task-tabs" role="tablist" aria-label="选择 InterGen 任务">
            {INTERGEN_TASKS.map((item, index) => <button type="button" role="tab" aria-selected={taskIndex === index} key={item.id} className={taskIndex === index ? 'is-active' : ''} onClick={() => { setTaskIndex(index); setTaskStep(0); }}><span>0{index + 1}</span><b>{item.label}</b><small>{item.type}</small></button>)}
          </div>
          <div className={`intergen-stage-grid is-${task.id}`}>
            <figure className="intergen-task-image"><img src={assetUrl(task.file)} alt={`${task.label}论文样例`} onError={handleImageError} /><i className={`task-focus focus-${taskStep + 1}`} /></figure>
            <article className="intergen-step-copy" key={`${task.id}-${taskStep}`}>
              <small>{task.type} · STEP {taskStep + 1}/3</small><h4>{task.steps[taskStep].title}</h4><p>{task.steps[taskStep].text}</p>
              <div className="intergen-step-dots">{task.steps.map((step, index) => <button type="button" key={step.title} aria-label={`查看第${index + 1}步`} className={taskStep === index ? 'is-active' : ''} onClick={() => setTaskStep(index)}>{index + 1}</button>)}</div>
              <div className="intergen-step-actions"><button type="button" disabled={taskStep === 0} onClick={() => setTaskStep((step) => Math.max(0, step - 1))}>上一步</button><button type="button" disabled={taskStep === 2} onClick={() => setTaskStep((step) => Math.min(2, step + 1))}>下一步</button></div>
            </article>
          </div>
        </> : <>
          <div className="reason-case-tabs">{(Object.keys(REASON_CASES) as Array<keyof typeof REASON_CASES>).map((key) => <button type="button" key={key} className={reasonCase === key ? 'is-active' : ''} onClick={() => { setReasonCase(key); setReasonStep(0); }}>{REASON_CASES[key].label}</button>)}</div>
          <div className="reason-stage-grid">
            <figure key={`${reasonCase}-${reasonStep}`}><img src={assetUrl(reasoning.files[reasonStep])} alt={`${reasoning.label}第${reasonStep + 1}步`} onError={handleImageError} /></figure>
            <article className="reason-step-copy" key={`${reasonCase}-copy-${reasonStep}`}><small>{reasoning.label} · STEP {reasonStep + 1}/5</small><h4>{reasoning.steps[reasonStep].title}</h4><p>{reasoning.steps[reasonStep].text}</p><div className="reason-step-buttons">{reasoning.steps.map((step, index) => <button type="button" key={step.title} className={reasonStep === index ? 'is-active' : ''} onClick={() => setReasonStep(index)}>第{index + 1}步</button>)}</div><div className="intergen-step-actions"><button type="button" disabled={reasonStep === 0} onClick={() => setReasonStep((step) => Math.max(0, step - 1))}>回退</button><button type="button" disabled={reasonStep === 4} onClick={() => setReasonStep((step) => Math.min(4, step + 1))}>继续推演</button></div></article>
          </div>
        </>}
        <div className="intergen-method-note"><b>怎样阅读这些案例？</b><span>Figure 6 展示图文交替成为上下文；Figure 8 展示图像中间状态如何参与后续推理。InterGen 共 150 个任务，并采用 VLM-as-judge，因此它证明的是“具有潜力”，不是问题已经解决。</span></div>
      </section>
      <section className="conclusion-judge">
        <header><div><small>Step 6.2 · Conclusion Judge</small><h4>这句话属于哪一类？</h4></div><span>{claimIndex + 1} / {CLAIMS.length}</span></header>
        <div className="judge-progress"><i><span style={{ width: `${progress}%` }} /></i><b>已完成 {solved.length}/{CLAIMS.length}</b></div>
        <blockquote>{claim.text}</blockquote>
        <div className="verdict-buttons">{(Object.keys(VERDICTS) as Verdict[]).map((verdict) => <button type="button" key={verdict} disabled={Boolean(choice)} className={choice === verdict ? verdict === claim.verdict ? 'is-correct' : 'is-wrong' : ''} onClick={() => answer(verdict)}><b>{VERDICTS[verdict].label}</b><span>{VERDICTS[verdict].short}</span></button>)}</div>
        {choice ? <div className={`judge-feedback${correct ? ' is-correct' : ' is-wrong'}`}><b>{correct ? '判断准确' : `更合适的分类：${VERDICTS[claim.verdict].label}`}</b><p>{claim.explanation}</p><small>{claim.source}</small></div> : <div className="judge-feedback is-idle">先判断，再展开论文证据和结论边界。</div>}
        <footer><button type="button" onClick={() => moveClaim(-1)} disabled={claimIndex === 0}>上一条</button><button type="button" onClick={() => moveClaim(1)} disabled={claimIndex === CLAIMS.length - 1}>下一条</button></footer>
      </section>
      <div className={`final-paper-conclusion${completed ? ' is-complete' : ''}`}><small>{completed ? '你已经完成证据审查' : '完成5条判断后生成最终结论'}</small><p>{completed ? 'LLaDA2.0-Uni 证明了用语义离散视觉 Token 和共享扩散语言主干统一理解、生成与编辑是可行的，并在多类任务上具有竞争力；但细粒度视觉保持、交错规模、评测可靠性与统一 RL 仍是开放问题。' : '统一能力 + 论文证据 + 成立条件 + 尚未解决的边界'}</p></div>
    </div>
  );
};
