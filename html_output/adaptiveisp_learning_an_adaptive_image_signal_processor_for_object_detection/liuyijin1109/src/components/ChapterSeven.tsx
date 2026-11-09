import { useRef, useState } from "react";
import { Panel, type Done } from "./Shared";
import "./ChapterSeven.css";
import { Formula } from "./Formula";
import { costFormula } from "./formulaDefinitions";

// NeurIPS 2024 AdaptiveISP, LOD, Table 5. Values are mAP percentages.
const stages = [
  [69.6, 49.8, 45.7],
  [70.9, 51.1, 46.6],
  [71.3, 50.7, 46.9],
  [71.4, 51.6, 47.1],
  [71.4, 51.7, 47.1],
] as const;
const metrics = ["mAP@0.5", "mAP@0.75", "mAP@0.5:0.95"] as const;

// NeurIPS 2024 AdaptiveISP, LOD, Table 4. Frequencies are test-set occurrence rates.
const costRuns = [
  { lambda: "0", map: [71.4, 51.7, 47.1], time: 14.73, usage: [100, 100, 0, 22.5] },
  { lambda: "0.005", map: [71.1, 51.5, 47.0], time: 14.30, usage: [100, 59.75, 4.75, 96.5] },
  { lambda: "0.01", map: [71.0, 51.6, 47.0], time: 11.54, usage: [42.5, 42.75, 57.5, 100] },
  { lambda: "0.05", map: [70.0, 49.9, 46.0], time: 9.26, usage: [0, 0, 100, 100] },
  { lambda: "0.1", map: [69.9, 50.1, 45.9], time: 9.20, usage: [0, 0, 100, 100] },
] as const;
const moduleRows = [
  { name: "Sharpen/Blur · 锐化/模糊", ms: 6.3 },
  { name: "Tone Mapping · 色调映射", ms: 2.7 },
  { name: "Exposure · 曝光", ms: 1.7 },
  { name: "White Balance · 白平衡", ms: 1.7 },
] as const;

function StageLab({ onDone }: Done) {
  const [step, setStep] = useState(2);
  const [metric, setMetric] = useState(0);
  const values = stages.map((row) => row[metric]);
  const low = Math.floor(Math.min(...values) - 0.2);
  const high = Math.ceil(Math.max(...values) + 0.2);
  const x = (i: number) => 70 + i * 105;
  const y = (v: number) => 202 - ((v - low) / (high - low)) * 150;
  const current = values[step - 1];
  const previous = step > 1 ? current - values[step - 2] : 0;
  const fromFirst = current - values[0];
  const explanation = step === 1
    ? "第一步提供比较起点；接下来可观察每增加一步带来的变化。"
    : metric === 1 && step === 3
      ? "第三步的 mAP@0.75 比第二步低 0.4 个百分点，阶段增加并不保证每项指标单调上升。"
      : step === 5 && metric !== 1
        ? "第四步与第五步在这一指标上持平；继续处理没有增加表中报告的检测收益。"
        : step === 2
          ? "第二步已带来明显收益；后续阶段的边际变化需要逐项查看。"
          : step >= 4
            ? "到后段收益趋缓；是否继续处理应结合当前指标判断。"
            : "第三步仍有变化，但各指标的方向和幅度并不相同。";

  return <Panel title="处理几步才够？" kind="论文报告">
    <div className="s7-lab">
      <p className="s7-question">执行更多 ISP 阶段，目标检测效果是否一定更好？选一个阶段，再切换评价指标。</p>
      <div className="s7-stage-control">
        <label htmlFor="s7-stage-range">执行阶段数 <strong>{step} / 5</strong></label>
        <input id="s7-stage-range" type="range" min="1" max="5" step="1" value={step}
          onChange={(event) => { setStep(Number(event.target.value)); onDone(); }}
          aria-valuetext={`${step} 个 ISP 处理阶段`} />
        <div className="s7-stage-nodes" aria-hidden="true">{stages.map((_, i) => <span key={i} className={i + 1 === step ? "active" : ""}>{i + 1}</span>)}</div>
      </div>
      <div className="s7-metric-tabs" role="group" aria-label="选择检测指标">
        {metrics.map((name, i) => <button type="button" key={name} aria-pressed={metric === i}
          className={metric === i ? "active" : ""} onClick={() => { setMetric(i); onDone(); }}>{name}</button>)}
      </div>
      <div className="s7-stage-output">
        <div className="s7-chart-wrap">
          <svg viewBox="0 0 540 255" role="img" aria-label={`${metrics[metric]} 随阶段数变化：${values.map((value, i) => `${i + 1} 步 ${value.toFixed(1)}`).join('，')}；当前 ${step} 步`}>
            {[low, (low + high) / 2, high].map((tick) => <g key={tick}>
              <line x1="56" x2="506" y1={y(tick)} y2={y(tick)} className="s7-grid" />
              <text x="48" y={y(tick) + 4} textAnchor="end">{tick.toFixed(1)}</text>
            </g>)}
            <line x1="56" x2="506" y1="202" y2="202" className="s7-axis" />
            <polyline points={values.map((value, i) => `${x(i)},${y(value)}`).join(' ')} className="s7-line" />
            {values.map((value, i) => <g key={i}>
              <circle cx={x(i)} cy={y(value)} r={i + 1 === step ? 9 : 5} className={i + 1 === step ? "s7-point active" : "s7-point"} />
              <text x={x(i)} y="223" textAnchor="middle">{i + 1}</text>
            </g>)}
            <text x="56" y="20">{metrics[metric]}（%）↑</text>
            <text x="506" y="250" textAnchor="end">ISP 阶段数 →</text>
          </svg>
          <p className="s7-axis-note">纵轴显示当前指标的实际刻度；每个点均为 Table 5 实测值。</p>
        </div>
        <div className="s7-readout" aria-live="polite">
          <span>第 {step} 步 · {metrics[metric]}</span>
          <strong>{current.toFixed(1)}<small>%</small></strong>
          <p>较前一步 <b>{step === 1 ? "—" : `${previous > 0 ? "+" : ""}${previous.toFixed(1)} 个百分点`}</b></p>
          <p>较第一步 <b>{step === 1 ? "基线" : `+${fromFirst.toFixed(1)} 个百分点`}</b></p>
        </div>
      </div>
      <p className="s7-finding" aria-live="polite">{explanation}</p>
    </div>
  </Panel>;
}

