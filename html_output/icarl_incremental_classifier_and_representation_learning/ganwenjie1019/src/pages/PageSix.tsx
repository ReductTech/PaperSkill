import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import { ALL_CLASS_IDS, CLASS_VISUALS, INCOMING_CLASS_IDS, INCOMING_SAMPLES, OLD_CLASS_IDS, P_BEFORE, type ClassId, type Sample } from "../data/icarl-runtime";
import { binaryCrossEntropy, buildTargets, classLabel, sixNodeBceLoss, studentOutputFor, teacherSnapshotFor, type SixOutputs } from "../data/incremental-training";

type PhaseId = "input" | "targets" | "bce" | "aggregate" | "backprop";
type PlaybackStatus = "idle" | "playing" | "paused" | "complete";
type BceCase = "hard-one" | "hard-zero" | "soft";

const phases: readonly (GuidedStep & { id: PhaseId; guidance: string; durationMs: number })[] = [
  { id: "input", short: "样本进入", title: "同一张图经过共享表示", guidance: "先看这张图片怎样从 D 进入共享特征提取器，再把前向信号送到六个固定输出节点。", durationMs: 3400 },
  { id: "targets", short: "构造 Target", title: "旧节点读取 Q，新节点读取真实标签", guidance: "旧节点使用这张图对应的 Q 行，新节点使用真实标签；两类来源共同构成六维 Target。", durationMs: 5000 },
  { id: "bce", short: "计算 BCE", title: "目标与当前输出怎样比较？", guidance: "先选定一个节点，比较它的目标 r 与当前输出 g；同一个 BCE 同时适用于旧节点的 soft target 和新节点的 hard target。", durationMs: 6200 },
  { id: "aggregate", short: "汇总损失", title: "六个节点先汇成样本损失", guidance: "三项旧节点 BCE 与三项新节点 BCE 汇成 ℓᵢ；再把一个 mini-batch 的样本损失合并，供本轮更新使用。", durationMs: 3700 },
  { id: "backprop", short: "反向传播", title: "损失梯度返回可训练参数", guidance: "L_batch 沿刚才的计算路径反向传到训练头与共享特征提取器。Q 和本轮 Target 在更新期间保持固定。", durationMs: 3900 },
];
const phaseOutputs = [
  "同一 sample.id 的共享表示与六个当前输出。",
  "旧三节点 Q soft targets + 新三节点标签 hard targets。",
  "六个节点各自的 BCE 项。",
  "样本损失 ℓᵢ 与 mini-batch 损失 L_batch。",
  "指向训练头和共享参数的更新方向。",
] as const;

const oldSample = P_BEFORE.B[0];
const sampleById = (id: string): Sample => INCOMING_SAMPLES.find((sample) => sample.id === id) ?? INCOMING_SAMPLES[0];
const sampleChoices: readonly { sample: Sample; label: string }[] = [
  { sample: oldSample, label: "旧类 · C2" },
  { sample: sampleById("x_20"), label: "新类 · C4" },
  { sample: sampleById("x_28"), label: "新类 · C5" },
  { sample: sampleById("x_34"), label: "新类 · C6" },
];
const DEFAULT_SAMPLE = sampleChoices[2].sample;
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function accent(classId: ClassId): CSSProperties {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function activeNodeIndex(sample: Sample): number {
  if (sample.classId === "B") return 1;
  return ALL_CLASS_IDS.indexOf(sample.classId);
}

function targetKind(index: number): "soft" | "hard" {
  return OLD_CLASS_IDS.includes(ALL_CLASS_IDS[index] as (typeof OLD_CLASS_IDS)[number]) ? "soft" : "hard";
}

function bceCaseFor(index: number, target: number): BceCase {
  if (targetKind(index) === "soft") return "soft";
  return target === 1 ? "hard-one" : "hard-zero";
}

function Formula({ children, label, progress = 1 }: { children: ReactNode; label: string; progress?: number }) {
  return <div className="p6-math" role="math" aria-label={label} style={{ "--formula-progress": progress, "--formula-opacity": 0.72 + progress * 0.28 } as CSSProperties}>{children}</div>;
}

function LossCurve({ target, output, reveal = 1 }: { target: number; output: number; reveal?: number }) {
  const width = 300;
  const height = 134;
  const padX = 27;
  const padY = 15;
  const maxLoss = Math.max(3.3, binaryCrossEntropy(target, 0.01), binaryCrossEntropy(target, 0.99));
  const points = Array.from({ length: 81 }, (_, index) => {
    const value = 0.01 + index * 0.01225;
    const loss = binaryCrossEntropy(target, value);
    return [padX + value * (width - 2 * padX), height - padY - (loss / maxLoss) * (height - 2 * padY)] as const;
  });
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const pointX = padX + output * (width - 2 * padX);
  const pointY = height - padY - (binaryCrossEntropy(target, output) / maxLoss) * (height - 2 * padY);
  return <svg className="p6-loss-curve" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`目标 r 为 ${target.toFixed(3)} 时的二元交叉熵曲线；局部探索输出 g 为 ${output.toFixed(2)}`}>
    <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} />
    <line x1={padX} y1={padY} x2={padX} y2={height - padY} />
    <path d={path} pathLength="1" style={{ strokeDashoffset: 1 - reveal }} />
    <line className="p6-loss-curve__guide" x1={pointX} y1={pointY} x2={pointX} y2={height - padY} style={{ opacity: reveal }} />
    <circle cx={pointX} cy={pointY} r="5" style={{ opacity: reveal }} />
    <text x={padX} y={height - 2}>0</text><text x={width - padX - 8} y={height - 2}>1</text>
    <text x={width - padX - 4} y={height - padY - 6}>g</text><text x="4" y={padY + 2}>ℓ</text>
  </svg>;
}

function BceCaseButtons({ sample, selectedNodeIndex, onSelect }: {
  sample: Sample;
  selectedNodeIndex: number;
  onSelect: (kind: BceCase) => void;
}) {
  const selectedTarget = buildTargets(sample)[selectedNodeIndex];
  const selectedCase = bceCaseFor(selectedNodeIndex, selectedTarget);
  return <div className="p6-bce-cases" role="group" aria-label="选择要观察的 BCE 目标情形">
    {([
      ["hard-one", "Hard 1"], ["hard-zero", "Hard 0"], ["soft", "Soft q"],
    ] as const).map(([kind, label]) => <button type="button" key={kind} className={selectedCase === kind ? "is-selected" : ""} aria-pressed={selectedCase === kind} onClick={() => onSelect(kind)}>{label}</button>)}
  </div>;
}

