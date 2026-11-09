import { useEffect, useState } from "react";
import { Panel, type Done } from "./Shared";
import "./ChapterEleven.css";

const contributions = [
  {
    name: "动态决策",
    heading: "同一套模块池，逐图决定路径",
    explanation: "Policy 读取当前图像，在每个阶段选择 ISP 模块并预测参数；输入改变，路线也可改变。此前一些方法只调固定流水线的参数，或搜索完结构后在推理时固定使用。",
    note: "低光噪声与较亮色偏是论文分析过的两类偏好；下方路线是教学示意，不是实际 Policy 输出。",
  },
  {
    name: "检测导向",
    heading: "让下游任务决定什么是好处理",
    explanation: "训练时，预训练检测器的误差变化为强化学习提供反馈，策略因此学习有利于检测的处理。视觉上更讨喜的颜色并不自动意味着检测效果更好；推理时不需要逐张重新训练检测器。",
    note: "框线与反馈箭头说明优化目标，不代表这张示意图的实测检测结果。",
  },
  {
    name: "计算成本",
    heading: "把模块耗时纳入选择",
    explanation: "作者给不同模块的运行时间加上成本惩罚，使策略在检测指标与 ISP 时间间取舍。此前也有方法考虑计算预算；本文的特点是把逐图决策和成本权重结合起来。",
    note: "",
  },
] as const;

function ContributionScene() {
  const [active, setActive] = useState(0);
  const [frame, setFrame] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (active < 2) { setActive(active + 1); setFrame(0); }
      else setAuto(false);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [active, auto]);
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame(v => v + 1), 1700);
    return () => window.clearInterval(timer);
  }, [auto]);
  const variant = frame % 2;
  const choose = (i: number) => { setAuto(false); setActive(i); setFrame(0); };
  return <Panel title="AdaptiveISP 带来了什么？" kind="教学示意">
    <p className="s11-lead">沿着同一条“图像 → Policy → ISP → Detector”链，看三项创新分别改变了什么。首次进入会自动演示一轮，也可随时选择。</p>
    <div className="s11-switch" role="group" aria-label="观察一项核心贡献">
      {contributions.map((item, i) => <button type="button" key={item.name} className={active === i ? "active" : ""} aria-pressed={active === i} onClick={() => choose(i)}><span>0{i + 1}</span>{item.name}</button>)}
    </div>
    <div className={`s11-stage s11-stage-${active}`} aria-label={`${contributions[active].name}交互示意`}>
      <div className="s11-flow">
        <div className="s11-flow-node s11-input"><small>当前图像</small><div className={`s11-scene ${active === 0 && variant ? "bright" : "dim"}`} aria-hidden="true"><i className="s11-sun" /><i className="s11-road" /><i className="s11-car" /><i className="s11-noise" /></div><strong>{active === 0 ? (variant ? "较亮 · 色偏" : "低光 · 噪声") : "当前输入"}</strong></div>
        <span className="s11-link" aria-hidden="true">→</span>
        <div className="s11-flow-node s11-policy"><small>Policy</small><div className="s11-policy-orbit"><i /><i /><i /></div><strong>{active === 0 ? "随图像调整" : active === 1 ? "接受任务反馈" : "比较处理成本"}</strong></div>
        <span className="s11-link" aria-hidden="true">→</span>
        <div className="s11-flow-node s11-isp"><small>ISP</small><div className="s11-module-track">
          {(active === 0 ? (variant ? ["CCM", "白平衡"] : ["去饱和", "色调映射"]) : active === 2 ? (variant ? ["曝光", "白平衡"] : ["CCM", "色调映射"]) : ["模块", "参数"]).map((x, i) => <span key={`${active}-${variant}-${x}`} style={{ animationDelay: `${i * 130}ms` }}>{x}</span>)}
        </div><strong>{active === 2 ? (variant ? "成本权重 ↑" : "成本权重 0") : "结构 + 参数"}</strong></div>
        <span className="s11-link" aria-hidden="true">→</span>
        <div className="s11-flow-node s11-detector"><small>Detector</small><div className="s11-detection" aria-hidden="true"><i /><i /></div><strong>{active === 1 ? "检测误差反馈" : "检测任务"}</strong></div>
      </div>
      {active === 1 && <div className="s11-feedback"><span>人眼观感 ≠ 检测目标</span><b>检测误差 → 训练反馈 → Policy</b></div>}
      {active === 2 && <div className="s11-cost-shift"><span>示意：选择偏好随成本权重改变</span><div><i className={variant ? "short" : ""} /><em>较慢模块</em><i className={variant ? "long" : ""} /><em>较快模块</em></div></div>}
      {active === 0 && <div className="s11-scenario-control" role="group" aria-label="切换输入场景"><button type="button" className={!variant ? "active" : ""} aria-pressed={!variant} onClick={() => {setAuto(false); setFrame(0);}}>低光噪声</button><button type="button" className={variant ? "active" : ""} aria-pressed={!!variant} onClick={() => {setAuto(false); setFrame(1);}}>较亮色偏</button></div>}
      {active === 2 && <div className="s11-scenario-control" role="group" aria-label="切换成本偏好"><button type="button" className={!variant ? "active" : ""} aria-pressed={!variant} onClick={() => {setAuto(false); setFrame(0);}}>准确率导向</button><button type="button" className={variant ? "active" : ""} aria-pressed={!!variant} onClick={() => {setAuto(false); setFrame(1);}}>效率导向</button></div>}
    </div>
    <div className="s11-explain" aria-live="polite"><strong>{contributions[active].heading}</strong><p>{contributions[active].explanation}</p>{contributions[active].note && <small>{contributions[active].note}</small>}</div>
    <div className="s11-evidence-strip" aria-label="论文中的两组代表性证据"><div><span>LOD · mAP@0.5 · Table 1</span><strong>71.4 <em>vs</em> 70.1</strong><small>AdaptiveISP / Hyperparameter Optimization</small></div><div><span>LOD · Table 4 · λc 0 → 0.01</span><strong>14.73 <em>→</em> 11.54 ms</strong><small>平均 ISP 时间约 −21.7%；mAP@0.5 为 71.4 → 71.0（−0.4 个百分点）</small></div></div>
  </Panel>;
}

