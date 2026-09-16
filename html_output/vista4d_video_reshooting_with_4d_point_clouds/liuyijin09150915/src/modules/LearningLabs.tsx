"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Aperture, Boxes, Camera, Check, CircleAlert, CircleDot, Clapperboard, Eye, Layers3, Move3D,
  Play, ScanLine, Sparkles, Target, Video, WandSparkles,
} from "lucide-react";
import { cameraRows, fidelityRows, nvsRows, officialMedia, pipelineSteps, userStudy } from "@/src/data/vista4d";
import { OfficialVideo } from "@/src/modules/OfficialMedia";

const heroFailurePhases = [
  { id: "camera-drift", label: "相机轨迹偏离", detail: "结果机位逐渐偏离目标轨迹" },
  { id: "geometry-warp", label: "背景几何畸变", detail: "未观测区域与背景结构变形" },
  { id: "appearance-drift", label: "主体外观漂移", detail: "动态主体外观发生漂移" },
] as const;

export function HeroMethodComparison() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setPhase((value) => (value + 1) % heroFailurePhases.length), 2600);
    return () => window.clearInterval(timer);
  }, []);
  const failure = heroFailurePhases[phase];
  const renderFlow = (vista: boolean) => <article className={`hero-method-film ${vista ? "vista-film" : "existing-film"}`}>
    <header><span>{vista ? "本文方法" : "基线方法组"}</span><b>{vista ? "Vista4D" : "现有方法"}</b><small>教学概念示意</small></header>
    <div className="hero-causal-flow">
      <div><Video /><span>源视频</span></div><i>→</i>
      {vista && <><div className="point-ground"><Boxes /><span>4D 点云锚定</span></div><b>+</b></>}
      <div><Camera /><span>新目标摄影机</span></div><i>→</i>
      <div className="method-node"><WandSparkles /><span>{vista ? "Vista4D" : "其他现有方法"}</span></div><i>→</i>
      <div><Clapperboard /><span>生成结果</span></div>
    </div>
    <div className={`hero-result-viewport ${vista ? "vista-result" : `existing-result ${failure.id}`}`}>
      <div className="hero-target-path"><i /><span /></div><div className="hero-generated-path"><i /><span /></div>
      <div className="hero-scene-background"><i /><i /><i /></div><div className="hero-scene-subject"><i /><b /></div><div className="hero-unseen-region" />
      <span className="result-status">{vista ? "目标摄影机引导结果" : failure.label}</span>
    </div>
    <footer>{vista ? <><b>更接近目标轨迹</b><span>已见内容更稳定；几何与动态更合理，但并非无误。</span></> : <><b>{failure.detail}</b><span>三类问题依次出现 · {phase + 1} / 3</span></>}</footer>
  </article>;
  return <div className="hero-compare hero-dual-animation" aria-label="现有方法与 Vista4D 的换机位生成对比">
    {renderFlow(false)}{renderFlow(true)}
  </div>;
}

type CameraView = "dolly" | "arcRight" | "craneUp";

const cameraViews = {
  dolly: {
    title: "初始机位",
    note: "作为后续机位变化的基准视角，保持源摄影机附近的初始构图。",
    sceneClass: "set-view-dolly",
    compositionClass: "composition-dolly",
    cameraTransform: "translate(12 198)",
    cameraDirectionPath: "M55 207 L188 153 L188 232 Z",
    trajectoryPath: "M68 194 L28 211",
  },
  arcRight: {
    title: "向右环绕",
    note: "摄影机绕到主体右侧：前景箱子仍位于画面左侧并遮住人物一部分，台灯保持在画面右侧。",
    sceneClass: "set-view-arc-right",
    compositionClass: "composition-arc-right",
    cameraTransform: "translate(407 184) scale(-1 1)",
    cameraDirectionPath: "M390 188 L292 142 L292 218 Z",
    trajectoryPath: "M62 198 C140 70 330 64 407 198",
  },
  craneUp: {
    title: "升高机位",
    note: "摄影机升高并俯拍，地面占比增大，道具顶部与彼此前后距离更清楚。",
    sceneClass: "set-view-crane-up",
    compositionClass: "composition-crane-up",
    cameraTransform: "translate(350 48) rotate(145)",
    cameraDirectionPath: "M351 60 L246 118 L300 165 Z",
    trajectoryPath: "M62 198 C168 198 270 108 350 48",
  },
} as const satisfies Record<CameraView, {
  title: string;
  note: string;
  sceneClass: string;
  compositionClass: string;
  cameraTransform: string;
  cameraDirectionPath: string;
  trajectoryPath: string;
}>;