function CostExperiment({ onDone }: Done) {
  const [active, setActive] = useState(2);
  const run = costRuns[active];
  const baseline = costRuns[0];
  const timeReduction = (1 - run.time / baseline.time) * 100;
  const mapDrop = baseline.map[0] - run.map[0];
  const sx = (time: number) => 60 + ((time - 9) / 6) * 420;
  const sy = (map: number) => 208 - ((map - 69) / 3) * 168;

  return <Panel title="速度值不值得？" kind="论文报告">
    <div className="s7-lab">
      <p className="s7-question">当优化更重视速度，ISP 的模块选择与检测结果怎样变化？切换论文实际测试的五个成本权重。</p>
      <div className="s7-cost-options" role="group" aria-label="选择计算成本权重">
        {costRuns.map((item, i) => <button type="button" key={item.lambda} className={active === i ? "active" : ""}
          aria-pressed={active === i} onClick={() => { setActive(i); onDone(); }}>λc = {item.lambda}</button>)}
      </div>
      <div className="s7-cost-output">
        <div className="s7-chart-wrap">
          <svg viewBox="0 0 520 265" role="img" aria-label={`Table 4 平均 ISP 时间与 mAP@0.5 的五个实测点；当前 λc=${run.lambda}，${run.time.toFixed(2)} 毫秒，${run.map[0].toFixed(1)}%`}>
            {[69, 70, 71, 72].map((tick) => <g key={tick}>
              <line x1="60" x2="480" y1={sy(tick)} y2={sy(tick)} className="s7-grid" />
              <text x="52" y={sy(tick) + 4} textAnchor="end">{tick}</text>
            </g>)}
            {[9, 11, 13, 15].map((tick) => <g key={tick}>
              <line x1={sx(tick)} x2={sx(tick)} y1="40" y2="208" className="s7-grid" />
              <text x={sx(tick)} y="228" textAnchor="middle">{tick}</text>
            </g>)}
            <line x1="60" x2="480" y1="208" y2="208" className="s7-axis" />
            {costRuns.map((point, i) => <circle key={point.lambda} cx={sx(point.time)} cy={sy(point.map[0])}
              r={active === i ? 9 : 5} className={active === i ? "s7-point active" : "s7-point"} />)}
            <text x="60" y="22">mAP@0.5（%）↑</text>
            <text x="480" y="258" textAnchor="end">平均 ISP 时间（ms）→</text>
          </svg>
          <p className="s7-axis-note">每个点对应一组单独报告的 λc 设置；纵轴为实际 mAP 刻度。</p>
        </div>
        <div className="s7-readout" aria-live="polite">
          <span>当前设置 · λc = {run.lambda}</span>
          <strong>{run.map[0].toFixed(1)}<small>% mAP@0.5</small></strong>
          <p>mAP@0.75 <b>{run.map[1].toFixed(1)}</b> · mAP@0.5:0.95 <b>{run.map[2].toFixed(1)}</b></p>
          <p>平均 ISP 时间 <b>{run.time.toFixed(2)} ms</b></p>
        </div>
      </div>
      <p className="s7-finding" aria-live="polite">相对 λc = 0：平均 ISP 时间{active === 0 ? "为基线" : `从 14.73 ms 降至 ${run.time.toFixed(2)} ms（降低 ${timeReduction.toFixed(1)}%）`}；mAP@0.5 {active === 0 ? "为基线" : `降低 ${mapDrop.toFixed(1)} 个百分点`}。</p>
      <div className="s7-frequency">
        <h5>测试集模块出现频率 <small>不是单次推理的 Softmax 概率</small></h5>
        {moduleRows.map((module, i) => <div className="s7-frequency-row" key={module.name}>
          <span>{module.name}<small>{module.ms.toFixed(1)} ms / 次</small></span>
          <div className="s7-frequency-track"><i style={{ width: `${run.usage[i]}%` }} /></div>
          <b>{run.usage[i]}%</b>
        </div>)}
      </div>
      <p className="s7-context">λc 从 0 提高到 0.01 时，Sharpen/Blur 与 Tone Mapping 的出现频率分别从 100% 降至 42.5% 和 42.75%；Exposure 从 0% 增至 57.5%。这些是不同成本权重下的实验策略，不能把档位当作无需重新优化的连续旋钮。</p>
      <div className="s7-formula"><Formula formula={costFormula} label="ISP 模块计算成本惩罚" /><p>成本惩罚随选中模块的计算时间累积。Table 4 报告平均 ISP 时间，并非完整检测系统延迟。</p></div>
    </div>
  </Panel>;
}

export function ChapterSeven({ onDone }: Done) {
  const explored = useRef({ stages: false, costs: false });
  const mark = (part: "stages" | "costs") => {
    explored.current[part] = true;
    if (explored.current.stages && explored.current.costs) onDone();
  };
  return <><StageLab onDone={() => mark("stages")} /><CostExperiment onDone={() => mark("costs")} /></>;
}
