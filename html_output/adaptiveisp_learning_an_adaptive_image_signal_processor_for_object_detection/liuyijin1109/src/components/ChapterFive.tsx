import { useEffect, useRef, useState } from "react";
import { Panel, type Done } from "./Shared";
import { Scene } from "./Labs";
import "./ChapterFive.css";
import { Formula } from "./Formula";
import { rewardFormula, valueFormula } from "./formulaDefinitions";

const trainingBeats = [
  { title: "Actor 观察状态", detail: "Policy Network 读取当前图像，选择 ISP 模块并预测该模块的连续参数。", focus: "actor" },
  { title: "ISP 产生新图像", detail: "选定模块执行处理，图像从 sₜ 变为 sₜ₊₁。", focus: "isp" },
  { title: "Detector 给出检测误差", detail: "冻结的 YOLO-v3 对处理前后图像计算任务误差；训练标签只供检测损失使用。", focus: "detector" },
  { title: "奖励与长期价值", detail: "误差下降形成即时奖励；Critic 估计状态的未来累计回报。", focus: "critic" },
  { title: "更新可训练网络", detail: "训练反馈更新 Actor 的策略与参数预测分支，以及 Critic 的价值估计。YOLO-v3 权重保持冻结。", focus: "update" },
  { title: "进入下一轮决策", detail: "新状态再次交给 Actor。多次训练后，策略逐渐学会选择对检测有益的操作。", focus: "return" },
] as const;

function useTimeline(length: number, delay: number, loop: boolean, onFinish?: () => void) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const finished = useRef(false);
  useEffect(() => {
    const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);
    if (isReduced) { setPlaying(false); setStep(length - 1); }
  }, [length]);
  useEffect(() => {
    if (step === length - 1 && !finished.current) { finished.current = true; onFinish?.(); }
  }, [step, length, onFinish]);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setTimeout(() => {
      setStep((current) => current === length - 1 ? (loop ? 0 : current) : current + 1);
      if (!loop && step === length - 1) setPlaying(false);
    }, step === 0 ? 1050 : delay);
    return () => clearTimeout(timer);
  }, [step, playing, reduced, length, delay, loop]);
  const jump = (next: number) => { setPlaying(false); setStep(Math.max(0, Math.min(length - 1, next))); };
  const replay = () => { setStep(0); setPlaying(!reduced); };
  const toggle = () => { if (reduced) { setStep((current) => current === length - 1 ? 0 : current + 1); return; } if (step === length - 1 && !loop) { replay(); return; } setPlaying((value) => !value); };
  return { step, playing, reduced, jump, replay, toggle };
}

function TimelineControls({ timeline, count, label }: {
  timeline: ReturnType<typeof useTimeline>; count: number; label: string;
}) {
  return <div className="s5-controls" role="group" aria-label={label}>
    <button type="button" onClick={() => timeline.jump(timeline.step - 1)} disabled={timeline.step === 0}>← 上一步</button>
    <button type="button" className="primary" onClick={timeline.toggle}>{timeline.reduced ? timeline.step === count - 1 ? "从头观看" : "下一阶段" : timeline.playing ? "暂停" : timeline.step === count - 1 ? "重新播放" : "继续播放"}</button>
    <button type="button" onClick={() => timeline.jump(timeline.step + 1)} disabled={timeline.step === count - 1}>下一步 →</button>
    <button type="button" onClick={timeline.replay}>↺ 重播</button>
  </div>;
}

function DetectionBoxes({ outcome }: { outcome: "before" | "good" | "bad" }) {
  const offset = outcome === "good" ? [3, 2] : outcome === "bad" ? [25, -15] : [12, -8];
  return <svg className="s5-boxes" viewBox="0 0 560 300" aria-hidden="true">
    <rect className="truth" x="326" y="122" width="132" height="133" rx="3" />
    <rect className="truth" x="74" y="139" width="170" height="87" rx="3" />
    <rect className="prediction" x={326 + offset[0]} y={122 + offset[1]} width={outcome === "bad" ? 105 : 130} height={outcome === "bad" ? 103 : 131} rx="3" />
    <rect className="prediction" x={74 + offset[0] / 2} y={139 + offset[1] / 2} width={outcome === "bad" ? 153 : 168} height={outcome === "bad" ? 79 : 86} rx="3" />
  </svg>;
}