export function HeroCameraLab() {
  const [move, setMove] = useState<CameraView>("dolly");
  const current = cameraViews[move];
  return <div className="hero-camera-lab">
    <div className="hero-camera-workspace">
      <div className={`virtual-set ${current.sceneClass}`}><span className="panel-label">虚拟片场 · 俯视示意</span><svg viewBox="0 0 460 240" role="img" aria-label={`${current.title}的摄影机位置、方向与运动轨迹`}>
        <defs><marker id="reshoot-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" /></marker></defs>
        <path className="set-floor" d="M54 202 L220 92 L410 196 L232 228 Z" />
        <path className="set-back-wall" d="M92 176 L92 78 L367 78 L367 174" />
        <g className="set-window"><rect x="116" y="94" width="78" height="46" rx="3" /><path d="M155 94v46M116 117h78" /></g>
        <g className="set-door"><rect x="304" y="88" width="42" height="82" rx="3" /><circle cx="337" cy="130" r="2" /></g>
        <g className="set-crate"><path d="M122 167l42-12 34 17-43 14z" /><path d="M122 167v25l33 18v-24M198 172v24l-43 14" /></g>
        <g className="set-lamp"><path d="M321 135v45M307 180h28" /><path d="M307 132h28l-7-19h-14z" /></g>
        <g className="set-plant"><path d="M79 187h28l-5 22H84z" /><path d="M92 186c-15-18-16-35-5-39M94 184c13-19 21-30 32-29M94 181c-2-18 4-31 11-39" /></g>
        <g className="subject"><circle cx="235" cy="126" r="12" /><path d="M235 139v35M214 153h42M235 174l-16 28M235 174l17 28" /></g>
        <g className="source-camera-svg source-reference" transform="translate(45 184)"><rect width="35" height="23" rx="4" /><path d="M35 6l14-6v23l-14-6z" /><text x="0" y="-7">源机位</text></g>
        <path className="trajectory" d={current.trajectoryPath} markerEnd="url(#reshoot-arrow)" />
        <g className="camera-direction"><path d={current.cameraDirectionPath} /></g>
        <g className="camera-svg" transform={current.cameraTransform}><rect width="42" height="28" rx="5" /><path d="M42 7l17-7v28l-17-7z" /></g>
      </svg></div>
      <div className="director-monitor"><span className="panel-label">目标画面</span><div id="camera-target-view" className={`target-composition ${current.compositionClass}`} aria-live="polite">
        <div className="monitor-horizon" /><div className="monitor-floor-grid" />
        <div className="monitor-window" /><div className="monitor-door" />
        <div className="monitor-crate"><i /></div><div className="monitor-lamp"><i /></div><div className="monitor-plant"><i /><i /><i /></div>
        <div className="monitor-person"><i /><b /></div>
        <span className="frame-corner tl" /><span className="frame-corner tr" /><span className="frame-corner bl" /><span className="frame-corner br" />
      </div><b>{current.title}</b><p aria-live="polite">{current.note}</p></div>
    </div>
    <div className="segmented-control" role="tablist" aria-label="选择摄影机机位">
      <button role="tab" aria-selected={move === "dolly"} aria-controls="camera-target-view" className={move === "dolly" ? "active" : ""} onClick={() => setMove("dolly")}>初始机位</button>
      <button role="tab" aria-selected={move === "arcRight"} aria-controls="camera-target-view" className={move === "arcRight" ? "active" : ""} onClick={() => setMove("arcRight")}>向右环绕</button>
      <button role="tab" aria-selected={move === "craneUp"} aria-controls="camera-target-view" className={move === "craneUp" ? "active" : ""} onClick={() => setMove("craneUp")}>升高机位</button>
    </div>
  </div>;
}

const problems = [
  {
    id: "seen", title: "保持已见内容", tabLabel: "① 保持已见内容", icon: Eye,
    summary: "摄影机改变了，但已经看见的人物、物体与动态不能跟着重新生成。",
    difficulty: "普通生成模型可能得到视觉上合理的新视频，却改变人物身份、纹理、物体位置或动作细节，使结果不再对应同一次动态场景。",
    response: "Vista4D 使用显式 4D 点云保存场景几何与已见内容，并联合源视频作为条件，为新视角生成提供更强的内容约束。",
  },
  {
    id: "unseen", title: "合理生成未见区域", tabLabel: "② 合理生成未见区域", icon: Sparkles,
    summary: "新摄影机可能看到源视频从未拍到的区域。",
    difficulty: "这些区域没有可以从输入中直接复制的像素，也不存在唯一可以恢复的真实答案。",
    response: "4D 点云提供已有的显式场景证据，视频生成模型的隐式先验负责对缺失区域进行写实且合理的补全。",
  },
  {
    id: "camera", title: "精确控制摄影机", tabLabel: "③ 精确控制摄影机", icon: Target,
    summary: "新视频不仅要像换了视角，还要真正遵循指定摄影机。",
    difficulty: "生成模型可能产生视觉上平滑的视角变化，但实际位置、旋转或视野并没有严格按照目标摄影机运动。",
    response: "Vista4D 将目标摄影机作为显式条件注入生成过程，并利用目标视角下的点云渲染共同约束视频生成。",
  },
] as const;

