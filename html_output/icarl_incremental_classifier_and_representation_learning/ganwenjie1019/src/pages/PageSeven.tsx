import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { useAnimationTimeline, type AnimationClip } from "../shared/animation/useAnimationTimeline";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  COMMITTED_MEMORY_SIZE,
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
  projectSampleFeatures,
  type ClassId,
  type IncomingClassId,
} from "../data/icarl-runtime";

type P7Step = { id: string; title: string; short: string; narrative: string; durationMs: number };

const steps: readonly P7Step[] = [
  {
    id: "training-complete",
    title: "假定训练结束，旧记忆仍完整",
    short: "训练完成",
    narrative: "先假定真实训练已得到 Θ_after。本页用固定教学状态演示后续交接；P_before 的 12 张旧 exemplar 仍在，D、Q、targets 与 loss 不再是预测焦点。",
    durationMs: 1600,
  },
  {
    id: "truncate-old",
    title: "按原顺序截断旧类列表",
    short: "截断旧类",
    narrative: "K=12 分给 6 类，每类配额 m=⌊12/6⌋=2。A、B、C 各保留有序列表前两张，尾部两张移出。",
    durationMs: 2600,
  },
  {
    id: "select-new",
    title: "从新类完整数据补入 exemplars",
    short: "选择新类",
    narrative: "空出的六个位置由 D、E、F 各补两张；这里读取当前表示下已算好的 Herding 顺序，不重讲 P4 的候选计算。",
    durationMs: 3600,
  },
  {
    id: "rebuild-prototypes",
    title: "用当前表示重新构造原型",
    short: "重建原型",
    narrative: "P_after 提交后，当前 φ_Θ_after 重新编码保留的原图并重算六类均值。同一批旧图的 before/after 端点来自固定教学状态；连线与过渡只作对照，不是训练轨迹。",
    durationMs: 5200,
  },
  {
    id: "query",
    title: "Query 比较六个当前原型",
    short: "最近原型",
    narrative: "固定教学坐标的 Query 进入当前特征图，随后逐个比较六个 P_after 原型；距离最短者决定预测。入场只表示进入比较流程，不模拟编码轨迹。训练 head 保留，但最终预测不读取它的 argmax。",
    durationMs: 6200,
  },
];
/** The first card describes the already-visible post-training state; motion starts with truncation. */
const FIRST_VISIBLE_MOTION_STEP = 1;

const clips: readonly AnimationClip[] = steps.map((step) => ({
  id: step.id,
  durationMs: step.durationMs,
  holdMs: step.id === "query" ? 1600 : step.id === "rebuild-prototypes" ? 1200 : 900,
  narrative: step.narrative,
}));