function OperationFocus({
  sample, phase, phaseProgress, playbackStatus, targets, outputs, selectedNodeIndex, exploreOutput, exploreLoss, modelLoss, curveTarget, caseNotice,
  onChooseCase, onExploreOutput,
}: {
  sample: Sample;
  phase: PhaseId;
  phaseProgress: number;
  playbackStatus: PlaybackStatus;
  targets: SixOutputs;
  outputs: SixOutputs;
  selectedNodeIndex: number;
  exploreOutput: number;
  exploreLoss: number;
  modelLoss: number;
  curveTarget: number;
  caseNotice: string;
  onChooseCase: (kind: BceCase) => void;
  onExploreOutput: (output: number) => void;
}) {
  const selectedClass = ALL_CLASS_IDS[selectedNodeIndex];
  const selectedTarget = targets[selectedNodeIndex];
  const selectedKind = targetKind(selectedNodeIndex);
  const selectedCase = bceCaseFor(selectedNodeIndex, selectedTarget);
  const qSourceProgress = phase === "targets" ? clamp01((phaseProgress - 0.06) / 0.25) : 1;
  const labelSourceProgress = phase === "targets" ? clamp01((phaseProgress - 0.31) / 0.24) : 1;
  const targetFormulaProgress = phase === "targets" ? clamp01((phaseProgress - 0.52) / 0.2) : 1;
  const curveProgress = phase === "bce" ? playbackStatus === "playing" ? clamp01((phaseProgress - 0.22) / 0.46) : 1 : phase === "aggregate" || phase === "backprop" ? 1 : 0;
  const oldLossProgress = phase === "aggregate" ? clamp01((phaseProgress - 0.2) / 0.25) : phase === "backprop" ? 1 : 0;
  const newLossProgress = phase === "aggregate" ? clamp01((phaseProgress - 0.46) / 0.25) : phase === "backprop" ? 1 : 0;
  const sampleLossProgress = phase === "aggregate" ? clamp01((phaseProgress - 0.72) / 0.24) : phase === "backprop" ? clamp01(phaseProgress / 0.14) : 0;
  const headGradientProgress = phase === "backprop" ? clamp01((phaseProgress - 0.2) / 0.34) : 0;
  const featureGradientProgress = phase === "backprop" ? clamp01((phaseProgress - 0.55) / 0.34) : 0;
  const oldLoss = OLD_CLASS_IDS.reduce((sum, classId) => {
    const index = ALL_CLASS_IDS.indexOf(classId);
    return sum + binaryCrossEntropy(targets[index], outputs[index]);
  }, 0);
  const newLoss = INCOMING_CLASS_IDS.reduce((sum, classId) => {
    const index = ALL_CLASS_IDS.indexOf(classId);
    return sum + binaryCrossEntropy(targets[index], outputs[index]);
  }, 0);
  const modelGradient = outputs[selectedNodeIndex] - selectedTarget;

  return <section className={`p6-focus-panel p6-focus-panel--${phase}`} aria-live="polite" aria-label="当前运算焦点" data-progress={phaseProgress.toFixed(2)}>
    {phase === "input" ? <>
      <span className="p6-focus-kicker">先确认已有对象</span>
      <h4>D 中的一张图片</h4>
      <p><b>{sample.id} · {classLabel(sample.classId)}</b> 已关联到自己的快照行和真实标签。</p>
      <div className="p6-source-pair"><span><b>Q 行</b><small>{teacherSnapshotFor(sample).map((value) => value.toFixed(2)).join(" · ")}</small></span><span><b>真实标签</b><small>{classLabel(sample.classId)}</small></span></div>
      <small>样本身份贯穿输入、输出与目标。</small>
    </> : null}

    {phase === "targets" ? <>
      <span className="p6-focus-kicker">两种来源 · 一条目标向量</span>
      <h4>为 {sample.id} 装配 rᵢ</h4>
      <div className="p6-source-pair p6-source-pair--animated">
        <span className={`p6-source-token p6-source-token--q ${phase === "targets" && qSourceProgress < 1 ? "is-sending" : ""}`} style={{ "--arrival": qSourceProgress, "--arrival-opacity": 0.42 + qSourceProgress * 0.58, "--source-drift": `${(1 - qSourceProgress) * 10}px` } as CSSProperties}><b>Q · 旧节点 1–3</b><small>{teacherSnapshotFor(sample).map((value) => value.toFixed(2)).join(" · ")}</small></span>
        <span className={`p6-source-token p6-source-token--label ${phase === "targets" && labelSourceProgress < 1 ? "is-sending" : ""}`} style={{ "--arrival": labelSourceProgress, "--arrival-opacity": 0.42 + labelSourceProgress * 0.58, "--source-drift": `${(1 - labelSourceProgress) * 10}px` } as CSSProperties}><b>真实标签 yᵢ</b><small>{classLabel(sample.classId)} → 新节点 4–6</small></span>
      </div>
      <Formula label="六维目标前三项来自该样本的 Q，后三项来自新类别指示标签" progress={targetFormulaProgress}>rᵢ = (qᵢ¹, qᵢ², qᵢ³, 1[yᵢ=C4], 1[yᵢ=C5], 1[yᵢ=C6])</Formula>
      <p>{OLD_CLASS_IDS.includes(sample.classId as (typeof OLD_CLASS_IDS)[number])
        ? "这张旧 Exemplar 的新类标签都是 0；旧节点仍读取它自己的 Q 行。"
        : "命中的新类节点为 1，其余新类节点为 0；旧节点仍读取这张新图自己的 Q 行。"}</p>
      <small className="p6-focus-note">上方六个 r 槽按节点身份对应显示，没有另复制一份目标表。</small>
    </> : null}

    {phase === "bce" ? <>
      <span className="p6-focus-kicker">单节点公式探索</span>
      <h4>{CLASS_VISUALS[selectedClass].outputNodeLabel} · {selectedKind === "soft" ? "来自 Q 的 Soft Target" : "来自标签的 Hard Target"}</h4>
      <BceCaseButtons sample={sample} selectedNodeIndex={selectedNodeIndex} onSelect={onChooseCase} />
      {caseNotice ? <p className="p6-case-notice" role="status">{caseNotice}</p> : null}
      <p className="p6-bce-why">先把目标 r 与当前输出 g 放在一起，BCE 衡量当前输出偏离目标的代价。</p>
      <Formula label="二元交叉熵公式" progress={clamp01((phaseProgress + 0.12) / 0.34)}>ℓ<sub>BCE</sub>(r,g) = −[r log g + (1−r) log(1−g)]</Formula>
      <p className="p6-bce-substitution" style={{ "--substitution-progress": clamp01((phaseProgress - 0.12) / 0.28), "--substitution-opacity": 0.5 + clamp01((phaseProgress - 0.12) / 0.28) * 0.5 } as CSSProperties}>{selectedCase === "hard-one"
        ? "Hard 1：r=1，因此 ℓ=−log g；曲线在 g 接近 1 时最低。"
        : selectedCase === "hard-zero"
          ? "Hard 0：r=0，因此 ℓ=−log(1−g)；曲线在 g 接近 0 时最低。"
          : `Soft q：r=q=${curveTarget.toFixed(3)}，两项都保留；最低点在 g=q，最小损失一般不为 0。`}</p>
      <LossCurve target={curveTarget} output={exploreOutput} reveal={curveProgress} />
      <div className="p6-model-vs-explore" style={{ "--probe-progress": clamp01((phaseProgress - 0.62) / 0.24), "--probe-opacity": 0.3 + clamp01((phaseProgress - 0.62) / 0.24) * 0.7 } as CSSProperties}><span>固定网络示例 <b>g_model={outputs[selectedNodeIndex].toFixed(3)}</b></span><span>局部公式探索 <b>g_explore={exploreOutput.toFixed(2)}</b></span><strong>ℓ_explore={exploreLoss.toFixed(3)}</strong></div>
      <label className="p6-bce-slider">拖动只观察局部曲线
        <input type="range" min="0.01" max="0.99" step="0.01" value={exploreOutput} aria-label="单节点公式探索输出 g explore" aria-valuetext={`局部探索 g ${exploreOutput.toFixed(2)}，损失 ${exploreLoss.toFixed(3)}`} onChange={(event) => onExploreOutput(Number(event.currentTarget.value))} />
        <span><i>0</i><i>1</i></span>
      </label>
      <small className="p6-focus-note">模型当前的单节点方向是 g_model−r = {modelGradient >= 0 ? "+" : ""}{modelGradient.toFixed(3)}；滑杆不改网络输出或样本 Loss。</small>
    </> : null}

    {phase === "aggregate" ? <>
      <span className="p6-focus-kicker">同一 BCE · 两类 Target 来源</span>
      <h4>六项合并为样本损失 ℓᵢ</h4>
      <div className="p6-loss-groups">
        <div className={`p6-loss-group p6-loss-group--old ${oldLossProgress > 0 ? "is-arriving" : ""}`} style={{ "--group-progress": oldLossProgress, "--group-opacity": 0.28 + oldLossProgress * 0.72, "--group-offset": `${(1 - oldLossProgress) * 8}px` } as CSSProperties}><span>旧节点 · Soft BCE</span><b>{(oldLoss * oldLossProgress).toFixed(3)}</b><small>ℓ₁ + ℓ₂ + ℓ₃</small></div>
        <i aria-hidden="true">+</i>
        <div className={`p6-loss-group p6-loss-group--new ${newLossProgress > 0 ? "is-arriving" : ""}`} style={{ "--group-progress": newLossProgress, "--group-opacity": 0.28 + newLossProgress * 0.72, "--group-offset": `${(1 - newLossProgress) * 8}px` } as CSSProperties}><span>新节点 · Hard BCE</span><b>{(newLoss * newLossProgress).toFixed(3)}</b><small>ℓ₄ + ℓ₅ + ℓ₆</small></div>
      </div>
      <Formula label="当前样本损失是三个旧节点 BCE 和三个新节点 BCE 的总和" progress={clamp01((phaseProgress - 0.48) / 0.22)}>ℓᵢ = Σ<sub>j=1</sub><sup>3</sup> BCE(qᵢʲ,gᵢʲ) + Σ<sub>j=4</sub><sup>6</sup> BCE(1[yᵢ=Cⱼ],gᵢʲ)</Formula>
      <div className={`p6-sample-loss ${sampleLossProgress > 0 ? "is-arriving" : ""}`} style={{ "--total-progress": sampleLossProgress, "--total-opacity": 0.3 + sampleLossProgress * 0.7, "--total-offset": `${(1 - sampleLossProgress) * 8}px` } as CSSProperties}><span>本样本六项之和</span><b>{(modelLoss * sampleLossProgress).toFixed(3)}</b></div>
      <div className="p6-batch-assembly" style={{ "--batch-opacity": 0.3 + clamp01((phaseProgress - 0.7) / 0.25) * 0.7 } as CSSProperties} aria-label="从当前样本损失扩展到 mini-batch 平均损失">
        <span className="p6-batch-assembly__current"><small>当前样本</small><b>{sample.id} → ℓᵢ</b></span><i aria-hidden="true">+</i>
        <span className="p6-batch-assembly__rest"><small>同批其它样本</small><b>B−1 项 ℓⱼ</b></span><i aria-hidden="true">→</i>
        <strong>L<sub>batch</sub> = (1/B) Σ<sub>j</sub> ℓⱼ</strong>
      </div>
      <small>这里只核对当前样本的固定教学值；其它样本以符号表示，没有运行一轮训练。</small>
    </> : null}

    {phase === "backprop" ? <>
      <span className="p6-focus-kicker">梯度从损失端返回</span>
      <h4>更新训练头与共享表示</h4>
      <div className={`p6-gradient-route ${headGradientProgress > 0 ? "has-head-gradient" : ""} ${featureGradientProgress > 0 ? "has-feature-gradient" : ""}`}><span className={featureGradientProgress > 0 ? "is-receiving" : ""}>共享 φ<sub>Θ</sub></span><i aria-hidden="true">←</i><span className={headGradientProgress > 0 ? "is-receiving" : ""}>六节点训练头</span><i aria-hidden="true">←</i><span className={sampleLossProgress > 0 ? "is-emitting" : ""}>样本损失 ℓᵢ</span></div>
      <Formula label="参数沿负梯度方向更新" progress={clamp01((phaseProgress - 0.72) / 0.2)}>Θ ← Θ − η ∇<sub>Θ</sub>L<sub>batch</sub></Formula>
      <div className="p6-frozen-state"><span>Q 与 r <b>固定</b></span><span>训练参数 Θ <b>{featureGradientProgress >= 1 ? "更新方向已示意" : "等待梯度"}</b></span></div>
      <div className="p6-parameter-transition" style={{ "--parameter-opacity": 0.42 + featureGradientProgress * 0.58 } as CSSProperties} aria-label="符号化参数状态由更新前交接至更新后"><b>Θ<sub>before</sub></b><i aria-hidden="true">→</i><b className="p6-parameter-transition__after">Θ<sub>after</sub></b><small>符号化状态提示，不展示训练所得数值</small></div>
      <p>训练 head 的 argmax 不是最终预测；训练后 iCaRL 仍按保留 Exemplars 的类别均值作最近均值预测。</p>
      <small>固定教学网络只说明更新路径；图中数值不随反传改变，也不是优化器训练轨迹。</small>
      {phaseProgress >= 0.82 ? <div className="p6-handoff" role="status"><b>参数更新路径演示完成</b><span>真实训练完成后会得到更新的 Θ_after。下一页用预设的 before/after 教学状态说明记忆维护与原型重建。</span></div> : null}
    </> : null}
  </section>;
}