function DetectionFeedback({ onDone }: Done) {
  const [good, setGood] = useState(true);
  const after = good ? .5 : 1;
  const reward = .8 - after;
  const outcome = good ? "good" : "bad";
  return <Panel title="检测反馈：这一步真的有帮助吗？">
    <p className="s5-lead">同一幅街景，改变一次 ISP 操作，比较目标检测误差。绿色实线是示意目标框，橙色虚线是示意预测框。</p>
    <div className="s5-choice" role="group" aria-label="选择处理效果">
      <button className={good ? "chosen" : ""} aria-pressed={good} onClick={() => { setGood(true); onDone(); }}>处理有益 · 提亮暗部</button>
      <button className={!good ? "chosen" : ""} aria-pressed={!good} onClick={() => { setGood(false); onDone(); }}>处理有害 · 模糊细节</button>
    </div>
    <div className="s5-image-flow">
      <figure className="s5-image-frame"><figcaption>当前图像 · sₜ</figcaption><div className="s5-image"><Scene scene={0} label="处理前的低光街景教学图像" /><DetectionBoxes outcome="before" /></div><small>检测误差 D(sₜ) = 0.80</small></figure>
      <div className="s5-image-action" aria-live="polite"><span>ISP 操作</span><strong>{good ? "提亮暗部" : "强模糊"}</strong><b aria-hidden="true">→</b></div>
      <figure className="s5-image-frame" key={outcome}><figcaption>处理后 · sₜ₊₁</figcaption><div className={`s5-image ${good ? "s5-bright" : "s5-blurred"}`}><Scene scene={0} label={good ? "提亮后的街景教学图像" : "模糊后的街景教学图像"} /><DetectionBoxes outcome={outcome} /></div><small>检测误差 D(sₜ₊₁) = {after.toFixed(2)}</small></figure>
    </div>
    <div className="s5-feedback" aria-live="polite"><span className="s5-example">示例数值</span><span>0.80 − {after.toFixed(2)} = <strong className={good ? "positive" : "negative"}>{reward > 0 ? "+" : ""}{reward.toFixed(2)}</strong></span><span>{good ? "误差下降 → 正奖励" : "小目标细节变弱、定位偏差增大 → 负奖励"}</span></div>
    <Formula formula={rewardFormula} label="检测误差与步骤奖励" />
    <p className="s5-note">这些框与数值用于解释奖励方向，不代表 YOLO-v3 的实际预测。检测器提供任务反馈：图像是否帮助找到目标，而非是否更好看。</p>
  </Panel>;
}

function LongTermValue() {
  const [gamma, setGamma] = useState(.8);
  const routes = [
    { name: "路线 A", rewards: [.4, .05, .05] },
    { name: "路线 B", rewards: [.1, .35, .3] },
  ];
  const totals = routes.map((route) => route.rewards.reduce((sum, reward, i) => sum + reward * gamma ** i, 0));
  return <div className="s5-value-lab">
    <div className="s5-value-heading"><div><strong>只看第一步，会选错吗？</strong><span>两条假设路线，观察折扣累计奖励</span></div><label>γ = {gamma.toFixed(1)}<input type="range" min="0" max="1" step="0.1" value={gamma} onChange={(event) => setGamma(Number(event.target.value))} /></label></div>
    <div className="s5-routes">{routes.map((route, i) => <div className={`s5-route ${totals[i] === Math.max(...totals) ? "best" : ""}`} key={route.name}><b>{route.name}</b><div className="s5-reward-steps">{route.rewards.map((reward, j) => <span key={j}><small>{j === 0 ? "当前" : `后续 ${j}`}</small><strong>+{reward.toFixed(2)}</strong></span>)}</div><div className="s5-route-total">折扣累计 <strong>{totals[i].toFixed(3)}</strong></div></div>)}</div>
    <Formula formula={valueFormula} label="累计奖励与状态价值" />
    <p className="s5-note">路线 A 第一步收益更高；γ = {gamma.toFixed(1)} 时，{totals[0] >= totals[1] ? "路线 A" : "路线 B"} 的累计收益更高。Critic 学的是状态的未来累计价值。</p>
  </div>;
}

function ActorCritic({ onDone }: Done) {
  const timeline = useTimeline(trainingBeats.length, 1750, true, onDone);
  const beat = trainingBeats[timeline.step];
  return <Panel title="Actor–Critic：一次训练反馈怎样流动？">
    <p className="s5-lead">Actor 产生动作，ISP 改变图像，Detector 提供任务误差，Critic 估计长期价值；训练信号回到可训练网络。</p>
    <div className="s5-stage-strip" aria-label={`训练循环阶段 ${timeline.step + 1} / 6`}>{trainingBeats.map((phase, i) => <span key={phase.title} className={i === timeline.step ? "active" : i < timeline.step ? "done" : ""} />)}</div>
    <div className="s5-cycle" data-focus={beat.focus}>
      <div className="s5-cycle-image"><Scene scene={0} label="训练中的低光道路状态" /><span>{timeline.step >= 2 ? "新状态 sₜ₊₁" : "当前状态 sₜ"}</span></div>
      <div className="s5-cycle-main">
        <div className="s5-cycle-node actor"><small>① 决策</small><strong>Policy Network</strong><span>Actor · 模块选择 + 参数预测</span></div>
        <div className="s5-cycle-arrow" aria-hidden="true">↓ 动作 aₜ</div>
        <div className="s5-cycle-node isp"><small>② 执行</small><strong>ISP 模块</strong><span>产生处理后的图像</span></div>
        <div className="s5-cycle-arrow" aria-hidden="true">↓ sₜ 与 sₜ₊₁</div>
        <div className="s5-cycle-node detector"><small>③ 检测任务</small><strong>🔒 YOLO-v3</strong><span>冻结权重 · 计算检测误差</span></div>
      </div>
      <div className="s5-cycle-side">
        <div className="s5-cycle-node reward"><small>④ 即时反馈</small><strong>Reward</strong><span>D(sₜ) − D(sₜ₊₁) − Pₜ</span></div>
        <div className="s5-cycle-arrow" aria-hidden="true">↓ 训练反馈</div>
        <div className="s5-cycle-node critic"><small>④ 长期价值</small><strong>Value Network</strong><span>Critic · 估计 Vπ(s)</span></div>
        <div className="s5-cycle-arrow" aria-hidden="true">↓</div>
        <div className="s5-cycle-node update"><small>⑤ 学习</small><strong>更新 Actor + Critic</strong><span>Detector 权重不更新</span></div>
        <div className="s5-cycle-arrow return" aria-hidden="true">↶ ⑥ 新一轮状态与决策</div>
      </div>
    </div>
    <div className="s5-beat" aria-live="polite"><b>{timeline.step + 1} / 6 · {beat.title}</b><span>{beat.detail}</span></div>
    <TimelineControls timeline={timeline} count={trainingBeats.length} label="Actor–Critic 动画控制" />
    <LongTermValue />
  </Panel>;
}