export function ProblemMonitor() {
  const [active, setActive] = useState<(typeof problems)[number]["id"]>("seen");
  const [failureStage, setFailureStage] = useState(0);
  const [run, setRun] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const selected = problems.find((problem) => problem.id === active)!;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setFailureStage(media.matches ? 2 : 0);
    };
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const revealFailure = window.setTimeout(() => setFailureStage(1), 520);
    const revealAnnotation = window.setTimeout(() => setFailureStage(2), 1320);
    return () => { window.clearTimeout(revealFailure); window.clearTimeout(revealAnnotation); };
  }, [active, run, reducedMotion]);

  const pickProblem = (id: (typeof problems)[number]["id"]) => {
    setActive(id);
    if (reducedMotion) setFailureStage(2);
    else setFailureStage(0);
    setRun((value) => value + 1);
  };

  return <div className="problem-lab">
    <div className="problem-tabs" role="tablist" aria-label="选择视频重拍难题">
      {problems.map((problem) => { const Icon = problem.icon; return <button id={`problem-tab-${problem.id}`} role="tab" aria-selected={active === problem.id} aria-controls="problem-stage" key={problem.id} className={active === problem.id ? "active" : ""} onClick={() => pickProblem(problem.id)}><Icon /><span>{problem.tabLabel}</span></button>; })}
    </div>
    <div id="problem-stage" role="tabpanel" aria-labelledby={`problem-tab-${active}`} className={`problem-stage problem-stage-${active} failure-stage-${failureStage}`} aria-live="polite">
      <div className="problem-stage-head"><span>教学概念示意</span><b>{failureStage === 0 ? "建立参照" : failureStage === 1 ? "观察错误" : "理解目标"}</b></div>

      {active === "seen" ? <div className="seen-comparison">
        <article><header><span>左</span><b>源视频中的已见内容</b></header><div className="simple-scene source-scene"><i className="scene-window" /><i className="scene-plant" /><i className="scene-crate" /><i className="scene-person" /></div><small>人物、箱子与背景已有明确参照</small></article>
        <div className="comparison-arrow">→</div>
        <article><header><span>右</span><b>重拍结果</b></header><div className="simple-scene reshoot-scene"><i className="scene-window" /><i className="scene-plant" /><i className="scene-crate" /><i className="scene-person" /><em className="drift-outline" /></div><small>{failureStage === 1 ? "错误：外观、位置与背景发生漂移" : failureStage === 2 ? "目标：换机位，但已见内容保持一致" : "即将检查内容是否保持"}</small></article>
      </div> : null}

      {active === "unseen" ? <div className="unseen-journey">
        <article className="fov-card"><header>原始摄影机视域</header><div className="fov-scene"><i /><b /><em /></div><small>只包含源视频已经拍到的范围</small></article>
        <div className="camera-move"><Camera /><i>→</i><span>摄影机移动</span></div>
        <article className="new-view-card"><header>新视角</header><div className="new-view-scene"><i /><b /><em /><div className="unknown-region"><strong>？</strong><span>源视频中没有对应像素</span></div><div className="plausible-fill"><i /><b /></div></div><small>{failureStage === 2 ? "合理补全：生成写实且合理的内容" : "新机位暴露此前不可见区域"}</small></article>
        <p>未见区域不存在可以恢复的唯一真实答案。</p>
      </div> : null}

      {active === "camera" ? <div className="camera-control-demo">
        <article className="trajectory-card"><header>目标轨迹 vs 实际轨迹</header><svg viewBox="0 0 420 180" role="img" aria-label="蓝色目标轨迹与红色错误实际轨迹的对比"><path className="target-track" d="M35 142 C120 122 190 40 378 45" /><path className="actual-track" d="M35 142 C128 112 208 76 378 91" /><circle className="track-start" cx="35" cy="142" r="7" /><circle className="track-target" cx="378" cy="45" r="8" /><circle className="track-actual" cx="378" cy="91" r="8" /></svg><div><span><i className="blue" />目标轨迹</span><span><i className="red" />错误实际轨迹</span></div></article>
        <div className="composition-pair"><article><span>目标构图</span><div className="mini-frame target-frame"><i /><b /><em /></div></article><article><span>偏离后的错误构图</span><div className="mini-frame wrong-frame"><i /><b /><em /></div></article><p>画面看起来在动，不等于摄影机真正按照指定位置、旋转和视野运动。</p></div>
      </div> : null}
    </div>

    <article className="problem-explanation">
      <header><span>难题 {problems.findIndex((problem) => problem.id === active) + 1}</span><h4>{selected.title}</h4></header>
      <div><span>概括</span><p>{selected.summary}</p></div>
      <div><span>为什么困难</span><p>{selected.difficulty}</p></div>
      <div className="vista-response"><span>Vista4D 如何应对</span><p>{selected.response}</p></div>
    </article>
  </div>;
}

export function TemporalPersistenceLab() {
  const [frame, setFrame] = useState(0);
  const [cameraOffset, setCameraOffset] = useState(64);
  const background = useMemo(() => Array.from({ length: 27 }, (_, i) => ({ x: 6 + (i * 31) % 89, y: 12 + (i * 17) % 70 })), []);
  const renderWorld = (persistent: boolean) => <article className={`persistence-world ${persistent ? "persistent-on" : "per-frame-only"}`}>
    <header><span>{persistent ? "开启" : "关闭"}</span><div><b>{persistent ? "时间持久性（Temporal Persistence）" : "仅逐帧重建"}</b><small>{persistent ? "复用过去观察过的静态世界点" : "只保留当前帧的可见点"}</small></div></header>
    <div className="persistent-cloud" aria-label={`${persistent ? "时间持久性" : "仅逐帧重建"}的世界坐标点云`}>
      <span className="stage-tag">世界坐标 · 第 {frame + 1} 帧</span>
      {background.map((point, index) => { const observedAt = index % 4; const visible = persistent ? observedAt <= frame : observedAt === frame; return <i key={index} className={visible ? "static-point" : "hidden-point"} style={{ left: `${point.x}%`, top: `${point.y}%` }} />; })}
      <div className="static-landmark old-observation"><i /><b>旧静态背景</b></div>
      <div className="moving-cluster" style={{ left: `${13 + frame * 21}%` }}><span /><span /><span /><span /><span /><b>动态主体 · t{frame + 1}</b></div>
      <div className="target-frustum" style={{ left: `${cameraOffset}%` }}><Camera /><i /></div>
    </div>
    <div className="persistence-target-view"><span>同一目标摄影机</span><div className={persistent ? "history-visible" : "history-missing"}><i /><b /><em /></div><small>{persistent ? "过去见过的静态背景仍可用于新机位" : "当前帧未看到的旧静态背景消失"}</small></div>
    <p>{persistent ? "仅静态像素对应的世界点跨帧持续；动态主体仍按当前时间移动。" : "只使用当前帧点云；动态主体位置正确，但旧静态几何不会被继承。"}</p>
  </article>;
  return <div className="persistence-lab conceptual-panel">
    <div className="concept-label">教学概念示意 · 同一时间、同一场景、同一目标摄影机</div>
    <div className="persistence-shared-timeline"><div><span>共享帧时间轴</span><b>t = {frame + 1}</b></div><input type="range" min="0" max="3" step="1" value={frame} onChange={(event) => setFrame(Number(event.target.value))} aria-label="共享帧时间轴" /><div className="timeline-ticks">{[0,1,2,3].map((value) => <button key={value} className={frame === value ? "active" : ""} onClick={() => setFrame(value)}>帧 {value + 1}</button>)}</div></div>
    <div className="persistence-comparison">{renderWorld(false)}{renderWorld(true)}</div>
    <label className="target-camera-deviation"><span><Camera /> 共享目标摄影机偏离</span><input type="range" min="40" max="82" value={cameraOffset} onChange={(event) => setCameraOffset(Number(event.target.value))} aria-label="共享目标摄影机偏离程度" /><b>{cameraOffset}%</b></label>
    <div className="persistence-final-line"><b>时间持久性不是“点更多”</b><span>而是让新机位仍能利用过去已经观察过的静态几何信息。</span></div>
  </div>;
}

