import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  CURRENT_EXEMPLARS,
  INCOMING_CLASS_IDS,
  INCOMING_SAMPLES,
  MEMORY_BUDGET,
  NEW_CLASS_HERDING,
  NEXT_QUOTA,
  OLD_CLASS_IDS,
  P_AFTER,
  P_BEFORE,
  PROTOTYPES,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
  TRAINING_SET_SIZE,
  projectSampleFeatures,
  type ClassId,
  type IncomingClassId,
  type Sample,
} from "../data/icarl-runtime";
import {
  INCREMENTAL_STAGE_DATA,
  binaryCrossEntropy,
  buildTargets,
  sixNodeBceLoss,
  studentOutputFor,
  teacherSnapshotFor,
} from "../data/incremental-training";
import { p9TrainingAssemblyAt } from "../data/p9-training-assembly-state";
import { P9_MEMORY_REPLAY_DURATION_MS, p9MemoryTimelineAt } from "../data/p9-memory-timeline";
import { p9PredictionTimelineAt } from "../data/p9-prediction-timeline";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const oldDemoSample = P_BEFORE.A[0];
const newDemoSample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.classId === "D")!;
const trainingDemoTargets = buildTargets(newDemoSample);
const trainingDemoOutputs = studentOutputFor(newDemoSample);
const trainingDemoLoss = sixNodeBceLoss(trainingDemoTargets, trainingDemoOutputs);
const initialNewNodeResponses: Readonly<Record<IncomingClassId, number>> = { D: 0.384, E: 0.716, F: 0.463 };
const currentFeaturePoints = projectSampleFeatures(CURRENT_EXEMPLARS, "after", true);
const previousFeaturePoints = projectSampleFeatures(CURRENT_EXEMPLARS, "before", true);
const queryPrototypes = ALL_CLASS_IDS.map((classId) => PROTOTYPES.find((prototype) => prototype.classId === classId)!);

