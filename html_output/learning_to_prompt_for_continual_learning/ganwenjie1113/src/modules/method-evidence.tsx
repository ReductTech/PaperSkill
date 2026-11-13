import { useEffect, useRef, useState, type RefObject } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { KEY_ANGLES_DEGREES, promptPoolConfig, type QueryId } from "./prompt-retrieval-data";
import {
  computeRetrievalComparison,
  P9_ABLATIONS,
  P9_CLASS_INCREMENTAL_RESULTS,
  P9_ARCHITECTURE_RESULTS,
  P9_FIGURE3_INTERPRETATION,
  P9_PROTOCOL_RESULTS,
  type RetrievalMode,
} from "./method-evidence-data";
import { easeMotion, useMotionAnchors } from "./visual-motion";
import { P9EvidenceGuide } from "./reading-guides";
import "./method-evidence.css";
import { Term } from "../shared/core/reference/ReferenceHub";

const duration = 14_500;
const boundaries = [0, 900, 6_300, 9_600, 12_200, duration];
const phases = ["固定 Query", "计算 γ", "乘历史频率", "重排 Top‑N", "选中当前集合"];
const slotIndices = Array.from({ length: promptPoolConfig.poolSize }, (_, index) => index + 1);

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((start, offset) => offset < boundaries.length - 1 && position >= start && position < boundaries[offset + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return clamp((position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase]));
}

function activeRule(mode: RetrievalMode) {
  return mode === "diversified-training" ? "Eq. (4) · 已知边界的可选训练策略" : mode === "inference" ? "Eq. (3) · 测试检索" : "Eq. (3) · 基础训练检索";
}

function modeExplanation(mode: RetrievalMode, phase: number) {
  if (phase === 0) return "固定一条 P5 Query 和当前 Key 向量，接下来用同一批候选比较两种评分规则。";
  if (phase === 1) return "先逐个 Key 计算余弦距离 γ(q,kⱼ)。硬 Top‑N 最终取评分最小的 N 个索引。";
  if (phase === 2 && mode === "diversified-training") return "只有训练时已知任务边界，才把过去任务的归一化使用频率 hⱼ 乘到当前距离上。";
  if (phase === 2) return mode === "inference" ? "测试不读取 Hₜ；Eq. (4) 分数仅保留作对照，不参与当前预测。" : "当前使用基础 Eq. (3)；hⱼ 和 γhⱼ 两列只用于说明可选分支会怎样改序。";
  if (phase === 3) return "索引仍是离散选择：根据当前模式的实际分数排序，再取 Top‑N。";
  return mode === "diversified-training" ? "选集由 Eq. (4) 决定；但 P7 的 L_match 仍使用原始 γ(q,k)，频率不进入 Key 匹配损失。" : mode === "inference" ? "最终测试恢复普通 Eq. (3) 检索；不提供标签、任务 ID，也不应用历史频率。" : "当前基础训练按 Eq. (3) 选集；历史频率不是每种 L2P 运行都必需的模块。";
}

function QuerySweep({
  geometry,
  phase,
  progress,
  mode,
  reducedMotion,
}: {
  geometry: ReturnType<typeof useMotionAnchors>;
  phase: number;
  progress: number;
  mode: RetrievalMode;
  reducedMotion: boolean;
}) {
  if (!geometry || reducedMotion || phase !== 1 && !(phase === 2 && mode === "diversified-training")) return null;
  const start = geometry.points["p9-query"];
  const end = geometry.points["p9-candidate-" + slotIndices.length];
  if (!end) return null;
  if (!start) return null;
  const sweep = easeMotion(clamp(progress));
  const point = { x: start.x + (end.x - start.x) * sweep, y: start.y + (end.y - start.y) * sweep };
  const pass = phase === 2 ? " is-frequency-pass" : "";
  return <svg className={"p9-query-sweep" + pass} width={geometry.width} height={geometry.height} viewBox={"0 0 " + geometry.width + " " + geometry.height} aria-hidden="true">
    <path d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - sweep} />
    <circle cx={point.x} cy={point.y} r="4.5" />
  </svg>;
}

