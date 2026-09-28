import { useState } from "react";

type ObjectiveEmphasis = "new" | "old";
type Temperature = "1" | "2";

export function ObjectiveBalanceView() {
  const [emphasis, setEmphasis] = useState<ObjectiveEmphasis>("new");
  const [temperature, setTemperature] = useState<Temperature>("2");
  const emphasizeOld = emphasis === "old";

  return <div className={`v3-objective-balance ${emphasizeOld ? "emphasis-old" : "emphasis-new"}`}>
    <div className="v3-objective-controls">
      <div className="v3-compact-toggle" role="group" aria-label="调整旧响应项的概念权重">
        <button type="button" aria-pressed={!emphasizeOld} onClick={() => setEmphasis("new")}>λₒ low</button>
        <button type="button" aria-pressed={emphasizeOld} onClick={() => setEmphasis("old")}>λₒ high</button>
      </div>
      <p className="v3-objective-emphasis" aria-live="polite">{emphasizeOld ? "相对更强调旧响应保持" : "相对更偏向当前任务适应"}</p>
    </div>

    <div className="v3-objective-flow" aria-label="L old 与 L new 都影响共享参数 theta s">
      <div className="v3-objective-losses">
        <div className="v3-objective-loss is-old"><strong>λₒ L_old</strong><span>保持旧响应</span><span className="v3-objective-signal" aria-hidden="true"><i /></span></div>
        <div className="v3-objective-loss is-new"><strong>L_new</strong><span>学习当前任务</span><span className="v3-objective-signal" aria-hidden="true"><i /></span></div>
      </div>
      <svg className="v3-objective-merge" viewBox="0 0 80 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 4 28 L 74 54 M 74 54 L 66.2 48.3 M 74 54 L 68.7 54.8 M 4 92 L 74 66 M 74 66 L 66.2 68.4 M 74 66 L 68.7 71.7" />
      </svg>
      <div className="v3-shared-target"><span>共同影响</span><strong>shared θₛ</strong></div>
    </div>

    <p className="v3-objective-formula"><span>论文目标</span><strong>L = λₒ L_old + L_new + R</strong></p>
    <p className="v3-mechanism-note">进入 joint-optimize 后，L_old 与 L_new 都经各自输出路径影响共享 θₛ。λₒ 调整旧响应项的相对权重；它不预测具体准确率，也不保证旧任务表现。</p>
    <p className="v3-objective-animation-note">信号动画只表示目标项的概念性相对强调，不代表实测梯度大小。</p>

    <details className="v3-temperature-support">
      <summary>Supporting mechanism · Temperature</summary>
      <div className="v3-temperature-content">
        <div className="v3-compact-toggle" role="group" aria-label="选择温度示意">
          <button type="button" aria-pressed={temperature === "1"} onClick={() => setTemperature("1")}>T = 1</button>
          <button type="button" aria-pressed={temperature === "2"} onClick={() => setTemperature("2")}>T = 2</button>
        </div>
        <div className={`v3-temperature-shape temperature-${temperature}`} role="img" aria-label={temperature === "1" ? "尖锐的类别响应分布示意" : "更平滑的类别响应分布示意"}>
          <i /><i /><i /><i /><i /><i />
        </div>
        <p aria-live="polite">{temperature === "1" ? "T = 1 · 分布较尖锐" : "T = 2 · 分布更平滑；论文采用 T = 2"}</p>
        <small>分布形状仅作教学示意，没有精确数值；论文依据 held-out grid search 选择 T = 2。</small>
      </div>
    </details>
    <p className="v3-source-line">机制事实：arXiv:1606.09282v3，式 (2)–(4)、第 3 节 PDF pp.4–5；权重解释见 Figure 7，pp.9–10。</p>
  </div>;
}