export function CameraDeviationLab() {
  const [deviation, setDeviation] = useState(18);
  const severe = deviation > 66;
  const medium = deviation > 34;
  return <div className="deviation-lab conceptual-panel">
    <div className="concept-label">教学概念示意 · 非论文定量函数</div>
    <div className="deviation-stage">
      <svg className="camera-frustums" viewBox="0 0 700 250" aria-hidden="true"><path d="M88 192 L305 78 L305 220 Z" /><path style={{ transform: `translateX(${deviation * 3.4}px) rotate(${deviation * -.08}deg)`, transformOrigin: "530px 175px" }} d="M530 175 L395 95 L395 220 Z" /></svg>
      <div className="source-camera"><Camera /><span>源摄影机</span></div>
      <div className="target-camera" style={{ left: `${17 + deviation * 0.66}%`, transform: `rotate(${deviation * 0.22 - 8}deg)` }}><Camera /><span>目标摄影机</span></div>
      <div className={`geometry-object ${severe ? "severe" : medium ? "medium" : ""}`}><span /><span /><span /><span /><span /><span /></div>
      <div className={`deviation-render ${severe ? "severe" : medium ? "medium" : ""}`}><small>点云渲染</small><i /><i /><i /><b /></div>
      <div className="artifact-list"><span className={medium ? "on" : ""}>空洞</span><span className={medium ? "on" : ""}>几何拉伸</span><span className={severe ? "on" : ""}>空间错位</span><span className={severe ? "on" : ""}>动态区域伪影</span></div>
    </div>
    <label className="range-label"><span>接近源视角</span><b>摄影机偏离 {deviation}%</b><span>远离源视角</span></label>
    <input type="range" min="0" max="100" value={deviation} onChange={(event) => setDeviation(Number(event.target.value))} aria-label="摄影机偏离程度" />
    <p className="stage-note"><CircleAlert /> 定性教学控制：论文没有报告“偏离百分比→伪影强度”的线性函数。这里仅说明非正面目标视角更容易暴露不完美 4D 重建的几何问题，动态像素尤其困难。</p>
  </div>;
}

export function TrainingComparison() {
  const [activeStep, setActiveStep] = useState(0);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const steps = [
    { label: "步骤 1", double: "目标视频 / 目标点云", vista: "源视角 4D 重建" },
    { label: "步骤 2", double: "目标视角 → 源视角", vista: "真实目标摄影机" },
    { label: "步骤 3", double: "源视角 → 目标视角", vista: "源视角 → 目标视角渲染" },
    { label: "步骤 4", double: "构造训练对", vista: "构造训练对" },
  ] as const;
  const renderBench = (kind: "double" | "vista") => {
    const isVista = kind === "vista";
    const step = steps[activeStep];
    return <article className={`training-bench ${isVista ? "vista-training-bench" : "double-training-bench"}`}>
      <header><div>{isVista ? <WandSparkles /> : <Aperture />}<span><small>{isVista ? "右侧实验台" : "左侧实验台"}</small><b>{isVista ? "Vista4D 多视角训练" : "双重重投影（Double Reprojection）"}</b></span></div><em>{isVista ? "源视角 → 真实目标视角" : "目标视角 → 源视角 → 目标视角"}</em></header>
      <div className={`bench-stage step-${activeStep + 1}`}>
        <div className="bench-camera-map" aria-label={`${isVista ? "Vista4D 多视角训练" : "双重重投影"}摄影机路径`}>
          <span className="camera-node origin"><Camera /><i>{isVista ? "源视角" : "目标视角"}</i></span>
          <span className="camera-route"><i /><b>→</b></span>
          <span className="camera-node destination"><Camera /><i>{isVista ? "真实目标视角" : activeStep >= 2 ? "目标视角" : "源视角"}</i></span>
          {!isVista && <span className="return-route"><i /><b>↩</b></span>}
        </div>
        <div className={`bench-render ${isVista ? "geometry-artifacts" : "occlusion-artifacts"}`}>
          <span className="render-label">渲染结果</span><div className="render-horizon" /><div className="render-subject"><i /><b /></div><div className="render-background"><i /><i /><i /></div><div className="render-artifact"><i /><i /></div>
          <small>{isVista ? "几何拉伸 · 空间偏移" : "区域缺失 · 遮挡"}</small>
        </div>
        <div className="bench-target-reference"><span>目标参考帧</span><div><i /><b /></div><small>同步监督目标</small></div>
      </div>
      <div className="bench-step-readout"><span>{steps[activeStep].label}</span><b>{isVista ? step.vista : step.double}</b><p>{isVista
        ? ["从源视角视频重建 4D 点云。", "选择同步采集的真实目标摄影机，而不是回到正面视角。", "从非正面目标机位渲染源重建，暴露拉伸、空间偏移与动态区域深度伪影。", "粗糙目标视角渲染与真实目标参考帧组成训练对。模型在训练时见到更接近推理的几何错误。"][activeStep]
        : ["从目标视频建立目标点云。", "先把目标点云投影到源摄影机，制造遮挡与缺失区域。", "再从源视角回投到原目标摄影机；几何仍以目标正面、空间对齐观测为基础。", "重投影结果与原目标参考帧组成训练对，主要学习遮挡与修补类错误。"][activeStep]}</p></div>
      <div className="bench-artifact-legend">{(isVista ? ["非正面视角错位", "几何拉伸", "动态深度伪影"] : ["遮挡", "区域缺失", "修补类错误"]).map((item) => <span key={item}>{item}</span>)}</div>
    </article>;
  };
  return <div className="training-comparison">
    <div className="training-step-controller" aria-label="同步训练步骤">
      {steps.map((step, index) => <button key={step.label} className={activeStep === index ? "active" : ""} aria-pressed={activeStep === index} onClick={() => setActiveStep(index)}><span>{step.label}</span><i>{index + 1}</i></button>)}
    </div>
    <div className="training-benches">{renderBench("double")}{renderBench("vista")}</div>
    <div className="question-card training-question compact-question"><h3>Vista4D 是不是随机给 4D 点云加噪声？</h3><div><button className={answer === "yes" ? "selected" : ""} onClick={() => setAnswer("yes")}>是</button><button className={answer === "no" ? "correct" : ""} onClick={() => setAnswer("no")}>不是</button></div>{answer && <p className={answer === "no" ? "answer-correct" : "answer-wrong"}>{answer === "no" ? "不是。伪影来自 4D 重建与非正面目标摄影机渲染，而非随机几何噪声。" : "再看右侧路径：误差由真实重建和非正面目标摄影机渲染自然暴露，并非人为随机加噪。"}</p>}</div>
  </div>;
}