function ScoreWorkbench({
  query,
  mode,
  phase,
  progress,
  comparison,
  geometry,
  rootRef,
  reducedMotion,
  onInspect,
  inspected,
}: {
  query: QueryId;
  mode: RetrievalMode;
  phase: number;
  progress: number;
  comparison: ReturnType<typeof computeRetrievalComparison>;
  geometry: ReturnType<typeof useMotionAnchors>;
  rootRef: RefObject<HTMLDivElement>;
  reducedMotion: boolean;
  onInspect: (index: number) => void;
  inspected: number | null;
}) {
  const scanProgress = phase === 1 ? progress : phase >= 2 ? 1 : 0;
  const weightProgress = mode === "diversified-training" ? (phase === 2 ? progress : phase > 2 ? 1 : 0) : 0;
  const showRanks = phase >= 3;
  const showSelection = phase >= 4;
  const currentSelection = mode === "diversified-training" ? comparison.diversifiedSelection : comparison.baseSelection;
  const activeEquation = mode === "diversified-training" ? "weightedScore" : "distance";
  return <div className="p9-score-workbench" ref={rootRef}>
    <QuerySweep geometry={geometry} phase={phase} progress={progress} mode={mode} reducedMotion={reducedMotion} />
    <div className="p9-query-strip">
      <span className="p9-query-node"><i data-motion-anchor="p9-query" /> <b>q<sub>{query}</sub></b><small>{query === "A" ? "12° · P5 Query A" : "116° · P5 Query B"}</small></span>
      <span className="p9-key-rule"><strong>十个当前 Key</strong><i aria-hidden="true">→</i><b>计算分数 → 离散 Top‑{promptPoolConfig.topN}</b></span>
      <span className="p9-active-rule"><small>当前路径</small><b>{activeRule(mode)}</b></span>
    </div>
    <div className={"p9-ledger-heading " + (mode === "inference" ? "is-inference" : "")}>
      <span>Pool 身份</span><span>配对 Prompt</span><span>基础距离 γ</span><span>历史 Hₜ</span><span>加权 γ·h</span><span>Eq. (3) rank</span><span>Eq. (4) rank</span><span>本次 Top‑N</span>
    </div>
    <div className="p9-candidate-ledger" aria-label="同一 Query 对十个 Key 的基础距离、频率加权分数和排名">
      {comparison.rows.map(row => {
        const order = row.index - 1;
        const distanceVisible = scanProgress >= 1 || scanProgress * slotIndices.length > order;
        const weightedVisible = weightProgress >= 1 || weightProgress * slotIndices.length > order;
        const isCurrentSelection = showSelection && currentSelection.includes(row.index);
        const activeRank = activeEquation === "weightedScore" ? row.diversifiedRank : row.baseRank;
        return <button type="button" key={row.index}
          className={"p9-candidate-row " + (isCurrentSelection ? "is-current-selection " : "") + (inspected === row.index ? "is-inspected " : "") + (mode === "inference" ? "is-inference " : "")}
          aria-label={"Key k" + row.index + "，Prompt P" + row.index + "，余弦距离 " + row.distance.toFixed(6) + "，历史频率 " + row.historyFrequency.toFixed(2) + "，Eq3 排名 " + row.baseRank + "，Eq4 排名 " + row.diversifiedRank}
          aria-pressed={inspected === row.index} onClick={() => onInspect(row.index)}>
          <span className="p9-candidate-key"><i className="p9-scan-target" data-motion-anchor={"p9-candidate-" + row.index} /><b>k<sub>{row.index}</sub></b><i className="p9-key-direction" style={{ transform: "rotate(" + (KEY_ANGLES_DEGREES[row.index - 1] - (query === "A" ? 12 : 116)) + "deg)" }} /></span>
          <span className="p9-candidate-prompt">P<sub>{row.index}</sub></span>
          <span className={"p9-score-cell " + (distanceVisible ? "is-revealed" : "")}>{distanceVisible ? row.distance.toFixed(3) : "· · ·"}</span>
          <span className="p9-history-cell"><b>{row.historyFrequency.toFixed(2)}</b><i><span style={{ transform: "scaleX(" + row.historyFrequency / .22 + ")" }} /></i></span>
          <span className={"p9-score-cell p9-weighted-cell " + (weightedVisible ? "is-revealed" : "")}>{mode === "diversified-training" ? weightedVisible ? row.weightedScore.toFixed(3) : "待乘 hⱼ" : <span aria-label="当前规则不应用频率">—</span>}</span>
          <span className={"p9-rank-cell " + (mode !== "diversified-training" ? "is-active" : "") + (showRanks && row.baseRank <= promptPoolConfig.topN ? " is-top-n" : "")}>{showRanks ? row.baseRank : "—"}</span>
          <span className={"p9-rank-cell " + (mode === "diversified-training" ? "is-active" : "is-muted") + (showRanks && row.diversifiedRank <= promptPoolConfig.topN ? " is-top-n" : "")}>{showRanks ? row.diversifiedRank : "—"}</span>
          <span className={"p9-selection-cell " + (isCurrentSelection ? "is-selected" : "")}>{isCurrentSelection ? "选中" : showSelection ? "—" : activeRank <= promptPoolConfig.topN && showRanks ? "待确认" : "未入选"}</span>
        </button>;
      })}
    </div>
    <div className="p9-selection-summary" aria-live="polite">
      <div className={mode !== "diversified-training" ? "is-current" : ""}><strong>普通 Eq. (3)</strong><span>{showSelection ? comparison.baseSelection.map(index => <b key={index}>P<sub>{index}</sub></b>) : "完成排名后显示 Top‑N"}</span></div>
      <div className={mode === "diversified-training" ? "is-current" : "is-muted"}><strong>加权 Eq. (4) · 训练可选</strong><span>{showSelection ? comparison.diversifiedSelection.map(index => <b key={index}>P<sub>{index}</sub></b>) : "当前 Query 的候选结果"}</span></div>
    </div>
    <div className="p9-score-inspector" aria-live="polite">
      {inspected === null ? <span>选择任一行，查看同一 Key 在两种规则下的真实排名变化。</span> : (() => {
        const row = comparison.rows[inspected - 1];
        return <><strong>槽位 {row.index}</strong><span>γ={row.distance.toFixed(6)}</span><span>h={row.historyFrequency.toFixed(2)}</span><span>γh={row.weightedScore.toFixed(6)}</span><span>Eq. (3) #{row.baseRank} → Eq. (4) #{row.diversifiedRank}</span></>;
      })()}
    </div>
  </div>;
}