const currentPoints = projectSampleFeatures(CURRENT_EXEMPLARS, "after", true);
const trackedSamples = [P_AFTER.A[0], P_AFTER.B[0]];
const trackedBeforePoints = projectSampleFeatures(trackedSamples, "before", true);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function classAccent(classId: ClassId): CSSProperties {
  return { "--p7-class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function selectionArrival(stage: number, progress: number, classId: IncomingClassId, rank: number): number {
  if (stage < 2) return 0;
  if (stage > 2) return 1;
  const classIndex = INCOMING_CLASS_IDS.indexOf(classId);
  const start = 0.035 + classIndex * 0.285 + rank * 0.105;
  return clamp01((progress - start) / 0.2);
}

function OldMemoryRow({ classId, stage, progress }: { classId: "A" | "B" | "C"; stage: number; progress: number }) {
  const samples = P_BEFORE[classId];
  const isTruncating = stage === 1;
  const isTrimmed = stage > 1;
  return <div className="p7-memory-row p7-memory-row--old" style={classAccent(classId)}>
    <div className="p7-memory-row__heading"><b><i>{CLASS_VISUALS[classId].glyph}</i>{CLASS_VISUALS[classId].displayLabel}</b><span>{isTruncating ? "4 → 2" : isTrimmed ? "保留 2 / 4" : "仍保留 4 张"}</span></div>
    <div className="p7-memory-tokens" aria-label={`${CLASS_VISUALS[classId].displayLabel} 的原有 exemplar，按列表顺序显示`}>
      {samples.map((sample, index) => {
        const isTail = index >= NEXT_QUOTA;
        const exitProgress = isTail ? (isTruncating ? progress : isTrimmed ? 1 : 0) : 0;
        return <span
          key={sample.id}
          className={`p7-token p7-token--old${isTail ? stage >= 1 ? " is-tail" : "" : " is-prefix"}${isTail && exitProgress > 0 ? " is-exiting" : ""}`}
          style={{ "--p7-exit-progress": exitProgress } as CSSProperties}
          aria-hidden={exitProgress >= 0.999 ? true : undefined}
          title={`${sample.id} · P_before 顺序 ${index + 1}${isTail ? " · 本轮从尾部移出" : " · 保留前缀"}`}
        >{sample.id}<small>{index + 1}</small></span>;
      })}
    </div>
  </div>;
}

function NewMemoryRow({ classId, stage, progress }: { classId: IncomingClassId; stage: number; progress: number }) {
  const candidates = INCOMING_SAMPLES.filter((sample) => sample.classId === classId);
  const selected = NEW_CLASS_HERDING[classId].ordered.slice(0, NEXT_QUOTA);
  const arrivals = selected.map((_, rank) => selectionArrival(stage, progress, classId, rank));
  const selectionStarted = stage >= 2;
  const selectionComplete = stage > 2;

  return <div className="p7-memory-row p7-memory-row--new" style={classAccent(classId)}>
    <div className="p7-memory-row__heading"><b><i>{CLASS_VISUALS[classId].glyph}</i>{CLASS_VISUALS[classId].displayLabel}</b><span>{selectionComplete ? "P_after · 2 张" : selectionStarted ? "Herding 补入 2 张" : "完整数据 · 6 张"}</span></div>
    <div className="p7-new-memory-lane">
      <div className="p7-memory-slots" aria-label={`${CLASS_VISUALS[classId].displayLabel} 留存槽位`}>
        {selectionStarted ? selected.map((sample, rank) => <span
          key={sample.id}
          className="p7-token p7-token--slot"
          style={{ "--p7-arrival-progress": arrivals[rank] } as CSSProperties}
          title={`当前表示下 Herding 第 ${rank + 1} 个 exemplar · ${sample.id}`}
        >{sample.id}<small>p{rank + 1}</small></span>) : <><span className="p7-empty-slot">空位</span><span className="p7-empty-slot">空位</span></>}
      </div>
      <div className="p7-candidate-set" aria-label={`${CLASS_VISUALS[classId].displayLabel} 完整六张新类候选`}>
        {candidates.map((sample) => {
          const rank = selected.findIndex((item) => item.id === sample.id);
          const arrival = rank < 0 ? 0 : arrivals[rank];
          return <span
            key={sample.id}
            className={`p7-token p7-token--candidate${rank >= 0 ? " is-selected-candidate" : ""}`}
            style={{ "--p7-arrival-progress": arrival } as CSSProperties}
            aria-hidden={rank >= 0 && arrival >= 0.999 ? true : undefined}
            title={`${sample.id}${rank >= 0 ? ` · Herding 保留次序 ${rank + 1}` : " · 完整新类数据中的候选"}`}
          >{sample.id}</span>;
        })}
      </div>
    </div>
  </div>;
}

function MemoryManagement({ stage, progress }: { stage: number; progress: number }) {
  const occupancy = stage === 0 ? MEMORY_BUDGET
    : stage === 1 ? Math.round(MEMORY_BUDGET - (MEMORY_BUDGET - 6) * progress)
      : stage === 2 ? Math.round(6 + (MEMORY_BUDGET - 6) * progress)
        : COMMITTED_MEMORY_SIZE;
  const committed = stage >= 3;
  const meterLabel = stage === 0 ? "P_before · 旧记忆完整"
    : stage === 1 ? "旧类尾部移出中"
      : stage === 2 ? "新类 exemplar 补入中"
        : "P_after · 本轮记忆已提交";

  return <section className="p7-memory-panel" aria-label="增量更新后的 exemplar 记忆管理">
    <header className="p7-panel-heading"><div><span className="eyebrow">MEMORY · K = {MEMORY_BUDGET}</span><h3>{committed ? "当前保留的原始图片" : "有序旧记忆与新类候选"}</h3></div><span className="p7-memory-count">{occupancy} / {MEMORY_BUDGET}</span></header>
    <div className="p7-memory-meter" role="progressbar" aria-label="固定预算中的已占用 exemplar 槽位" aria-valuemin={0} aria-valuemax={MEMORY_BUDGET} aria-valuenow={occupancy}>
      <span style={{ width: `${(occupancy / MEMORY_BUDGET) * 100}%` }} />
    </div>
    <div className="p7-memory-meter-label"><span>{meterLabel}</span><span>{committed ? "6 类 × 2 张" : stage === 2 ? "3 类 × 2 张将入槽" : "K = 图片总数"}</span></div>
    <div className="p7-memory-group">
      <div className="p7-memory-group__heading"><b>旧类前缀</b><span>左到右沿用 P_before 顺序</span></div>
      {OLD_CLASS_IDS.map((classId) => <OldMemoryRow key={classId} classId={classId} stage={stage} progress={progress} />)}
    </div>
    <div className="p7-memory-group p7-memory-group--incoming">
      <div className="p7-memory-group__heading"><b>新类完整数据</b><span>每类 6 张 · Herding 取前 2</span></div>
      {INCOMING_CLASS_IDS.map((classId) => <NewMemoryRow key={classId} classId={classId} stage={stage} progress={progress} />)}
    </div>
    <p className="p7-memory-footnote">旧类只截断现有有序列表；D、E、F 的入选身份来自本轮运行时 Herding 结果。</p>
  </section>;
}

function ModelState() {
  return <section className="p7-model-panel" aria-label="训练更新后保留的模型状态">
    <div className="p7-model-panel__identity">
      <div className="p7-model-panel__heading"><span className="eyebrow">CURRENT MODEL</span><span className="p7-model-badge">更新完成</span></div>
      <div className="p7-model-symbol"><span>当前参数</span><b>Θ<sub>after</sub></b><strong>φ<sub>Θ after</sub></strong></div>
      <small>共享特征提取器已更新；训练 head 仍保留。</small>
    </div>
    <div className="p7-temporary-state"><span>本轮训练对象 · 退出预测焦点</span><div><b>D</b><b>Q</b><b>targets</b><b>loss</b></div><small>整理记忆与最终预测不再读取这些训练对象。</small></div>
    <div className="p7-persistent-state"><span>跨阶段保留</span><div><b>Θ</b><i>+</i><b>P</b></div><small>网络参数与原始 exemplar 图片共同持久。</small></div>
  </section>;
}

function PrototypeKey() {
  return <div className="p7-prototype-key" aria-label="六类原型图例">
    {ALL_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}><i>{CLASS_VISUALS[classId].glyph}</i>{CLASS_VISUALS[classId].displayLabel}</span>)}
  </div>;
}

