import { useState } from "react";
import { PaperFigure } from "../shared/core/paper-figure";
import { PaperTerm } from "../components/PaperTerm";
import { FIGURE2_SOURCE_FRAME, figure2Selection } from "../data/figure2-focus";
import { CLASSES_PER_BATCH, TABLE1A, TABLE1B, type AblationResult } from "../data/table1-results";

const figure2Src = new URL("../../assets/figures/figure-2.png", import.meta.url).href;
const figure3Src = new URL("../../assets/figures/figure-3.png", import.meta.url).href;
const figure4Src = new URL("../../assets/figures/figure-4.png", import.meta.url).href;

type EvidenceTab = "overall" | "components" | "approximation" | "memory";
type Benchmark = "cifar" | "small" | "full";
type Mechanism = "prototype" | "rehearsal" | "distillation";
type MethodKey = "icarL" | "hybrid1" | "hybrid2" | "hybrid3" | "lwfMC";
type FocusRect = { x: number; y: number; width: number; height: number };
type SourceFrame = { width: number; height: number };

const tabs: { id: EvidenceTab; label: string; question: string }[] = [
  { id: "overall", label: "整体结果", question: "面对连续加入的类别，iCaRL 的准确率会怎样变化？" },
  { id: "components", label: "哪些机制起作用", question: "如果整体结果较好，是哪些设计在发挥作用？" },
  { id: "approximation", label: "Exemplar 的分类代价", question: "少量 exemplars 构造原型，会损失多少分类准确率？" },
  { id: "memory", label: "预算与适用边界", question: "记忆预算影响什么，又留下哪些资源限制？" },
];

const methods: { id: MethodKey; label: string; color: string }[] = [
  { id: "icarL", label: "iCaRL", color: "#39748f" }, { id: "hybrid1", label: "Hybrid 1", color: "#967242" },
  { id: "hybrid2", label: "Hybrid 2", color: "#58845c" }, { id: "hybrid3", label: "Hybrid 3", color: "#a36b56" },
  { id: "lwfMC", label: "LwF.MC", color: "#68747a" },
];

const mechanismComparisons: Record<Mechanism, { title: string; comparisonKind: string; pair: string[]; explanation: string; question: string; nuance: string }> = {
  prototype: {
    title: "原型分类器", comparisonKind: "单组件对照", pair: ["iCaRL", "Hybrid 1"],
    explanation: "两者都使用相同的表示学习与 exemplar 回放；区别在最终分类器：iCaRL 使用 exemplar 均值，Hybrid 1 使用网络输出。",
    question: "原型分类器带来了什么差异？",
    nuance: "作者指出，较小类别批次下两者差距尤其明显；这类设置包含更多轮表示更新。",
  },
  rehearsal: {
    title: "Exemplar 回放", comparisonKind: "对照性证据", pair: ["Hybrid 3", "LwF.MC"],
    explanation: "Hybrid 3 用 exemplars 参与表示学习、不使用蒸馏；LwF.MC 不使用 exemplars、使用蒸馏。两者同时改变了回放与蒸馏，并非只改变回放的单变量对照。",
    question: "包含 exemplar 回放的配置呈现出什么差异？",
    nuance: "论文用这组对照讨论 exemplar rehearsal 对抗遗忘的作用；差异不能只归因于回放，也不能推广为所有任务的普遍结论。",
  },
  distillation: {
    title: "知识蒸馏", comparisonKind: "单组件对照", pair: ["iCaRL", "Hybrid 2"],
    explanation: "两者都使用 exemplar 回放与原型分类；Hybrid 2 移除了蒸馏损失。",
    question: "保持旧类别响应带来了什么差异？",
    nuance: "蒸馏的效果取决于类别批次大小：批次较大时更有优势，最小的两类批次出现反例。",
  },
};

const benchmarkLabels: Record<Benchmark, string> = { cifar: "iCIFAR-100", small: "iILSVRC-small", full: "iILSVRC-full" };
const figure2Frame: SourceFrame = FIGURE2_SOURCE_FRAME;
const figure4Frame: SourceFrame = { width: 1017, height: 666 };

