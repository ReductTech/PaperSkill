import { useEffect, useState } from "react";
import { FORGET_CURVES, FORGET_STEPS_MAX } from "../data/content";
import { usePrefersReducedMotion } from "../lib/hooks";

type Strategy = "vanilla" | "cotrain";

const W = 560, H = 300, PL = 46, PR = 16, PT = 18, PB = 40;

function toXY(step: number, val: number): [number, number] {
  const x = PL + (step / FORGET_STEPS_MAX) * (W - PL - PR);
  const y = PT + (1 - val / 100) * (H - PT - PB);
  return [x, y];
}

function pathOf(pts: [number, number][]): string {
  return pts.map(([s, v], i) => `${i === 0 ? "M" : "L"} ${toXY(s, v).join(" ")}`).join(" ");
}

function valueAt(pts: [number, number][], step: number): number {
  if (step <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [s1, v1] = pts[i];
    const [s2, v2] = pts[i + 1];
    if (step <= s2) return v1 + ((step - s1) / (s2 - s1)) * (v2 - v1);
  }
  return pts[pts.length - 1][1];
}

const VERDICTS = (s: Strategy, step: number): string => {
  if (s === "vanilla") {
    if (step < 8) return "刚开始：模型还会「看」（感知 60+），动作也在学。一切看似正常。";
    if (step < 18) return "警觉：感知能力开始崩塌 —— 全部梯度都在逼模型只关心动作，它正在「忘记」怎么看世界。";
    return "结局：感知跌到个位数（接近瞎猜），动作成功率也卡在 ~55%。只练动作，把预训练的看家本领练没了。";
  }
  if (step < 8) return "共训开局：每个优化步都混着做视觉问答，感知通路保持梯度流通。";
  if (step < 25) return "有波动，但感知被多模态数据「拴」住了 —— 不再崩塌。";
  return "结局：感知守住 ~71（原水平的 7 成以上），动作成功率反而更高（73.2%）。「不忘本」真的能双赢。";
};

export default function ForgettingLab() {
  const [strategy, setStrategy] = useState<Strategy>("vanilla");
  const [step, setStep] = useState(50);
  const [touched, setTouched] = useState(false);
  const reduced = usePrefersReducedMotion();
  const curves = FORGET_CURVES[strategy];
  const see = valueAt(curves.see, step);
  const act = valueAt(curves.act, step);
  const [cx] = toXY(step, 0);

  /* 无需点击：滑块自动从 0 走到 50K，两种练法轮流演示；用户一碰就接管 */
  useEffect(() => {
    if (touched || reduced) return;
    let s = 0;
    let strat: Strategy = "vanilla";
    let hold = 14; // 进场后稍停再起步
    setStep(0);
    setStrategy("vanilla");
    const t = setInterval(() => {
      if (hold > 0) { hold--; return; }
      s += 1;
      if (s > FORGET_STEPS_MAX) {
        strat = strat === "vanilla" ? "cotrain" : "vanilla";
        s = 0;
        hold = 16; // 到顶停留，让观众看清结局
        setStrategy(strat);
        setStep(0);
        return;
      }
      setStep(s);
    }, 95);
    return () => clearInterval(t);
  }, [touched, reduced]);

  return (
    <div className="forget-grid">
      <div className="panel" style={{ ["--kcolor" as string]: strategy === "vanilla" ? "var(--red)" : "var(--green)" }}>
        <div className="panel-title" style={{ ["--kcolor" as string]: strategy === "vanilla" ? "var(--red)" : "var(--green)", justifyContent: "space-between" }}>
          {touched ? "训练过程实况 · 手动控制" : "训练过程实况 · 自动播放中，拖滑块可接管"}
          <span className="sim-badge">曲线为趋势示意 · 锚点取自论文 Figure 4 / Table 8</span>
        </div>
        <div className="forget-chart">
          <svg viewBox={`0 0 ${W} ${H}`} className="forget-svg">
            {[0, 25, 50, 75, 100].map((v) => {
              const [, y] = toXY(0, v);
              return (
                <g key={v}>
                  <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--paper-deep)" strokeWidth={1.5} />
                  <text x={PL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--ink-faint)" fontWeight={700}>{v}</text>
                </g>
              );
            })}
            {[0, 10, 20, 30, 40, 50].map((s) => {
              const [x] = toXY(s, 0);
              return (
                <text key={s} x={x} y={H - 14} textAnchor="middle" fontSize={11} fill="var(--ink-faint)" fontWeight={700}>
                  {s}K
                </text>
              );
            })}
            {/* 感知曲线（蓝） */}
            <path d={pathOf(curves.see)} fill="none" stroke="var(--blue)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* 操作曲线（红） */}
            <path d={pathOf(curves.act)} fill="none" stroke="var(--red)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* 步数游标 */}
            <line x1={cx} y1={PT} x2={cx} y2={H - PB} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} />
            <circle cx={toXY(step, see)[0]} cy={toXY(step, see)[1]} r={6.5} fill="var(--blue)" stroke="#fff" strokeWidth={2.5} />
            <circle cx={toXY(step, act)[0]} cy={toXY(step, act)[1]} r={6.5} fill="var(--red)" stroke="#fff" strokeWidth={2.5} />
          </svg>
        </div>
        <input
          className="step-slider"
          type="range"
          min={0}
          max={FORGET_STEPS_MAX}
          step={1}
          value={step}
          onChange={(e) => { setTouched(true); setStep(Number(e.target.value)); }}
        />
        <div className="slider-scale"><span>0 步</span><span>训练步数（拖动我）</span><span>50K 步</span></div>
        <div className="forget-legend" style={{ marginTop: 10 }}>
          <span className="lg"><i style={{ background: "var(--blue)" }} /> 感知能力（RefCOCO-g IoU@0.5）</span>
          <span className="lg"><i style={{ background: "var(--red)" }} /> 操作成功率（WidowX）</span>
        </div>
      </div>

      <div className="forget-side">
        <div className="strategy-toggle">
          <button
            className={`strategy-btn ${strategy === "vanilla" ? "on" : ""}`}
            style={{ ["--sc" as string]: "var(--red)" }}
            onClick={() => { setTouched(true); setStrategy("vanilla"); }}
          >
            只练动作（Vanilla VLA）
            <small>机器人数据单加载器，动作损失一枝独秀</small>
          </button>
          <button
            className={`strategy-btn ${strategy === "cotrain" ? "on" : ""}`}
            style={{ ["--sc" as string]: "var(--green)" }}
            onClick={() => { setTouched(true); setStrategy("cotrain"); }}
          >
            多模态共训（StarVLA 支持）
            <small>双加载器：每个 step 混做动作 + 视觉问答</small>
          </button>
        </div>

        <div className="forget-readout">
          <div className="readout-row"><span>第 {step}K 步 · 感知</span><span className="val see">{see.toFixed(0)}</span></div>
          <div className="readout-row"><span>第 {step}K 步 · 操作</span><span className="val act">{act.toFixed(1)}%</span></div>
        </div>

        <div className="forget-verdict" style={{ ["--sc" as string]: strategy === "vanilla" ? "var(--red)" : "var(--green)" }}>
          {VERDICTS(strategy, step)}
        </div>
      </div>
    </div>
  );
}