function classAccent(classId: ClassId): CSSProperties {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

type LocalReplay = { progress: number; playing: boolean; direction: 1 | -1; reducedMotion: boolean; toggle: () => void };

function useLocalReplay(durationMs: number, initialHoldMs = 0, rewindBeforeReplayMs = 0): LocalReplay {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const progressRef = useRef(1);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const startingProgress = progressRef.current;
    const activeDurationMs = direction === -1 && rewindBeforeReplayMs > 0 ? rewindBeforeReplayMs : durationMs;
    let startAt: number | null = null;
    let frame = 0;
    const tick = (now: number) => {
      if (startAt === null) {
        startAt = direction === 1
          ? now + (startingProgress === 0 ? initialHoldMs : 0) - startingProgress * durationMs
          : now + startingProgress * activeDurationMs;
      }
      const next = direction === 1
        ? Math.max(0, Math.min(1, (now - startAt) / durationMs))
        : Math.max(0, Math.min(1, (startAt - now) / activeDurationMs));
      progressRef.current = next;
      setProgress(next);
      if (direction === 1 && next >= 1) {
        setPlaying(false);
        setDirection(1);
        return;
      }
      if (direction === -1 && next <= 0) {
        setDirection(1);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [direction, durationMs, initialHoldMs, playing, reducedMotion, rewindBeforeReplayMs]);

  useEffect(() => {
    if (!reducedMotion || !playing) return;
    progressRef.current = 1;
    setProgress(1);
    setPlaying(false);
  }, [playing, reducedMotion]);

  const toggle = () => {
    if (reducedMotion) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progressRef.current >= 1) {
      if (rewindBeforeReplayMs > 0) {
        setDirection(-1);
      } else {
        progressRef.current = 0;
        setProgress(0);
        setDirection(1);
      }
    }
    setPlaying(true);
  };

  return { progress, playing, direction, reducedMotion, toggle };
}

function ReplayControl({ replay }: { replay: LocalReplay }) {
  const label = replay.reducedMotion
    ? "减少动态效果：完整结果已显示"
    : replay.direction === -1 ? replay.playing ? "平滑回到起点…" : "继续回到起点"
      : replay.playing ? "暂停演示" : replay.progress < 1 ? "继续演示" : "重看形成过程";
  const replayState = replay.reducedMotion ? "reduced" : replay.direction === -1 ? replay.playing ? "rewinding" : "rewind-paused" : replay.playing ? "playing" : replay.progress < 1 ? "paused" : "complete";
  return <button className="p9-replay" type="button" onClick={replay.toggle} disabled={replay.reducedMotion} aria-label={label} data-replay-state={replayState}>{label}</button>;
}

function ProcessSection({
  number,
  title,
  handoff,
  children,
  figure,
}: {
  number: string;
  title: string;
  handoff: string;
  children: ReactNode;
  figure: ReactNode;
}) {
  const id = `p9-step-${number}`;
  return (
    <section className="p9-step" data-step={number} aria-labelledby={`${id}-title`}>
      <div className="p9-step__copy">
        <span className="p9-step__number">{number} <i aria-hidden="true">/ 08</i></span>
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="p9-step__narrative">{children}</div>
      </div>
      <div className="p9-step__figure">
        <div className="p9-figure-heading"><span>状态与逻辑图</span><b>{number}</b></div>
        {figure}
      </div>
      <div className="p9-step__handoff"><span>交给下一步</span><strong>{handoff}</strong></div>
    </section>
  );
}

function SampleTokens({ samples, role = "exemplar" }: { samples: readonly Sample[]; role?: "exemplar" | "incoming" | "selected" | "removed" }) {
  return <div className="p9-token-list">{samples.map((sample, index) => (
    <SampleToken key={sample.id} sample={sample} role={role} order={index + 1} compact />
  ))}</div>;
}

function P9Step01Figure() {
  return <div className="p9-state-figure" data-p9-figure="inherited-state">
    <div className="p9-model-state" data-object-id="Theta_before">
      <span className="p9-model-mark" aria-hidden="true"><i /><i /><i /></span>
      <b>Θ_before</b><small>已学到的共享模型参数</small>
    </div>
    <span className="p9-state-plus" aria-hidden="true">+</span>
    <div className="p9-before-memory" data-object-id="P_before">
      <header><b>P_before</b><span>原始 Exemplar · 12 / 12</span></header>
      {OLD_CLASS_IDS.map((classId) => <div className="p9-memory-row" key={classId} style={classAccent(classId)}>
        <b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b>
        <SampleTokens samples={P_BEFORE[classId]} />
      </div>)}
    </div>
    <p className="p9-figure-caption">本轮开始时只继承模型参数与有序原始 exemplar。</p>
  </div>;
}

function P9Step02Figure() {
  const replay = useLocalReplay(1800, 250);
  const assembly = p9TrainingAssemblyAt(
    replay.progress,
    INCREMENTAL_STAGE_DATA.oldExemplars,
    INCREMENTAL_STAGE_DATA.incomingSamples,
    oldDemoSample.id,
    newDemoSample.id,
  );
  const { oldCopies, incomingCount, assembledCount } = assembly;
  const incomingPerClass = INCOMING_SAMPLES.length / INCOMING_CLASS_IDS.length;
  return <div className="p9-assembly-figure" data-p9-figure="training-set" data-d-count={assembledCount} data-animation-progress={replay.progress.toFixed(3)}>
    <div className="p9-source-lanes">
      <article className="p9-source-card" data-object-id="P_before">
        <span>持久原件</span><b>P_before · 12 张</b>
        <small>{P_BEFORE.A[0].id}、{P_BEFORE.B[0].id}、{P_BEFORE.C[0].id} …</small>
      </article>
      <span className="p9-route-label">读取训练副本</span>
      <article className="p9-source-card p9-source-card--new" data-object-id="X_new">
        <span>本批新图 X_new</span><b>{INCOMING_SAMPLES.length} 张</b>
        <small>{INCOMING_CLASS_IDS.map((classId) => `${CLASS_VISUALS[classId].displayLabel} ${incomingPerClass}`).join(" · ")}</small>
      </article>
    </div>
    <div className="p9-assembly-arrow" aria-hidden="true">↓</div>
    <article className="p9-training-set" data-object-id="D">
      <header><div><span>本轮临时训练集</span><b>D</b></div><strong>{assembledCount} / {TRAINING_SET_SIZE} 张</strong></header>
      <div className="p9-set-equation"><span>{oldCopies} / 12 旧图副本</span><i>+</i><span>{incomingCount} / 18 张新图</span><i>=</i><b>{assembledCount} / {TRAINING_SET_SIZE}</b></div>
      <div className="p9-set-meter" aria-label={`D 已组装 ${assembledCount} 张，共 ${TRAINING_SET_SIZE} 张`}>{Array.from({ length: TRAINING_SET_SIZE }, (_, index) => <i key={index} data-slot-filled={index < assembledCount} />)}</div>
      <div className="p9-set-samples" aria-label="已到达 D 的示例样本" data-example-count={Number(assembly.oldExampleArrived) + Number(assembly.incomingExampleArrived)}>
        {assembly.oldExampleArrived && <div className="p9-sample-arrival" data-example-sample-id={oldDemoSample.id}><SampleToken sample={oldDemoSample} role="exemplar" compact /></div>}
        {assembly.incomingExampleArrived && <div className="p9-sample-arrival" data-example-sample-id={newDemoSample.id}><SampleToken sample={newDemoSample} role="incoming" compact /></div>}
        {!assembly.oldExampleArrived && !assembly.incomingExampleArrived && <span className="p9-sample-placeholder">等待训练样本进入 D</span>}
      </div>
    </article>
    <p className="p9-integrity-note"><b>P_before 原件仍在。</b>进入 D 的 12 张旧图是读取副本，原有 ID 与顺序不变。</p>
    <ReplayControl replay={replay} />
  </div>;
}

function QRow({ sample, opacity = 1, example = false }: { sample: Sample; opacity?: number; example?: boolean }) {
  const response = teacherSnapshotFor(sample);
  return <tr data-q-sample-id={sample.id} data-q-class-id={sample.classId} data-q-example={example ? "true" : undefined} style={{ opacity }}>
    <th scope="row">{sample.id}<small>{CLASS_VISUALS[sample.classId].displayLabel} · D</small></th>
    {response.map((value, index) => <td key={index}>{value.toFixed(3)}</td>)}
  </tr>;
}

function P9Step03Figure() {
  const replay = useLocalReplay(3200);
  const allRows = INCREMENTAL_STAGE_DATA.trainingSamples;
  const rowsWritten = Math.round(replay.progress * allRows.length);
  const oldRowOpacity = replay.progress >= 1 ? 1 : Math.max(0.12, Math.min(1, (replay.progress - 0.04) / 0.24));
  const newRowOpacity = replay.progress >= 1 ? 1 : Math.max(0.12, Math.min(1, (replay.progress - 0.3) / 0.22));
  return <div className="p9-q-figure" data-p9-figure="q-snapshot" data-q-rows={allRows.length} data-q-columns={OLD_CLASS_IDS.length} data-q-written={rowsWritten} data-q-frozen={rowsWritten === allRows.length} data-animation-progress={replay.progress.toFixed(3)}>
    <div className="p9-q-pipeline">
      <article className="p9-q-d-source" data-object-id="D"><b>D</b><span>30 张 · 旧图和新图</span></article>
      <span aria-hidden="true">→</span>
      <article className="p9-teacher" data-object-id="teacher-before"><b>旧 Teacher</b><span>Θ_before</span><small>仅 g₁ · g₂ · g₃</small></article>
      <span aria-hidden="true">→</span>
      <article className="p9-q-lock" data-object-id="Q"><b>Q</b><span>30 × 3</span><small>{rowsWritten === allRows.length ? "已冻结" : `生成 ${rowsWritten}/30`}</small></article>
    </div>
    <div className="p9-q-samples">
      <div className="p9-q-table-wrap">
        <table className="p9-q-table">
          <caption>两个示例样本写入各自的 Q 行</caption>
          <thead><tr><th scope="col">D sample ID</th>{OLD_CLASS_IDS.map((classId) => <th scope="col" key={classId}>{CLASS_VISUALS[classId].outputNodeLabel}</th>)}</tr></thead>
          <tbody><QRow sample={oldDemoSample} key={oldDemoSample.id} opacity={oldRowOpacity} example /><QRow sample={newDemoSample} key={newDemoSample.id} opacity={newRowOpacity} example /></tbody>
        </table>
      </div>
      <div className="p9-q-grid" aria-label="三十行冻结响应表示意">
        {Array.from({ length: allRows.length }, (_, index) => <i key={index} aria-hidden="true" data-slot-filled={index < rowsWritten} />)}
        <span>本演示写入进度 {rowsWritten} / 30 行；两条示例行的顺序不等同于实际遍历顺序。</span>
      </div>
    </div>
    <details className="p9-q-details">
      <summary>展开查看 D 的全部 30 行真实 Q 响应</summary>
      <div className="p9-q-full-table">
        <table className="p9-q-table">
          <thead><tr><th scope="col">D sample ID</th><th scope="col">g₁</th><th scope="col">g₂</th><th scope="col">g₃</th></tr></thead>
          <tbody>{allRows.map((sample, index) => <QRow sample={sample} key={sample.id} opacity={index < rowsWritten ? 1 : 0.12} />)}</tbody>
        </table>
      </div>
    </details>
    <p className="p9-figure-caption">上方两行是代表性示例，不代表 Q 的实际遍历顺序；D 中 30 张图（包括新图）都有一行。</p>
    <ReplayControl replay={replay} />
  </div>;
}

function P9Step04Figure() {
  const replay = useLocalReplay(2500);
  const progress = replay.progress;
  const newNodeProgress = INCOMING_CLASS_IDS.map((_classId, index) => progress >= 1 ? 1 : Math.max(0, Math.min(1, (progress - 0.16 - index * 0.2) / 0.2)));
  const visibleNodeCount = OLD_CLASS_IDS.length + newNodeProgress.filter((value) => value >= 1).length;
  const oldResponses = teacherSnapshotFor(newDemoSample);
  return <div className="p9-output-growth" data-p9-figure="output-growth" data-output-node-count={visibleNodeCount} data-animation-progress={progress.toFixed(3)}>
    <div className="p9-growth-input"><span>新一批类别到达</span><b>T_new · Class 4–6</b><small>当前示例输入：{newDemoSample.id}</small></div>
    <div className="p9-growth-arrow" aria-hidden="true">↓</div>
    <section className="p9-output-layer" aria-label={`按已见类别扩展的共享 Sigmoid 输出层，目前 ${visibleNodeCount} 个节点`}>
      <header><b>共享分类输出层</b><span>{visibleNodeCount} / 6 个类别节点</span></header>
      <div className="p9-output-nodes">
        {OLD_CLASS_IDS.map((classId, index) => <article className="p9-output-node p9-output-node--inherited" key={classId} style={classAccent(classId)} data-node-kind="inherited" data-node-class={classId}>
          <b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><strong>w<sub>{index + 1}</sub></strong><span>Q[x] = {oldResponses[index].toFixed(2)}</span>
        </article>)}
        {INCOMING_CLASS_IDS.map((classId, index) => {
          const nodeProgress = newNodeProgress[index];
          return <article className={`p9-output-node ${nodeProgress > 0 ? "p9-output-node--new" : "p9-output-node--slot"}`} key={classId} style={{ ...classAccent(classId), opacity: nodeProgress, transform: `translateX(${(1 - nodeProgress) * 12}px) scale(${0.92 + nodeProgress * 0.08})` }} data-node-kind={nodeProgress >= 1 ? "new" : "pending"} data-node-class={classId} data-node-progress={nodeProgress.toFixed(3)}>
            <b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><strong>w<sub>{CLASS_VISUALS[classId].index}</sub></strong><span>随机初始权重</span>
          </article>;
        })}
      </div>
      <p>每个已见类别对应一个 Sigmoid 输出节点；新增类别时，为共享输出层追加对应节点。</p>
    </section>
    <div className="p9-initial-response" data-initial-response-count={newNodeProgress.filter((value) => value >= 0.5).length}>
      <header><b>新节点的初始响应</b><span>尚未训练 · 随机初值示意</span></header>
      <div>{INCOMING_CLASS_IDS.map((classId, index) => {
        const nodeProgress = newNodeProgress[index];
        return <p key={classId} style={{ ...classAccent(classId), opacity: nodeProgress, transform: `translateY(${(1 - nodeProgress) * 4}px)` }} data-response-class={classId} data-response-visible={nodeProgress >= 1}>
          <b>{CLASS_VISUALS[classId].displayLabel}</b><code>g<sub>{CLASS_VISUALS[classId].index}</sub>({newDemoSample.id}) = {initialNewNodeResponses[classId].toFixed(3)}</code>
        </p>;
      })}</div>
      <small>这些分值只演示随机初始化后、训练前可能出现的响应；不代表最终类别判断。</small>
    </div>
    <p className="p9-init-caveat">原论文规定输出层随已见类别增长，未指定新节点的初始化算法或具体分值；此处随机初值仅作流程示意。</p>
    <p className="p9-growth-source">旧节点权重从 Θ_before 承接；新增节点随后与共享特征提取器一起训练。</p>
    <ReplayControl replay={replay} />
  </div>;
}

function P9Step05Figure() {
  const replay = useLocalReplay(2200);
  const qReveal = replay.progress >= 1 ? 1 : Math.max(0, Math.min(1, replay.progress / 0.23));
  const labelReveal = replay.progress >= 1 ? 1 : Math.max(0, Math.min(1, (replay.progress - 0.2) / 0.22));
  const targetReveal = replay.progress >= 1 ? 1 : Math.max(0, Math.min(1, (replay.progress - 0.42) / 0.26));
  const updateComplete = replay.progress >= 1 || replay.progress > 0.88;
  return <div className="p9-training-figure" data-p9-figure="student-training" data-training-sample-id={newDemoSample.id} data-loss={trainingDemoLoss.toFixed(6)} data-animation-progress={replay.progress.toFixed(3)}>
    <div className="p9-training-inputs">
      <article data-target-source="Q" style={{ opacity: 0.42 + qReveal * 0.58, transform: `scale(${0.98 + qReveal * 0.02})` }}><span>旧类目标</span><b>Q[{newDemoSample.id}]</b><small>三个软目标</small></article>
      <i aria-hidden="true">+</i>
      <article data-target-source="label" style={{ opacity: 0.42 + labelReveal * 0.58, transform: `scale(${0.98 + labelReveal * 0.02})` }}><span>新类标签</span><b>{CLASS_VISUALS[newDemoSample.classId].displayLabel}</b><small>三个硬目标</small></article>
      <i aria-hidden="true">→</i>
      <article className="p9-target-result" data-target-ready={targetReveal >= 1} style={{ opacity: 0.2 + targetReveal * 0.8, transform: `scale(${0.97 + targetReveal * 0.03})` }}><span>六维 Target</span><b>{trainingDemoTargets.map((value) => value.toFixed(2)).join(" · ")}</b></article>
    </div>
    <div className="p9-node-grid" role="table" aria-label={`${newDemoSample.id} 的六个独立 Sigmoid BCE 教学示例`}>
      <div className="p9-node-row p9-node-row--head" role="row"><span>独立节点</span><span>目标</span><span>示例输出</span><span>BCE</span></div>
      {ALL_CLASS_IDS.map((classId, index) => {
        const target = trainingDemoTargets[index];
        const output = trainingDemoOutputs[index];
        const source = index < OLD_CLASS_IDS.length ? "Q 软目标" : "真实标签硬目标";
        const nodeReveal = replay.progress >= 1 ? 1 : Math.max(0, Math.min(1, (targetReveal * ALL_CLASS_IDS.length) - index));
        return <div className="p9-node-row" role="row" key={classId} style={{ ...classAccent(classId), opacity: nodeReveal, transform: `translateY(${(1 - nodeReveal) * 4}px)` }} data-target-source={source} data-node={classId} data-target-visible={nodeReveal >= 1}>
          <b role="cell"><i>{CLASS_VISUALS[classId].glyph}</i>{CLASS_VISUALS[classId].outputNodeLabel}</b>
          <span role="cell">{target.toFixed(3)}<small>{source}</small></span>
          <span role="cell">{output.toFixed(3)}</span>
          <span role="cell">{binaryCrossEntropy(target, output).toFixed(3)}</span>
        </div>;
      })}
    </div>
    <div className="p9-loss-equation" data-loss-formula="sigmoid-bce" data-loss-total={trainingDemoLoss.toFixed(3)}>
      <b>六节点 BCE（单张示例图）</b>
      <span>ℒ(x) = −∑<sub>j=1</sub><sup>6</sup> [r<sub>j</sub> log g<sub>j</sub>(x) + (1−r<sub>j</sub>) log(1−g<sub>j</sub>(x))]</span>
      <small>r₁…r₃ = Q[x] 软目标；r₄…r₆ = 真实类别硬目标</small>
      <strong>本例六项求和：{trainingDemoLoss.toFixed(3)}</strong>
    </div>
    <div className="p9-theta-after" data-theta-state={updateComplete ? "after" : "before"}><span>Student 更新共享参数</span><b>{updateComplete ? "Θ_after" : "Θ_before"}</b><small>符号化表示；不是实际优化器轨迹</small></div>
    <p className="p9-integrity-note"><b>P_before 仍完整保留。</b>训练改动 Θ；记忆管理稍后才调整原始图片。</p>
    <ReplayControl replay={replay} />
  </div>;
}

function P9Step06Figure() {
  const replay = useLocalReplay(P9_MEMORY_REPLAY_DURATION_MS, 0, 3600);
  const timeline = p9MemoryTimelineAt(replay.progress);
  const committed = timeline.phase === "submitted";
  const phaseLabel = timeline.phase === "inherited"
    ? "起点：旧类各保留 4 张原始 exemplar，共 12 张。"
    : timeline.phase === "marking"
      ? `逐张标记 6 个旧类尾部样本为「移除」；已标 ${timeline.markedOldSampleCount} / ${timeline.freedSlotCount}，尚未删除。`
      : timeline.phase === "marked"
        ? "6 个尾部样本均已标记；接下来逐张移除。"
        : timeline.phase === "removing"
          ? `逐张移除已标记样本；已移除 ${timeline.removedOldSampleCount} / ${timeline.freedSlotCount}。`
          : timeline.phase === "slots-freed"
      ? `旧类各留前 ${NEXT_QUOTA} 张，${timeline.freedSlotCount} 个旧槽位已清空；新类尚未加入。`
      : timeline.phase === "selecting"
        ? `新类按 Herding 顺序逐张加入空槽（${timeline.newSelectedCount} / ${INCOMING_CLASS_IDS.length * NEXT_QUOTA}）。`
        : `P_after 已提交：${ALL_CLASS_IDS.length} 类各保留 ${NEXT_QUOTA} 张原始 exemplar。`;
  return <div className="p9-memory-figure" data-p9-figure="memory-update" data-memory-count={timeline.candidateCount} data-old-retained={timeline.oldRetainedCount} data-new-selected={timeline.newSelectedCount} data-marked-count={timeline.fullyMarkedOldSampleCount} data-marking-count={timeline.markedOldSampleCount} data-removed-count={timeline.removedOldSampleCount} data-memory-phase={timeline.phase} data-memory-state={committed ? "submitted" : "building"} data-animation-progress={timeline.progress.toFixed(3)}>
    <div className="p9-budget-meter" aria-label={`固定预算 ${timeline.budget}，当前候选 ${timeline.candidateCount}`}>
      <span>K = {timeline.budget}</span><div>{Array.from({ length: timeline.budget }, (_, index) => <i key={index} data-slot-filled={index < timeline.candidateCount} />)}</div><b>{timeline.candidateCount} / {timeline.budget}</b>
    </div>
    <p className="p9-memory-phase" data-memory-phase-copy={timeline.phase}>{phaseLabel}</p>
    <div className="p9-memory-rows" aria-label="三行各四个固定槽位：旧类各保留两个，空出的两个槽位由新增类填入">
      {OLD_CLASS_IDS.map((oldClassId, oldClassIndex) => {
        const incomingClassId = INCOMING_CLASS_IDS[oldClassIndex];
        const oldClassState = timeline.oldClasses[oldClassIndex];
        const incomingClassState = timeline.incomingClasses[oldClassIndex];
        const oldSamples = P_BEFORE[oldClassId];
        const incomingSamples = P_AFTER[incomingClassId];
        const rowMarkedCount = oldClassState.samples.filter((item) => item.marked).length;
        const rowRemovedCount = oldClassState.removedCount;
        const showIncomingClass = timeline.phase === "submitted" || (timeline.phase === "selecting" && (incomingClassState.selectionProgress > 0 || incomingClassState.selectedCount > 0));
        const oldStatus = timeline.phase === "inherited"
          ? `${oldSamples.length} 张保留`
          : timeline.phase === "marking" || timeline.phase === "marked"
            ? `${oldSamples.length} 保留 · ${rowMarkedCount} 待移除`
            : `${oldClassState.retainedCount} 保留 · ${rowRemovedCount} 已移除`;
        const incomingStatus = `${incomingClassState.selectedCount} / ${NEXT_QUOTA} 入槽`;
        return <section className="p9-memory-row" key={oldClassId} data-memory-row={oldClassId} data-incoming-row={incomingClassId} data-old-retained={oldClassState.retainedCount} data-new-selected={incomingClassState.selectedCount} data-kept-ids={[...P_AFTER[oldClassId], ...incomingSamples].map((sample) => sample.id).join(" ")}>
          <header className="p9-memory-row__heading">
            <div className="p9-memory-row__old-group">
              <b className="p9-memory-row__old-label" style={classAccent(oldClassId)}>{CLASS_VISUALS[oldClassId].glyph} {CLASS_VISUALS[oldClassId].displayLabel}</b>
              <span className="p9-memory-row__old-status">{oldStatus}</span>
            </div>
            <div className="p9-memory-row__new-group" data-incoming-visible={showIncomingClass}>{showIncomingClass && <><span className="p9-memory-row__handoff" aria-hidden="true">→</span><b className="p9-memory-row__incoming" style={classAccent(incomingClassId)}>{CLASS_VISUALS[incomingClassId].glyph} {CLASS_VISUALS[incomingClassId].displayLabel}<small>{incomingStatus}</small></b></>}</div>
          </header>
          <div className="p9-memory-row__slots">
            {oldSamples.map((sample, slotIndex) => {
              const retained = slotIndex < NEXT_QUOTA;
              const oldSampleState = oldClassState.samples[slotIndex];
              const removalProgress = oldSampleState.removalProgress;
              const isMarked = oldSampleState.marked;
              const incomingIndex = slotIndex - NEXT_QUOTA;
              const incomingSample = incomingIndex >= 0 ? incomingSamples[incomingIndex] : undefined;
              const incomingSampleState = incomingIndex >= 0 ? incomingClassState.samples[incomingIndex] : undefined;
              const arrivalProgress = incomingSampleState?.arrivalProgress ?? 0;
              const emptyStateVisible = timeline.phase === "slots-freed" || timeline.phase === "selecting" || timeline.phase === "submitted";
              const emptyProgress = incomingSample && oldSampleState.removed && emptyStateVisible ? 1 : 0;
              const slotState = retained ? "old-kept" : oldSampleState.removed
                ? arrivalProgress > 0 ? "new-arriving" : "empty"
                : removalProgress > 0 ? "old-removing" : isMarked ? "old-marked" : "old-present";
              const oldVisualProgress = removalProgress > 0 ? removalProgress : 0;
              return <div className="p9-memory-slot" key={`${oldClassId}-${slotIndex}`} style={classAccent(arrivalProgress > 0 ? incomingClassId : oldClassId)} data-slot={slotIndex + 1} data-slot-state={slotState} data-old-sample-id={sample.id} data-new-sample-id={incomingSample?.id}>
                {incomingSample && <span className="p9-memory-slot__vacancy" style={{ opacity: emptyProgress }} aria-hidden="true" />}
                <span className="p9-memory-slot__content p9-memory-slot__content--old" style={{ opacity: retained ? 1 : 1 - oldVisualProgress, transform: `translateY(${-6 * oldVisualProgress}px) scale(${1 - oldVisualProgress * 0.82})` }} data-sample-id={sample.id} data-retained={retained} data-marked={isMarked} data-mark-progress={oldSampleState.markedProgress.toFixed(3)} data-removal-progress={removalProgress.toFixed(3)}><SampleToken sample={sample} role={retained || !isMarked ? "exemplar" : "removed"} order={slotIndex + 1} compact /></span>
                {incomingSample && <span className="p9-memory-slot__content p9-memory-slot__content--new" style={{ opacity: arrivalProgress, transform: `translate(${(1 - arrivalProgress) * 10}px, ${(1 - arrivalProgress) * 4}px) scale(${0.94 + arrivalProgress * 0.06})` }} data-sample-id={incomingSample.id} data-selection-progress={arrivalProgress.toFixed(3)}><SampleToken sample={incomingSample} role="selected" order={incomingIndex + 1} compact /></span>}
                {incomingSample && <span className="p9-memory-slot__placeholder" style={{ opacity: emptyProgress * (1 - arrivalProgress) }} aria-hidden="true">空槽</span>}
              </div>;
            })}
          </div>
        </section>;
      })}
    </div>
    <div className="p9-memory-decisions">
      <section className="p9-memory-decisions__group p9-memory-decisions__group--old" aria-label="旧类别有序记忆队列">
        <header><b>旧类有序队列</b><small>前 {NEXT_QUOTA} 张保留 · 尾部移除</small></header>
        <div className="p9-memory-decisions__rows">
          {OLD_CLASS_IDS.map((classId) => {
            const classState = timeline.oldClasses.find((item) => item.classId === classId)!;
            return <div className="p9-memory-decision-row" key={classId} style={classAccent(classId)} data-decision-class={classId}>
              <b>{CLASS_VISUALS[classId].displayLabel}</b>
              <div className="p9-memory-decisions__samples">{P_BEFORE[classId].map((sample, index) => {
                const retained = index < NEXT_QUOTA;
                const sampleState = classState.samples[index];
                const status = retained ? "保留" : sampleState.removed ? "已移除" : sampleState.marked ? "移除" : "";
                return <em key={sample.id} data-sample-id={sample.id} data-kept={retained} data-marked={!retained && sampleState.marked} data-removed={!retained && sampleState.removed}>{sample.id}{status && <small>{status}</small>}</em>;
              })}</div>
            </div>;
          })}
        </div>
      </section>
      <section className="p9-memory-decisions__group p9-memory-decisions__group--new" aria-label="新类别 Herding 入选样本">
        <header><b>新类 Herding 前缀</b><small>依次入槽 · 每类 {NEXT_QUOTA} 张</small></header>
        <div className="p9-memory-decisions__rows">
          {INCOMING_CLASS_IDS.map((classId, classIndex) => {
            const selection = timeline.incomingClasses[classIndex];
            const waiting = timeline.phase !== "selecting" && timeline.phase !== "submitted" || (timeline.phase === "selecting" && selection.selectionProgress === 0);
            return <div className="p9-memory-decision-row" key={classId} style={classAccent(classId)} data-decision-class={classId}>
              <b>{CLASS_VISUALS[classId].displayLabel}</b>
              <div className="p9-memory-decisions__samples" data-herding-ids={waiting ? undefined : selection.samples.map((item) => item.sample.id).join(" ")}>
                {waiting ? <span className="p9-memory-decisions__waiting">等待前序腾位</span> : selection.samples.map((item) => <em key={item.sample.id} style={{ opacity: Math.max(0.12, item.arrivalProgress) }} data-sample-id={item.sample.id} data-selected={item.selected}>{item.sample.id}<small>入槽</small></em>)}
              </div>
            </div>;
          })}
        </div>
      </section>
    </div>
    <p className="p9-figure-caption" data-memory-commit-state={committed ? "submitted" : "pending"}>{committed ? "P_after 已提交；旧类前缀与新类 Herding 样本合计 12 张。" : `候选预算 ${timeline.candidateCount} / ${timeline.budget}；全部选完后才提交 P_after。`}</p>
    <ReplayControl replay={replay} />
  </div>;
}

function P9Step07Figure() {
  const replay = useLocalReplay(9000);
  const progress = replay.progress;
  const timeline = p9PredictionTimelineAt(progress);
  const visiblePrototypes = queryPrototypes.slice(0, timeline.prototypeCount);
  const phaseCopy = timeline.phase === "encoding"
    ? "A · 重新编码 P_after exemplar：对照固定的更新前、更新后特征端点。"
    : timeline.phase === "prototypes"
      ? `B · 按 Class 1–6 顺序形成当前 Prototype：${timeline.prototypeCount} / 6。`
      : timeline.phase === "query"
        ? "C · Query 正在进入当前特征空间；尚未开始距离比较。"
        : timeline.phase === "comparison"
          ? `D · 按 Class 1–6 比较真实欧氏距离：${timeline.comparisonsComplete} / 6 条已完成，已画出的线保留。`
          : "E · 六条真实距离已完成；强调最小距离并确定最近类别。";
  const workbenchDescription = timeline.phase === "encoding"
    ? "固定对照 P_after exemplar 在更新前与更新后的特征端点；中间移动仅为视觉插值。"
    : timeline.phase === "prototypes"
      ? `当前特征位置保持不变，依类别顺序形成 Prototype；已出现 ${timeline.prototypeCount} 个。`
      : timeline.phase === "query"
        ? "六类 Prototype 已形成；Query 正进入当前特征空间，距离比较尚未开始。"
        : timeline.phase === "comparison"
          ? "Query 依类别顺序与当前 Prototype 比较；已绘制的距离线持续保留。"
          : "六条 Query 到当前 Prototype 的距离均已完成，最近原型由真实 argmin 决定。";
  return <div className="p9-feature-figure" data-p9-figure="prototype-query" data-p9-phase={timeline.phase} data-prototype-count={timeline.prototypeCount} data-query-visible={timeline.queryVisible} data-prediction-class={QUERY_PREDICTION} data-comparisons-complete={timeline.comparisonsComplete} data-animation-progress={progress.toFixed(3)}>
    <FeatureSpaceWorkbench
      mode="inference"
      title="当前特征空间 · 最近均值分类"
      description={workbenchDescription}
      points={currentFeaturePoints}
      previousPoints={previousFeaturePoints}
      motionProgress={timeline.encodingProgress}
      prototypes={visiblePrototypes}
      query={timeline.queryVisible ? QUERY_FEATURE : undefined}
      queryLabelOffset={{ dx: -14, dy: 28, anchor: "end" }}
      queryRevealProgress={timeline.queryRevealProgress}
      comparisonProgress={timeline.comparisonProgress}
      completedComparisonOpacity={0.68}
      nearestHighlightProgress={timeline.nearestHighlightProgress}
      unitCircle
      markerScale={0.82}
      showSampleLabels={false}
      focusableSamples={false}
    />
    <p className="p9-feature-progress">{phaseCopy}</p>
    <p className="p9-feature-note">前后端点对应同一批图片在两种给定特征下的位置；中间移动只是视觉插值，不代表真实 SGD 轨迹。</p>
    <div className="p9-prototype-roster" aria-label={`当前已形成 ${timeline.prototypeCount} / 6 类 Prototype`} data-prototype-count={timeline.prototypeCount}>
      {ALL_CLASS_IDS.slice(0, timeline.prototypeCount).map((classId) => <span key={classId} style={classAccent(classId)}><b>{CLASS_VISUALS[classId].glyph} μ{CLASS_VISUALS[classId].index}</b><small>{P_AFTER[classId].map((sample) => sample.id).join(" + ")}</small></span>)}
    </div>
    {timeline.nearestHighlightActive && <div className="p9-query-result" data-result-class={QUERY_PREDICTION} data-result-visible={timeline.nearestHighlightProgress >= 1} style={{ opacity: timeline.nearestHighlightProgress, transform: `translateY(${(1 - timeline.nearestHighlightProgress) * 4}px)`, visibility: timeline.nearestHighlightProgress > 0 ? "visible" : "hidden" }}><span>六个距离比较完成</span><b>最近原型：{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</b><small>最小欧氏距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 按 argmin 分类</small></div>}
    <ReplayControl replay={replay} />
  </div>;
}

function P9Step08Figure() {
  const replay = useLocalReplay(1900);
  const transientStyle: CSSProperties = { opacity: 0.42 + (1 - replay.progress) * 0.58, transform: `translateY(${replay.progress * 6}px)` };
  return <div className="p9-handoff-figure" data-p9-figure="next-round-handoff" data-animation-progress={replay.progress.toFixed(3)}>
    <section className="p9-persistent-output" data-persistence="persistent">
      <span>继续保存 · 下一轮输入</span>
      <div><b>Θ_after</b><i aria-hidden="true">+</i><b>P_after</b></div>
      <small>当前模型参数 + 12 张原始 exemplar</small>
    </section>
    <div className="p9-next-round-arrow" aria-hidden="true">↓</div>
    <section className="p9-next-round" data-object-id="X_next"><span>下一批到来时</span><b>X_next</b><small>新的类别数据入口；不预演下一轮</small></section>
    <section className="p9-temporary-output" data-persistence="temporary" style={transientStyle}>
      <span>本轮临时或派生对象 · 不作为下一轮持久状态</span>
      <div>{["D", "Q", "Targets", "Loss", "当前 Query / 预测", "当前 Prototype"].map((item) => <b key={item}>{item}</b>)}</div>
    </section>
    <ReplayControl replay={replay} />
  </div>;
}

export function PageNine({ onExit }: { onExit?: () => void }) {
  return <article className="tutorial-page icarl-page--p9">
    <header className="page-heading p9-heading">
      <span className="eyebrow">09 · 一次增量学习</span>
      <h1>iCaRL 一次增量学习的完整逻辑</h1>
      <p>从上一轮状态出发，追踪训练准备、模型更新、记忆维护、预测和下一轮交接。</p>
    </header>
    <aside className="p9-reading-note"><b>先看交接顺序。</b><span>这里不再逐项重讲前面介绍的机制；沿页面向下读，观察每一步为何出现、传入和留下了什么。</span></aside>

    <div className="p9-process" aria-label="一轮 iCaRL 增量学习的八组图文推演">
      <ProcessSection number="01" title="新类别还没来，系统手里有什么？" handoff="Θ_before + P_before" figure={<P9Step01Figure />}>
        <p>上一轮结束后，iCaRL 保留两部分：已经学到的模型参数 <b>Θ_before</b>，以及各旧类按 Herding 顺序选出的少量原始 Exemplar 图片 <b>P_before</b>。</p>
        <p>这一轮仍要识别旧类，又要接纳新类，所以从这些已保存状态出发继续学习。</p>
        <p className="p9-why"><b>为什么从这里开始？</b>历史训练图片没有全部保存；旧模型和有限的原始 exemplar 是本轮可继承的学习状态。</p>
      </ProcessSection>

      <ProcessSection number="02" title="新图到了，只拿新图训练会怎样？" handoff="D · 30 张" figure={<P9Step02Figure />}>
        <p>本批新增 D、E、F 三类，每类 6 张，共 <b>18 张 X_new</b>。如果只用新图更新表示，旧类能力容易退化。</p>
        <p>于是从 <b>P_before 读取 12 张旧图的训练副本</b>，与新图一起构成 <b>D = 30</b>。进入 D 的是读取副本；P_before 原件及顺序不变。</p>
        <p className="p9-why"><b>交接对象的身份：</b>D 是本轮临时训练集，不是持久记忆。</p>
      </ProcessSection>

      <ProcessSection number="03" title="模型参数将要改变，旧模型的判断如何保留下来？" handoff="D + 冻结 Q" figure={<P9Step03Figure />}>
        <p>更新 Θ 之前，让 <b>旧 Teacher</b> 对 D 的每张图计算旧类三个 Sigmoid 节点的响应，形成 <b className="p9-q-formula">Q ∈ ℝ<sup className="p9-q-formula__exponent">30×3</sup></b>。</p>
        <p>Q 的每一行都与 D 中同一 sample ID 对齐。旧图和新图都有 Q 行；Q 不是新类标签，也不是更新后的 Student 输出。</p>
        <p className="p9-why"><b>为什么要提前记录？</b>训练会改变 Θ；冻结的 Q 可在后续为旧类节点提供软目标。</p>
      </ProcessSection>

      <ProcessSection number="04" title="新类别到来后，分类输出层如何扩展？" handoff="旧节点权重 + 新增 Sigmoid 节点" figure={<P9Step04Figure />}>
        <p>本轮新类别到达后，iCaRL 将共享分类输出层扩展为每个已见类别各有一个 Sigmoid 节点。旧节点承接 <b>Θ_before</b> 中已有的权重，并为新类别追加节点及其权重向量。</p>
        <p>新节点随机初始化后，对当前输入会先产生尚未训练的初始响应；这些分值只是随机初值下的输出，随后会与共享特征提取器一起接受训练。</p>
        <p className="p9-why"><b>先扩层，再联合训练。</b>这里的三个初始分值是流程示意；原论文没有规定具体初始化算法或响应值。</p>
      </ProcessSection>

      <ProcessSection number="05" title="旧知识和新类真实标签，如何同时推动学习？" handoff="Θ_after · P_before 仍保留" figure={<P9Step05Figure />}>
        <p>从 D 取一张图。旧类 1–3 节点使用它在 Q 中对应行的软目标；新类 4–6 节点使用真实类别构造硬目标。</p>
        <p>六个独立 Sigmoid 节点分别计算 BCE，按图中公式求和后更新共享特征提取器与分类层。这里修改的是模型参数 <b>Θ</b>。</p>
        <p className="p9-why"><b>此时不动什么？</b>P_before 原始记忆保持不变；Q 在训练期间也保持冻结。图中的参数变化只作符号示意。</p>
      </ProcessSection>

      <ProcessSection number="06" title="模型已经更新，旧记忆怎样给新类别腾位置？" handoff="Θ_after + P_after · 12 张" figure={<P9Step06Figure />}>
        <p>记忆总预算仍是 <b>K=12</b>。当前类别从 3 类变成 6 类，因此每类可保留 2 张原始图片。</p>
        <p>A/B/C 直接截断原有 Herding 有序列表，各留前两张，不回到旧类完整数据重新选样；D/E/F 在当前表示下按各自 Herding 顺序选前两张。</p>
        <p className="p9-why"><b>先更新模型，再更新记忆。</b>旧类的保留 ID 不变，最终 P_after 才占满 12 个槽位。</p>
      </ProcessSection>

      <ProcessSection number="07" title="原始图片留了下来，原来的 Prototype 还能直接用吗？" handoff="一次 Query 预测 · Θ_after / P_after 不变" figure={<P9Step07Figure />}>
        <p>共享特征提取器已经更新，同一张原始图片在当前模型下的特征也可能变化。因此不能把旧表示下的 Prototype 直接当作当前原型。</p>
        <p>让 <b>P_after 的原始图片</b>重新经过当前 φ_Θ_after，计算六类 Prototype。Query 依当前特征到各原型的欧氏距离分类，取最近原型，而非对六个训练输出节点取 argmax。</p>
        <p className="p9-why"><b>这是推断。</b>一次 Query 预测不更新模型参数，也不改变 exemplar 记忆。</p>
      </ProcessSection>

      <ProcessSection number="08" title="一次增量更新结束，哪些东西真正留下？" handoff="下一轮从 Θ_after + P_after 出发" figure={<P9Step08Figure />}>
        <p>D、Q、Targets 与 Loss 是本轮训练临时对象；当前 Query 预测和 Prototype 是本轮推断使用的结果或派生表示。</p>
        <p>下一轮继续依靠当前模型 <b>Θ_after</b> 和有限的原始图片记忆 <b>P_after</b>。新类别到来时，再从这两类持久状态出发。</p>
        <p className="p9-why"><b>一轮增量更新闭环：</b>有限记忆参与训练 → 旧模型保存 Q → 联合训练更新 Θ → 调整有序记忆 P → 重建原型并预测 → 保留 Θ 和 P 等待下一轮。</p>
      </ProcessSection>

      <div className="p9-closing-summary" data-p9-summary>
        <span>本轮结束后留下的状态</span>
        <b>Θ_after + P_after → 下一轮</b>
        <small>D / Q / Targets / Loss / 当前 Query 与 Prototype 均不替代持久模型和原始 exemplar 记忆。</small>
      </div>
    </div>

    <footer className="p9-page-footer">
      <p>本页使用共享合成教学数据说明对象交接，不是论文训练运行记录。论文实验数据与适用边界见 P8。</p>
      <button type="button" className="icarl-button icarl-button--quiet" onClick={onExit} disabled={!onExit}>← 返回实验页</button>
    </footer>
  </article>;
}