function NetworkCanvas({
  sample, targets, outputs, phase, phaseProgress, playbackStatus, selectedNodeIndex, onSelectNode, exploreOutput, exploreLoss, modelLoss, curveTarget, caseNotice,
  targetReady, onChooseCase, onExploreOutput,
}: {
  sample: Sample;
  targets: SixOutputs;
  outputs: SixOutputs;
  phase: PhaseId;
  phaseProgress: number;
  playbackStatus: PlaybackStatus;
  selectedNodeIndex: number;
  onSelectNode: (index: number) => void;
  exploreOutput: number;
  exploreLoss: number;
  modelLoss: number;
  curveTarget: number;
  caseNotice: string;
  targetReady: boolean;
  onChooseCase: (kind: BceCase) => void;
  onExploreOutput: (output: number) => void;
}) {
  const sampleIsOld = OLD_CLASS_IDS.includes(sample.classId as (typeof OLD_CLASS_IDS)[number]);
  const inputTravelProgress = phase === "input" ? clamp01(phaseProgress / 0.34) : 1;
  const featureProgress = phase === "input" ? clamp01((phaseProgress - 0.3) / 0.24) : phase === "backprop" ? clamp01((phaseProgress - 0.55) / 0.34) : 0;
  const forwardSignal = phase === "input" ? clamp01((phaseProgress - 0.47) / 0.22) : 0;
  const targetSignal = phase === "targets" ? clamp01((phaseProgress - 0.45) / 0.2) : 0;
  const headGradient = phase === "backprop" ? clamp01((phaseProgress - 0.2) / 0.34) : 0;
  const featureGradient = phase === "backprop" ? clamp01((phaseProgress - 0.55) / 0.34) : 0;
  const lossSignal = phase === "backprop" ? clamp01((phaseProgress - 0.03) / 0.15) : 0;
  return <section className="p6-network-board" aria-label="六节点训练计算工作台" data-phase={phase} data-sample={sample.id}>
    <div className="p6-network-board__topline">
      <div><span className="eyebrow">ONE SAMPLE · ONE PERSISTENT GRAPH</span><h3>输入、六个输出节点与当前运算焦点</h3></div>
      <span className="p6-network-board__sample" style={accent(sample.classId)}><i>{CLASS_VISUALS[sample.classId].glyph}</i>{sample.id} · {classLabel(sample.classId)}</span>
    </div>

    <div className={`p6-network-layout p6-network-layout--${phase}`} data-progress={phaseProgress.toFixed(2)}>
      <div className="p6-model-path" aria-label="输入经过共享特征表示">
        <div className={`p6-input-object ${phase === "input" && inputTravelProgress < 1 ? "is-active" : ""}`}>
          <span className="p6-graph-kicker">INPUT xᵢ</span><b style={accent(sample.classId)}>{CLASS_VISUALS[sample.classId].glyph}</b>
          <strong>{sample.id}</strong><small>{sampleIsOld ? "P 中 replay exemplar" : "Xnew 中新类样本"}</small>
        </div>
        <span className={`p6-model-link ${phase === "input" && inputTravelProgress < 1 ? "is-traveling" : ""}`} aria-hidden="true"><i>↓</i><b className="p6-model-traveler" style={{ "--travel-y": `${(1 - inputTravelProgress) * 8}px`, "--traveler-progress": phase === "input" ? inputTravelProgress : 1 } as CSSProperties}>●</b></span>
        <div className={`p6-feature-object ${phase === "backprop" && featureGradient > 0 ? "is-updating" : phase === "input" && featureProgress > 0 ? "is-active" : ""}`} style={{ "--feature-ring": `${featureProgress * 5}px` } as CSSProperties}>
          <span className="p6-graph-kicker">SHARED FEATURE</span><b>φ<sub>Θ</sub></b><small>{phase === "backprop" ? "共享参数 Θ" : "同一表示网络"}</small>
        </div>
      </div>

      <span className={`p6-flow-link p6-flow-link--forward ${phase === "backprop" ? "is-reverse" : ""} ${phase === "input" && forwardSignal > 0 ? "has-signal" : ""} ${phase === "backprop" && featureGradient > 0 ? "has-signal" : ""}`} style={{ "--signal-x": `${phase === "backprop" ? 12 - featureGradient * 24 : -12 + forwardSignal * 24}px`, "--signal-progress": phase === "backprop" ? featureGradient : forwardSignal } as CSSProperties} aria-label={phase === "backprop" ? "梯度由输出头返回共享表示" : "共享表示流向六个输出节点"}><i aria-hidden="true">{phase === "backprop" ? "←" : "→"}</i><b aria-hidden="true">●</b></span>

      <section className="p6-node-zone" aria-label="旧节点与新节点的位置固定">
        <div className="p6-node-group p6-node-group--old">
          <header><b>旧类别节点</b><span>目标来自 Q</span></header>
          {ALL_CLASS_IDS.slice(0, 3).map((classId, index) => <NodeRow key={classId} index={index} classId={classId} selected={selectedNodeIndex === index} value={outputs[index]} target={targets[index]} targetReady={targetReady} phase={phase} phaseProgress={phaseProgress} gradientProgress={headGradient} onSelect={onSelectNode} />)}
        </div>
        <div className="p6-node-divider" aria-hidden="true"><span>同一 BCE</span></div>
        <div className="p6-node-group p6-node-group--new">
          <header><b>新增类别节点</b><span>目标来自真实标签</span></header>
          {ALL_CLASS_IDS.slice(3).map((classId, localIndex) => {
            const index = localIndex + 3;
            return <NodeRow key={classId} index={index} classId={classId} selected={selectedNodeIndex === index} value={outputs[index]} target={targets[index]} targetReady={targetReady} phase={phase} phaseProgress={phaseProgress} gradientProgress={headGradient} onSelect={onSelectNode} />;
          })}
        </div>
      </section>

      <span className={`p6-flow-link p6-flow-link--loss ${phase === "backprop" || phase === "targets" ? "is-reverse" : ""} ${phase === "targets" ? "is-target-inbound" : ""} ${(phase === "backprop" ? headGradient : targetSignal) > 0 ? "has-signal" : ""}`} style={{ "--signal-x": `${phase === "backprop" || phase === "targets" ? 12 - (phase === "backprop" ? headGradient : targetSignal) * 24 : -12}px`, "--signal-progress": phase === "backprop" ? headGradient : targetSignal, "--loss-pulse-ring": `${lossSignal * 5}px` } as CSSProperties} aria-label={phase === "backprop" ? "损失信号返回输出头" : phase === "targets" ? "Q 与真实标签流向目标槽" : "输出节点进入当前运算"}><i aria-hidden="true">{phase === "backprop" || phase === "targets" ? "←" : "→"}</i><b aria-hidden="true">●</b></span>

      <OperationFocus sample={sample} phase={phase} phaseProgress={phaseProgress} playbackStatus={playbackStatus} targets={targets} outputs={outputs} selectedNodeIndex={selectedNodeIndex} exploreOutput={exploreOutput} exploreLoss={exploreLoss} modelLoss={modelLoss} curveTarget={curveTarget} caseNotice={caseNotice} onChooseCase={onChooseCase} onExploreOutput={onExploreOutput} />
    </div>

    <div className="p6-network-key"><span><i className="p6-key-dot p6-key-dot--old" />旧节点：Q Soft Target</span><span><i className="p6-key-dot p6-key-dot--new" />新节点：类别 Hard Target</span><span>六个输出均为独立 sigmoid</span></div>
  </section>;
}