function FeatureStage({ stage, progress }: { stage: number; progress: number }) {
  if (stage < 3) {
    const guidance = stage === 0
      ? "旧 prototype 仍处在更新前的特征位置；先整理记忆，再用 Θ_after 重建当前原型。"
      : stage === 1
        ? "这一段只改变旧列表成员；成员还在调整时，不重建原型。"
        : "新类 exemplar 正在加入 P_after；名单固定后，再用当前 φ_Θ_after 统一编码。";
    return <section className="p7-feature-panel p7-feature-panel--waiting" aria-label="后续特征空间步骤">
      <header className="p7-panel-heading"><div><span className="eyebrow">FEATURE SPACE</span><h3>当前步骤：整理 P</h3></div><span className="p7-feature-status">第 4 段重建</span></header>
      <div className="p7-feature-placeholder" data-readiness={stage < 2 ? "pending-memory" : "memory-ready"}>
        <span>当前特征提取器</span><b>φ<sub>Θ after</sub></b>
        <strong>{stage < 2 ? "P_after 尚未就绪" : "P_after 已就绪 · 原型待重建"}</strong>
        <small>{guidance}</small>
      </div>
    </section>;
  }

  const normalizedProgress = stage === 3 ? clamp01(progress / 0.42) : 1;
  const easedMotion = normalizedProgress * normalizedProgress * (3 - 2 * normalizedProgress);
  const otherSamplesOpacity = stage === 3 ? clamp01((progress - 0.42) / 0.16) : 1;
  const prototypesOpacity = stage === 3 ? clamp01((progress - 0.62) / 0.16) : 1;
  const queryRevealProgress = stage === 4 ? clamp01(progress / 0.2) : undefined;
  const comparisonProgress = stage === 4 ? clamp01((progress - 0.2) / 0.55) : undefined;
  const nearestHighlightProgress = stage === 4 ? clamp01((progress - 0.75) / 0.15) : undefined;
  const predictionRevealProgress = stage === 4 ? clamp01((progress - 0.9) / 0.1) : 0;
  const motionStyle = {
    "--p7-other-samples-opacity": otherSamplesOpacity,
    "--p7-prototypes-opacity": prototypesOpacity,
  } as CSSProperties;
  const showQuery = stage === 4;

  return <section className={`p7-feature-panel p7-feature-panel--chart${stage === 3 ? " is-rebuilding" : ""}${showQuery ? " is-querying" : ""}`} style={motionStyle} aria-label={showQuery ? "六类当前 prototype 与最近原型 query" : "同一 exemplar 在更新前后特征表示中的位置与当前 prototype"}>
    <FeatureSpaceWorkbench
      mode={showQuery ? "inference" : "prototypes"}
      title={showQuery ? "Query 与六类当前 prototype" : "同一 exemplar 在 φ_before / φ_after 中的位置"}
      description={showQuery
        ? "固定教学坐标的 Query 进入图中，随后按真实距离逐个比较当前 P_after 原型；入场移动表示进入比较流程，不是编码轨迹。"
        : "同一张旧类 exemplar 的原始图片不动；只有特征位置从固定 before 端点对照到当前 after 端点。"}
      points={currentPoints}
      previousPoints={stage === 3 ? trackedBeforePoints : []}
      motionProgress={stage === 3 ? easedMotion : undefined}
      prototypes={PROTOTYPES}
      query={showQuery ? QUERY_FEATURE : undefined}
      queryLabelOffset={showQuery ? { dx: -14, dy: 28, anchor: "end" } : undefined}
      queryRevealProgress={queryRevealProgress}
      comparisonProgress={comparisonProgress}
      completedComparisonOpacity={0.68}
      nearestHighlightProgress={nearestHighlightProgress}
      unitCircle
      markerScale={stage === 3 ? 0.92 : 0.82}
      showSampleLabels={false}
      focusableSamples={false}
      asideContent={showQuery ? <>
        <PrototypeKey />
        {predictionRevealProgress > 0
          ? <div className="p7-query-result" aria-live="polite" style={{ opacity: predictionRevealProgress }}><span>最近原型 · 与 P9 共享同一 Query</span><b><i style={classAccent(QUERY_PREDICTION)}>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i>{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</b><small>距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 比较全部 6 类</small></div>
          : <div className="p7-query-pending" aria-live="polite"><b>{progress < 0.2 ? "Query 正在进入当前特征空间" : progress < 0.75 ? `已比较 ${Math.min(6, Math.floor(comparisonProgress! * 6))} / 6 个原型` : "六类距离已比较，突出最近距离后揭示类别"}</b><small>Query 采用固定教学坐标；入场只表示进入比较流程。</small></div>}
        {predictionRevealProgress > 0 ? <p className="p7-feature-note">最终分类依据是最近 exemplar 均值；Training Head 保留在网络中，但不读取其 argmax。</p> : null}
      </> : <>
        <div className="p7-tracked-key"><span>本段追踪的同一批旧图</span><b>{trackedSamples.map((sample) => sample.id).join(" · ")}</b><small>空心点与虚线为 φ_before 参照；实心点使用当前 φ_after 坐标。</small></div>
        <PrototypeKey />
        <p className="p7-feature-note">固定端点和直线过渡仅用于表示对照；这不是由训练过程采样得到的连续轨迹。</p>
      </>}
    />
  </section>;
}

function ResponsibilitySummary() {
  return <section className="p7-responsibility" aria-label="训练与预测的简明职责对照">
    <header><span className="eyebrow">ONE MODEL · TWO USES</span><h2>训练头参与学习，最近原型负责最终分类</h2></header>
    <div className="p7-responsibility__grid">
      <div><span>TRAIN · 本轮更新</span><b>D + Q + 标签 → 六节点 BCE → 更新 Θ 与训练 head</b></div>
      <div><span>PREDICT · 最终推断</span><b>Θ_after + P_after → 六类原型 → Query 最近邻</b></div>
    </div>
    <p>持久状态：Θ、保留在网络中的训练 head、原始图片 P。D、Q、targets 与 loss 是本轮训练对象；最终预测不取训练 head 的 argmax。</p>
  </section>;
}

function FlowArrow({ label }: { label?: string }) {
  return <div className="p7-preview-arrow" aria-hidden="true">
    {label ? <span>{label}</span> : null}
    <svg viewBox="0 0 68 20" focusable="false">
      <path d="M2 10h58" />
      <path d="m53 3 9 7-9 7" />
    </svg>
  </div>;
}

function PageSevenPreview({ onInspect, onPlay }: { onInspect: () => void; onPlay: () => void }) {
  return <section className="p7-preview" aria-labelledby="p7-preview-title">
    <header className="p7-preview__heading">
      <div>
        <span className="eyebrow">TWO CHANGES · ONE CURRENT SPACE</span>
        <h2 id="p7-preview-title">模型更新后，为什么不能沿用旧 Prototype？</h2>
      </div>
      <p>类别增加会改变记忆配额；参数更新会改变特征坐标。两件事必须分别处理，最后才能在同一个当前空间里预测。</p>
    </header>

    <div className="p7-preview__changes">
      <article className="p7-preview-change p7-preview-change--memory">
        <header><span>变化 A · 容量</span><h3>总预算固定，重组原始图片记忆</h3></header>
        <div className="p7-preview-memory-merge" aria-label="旧类截尾与新类 Herding 两条独立来源汇入 P_after">
          <div className="p7-preview-memory-branches">
            <div className="p7-preview-memory-branch p7-preview-memory-branch--old" data-memory-source="old-prefix">
              <div className="p7-preview-node">
                <small>P_before · 旧类有序 Exemplar</small>
                <div className="p7-preview-prefixes" aria-label="旧类列表保留前缀并截去尾项">
                  {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}><b>{CLASS_VISUALS[classId].glyph}</b><i /><i /><s /><s /></span>)}
                </div>
              </div>
              <FlowArrow label="按新配额截尾" />
              <div className="p7-preview-node p7-preview-node--operation"><small>旧类支路</small><strong>保留旧类前缀</strong></div>
            </div>
            <div className="p7-preview-memory-branch p7-preview-memory-branch--new" data-memory-source="new-herding">
              <div className="p7-preview-node"><small>X_new</small><strong>本轮新类完整数据</strong></div>
              <FlowArrow label="φ_after 下 Herding" />
              <div className="p7-preview-node p7-preview-node--operation"><small>新类支路</small><strong>选新类代表样本</strong></div>
            </div>
          </div>
          <svg className="p7-preview-memory-merge__join" viewBox="0 0 58 168" aria-hidden="true"><path d="M2 36h19q14 0 14 18v30m-33 48h19q14 0 14-18V84h20m-8-8 8 8-8 8" /></svg>
          <div className="p7-preview-node p7-preview-node--result"><small>全部已学类的原图记忆</small><strong>P_after</strong><span>6 类 × 2 张</span></div>
            </div>
        <p>旧类保留原列表前缀；新类从本轮完整数据中选入代表样本。</p>
      </article>

      <article className="p7-preview-change p7-preview-change--space">
        <header><span>变化 B · 表示</span><h3>特征提取器更新，重建当前 Prototype</h3></header>
        <div className="p7-preview-flow p7-preview-flow--space">
          <div className="p7-preview-node p7-preview-node--result"><small>保存的是原图</small><strong>P_after</strong></div>
          <FlowArrow label="重新编码" />
          <div className="p7-preview-node p7-preview-node--extractor"><small>当前提取器</small><strong>φ_after</strong></div>
          <FlowArrow label="逐类均值" />
          <div className="p7-preview-node">
            <small>当前 Prototype</small>
            <div className="p7-preview-prototypes">{ALL_CLASS_IDS.map((classId) => <i key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph}</i>)}</div>
          </div>
        </div>
        <p><strong>P_after 保存的是原始图片，不是永久不变的特征坐标。</strong>特征提取器更新后，需用 φ_after 对这些原图重新编码，才能让 Prototype 与当前 Query 的特征处在同一表示中。</p>
      </article>
    </div>

    <div className="p7-preview__prediction">
      <span className="eyebrow">PREDICTION · 汇合到当前空间</span>
      <div className="p7-preview__prediction-flow">
        <b>Query</b><FlowArrow label="φ_after" /><b>当前特征</b><FlowArrow label="比较距离" /><b>当前 Prototype</b><FlowArrow label="argmin" /><strong>NME 预测</strong>
      </div>
      <p>本次预测不写回状态；交给下一轮的是 <b>Θ_after + P_after</b>。</p>
    </div>

    <footer className="p7-preview__footer">
      <p><b>接下来观察</b>固定 K 下旧类截去尾项、新类补入图片；随后用更新后的特征提取器重建 Prototype，Query 再在当前空间比较距离。<span><b>本例设置</b>K=12；旧类每类 4 → 2，新类 D / E / F 各选 2。</span></p>
      <div><button type="button" className="icarl-button icarl-button--quiet" onClick={onInspect}>查看分阶段工作台</button><button type="button" className="icarl-button icarl-button--primary" onClick={onPlay}>▶ 完整播放</button></div>
    </footer>
  </section>;
}