type MemoryFocus = "trend" | "prototype" | "classifier";
const memoryFocusRects: Record<MemoryFocus, FocusRect> = {
  trend: { x: 71, y: 20, width: 881, height: 392 },
  prototype: { x: 250, y: 20, width: 700, height: 392 },
  classifier: { x: 71, y: 140, width: 881, height: 270 },
};
const memoryInterpretations: Record<MemoryFocus, { label: string; heading: string; copy: string }> = {
  trend: { label: "观察整体趋势", heading: "较大的 K 在本组实验中伴随更高准确率", copy: "Figure 4 在 iCIFAR-100、每批 10 类的设置下比较不同 K。原图显示三种分类配置都受益于更大的记忆预算；这不是对所有实验条件的单调性定理。" },
  prototype: { label: "iCaRL 与 NCM", heading: "K ≥ 1,000 时两种原型分类表现接近", copy: "论文讨论指出，在这组预算下，exemplar 均值分类器与全数据 NCM 的结果接近。NCM 仍需访问全部历史图像，不受同样的 exemplar 预算限制。" },
  classifier: { label: "网络输出分类器", heading: "原图中的 Hybrid 1 低于原型分类配置", copy: "Hybrid 1 使用相同表示，但以网络输出分类。这里观察原始 Figure 4 的定性曲线，不从像素读取或补造精确数值。" },
};

function EvidenceTag({ kind }: { kind: "PAPER RESULT" | "PAPER INTERPRETATION" | "PAPER LIMITATION" | "TEACHING EXPLANATION" | "GENERAL BACKGROUND" }) {
  return <span className={`p8-tag p8-tag--${kind.toLowerCase().replace(/ /g, "-")}`}>[{kind}]</span>;
}

function PageEvidenceHeader() {
  return <header className="page-heading icarl-page__heading">
    <div className="icarl-page__eyebrow"><span>PAGE 08</span><i /> 论文证据与适用边界</div>
    <h1>这些机制由什么证据支持？结论止于哪里？</h1>
    <p>沿着刚完成的训练与预测链，先核对整体结果，再比较组件、近似代价和记忆边界。</p>
  </header>;
}

function EvidenceTabs({ value, onChange }: { value: EvidenceTab; onChange: (tab: EvidenceTab) => void }) {
  return <nav className="p8-tabs" role="tablist" aria-label="四个连续实验问题">{tabs.map((tab, index) => <button key={tab.id} id={`p8-tab-${tab.id}`} type="button" role="tab" aria-controls={`p8-panel-${tab.id}`} aria-selected={value === tab.id} aria-current={value === tab.id ? "step" : undefined} className={value === tab.id ? "is-active" : ""} onClick={() => onChange(tab.id)}><span>{String(index + 1).padStart(2, "0")}</span>{tab.label}</button>)}</nav>;
}

function BatchSelector({ value, onChange, label = "每批新类别数" }: { value: number; onChange: (value: (typeof CLASSES_PER_BATCH)[number]) => void; label?: string }) {
  return <div className="p8-batch-selector"><span>{label}</span><div role="group" aria-label={label}>{CLASSES_PER_BATCH.map((batch) => <button key={batch} type="button" className={value === batch ? "is-active" : ""} aria-pressed={value === batch} onClick={() => onChange(batch)}>{batch}</button>)}</div></div>;
}

function DatasetCard({ title, strap, classes, batches, metric, backbone, memory, background, sourceHref, sourceLabel }: { title: string; strap: string; classes: string; batches: string; metric: string; backbone: string; memory: string; background: string; sourceHref: string; sourceLabel: string }) {
  return <section className="p8-dataset-card"><div className="p8-dataset-card__top"><div><span className="eyebrow">{strap}</span><h3>{title}</h3></div></div><div className="p8-dataset-card__background"><EvidenceTag kind="GENERAL BACKGROUND" /><p>{background}</p><a href={sourceHref} target="_blank" rel="noreferrer">{sourceLabel}</a></div><dl><div><dt>类别数 / 批次</dt><dd>{classes} · {batches}</dd></div><div><dt>指标 / 骨干</dt><dd>{metric} · {backbone}</dd></div><div><dt>图像预算</dt><dd>{memory}</dd></div></dl></section>;
}