function NodeRow({ index, classId, selected, value, target, targetReady, phase, phaseProgress, gradientProgress, onSelect }: {
  index: number;
  classId: ClassId;
  selected: boolean;
  value: number;
  target: number;
  targetReady: boolean;
  phase: PhaseId;
  phaseProgress: number;
  gradientProgress: number;
  onSelect: (index: number) => void;
}) {
  const kind = targetKind(index);
  const loss = binaryCrossEntropy(target, value);
  const targetStart = index < OLD_CLASS_IDS.length ? 0.18 + index * 0.12 : 0.58 + (index - OLD_CLASS_IDS.length) * 0.1;
  const targetProgress = phase === "targets" ? clamp01((phaseProgress - targetStart) / 0.1) : targetReady ? 1 : 0;
  const outputProgress = phase === "input" ? clamp01((phaseProgress - (0.42 + index * 0.055)) / 0.2) : 1;
  const lossProgress = phase === "aggregate" ? clamp01((phaseProgress - (0.06 + index * 0.105)) / 0.11) : phase === "backprop" ? 1 : 0;
  return <button type="button" className={`p6-node-row p6-node-row--${kind} ${selected ? "is-focused" : ""} ${targetProgress > 0 ? "has-target" : ""} ${gradientProgress > 0 ? "is-receiving-gradient" : ""}`} style={{ ...accent(classId), "--target-progress": targetProgress, "--target-fill": `${targetProgress * 100}%`, "--target-opacity": 0.32 + targetProgress * 0.68, "--target-token-opacity": targetProgress * (1 - targetProgress), "--target-travel": `${(1 - targetProgress) * 14}px`, "--output-progress": outputProgress, "--loss-progress": lossProgress, "--gradient-progress": gradientProgress, "--gradient-color": `rgba(169, 111, 72, ${gradientProgress * 0.12})`, "--gradient-spread": `${gradientProgress * 4}px` } as CSSProperties} data-node-id={`g${index + 1}`} aria-pressed={selected} aria-label={`选择 ${CLASS_VISUALS[classId].outputNodeLabel} 节点，网络输出 ${value.toFixed(3)}，${kind === "soft" ? "Q 目标" : "标签目标"} ${target.toFixed(3)}`} onClick={() => onSelect(index)}>
    <span className="p6-node-row__identity"><i>{CLASS_VISUALS[classId].glyph}</i><b>{CLASS_VISUALS[classId].outputNodeLabel}</b></span>
    <span className="p6-node-row__value"><small>g</small><b>{outputProgress >= 0.82 ? value.toFixed(3) : "···"}</b></span>
    <span className={`p6-node-row__target ${targetProgress >= 0.72 ? "is-revealed" : ""}`}><small>r</small><b>{targetProgress >= 0.72 ? target.toFixed(3) : "—"}</b><i aria-hidden="true" /></span>
    <span className={`p6-node-row__loss ${lossProgress > 0 ? "is-revealed" : ""}`}><small>ℓ</small><b>{lossProgress >= 0.72 ? loss.toFixed(3) : "···"}</b></span>
  </button>;
}