export function PageSeven({ onContinue }: { onContinue?: () => void }) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion, autoPlay: false });
  const [playMode, setPlayMode] = useState<"all" | "phase">("phase");
  const workbenchRef = useRef<HTMLElement | null>(null);
  const stage = state.clipIndex;
  const step = steps[stage];
  const currentAction = stage === 0 ? "确认 Θ_after 是给定的训练后状态，旧 P_before 原图仍完整保留。"
    : stage === 1 ? state.progress < 0.8 ? "按原有顺序移出 A、B、C 各自的尾部两项。" : "旧类各保留前两项，六个记忆位置已经释放。"
    : stage === 2 ? `按当前表示读取新类 Herding 顺序，正在补入第 ${Math.min(6, Math.max(1, Math.ceil(state.progress * 6)))} / 6 张新 exemplar。`
    : stage === 3 ? state.progress < 0.7 ? "用 φ_after 重新编码 P_after 中同一批原始图片。" : "六类当前 Prototype 正由各自两张保留图片的当前特征形成。"
    : state.progress < 0.2 ? "Query 正在进入当前特征空间。" : state.progress < 0.82 ? `正在累积六类真实距离：${Math.min(6, Math.floor(((state.progress - 0.2) / 0.62) * 6))} / 6。` : "六条距离已经齐备，现在高亮 argmin 并揭示预测。";
  const stageOutputs = [
    "Θ_after 与仍完整的 P_before。",
    "A、B、C 各两张的旧类前缀。",
    "共 12 张原始图片的 P_after。",
    "由当前表示计算的六个类别 Prototype。",
    "Query 的六类距离与最近原型预测。",
  ] as const;

  function goToStage(index: number) {
    setPlayMode("phase");
    controls.goToClip(index, { autoPlay: false });
  }

  useEffect(() => {
    if (playMode === "phase" && state.status === "playing" && state.isHolding) controls.pause();
  }, [controls.pause, playMode, state.isHolding, state.status]);

  function togglePlayback() {
    if (state.status === "playing") {
      controls.pause();
      return;
    }
    if (reducedMotion) return;
    if (stage === 0) {
      setPlayMode("phase");
      controls.goToClip(FIRST_VISIBLE_MOTION_STEP, { autoPlay: true });
      return;
    }
    if (state.isHolding || state.status === "finished") {
      setPlayMode("phase");
      controls.replayClip();
      return;
    }
    controls.play();
  }

  function replayStage() {
    setPlayMode("phase");
    controls.replayClip();
  }

  function playAll() {
    if (reducedMotion) return;
    setPlayMode("all");
    controls.goToClip(FIRST_VISIBLE_MOTION_STEP, { autoPlay: true });
  }

  function focusWorkbench({ play = false }: { play?: boolean } = {}) {
    workbenchRef.current?.scrollIntoView({ behavior: play || reducedMotion ? "auto" : "smooth", block: "start" });
    if (play) window.requestAnimationFrame(playAll);
  }

  return <article className="tutorial-page icarl-page icarl-page--p7" data-stage={step.id} data-progress={state.progress.toFixed(2)} data-default-display-only={(stage === 0).toString()}>
    <header className="page-heading icarl-page__heading p7-heading">
      <div className="icarl-page__eyebrow"><span>PAGE 07</span><i /> POST-UPDATE MEMORY · CURRENT PROTOTYPES</div>
      <h1>模型更新后，记忆与 Prototype 要怎样一起更新？</h1>
      <p>P6 得到了新的共享网络。现在要同时解决两种变化：类别更多但总记忆预算不变；特征提取器更新后，旧图片的坐标也可能改变。</p>
    </header>

    <PageSevenPreview onInspect={() => focusWorkbench()} onPlay={() => focusWorkbench({ play: true })} />

    <section ref={workbenchRef} className="p7-workbench" aria-label="参数更新后的记忆交接与预测工作台">
      <header className="p7-workbench__guide">
        <div><span className="eyebrow">PHASE {String(stage + 1).padStart(2, "0")} / 05</span><h2>{step.title}</h2><p aria-live="polite"><strong>当前动作：</strong>{currentAction}</p><small>完成后：{stageOutputs[stage]}</small></div>
        <span className={`p7-playback-status p7-playback-status--${state.status}`}>{state.status === "playing" ? "动画运行中" : state.status === "finished" ? "本轮交接完成" : reducedMotion ? "减少动态效果 · 可逐段查看" : "已暂停 · 可逐段查看"}</span>
      </header>

      <nav className="p7-stage-nav" aria-label="训练后记忆交接步骤">
        <div className="p7-stage-nav__track" aria-hidden="true">
          {steps.slice(0, -1).map((_, index) => <i key={index} className="p7-stage-nav__segment" style={{ gridColumn: `${index + 1}` }}><span style={{ width: `${clamp01(stage - index) * 100}%` }} /></i>)}
        </div>
        {steps.map((item, index) => <button key={item.id} type="button" className={`p7-stage-nav__step${index === stage ? " is-current" : index < stage ? " is-complete" : ""}`} aria-current={index === stage ? "step" : undefined} onClick={() => goToStage(index)}>
          <span>{String(index + 1).padStart(2, "0")}</span><b>{item.short}</b>
        </button>)}
      </nav>

      <div className="p7-state-workbench">
        <ModelState />
        <MemoryManagement stage={stage} progress={state.progress} />
        <FeatureStage stage={stage} progress={state.progress} />
      </div>

      <footer className="p7-playback-controls" aria-label="P7 记忆交接动画控制">
        <button type="button" className="icarl-button icarl-button--quiet" onClick={() => goToStage(stage - 1)} disabled={!state.hasPrevious}>← 上一阶段</button>
        <div className="p7-playback-controls__center">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={togglePlayback} disabled={reducedMotion} aria-label={state.status === "playing" ? "暂停动画" : "播放记忆交接"}>{reducedMotion ? "逐步查看" : state.status === "playing" ? "Ⅱ 暂停" : state.elapsedMs > 0 && !state.isHolding ? "▶ 继续播放" : "▶ 播放本阶段"}</button>
          <button type="button" className="icarl-button icarl-button--quiet" onClick={replayStage} disabled={reducedMotion}>↺ 重播本阶段</button>
          <button type="button" className="icarl-button icarl-button--quiet" onClick={playAll} disabled={reducedMotion}>▶ 完整播放</button>
          <span>{reducedMotion ? "逐阶段显示结果" : `${playMode === "all" ? "全程" : "本阶段"} · ${state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}`}</span>
        </div>
        <button type="button" className="icarl-button icarl-button--primary" onClick={() => goToStage(stage + 1)} disabled={stage >= steps.length - 1}>下一阶段 <b aria-hidden="true">→</b></button>
      </footer>
    </section>

    {stage === steps.length - 1 ? <ResponsibilitySummary /> : null}

    <section className="p7-next-step" aria-label="从训练后交接到论文证据">
      <div className="p7-next-step__mark" aria-hidden="true"><span>P_after</span><svg viewBox="0 0 52 20"><path d="M2 10h42" /><path d="m37 3 9 7-9 7" /></svg><span>μ_current</span></div>
      <div><span className="eyebrow">NEXT · 从机制到证据</span><p>
        <strong><b>本页结论</b>记忆按容量重组，Prototype 在当前表示空间重建，模型继续用最近 Prototype 预测。</strong>
        <span><b>已经打通</b>至此，iCaRL 从新类到达、模型更新到训练后预测的完整机制已经闭合。</span>
        <span><b>下一页转向</b>回到论文实验与边界，检验这种设计的实际效果、代价与成立前提。</span>
      </p></div>
      <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>查看论文证据与边界 <b aria-hidden="true">→</b></button>
    </section>
  </article>;
}
