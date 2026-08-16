import { useState } from "react";
import { EFFICIENCY_ROWS, GENERALIST_ROWS, SCALING } from "../data/content";
import { useInView } from "../lib/hooks";
import Src from "../components/Src";

type Tab = "eff" | "gen" | "scale";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "eff", label: "亮点 1 · 更省的训练", sub: "LIBERO" },
  { id: "gen", label: "亮点 2 · 一个模型通吃", sub: "跨基准" },
  { id: "scale", label: "亮点 3 · 算力可扩展", sub: "8 → 256 GPU" },
];

const W = 560, H = 300, PL = 52, PR = 20, PT = 22, PB = 42;
const Y_MAX = 2900;

function EffChart() {
  return (
    <div className="chart-card">
      <h4>达到同等 LIBERO 成功率，各方法要训练多少步？</h4>
      <div className="sub">
        LIBERO 四套件平均成功率（%）· 横条 = 训练步数（√ 缩放）
        <Src where="论文 Table 2" cmp="同 LIBERO 基准；OpenVLA-OFT / GR00T-N1.5 为官方报告值" />
      </div>
      {EFFICIENCY_ROWS.map((r) => (
        <div key={r.who} className={`hbar-row ${r.ours ? "ours" : ""}`}>
          <div className="who">{r.who}<small>{r.sub}</small></div>
          <div className="hbar-track">
            <div
              className={`hbar-fill ${r.ours ? "" : "dim"}`}
              style={{ width: `${Math.sqrt(r.steps / 175) * 100}%`, ["--bc" as string]: r.ours ? "var(--red)" : undefined }}
            >
              {r.steps}K 步
            </div>
          </div>
          <div className="score">{r.score}<small>%</small></div>
        </div>
      ))}
      <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span className="callout"><span className="big">≈6×</span> 更少步数，打平第一梯队</span>
        <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
          四个 StarVLA 动作头全部只用 30K 步：FAST 95.4 · OFT 96.6 · π 95.7 · GR00T 96.5
        </span>
      </div>
    </div>
  );
}

function GenChart() {
  return (
    <div className="chart-card">
      <h4>专才（每个基准单练）vs 通才（一个模型联合训练）</h4>
      <div className="sub">
        成功率（%）· 通才 = 四个基准数据合并训出的单一模型
        <Src where="论文 Table 9" cmp="同一模型跨基准官方协议评测" />
        <Src where="论文正文 §7.2 写作 48.8，与 Table 9 的 53.8 不一致；本页采用表格值" kind="calc" cmp="RoboCasa 专才分数" />
      </div>
      <div className="pair-grid">
        {GENERALIST_ROWS.map((r) => {
          const d = r.gen - r.spec;
          return (
            <div key={r.name} className="pair-row">
              <div className="pname">{r.name}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="pair-bars" style={{ flex: 1 }}>
                  <div className="pbar spec">
                    <span className="pbl">专才</span>
                    <div className="pb-track"><div className="pb-fill" style={{ width: `${r.spec}%` }}>{r.spec}</div></div>
                  </div>
                  <div className="pbar gen">
                    <span className="pbl">通才</span>
                    <div className="pb-track"><div className="pb-fill" style={{ width: `${r.gen}%` }}>{r.gen}</div></div>
                  </div>
                </div>
                <span className={`pair-delta ${d > 0.3 ? "" : "neg"}`}>
                  {d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <span className="callout"><span className="big">+3.5</span> 最难的 RoboCasa-GR1，通才反超专才（53.8 → 57.3）</span>
      </div>
    </div>
  );
}

function ScaleChart() {
  const xAt = (i: number) => PL + (i / (SCALING.length - 1)) * (W - PL - PR);
  const yAt = (v: number) => PT + (1 - v / Y_MAX) * (H - PT - PB);
  const actual = SCALING.map((s, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(s.sps)}`).join(" ");
  const ideal = SCALING.map((s, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(87 * Math.pow(2, i))}`).join(" ");
  return (
    <div className="chart-card">
      <h4>8 → 256 张 A100：吞吐量如何扩展？</h4>
      <div className="sub">
        样本吞吐（samples/s）· 虚线 = 理想线性扩展
        <Src where="论文 Table 11（StarVLA-GR00T + Qwen3-VL-4B，per-GPU batch=8）" cmp="A100 80GB 集群实测" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="line-svg">
        {[0, 700, 1400, 2100, 2800].map((v) => (
          <g key={v}>
            <line className="grid" x1={PL} y1={yAt(v)} x2={W - PR} y2={yAt(v)} />
            <text className="lbl" x={PL - 8} y={yAt(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {SCALING.map((s, i) => (
          <text key={s.gpus} className="lbl" x={xAt(i)} y={H - 16} textAnchor="middle">{s.gpus}</text>
        ))}
        <path className="ideal" d={ideal} />
        <path className="actual draw" d={actual} />
        {SCALING.map((s, i) => (
          <g key={s.gpus}>
            <circle className="pt" cx={xAt(i)} cy={yAt(s.sps)} r={4.5} />
            <text className="lbl" x={xAt(i)} y={yAt(s.sps) - 10} textAnchor="middle" fill="var(--green-deep)">{s.sps}</text>
          </g>
        ))}
      </svg>
      <div className="legend-row" style={{ marginTop: 6 }}>
        <span className="lg"><i style={{ background: "var(--green)" }} /> 实测吞吐</span>
        <span className="lg"><i style={{ background: "#b9b2a2" }} /> 理想线性</span>
        <span style={{ marginLeft: "auto", fontWeight: 800, color: "var(--green-deep)" }}>64 卡后效率稳定在 79–80%</span>
      </div>
    </div>
  );
}

export default function ResultsLab() {
  const [tab, setTab] = useState<Tab>("eff");
  const { ref, inView } = useInView<HTMLDivElement>(0.25);

  return (
    <div style={{ display: "grid", gap: 18 }} ref={ref}>
      <div className="results-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`chip ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* 进入视口才挂载，让条形/折线动画在评委眼前发生 */}
      {inView && (
        <div key={tab}>
          {tab === "eff" && <EffChart />}
          {tab === "gen" && <GenChart />}
          {tab === "scale" && <ScaleChart />}
        </div>
      )}
      {!inView && <div style={{ minHeight: 320 }} />}
    </div>
  );
}
