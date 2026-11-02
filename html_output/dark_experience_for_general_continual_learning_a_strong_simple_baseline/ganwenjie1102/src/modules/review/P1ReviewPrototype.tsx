import { useId, useState } from "react";
import { PelicanIllustration } from "../PelicanIllustration";
import { DER_PLUS_MEMORY as PLUS_MEMORY } from "../der-plus-example";
import ModelPixel, { MODEL_CLASSES, type ModelClass } from "./ModelPixel";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import { RESERVOIR_INPUTS, RESERVOIR_STEPS, reservoirSceneAt, type MemoryRecord } from "../reservoir-model";
import { forward, runTraining, viewOf } from "../training-model";
import { curve, mix, windowAt } from "./lifecycle-model";
import "./animation.css";
import "./p1-review.css";

type SceneId = "reservoir" | "augmentation" | "der-plus";
const AUGMENTATION_STEPS = runTraining("DER");
const SCENES: readonly { id: SceneId; number: string; label: string; summary: string }[] = [
  { id: "reservoir", number: "01", label: "有限记忆", summary: "一条流 · 两个槽 · 同槽替换或离开" },
  { id: "augmentation", number: "02", label: "增强视图", summary: "同一原图 · 不同视图 · 冻结目标" },
  { id: "der-plus", number: "03", label: "DER++", summary: "两次读取 · 三种监督 · 一次更新" },
];
const RESERVOIR_P1_CLIPS = [
  { id: "x₁ 进入空槽", durationMs: 1600, holdMs: 700 },
  { id: "x₂ 填满两格", durationMs: 1600, holdMs: 700 },
  { id: "x₃ 替换同一槽", durationMs: 1900, holdMs: 800 },
  { id: "x₄ 拒收但继续计数", durationMs: 1900, holdMs: 800 },
] as const;
const AUGMENTATION_P1_CLIPS = [
  { id: "保留同一原图", durationMs: 1500, holdMs: 600 },
  { id: "保存视图并冻结 z", durationMs: 1600, holdMs: 650 },
  { id: "未来回放生成新视图", durationMs: 1800, holdMs: 650 },
  { id: "换视图，对照同一目标", durationMs: 1800, holdMs: 800 },
] as const;

function parseScene(value: string | null | undefined): SceneId {
  return SCENES.some((scene) => scene.id === value) ? value as SceneId : "reservoir";
}