const boundaries = [
  { name: "不可微 ISP", type: "作者明确指出", reason: "当前实现依赖可微 ISP 模块，让参数优化的梯度穿过处理链。黑盒模块会中断这条普通梯度路径。", future: "探索适用于不可微 ISP 的优化策略。作者在 Conclusion 明确提出这一方向；这不意味着强化学习整体不能处理不可微操作。" },
  { name: "RAW 域扩展", type: "方法范围", reason: "论文假设 RAW 数据先经静态基础处理成为 Linear RGB，自适应选择主要放在后续 RGB 域。", future: "研究把可调范围前移到 RAW 基础处理，同时处理传感器差异；论文尚未完成完整 RAW 域自适应。" },
  { name: "泛化范围", type: "实验范围", reason: "已有 LOD、OnePlus、synthetic raw COCO，以及不同检测器和分割任务的测试；覆盖仍有限，部分指标优势也较小。", future: "继续检验更多传感器、复杂环境和视觉任务，并分别报告各指标。" },
  { name: "实际部署", type: "进一步研究问题", reason: "论文报告策略预测、ISP 模块成本和准确率—速度权衡；单个模块耗时不能代替新平台的端到端表现。", future: "在目标硬件 ISP 上评估兼容性、端到端延迟、资源需求和真实传感器条件。这是待验证问题，不是论文报告的部署失败。" },
] as const;

function BoundaryVisual({ active }: { active: number }) {
  if (active === 0) return <div className="s11-visual s11-gradient"><span>检测误差</span><i className="s11-pulse" /><span>可微 ISP</span><i className="s11-pulse" /><span>参数</span><div className="s11-break"><b>切换为黑盒模块</b><i />普通梯度路径中断</div></div>;
  if (active === 1) return <div className="s11-visual s11-domains"><span>RAW 传感器数据<small>静态基础处理</small></span><i>→</i><span>Linear RGB</span><i>→</i><span className="highlight">AdaptiveISP<small>当前自适应范围</small></span><div>研究延伸 <b>← 向 RAW 域扩展？</b></div></div>;
  if (active === 2) return <div className="s11-visual s11-coverage"><div className="evaluated"><span>LOD</span><span>OnePlus</span><span>synthetic raw COCO</span><span>YOLOX / DDQ</span><span>图像分割</span></div><div className="unknown"><span>更多相机</span><span>更多环境</span><span>更多任务</span></div><small>实线：论文已评估 · 虚线：待进一步验证</small></div>;
  return <div className="s11-visual s11-deploy"><div><span>Policy</span><i>→</i><span>ISP</span><i>→</i><span>Detector</span></div><div className="s11-deploy-bracket">端到端延迟 · 兼容性 · 资源 · 传感器条件 <b>仍需目标平台评估</b></div></div>;
}

function BoundaryScene({ onDone }: Done) {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const select = (i: number) => {
    setActive(i);
    if (!seen.includes(i)) {
      const next = [...seen, i]; setSeen(next);
      if (next.length === boundaries.length) onDone();
    }
  };
  return <Panel title="还有哪些问题？" kind="教学示意">
    <p className="s11-lead">切换四种边界，先辨认它属于作者明确指出、方法与实验范围，还是由现有证据提出的研究问题。</p>
    <div className="s11-switch s11-boundary-switch" role="group" aria-label="查看研究边界">{boundaries.map((item, i) => <button type="button" key={item.name} className={active === i ? "active" : ""} aria-pressed={active === i} onClick={() => select(i)}><span>0{i + 1}</span>{item.name}</button>)}</div>
    <div key={active} className="s11-boundary-canvas" aria-label={`${boundaries[active].name}示意`}><BoundaryVisual active={active} /></div>
    <div className="s11-boundary-copy" aria-live="polite"><div><span>{boundaries[active].type}</span><h5>{boundaries[active].name}</h5></div><p><b>限制原因：</b>{boundaries[active].reason}</p><p><b>下一步：</b>{boundaries[active].future}</p></div>
    <p className="s11-progress-note">已查看 {seen.length} / 4 项边界。{seen.length === 4 ? "本章学习条件已满足。" : "查看全部四项后完成本章。"}</p>
  </Panel>;
}

export function ChapterEleven({ onDone }: Done) {
  return <div className="s11-chapter"><ContributionScene /><BoundaryScene onDone={onDone} /></div>;
}