function EvidenceBar({ value, maximum }: { value: number; maximum: number }) {
  return <span className="p9-metric-track" aria-hidden="true"><i style={{ transform: "scaleX(" + clamp(value / maximum) + ")" }} /></span>;
}

function AblationWorkbench() {
  const [selectedId, setSelectedId] = useState("full");
  const selected = P9_ABLATIONS.find(row => row.id === selectedId) ?? P9_ABLATIONS[0];
  return <section className="p9-ablation-section explain-section" id="p9-ablation-evidence">
    <div className="p9-evidence-heading"><span className="p9-section-kicker">Table 5 · 5-datasets 消融</span><h3>去掉一项设计，结果怎样变化？</h3><p>两条量表方向分开：<Term id="average-accuracy">平均准确率</Term>越高越好，<Term id="forgetting-metric">遗忘度</Term>越低越好。所有行来自同一 5-datasets 类别增量<Term id="ablation">消融</Term>配置。</p></div>
    <div className="p9-ablation-legend"><span>消融配置</span><span>Average Accuracy · 0–100 ↑</span><span>Forgetting · 0–30 ↓</span></div>
    <div className="p9-ablation-list" role="group" aria-label="选择一个论文消融配置查看其移除的设计">
      {P9_ABLATIONS.map(row => <button type="button" key={row.id} className={"p9-ablation-row " + (selectedId === row.id ? "is-selected" : "")} aria-pressed={selectedId === row.id} aria-label={`${row.name}，平均准确率 ${row.accuracy.toFixed(2)}，遗忘 ${row.forgetting.toFixed(2)}`} onClick={() => setSelectedId(row.id)}>
        <span className="p9-ablation-name"><b>{row.name}</b><small>{row.id === "full" ? "参照配置" : "移除一项设计"}</small></span>
        <span className="p9-metric"><span className="p9-metric-mobile">准确率 ↑</span><b>{row.accuracy.toFixed(2)}</b><EvidenceBar value={row.accuracy} maximum={100} /></span>
        <span className="p9-metric p9-metric--forgetting"><span className="p9-metric-mobile">遗忘 ↓</span><b>{row.forgetting.toFixed(2)}</b><EvidenceBar value={row.forgetting} maximum={30} /></span>
      </button>)}
    </div>
    <div className="p9-ablation-inspector" aria-live="polite"><strong>{selected.name}</strong><span>{selected.removed}</span><p>{selected.lesson}</p></div>
    <p className="p9-evidence-caveat">这组消融只说明 5-datasets 这项测试配置中的变化；不能当成各组件在所有数据集上的恒定因果贡献，也不能说明模型完全没有遗忘。</p>
  </section>;
}