function DatasetDetails() {
  return <details className="p8-details p8-dataset-details"><summary>展开数据集背景与完整设置</summary><div className="p8-dataset-grid">
    <DatasetCard title="iCIFAR-100" strap="小图像分类" classes="100" batches="2 / 5 / 10 / 20 / 50" metric="多类准确率" backbone="ResNet-32" memory="K ≤ 2,000" background="CIFAR-100 包含 100 个细类，并组织为 20 个超类。" sourceHref="https://www.cs.toronto.edu/~kriz/cifar.html" sourceLabel="University of Toronto · CIFAR-100" />
    <DatasetCard title="iILSVRC 2012" strap="大规模自然图像" classes="100 或 1,000" batches="10 或 100" metric="验证集 Top-5" backbone="ResNet-18" memory="K ≤ 20,000" background="iILSVRC-small 使用 100 类，iILSVRC-full 使用 1,000 类；每个设置按批次增量学习。" sourceHref="https://www.image-net.org/challenges/LSVRC/2012/" sourceLabel="ImageNet · ILSVRC 2012" />
    <div className="p8-dataset-extra"><p><b>iCIFAR-100</b> · 10 种类别顺序；每批训练 70 epochs；batch size 128。</p><p><b>iILSVRC</b> · 每批训练 60 epochs；batch size 128。</p><small>完整学习率与 weight decay 配置见证据记录。</small></div>
  </div></details>;
}

