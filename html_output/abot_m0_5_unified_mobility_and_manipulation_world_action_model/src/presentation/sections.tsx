import React, { useEffect, useMemo, useRef, useState } from "react";
import { CupTarget, LabRobot } from "./Robot";
import { Evidence, Term } from "./Term";

function SectionShell({
  index,
  eyebrow,
  title,
  lead,
  children,
  className = "",
}: {
  index: number;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={`screen-${index}`} data-index={index - 1} className={`story-screen ${className}`}>
      <div className="screen-inner">
        <div className="section-kicker">
          <span>{String(index).padStart(2, "0")}</span>
          {eyebrow}
        </div>
        <h2>{title}</h2>
        {lead ? <p className="section-lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}

type Fault = "temporal" | "action" | "train" | "all";
const faults: Array<[Fault, string, string]> = [
  ["temporal", "A", "看得太粗"],
  ["action", "B", "手脚混控"],
  ["train", "C", "训练部署错位"],
];

function FaceChangeActor({ route }: { route: "sleeve" | "turn" }) {
  const label = route === "sleeve" ? "演员抬袖遮脸，再落袖亮相" : "演员转身背向观众，再回身亮相";
  return (
    <div className={`face-process-actor actor-${route}`} key={route}>
      <svg viewBox="0 0 210 230" role="img" aria-label={label}>
        <ellipse className="process-stage-shadow" cx="105" cy="211" rx="62" ry="11" />
        <g className="process-actor-body">
          <path className="process-headdress" d="M61 65Q105 14 149 65L137 76H73Z" />
          <path className="process-robe" d="M69 111Q105 91 141 111L164 205H46Z" />
          <path className="process-collar" d="M76 112Q105 137 134 112" />
          <g className="process-face process-face-blue">
            <circle cx="105" cy="82" r="34" />
            <path d="M84 76q8-8 16 0M111 76q8-8 16 0M91 92q14 13 28 0" />
          </g>
          <g className="process-face process-face-red">
            <circle cx="105" cy="82" r="34" />
            <path d="M84 76q8-8 16 0M111 76q8-8 16 0M91 92q14 13 28 0" />
          </g>
          <path className="process-arm process-arm-left" d="M72 119Q49 133 40 160" />
          <path className="process-arm process-arm-right" d="M138 119Q160 134 170 160" />
          <path className="process-sleeve" d="M118 119Q166 121 178 151Q154 177 108 143Z" />
          <path className="process-back-mark" d="M85 72Q105 57 125 72M105 61V102" />
        </g>
      </svg>
      <span><i>正在演示</i>{label}</span>
    </div>
  );
}

function TemporalFault() {
  const [route, setRoute] = useState<"sleeve" | "turn">("sleeve");
  const process = route === "sleeve"
    ? {
      name: "袖遮换脸",
      motion: "抬袖 → 遮脸 → 换谱 → 落袖",
      actions: ["抬起水袖", "遮住脸谱", "完成换脸", "落袖亮相"],
      path: "M34 126 C126 20 250 20 346 126",
    }
    : {
      name: "转身换脸",
      motion: "侧身 → 背脸 → 换谱 → 回身",
      actions: ["开始侧身", "转至背面", "完成换脸", "回身亮相"],
      path: "M34 126 C120 164 134 28 196 28 C258 28 270 164 346 126",
    };
  return (
    <div className="fault-stage temporal-fault fault-stage-real face-process-demo">
      <div className="face-process-head">
        <span>川剧变脸</span>
        <h3>结果相同，不代表过程相同</h3>
        <b>蓝脸 → 红脸</b>
      </div>

      <div className="face-route-picker" aria-label="选择一种变脸过程">
        <button className={route === "sleeve" ? "is-active" : ""} onClick={() => setRoute("sleeve")} aria-pressed={route === "sleeve"}>
          <strong>过程 A · 袖遮换脸</strong><span>抬袖遮住脸，再落袖亮相</span>
        </button>
        <button className={route === "turn" ? "is-active" : ""} onClick={() => setRoute("turn")} aria-pressed={route === "turn"}>
          <strong>过程 B · 转身换脸</strong><span>转身背向观众，再回身亮相</span>
        </button>
      </div>

      <div className={`face-motion-stage route-${route}`}>
        <div className="face-endpoint start"><span>起点 zₜ</span><i className="mask-icon blue" /><b>蓝脸</b></div>
        <div className="latent-route">
          <svg className="latent-path-svg" viewBox="0 0 380 170" role="img" aria-label={`${process.name}的运动轨迹`}>
            <path d={process.path} />
            <circle r="9"><animateMotion dur="4.4s" repeatCount="indefinite" path={process.path} /></circle>
          </svg>
          <div className="latent-route-visual">
            <FaceChangeActor route={route} />
            <div className="latent-route-card"><code>m<sub>t</sub></code><strong>{process.name}</strong><span>{process.motion}</span></div>
          </div>
        </div>
        <div className="face-endpoint end"><span>终点 zₜ₊₁</span><i className="mask-icon red" /><b>红脸</b></div>
      </div>

      <div className="face-action-sequence" aria-live="polite">
        {process.actions.map((action, index) => <div key={`${route}-${action}`}><span>a<sub>{index + 1}</sub></span><b>{action}</b>{index < process.actions.length - 1 ? <i>→</i> : null}</div>)}
      </div>

      <div className="latent-problem-grid">
        <article>
          <h4><span>1</span>时间粒度错配</h4>
          <div><b>视频：一次整体变化</b><i>→</i><strong>控制：多个连续动作</strong></div>
          <p>没有 m<sub>t</sub>，模型必须自己补全中间发生了什么。</p>
        </article>
        <article>
          <h4><span>2</span>动作容易不连贯</h4>
          <div><b>转身过程</b><i>×</i><strong>袖遮动作</strong></div>
          <p>过程没有显式表示时，两种动作模式可能被平均或混用。</p>
        </article>
        <article>
          <h4><span>3</span>数据与迁移受限</h4>
          <div><b>只靠机器人动作标签</b><i>→</i><strong>难迁移</strong></div>
          <p>m<sub>t</sub> 可从相邻视频帧提取，再解码成不同机器人的控制。</p>
        </article>
      </div>

      <div className="face-process-verdict"><b>m<sub>t</sub> 的作用</b><span>把“未来结果”与“连续控制”之间缺失的局部运动过程显式化</span></div>
    </div>
  );
}

function ArcheryScene({ coordinated }: { coordinated: boolean }) {
  return (
    <div className={`archery-case ${coordinated ? "is-coordinated" : "is-conflicted"}`}>
      <div className="archery-case-head"><b>{coordinated ? "正例：先稳后射" : "反例：边跑边射"}</b><span>{coordinated ? "动作解耦 + 时序协同" : "目标一致，但动作互相干扰"}</span></div>
      <svg viewBox="0 0 420 180" role="img" aria-label={coordinated ? "马与骑手共同看向靶心，马停稳后骑手射中" : "马与骑手共同看向靶心，但马奔跑时骑手放箭导致射偏"}>
        <rect width="420" height="180" fill="#f7f2e6" />
        <path d="M0 130Q62 99 126 130T252 128T420 126V180H0Z" fill="#d9c394" opacity=".62" />
        <path className="case-ground" d="M0 158H420" />
        <g className="case-target"><line x1="370" y1="58" x2="370" y2="158" /><circle cx="370" cy="58" r="34" /><circle cx="370" cy="58" r="21" /><circle cx="370" cy="58" r="8" /></g>
        <g className={`case-horse-rider ${coordinated ? "good-rider" : "bad-rider"}`}>
          <g className="case-horse"><ellipse cx="126" cy="121" rx="58" ry="28" /><path d="M169 112Q188 84 200 98L180 133Z" /><circle cx="202" cy="94" r="15" /><path d="M207 81L214 67L217 86M196 81L194 68L203 85" /><path className="case-horse-tail" d="M70 116Q39 106 45 87" /><line className="case-horse-leg case-leg-a" x1="98" y1="139" x2="88" y2="166" /><line className="case-horse-leg case-leg-b" x1="126" y1="141" x2="134" y2="167" /><line className="case-horse-leg case-leg-c" x1="153" y1="138" x2="164" y2="166" /><line className="case-horse-leg case-leg-d" x1="174" y1="135" x2="184" y2="163" /><circle className="horse-eye-white" cx="207" cy="92" r="4" /><circle className="horse-eye" cx="209" cy="92" r="2" /></g>
          <g className="case-archer"><circle cx="127" cy="58" r="17" /><path d="M111 75Q128 65 145 76L152 121H104Z" /><circle className="rider-eye-white" cx="135" cy="56" r="4" /><circle className="rider-eye" cx="137" cy="56" r="2" /><line className="case-archer-arm" x1="141" y1="84" x2="181" y2="72" /><line className="case-archer-arm" x1="114" y1="83" x2="157" y2="73" /><path className="case-bow" d="M182 43Q207 73 182 103" /><line className="case-bow-string" x1="182" y1="43" x2="182" y2="103" /></g>
          <line className="gaze-line rider-gaze" x1="138" y1="56" x2="361" y2="58" />
          <line className="gaze-line horse-gaze" x1="210" y1="92" x2="361" y2="58" />
          <line className={`case-arrow ${coordinated ? "good-arrow" : "bad-arrow"}`} x1="158" y1="73" x2={coordinated ? "361" : "350"} y2={coordinated ? "58" : "30"} />
        </g>
        <text className="shared-gaze-label" x="286" y="112">人、马共同看向靶心</text>
        {!coordinated ? <path className="motion-wobble" d="M62 151q10-9 20 0t20 0t20 0" /> : <path className="stable-mark" d="M79 154h95" />}
      </svg>
      <div className="case-result">{coordinated ? <><b>✓ 命中</b><span>马停止扰动，手获得稳定参考系</span></> : <><b>× 射偏</b><span>马仍在位移，手的瞄准参考持续变化</span></>}</div>
    </div>
  );
}

function MountedArcheryCard() {
  return (
    <div className="archery-analogy-card archery-full-card" aria-label="胡服骑射左右对照说明马腿与持弓手需要分开建模并协同执行">
      <div className="archery-card-head"><span>胡服骑射 · 同步对照</span><b>同一位骑手、同一匹马、同一个靶心，只改变手脚协同方式</b></div>
      <div className="archery-role-legend"><span><b>马腿 = 底盘</b>负责移动与稳定</span><i>共同目标：射中靶心</i><span><b>持弓手 = 机械臂</b>负责瞄准与命中</span></div>
      <div className="archery-comparison archery-comparison-horizontal"><ArcheryScene coordinated={false} /><ArcheryScene coordinated /></div>
      <div className="archery-language-grid"><span><b>给马的口令</b>前进、转向、停</span><i>≠</i><span><b>给手的口令</b>抬臂、瞄准、放弦</span></div>
      <div className="archery-card-verdict">共享同一靶心 ≠ 共用同一套动作。反例在“边跑边射”中射偏；正例通过“马先稳、手再射”命中——分开建模，按时协同。</div>
    </div>
  );
}

function ActionFault() {
  return (
    <div className="fault-stage action-fault fault-stage-real archery-only-fault">
      <MountedArcheryCard />
    </div>
  );
}

function TheaterCuePanel({ dreamed }: { dreamed: boolean }) {
  return (
    <div className={`prediction-panel theater-cue-panel ${dreamed ? "dreamed-rehearsal" : "clean-rehearsal"}`}>
      <div className="prediction-head"><span>{dreamed ? "正式演出 · DEPLOY" : "带标彩排 · TRAIN"}</span><b>{dreamed ? "自己脑补下一幕" : "导演给出正确下一幕"}</b><small>{dreamed ? "预测站位可能漂移" : "真实站位始终准确"}</small></div>
      <div className="theater-cue-stage">
        <svg viewBox="0 0 520 280" role="img" aria-label={dreamed ? "演员按照自己想象的错误灯光位置走位，最终走出真实聚光灯" : "演员按照导演给出的准确位置走入聚光灯"}>
          <defs><linearGradient id={dreamed ? "deployStageBg" : "trainStageBg"} x1="0" y1="0" x2="0" y2="1"><stop stopColor={dreamed ? "#31394b" : "#263d55"} /><stop offset="1" stopColor="#172238" /></linearGradient></defs>
          <rect width="520" height="280" fill={`url(#${dreamed ? "deployStageBg" : "trainStageBg"})`} />
          <path d="M0 211Q260 186 520 211V280H0Z" fill="#6f4c3c" />
          <path className="stage-board-lines" d="M0 232H520M0 256H520M108 203L86 280M206 198L194 280M314 198L326 280M412 203L434 280" />
          <path className="true-spotlight-beam" d="M330 0L272 234H388Z" />
          <ellipse className="true-stage-mark" cx="330" cy="232" rx="57" ry="18" />
          <text className="true-mark-label" x="330" y="237">真实站位</text>
          {dreamed ? <><path className="dream-spotlight-beam" d="M411 0L364 234H458Z" /><ellipse className="dreamed-stage-mark" cx="411" cy="232" rx="48" ry="16" /><text className="dream-mark-label" x="411" y="237">脑补站位</text></> : null}
          <g className={`stage-performer ${dreamed ? "walk-to-dream" : "walk-to-truth"}`}>
            <circle className="performer-head" cx="98" cy="132" r="21" />
            <path className="performer-hat" d="M77 125Q98 96 119 125Z" />
            <path className="performer-robe" d="M76 153Q98 140 120 153L137 224H59Z" />
            <line className="performer-arm" x1="79" y1="160" x2="47" y2="184" />
            <line className="performer-arm" x1="117" y1="160" x2="146" y2="180" />
            <circle className="performer-eye" cx="106" cy="130" r="3" />
          </g>
          <g className={`cue-card ${dreamed ? "self-cue" : "director-cue"}`}>
            <rect x="24" y="24" width="190" height="62" rx="12" />
            <text x="119" y="48">{dreamed ? "演员想象的下一幕" : "导演给出的下一幕"}</text>
            <text className="cue-main" x="119" y="72">{dreamed ? "“灯光大概在右边”" : "“走进中央聚光灯”"}</text>
          </g>
          {dreamed ? <path className="thought-drift" d="M218 72q38-24 77 0t76 0" /> : <path className="director-guide" d="M219 62Q278 84 324 202" />}
        </svg>
        <div className="cue-stage-caption">{dreamed ? <><b>× 走到错误位置</b><span>演员相信了自己预测的未来</span></> : <><b>✓ 正确走进灯光</b><span>演员始终看到完美未来</span></>}</div>
      </div>
      <div className={`state-vector ${dreamed ? "warning" : ""}`}><span>条件上下文</span><code>{dreamed ? "ẑₜ₊₁" : "z*ₜ₊₁"}</code><b>{dreamed ? "自预测 + 位姿漂移" : "导演提供 + 准确站位"}</b></div>
    </div>
  );
}

function TrainFault() {
  return (
    <div className="fault-stage train-fault fault-stage-real">
      <div className="prediction-compare theater-train-compare">
        <TheaterCuePanel dreamed={false} />
        <div className="inverse-bridge theater-gap-bridge"><span>同一个演员</span><i>≠</i><b>看到的“下一幕”变了</b></div>
        <TheaterCuePanel dreamed />
      </div>
      <div className="deployment-consequence theater-consequence">
        <div><small>传统训练只练</small><b>“接导演给出的正确下一幕”</b><span>Ground-Truth Future → Action</span></div>
        <i>≠</i>
        <div><small>正式演出真正面对</small><b>“接住自己想出来的下一幕”</b><span>Self-Predicted Future → Action</span></div>
      </div>
      <div className="dream-forcing-story-hint"><b>Dream Forcing 的想法</b><span>彩排时就撤掉导演标记，让演员从自己脑补的下一幕继续演——训练条件终于和正式演出一致。</span></div>
      <p>问题不是演员不会走位，而是彩排时永远有人给正确答案，正式上台却只能依赖自己的预测。</p>
    </div>
  );
}

export function HeroSection({ onStart }: { onStart: () => void }) {
  const [fault, setFault] = useState<Fault>("temporal");
  const select = (next: Fault) => setFault(next);
  return (
    <SectionShell
      index={1}
      eyebrow="The problem"
      title={<>问题不在模型规模，<br />而在世界预测与真实控制之间的三重错配。</>}
      className="hero-screen"
    >
      <p className="hero-mismatch-line" aria-label="三种结构错配">
        <span className="is-temporal">时间粒度 <small>Temporal</small></span><i>·</i>
        <span className="is-action">动作空间 <small>Action-Space</small></span><i>·</i>
        <span className="is-train">训练—部署 <small>Train-Test</small></span>
      </p>
      <div className="hero-grid">
        <div className="hero-stage-stack">
          <div className="problem-visual">
            <div className="problem-robot"><LabRobot compact armLift={fault === "action" ? 24 : 8} stable={fault !== "action"} /></div>
            <div className="fault-switch" role="group" aria-label="三种结构错配">
              {faults.map(([id, letter, label]) => (
                <button key={id} className={fault === id ? "is-active" : ""} onClick={() => select(id)}>
                  <span>{letter}</span>{label}
                </button>
              ))}
            </div>
            <div className="fault-viewport">
              {fault === "temporal" ? <TemporalFault /> : null}
              {fault === "action" ? <ActionFault /> : null}
              {fault === "train" ? <TrainFault /> : null}
              {fault === "all" ? (
                <div className="fault-summary fault-summary-premium">
                  <span><i>A</i><b>Temporal Gap</b><small>关键帧之间缺少运动语义</small></span>
                  <span><i>B</i><b>Action Gap</b><small>底盘与机械臂动力学冲突</small></span>
                  <span><i>C</i><b>Train-Test Gap</b><small>完美未来与自预测未来错位</small></span>
                  <strong><em>ONE MODEL · THREE ALIGNMENTS</em>ABot-M0.5 = 对齐这三种结构错配</strong>
                </div>
              ) : null}
            </div>
          </div>
          <div className="hero-stage-actions">
            <span>AMAP CV Lab · Alibaba Group · 2026</span>
            <button className="primary-cta" onClick={onStart}><b>▶</b>继续：进入总体思路</button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function CorePipeline() {
  const [step, setStep] = useState(0);
  const timer = useRef<number | null>(null);
  const run = () => {
    if (timer.current) window.clearInterval(timer.current);
    setStep(1);
    let next = 1;
    timer.current = window.setInterval(() => {
      next += 1;
      setStep(next);
      if (next >= 6 && timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 820);
  };
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  const buttonCopy = step === 0 ? "运行一次" : step < 3 ? "正在想象未来…" : step < 4 ? "正在理解运动…" : step < 6 ? "正在生成并执行动作…" : "再次运行";
  return (
    <SectionShell
      index={2}
      eyebrow="The mental model"
      title="先想未来，再理解运动，最后行动"
      lead={<>这一页只记住三个变量：<Term tip="未来视觉状态的潜变量，承担显式世界预测。">z</Term>、<Term tip="由相邻视觉变化抽象出的 frame-level motion representation，不是电机指令。">m</Term>、<Term tip="真正发送给机器人执行器的控制。">a</Term>。</>}
    >
      <div className="pipeline-demo">
        <div className={`pipeline-visual pipeline-cinema step-${step}`}>
          <div className="pipeline-timebar" aria-label="世界动作推演进度">
            {["当前观测", "想象未来 z", "理解运动 m", "生成动作 a", "新观测"].map((label, index) => {
              const threshold = [0, 1, 3, 4, 6][index];
              return <span key={label} className={step >= threshold ? "is-active" : ""}><i />{label}</span>;
            })}
          </div>
          <div className="pipeline-storyboard">
            <div className="observation-cap input-cap">
              <div className="cap-head"><span>INPUT</span><b>o≤t</b></div>
              <img src="/images/hang-cup-frames/frame-1.webp" alt="当前机器人观测" />
              <small>当前真实观测</small>
            </div>
            <div className={`story-connector ${step >= 1 ? "is-active" : ""}`}><i>→</i><small>world model</small></div>

            <article className={`mechanism-stage dream-stage ${step >= 1 ? "is-active" : ""} ${step >= 3 ? "is-done" : ""}`}>
              <header><span>01 · DREAM THE WORLD</span><b>z</b></header>
              <h3>真的“想象”未来画面</h3>
              <div className="dream-monitor">
                <img src="/images/hang-cup-demo.webp" alt="用于解释世界模型未来想象的官方机器人演示画面" />
                <div className="dream-overlay"><span>PREDICTED FUTURE</span><b>t+1 → t+H</b></div>
                <div className="dream-scan" />
                <div className="dream-frame-index"><i /><i /><i /><i /></div>
              </div>
              <p>从当前观测生成一段可能发生的未来：机械臂靠近杯把，抓住并抬起。</p>
              <div className="stage-output"><span>Future video latent</span><code>ẑ<sub>t+1:t+H</sub></code></div>
            </article>

            <div className={`story-connector ${step >= 3 ? "is-active" : ""}`}><i>→</i><small>local change</small></div>

            <article className={`mechanism-stage motion-stage ${step >= 3 ? "is-active" : ""} ${step >= 4 ? "is-done" : ""}`}>
              <header><span>02 · UNDERSTAND MOTION</span><b>m</b></header>
              <h3>把画面变化读成运动意图</h3>
              <div className="motion-decoder">
                <img src="/images/hang-cup-frames/frame-3.webp" alt="机械臂运动意图分析画面" />
                <svg viewBox="0 0 260 142" preserveAspectRatio="none" aria-hidden="true"><path d="M62 38 C105 28 126 58 158 76 S196 91 220 111" /><circle cx="62" cy="38" r="5" /><circle cx="158" cy="76" r="5" /><circle cx="220" cy="111" r="5" /></svg>
                <span className="intent-label approach">靠近</span><span className="intent-label align">对准</span><span className="intent-label grasp">闭合</span>
              </div>
              <div className="motion-token-row"><span>approach</span><i>→</i><span>align</span><i>→</i><span>grasp</span><i>→</i><span>lift</span></div>
              <p>m 不是电机命令，而是相邻预测帧之间“变化如何发生”的 frame-level 表示。</p>
              <div className="stage-output"><span>Latent motion intent</span><code>m̂<sub>t</sub></code></div>
            </article>

            <div className={`story-connector ${step >= 4 ? "is-active" : ""}`}><i>→</i><small>decode control</small></div>

            <article className={`mechanism-stage action-stage ${step >= 4 ? "is-active" : ""} ${step >= 6 ? "is-done" : ""}`}>
              <header><span>03 · EXECUTE</span><b>a</b></header>
              <h3>解码成机器人真正执行的动作</h3>
              <div className="control-console">
                <div className="control-command mobility-command"><b>Mobility</b><span>底盘保持稳定</span><code>vₓ=0 · ωz=0</code><i><em /></i></div>
                <div className="control-command manipulation-command"><b>Manipulation</b><span>闭合夹爪并抬升</span><code>Δz+ · g close</code><i><em /></i></div>
                <div className={`execution-mini ${step >= 5 ? "is-running" : ""}`}><LabRobot compact stable armLift={step >= 5 ? 48 : 15} /><CupTarget shifted={step < 6} /><span>{step >= 6 ? "执行完成" : "等待执行"}</span></div>
              </div>
              <p>同一个目标被解成两类可执行控制：底盘负责稳定站位，机械臂完成接触与抬升。</p>
              <div className="stage-output"><span>Executable control</span><code>â<sub>t</sub></code></div>
            </article>

            <div className={`story-connector ${step >= 6 ? "is-active" : ""}`}><i>→</i><small>environment</small></div>
            <div className={`observation-cap output-cap ${step >= 6 ? "is-active" : ""}`}>
              <div className="cap-head"><span>OUTPUT</span><b>oₜ₊₁</b></div>
              <img src="/images/hang-cup-frames/frame-5.webp" alt="执行动作后的新观测" />
              <small>动作后的新观测</small>
            </div>
          </div>
          <div className="pipeline-live-caption" aria-live="polite">
            <span>{step < 1 ? "READY" : step < 3 ? "WORLD MODEL" : step < 4 ? "LATENT ACTION" : step < 6 ? "ACTION DECODER" : "CLOSED LOOP"}</span>
            <b>{step < 1 ? "点击运行，观察一次完整的世界—运动—动作推演" : step < 3 ? "正在从当前观测生成未来视频…" : step < 4 ? "正在从未来帧变化中抽取局部运动意图…" : step < 6 ? "正在把运动意图解码成底盘与机械臂控制…" : "动作改变环境，新观测将成为下一轮推演的输入。"}</b>
          </div>
        </div>
        <div className="pipeline-control">
          <button className="run-button" onClick={run}>{buttonCopy}<span>▶</span></button>
          <div><div className="pipeline-legend"><span className="world-dot">z = World Dynamics</span><span className="latent-dot">m = Motion Intent</span><span className="control-dot">a = Executable Control</span></div><small className="causal-note">Causal rollout · 只使用当前与已生成上下文</small></div>
        </div>
      </div>
      <p className="single-takeaway"><b>z</b> 告诉机器人“未来会怎样”，<b>m</b> 告诉机器人“变化怎么发生”，<b>a</b> 才是真正执行的控制。</p>
      <details className="tech-detail"><summary>查看数学形式</summary><div><code>zₜ₊₁ → mₜ → aₜ</code><p>CFM 学习一个速度场，把随机噪声沿连续路径推向真实 video / latent action / action 数据。</p></div></details>
    </SectionShell>
  );
}

const frameLabels = ["远离", "接近", "对齐", "接触", "闭合", "提起"];
const intents = ["approaching", "aligning", "closing", "lifting"];

export function LatentActionDemo() {
  const [granularity, setGranularity] = useState(1);
  const [latentOn, setLatentOn] = useState(false);
  const visible = useMemo(() => {
    if (granularity === 0) return new Set([0, 5]);
    if (granularity === 1) return new Set([0, 2, 5]);
    if (granularity === 2) return new Set([0, 1, 2, 4, 5]);
    return new Set([0, 1, 2, 3, 4, 5]);
  }, [granularity]);
  return (
    <SectionShell index={3} eyebrow="Innovation 1 · Temporal Alignment" title="视频告诉我到了哪里，m 告诉我怎么过去">
      <div className="latent-demo">
        <div className="granularity-control">
          <label htmlFor="granularity">Video Temporal Granularity</label>
          <div><span>COARSE</span><input id="granularity" type="range" min="0" max="3" step="1" value={granularity} onChange={(e) => setGranularity(Number(e.target.value))} /><span>FINE</span></div>
        </div>
        <div className="frame-strip">
          {frameLabels.map((label, index) => (
            <React.Fragment key={label}>
              <div className={`grasp-frame ${visible.has(index) ? "is-visible" : "is-hidden"}`}>
                <span>{label}</span><div className="frame-cup" /><div className="frame-hand" style={{ left: `${8 + index * 9}%` }} />
              </div>
              {index < frameLabels.length - 1 ? (
                <div className={`latent-intent ${latentOn ? "is-on" : ""}`}><i>→</i><small>{intents[Math.min(index, intents.length - 1)]}</small></div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
        <div className="latent-control-row">
          <p>{granularity <= 1 && !latentOn ? "知道从这里到了那里，却看不见中间如何运动。" : latentOn ? "m 把相邻视觉变化压缩成局部运动意图。" : "更细视频能暴露过程，但仍不是可执行控制。"}</p>
          <button className={latentOn ? "toggle is-on" : "toggle"} onClick={() => setLatentOn((v) => !v)} aria-pressed={latentOn}><span /> + Latent Action</button>
        </div>
      </div>
      <div className="section-bottom">
        <Evidence from="87.60" to="94.00" caption="RoboTwin 2.0 (Clean) ablation · Success Rate" />
        <p className="single-takeaway">Latent Action 不是“多加一层”，而是给粗视频与高频控制建立<b>正确的中间尺度</b>。</p>
      </div>
    </SectionShell>
  );
}

type MotMode = "entangled" | "isolated" | "dmot";
export function DualMoTDemo() {
  const [mode, setMode] = useState<MotMode>("entangled");
  const copy = {
    entangled: ["Gradient Interference", "不同频率与动力学挤进同一个 FFN，彼此竞争。"],
    isolated: ["No Coordination", "底盘与机械臂完全断开，抓取前无法协商站位。"],
    dmot: ["Specialized but Coordinated", "共享注意力负责协调，独立 FFN 负责专业化。"],
  }[mode];
  return (
    <SectionShell index={4} eyebrow="Innovation 2 · Action-Space Alignment" title="手脚要分工，但不能失去配合">
      <div className="mot-demo">
        <div className="mode-chips" role="group" aria-label="动作建模结构">
          <button className={mode === "entangled" ? "is-active" : ""} onClick={() => setMode("entangled")}>Entangled</button>
          <button className={mode === "isolated" ? "is-active" : ""} onClick={() => setMode("isolated")}>Fully Isolated</button>
          <button className={mode === "dmot" ? "is-active" : ""} onClick={() => setMode("dmot")}>Dual-Level MoT</button>
        </div>
        <div className="mot-level-one"><b>Level 1 · Modality</b><span>Video</span><span>Latent Action</span><span>Action</span><small>各自投影与预测结构，共享跨模态推理主干</small></div>
        <div className={`mot-architecture mode-${mode}`}>
          <div className="shared-attention"><small>{mode === "isolated" ? "NO SHARED CONTEXT" : "JOINT SELF-ATTENTION"}</small><span className="attention-pulse" /></div>
          <div className="expert-grid">
            <div className="expert mobility"><strong>Mobility Expert</strong><span>{mode === "entangled" ? "Shared FFN" : "Mobility FFN"}</span><svg viewBox="0 0 240 48"><path d="M2 26 C44 8 76 42 118 25 S198 12 238 26" /></svg><small>低频 · 平滑 · 全局</small></div>
            <div className="expert manipulation"><strong>Manipulation Expert</strong><span>{mode === "entangled" ? "Shared FFN" : "Manipulation FFN"}</span><svg viewBox="0 0 240 48"><path d="M2 25 L24 25 35 7 47 42 61 12 74 38 92 9 108 42 126 14 142 37 160 8 178 43 194 13 211 36 238 25" /></svg><small>高频 · 精细 · 接触丰富</small></div>
          </div>
          <div className="mot-coordination"><LabRobot compact stable={mode === "dmot"} armLift={mode === "isolated" ? 2 : 36} /><CupTarget /><span>{copy[0]}</span></div>
        </div>
        <div className={`concept-feedback ${mode === "dmot" ? "is-good" : "is-bad"}`}><strong>{copy[0]}</strong><span>{copy[1]}</span></div>
      </div>
      <div className="section-bottom">
        <Evidence from="0.34" to="0.48" prefix="paper-reported evaluation score" caption="Selected RoboCasa365 Composite-Seen subset · paper ablation" />
        <p className="single-takeaway"><b>Attention 负责“商量”，Experts 负责“各干各的”。</b>解耦不是隔离。</p>
      </div>
    </SectionShell>
  );
}

export function DreamForcingDemo() {
  const [error, setError] = useState(45);
  const [deployed, setDeployed] = useState(false);
  const level = error < 34 ? "LOW" : error < 67 ? "MEDIUM" : "HIGH";
  const run = () => { setDeployed(false); window.setTimeout(() => setDeployed(true), 30); };
  return (
    <SectionShell index={5} eyebrow="Innovation 3 · Train-Test Alignment" title="训练时，也面对自己会犯的错误">
      <div className="dream-demo">
        <div className="error-control">
          <label htmlFor="prediction-error">Prediction Error <b>{level}</b></label>
          <input id="prediction-error" type="range" min="0" max="100" value={error} onChange={(e) => setError(Number(e.target.value))} />
          <span>Conceptual visualization · 不代表实验指标</span>
        </div>
        <div className="forcing-panels">
          <div className="forcing-panel teacher">
            <div className="forcing-head"><small>LEFT</small><strong>Teacher Forcing</strong></div>
            <div className="train-context"><span>TRAIN</span><b>GT Future → Action</b><i>完美未来</i></div>
            <div className={`deploy-scene ${deployed ? "is-running" : ""}`} style={{ "--blur": `${error * .026}px`, "--drift": `${error * .065}px` } as React.CSSProperties}>
              <div className="dream-frame"><CupTarget shifted={deployed && error > 18} /></div>
              <LabRobot compact stable={!deployed || error < 25} armLift={deployed ? Math.max(0, 48 - error * .34) : 38} />
            </div>
            <p>{deployed ? "训练从没见过这种未来。" : "部署后只能看到预测未来。"}</p>
          </div>
          <div className="forcing-divider"><span>GT Future → Action</span><i>↓</i><strong>Self-Dreamed Future → Action</strong></div>
          <div className="forcing-panel dream">
            <div className="forcing-head"><small>RIGHT</small><strong>Dream Forcing</strong></div>
            <div className="phase-line"><span>Phase A</span><b>生成 ẑ 与 m̂</b><i>imperfect</i></div>
            <div className="phase-line"><span>Phase B</span><b>ẑ, m̂ → Action</b><i>adapted</i></div>
            <div className={`deploy-scene ${deployed ? "is-running" : ""}`} style={{ "--blur": `${error * .011}px`, "--drift": `${error * .025}px` } as React.CSSProperties}>
              <div className="dream-frame"><CupTarget shifted={deployed && error > 70} /></div>
              <LabRobot compact stable armLift={deployed ? Math.max(30, 48 - error * .12) : 38} />
            </div>
            <p>{deployed ? "动作模型已经见过同类误差。" : "训练条件提前模拟部署条件。"}</p>
          </div>
        </div>
        <button className="deploy-button" onClick={run}>Deploy <span>→</span></button>
      </div>
      <div className="df-evidence">
        <div><small>Shared checkpoint</small><b>67.55%</b></div>
        <div><small>Teacher Forcing +5k</small><b>66.78%</b></div>
        <div className="best"><small>Dream Forcing +5k</small><b>70.56%</b></div>
        <span>RoboCasa365 Target 100% · Atomic-Seen · same warm start</span>
      </div>
      <p className="single-takeaway">Dream Forcing 不要求世界模型永远正确，而是让动作模型学会在<b>不完美未来</b>上仍然正确行动。</p>
      <details className="tech-detail"><summary>查看条件分布</summary><div><code>p(aₜ | zₜ₊₁, mₜ, …)　→　p(aₜ | ẑₜ₊₁, m̂ₜ, …)</code><p>仅把未来条件替换为模型自生成的 ẑₜ₊₁ 与 m̂ₜ；Dream Forcing 是训练策略。</p></div></details>
    </SectionShell>
  );
}