function EvidenceResults() {
  return <section className="p9-results-section explain-section" id="p9-results-evidence">
    <div className="p9-evidence-heading"><span className="p9-section-kicker">Table 1 · 零回放类别增量主结果</span><h3>同一协议内看准确率与遗忘</h3><p>测试时未知任务 ID。数值为三次运行的均值 ± 标准差；基础 L2P 的 Buffer Size = 0。</p></div>
    <div className="p9-table-wrap"><table className="p9-results-table"><thead><tr><th scope="col">数据集 / 协议</th><th scope="col">Average Accuracy ↑</th><th scope="col">Forgetting ↓</th></tr></thead><tbody>{P9_CLASS_INCREMENTAL_RESULTS.map(row => <tr key={row.dataset}><th scope="row">{row.dataset}</th><td>{row.accuracy}</td><td>{row.forgetting}</td></tr>)}</tbody></table></div>
    <div className="p9-protocol-grid" aria-label="其他增量协议下的基础 L2P 结果">
      {P9_PROTOCOL_RESULTS.map(row => <article className="p9-protocol-card" key={row.source}>
        <span>{row.source} · {row.protocol}</span><strong>{row.value}</strong><b>{row.dataset}</b><small>{row.metric} · {row.note}</small>
      </article>)}
    </div>
    <p className="p9-protocol-caveat">CORe50 和 Gaussian-scheduled CIFAR-100 报告的是各自协议下的 Test Accuracy，不能与 Table 1 的 Average Accuracy/Forgetting 合成跨数据集排名。Task-agnostic 数据集是合成的渐变分布漂移协议；L2P-R 的缓存结果另行报告，未混入这里的零回放基础 L2P。</p>
  </section>;
}

function ArchitectureBounds() {
  return <details className="p9-capacity-note p9-architecture-note" id="p9-architecture-evidence">
    <summary>Table 2 · 按各自骨干网络的上界阅读架构比较</summary>
    <p>这张表报告的是 Split CIFAR-100 类别增量准确率。ResNet18 的上界为 80.41，ViT-B/16 的上界为 90.85；Diff 是各行相对自身骨干上界的差距，越小表示越接近该上界。</p>
    <div className="p9-table-wrap">
      <table className="p9-results-table">
        <thead><tr><th scope="col">方法</th><th scope="col">骨干网络</th><th scope="col">Average Acc ↑</th><th scope="col">Diff ↓</th></tr></thead>
        <tbody>{P9_ARCHITECTURE_RESULTS.map(row => <tr key={row.method}><th scope="row">{row.method}</th><td>{row.backbone}</td><td>{row.accuracy}</td><td>{row.gap}</td></tr>)}</tbody>
      </table>
    </div>
    <small>不同骨干网络之间的绝对准确率不是受控的同架构比较；这里只按 Table 2 的骨干上界和 Diff 解读。来源：L2P Table 2，§5.3，PDF p. 6。</small>
  </details>;
}

