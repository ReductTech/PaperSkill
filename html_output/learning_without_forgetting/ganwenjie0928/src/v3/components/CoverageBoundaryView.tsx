import { useState } from "react";

type Coverage = "broad" | "partial" | "small";

const coverageCopy: Record<Coverage, { label: string; observed: string; boundary: string }> = {
  broad: {
    label: "Broad overlap",
    observed: "当前 Xₙ 覆盖了示意区域中的较大一部分。",
    boundary: "覆盖区之外的旧域输入仍没有被本轮直接观察。",
  },
  partial: {
    label: "Partial overlap",
    observed: "当前 Xₙ 只覆盖了示意区域的一部分。",
    boundary: "未覆盖的旧域行为没有对应的当前输入约束。",
  },
  small: {
    label: "Small overlap",
    observed: "当前 Xₙ 与旧任务相关区域的重叠较小。",
    boundary: "大部分旧域行为没有被当前训练目标直接观察。",
  },
};

const coveragePoints = [
  { x: 96, y: 104 }, { x: 156, y: 164 }, { x: 210, y: 102 }, { x: 270, y: 168 },
  { x: 332, y: 103 }, { x: 390, y: 163 }, { x: 455, y: 106 }, { x: 518, y: 162 },
];
const coverageRadius: Record<Coverage, number> = { broad: 245, partial: 144, small: 54 };

export function CoverageBoundaryView() {
  const [coverage, setCoverage] = useState<Coverage>("partial");
  const state = coverageCopy[coverage];
  const radius = coverageRadius[coverage];

  return <div className="v3-coverage-boundary">
    <div className="v3-compact-toggle v3-coverage-controls" role="group" aria-label="选择当前任务输入覆盖示意">
      {(Object.keys(coverageCopy) as Coverage[]).map((id) => <button key={id} type="button" aria-pressed={coverage === id} onClick={() => setCoverage(id)}>{coverageCopy[id].label}</button>)}
    </div>
    <figure className="v3-coverage-figure">
      <svg viewBox="0 0 620 250" role="img" aria-labelledby="v3-coverage-title v3-coverage-desc">
        <title id="v3-coverage-title">当前 Xn 与旧任务相关输入区域的覆盖示意</title>
        <desc id="v3-coverage-desc">空心点表示旧任务相关输入区域，蓝绿色范围表示当前任务输入 Xn 的覆盖。范围随 Broad、Partial、Small 状态变化。</desc>
        <rect className="v3-old-domain" x="28" y="32" width="564" height="184" rx="28" />
        <text className="v3-coverage-region-label" x="48" y="57">OLD-TASK RELEVANT INPUT REGION</text>
        <g className="v3-coverage-points" aria-hidden="true">
          {coveragePoints.map(({ x, y }, index) => {
            const inside = ((x - 310) / radius) ** 2 + ((y - 127) / 50) ** 2 <= 1;
            return <circle key={`${x}-${y}`} className={inside ? "is-covered" : "is-uncovered"} data-point-index={index} cx={x} cy={y} r="7"><title>{inside ? "当前输入覆盖示意" : "当前输入未覆盖示意"}</title></circle>;
          })}
        </g>
        <ellipse className={`v3-current-coverage coverage-${coverage}`} cx="310" cy="127" rx="100" ry="50" />
        <text className="v3-coverage-current-label" x="310" y="202">CURRENT TASK INPUTS · Xₙ</text>
      </svg>
      <figcaption>示意图表达覆盖关系，不是数据集的实测分布或遗忘数值。</figcaption>
    </figure>
    <div className="v3-coverage-explanation" aria-live="polite">
      <article><span>WHAT L_old CONSTRAINS</span><p>Teacher 与 Student 在当前 Xₙ 上的旧任务响应。</p><small>{state.observed}</small></article>
      <article><span>WHAT REMAINS UNCONSTRAINED</span><p>没有出现在当前 Xₙ 中的旧任务相关输入。</p><small>{state.boundary}</small></article>
    </div>
    <p className="v3-coverage-boundary-note"><strong>机制边界。</strong> 如果当前任务输入不能代表旧任务相关区域，匹配这些输入上的旧响应不等于在整个旧域保持行为。这里的 coverage 状态是教学解释，不是论文量化定律。</p>
  </div>;
}