const pointCloudComparisonModes = {
  point: {
    name: "只看点云",
    status: "几何位置清楚，但真实内容与动态证据仍不完整。",
    evidence: ["显式几何结构", "目标视角空间提示"],
    gaps: ["真实纹理", "外观细节", "动态内容", "点云重建误差的补充证据"],
  },
  both: {
    name: "点云 + 原视频",
    status: "显式几何与源视频中的真实内容、外观和动态共同提供条件。",
    evidence: ["点云：场景在哪里", "源视频：场景是什么样、如何运动"],
    gaps: [],
  },
} as const;

export function PointCloudSourceComparison() {
  const [mode, setMode] = useState<keyof typeof pointCloudComparisonModes>("point");
  const selected = pointCloudComparisonModes[mode];

  return <div className="s6-comparison">
    <div className="concept-label">教学概念示意 · 不代表定量消融结果</div>
    <div className="s6-mode-tabs" role="tablist" aria-label="比较点云条件与联合源视频条件">
      {Object.entries(pointCloudComparisonModes).map(([id, item]) => <button
        type="button"
        role="tab"
        aria-selected={mode === id}
        aria-controls="s6-comparison-panel"
        id={`s6-mode-${id}`}
        key={id}
        className={mode === id ? "active" : ""}
        onClick={() => setMode(id as keyof typeof pointCloudComparisonModes)}
      >{item.name}</button>)}
    </div>
    <div id="s6-comparison-panel" className={`s6-comparison-panel s6-mode-${mode}`} role="tabpanel" aria-labelledby={`s6-mode-${mode}`}>
      <div className="s6-evidence-stage" aria-hidden="true">
        <div className="s6-evidence-card geometry"><Layers3 /><span>点云</span><b>显式几何约束</b></div>
        <span className="s6-plus">+</span>
        <div className="s6-evidence-card source"><Video /><span>原视频</span><b>真实内容 · 外观 · 动态</b></div>
      </div>
      <p className="s6-state-copy" aria-live="polite">{selected.status}</p>
      <div className="s6-evidence-summary">
        <div><span>当前提供</span>{selected.evidence.map((item) => <b key={item}><Check />{item}</b>)}</div>
        {selected.gaps.length > 0 ? <div className="missing"><span>仍缺少或不完整</span>{selected.gaps.map((item) => <b key={item}><CircleAlert />{item}</b>)}</div> : null}
      </div>
    </div>
    <p className="s6-takeaway">点云告诉模型“场景在哪里”，源视频补充真实内容与动态；源视频并不只是补颜色。</p>
  </div>;
}

const conditioningDetails = [
  { id: "source", label: "源视频", detail: "提供真实内容、外观与动态信息。", icon: Video },
  { id: "pointcloud", label: "点云渲染", detail: "提供目标视角下的显式几何条件。", icon: Layers3 },
  { id: "mask", label: "Alpha Mask", detail: "标记当前点云渲染中哪些区域具有有效几何证据。", icon: Aperture },
  { id: "target", label: "带噪目标视频状态", detail: "作为 Flow Matching 中当前需要更新的视频状态。", icon: CircleDot },
  { id: "camera", label: "目标摄影机", detail: "指定需要生成的新机位与目标视角。", icon: Camera },
] as const;

export function ConditioningOverview({ highlightedStage }: { highlightedStage?: string | null }) {
  const [selectedCondition, setSelectedCondition] = useState<(typeof conditioningDetails)[number]["id"]>("source");
  const active = conditioningDetails.find((condition) => condition.id === selectedCondition)!;

  return <div className="s6-conditioning-overview">
    <div className="conditioning-flow">
      <div className="conditioning-selector" role="list" aria-label="Vista4D 的五种联合条件">
        {conditioningDetails.map((condition) => {
          const Icon = condition.icon;
          const isActive = active.id === condition.id;
          return <div role="listitem" key={condition.id}><button
            type="button"
            className={`${isActive ? "active" : ""} ${highlightedStage === condition.id ? "formula-active" : ""}`}
            aria-pressed={selectedCondition === condition.id}
            onClick={() => setSelectedCondition(condition.id)}
          ><Icon /><span>{condition.label}</span><i aria-hidden="true">→</i></button></div>;
        })}
      </div>
      <div className="conditioning-model" aria-label="五种条件汇入 Vista4D DiT"><WandSparkles /><span>Vista4D</span><b>DiT</b></div>
      <div className="conditioning-output"><Clapperboard /><span>输出</span><b>目标视频</b></div>
    </div>
    <p className="conditioning-detail" aria-live="polite"><b>{active.label}</b><span>{active.detail}</span></p>
    <div className="s6-token-strip" aria-label="进入 DiT 时的 token 与摄影机注入方式">
      <div className="token-row"><span>Source tokens</span><span>Point Cloud tokens</span><span>Noisy Target tokens</span><b>沿 frame dimension 拼接</b><strong>DiT</strong></div>
      <div className="camera-row"><Camera /><span>Target Camera</span><b>通过 Plücker embedding 注入</b><i aria-hidden="true">↑</i></div>
    </div>
  </div>;
}