function SourceFocusOverlay({ frame, rect, tone }: { frame: SourceFrame; rect?: FocusRect; tone: "overall" | "prototype" | "classifier" | "trend" }) {
  if (!rect) return null;
  return <svg className={`p8-source-focus p8-source-focus--${tone}`} width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`} preserveAspectRatio="none" aria-hidden="true">
    <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="8" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function Figure2Evidence({ benchmark, batch }: { benchmark: Benchmark; batch: number }) {
  const selection = figure2Selection(benchmark, batch);
  const { x, y, width, height } = selection.rect;
  return <div className="p8-figure-focus p8-figure-focus--selected" data-focus={selection.focusId} data-focus-x={x} data-focus-y={y} data-focus-width={width} data-focus-height={height}>
    <PaperFigure src={figure2Src} mode="original" figureLabel="Figure 2" alt="论文原始完整 Figure 2：iCIFAR-100 与 iILSVRC 的类别增量实验准确率曲线、坐标轴与图例。" caption={`完整原图保留所有数据集、坐标轴与图例。当前选择：${selection.protocolLabel}。`} source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 2, pp. 7–8." />
    <SourceFocusOverlay frame={figure2Frame} rect={selection.rect} tone="overall" />
  </div>;
}

function Figure3Details() {
  return <div className="p8-figure3-evidence">
    <div><span className="eyebrow">补充观察 · Figure 3</span><p>混淆矩阵显示不同方法偏向不同类别时段：iCaRL 的预测分布较均匀；LwF.MC 偏向最近批次；固定表示偏向早期批次；微调偏向最后批次。</p></div>
    <details className="p8-figure3-details"><summary>打开原始混淆矩阵与图注</summary><div className="p8-figure3-layout"><PaperFigure src={figure3Src} mode="crop" figureLabel="Figure 3" alt="论文原始 Figure 3：iCaRL、LwF.MC、固定表示与微调的混淆矩阵。" caption="iCIFAR-100、每批 10 类；矩阵条目经 log(1+x) 变换以提高可见度。" source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 3, p. 8." /><p>这里比较预测分布的整体偏置，不逐格解释经过变换的混淆矩阵数值。</p></div></details>
  </div>;
}

function OverallPanel({ benchmark, setBenchmark, batch, setBatch }: { benchmark: Benchmark; setBenchmark: (value: Benchmark) => void; batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const metric = benchmark === "cifar" ? "所有已见类别上的多类准确率" : "所有已见类别上的 Top-5 准确率";
  const protocol = benchmark === "cifar"
    ? `100 类 · 每批 ${batch} 类 · ${100 / batch} 个增量阶段 · ResNet-32 · K ≤ 2,000`
    : benchmark === "small" ? "100 类 · 每批 10 类 · 验证集 Top-5 · ResNet-18 · K ≤ 20,000" : "1,000 类 · 每批 100 类 · 验证集 Top-5 · ResNet-18 · K ≤ 20,000";
  return <section className="p8-workbench p8-workbench--overall" role="tabpanel" id="p8-panel-overall" aria-labelledby="p8-tab-overall" aria-label="问题一：整体系统有效吗？">
    <div className="p8-workbench__evidence">
      <div className="p8-panel-heading"><div><span className="eyebrow">问题 1 · 论文整体结果</span><h2>准确率怎样随已见类别增加而变化？</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <p className="p8-question-lead">前面建立了一套完整的训练与预测流程，但设计得自洽，不代表表现一定更好。先确定实验如何逐批加入类别，再读原图。</p>
      <div className="p8-setting-controls" role="group" aria-label="选择 Figure 2 的实验设置">{(["cifar", "small", "full"] as const).map((choice) => <button key={choice} type="button" className={benchmark === choice ? "is-active" : ""} aria-pressed={benchmark === choice} onClick={() => setBenchmark(choice)}>{benchmarkLabels[choice]}</button>)}</div>
      {benchmark === "cifar" ? <BatchSelector value={batch} onChange={setBatch} /> : null}
      <div className="p8-figure2-reading"><div><span>当前协议</span><b>{protocol}</b></div><div><span>读坐标</span><b>横轴：累计已见类别数　·　纵轴：{metric}</b></div></div>
      <Figure2Evidence benchmark={benchmark} batch={batch} />
      <Figure3Details />
    </div>
    <aside className="p8-workbench__interpretation">
      <span className="eyebrow">当前聚焦 · {benchmarkLabels[benchmark]}</span>
      <h2>{benchmark === "cifar" ? `iCIFAR-100 · 每批 ${batch} 类` : benchmarkLabels[benchmark]}</h2>
      <p>每批新类别到达后，在截至该阶段已见的全部类别上评估；Figure 2 的各数据集与指标分别呈现，不共用一条数轴。</p>
      <div className="p8-result-note"><span>原图中的观察</span><b>论文报告的设置中，iCaRL 整体高于所比较的增量方法。</b><small>iILSVRC-full 中 fixed representation 与 LwF.MC 的排序是例外；全数据单批训练的 68.6% 是另一个参照。</small></div>
      <DatasetDetails />
    </aside>
  </section>;
}

function ComponentMatrix({ highlighted }: { highlighted: string[] }) {
  const rows = [
    { name: "iCaRL", values: [1, 1, 1] }, { name: "Hybrid 1", values: [0, 1, 1] },
    { name: "Hybrid 2", values: [1, 1, 0] }, { name: "Hybrid 3", values: [0, 1, 0] }, { name: "LwF.MC", values: [0, 0, 1] },
  ];
  return <div className="p8-component-matrix" role="table" aria-label="iCaRL 与 Hybrid 方法的组件配置；当前比较方法已高亮">
    <div className="p8-component-matrix__row p8-component-matrix__head" role="row"><b role="columnheader">方法</b><b role="columnheader">原型分类</b><b role="columnheader">样本回放</b><b role="columnheader">知识蒸馏</b></div>
    {rows.map((row) => <div role="row" key={row.name} className={`p8-component-matrix__row${highlighted.includes(row.name) ? " is-focused" : " is-muted"}`}><b role="rowheader">{row.name}</b>{row.values.map((enabled, index) => <span role="cell" className={enabled ? "is-enabled" : "is-disabled"} aria-label={`${["原型分类器", "exemplar 回放", "知识蒸馏"][index]}：${enabled ? "启用" : "未启用"}`} key={index}>{enabled ? "●" : "○"}</span>)}</div>)}
  </div>;
}

function DotPlot({ data, batch, highlighted }: { data: AblationResult; batch: number; highlighted: string[] }) {
  return <div className="p8-dotplot" role="group" aria-label={`Table 1a：iCIFAR-100 每批 ${batch} 类时的平均增量准确率`}>
    <div className="p8-dotplot__axis" aria-hidden="true"><span>方法</span><div>{[0, 20, 40, 60, 70].map((tick) => <i key={tick}>{tick}</i>)}</div><span>%</span></div>
    {methods.map((method) => {
      const value = data[method.id];
      const emphasized = highlighted.includes(method.label);
      return <div key={method.id} className={`p8-dotplot__row${emphasized ? " is-emphasized" : " is-muted"}`} aria-label={`${method.label}：${value.toFixed(1)}%`}>
        <span className="p8-dotplot__label">{method.label}</span><span className="p8-dotplot__track"><i style={{ left: `${(value / 70) * 100}%`, backgroundColor: method.color }} /></span><b>{value.toFixed(1)}%</b>
      </div>;
    })}
  </div>;
}

function Table1aDetails() {
  return <details className="p8-details p8-table-details"><summary>查看 Table 1a 全部准确率</summary><div className="p8-table-wrap"><table><caption>iCIFAR-100 · 各增量阶段多类准确率的平均值（%）</caption><thead><tr><th>每批新类别数</th>{methods.map((method) => <th key={method.id}>{method.label}</th>)}</tr></thead><tbody>{TABLE1A.map((row) => <tr key={row.batchSize}><th>{row.batchSize}</th>{methods.map((method) => <td key={method.id}>{row[method.id].toFixed(1)}</td>)}</tr>)}</tbody></table></div></details>;
}

function ComponentPanel({ batch, setBatch }: { batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const [mechanism, setMechanism] = useState<Mechanism>("prototype");
  const data = TABLE1A.find((row) => row.batchSize === batch) ?? TABLE1A[0];
  const comparison = mechanismComparisons[mechanism];
  const selectedMethods = methods.filter((method) => comparison.pair.includes(method.label));
  return <section className="p8-workbench p8-workbench--components" role="tabpanel" id="p8-panel-components" aria-labelledby="p8-tab-components" aria-label="问题二：哪些机制起作用？">
    <div className="p8-workbench__evidence">
      <div className="p8-panel-heading"><div><span className="eyebrow">问题 2 · Table 1a 组件对照</span><h2>选一个设计差异，在同一数据设置下比较</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <p className="p8-question-lead">只看完整系统还不能判断哪些机制有所贡献。选择一项 iCaRL 设计，图中同步突出相关方法、组件差异与真实准确率。</p>
      <div className="p8-mechanism-select" role="group" aria-label="选择要检查的 iCaRL 机制">{(["prototype", "rehearsal", "distillation"] as const).map((item) => <button key={item} type="button" className={mechanism === item ? "is-active" : ""} aria-pressed={mechanism === item} onClick={() => setMechanism(item)}>{mechanismComparisons[item].title}</button>)}</div>
      <ComponentMatrix highlighted={comparison.pair} />
      <div className="p8-ablation-meta"><span><i className="is-enabled">●</i> 启用</span><span><i className="is-disabled">○</i> 未启用</span><span>高亮行是当前对照</span></div>
      <BatchSelector value={batch} onChange={setBatch} />
      <div className="p8-plot-heading"><b>{comparison.question}</b><span>Table 1a · iCIFAR-100 · 平均增量多类准确率</span></div>
      <DotPlot data={data} batch={batch} highlighted={comparison.pair} />
      <div className="p8-selected-values" aria-live="polite">{selectedMethods.map((method) => <span key={method.id}><b>{method.label}</b><strong>{data[method.id].toFixed(1)}%</strong><small>每批 {batch} 类</small></span>)}</div>
      <Table1aDetails />
    </div>
    <aside className="p8-workbench__interpretation">
      <span className="eyebrow">{comparison.comparisonKind} · {comparison.title}</span>
      <h2>{comparison.pair.join(" vs ")}</h2>
      <div className="p8-result-note"><span>这组方法改变了什么</span><b>{comparison.explanation}</b></div>
      <p>{comparison.nuance}</p>
      {mechanism === "rehearsal" ? <div className="p8-caution"><b>归因边界</b><span>Hybrid 3 与 LwF.MC 同时改变了 exemplar 回放和蒸馏，不能把两者差异解释为回放的独立因果效应。</span></div> : null}
      {mechanism === "distillation" ? <div className="p8-exception"><b>两类批次的反例</b><strong>Hybrid 2 高于 iCaRL</strong><span>iCaRL 57.0%　·　Hybrid 2 57.6%</span><small>Table 1a，iCIFAR-100 每批 2 类。</small></div> : null}
      <p className="p8-scope-note">这些消融数据来自论文的 iCIFAR-100 协议；批次大小会影响各组件的相对收益。</p>
    </aside>
  </section>;
}

function GapPlot({ batch, values }: { batch: number; values: { icarL: number; ncm: number } }) {
  const gap = values.ncm - values.icarL;
  return <div className="p8-gap-plot" aria-label={`Table 1b：每批 ${batch} 类时，iCaRL ${values.icarL.toFixed(1)}%，NCM ${values.ncm.toFixed(1)}%，相差 ${gap.toFixed(1)} 个百分点。`}>
    <div className="p8-gap-readouts"><span><i className="p8-gap-key p8-gap-key--icarL" />iCaRL <b>{values.icarL.toFixed(1)}%</b></span><span><i className="p8-gap-key p8-gap-key--ncm" />NCM <b>{values.ncm.toFixed(1)}%</b></span><strong>差 {gap.toFixed(1)} 个百分点</strong></div>
    <div className="p8-gap-axis"><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>70%</span></div>
    <div className="p8-gap-track"><span className="p8-gap-line" style={{ left: `${(values.icarL / 70) * 100}%`, width: `${(gap / 70) * 100}%` }} /><i className="p8-gap-dot p8-gap-dot--icarL" style={{ left: `${(values.icarL / 70) * 100}%` }} /><i className="p8-gap-dot p8-gap-dot--ncm" style={{ left: `${(values.ncm / 70) * 100}%` }} /></div>
  </div>;
}

function Table1bDetails() {
  return <details className="p8-details p8-table-details"><summary>查看 Table 1b 全部准确率</summary><div className="p8-table-wrap"><table><caption>iCIFAR-100 · 平均增量多类准确率（%）与百分点差值</caption><thead><tr><th>每批新类别数</th><th>iCaRL</th><th>全数据 NCM</th><th>差值</th></tr></thead><tbody>{TABLE1B.map((row) => <tr key={row.batchSize}><th>{row.batchSize}</th><td>{row.icarL.toFixed(1)}</td><td>{row.ncm.toFixed(1)}</td><td>{(row.ncm - row.icarL).toFixed(1)} pp</td></tr>)}</tbody></table></div></details>;
}

function ApproximationPanel({ batch, setBatch }: { batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const data = TABLE1B.find((row) => row.batchSize === batch) ?? TABLE1B[0];
  return <section className="p8-workbench p8-workbench--approximation" role="tabpanel" id="p8-panel-approximation" aria-labelledby="p8-tab-approximation" aria-label="问题三：Exemplar 近似的分类代价">
    <div className="p8-workbench__evidence">
      <div className="p8-panel-heading"><div><span className="eyebrow">问题 3 · Table 1b 近似代价</span><h2>使用少量 Exemplars 构造原型，会损失多少分类准确率？</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <p className="p8-question-lead">Herding 让我们用少量图片构造类别原型；Table 1b 把它与可访问全部历史图像的均值参照放在同一表示下比较。</p>
      <div className="p8-mean-compare">
        <section><span className="p8-mean-label">iCaRL · 受限 exemplar 记忆</span><div className="p8-mean-flow"><b>保留图片 P<sub>y</sub></b><i>↓</i><b>当前特征提取器 φ<sub>Θ</sub></b><i>↓</i><strong>exemplar 均值原型</strong></div></section>
        <section className="p8-mean-compare__ncm"><span className="p8-mean-label"><PaperTerm termId="ncm" /> · 全数据诊断参照</span><div className="p8-mean-flow"><b>全部历史图像 X<sub>y</sub></b><i>↓</i><b>同一当前特征提取器 φ<sub>Θ</sub></b><i>↓</i><strong>全数据类别均值</strong></div></section>
      </div>
      <BatchSelector value={batch} onChange={setBatch} />
      <GapPlot batch={batch} values={data} />
      <p className="p8-accuracy-note"><EvidenceTag kind="TEACHING EXPLANATION" /><span>这组差值衡量的是分类准确率（百分点），不是两个均值向量的 L2 距离。</span></p>
      <div className="p8-full-data-note"><b>读 NCM 时保留这个条件</b><span>它每轮都能用全部历史训练图像重算均值，因此是近似质量的诊断参照，不是与 iCaRL 具有相同存储预算的增量方法。</span></div>
      <Table1bDetails />
    </div>
    <aside className="p8-workbench__interpretation">
      <span className="eyebrow">当前协议 · iCIFAR-100</span>
      <h2>每批 {batch} 类</h2>
      <div className="p8-result-note"><span>Table 1b 的当前结果</span><b>iCaRL {data.icarL.toFixed(1)}%　·　全数据 NCM {data.ncm.toFixed(1)}%</b><small>相差 {(data.ncm - data.icarL).toFixed(1)} 个百分点。</small></div>
      <p>较小的准确率差支持 exemplar 均值在该实验协议下作为一种近似；不能据此推导均值向量之间的几何距离。</p>
      <div className="p8-caution"><b>预算不相同</b><span>NCM 参照读取全部历史训练图像；它的准确率没有受到与 iCaRL 相同的图片记忆预算约束。</span></div>
    </aside>
  </section>;
}

function MemoryPanel() {
  const [focus, setFocus] = useState<MemoryFocus>("trend");
  const selected = memoryInterpretations[focus];
  const tone = focus === "prototype" ? "prototype" : focus === "classifier" ? "classifier" : "trend";
  return <section className="p8-memory-question" role="tabpanel" id="p8-panel-memory" aria-labelledby="p8-tab-memory" aria-label="问题四：记忆成本与适用边界">
    <div className="p8-memory-workbench">
      <div className="p8-workbench__evidence">
        <div className="p8-panel-heading"><div><span className="eyebrow">问题 4 · Figure 4 记忆预算</span><h2>增大 K 会改变什么？</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
        <p className="p8-question-lead">K 决定能留下多少 exemplars。先沿原图观察预算变化，再把性能趋势和资源成本一起读。</p>
        <div className="p8-k-direction"><b>Exemplar 图像预算 K</b><span>较少</span><i aria-hidden="true" /><span>较多</span></div>
        <div className="p8-memory-focus" role="group" aria-label="选择 Figure 4 的观察角度">{(Object.keys(memoryInterpretations) as MemoryFocus[]).map((key) => <button key={key} type="button" className={focus === key ? "is-active" : ""} aria-pressed={focus === key} onClick={() => setFocus(key)}>{memoryInterpretations[key].label}</button>)}</div>
        <div className="p8-figure-focus p8-figure-focus--memory" data-focus={focus}>
          <PaperFigure src={figure4Src} mode="crop" figureLabel="Figure 4" alt="论文原始 Figure 4：每批 10 类的 iCIFAR-100 设置下，不同 exemplar 记忆预算 K 的平均增量准确率曲线。" caption="iCIFAR-100、每批 10 类；图中比较 iCaRL、全数据 NCM 和 Hybrid 1。" source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 4, p. 9." />
          <SourceFocusOverlay frame={figure4Frame} rect={memoryFocusRects[focus]} tone={tone} />
        </div>
        <p className="p8-memory-observation"><b>{selected.heading}</b><span>{selected.copy}</span></p>
        <p className="p8-no-digitize"><EvidenceTag kind="TEACHING EXPLANATION" /><span>保留原始曲线；未从图像像素推算新数值。Figure 4 只报告 iCIFAR-100、每批 10 类的设置。</span></p>
      </div>
      <aside className="p8-memory-boundaries">
        <div className="p8-panel-heading"><div><span className="eyebrow">收益与成本</span><h2>预算只覆盖图片数量</h2></div><EvidenceTag kind="PAPER LIMITATION" /></div>
        <div className="p8-boundary-list">
          <div><b>原图像要能留存</b><p>训练与预测需保留原始 exemplar；隐私或数据保管规则可能限制这种做法。</p></div>
          <div><b>模型总记忆并非恒定</b><p>K 限制图片数；输出层权重仍随已见类别增加，不能说整个模型记忆保持常数。</p></div>
          <div><b>结果受协议约束</b><p>Figure 4 的趋势来自 iCIFAR-100、每批 10 类；不代表所有任务或设置下都必然单调改善。</p></div>
        </div>
        <p className="p8-author-limit"><EvidenceTag kind="PAPER INTERPRETATION" /><span>作者将批量训练与增量训练的性能差距，以及不能保存原始图像的场景，留作后续研究问题。</span></p>
        <div className="p8-qualified-summary"><span>结论边界</span><b>论文结果支持的是所测数据与协议中的趋势</b><p>它不证明 iCaRL 对所有持续学习任务普遍占优，也不证明总模型开销与类别数无关。</p></div>
      </aside>
    </div>
  </section>;
}

function EvidenceConclusion() {
  return <section className="p8-evidence-synthesis" aria-label="研究问题、证据、支持结论与适用边界">
    <header><span className="eyebrow">结尾总结 · 问题与证据逐项对应</span><h2>哪些结论有证据支持？</h2><p>结论跟随论文实际测量的对象与实验协议。</p></header>
    <div className="p8-evidence-synthesis__grid">
      <article><h3>整体效果</h3><p><b>问题</b> 类别逐批增加时，准确率怎样变化？</p><p><b>证据</b> Figure 2 的 iCIFAR-100 与 iILSVRC 曲线。</p><p><b>支持</b> 在报告的设置中，iCaRL 整体高于多数增量对照方法。</p><p><b>边界</b> iILSVRC-full 有排序例外；结论限于图中数据集、指标和协议。</p></article>
      <article><h3>组件作用</h3><p><b>问题</b> 原型分类、回放和蒸馏各自带来什么差异？</p><p><b>证据</b> Table 1a 的 Hybrid 方法消融。</p><p><b>支持</b> iCaRL 高于 Hybrid 1；蒸馏相对 Hybrid 2 的差异随批次而变。</p><p><b>边界</b> 每批 2 类时 Hybrid 2 为 57.6%、iCaRL 为 57.0%；Hybrid 3 与 LwF.MC 也不能单独归因回放。</p></article>
      <article><h3>原型近似</h3><p><b>问题</b> 受限 exemplar 均值与全数据均值分类差多少？</p><p><b>证据</b> Table 1b 的 iCaRL 与全数据 NCM 准确率。</p><p><b>支持</b> 表中两者的准确率差较小，支持在所测协议中用 exemplars 近似。</p><p><b>边界</b> 比较量是准确率百分点；NCM 可读取全部历史图像，预算不同。</p></article>
      <article><h3>记忆预算</h3><p><b>问题</b> 增加 K 会怎样影响准确率与资源需求？</p><p><b>证据</b> Figure 4 的 iCIFAR-100、每批 10 类曲线。</p><p><b>支持</b> 该实验中更大的 K 伴随更高准确率。</p><p><b>边界</b> 这是单一协议的趋势；输出层参数仍随已见类别增长。</p></article>
    </div>
  </section>;
}

export function PageEight({ onContinue }: { onContinue?: () => void }) {
  const [tab, setTab] = useState<EvidenceTab>("overall");
  const [batch, setBatch] = useState<(typeof CLASSES_PER_BATCH)[number]>(10);
  const [benchmark, setBenchmark] = useState<Benchmark>("cifar");
  const currentIndex = tabs.findIndex((item) => item.id === tab);

  function navigateTab(offset: number) {
    const next = Math.max(0, Math.min(tabs.length - 1, currentIndex + offset));
    setTab(tabs[next].id);
  }

  return <article className="tutorial-page icarl-page icarl-page--p8" data-question={tab}>
    <PageEvidenceHeader />
    <EvidenceTabs value={tab} onChange={setTab} />
    {tab === "overall" ? <OverallPanel benchmark={benchmark} setBenchmark={setBenchmark} batch={batch} setBatch={setBatch} /> : null}
    {tab === "components" ? <ComponentPanel batch={batch} setBatch={setBatch} /> : null}
    {tab === "approximation" ? <ApproximationPanel batch={batch} setBatch={setBatch} /> : null}
    {tab === "memory" ? <MemoryPanel /> : null}
    <EvidenceConclusion />
    <div className="p8-step-controls"><span>问题 {String(currentIndex + 1).padStart(2, "0")} / 04 · 论文证据</span><div>
      <button type="button" className="icarl-button icarl-button--quiet" disabled={currentIndex === 0} onClick={() => navigateTab(-1)}>上一个问题</button>
      <button type="button" className="icarl-button icarl-button--primary" disabled={currentIndex === tabs.length - 1} onClick={() => navigateTab(1)}>下一个问题<span aria-hidden="true"> →</span></button>
    </div></div>
    <section className="p8-page-handoff" aria-label="进入 iCaRL 一次增量学习的完整逻辑">
      <div><span className="eyebrow">实验总结 · 进入完整推演</span><h2>把证据放回系统流程</h2><p>按运行顺序追踪训练准备、模型更新、记忆维护、最近原型预测与下一轮交接。</p></div>
      <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue} disabled={!onContinue}>下一页：一次增量学习的完整逻辑 <span aria-hidden="true">→</span></button>
    </section>
  </article>;
}