function SampleMark({ model, size = 34, x = 0, y = 0 }: { model: ModelClass; size?: number; x?: number; y?: number }) {
  return <svg className="p1-sample-mark" x={x} y={y} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${MODEL_CLASSES[model]} 合成样本图标`}>
    <ModelPixel model={model} x={8} y={8} size={48} />
  </svg>;
}

function P1ReviewPrototype({ initialScene }: { initialScene?: string | null }) {
  const active = parseScene(initialScene);
  const scene = SCENES.find((item) => item.id === active)!;
  return <div className="p1-review">
    <header className="p1-review-header">
      <a className="p1-wordmark" href="./" aria-label="返回 DER 正文"><span>DER</span><small>W9 · P1 REVIEW</small></a>
      <div className="p1-heading-copy"><p className="p1-kicker">VISUAL DIRECTION / {scene.number}</p><h1>{scene.summary}</h1></div>
      <nav className="p1-scene-nav" aria-label="三个待审方向">
        {SCENES.map((item) => <a key={item.id} href={`./p1-review.html?scene=${item.id}`} aria-current={active === item.id ? "page" : undefined}>
          <span>{item.number}</span>{item.label}
        </a>)}
      </nav>
    </header>
    <main className={`p1-review-main p1-review-${active}`}>
      <div className="p1-review-banner"><span>独立设计原型 · 不改发布主线</span><span>1440 × 900 / 1920 × 1080</span></div>
      {active === "reservoir" ? <ReservoirPrototype /> : active === "augmentation" ? <AugmentationPrototype /> : <DERPlusPrototype />}
      <footer className="p1-review-footer">方向稿只验证画面与教学顺序。计算内核、论文数值与已认可场景保持原样；合成视觉和小模型数值均明确标注。</footer>
    </main>
  </div>;
}

function RecordTile({ record, x, y, opacity = 1 }: { record: MemoryRecord; x: number; y: number; opacity?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity} data-p1-record={record.id} data-frozen-z={record.z.join(",")}>
    <rect className="p1-record-card" width="278" height="88" rx="11" />
    <SampleMark model={record.model} size={42} x={8} y={12} />
    <text x="58" y="25" className="p1-svg-overline">{record.id} · 原图随记录保留</text>
    <text x="58" y="47" className="p1-svg-title">冻结响应 z</text>
    {record.z.map((value, index) => <g key={index}>
      <rect x={58 + index * 67} y="56" width="59" height="24" rx="5" className={`p1-svg-tone p1-svg-tone-${index}`} />
      <text x={87 + index * 67} y="73" textAnchor="middle" className="p1-svg-value">{value}</text>
    </g>)}
  </g>;
}

function ReservoirToken({ record, x, y, label, detail, rejected = false }: {
  record: MemoryRecord;
  x: number;
  y: number;
  label: string;
  detail: string;
  rejected?: boolean;
}) {
  return <g transform={`translate(${x} ${y})`} className={`p1-reservoir-token${rejected ? " is-rejected" : ""}`}>
    <rect width="154" height="52" rx="10" />
    <SampleMark model={record.model} size={32} x={8} y={10} />
    <text x="47" y="22" className="p1-token-title">{label}</text>
    <text x="47" y="39" className="p1-token-detail">{detail}</text>
  </g>;
}

function ReservoirPrototype() {
  const clips = RESERVOIR_P1_CLIPS;
  const timeline = useSceneTimeline(clips);
  const { clipIndex: index, progress } = timeline.state;
  const step = RESERVOIR_STEPS[index];
  const scene = reservoirSceneAt(index, progress);
  const slotX = [250, 590] as const;
  const slotY = 324;
  const slotWidth = 300;
  const slotCenter = [400, 740] as const;
  const streamX = [132, 352, 572, 792] as const;
  const gate = { x: 420, y: 157, width: 300, height: 102 };
  const exitBay = { x: 24, y: 340, width: 180, height: 108 };
  const rejectBay = { x: 916, y: 340, width: 180, height: 108 };
  const gateCenter = gate.x + gate.width / 2;
  const accepted = step.slot !== null;
  const destinationCenter = step.slot === null ? null : slotCenter[step.slot];
  const candidate = step.candidate;
  const committed = scene.committed;
  const visibleMemory = committed ? step.after.M : step.before.M;
  const seen = committed ? step.after.N : step.before.N;
  const drawn = step.j !== undefined && progress > .1;
  const replacementExit = windowAt(progress, .3, .54);
  const candidateFlight = windowAt(progress, .42, .88);
  const sourceX = streamX[index];
  const feedX = sourceX < gate.x ? gate.x : sourceX > gate.x + gate.width ? gate.x + gate.width : sourceX;
  const feedPath = `M${sourceX} 124 C${mix(sourceX, feedX, .42)} 137 ${mix(sourceX, feedX, .78)} 145 ${feedX} ${gate.y}`;
  const outputPath = destinationCenter === null
    ? null
    : `M${gateCenter} ${gate.y + gate.height} C${mix(gateCenter, destinationCenter, .28)} 284 ${mix(gateCenter, destinationCenter, .76)} 294 ${destinationCenter} ${slotY}`;
  const rejectPath = `M${gate.x + gate.width} ${gate.y + 63} C790 244 866 278 ${rejectBay.x + 21} ${rejectBay.y}`;
  const evictPath = `M${slotX[0]} ${slotY + 66} C238 390 220 398 ${exitBay.x + exitBay.width} ${exitBay.y + 66}`;
  const exitScale = mix(1, .57, replacementExit);
  const exitCenter = curve(replacementExit,
    { x: slotCenter[0], y: slotY + 66 },
    { x: 342, y: 349 },
    { x: 245, y: 408 },
    { x: exitBay.x + exitBay.width / 2, y: exitBay.y + 66 });
  const exitX = exitCenter.x - 139 * exitScale;
  const exitY = exitCenter.y - 44 * exitScale;
  const acceptedOrigin = destinationCenter === null ? null : curve(candidateFlight,
    { x: gateCenter - 77, y: gate.y + gate.height - 8 },
    { x: gateCenter - 77, y: gate.y + gate.height + 25 },
    { x: destinationCenter - 77, y: slotY - 28 },
    { x: destinationCenter - 77, y: slotY + 26 });
  const rejectedOrigin = curve(candidateFlight,
    { x: gate.x + gate.width - 80, y: gate.y + 46 },
    { x: 778, y: gate.y + 58 },
    { x: 880, y: rejectBay.y + 8 },
    { x: rejectBay.x + 13, y: rejectBay.y + 42 });

  return <section className="p1-scene p1-reservoir" data-p1-scene="reservoir" data-clip={index} data-progress={progress} data-decision={step.decision} data-committed={committed}>
    <div className="p1-scene-heading">
      <div><p className="p1-kicker">S4 / RESERVOIR</p><h2>新记录沿流而来；有限记忆只开两个槽。</h2><p>每个候选先完成本步训练，再参加选留。抽中的槽决定谁离开，拒收只改变计数，不撤销本步训练。</p></div>
      <div className="p1-metric-strip" aria-label="当前记忆状态">
        <span><small>固定容量</small><b>K <i>2</i></b></span>
        <span><small>处理流项</small><b>N <i data-p1-count>{seen}</i></b></span>
        <span><small>已存记录</small><b>|M| <i data-p1-size>{visibleMemory.length}</i></b></span>
      </div>
    </div>
    <SceneTransport timeline={timeline} clips={clips} label="有限记忆 Reservoir" showTiming={false} caption="沿同一条流前进；记忆槽保持固定身份，选留之后继续下一项。" />
    <div className="p1-reservoir-frame">
      <svg className="p1-reservoir-svg" viewBox="0 0 1120 500" role="img" aria-label="候选经过选留决策后写入固定记忆槽，替换的旧记录和拒收候选分别离池">
        <defs>
          <marker id="p1-stream-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#849a88"/></marker>
          <marker id="p1-feed-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#4f8062"/></marker>
          <marker id="p1-store-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#397554"/></marker>
          <marker id="p1-away-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#ad7c4e"/></marker>
        </defs>
        <text x="54" y="34" className="p1-flow-heading">持续输入流</text>
        <g transform="translate(850 25)" className="p1-flow-legend">
          <path d="M0 8H36" className="p1-legend-store" markerEnd="url(#p1-store-arrow)"/><text x="45" y="12">写入</text>
          <path d="M94 8H130" className="p1-legend-away" markerEnd="url(#p1-away-arrow)"/><text x="139" y="12">离池</text>
        </g>
        <path d="M74 93H1040" className="p1-stream-track" markerEnd="url(#p1-stream-arrow)" />
        {RESERVOIR_INPUTS.map((record, itemIndex) => <g key={record.id} className={`p1-stream-item${itemIndex === index ? " is-current" : itemIndex < index ? " is-past" : ""}`} transform={`translate(${streamX[itemIndex]} 94)`}>
          <text y="-42" textAnchor="middle" className="p1-stream-id">{record.id}</text>
          <circle r="28" className="p1-stream-orbit" />
          <SampleMark model={record.model} size={36} x={-18} y={-18} />
        </g>)}

        <path d={feedPath} className="p1-candidate-feed" markerEnd="url(#p1-feed-arrow)" />
        {outputPath && <path d={outputPath} className="p1-route-accepted" markerEnd="url(#p1-store-arrow)" />}
        {step.slot === null && <path d={rejectPath} className="p1-route-away" markerEnd="url(#p1-away-arrow)" />}
        {step.evicted && <path d={evictPath} className="p1-route-away" markerEnd="url(#p1-away-arrow)" />}

        <g transform={`translate(${gate.x} ${gate.y})`} className="p1-decision-card">
          <rect width={gate.width} height={gate.height} rx="13" />
          <path d={`M0 34H${gate.width}`} className="p1-decision-divider" />
          <text x="18" y="23" className="p1-decision-kicker">{step.j === undefined ? "空槽优先" : "满池后抽签"}</text>
          <text x="18" y="65" className="p1-decision-result">{step.j === undefined ? `直写 SLOT ${step.slot}` : `j = ${drawn ? step.j : "…"}`}</text>
          <text x="18" y="86" className="p1-decision-note">{step.j === undefined ? "无需抽签" : `候选范围 0—${step.before.N}`}</text>
          {step.j !== undefined && Array.from({ length: step.before.N + 1 }, (_, choice) => <g key={choice} transform={`translate(${158 + choice * 31} 49)`}>
            <rect width="25" height="26" rx="7" className={`p1-draw-choice${drawn && choice === step.j ? step.slot === null ? " is-away" : " is-selected" : ""}`} />
            <text x="12.5" y="17" textAnchor="middle" className="p1-draw-number">{choice}</text>
          </g>)}
        </g>

        <text x={slotX[0]} y="300" className="p1-memory-heading">M · 固定容量 K = 2</text>
        {[0, 1].map((slot) => {
          const record = visibleMemory[slot];
          const isTarget = accepted && step.slot === slot;
          const isLeaving = !committed && Boolean(step.evicted && record?.id === step.evicted.id && replacementExit > .04);
          const status = record ? isLeaving ? "移出中" : isTarget && committed ? "刚写入" : "保留" : isTarget ? "等待写入" : "空槽";
          return <g key={slot} transform={`translate(${slotX[slot]} ${slotY})`}>
            <rect width={slotWidth} height="122" rx="14" className={`p1-memory-slot${record ? " is-occupied" : ""}${isTarget ? " is-target" : ""}`} />
            <text x="15" y="21" className="p1-slot-label">MEMORY · SLOT {slot}</text>
            <text x={slotWidth - 14} y="21" textAnchor="end" className={`p1-slot-status${isTarget ? " is-target" : ""}`}>{status}</text>
            {!record && <g transform={`translate(${slotWidth / 2} 74)`} className="p1-empty-slot">
              <circle r="12" /><path d="M-5 0H5M0 -5V5" />
              <text x="20" y="4">候选到达后写入</text>
            </g>}
          </g>;
        })}
        <g transform={`translate(${exitBay.x} ${exitBay.y})`} className="p1-sink p1-sink-evicted">
          <rect width={exitBay.width} height={exitBay.height} rx="12" />
          <text x="13" y="20" className="p1-sink-title">移出记忆池</text>
          <text x={exitBay.width - 13} y="20" textAnchor="end" className="p1-sink-mark">M OUT</text>
          {!step.evicted && <text x="13" y="68" className="p1-sink-empty">本步没有旧记录离开</text>}
          {step.evicted && <g opacity={committed ? 1 : windowAt(progress, .43, .62)}>
            <ReservoirToken record={step.evicted} x={13} y={42} label={`${step.evicted.id} 离池`} detail={`原 slot ${step.slot}`} />
          </g>}
        </g>
        <g transform={`translate(${rejectBay.x} ${rejectBay.y})`} className="p1-sink p1-sink-rejected">
          <rect width={rejectBay.width} height={rejectBay.height} rx="12" />
          <text x="13" y="20" className="p1-sink-title">未写入记忆</text>
          <text x={rejectBay.width - 13} y="20" textAnchor="end" className="p1-sink-mark">POOL OUT</text>
          {step.slot !== null && <text x="13" y="68" className="p1-sink-empty">没有拒收候选</text>}
          {step.slot === null && <g opacity={committed ? 1 : candidateFlight}>
            <ReservoirToken record={candidate} x={13} y={42} label={`${candidate.id} 拒收`} detail={`j = ${step.j} ≥ K`} rejected />
          </g>}
        </g>

        {visibleMemory.map((record, slot) => {
          if (step.evicted?.id === record.id && !committed) {
            return <g key={`leaving-${record.id}`} transform={`translate(${exitX} ${exitY}) scale(${exitScale})`} opacity={1 - replacementExit} className="p1-moving-evicted">
              <RecordTile record={record} x={0} y={0} />
            </g>;
          }
          return <RecordTile key={`${record.id}-${slot}`} record={record} x={slotX[slot] + 11} y={slotY + 29} />;
        })}
        {accepted && !committed && candidateFlight > 0 && acceptedOrigin && <g transform={`translate(${acceptedOrigin.x} ${acceptedOrigin.y})`}>
          <ReservoirToken record={candidate} x={0} y={0} label={`${candidate.id} 新记录`} detail="准备写入同一槽" />
        </g>}
        {step.slot === null && !committed && candidateFlight > 0 && <g transform={`translate(${rejectedOrigin.x} ${rejectedOrigin.y})`}>
          <ReservoirToken record={candidate} x={0} y={0} label={`${candidate.id} 候选`} detail="离开记忆流" rejected />
        </g>}
      </svg>
    </div>
    <div className="p1-reservoir-caption" aria-live="polite"><strong>{clips[index].id}</strong><span>{[
      "空槽直接收下 x₁，处理计数从 0 变成 1。",
      "第二条进入另一槽；K 固定为 2，x₁ 与其冻结 z 保持原样。",
      "抽到 j=0，x₁ 离开 slot 0，x₃ 接替同一个槽；slot 1 不动。",
      "抽到 j=3≥K，x₄ 离开记忆流；本步训练已完成，N 从 3 变成 4。",
    ][index]}</span></div>
    <div className="p1-reservoir-rule"><span>满池时</span><code>j ∼ Uniform{`{0, …, N}`}</code><span>只有 <code>j &lt; K</code> 才替换 slot <code>j</code>；否则拒收。</span></div>
  </section>;
}

function ResponseRail({ label, values, kind }: { label: string; values: readonly number[]; kind: "frozen" | "current" }) {
  const min = -0.5, max = 1.4;
  return <div className={`p1-response-rail is-${kind}`} data-response-kind={kind}>
    <div className="p1-response-title"><span>{kind === "frozen" ? "□" : "●"} {label}</span><small>{kind === "frozen" ? "保存后不再更新" : "随回放视图变化"}</small></div>
    <div className="p1-response-classes">{MODEL_CLASSES.map((name, index) => {
      const value = values[index];
      const at = Math.max(3, Math.min(97, ((value - min) / (max - min)) * 100));
      return <div className={`p1-response-class tone-${index}`} key={name}>
        <span>{name}</span><div className="p1-response-track"><i style={{ left: `${at}%` }} /><b className="p1-response-value">{value.toFixed(2)}</b></div>
      </div>;
    })}</div>
  </div>;
}

function AugmentationPrototype() {
  const clips = AUGMENTATION_P1_CLIPS;
  const timeline = useSceneTimeline(clips);
  const { clipIndex: index, progress } = timeline.state;
  const [view, setView] = useState<"center" | "flip">("center");
  const saved = AUGMENTATION_STEPS[0].candidate;
  const replayWeights = AUGMENTATION_STEPS[1].before.W;
  const replayS = view === "center" ? -1 : 1;
  const replayLogits = forward(replayWeights, viewOf(saved.u, replayS));
  const darkLoss = replayLogits.reduce((sum, value, classId) => sum + (value - saved.z[classId]) ** 2, 0);
  const savedReveal = index > 0 ? 1 : windowAt(progress, .12, .8);
  const replayReveal = index > 2 ? 1 : index < 2 ? 0 : windowAt(progress, .1, .85);
  const compareReveal = index > 3 ? 1 : index < 3 ? 0 : windowAt(progress, .12, .85);
  const imageView = view;

  return <section className="p1-scene p1-augmentation" data-p1-scene="augmentation" data-clip={index} data-progress={progress} data-view={view} data-target={saved.z.join(",")} data-loss={darkLoss}>
    <div className="p1-scene-heading">
      <div><p className="p1-kicker">S5 / AUGMENTATION</p><h2>原图身份不变；保存视图、回放视图可以不同。</h2><p>把图像中的裁剪与翻转直接展示出来，再看两次前向如何对齐同一份冻结目标。</p></div>
      <div className="p1-augmentation-key"><span className="p1-freeze-square" />旧目标 <b>z</b><span className="p1-current-dot" />当前输出 <b>a</b></div>
    </div>
    <SceneTransport timeline={timeline} clips={clips} label="增强视图与冻结目标" showTiming={false} caption="播放展示写入时和未来回放时的不同视图；可手动切换回放裁剪。" />
    <div className="p1-augmentation-stage">
      <aside className="p1-source-column">
        <div className="p1-source-index"><span>MEMORY ITEM</span><b>x₁</b></div>
        <PelicanIllustration view="original" label="同一原图 x₁：戴蓝帽、骑青绿色自行车的白色鹈鹕" />
        <strong>同一个原图 x₁</strong>
        <p>记忆保留原图身份；增强结果不会覆盖它。</p>
      </aside>
      <div className="p1-view-tracks">
        <div className="p1-view-track is-past" style={{ opacity: savedReveal }} data-p1-view-track="saved">
          <div className="p1-track-heading"><span>01 · 写入时</span><strong>旧网络 θᵢ</strong><small>保存视图 A₀(x₁)</small></div>
          <PelicanIllustration view="saved" label="写入时轻微裁剪后的同一只白色鹈鹕 A0(x1)" />
          <div className="p1-track-arrow" aria-hidden="true">→</div>
          <div className="p1-target-column"><span>更新前输出</span><b>z · 冻结副本</b><ResponseRail label="目标 z" values={saved.z} kind="frozen" /></div>
        </div>
        <div className="p1-view-track is-replay" style={{ opacity: replayReveal }} data-p1-view-track="replay">
          <div className="p1-track-heading"><span>02 · 未来回放</span><strong>当前网络 θₜ</strong><small>重新生成 A₁(x₁)</small></div>
          <div className="p1-current-image">
            <PelicanIllustration view={imageView} label={view === "center" ? "当前视图：中心裁剪后的同一只白色鹈鹕 A1(x1)" : "当前视图：水平翻转后的同一只白色鹈鹕 A1(x1)"} />
            <span>{view === "center" ? "中心裁剪" : "水平翻转 · 裁剪"}</span>
          </div>
          <div className="p1-track-arrow" aria-hidden="true">→</div>
          <div className="p1-current-output"><span>本次前向</span><b>a · 当前输出</b><ResponseRail label="回放输出 a" values={replayLogits} kind="current" /></div>
        </div>
        <div className="p1-view-controls" aria-label="切换未来回放视图">
          <span>改变回放变换</span>
          <button data-view-choice="center" aria-pressed={view === "center"} onClick={() => setView("center")}>中心裁剪 A₁(x)</button>
          <button data-view-choice="flip" aria-pressed={view === "flip"} onClick={() => setView("flip")}>水平翻转 A₁(x)</button>
        </div>
        <div className="p1-augmentation-equation" style={{ opacity: compareReveal }}>
          <div><small>两种视图，共用一个旧目标</small><strong>L<sub>dark</sub>(A₁) = ‖a − z‖²</strong></div>
          <span className="p1-loss-value">{darkLoss.toFixed(4)}</span>
          <span className="p1-fixed-target-note">z 不变 · a 与匹配损失随回放视图改变</span>
        </div>
      </div>
    </div>
    <div className="p1-augmentation-boundary"><strong>数值边界</strong><span>插图是可见的合成裁剪/翻转示意；下方 logits 与损失来自既有 W5 二维小模型，不是这只插图的 CNN 推理，也不是论文实验。</span></div>
  </section>;
}


const PLUS_CLIPS = [
  { id: "先看见错位", durationMs: 1500, holdMs: 700 },
  { id: "从同一份 M 独立读取", durationMs: 1900, holdMs: 700 },
  { id: "三种监督合成，一次更新", durationMs: 2100, holdMs: 850 },
] as const;

function DERPlusPrototype() {
  const timeline = useSceneTimeline(PLUS_CLIPS);
  const { clipIndex: index, progress } = timeline.state;
  const [sameSample, setSameSample] = useState(true);
  const readReveal = index > 1 ? 1 : index < 1 ? 0 : windowAt(progress, .08, .82);
  const lossReveal = index > 2 ? 1 : index < 2 ? 0 : windowAt(progress, .08, .75);
  const updateReveal = index > 2 ? 1 : index < 2 ? 0 : windowAt(progress, .46, .92);
  const ry = sameSample ? PLUS_MEMORY[0] : PLUS_MEMORY[1];
  const defsId = useId().replace(/:/g, "");
  const rdFlight = curve(readReveal, { x: 318, y: 157 }, { x: 342, y: 157 }, { x: 365, y: 196 }, { x: 398, y: 196 });
  const ryStart = sameSample ? { x: 318, y: 157 } : { x: 318, y: 287 };
  const ryFlight = curve(readReveal, ryStart, { x: 345, y: ryStart.y }, { x: 361, y: 326 }, { x: 398, y: 326 });

  return <section className="p1-scene p1-der-plus" data-p1-scene="der-plus" data-clip={index} data-progress={progress} data-rd="x₁" data-ry={ry.id} data-same-sample={sameSample} data-updates={updateReveal > .86 ? 1 : 0}>
    <div className="p1-scene-heading">
      <div><p className="p1-kicker">S6 / DER++</p><h2>旧响应与真实标签冲突；两次读取各司其职。</h2><p>一个回放保留旧行为，另一个回放用真实类别提供监督。三项损失共用更新前的 θ，只触发一次联合更新。</p></div>
      <div className="p1-plus-update-label"><span>本步写入时序</span><b>读取 M → 联合更新 → 才考虑写入 x₃</b></div>
    </div>
    <div className="p1-plus-conflict-strip" data-p1-conflict>
      <div className="p1-plus-sample"><SampleMark model={0} size={44} /><span><small>回放记录 x₁</small><b>真实 y = Claude</b></span></div>
      <div className="p1-conflict-arrow"><span>旧 logits z 的最高项</span><b>GPT</b><i>≠</i><span>真实标签</span><b>Claude</b></div>
      <div className="p1-conflict-vector"><span>z = (0.5, 2, 0)</span><small>□ 冻结 · 历史判断可能是错的</small></div>
      <p>匹配 z 会维持旧判断；标签 CE 才提供另一方向。</p>
    </div>
    <div className="p1-plus-controls">
      <div className="p1-plus-read-choice" role="group" aria-label="选择两次独立回放是否抽到同一条">
        <span>本轮两次独立抽样</span>
        <button data-overlap-choice="same" aria-pressed={sameSample} onClick={() => { setSameSample(true); timeline.start(1); }}>恰好重合 · x₁ / x₁</button>
        <button data-overlap-choice="different" aria-pressed={!sameSample} onClick={() => { setSameSample(false); timeline.start(1); }}>抽到不同项 · x₁ / x₂</button>
      </div>
    </div>
    <SceneTransport timeline={timeline} clips={PLUS_CLIPS} label="DER++ 两次回放与联合更新" showTiming={false} caption="Rᴅ 与 Rʏ 是两次独立读取；可能重合，也可能读到不同记录。M 在读取期间不变。" />
    <div className="p1-plus-frame">
      <svg className="p1-plus-svg" viewBox="0 0 1200 430" role="img" aria-label="当前分类、历史 logit 匹配和历史标签 CE 汇合到同一次参数更新">
        <defs>
          <marker id={`${defsId}-current`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#46815e"/></marker>
          <marker id={`${defsId}-dark`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#5c7e91"/></marker>
          <marker id={`${defsId}-label`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#b27c4a"/></marker>
        </defs>
        <rect x="26" y="35" width="306" height="357" rx="17" className="p1-plus-memory" />
        <text x="48" y="67" className="p1-plus-overline">M · 本步开始前的同一份记忆</text>
        <text x="48" y="88" className="p1-plus-small">读取只复制记录；此时 M、N 不变。</text>
        {PLUS_MEMORY.map((record, recordIndex) => {
          const y = recordIndex === 0 ? 105 : 244;
          const hasRd = record.id === "x₁";
          const hasRy = record.id === ry.id;
          return <g key={record.id} data-p1-memory-record={record.id}>
            <rect x="43" y={y} width="272" height="126" rx="12" className={`p1-plus-record${record.id === "x₁" ? " is-wrong-target" : ""}`} />
            <SampleMark model={record.model} size={38} x={54} y={y + 14} />
            <text x="102" y={y + 28} className="p1-plus-record-title">{record.id} · 真实 y = {record.label}</text>
            <text x="102" y={y + 47} className="p1-plus-small">旧 z 最高项 {MODEL_CLASSES[Array.from(record.z).findIndex((value) => value === Math.max(...record.z))]}</text>
            {record.z.map((value, classId) => <g key={classId}>
              <rect x={55 + classId * 82} y={y + 69} width="72" height="38" rx="6" className={`p1-plus-score tone-${classId}`} />
              <text x={91 + classId * 82} y={y + 84} textAnchor="middle" className="p1-plus-score-name">{MODEL_CLASSES[classId]}</text>
              <text x={91 + classId * 82} y={y + 101} textAnchor="middle" className="p1-plus-score-value">{value.toFixed(1)}</text>
            </g>)}
            {hasRd && readReveal > .04 && <g className="p1-read-tag is-rd" opacity={readReveal} transform={`translate(278 ${y + 15})`}><rect width="27" height="21" rx="6"/><text x="13.5" y="14" textAnchor="middle">Rᴅ</text></g>}
            {hasRy && readReveal > .04 && <g className="p1-read-tag is-ry" opacity={readReveal} transform={`translate(278 ${y + (hasRd ? 41 : 15)})`}><rect width="27" height="21" rx="6"/><text x="13.5" y="14" textAnchor="middle">Rʏ</text></g>}
          </g>;
        })}
        <text x="365" y="43" className="p1-plus-overline">当前新样本</text>
        <path d="M355 79H555" className="p1-plus-flow is-current" markerEnd={`url(#${defsId}-current)`} />
        <g transform="translate(366 56)"><circle r="17" className="p1-plus-new-sample"/><SampleMark model={2} size={29} x={-14.5} y={-14.5}/></g>
        <text x="392" y="65" className="p1-plus-record-title">x₃ · y = DeepSeek</text>
        <g opacity={lossReveal} transform="translate(570 45)">
          <circle cx="21" cy="31" r="19" className="p1-current-ce-mark" />
          <text x="21" y="35" textAnchor="middle" className="p1-current-ce-text">CE</text>
          <text x="52" y="26" className="p1-plus-loss-name">Lcurrent · 新数据分类</text>
          <text x="52" y="46" className="p1-plus-loss-note">CE(y₃, q₃) · 当前标签监督</text>
          <path d="M52 60H218" className="p1-current-ce-rule" />
        </g>

        <path d="M332 166C358 166 361 192 393 204" className="p1-plus-flow is-dark" markerEnd={`url(#${defsId}-dark)`} />
        <path d={sameSample ? "M332 166C365 188 364 304 393 324" : "M332 305C359 305 368 324 393 324"} className="p1-plus-flow is-label" markerEnd={`url(#${defsId}-label)`} />
        <path d="M392 204H548" className="p1-plus-flow is-dark" markerEnd={`url(#${defsId}-dark)`} opacity={readReveal} />
        <path d="M392 324H548" className="p1-plus-flow is-label" markerEnd={`url(#${defsId}-label)`} opacity={readReveal} />
        <g opacity={readReveal} transform="translate(396 171)">
          <path d="M0 8Q0 0 8 0H128Q136 0 136 8V57H0Z" className="p1-read-lane is-dark" />
          <text x="12" y="22" className="p1-plus-loss-name">Rᴅ · {PLUS_MEMORY[0].id}</text>
          <text x="12" y="43" className="p1-plus-loss-note">输出匹配读取</text>
        </g>
        <g opacity={readReveal} transform="translate(396 291)">
          <path d="M0 8Q0 0 8 0H128Q136 0 136 8V57H0Z" className="p1-read-lane is-label" />
          <text x="12" y="22" className="p1-plus-loss-name">Rʏ · {ry.id}</text>
          <text x="12" y="43" className="p1-plus-loss-note">真实标签读取</text>
        </g>
        <g transform={`translate(${rdFlight.x} ${rdFlight.y})`} opacity={readReveal} className="p1-reading-token is-dark"><circle r="14"/><SampleMark model={PLUS_MEMORY[0].model} size={21} x={-10.5} y={-10.5}/></g>
        <g transform={`translate(${ryFlight.x} ${ryFlight.y})`} opacity={readReveal} className="p1-reading-token is-label"><circle r="14"/><SampleMark model={ry.model} size={21} x={-10.5} y={-10.5}/></g>
        <g opacity={lossReveal} transform="translate(568 172)">
          <text x="0" y="17" className="p1-plus-loss-name">α Ldark · 保持旧行为</text>
          <text x="218" y="17" textAnchor="end" className="p1-plus-loss-note">‖a − z‖²</text>
          <path d="M4 36H210" className="p1-dark-comparison-rule" />
          {MODEL_CLASSES.map((name, classId) => <g key={name} transform={`translate(${10 + classId * 69} 45)`}>
            <rect x="0" y="0" width="64" height="21" rx="5" className={`p1-dark-class tone-${classId}`} />
            <text x="32" y="15" textAnchor="middle" className="p1-dark-class-label">{name}</text>
            <rect x="9" y="27" width="9" height="9" rx="2" className="p1-dark-target-mark" />
            <text x="22" y="36" className="p1-dark-mark-label">zᵢ</text>
            <circle cx="41" cy="31" r="4.5" className="p1-dark-current-mark" />
            <text x="49" y="36" className="p1-dark-mark-label">aᵢ</text>
          </g>)}
        </g>
        <g opacity={lossReveal} transform="translate(568 292)">
          <circle cx="21" cy="24" r="17" className="p1-label-target-ring" />
          <circle cx="21" cy="24" r="5" className="p1-label-target-core" />
          <path d="M21 2V9M21 39V46M0 24H7M35 24H42" className="p1-label-target-rays" />
          <text x="54" y="20" className="p1-plus-loss-name">β Lreplay-CE · 类别监督</text>
          <text x="54" y="41" className="p1-plus-loss-note">CE(b, yᵣ) · 来自真实标签</text>
          <path d="M54 53H214" className="p1-label-ce-rule" />
        </g>

        <path d="M788 77C837 77 851 147 906 193" className="p1-plus-flow is-current" markerEnd={`url(#${defsId}-current)`} opacity={updateReveal} />
        <path d="M788 204H903" className="p1-plus-flow is-dark" markerEnd={`url(#${defsId}-dark)`} opacity={updateReveal} />
        <path d="M788 324C843 324 851 271 906 237" className="p1-plus-flow is-label" markerEnd={`url(#${defsId}-label)`} opacity={updateReveal} />
        <g className={`p1-parameter-hub${updateReveal > .45 && updateReveal < .98 ? " is-updating" : ""}`} opacity={Math.max(.45, updateReveal)}>
          <circle cx="960" cy="218" r="64" className="p1-parameter-halo" />
          <path d="M922 197L960 178L996 197M922 197L960 236L996 197M960 178V236" className="p1-parameter-edges" />
          {[{x:922,y:197},{x:960,y:178},{x:960,y:236},{x:996,y:197}].map((point, nodeIndex) => <circle key={nodeIndex} cx={point.x} cy={point.y} r="8" className="p1-parameter-node" />)}
          <text x="960" y="282" textAnchor="middle" className="p1-parameter-label">同一个 θ</text>
        </g>
        <path d="M1025 218H1071" className="p1-parameter-update" markerEnd={`url(#${defsId}-current)`} opacity={updateReveal} />
        <g opacity={updateReveal}>
          <circle cx="1101" cy="218" r="26" className="p1-parameter-next" />
          <text x="1101" y="224" textAnchor="middle" className="p1-parameter-next-label">θ′</text>
          <text x="1101" y="272" textAnchor="middle" className="p1-parameter-small">一次更新</text>
        </g>
        <text x="572" y="392" className="p1-plus-direction-note" opacity={lossReveal}>旧 z 指向 GPT · 真实标签 y₁ 指向 Claude；方向可能竞争，不保证一步纠正。</text>
        <text x="572" y="414" className="p1-plus-direction-note" opacity={readReveal}>Rᴅ 与 Rʏ 可读同一条，也可读不同记录；当前 x₃ 在这一步仍未入池。</text>
      </svg>
    </div>
    <div className="p1-plus-reading" aria-live="polite"><strong>{PLUS_CLIPS[index].id}</strong><span>{[
      "x₁ 的真实标签是 Claude，历史 z 却把 GPT 排第一。维持过去的响应并不等于标签正确。",
      `Rᴅ=${PLUS_MEMORY[0].id} 读取冻结输出；Rʏ=${ry.id} 读取真实标签。两次抽样独立，所以可重合或不同。`,
      "当前 CE、历史响应匹配和历史标签 CE 都基于更新前参数，一起作用于唯一的 θ。这里不展示或保证更新后的分类结果。",
    ][index]}</span></div>
    <div className="p1-plus-boundary"><span>合成边界</span><p>旧 z=(0.5, 2, 0) 是 E04 解释性反例，不是论文失败数据；x₂ 为另一条合成记忆。方向箭头只说明三种监督的职责，不模拟优化结果。</p></div>
  </section>;
}

export default P1ReviewPrototype;