const gradientBeats = [
  { title: "前向：参数预测", detail: "Actor 的连续参数分支给选定 ISP 模块提供参数。", focus: "parameter", direction: "forward" },
  { title: "前向：可微 ISP", detail: "ISP 用预测参数处理图像，形成检测输入。", focus: "isp", direction: "forward" },
  { title: "前向：冻结 Detector", detail: "YOLO-v3 权重固定，仍计算处理后图像的检测损失。", focus: "detector", direction: "forward" },
  { title: "前向：Detection Loss", detail: "检测损失衡量当前处理对目标检测任务的影响。", focus: "loss", direction: "forward" },
  { title: "反向：经过 Detector", detail: "冻结的是权重更新；损失仍可对 Detector 的输入求梯度。", focus: "detector", direction: "backward" },
  { title: "反向：经过可微 ISP", detail: "梯度沿可微图像处理操作继续传递。", focus: "isp", direction: "backward" },
  { title: "反向：更新连续参数分支", detail: "检测梯度到达连续参数预测分支。离散模块选择由强化学习信号优化。", focus: "parameter", direction: "backward" },
] as const;

function Differentiable({ onDone }: Done) {
  const timeline = useTimeline(gradientBeats.length, 1600, false, onDone);
  const beat = gradientBeats[timeline.step];
  return <Panel title="可微优化：冻结权重，梯度仍能经过">
    <p className="s5-lead">看蓝色前向数据流，再看绿色反向梯度流。YOLO-v3 作为固定的检测任务评价器。</p>
    <div className="s5-gradient" data-focus={beat.focus} data-direction={beat.direction}>
      <div className="s5-flow-label forward">前向 · 图像与参数 →</div>
      <div className="s5-gradient-row">
        <div className="s5-gradient-node parameter"><small>Actor 连续分支</small><strong>参数预测 θ</strong><em>可训练</em></div><span className="s5-gradient-link" aria-hidden="true">→</span>
        <div className="s5-gradient-node isp"><small>处理图像</small><strong>可微 ISP</strong><em>可传梯度</em></div><span className="s5-gradient-link" aria-hidden="true">→</span>
        <div className="s5-gradient-node detector"><small>固定评价器</small><strong>🔒 YOLO-v3</strong><em>权重冻结</em></div><span className="s5-gradient-link" aria-hidden="true">→</span>
        <div className="s5-gradient-node loss"><small>检测任务</small><strong>Detection Loss</strong><em>训练标签参与</em></div>
      </div>
      <div className="s5-flow-label backward">← 反向 · 检测梯度</div>
      <div className="s5-discrete"><strong>离散模块选择</strong><span>由 Reward 与 Critic 的强化学习反馈优化；不沿这条连续梯度箭头直接反传。</span></div>
    </div>
    <div className="s5-beat" aria-live="polite"><b>{timeline.step + 1} / 7 · {beat.title}</b><span>{beat.detail}</span></div>
    <TimelineControls timeline={timeline} count={gradientBeats.length} label="可微优化动画控制" />
    <div className="s5-train-infer"><div><strong>训练</strong><span>Policy、Value 参与学习；Detector 提供检测反馈；计算 Reward 与相关损失；更新可训练参数。</span></div><div><strong>推理</strong><span>训练完成的 Policy 选择 ISP；参数固定；无需真实标签计算奖励，也不再用 Value Network 做 Actor–Critic 训练；Detector 对处理后图像执行检测。</span></div></div>
  </Panel>;
}

export function ChapterFive({ onDone }: Done) {
  return <><DetectionFeedback onDone={onDone} /><ActorCritic onDone={onDone} /><Differentiable onDone={onDone} /></>;
}