export function MethodEvidence() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const progress = phaseProgress(playback.position, activePhase);
  const [query, setQuery] = useState<QueryId>("A");
  const [mode, setMode] = useState<RetrievalMode>("base-training");
  const [inspected, setInspected] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const geometry = useMotionAnchors(rootRef);
  const comparison = computeRetrievalComparison(query);

  return <>
    <p className="lesson-lead">P8 说明同一套 Key–Prompt 参数如何跨 Batch 和任务保留下来。P9 先比较训练时的一项可选检索策略，再把共享观察、消融与主实验放回各自的论文证据条件中。</p>
    <section className="p9-intro explain-section"><h3>共享带来复用，热门槽位也可能被<span className="editorial-key">反复改写</span></h3><p>如果训练数据提供任务边界，能否用过去的 Prompt 使用频率影响下一任务的选择？这是一条<span className="lesson-key lesson-key--caution">可选的<Term id="frequency-selection">多样化选择</Term></span>。基础训练和测试都能继续使用普通 Query–Key 距离。</p></section>

    <figure className="lesson-figure p9-strategy-figure">
      <div className="figure-top"><strong>两种选择评分，复用同一 Query 与 Key</strong><span>P5 确定性二维教学池 · 历史频率为显式合成快照</span></div>
      <div className="figure-body">
        <div className="p9-control-dock" aria-label="多样化选择比较控制">
          <div className="p9-mode-row">
            <div className="p9-query-toggle" role="group" aria-label="选择用于比较的 P5 Query">
              {(["A", "B"] as const).map(id => <button type="button" className="lesson-choice" key={id} aria-pressed={query === id} onClick={() => { setQuery(id); playback.seek(0); setInspected(null); }}>Query {id}</button>)}
            </div>
            <div className="p9-mode-toggle" role="group" aria-label="选择训练或推断检索规则">
              {([
                ["base-training", "基础训练 · Eq. (3)"],
                ["diversified-training", "已知边界训练 · Eq. (4)"],
                ["inference", "测试 · Eq. (3)"],
              ] as const).map(([value, label]) => <button type="button" className="lesson-choice" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); playback.seek(0); setInspected(null); }}>{label}</button>)}
            </div>
          </div>
          <div className="p9-phase-row"><div className="p9-phase-stops" role="group" aria-label="查看评分计算阶段">{phases.map((label, index) => <button type="button" className="lesson-choice" key={label} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index] + 35)}>{index + 1}. {label}</button>)}</div>
            <div className="p9-playback-status"><PlaybackControls playback={playback} label="从距离到当前 Top‑N" /><p aria-live="polite">{modeExplanation(mode, activePhase)}</p></div></div>
        </div>

        <div className="p9-formula-band">
          <div><span>基础排序 · Eq. (3)</span><math><mrow><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow><mo>=</mo><munder><mo>arg min</mo><mrow><mo>|</mo><mi>S</mi><mo>|</mo><mo>=</mo><mi>N</mi></mrow></munder><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi></mrow></munder><mrow><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></mrow></math></div>
          <div className={mode === "diversified-training" ? "is-active" : "is-optional"}><span>已知任务边界时的可选训练式 · Eq. (4)</span><math><mrow><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow><mo>=</mo><munder><mo>arg min</mo><mrow><mo>|</mo><mi>S</mi><mo>|</mo><mo>=</mo><mi>N</mi></mrow></munder><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi></mrow></munder><mrow><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></mrow><msub><mi>h</mi><mi>j</mi></msub></math></div>
        </div>
        <p className="p9-frequency-note"><strong>Hₜ 来源：</strong>此前任务对各 Prompt 的归一化选中频率。下面使用合成的 100 次历史命中快照，所有 hⱼ 均大于零以展示乘法排序；原文未完整规定零频率初始化/平滑细节，本例不替论文作此设定。</p>

        <div className="p9-computation-legend"><span><i className="p9-legend-distance" />Query–Key 余弦距离 γ</span><span><i className="p9-legend-frequency" />历史频率 hⱼ</span><span><i className="p9-legend-prompt" />配对 Prompt 是否入选</span><span className="p9-rule-boundary">Eq. (4) 只改选择分数；P7 的 Lmatch 仍使用原始 γ(q,kⱼ)。</span></div>
        <ScoreWorkbench query={query} mode={mode} phase={activePhase} progress={progress} comparison={comparison} geometry={geometry} rootRef={rootRef} reducedMotion={reducedMotion} onInspect={setInspected} inspected={inspected} />
      </div>
      <figcaption>同一 Key 向量和 Query 下，Eq. (4) 可能改变 Top‑N，但不会建立任务专属槽位。测试时仍回到 Eq. (3)，不读取任务身份或 Hₜ。</figcaption>
    </figure>

    <P9EvidenceGuide />
    <section className="p9-figure3-note explain-section" id="p9-selection-evidence">
      <div><span className="p9-section-kicker">Figure 3 · 作者对选择分布的解释</span><h3>观察到共享模式，不等于 Prompt 绑定任务</h3><p>原文的<Term id="selection-histogram">Prompt 选择直方图</Term>记录训练后各槽位的命中频率。读图时看同一槽位是否被多个任务反复选中；下方保留作者的定性解读。</p></div>
      <div className="p9-interpretation-grid">{P9_FIGURE3_INTERPRETATION.map(item => <article key={item.dataset}><b>{item.dataset}</b><p>{item.pattern}</p></article>)}</div>
      <small>5-datasets 的该组完整配置启用了多样化选择。分布是所测配置中的观察，不代表一个 Prompt 只属于一个任务。</small>
    </section>

    <AblationWorkbench />
    <EvidenceResults />
    <ArchitectureBounds />

    <section className="p9-conclusion explain-section"><span className="p9-section-kicker">回到 P1 · 结论的适用范围</span><h3>L2P 在报告的协议中<span className="editorial-key">缓解遗忘</span>，不保证永不遗忘</h3><p>证据支持预训练视觉 Transformer 加可学习 Prompt Pool 在若干持续学习设置中的效果；作者展示的 task-agnostic Gaussian-scheduled CIFAR-100 是合成的平滑分布漂移基准，仍不同于不规则真实数据流。基础 L2P 不需要旧样本回放，<Term id="replay-variant">L2P-R</Term> 则是加入缓存的变体。</p>
      <details className="p9-capacity-note"><summary>补充：池容量 M 与单次调用容量 N·Lₚ</summary><p>M 决定池中可寻址的 Key–Prompt 槽位数；N·Lₚ 决定单次输入拼入多少 Prompt Token。增加 M 不必然增加一次前向序列长度。论文 Figure 4 在所测范围内报告了依数据集而异的容量趋势，参数并非越大越好。</p></details>
    </section>
  </>;
}
