import { EXPERIMENTS } from "./evidence-data";
import { ReferenceButton } from "./Reference";
import "./evidence.css";

const methodClass = (method: string) => method === "DER++" ? "method-derplus" : "method-" + method.toLowerCase();
const MAIN_RESULT_IDS = new Set(["cifar-class", "mnist500", "mnist200"]);
const MAIN_EXPERIMENTS = EXPERIMENTS.filter(experiment => MAIN_RESULT_IDS.has(experiment.id));

function ExperimentCard({ experiment }: { experiment: typeof EXPERIMENTS[number] }) {
  return (
    <figure
      className="evidence-card"
      data-experiment={experiment.id}
      data-evidence-id={experiment.evidence}
      data-source-locator={experiment.locator}
    >
      <header>
        <div>
          <p className="eyebrow">{experiment.evidence} · {experiment.locator}</p>
          <h3>{experiment.title}<span> / K={experiment.capacity}</span></h3>
          <p className="evidence-protocol">{experiment.protocol}</p>
        </div>
        <span className="paper-result-label">论文原表</span>
      </header>
      <p className="experiment-conditions">{experiment.setup}</p>
      <p className="evidence-metric">{experiment.metric}</p>
      <div className="evidence-plot" role="img" aria-label={experiment.metric + "；条长表示表中均值"}>
        {experiment.values.map(value => (
          <div
            className="evidence-row"
            key={value.method}
            data-method={value.method}
            data-mean={value.mean}
            data-spread={value.spread}
            aria-label={value.method + " " + value.mean.toFixed(2) + " ± " + value.spread.toFixed(2) + "%"}
          >
            <strong>{value.method}</strong>
            <div className="evidence-track" aria-hidden="true">
              <div className={"evidence-bar " + methodClass(value.method)} style={{ width: value.mean + "%" }} />
              <span className="evidence-mean" style={{ left: value.mean + "%" }} />
            </div>
            <output><b>{value.mean.toFixed(2)}</b><small>±{value.spread.toFixed(2)}</small></output>
          </div>
        ))}
        <div className="evidence-axis" aria-hidden="true">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span>
        </div>
      </div>
      <figcaption>{experiment.conclusion}</figcaption>
    </figure>
  );
}

export default function Evidence() {
  return (
    <section className="evidence-section" data-scene="evidence" data-experiment-count={MAIN_EXPERIMENTS.length}>
      <div className="evidence-lead">
        <p className="lead">结果支持哪些判断，取决于数据集、协议和容量。</p>
        <p>
          先看 S-CIFAR-10 的 Class-IL 对照，再看没有稳定任务边界的 MNIST-360，最后看较小容量下的反例。
          各图只在自身条件内比较；条长表示表中均值，± 按原表照录，不作统计解释。
        </p>
      </div>

      <div className="evidence-legend" aria-label="图例">
        <span><i className="legend-er" /> ER</span>
        <span><i className="legend-der" /> DER</span>
        <span><i className="legend-derplus" /> DER++</span>
        <small>各图共用 0–100% 量尺；点标记均值，± 仅以原表文字保留。</small>
      </div>

      <section className="evidence-grid" aria-label="论文主结果对照">
        {MAIN_EXPERIMENTS.map(experiment => <ExperimentCard key={experiment.id} experiment={experiment} />)}
      </section>

      <p className="evidence-analysis">
        这些表项限定于各自的网络、数据流、容量和训练协议，也不是单一机制的因果证明。DER++ 另存历史标签，因此相同 K 不代表相同字节成本。论文的平坦性与校准分析是特定设置下的经验观察。
        <ReferenceButton term="evidence-analysis">查看分析与局限</ReferenceButton>
      </p>
      <div className="evidence-close">
        <p className="eyebrow">回看整条主线</p>
        <p>有限记忆保留部分旧输入与响应，当前标签推动学习，冻结目标约束旧行为。它们的收益要连同具体数据、模型、协议和容量一起判断。</p>
        <ReferenceButton term="evidence-results">查看完整主表、反例与来源</ReferenceButton>
        <a href="#U6-complete-system">返回四轮工作台 ↑</a>
      </div>
    </section>
  );
}
