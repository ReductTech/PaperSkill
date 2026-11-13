import { P4_TOY_EXPERIMENT as experiment, P4_TRAINING_TRACE as trace, runP4Forward } from "./prompt-tuning-demo";
import "./p4-rerun.css";

const promptOnly = runP4Forward(trace.updatedPrompt, experiment.classifier.weights, experiment.classifier.bias);
const cases = [
  { id: "baseline", title: "原参数", changes: [false, false], result: trace.initial },
  { id: "prompt", title: "只换 Prompt", changes: [true, false], result: promptOnly },
  { id: "joint", title: "换 Prompt 和分类头", changes: [true, true], result: trace.updated },
];
const percent = (value: number) => (100 * value).toFixed(2);
const x = (value: number) => `${(value - .4) * 1000}%`;

export function P4Rerun() {
  return <figure className="p4-rerun" aria-label="用三次同图前向分辨 Prompt 和分类头对预测的影响">
    <div className="p4-rerun__body">
      <aside className="p4-rerun__fixed">
        <span className="p4-rerun__tokens" aria-hidden="true"><i /><i /><i /><i /></span>
        <h4>同一个输入</h4>
        <p>图像 Token、标签 <math><mi>y</mi><mo>=</mo><mn>{experiment.label}</mn></math>、冻结 Attention 都保持原样。</p>
        <div className="p4-rerun__equation">
          <span>参数只更新一步</span>
          <math><msup><mi>P</mi><mo>′</mo></msup><mo>=</mo><mi>P</mi><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>P</mi></msub><mi>ℒ</mi></math>
        </div>
      </aside>
      <div className="p4-rerun__results">
        <header><strong>真实类别的预测概率</strong><span>局部刻度 · 40%–50%</span></header>
        <ol>
          {cases.map(({ id, title, changes, result }) => <li key={id} data-case={id}>
            <div className="p4-rerun__case"><strong>{title}</strong><span>交叉熵 {result.loss.toFixed(3)}</span></div>
            <div className="p4-rerun__params">{changes.map((changed, index) => <span key={index} data-changed={changed} data-param={index === 0 ? "prompt" : "head"}>
              {index === 0 ? "P" : "φ"} · {changed ? "更新" : "原值"}
            </span>)}</div>
            <div className="p4-rerun__track">
              <span className="p4-rerun__point" style={{ left: x(result.probabilities[experiment.label]) }}>
                <b>{percent(result.probabilities[experiment.label])}%</b>
              </span>
            </div>
          </li>)}
        </ol>
        <div className="p4-rerun__axis"><div className="p4-rerun__scale"><span>40%</span><span>45%</span><span>50%</span></div></div>
      </div>
    </div>
    <figcaption>只换 Prompt，真实类别的概率从 {percent(trace.initial.probabilities[experiment.label])}% 升到 {percent(promptOnly.probabilities[experiment.label])}%；两处都换后升得更多，但本例最高分的类别仍未改变。「只换 Prompt」是对照复算，不是额外训练了一步。</figcaption>
  </figure>;
}