export function PipelineLab({ compact = false }: { compact?: boolean }) {
  const [litThrough, setLitThrough] = useState(compact ? pipelineSteps.length - 1 : -1);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      setLitThrough((value) => Math.min(value + 1, pipelineSteps.length - 1));
      if (litThrough >= pipelineSteps.length - 2) setRunning(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [running, litThrough]);
  const run = () => { setLitThrough(-1); setSelected(0); setRunning(true); };
  const detail = pipelineSteps[selected];
  const payloadLabels = { frame: "帧", mask: "掩码", point: "点", camera: "摄影机", latent: "潜变量", video: "视频" } as const;
  return <div className={`pipeline-lab ${compact ? "compact" : ""}`}>
    {!compact && <div className="pipeline-toolbar"><button onClick={run} disabled={running}><Play /> {running ? "数据流动中…" : "运行完整流程"}</button><span>已通过 {Math.max(0, litThrough + 1)} / {pipelineSteps.length} 个模块</span></div>}
    <div className="pipeline-layout">
      <div className="pipeline-nodes">{pipelineSteps.map((step, index) => <div className="pipeline-step" key={step.title}><button data-tone={step.tone} data-lane={step.lane} className={`${index <= litThrough ? "lit" : ""} ${selected === index ? "selected" : ""}`} onClick={() => setSelected(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{step.title}</b>{index === litThrough && running && <i className="flow-token" data-payload={step.payload}>{payloadLabels[step.payload]}</i>}</button>{index < pipelineSteps.length - 1 && <span className={`pipeline-connector ${index < litThrough ? "lit" : ""}`} aria-hidden="true"><i /></span>}</div>)}</div>
      {!compact && <aside className="pipeline-inspector"><span>模块 {String(selected + 1).padStart(2, "0")}</span><h3>{detail.title}</h3><dl><div><dt>输入</dt><dd>{detail.input}</dd></div><div><dt>处理</dt><dd>{detail.operation}</dd></div><div><dt>输出</dt><dd>{detail.output}</dd></div></dl></aside>}
    </div>
  </div>;
}

const fullPipelineSteps = [
  { id: "source", title: "原始视频", group: "input", detail: "源视频提供已拍摄的内容、外观与动态状态。" },
  { id: "reconstruct", title: "动态分割 + 4D 重建", group: "geometry", detail: "动态分割后取静态区域，同时估计逐帧深度与源摄影机。" },
  { id: "per-frame", title: "逐帧 3D 点云", group: "geometry", detail: "每一帧先形成独立的世界坐标点云 P。" },
  { id: "persistent-static", title: "静态世界点跨帧持续", group: "geometry", detail: "静态世界点在连续帧中保持一致，动态主体仍保留随时间变化的状态。" },
  { id: "persistent-cloud", title: "时间持续 4D 点云", group: "geometry", detail: "时间持续点云 P̄ 汇集跨帧静态几何，但不等同于逐帧点云 P。" },
  { id: "target-view", title: "目标摄影机 + 目标视角点云渲染 / Alpha Mask", group: "condition", detail: "目标摄影机指定新机位，点云渲染与 Alpha Mask 提供目标视角的显式几何条件。" },
  { id: "conditioning", title: "联合条件输入", group: "condition", detail: "源视频、点云渲染、Alpha Mask、带噪目标状态和目标摄影机共同约束生成。" },
  { id: "dit", title: "Vista4D DiT", group: "dit", detail: "DiT 在几何、内容、摄影机与当前生成状态的共同约束下完成视频重拍。" },
  { id: "output", title: "目标视频", group: "output", detail: "输出保留原始动态、同时遵循目标摄影机的新视角视频。" },
] as const;

export function FullPipelineOverview() {
  const [selectedId, setSelectedId] = useState<(typeof fullPipelineSteps)[number]["id"]>("source");
  const selected = fullPipelineSteps.find((step) => step.id === selectedId)!;

  return <div className="full-pipeline-overview">
    <div className="full-pipeline-spine" aria-label="Vista4D Full Pipeline">
      {fullPipelineSteps.map((step, index) => <div className="full-pipeline-step" key={step.id}>
        <button
          type="button"
          data-group={step.group}
          className={selectedId === step.id ? "active" : ""}
          aria-pressed={selectedId === step.id}
          onClick={() => setSelectedId(step.id)}
        >
          <span aria-hidden="true" />
          <b>{step.title}</b>
        </button>
        {index < fullPipelineSteps.length - 1 ? <span className="full-pipeline-arrow" aria-hidden="true">↓</span> : null}
      </div>)}
    </div>
    <p className="full-pipeline-detail" aria-live="polite"><b>{selected.title}</b>{selected.detail}</p>
    <p className="full-pipeline-summary">Vista4D 先用 4D 几何建立目标视角的空间约束，再结合源视频内容、目标摄影机和当前生成状态，由 DiT 完成最终视频重拍。</p>
  </div>;
}

type ExperimentMode = "camera" | "nvs" | "fidelity";
type MetricDef = { id: string; label: string; index: number; note: string };
const metricGroups: Record<ExperimentMode, { title: string; metrics: MetricDef[] }> = {
  camera: { title: "摄影机控制与 3D 一致性 · 表 1", metrics: [
    { id: "translation", label: "平移误差 ↓", index: 1, note: "越低越好。Vista4D 报告值为 1.251。" },
    { id: "rotation", label: "旋转误差 ↓", index: 2, note: "越低越好。Vista4D 报告值为 4.647。" },
    { id: "intrinsics", label: "内参误差 ↓", index: 3, note: "越低越好。Vista4D 报告值为 4.927。" },
    { id: "resg", label: "RE@SG ↓", index: 4, note: "SuperPoint 关键点经 SuperGlue 匹配后的逐帧重投影误差，越低越好。Vista4D 为 7.504。" },
  ] },
  nvs: { title: "新视角视频合成 · 表 2", metrics: [
    { id: "mpsnr", label: "mPSNR ↑", index: 1, note: "遮罩区域 PSNR，越高越好。" }, { id: "mssim", label: "mSSIM ↑", index: 2, note: "遮罩区域 SSIM，越高越好。TrajectoryCrafter 高于 Vista4D，但论文指出 SSIM 未捕捉到其可见伪影。" }, { id: "mlpips", label: "mLPIPS ↓", index: 3, note: "遮罩区域 LPIPS，越低越好。" }, { id: "psnr", label: "PSNR ↑", index: 4, note: "全画面 PSNR，越高越好。" }, { id: "ssim", label: "SSIM ↑", index: 5, note: "全画面 SSIM，越高越好；TrajectoryCrafter 高于 Vista4D。" }, { id: "lpips", label: "LPIPS ↓", index: 6, note: "全画面 LPIPS，越低越好。" }, { id: "epe", label: "EPE ↓", index: 7, note: "衡量运动质量的光流端点误差，越低越好。" },
  ] },
  fidelity: { title: "视频保真度 · 表 3", metrics: [
    { id: "fid", label: "FID ↓", index: 1, note: "越低越好；隐式先验方法有时因为摄影机变化更小而在这里更占优，需结合摄影机控制准确性解读。" }, { id: "fvd", label: "FVD ×10³ ↓", index: 2, note: "越低越好；需与摄影机控制准确性一起解读。" }, { id: "clip", label: "CLIP-T ↑", index: 3, note: "提示词对齐程度，越高越好。" }, { id: "aesthetic", label: "美学质量 ↑", index: 4, note: "VBench 美学质量，越高越好。" }, { id: "imaging", label: "成像质量 ↑", index: 5, note: "VBench 成像质量，越高越好。" }, { id: "subject", label: "主体一致性 ↑", index: 6, note: "越高越好，但摄影机更静止的输出可能更容易获得高分。" }, { id: "background", label: "背景一致性 ↑", index: 7, note: "越高越好，但摄影机更静止的输出可能更容易获得高分。" }, { id: "temporal", label: "时间风格 ↑", index: 8, note: "VBench 时间风格指标，越高越好。" }, { id: "anatomy", label: "人体结构 ↑", index: 9, note: "VBench-2.0 人体结构指标，越高越好。" },
  ] },
};

const ablationCases = [
  { name: "不使用深度伪影训练", detail: "始终使用双重重投影，使点云渲染与目标视频空间对齐。", impact: "对非正面几何伪影与时间深度抖动的修正能力变弱。" },
  { name: "不使用源视频", detail: "移除源视频条件，仅使用点云渲染。", impact: "源内容保持与伪影修正能力变弱。" },
  { name: "通过交叉注意力注入源视频", detail: "以交叉注意力注入源视频，替代沿帧维拼接的上下文条件输入。", impact: "摄影机尺度变化时，可能无法自适应传递源几何与外观。" },
  { name: "不使用时间持久性", detail: "移除静态像素时间持久性，只使用逐帧点云条件。", impact: "已见静态内容的保持变弱，源–目标视角重叠较低时摄影机控制也会变弱。" },
] as const;

export function PlaybackReview() {
  const [mode, setMode] = useState<ExperimentMode>("camera");
  const [metricId, setMetricId] = useState("translation");
  const [ablation, setAblation] = useState(0);
  const group = metricGroups[mode];
  const metric = group.metrics.find((item) => item.id === metricId) ?? group.metrics[0];
  const sourceRows: readonly (readonly string[])[] = mode === "camera" ? cameraRows : mode === "nvs" ? nvsRows : fidelityRows;
  const selectMode = (next: ExperimentMode) => { setMode(next); setMetricId(metricGroups[next].metrics[0].id); };
  return <div className="playback-review">
    <div className="metric-tabs" role="tablist"><button role="tab" aria-selected={mode === "camera"} className={mode === "camera" ? "active" : ""} onClick={() => selectMode("camera")}><Camera /> 摄影机 + 3D</button><button role="tab" aria-selected={mode === "nvs"} className={mode === "nvs" ? "active" : ""} onClick={() => selectMode("nvs")}><Move3D /> 新视角合成</button><button role="tab" aria-selected={mode === "fidelity"} className={mode === "fidelity" ? "active" : ""} onClick={() => selectMode("fidelity")}><Video /> 视频保真度</button></div>
    <div className="results-panel">
      <div className="results-head"><div><span>论文结果</span><h3>{group.title}</h3></div><div className="metric-picker">{group.metrics.map((item) => <button key={item.id} className={metric.id === item.id ? "active" : ""} onClick={() => setMetricId(item.id)}>{item.label}</button>)}</div></div>
      <MetricComparison rows={sourceRows.map((row) => [row[0], row[metric.index]])} lowerIsBetter={metric.label.includes("↓")} note={metric.note} />
    </div>
    <p className="metric-caveat">部分方法因摄影机运动较弱、输出更接近源视频，可能在个别保真度指标上取得更优数值。</p>
    <div className="user-study-panel"><div><span>用户研究 · 42 位参与者 · 30 / 110 对</span><h3>Vista4D 用户偏好率</h3><p>这些数字是参与者在三项问题中选择 Vista4D 的比例，不是准确率，也不与其他指标跨尺度比较。</p></div>{userStudy.map(([label, value]) => <article key={label}><b>{value}</b><span>{label}</span></article>)}</div>
    <div className="ablation-console"><div><span>定性消融</span><h3>论文报告的设计移除</h3><p>选择一个真实消融设置；下方只总结论文的定性观察，不生成伪分数。</p></div><div className="ablation-switches">{ablationCases.map((item, index) => <button key={item.name} className={ablation === index ? "on" : ""} onClick={() => setAblation(index)}><span>{ablation === index ? <Check /> : null}</span>{item.name}</button>)}</div><div className="ablation-detail"><b>{ablationCases[ablation].name}</b><p>{ablationCases[ablation].detail}</p><strong>{ablationCases[ablation].impact}</strong></div></div>
  </div>;
}

function MetricComparison({ rows, lowerIsBetter, note }: { rows: readonly (readonly string[])[]; lowerIsBetter: boolean; note: string }) {
  const values = rows.map((row) => Number(row[1]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bestValue = lowerIsBetter ? min : max;
  return <>
    <div className="metric-scale-note"><span className="metric-direction-badge">{lowerIsBetter ? "↓ 越低越好" : "↑ 越高越好"}</span><b>仅表示本指标内部相对比较</b><small>条形长度已按当前指标归一化，不同指标之间不可比较。</small></div>
    <div className="metric-bars">{rows.map((row, index) => { const isBest = values[index] === bestValue; const normalized = max === min ? 1 : lowerIsBetter ? (max - values[index]) / (max - min) : (values[index] - min) / (max - min); return <div className={`${row[0] === "Vista4D" ? "vista" : ""} ${isBest ? "metric-best" : ""}`} key={row[0]}><span>{row[0]}{row[0] === "Vista4D" && <em>VISTA4D</em>}{isBest && <b className="best-badge">最佳</b>}</span><i><b style={{ width: `${28 + normalized * 72}%` }} /></i><strong>{row[1]}</strong></div>; })}</div>
    <p className="result-note"><ScanLine /> {note}</p>
  </>;
}

const applications = [
  {
    id: "expansion",
    label: "动态场景扩展",
    video: officialMedia.expansion,
    explanation: "联合额外场景帧或其他视角进行 4D 重建，补充源视频视野之外的静态场景信息。",
  },
  {
    id: "recomposition",
    label: "4D 场景重组",
    video: officialMedia.recomposition,
    explanation: "直接编辑显式 4D 点云，可移动、复制、删除或插入场景主体。",
  },
  {
    id: "long-video",
    label: "带记忆的长视频推理",
    video: officialMedia.longVideo,
    explanation: "按片段自回归生成，并持续将新片段中的静态信息注册回已有 4D 点云。",
  },
] as const;

type ApplicationId = (typeof applications)[number]["id"];

export function ApplicationCards() {
  const [activeApplication, setActiveApplication] = useState<ApplicationId>("expansion");
  const active = applications.find((application) => application.id === activeApplication) ?? applications[0];

  return <div className="application-showcase">
    <div className="application-selector" role="tablist" aria-label="选择 Vista4D 扩展应用">
      {applications.map((application) => <button
        id={`section-9-application-tab-${application.id}`}
        key={application.id}
        type="button"
        role="tab"
        aria-selected={activeApplication === application.id}
        aria-controls="section-9-application-panel"
        className={activeApplication === application.id ? "active" : ""}
        onClick={() => setActiveApplication(application.id)}
      >{application.label}</button>)}
    </div>

    <div
      id="section-9-application-panel"
      className="application-panel"
      role="tabpanel"
      aria-labelledby={`section-9-application-tab-${active.id}`}
    >
      <div className="application-stage">
        <OfficialVideo key={activeApplication} src={active.video} label={active.label} caption="Vista4D 官方项目演示。" />
      </div>
      <div className="application-explanation" aria-live="polite">
        <h3>{active.label}</h3>
        <p>{active.explanation}</p>
        {active.id === "long-video" && <details className="application-details">
          <summary>展开技术细节</summary>
          <p>时间持续性 4D 点云充当显式压缩上下文；新生成片段中的静态信息会注册回已有点云，并使用 first-frame-conditioned Wan2.1-I2V-14B variant 衔接后续片段。</p>
        </details>}
      </div>
    </div>

    <p className="application-summary">显式 4D 表示不仅能控制重拍视角，也能作为可扩展、可编辑、可累积的场景表示。</p>
  </div>;
}

export function FinalQuiz({ onComplete, onRestart }: { onComplete: () => void; onRestart: () => void }) {
  const questions = [
    { q: "为什么普通逐帧点云不够？", options: ["它没有 RGB", "当前帧看不到的静态证据会消失", "它不能表示摄影机"], correct: 1 },
    { q: "为什么训练时要使用不完美重建？", options: ["让图像更模糊", "减少训练样本", "匹配真实推理中的几何伪影"], correct: 2 },
    { q: "源视频和 4D 点云分别承担什么作用？", options: ["外观内容参考；显式几何与摄影机约束", "几何约束；音频参考", "两者作用完全相同"], correct: 0 },
  ] as const;
  const [answers, setAnswers] = useState<Array<number | null>>([null, null, null]);
  const answered = answers.every((answer) => answer !== null);
  return <div className="final-quiz">
    <div className="quiz-grid">{questions.map((question, index) => <fieldset key={question.q}><legend><span>题 {index + 1}</span>{question.q}</legend>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers((value) => value.map((answer, answerIndex) => answerIndex === index ? optionIndex : answer))} /><span>{option}</span>{answers[index] === optionIndex && <b className={optionIndex === question.correct ? "correct" : "wrong"}>{optionIndex === question.correct ? "正确" : "再想想"}</b>}</label>)}</fieldset>)}</div>
    {answered ? <div className="final-reveal"><PipelineLab compact /><div className="final-takeaway"><span>最终结论</span><p>Vista4D 用显式 4D 点云锚定源内容和用户指定的摄影机，再利用视频扩散先验对不完美重建产生的几何伪影进行鲁棒生成。显式约束和隐式先验各自承担不同角色，并非互相替代。</p></div><div className="final-actions"><button className="complete" onClick={onComplete}><Check /> 完成学习</button><button onClick={onRestart}>重新学习</button></div></div> : <p className="quiz-prompt">回答三个问题后，完整流程与最终结论将在这里重新出现。</p>}
  </div>;
}