function P6TargetMap({ sample, targets, outputs, onChooseSample, onInspect, onPlayAll, reducedMotion }: {
  sample: Sample;
  targets: SixOutputs;
  outputs: SixOutputs;
  onChooseSample: (sample: Sample) => void;
  onInspect: () => void;
  onPlayAll: () => void;
  reducedMotion: boolean;
}) {
  const qRow = teacherSnapshotFor(sample);
  return (
    <section className="p6-preview" aria-labelledby="p6-preview-title">
      <header className="p6-preview__header">
        <span className="eyebrow">SAME IMAGE · TWO PARALLEL PATHS</span>
        <h2 id="p6-preview-title">Target：告诉模型每个输出节点应该接近什么</h2>
        <p>Student 接收图片 <strong>x</strong> 并产生当前输出 <strong>g</strong>；只有 g 还无法判断是否符合学习目标，因此同一张训练图还需要监督参考 <strong>r = Target</strong>。</p>
      </header>

      <div className="p6-preview__chooser" role="group" aria-label="切换目标拆分图中的训练样本">
        <span>选择一张 D 中样本</span>
        {sampleChoices.map(({ sample: choice, label }) => <button key={choice.id} type="button" className={choice.id === sample.id ? "is-selected" : ""} aria-pressed={choice.id === sample.id} style={accent(choice.classId)} onClick={() => onChooseSample(choice)}><i>{CLASS_VISUALS[choice.classId].glyph}</i><b>{label}</b><small>{choice.id}</small></button>)}
      </div>

      <section className="p6-preview__concept" aria-label="Target 概念边界">
        <p><b>为什么需要</b><span>g 只是 Student 的当前回答；r 才给出每个节点应靠近的监督参考。</span></p>
        <p><b>为什么两种来源</b><span>旧节点读取冻结 Q 的响应强度，新节点读取真实标签的 0/1。</span></p>
        <p><b>概念边界</b><span><strong>r 与 g 在 BCE 中比较</strong>；r 不是输入图片，也不是 Student 已有的预测 g。</span></p>
      </section>

      <div className="p6-preview__parallel" data-sample={sample.id}>
        <div className="p6-preview__paths">
          <section className="p6-preview__student-path" data-flow="student-to-bce" aria-label="同一训练图片进入 Student 产生当前输出 g">
            <header><i>01</i><span><b>同一图片前向</b><small>x → Student(Θ) → g</small></span></header>
            <div className="p6-preview__student-build">
              <div className="p6-preview__input" style={accent(sample.classId)}><i>{CLASS_VISUALS[sample.classId].glyph}</i><span><b>x = {sample.id}</b><small>训练图片 · 输入 Student</small></span></div>
              <svg className="p6-preview__arrow" viewBox="0 0 54 28" aria-hidden="true"><path d="M2 14h45m-8-8 8 8-8 8" /></svg>
              <section className="p6-preview__student" aria-label="Student 当前六个独立 Sigmoid 输出 g">
                <header><span>Student(Θ) 当前输出 g</span><b>六个独立 Sigmoid</b></header>
                <div>{ALL_CLASS_IDS.map((classId, index) => <span key={classId} style={accent(classId)}><i>{CLASS_VISUALS[classId].outputNodeLabel}</i><b>{outputs[index].toFixed(2)}</b></span>)}</div>
              </section>
            </div>
          </section>

          <section className="p6-preview__target-path" data-flow="target-to-bce" aria-label="冻结 Q 与真实标签装配监督目标 r">
            <header><i>02</i><span><b>装配监督目标</b><small>Q + y → r</small></span></header>
            <div className="p6-preview__target-build">
              <section className="p6-preview__sources" aria-label="两路目标来源">
                <div className="p6-preview__source p6-preview__source--q">
                  <span>更新前旧行为</span><b>Q[{sample.id}]</b>
                  <div>{qRow.map((value, index) => <i key={index}>{value.toFixed(2)}</i>)}</div>
                  <small>冻结 Teacher 的三个旧节点响应</small>
                </div>
                <div className="p6-preview__source p6-preview__source--label">
                  <span>真实类别</span><b>y = {CLASS_VISUALS[sample.classId].displayLabel}</b>
                  <div>{INCOMING_CLASS_IDS.map((classId) => <i key={classId}>{sample.classId === classId ? "1" : "0"}</i>)}</div>
                  <small>只为三个新节点给出 0/1 监督</small>
                </div>
              </section>

              <svg className="p6-preview__join" viewBox="0 0 86 126" aria-hidden="true"><path d="M2 25H31Q43 25 43 42V63M2 101H31Q43 101 43 84V63H78m-9-8 9 8-9 8" /></svg>

              <section className="p6-preview__target" aria-label={`样本 ${sample.id} 的六维监督目标 r`}>
                <header><span>监督目标 r</span><b>按节点一一对应</b></header>
                <div>
                  {ALL_CLASS_IDS.map((classId, index) => <span key={classId} className={index < OLD_CLASS_IDS.length ? "is-soft" : "is-hard"} style={accent(classId)}><i>{CLASS_VISUALS[classId].glyph}</i><b>{targets[index].toFixed(index < OLD_CLASS_IDS.length ? 2 : 0)}</b><small>{index < OLD_CLASS_IDS.length ? "Q soft" : "标签 hard"}</small></span>)}
                </div>
              </section>
            </div>
          </section>
        </div>

        <div className="p6-preview__relation" aria-label="当前输出 g 与监督目标 r 按同一节点一一对应">
          <span>g<sub>j</sub> ↔ r<sub>j</sub></span>
          <small>同一节点对应</small>
          <svg viewBox="0 0 70 24" aria-hidden="true"><path d="M2 12h61m-8-7 8 7-8 7" /></svg>
        </div>
        <section className="p6-preview__bce" data-flow-inputs="r,g" aria-label="输出 g 与监督目标 r 在对应节点计算二元交叉熵">
          <span>03 · 对每个节点分别比较</span>
          <b>r<sub>j</sub> 与 g<sub>j</sub></b>
          <strong>BCE<sub>j</sub>(r<sub>j</sub>, g<sub>j</sub>)</strong>
          <small>两条路径在同一节点汇合；损失推动 g 向 r 靠近。</small>
        </section>
      </div>

      <div className="p6-preview__loss-route" aria-label="逐节点 BCE 汇总为样本损失与 mini-batch 更新方向">
        <div>{ALL_CLASS_IDS.map((classId) => <span key={classId} style={accent(classId)}>BCE<sub>{CLASS_VISUALS[classId].index}</sub></span>)}</div>
        <svg viewBox="0 0 54 28" aria-hidden="true"><path d="M2 14h45m-8-8 8 8-8 8" /></svg>
        <b>样本损失 ℓ<sub>i</sub></b>
        <svg viewBox="0 0 54 28" aria-hidden="true"><path d="M2 14h45m-8-8 8 8-8 8" /></svg>
        <b>mini-batch</b>
        <svg viewBox="0 0 54 28" aria-hidden="true"><path d="M2 14h45m-8-8 8 8-8 8" /></svg>
        <strong>参数更新方向</strong>
      </div>

      <footer className="p6-preview__footer">
        <p><b>接下来观察</b>同一张图的前三个旧类目标来自冻结 Q，新增节点目标来自真实标签；看它们怎样组成 r，并分别与 g 计算 BCE。<span><b>边界</b>本页只演示目标、损失与反传方向，不执行真实 SGD，也不把示例 g 当作训练收敛结果。</span><span>示例设置：3 个旧节点 + 3 个新节点。</span></p>
        <div><button type="button" className="icarl-button icarl-button--quiet" onClick={onInspect}>观察具体怎么算 ↓</button><button type="button" className="icarl-button icarl-button--primary" onClick={onPlayAll} disabled={reducedMotion}>▶ 完整播放</button></div>
      </footer>
    </section>
  );
}

export function PageSix({ onContinue }: { onContinue?: () => void }) {
  const initialFocusIndex = activeNodeIndex(DEFAULT_SAMPLE);
  const initialFocusTarget = buildTargets(DEFAULT_SAMPLE)[initialFocusIndex];
  const reducedMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [sampleId, setSampleId] = useState(DEFAULT_SAMPLE.id);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(initialFocusIndex);
  const [phaseProgress, setPhaseProgress] = useState(() => reducedMotion ? 1 : 0);
  const [phaseRailOpen, setPhaseRailOpen] = useState(false);
  const progressRef = useRef(reducedMotion ? 1 : 0);
  const [status, setStatus] = useState<PlaybackStatus>(() => reducedMotion ? "complete" : "idle");
  const [playMode, setPlayMode] = useState<"all" | "phase">("phase");
  const [animationRevision, setAnimationRevision] = useState(0);
  const [exploreOutput, setExploreOutput] = useState(studentOutputFor(DEFAULT_SAMPLE)[initialFocusIndex]);
  const exploreOutputRef = useRef(studentOutputFor(DEFAULT_SAMPLE)[initialFocusIndex]);
  const [curveTarget, setCurveTarget] = useState(initialFocusTarget);
  const curveTargetRef = useRef(initialFocusTarget);
  const curveFrameRef = useRef<number | null>(null);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const [caseNotice, setCaseNotice] = useState("");
  const sample = sampleChoices.find((choice) => choice.sample.id === sampleId)?.sample ?? DEFAULT_SAMPLE;
  const targets = useMemo(() => buildTargets(sample), [sample]);
  const outputs = useMemo(() => studentOutputFor(sample), [sample]);
  const phase = phases[phaseIndex];
  const exploreLoss = binaryCrossEntropy(curveTarget, exploreOutput);
  const modelLoss = sixNodeBceLoss(targets, outputs);
  const targetReady = phaseIndex >= 1;

  useEffect(() => {
    const fromTarget = curveTargetRef.current;
    const fromOutput = exploreOutputRef.current;
    const toTarget = targets[selectedNodeIndex];
    const toOutput = outputs[selectedNodeIndex];
    if (fromTarget === toTarget && fromOutput === toOutput) return;
    if (reducedMotion) {
      curveTargetRef.current = toTarget;
      exploreOutputRef.current = toOutput;
      setCurveTarget(toTarget);
      setExploreOutput(toOutput);
      return;
    }
    const startedAt = performance.now();
    const duration = 460;
    let frame = 0;
    const morph = (now: number) => {
      const progress = clamp01((now - startedAt) / duration);
      const nextTarget = fromTarget + (toTarget - fromTarget) * progress;
      const nextOutput = fromOutput + (toOutput - fromOutput) * progress;
      curveTargetRef.current = nextTarget;
      exploreOutputRef.current = nextOutput;
      setCurveTarget(nextTarget);
      setExploreOutput(nextOutput);
      if (progress < 1) {
        frame = window.requestAnimationFrame(morph);
        curveFrameRef.current = frame;
      } else {
        curveFrameRef.current = null;
      }
    };
    frame = window.requestAnimationFrame(morph);
    curveFrameRef.current = frame;
    return () => {
      window.cancelAnimationFrame(frame);
      curveFrameRef.current = null;
    };
  }, [outputs, reducedMotion, sampleId, selectedNodeIndex, targets]);

  useEffect(() => {
    if (status !== "playing") return;
    if (reducedMotion) {
      progressRef.current = 1;
      setPhaseProgress(1);
      setStatus("complete");
      return;
    }
    const start = performance.now() - progressRef.current * phase.durationMs;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / phase.durationMs);
      progressRef.current = next;
      setPhaseProgress(next);
      if (next >= 1) {
        setStatus("complete");
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [animationRevision, phase.durationMs, phaseIndex, reducedMotion, status]);

  useEffect(() => {
    if (!reducedMotion) return;
    progressRef.current = 1;
    setPhaseProgress(1);
    setStatus("complete");
  }, [phaseIndex, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || playMode !== "all" || status !== "complete" || phaseIndex >= phases.length - 1) return;
    const timer = window.setTimeout(() => {
      const next = phaseIndex + 1;
      setPhaseIndex(next);
      progressRef.current = 0;
      setPhaseProgress(0);
      setAnimationRevision((revision) => revision + 1);
      setStatus("playing");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phaseIndex, playMode, reducedMotion, status]);

  function changePhase(next: number) {
    const bounded = Math.max(0, Math.min(phases.length - 1, next));
    setPhaseRailOpen(false);
    setPlayMode("phase");
    setPhaseIndex(bounded);
    progressRef.current = reducedMotion ? 1 : 0;
    setPhaseProgress(reducedMotion ? 1 : 0);
    setStatus(reducedMotion ? "complete" : "paused");
  }

  function playPause() {
    if (reducedMotion) return;
    if (status === "playing") setStatus("paused");
    else {
      if (status === "complete") {
        setPlayMode("phase");
        progressRef.current = 0;
        setPhaseProgress(0);
      }
      setStatus("playing");
    }
  }

  function replay() {
    setPlayMode("phase");
    if (reducedMotion) {
      progressRef.current = 1;
      setPhaseProgress(1);
      setStatus("complete");
      return;
    }
    progressRef.current = 0;
    setPhaseProgress(0);
    setAnimationRevision((revision) => revision + 1);
    setStatus("playing");
  }

  function chooseSample(next: Sample) {
    const nextNode = activeNodeIndex(next);
    setSampleId(next.id);
    setSelectedNodeIndex(nextNode);
    setCaseNotice("");
    setPlayMode("phase");
    progressRef.current = reducedMotion ? 1 : 0;
    setPhaseProgress(reducedMotion ? 1 : 0);
    setStatus(reducedMotion ? "complete" : "paused");
  }

  function playAll() {
    if (reducedMotion) return;
    setPhaseRailOpen(false);
    setPlayMode("all");
    setPhaseIndex(0);
    progressRef.current = 0;
    setPhaseProgress(0);
    setAnimationRevision((revision) => revision + 1);
    setStatus("playing");
  }

  function chooseNode(index: number) {
    setSelectedNodeIndex(index);
    setCaseNotice("");
  }

  function chooseCase(kind: BceCase) {
    const matchesCase = (index: number) => {
      const nodeKind = targetKind(index);
      if (kind === "soft") return nodeKind === "soft";
      if (nodeKind !== "hard") return false;
      return targets[index] === (kind === "hard-one" ? 1 : 0);
    };
    if (matchesCase(selectedNodeIndex)) {
      setCaseNotice("");
      return;
    }
    const matchingIndex = ALL_CLASS_IDS.findIndex((_, index) => matchesCase(index));
    if (matchingIndex < 0) {
      setCaseNotice("Hard 1 需要新类样本；当前图片保持不变，请显式选择 C4、C5 或 C6 样本后再看这个情形。");
      return;
    }
    chooseNode(matchingIndex);
  }

  function setExploreOutputFromSlider(value: number) {
    if (curveFrameRef.current !== null) window.cancelAnimationFrame(curveFrameRef.current);
    curveFrameRef.current = null;
    exploreOutputRef.current = value;
    setExploreOutput(value);
  }

  function focusWorkbench({ play = false }: { play?: boolean } = {}) {
    workbenchRef.current?.scrollIntoView({ behavior: play || reducedMotion ? "auto" : "smooth", block: "start" });
    if (play) window.requestAnimationFrame(playAll);
  }

  return <article className="tutorial-page icarl-page icarl-page--p6" data-phase={phase.id} data-sample={sample.id} data-model-loss={modelLoss.toFixed(6)} data-explore-loss={exploreLoss.toFixed(6)} data-explore-output={exploreOutput.toFixed(2)} data-selected-target={targets[selectedNodeIndex].toFixed(3)} data-model-output={outputs[selectedNodeIndex].toFixed(3)}>
    <header className="page-heading icarl-page__heading p6-heading">
      <div className="icarl-page__eyebrow"><span>PAGE 06</span><i /> INCREMENTAL TRAINING · CONTINUOUS VIEW</div>
      <h1>同一个 Student 为什么要两种 Target？</h1>
      <p>P5 已准备好 D、Q 与真实标签；现在先拆清目标来源，再观察六个节点怎样共享同一条损失与反传路径。</p>
    </header>

    <P6TargetMap sample={sample} targets={targets} outputs={outputs} onChooseSample={chooseSample} onInspect={focusWorkbench} onPlayAll={() => focusWorkbench({ play: true })} reducedMotion={reducedMotion} />

    <section className="p6-workbench" aria-label="连续增量训练交互工作台" ref={workbenchRef}>
      <div className="p6-workbench__guide">
        <div><span className="eyebrow">PHASE {String(phaseIndex + 1).padStart(2, "0")} / 05</span><h2>{phase.title}</h2><p aria-live="polite">{phase.guidance}</p><small>本阶段产出：{phaseOutputs[phaseIndex]}</small></div>
        <span className={`p6-workbench__status p6-workbench__status--${status}`}>{status === "playing" ? playMode === "all" ? "完整播放中" : "本阶段播放中" : status === "complete" ? "本阶段完成" : status === "paused" ? "已暂停" : "可逐步查看"}</span>
      </div>

      <details className="p6-phase-rail" open={phaseRailOpen} onToggle={(event) => setPhaseRailOpen(event.currentTarget.open)}><summary>五段目录 · 当前 {phaseIndex + 1}/5</summary><GuidedStepControls steps={phases} current={phaseIndex} onChange={changePhase} label="Page 6 连续增量训练阶段" showStepButtons={false} /></details>

      <div className="p6-sample-chooser"><span>选择训练样本 · D / Q / Target 同步</span><div role="group" aria-label="选择旧类或新类训练样本">
        {sampleChoices.map(({ sample: choice, label }) => <button key={choice.id} type="button" className={sample.id === choice.id ? "is-selected" : ""} aria-pressed={sample.id === choice.id} style={accent(choice.classId)} onClick={() => chooseSample(choice)}><i>{CLASS_VISUALS[choice.classId].glyph}</i>{label}<small>{choice.id}</small></button>)}
      </div></div>

      <NetworkCanvas sample={sample} targets={targets} outputs={outputs} phase={phase.id} phaseProgress={phaseProgress} playbackStatus={status} selectedNodeIndex={selectedNodeIndex} onSelectNode={chooseNode} exploreOutput={exploreOutput} exploreLoss={exploreLoss} modelLoss={modelLoss} curveTarget={curveTarget} caseNotice={caseNotice} targetReady={targetReady} onChooseCase={chooseCase} onExploreOutput={setExploreOutputFromSlider} />

      <details className="p6-check-details">
        <summary>按需核对当前样本的 Q、g、r 与各节点 BCE</summary>
        <div className="p6-check-table-wrap"><table><thead><tr><th>节点</th><th>目标来源</th><th>Q / r</th><th>g_model</th><th>BCE</th></tr></thead>
          <tbody>{ALL_CLASS_IDS.map((classId, index) => <tr key={classId}>
            <th>{CLASS_VISUALS[classId].outputNodeLabel}</th><td>{targetKind(index) === "soft" ? "Q" : "真实标签"}</td><td>{targetKind(index) === "soft" ? teacherSnapshotFor(sample)[index].toFixed(3) : targets[index].toFixed(0)}</td><td>{outputs[index].toFixed(3)}</td><td>{binaryCrossEntropy(targets[index], outputs[index]).toFixed(3)}</td>
          </tr>)}</tbody>
        </table></div>
        <p>切换样本时，Q 行按同一 sample.id 更新。BCE 明细与主图使用相同的 targets 和 outputs。</p>
      </details>

      <footer className="p6-controls" aria-label="连续训练动画控制">
        <button type="button" className="icarl-button icarl-button--quiet" onClick={() => changePhase(phaseIndex - 1)} disabled={phaseIndex === 0}>← 上一阶段</button>
        <div><button type="button" className="icarl-button icarl-button--quiet" onClick={playPause} disabled={reducedMotion} aria-label={status === "playing" ? "暂停当前动画" : "继续当前动画"}>{reducedMotion ? "逐步查看" : status === "playing" ? "Ⅱ 暂停" : phaseProgress > 0 && status !== "complete" ? "▶ 继续播放" : "▶ 播放本阶段"}</button><button type="button" className="icarl-button icarl-button--quiet" onClick={replay} disabled={reducedMotion}>↺ 重播本阶段</button><button type="button" className="icarl-button icarl-button--quiet" onClick={playAll} disabled={reducedMotion}>▶ 完整播放</button><span>{reducedMotion ? "逐阶段显示完整结果" : `${playMode === "all" ? "全程" : "本阶段"} · ${status === "complete" ? "结果停留" : `${Math.round(phaseProgress * 100)}%`}`}</span></div>
        <button type="button" className="icarl-button icarl-button--primary" onClick={() => changePhase(phaseIndex + 1)} disabled={phaseIndex >= phases.length - 1}>下一阶段 →</button>
      </footer>
    </section>
    <section className="p6-next-step" aria-label="第 6 页到第 7 页的学习衔接">
      <div className="p6-next-step__state" aria-hidden="true"><b>Θ<sub>before</sub></b><svg viewBox="0 0 54 24"><path d="M2 12h45m-8-7 8 7-8 7" /></svg><b>Θ<sub>after</sub></b><span>P 原图保留</span></div>
      <p>
        <strong><b>本页结论</b>每张图同时受到旧类参考与新类标签的监督，共享网络因此更新到新的参数状态。</strong>
        <span><b>新的问题</b>模型一旦改变，旧图片的特征位置也可能改变，原先的 Prototype 不能直接照搬。</span>
        <span><b>下一页任务</b>训练结束后重整保留记忆，并在当前表示空间重建预测所需的类别参考。</span>
      </p>
      {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>查看训练后的记忆与预测 →</button> : null}
    </section>
  </article>;
}
