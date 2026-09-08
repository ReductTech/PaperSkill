import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const A = '/images/robodojo/';
const V = `${A}videos/`;
const G = `${A}generated/`;
const D = `${A}data/`;

type Feedback = { text: string; cls?: string };

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  return <div className={`feedback ${feedback.cls || ''}`}>{feedback.text}</div>;
}

function MiniBars({ rows, max = 100, unit = '' }: { rows: { label: string; value: number; color?: string }[]; max?: number; unit?: string }) {
  return (
    <div className="rj-bars">
      {rows.map((r) => (
        <div className="rj-bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="rj-bar-track">
            <i style={{ width: `${Math.max(2, Math.min(100, (r.value / max) * 100))}%`, background: r.color }} />
          </div>
          <b>
            {r.value.toFixed(r.value < 10 ? 2 : 1)}
            {unit}
          </b>
        </div>
      ))}
    </div>
  );
}

export const HeroOld: React.FC<WidgetProps> = () => (
  <div className="rj-hero-widget">
    <div className="rj-score-card">
      <span>Pick-and-Place</span>
      <b>90%</b>
      <small>只看单题高分</small>
    </div>
    <div className="rj-unknown-grid">
      {['泛化', '记忆', '长程', '精细', '开放', '真实'].map((x) => (
        <i key={x}>{x}?</i>
      ))}
    </div>
  </div>
);

export const HeroNew: React.FC<WidgetProps> = () => (
  <div className="rj-hero-widget">
    <div className="rj-exam-card">
      <b>RoboDojo</b>
      <span>42 sim tasks + 18 real tasks</span>
    </div>
    <div className="rj-path-mini">
      <i>Simulation diagnosis</i>
      <strong>+</strong>
      <i>Real-world validation</i>
    </div>
  </div>
);

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => (
  <div className="rj-analogy">
    <div className="rj-table" />
    <div className={`rj-token rj-token-${chapterId.replace('chap-', '')}`} />
    <div className="rj-target" />
  </div>
);

export const SingleScoreProbe: React.FC<WidgetProps> = () => {
  const [choice, setChoice] = useState('unknown');
  const feedback =
    choice === 'yes'
      ? { text: '太快下结论了：单任务 90% 只说明这个任务做得好，不能覆盖记忆、长程、开放任务和真实接触误差。', cls: 'bad' }
      : choice === 'no'
        ? { text: '判断更稳：RoboDojo 的出发点就是把“会一题”和“通用可靠”分开测。', cls: 'good' }
        : { text: '先别急着给它 generalist 标签。缺失的能力维度，才是这个问题的关键。' };
  return (
    <div>
      <div className="rj-two-col">
        <div className="rj-panel">
          <div className="rj-big-number">90%</div>
          <b>Pick-and-Place 成功率</b>
          <p>只来自一个熟悉、短时、目标明确的操作题。</p>
        </div>
        <div className="rj-panel">
          <b>还没有被证明的能力</b>
          <div className="rj-chip-grid">
            {['Generalization', 'Memory', 'Long-Horizon', 'Precision', 'Open', 'Real-world'].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="chip-row">
        <button className={`chip ${choice === 'yes' ? 'selected' : ''}`} onClick={() => setChoice('yes')}>
          可以证明
        </button>
        <button className={`chip ${choice === 'no' ? 'selected' : ''}`} onClick={() => setChoice('no')}>
          不能证明
        </button>
      </div>
      <FeedbackLine feedback={feedback} />
    </div>
  );
};

export const SweepBlocksProbe: React.FC<WidgetProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<'start' | 'lifted' | 'question'>('start');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      video.currentTime = 0.01;
      video.pause();
    };
    video.addEventListener('loadedmetadata', onMeta);
    return () => video.removeEventListener('loadedmetadata', onMeta);
  }, []);

  const playToThree = () => {
    const video = videoRef.current;
    if (!video) return;
    setStage('start');
    video.currentTime = 0;
    void video.play();
  };

  const reset = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0.01;
    }
    setStage('start');
  };

  return (
    <div className="rj-sweep-probe">
      <div className="rj-sweep-copy">
        <span className="rj-mini-label">High-score trap</span>
        <h5>{stage === 'question' ? '当前机器是否可以利用刷子将小方块扫入正确位置？' : '当前机器是否可以将刷子拿起'}</h5>
        <p>
          {stage === 'start'
            ? '我们先只看一个局部动作：机器人能不能拿起刷子。先别急着判断它是否“通用”。'
            : stage === 'lifted'
              ? '机器人可以正确拿起刷子，因此在这个局部子目标上可以给它一个单任务局部高分。'
              : '现在问题变了：拿起刷子只是开始，它是否能用刷子把小方块扫入正确位置，仍然是未知的。'}
        </p>
        <div className="step-ctrl rj-left-ctrl">
          <button className="tiny" onClick={playToThree}>
            播放到 3 秒
          </button>
          <button className="tiny ghost" disabled={stage !== 'lifted'} onClick={() => setStage('question')}>
            继续追问
          </button>
          <button className="tiny ghost" onClick={reset}>
            重置
          </button>
        </div>
      </div>
      <div className="rj-sweep-video-wrap">
        <video
          ref={videoRef}
          src={`${V}sweep-blocks.mp4`}
          muted
          playsInline
          preload="auto"
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= 3 && stage === 'start') {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 3;
              setStage('lifted');
            }
          }}
        />
        {stage === 'lifted' ? <div className="rj-score-stamp">单任务局部高分</div> : null}
        {stage === 'question' ? <div className="rj-question-mark">?</div> : null}
      </div>
      <div className="rj-sweep-summary">
        <FeedbackLine
          feedback={{
            text:
              stage === 'question'
                ? '一次高分，能证明机器人“通用”吗？不能。RoboDojo 正是要把“拿起刷子这种局部会做”和“能稳定完成复杂目标”拆开评测。'
                : '先观察局部动作，再继续追问完整任务。这个流程比直接看一个分数更接近 RoboDojo 的诊断思路。',
            cls: stage === 'question' ? 'good' : '',
          }}
        />
      </div>
    </div>
  );
};

export const EvalScopeSwitch: React.FC<WidgetProps> = () => {
  const modes = {
    sim: {
      title: 'Sim only',
      text: '仿真可以高速、可控、可复现地诊断能力，但接触、感知噪声和执行误差仍来自模拟器。',
      cls: '',
    },
    real: {
      title: 'Real only',
      text: '真实世界直接反映部署可靠性，但贵、慢，并且很难对每次 reset 做到完全一致。',
      cls: '',
    },
    both: {
      title: 'Sim + Real',
      text: 'RoboDojo 把 simulation capability diagnosis 与 reproducible real-world validation 放到同一套评测基础设施里。',
      cls: 'good',
    },
  };
  const [mode, setMode] = useState<keyof typeof modes>('both');
  return (
    <div>
      <div className="rj-eval-switch">
        {Object.entries(modes).map(([k, m]) => (
          <button key={k} className={`chip ${mode === k ? 'selected' : ''}`} onClick={() => setMode(k as keyof typeof modes)}>
            {m.title}
          </button>
        ))}
      </div>
      <div className={`rj-scope-visual ${mode}`}>
        <div>Simulation</div>
        <div>Real-world</div>
      </div>
      <FeedbackLine feedback={{ text: modes[mode].text, cls: modes[mode].cls }} />
    </div>
  );
};

const capabilities = {
  Generalization: {
    count: 12,
    definition: '同一技能遇到新布局、新物体或随机化条件时，能不能继续成立。',
    task: 'stack-bowls / stack-bowls-random',
    failure: '标准场景还会做，随机条件一来就崩。',
    video: `${V}Generalization/stack-bowls.mp4`,
    extra: `${V}Generalization/stack-bowls-random.mp4`,
  },
  Memory: {
    count: 6,
    definition: '需要记住先前观察、被遮挡状态或顺序信息的操作能力。',
    task: 'cover-blocks',
    failure: '只看当前帧，忘记目标曾经在哪里。',
    video: `${V}Memory/cover-blocks.mp4`,
  },
  'Long-Horizon': {
    count: 8,
    definition: '多步子目标持续推进，前面一步错了会影响后面。',
    task: 'fill-pen-holder',
    failure: '短动作会做，组合成长任务后误差累积。',
    video: `${V}Long-Horizon/fill-pen-holder.mp4`,
  },
  Precision: {
    count: 8,
    definition: '对位、插入、旋紧等需要小误差容忍度的精细控制。',
    task: 'fasten-screws',
    failure: '大方向对了，但末端姿态和接触力不够准。',
    video: `${V}Precision/fasten-screws.mp4`,
  },
  Open: {
    count: 8,
    definition: '开放式目标或更灵活的语义约束，不只是照着固定脚本完成。',
    task: 'align-blocks',
    failure: '模型能执行熟悉动作，却难以理解更开放的目标结构。',
    video: `${V}Open/align-blocks.mp4`,
  },
};

export const CapabilitySelector: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<keyof typeof capabilities>('Generalization');
  const c = capabilities[active];
  const hasExtra = 'extra' in c;
  return (
    <div>
      <div className="chip-row">
        {Object.keys(capabilities).map((k) => (
          <button key={k} className={`chip ${active === k ? 'selected' : ''}`} onClick={() => setActive(k as keyof typeof capabilities)}>
            {k}
          </button>
        ))}
      </div>
      <div className={`rj-capability ${hasExtra ? 'dual' : 'single'}`}>
        <div className="rj-capability-copy">
          <h5>{active}</h5>
          <p>{c.definition}</p>
          <MiniBars rows={[{ label: 'tasks', value: c.count, color: '#27446e' }]} max={12} />
          <p>
            <b>代表任务：</b>
            {c.task}
          </p>
          <p>
            <b>典型失败：</b>
            {c.failure}
          </p>
        </div>
        <div className={`rj-video-stack ${hasExtra ? 'dual' : 'single'}`}>
          <figure>
            <b>{hasExtra ? 'Standard' : c.task}</b>
            <video key={c.video} src={c.video} controls muted playsInline />
          </figure>
          {hasExtra ? (
            <figure>
              <b>Randomized</b>
              <video key={'extra' in c ? c.extra : 'extra'} src={'extra' in c ? c.extra : ''} controls muted playsInline />
            </figure>
          ) : null}
        </div>
      </div>
      <FeedbackLine feedback={{ text: '42 道仿真题不是铺成清单，而是被组织成五种能力诊断。Overall simulation result 对五个维度等权平均。', cls: 'good' }} />
    </div>
  );
};

export const ScoreStepper: React.FC<WidgetProps> = () => {
  const steps = ['抓到物体', '移动到目标区域', '姿态对齐', '释放并稳定'];
  const [step, setStep] = useState(1);
  const score = step / steps.length;
  const success = step === steps.length ? 1 : 0;
  return (
    <div>
      <div className="rj-task-stage">
        {steps.map((s, i) => (
          <div key={s} className={i < step ? 'done' : ''}>
            <i>{i + 1}</i>
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 1} onClick={() => setStep((x) => Math.max(1, x - 1))}>
          上一步
        </button>
        <span className="step-label">
          Step <b>{step}</b> / {steps.length}
        </span>
        <button className="tiny" disabled={step === steps.length} onClick={() => setStep((x) => Math.min(steps.length, x + 1))}>
          下一步
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">教学示意 Score</div>
          <div className="v">{score.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">Success Rate</div>
          <div className="v">{success}</div>
        </div>
        <div className="metric">
          <div className="l">判断</div>
          <div className="v">{success ? '完成' : '未完成'}</div>
        </div>
      </div>
      <FeedbackLine
        feedback={{
          text: success
            ? '全部完成时 SR 才是 1；Score 可以表达过程进展。这里是 Score 和 SR 的教学示意，不代表 RoboDojo 所有任务采用统一子步骤权重。'
            : '中间步骤能让示意 Score 上升，但最终完成前 SR 仍是 0。',
          cls: success ? 'good' : '',
        }}
      />
    </div>
  );
};

export const OverallCalculator: React.FC<WidgetProps> = () => {
  const [open, setOpen] = useState(2);
  const dims = [22, 12, 24, 14, open];
  const equal = dims.reduce((a, b) => a + b, 0) / 5;
  const taskWeighted = (22 * 12 + 12 * 6 + 24 * 8 + 14 * 8 + open * 8) / 42;
  return (
    <div>
      <div className="ctrl">
        <label>
          Open 维度示例分 <span className="val">{open.toFixed(1)}</span>
        </label>
        <input type="range" min={0} max={20} value={open} onChange={(e) => setOpen(Number(e.target.value))} />
      </div>
      <MiniBars
        rows={[
          { label: 'Generalization', value: dims[0] },
          { label: 'Memory', value: dims[1] },
          { label: 'Long-Horizon', value: dims[2] },
          { label: 'Precision', value: dims[3] },
          { label: 'Open', value: dims[4], color: '#d97706' },
        ]}
        max={30}
      />
      <div className="metrics">
        <div className="metric">
          <div className="l">五维等权 Overall</div>
          <div className="v">{equal.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">按 42 tasks 粗平均</div>
          <div className="v">{taskWeighted.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">RoboDojo 报告</div>
          <div className="v">等权</div>
        </div>
      </div>
      <FeedbackLine feedback={{ text: 'Overall simulation result 必须先在五个 capability dimension 上汇总，再等权平均；不能直接把 42 个 task 混成一个大池子。', cls: 'good' }} />
    </div>
  );
};

export const SimRealSync: React.FC<WidgetProps> = () => {
  const simRef = useRef<HTMLVideoElement>(null);
  const realRef = useRef<HTMLVideoElement>(null);
  const [topic, setTopic] = useState('Pixels');
  const topics: Record<string, string> = {
    Pixels: 'SIM 的 observation 来自渲染与仿真状态；REAL 的 observation 来自相机、光照和实际传感噪声。',
    Physics: 'SIM 的接触和动力学由物理引擎近似；REAL 的摩擦、碰撞和柔顺性来自真实桌面。',
    Noise: '真实世界会把镜头抖动、遮挡、反光、执行误差一起带进观测。',
    Reset: '仿真 reset 可以精确复位；真实 reset 需要 RealEval 这类布局重放来降低变化。',
    Scale: '仿真扩展快，真实评测慢而贵；两者互补，不是一一配对的 sim-to-real transfer benchmark。',
  };
  const sync = (play: boolean) => {
    const sim = simRef.current;
    const real = realRef.current;
    if (!sim || !real) return;
    real.currentTime = sim.currentTime;
    if (play) {
      void sim.play();
      void real.play();
    } else {
      sim.pause();
      real.pause();
    }
  };
  return (
    <div>
      <div className="rj-video-pair">
        <div>
          <b>SIM</b>
          <video ref={simRef} src={`${V}RealRobot/classify-objects-Simulation.mp4`} controls muted playsInline />
        </div>
        <div>
          <b>REAL</b>
          <video ref={realRef} src={`${V}RealRobot/classify-objects-real.mp4`} controls muted playsInline />
        </div>
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => sync(true)}>
          同步播放
        </button>
        <button className="tiny ghost" onClick={() => sync(false)}>
          同步暂停
        </button>
      </div>
      <div className="chip-row">
        {Object.keys(topics).map((t) => (
          <button key={t} className={`chip ${topic === t ? 'selected' : ''}`} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>
      <img className="rj-explainer" src={`${G}02_sim_vs_real_explainer.png`} alt="Sim versus real explainer" />
      <FeedbackLine feedback={{ text: `区别不是任务画面像不像，而是 observation 和 physics 从哪里来。${topics[topic]}`, cls: topic === 'Scale' ? 'good' : '' }} />
    </div>
  );
};

export const SystemArchitecture: React.FC<WidgetProps> = () => {
  const [node, setNode] = useState('XPolicyLab');
  const info: Record<string, { problem: string; mechanisms: string[] }> = {
    Policy: { problem: '不同 policy 需要在统一观察-动作接口下参赛。', mechanisms: ['输入观察', '输出动作', '不把接口差异当能力差异'] },
    XPolicyLab: { problem: '统一插头：把不同机器人 policy 接到 sim 和 real 两种考试。', mechanisms: ['common data conversion', 'training template', 'deployment procedure', 'evaluation scripts', '30 integrated policies'] },
    Simulation: { problem: '高速、可控、可并行的能力诊断考场。', mechanisms: ['Isaac Sim / Isaac Lab', 'configuration-driven setup', 'asset library', 'trajectory synthesis + VR teleoperation'] },
    RealEval: { problem: '标准化真实机器人考场。', mechanisms: ['fixed robot / camera poses', 'controlled lighting', 'layout replay', 'touchscreen', 'emergency stop', 'cloud scoring'] },
  };
  return (
    <div>
      <div className="rj-architecture">
        {['Policy', 'XPolicyLab', 'Simulation', 'RealEval'].map((n) => (
          <button key={n} className={node === n ? 'active' : ''} onClick={() => setNode(n)}>
            {n}
          </button>
        ))}
        <svg viewBox="0 0 720 180" aria-hidden="true">
          <path className="path sim" d="M120 90 C250 35 370 35 500 55" />
          <path className="path real" d="M120 90 C250 145 370 145 500 125" />
        </svg>
      </div>
      <div className="hotspot-info">
        <b>{node}</b>
        <p>{info[node].problem}</p>
        <div className="rj-chip-grid">{info[node].mechanisms.map((m) => <span key={m}>{m}</span>)}</div>
      </div>
      <FeedbackLine feedback={{ text: '点击节点会高亮它在综合考试中的角色：Policy 通过 XPolicyLab 同时接入仿真诊断和真实验证。', cls: 'good' }} />
    </div>
  );
};

export const ParallelismStepper: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: '传统 cloned environment', text: '同一类任务复制很多份，异构任务混跑效率受限。' },
    { title: 'Heterogeneous parallelism', text: '不同 task / asset / layout 可以同时运行，吞吐提升。' },
    { title: '带 π0.5 inference', text: '加入大模型推理后仍保留吞吐优势。' },
  ];
  return (
    <div>
      <div className={`rj-parallel step-${step}`}>
        <div>cloned env</div>
        <div>task / asset / layout</div>
        <div>policy inference</div>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
        <button className="tiny" disabled={step === 2} onClick={() => setStep((s) => s + 1)}>
          下一步
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / 3
        </span>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">无 π0.5 inference</div>
          <div className="v">77.4 / 40.0</div>
        </div>
        <div className="metric">
          <div className="l">提升</div>
          <div className="v">1.94x</div>
        </div>
        <div className="metric">
          <div className="l">带 π0.5 inference</div>
          <div className="v">64.0 / 39.2 = 1.63x</div>
        </div>
      </div>
      <FeedbackLine feedback={{ text: steps[step].text, cls: step > 0 ? 'good' : '' }} />
    </div>
  );
};

type LayoutObject = {
  id: string;
  sprite: string;
  source_bbox_px: number[];
  target_bbox_px: number[];
  source_center_norm: [number, number];
  target_center_norm: [number, number];
  snap_radius_norm: number;
};

type LayoutSpec = {
  note: string;
  objects: LayoutObject[];
};

const fallbackLayout: LayoutSpec = {
  note: 'Teaching reconstruction inspired by RoboDojo-RealEval layout replay; target positions are illustrative, not an official benchmark layout.',
  objects: [
    { id: 'blue_mug', sprite: 'drag_blue_mug.png', source_bbox_px: [58, 214, 99, 106], target_bbox_px: [150, 168, 99, 106], source_center_norm: [0.168, 0.5563], target_center_norm: [0.3117, 0.4604], snap_radius_norm: 0.045 },
    { id: 'yellow_mug', sprite: 'drag_yellow_mug.png', source_bbox_px: [188, 223, 110, 114], target_bbox_px: [292, 238, 110, 114], source_center_norm: [0.3797, 0.5833], target_center_norm: [0.5422, 0.6146], snap_radius_norm: 0.045 },
    { id: 'pink_mug', sprite: 'drag_pink_mug.png', source_bbox_px: [402, 238, 146, 123], target_bbox_px: [431, 171, 146, 123], source_center_norm: [0.7422, 0.624], target_center_norm: [0.7875, 0.4844], snap_radius_norm: 0.045 },
  ],
};

export const LayoutOverlayDrag: React.FC<WidgetProps> = () => {
  const [spec, setSpec] = useState<LayoutSpec>(fallbackLayout);
  const [positions, setPositions] = useState<Record<string, [number, number]>>(() =>
    Object.fromEntries(fallbackLayout.objects.map((o) => [o.id, o.source_center_norm]))
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.3);
  const [snap, setSnap] = useState(true);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${D}layout_overlay_spec.json`)
      .then((r) => r.json())
      .then((data: LayoutSpec) => {
        setSpec(data);
        setPositions(Object.fromEntries(data.objects.map((o) => [o.id, o.source_center_norm])));
      })
      .catch(() => undefined);
  }, []);

  const aligned = useMemo(() => {
    return spec.objects.filter((o) => {
      const p = positions[o.id] || o.source_center_norm;
      return Math.hypot(p[0] - o.target_center_norm[0], p[1] - o.target_center_norm[1]) < o.snap_radius_norm;
    });
  }, [positions, spec]);

  const pointerToNorm = (e: React.PointerEvent<HTMLDivElement>): [number, number] => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))];
  };

  const move = (id: string, p: [number, number]) => {
    const obj = spec.objects.find((o) => o.id === id);
    if (!obj) return;
    const d0 = Math.hypot(p[0] - obj.target_center_norm[0], p[1] - obj.target_center_norm[1]);
    const next = snap && d0 < obj.snap_radius_norm ? obj.target_center_norm : p;
    setPositions((old) => ({ ...old, [id]: next }));
  };

  const finish = () => {
    setPositions((old) => {
      const next = { ...old };
      spec.objects.forEach((o) => {
        const p = next[o.id] || o.source_center_norm;
        if (Math.hypot(p[0] - o.target_center_norm[0], p[1] - o.target_center_norm[1]) < o.snap_radius_norm * 1.8) next[o.id] = o.target_center_norm;
      });
      return next;
    });
  };

  const allAligned = aligned.length === spec.objects.length;
  return (
    <div>
      <div className="rj-layout-grid">
        <div>
          <b>Target Layout</b>
          <img className="rj-layout-img" src={`${G}10_realeval_layout_target.png`} alt="Target layout" />
        </div>
        <div>
          <b>Current / Live View</b>
          <div
            className="rj-layout-board"
            ref={boardRef}
            onPointerMove={(e) => {
              if (!dragging) return;
              e.preventDefault();
              move(dragging, pointerToNorm(e));
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              setDragging(null);
            }}
            onPointerCancel={() => setDragging(null)}
          >
            <img className="base" src={`${G}09_realeval_layout_current.jpg`} alt="Current layout" />
            {showOverlay ? <img className="overlay" src={`${G}10_realeval_layout_target.png`} alt="" style={{ opacity }} /> : null}
            {spec.objects.map((o) => {
              const p = positions[o.id] || o.source_center_norm;
              const ok = aligned.some((x) => x.id === o.id);
              const w = (o.source_bbox_px[2] / 640) * 100;
              const h = (o.source_bbox_px[3] / 480) * 100;
              return (
                <img
                  key={o.id}
                  className={`mug ${ok ? 'aligned' : ''}`}
                  src={`${G}${o.sprite}`}
                  alt={o.id}
                  style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%`, width: `${w}%`, height: `${h}%` }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragging(o.id);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="ctrl">
        <button className="tiny ghost" onClick={() => setShowOverlay((x) => !x)}>
          {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
        </button>
        <label>
          Overlay opacity <span className="val">{Math.round(opacity * 100)}%</span>
        </label>
        <input type="range" min={0} max={60} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)} />
        <button className="tiny ghost" onClick={() => setSnap((x) => !x)}>
          Snap Assist {snap ? 'ON' : 'OFF'}
        </button>
        <button className="tiny ghost" onClick={() => setPositions(Object.fromEntries(spec.objects.map((o) => [o.id, o.source_center_norm])))}>
          Reset Layout
        </button>
        <button className="tiny" onClick={finish}>
          Finish Alignment
        </button>
      </div>
      <div className="rj-layout-note">
        Alignment Progress: <b>{aligned.length}/3</b>. Teaching reconstruction of RoboDojo-RealEval layout replay. Demo target positions are illustrative, not an official benchmark layout.
      </div>
      <FeedbackLine
        feedback={{
          text: allAligned
            ? 'Real-world benchmark 的难点之一，是每次测试的初始场景很难完全一致。RoboDojo-RealEval 通过 reference layout overlay replay 降低 reset variation，使不同模型和不同轮次更可比。'
            : '拖动三个 mug，让中心接近 overlay 目标。这里标准化的是评测前真实场景 reset，不是 policy 自己完成的 manipulation task。',
          cls: allAligned ? 'good' : '',
        }}
      />
    </div>
  );
};

export const StabilitySwitch: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState('public');
  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${mode === 'public' ? 'selected' : ''}`} onClick={() => setMode('public')}>
          Public Layout
        </button>
        <button className={`chip ${mode === 'hidden' ? 'selected' : ''}`} onClick={() => setMode('hidden')}>
          Hidden Verification
        </button>
      </div>
      <div className="rj-two-col">
        <div className="rj-panel">
          <b>可复现设置</b>
          <p>3 seeds；报告 mean / std；固定 robot / camera poses、光照、工作区。</p>
        </div>
        <div className="rj-panel">
          <b>真实评测成本</b>
          <p>18 tasks x 10 trials = 180 trials，约 202 min；视频由 3 名 double-blind evaluator 评分。</p>
        </div>
      </div>
      <FeedbackLine
        feedback={{
          text: mode === 'public' ? 'Public layout 让参赛者知道评测流程，便于复现。' : 'Hidden verification 降低只针对公开布局调参的 leaderboard gaming，让稳定性更接近真实泛化。',
          cls: mode === 'hidden' ? 'good' : '',
        }}
      />
    </div>
  );
};

export const ResultRace: React.FC<WidgetProps> = () => {
  const [run, setRun] = useState(false);
  const [finding, setFinding] = useState('Generalization');
  const findings: Record<string, string> = {
    Generalization: 'Hy-Embodied 在 standard generalization score 21.98，到 random 只有 1.57，drop 92.9%。',
    Open: 'π0.5 在 Open 维度只有 1.98 Score / 1.67% SR，开放目标仍是明显短板。',
    'Real-world': 'π0.5 Real-world Overall Score 22.9 / SR 12.8%，Human 为 100 / 100%。',
  };
  return (
    <div>
      <button className="tiny" onClick={() => setRun((x) => !x)}>
        Result Race
      </button>
      <div className={`rj-race ${run ? 'run' : ''}`}>
        <div><span>Best robot SR</span><i style={{ width: run ? '8.8%' : '0%' }} /><b>8.80%</b></div>
        <div><span>Human SR</span><i style={{ width: run ? '76.03%' : '0%' }} /><b>76.03%</b></div>
      </div>
      <div className="chip-row">
        {Object.keys(findings).map((f) => (
          <button key={f} className={`chip ${finding === f ? 'selected' : ''}`} onClick={() => setFinding(f)}>
            {f}
          </button>
        ))}
      </div>
      <FeedbackLine feedback={{ text: findings[finding], cls: finding === 'Generalization' ? 'bad' : '' }} />
    </div>
  );
};

type MetricMode = 'score' | 'success_rate';
type LeaderboardModel = {
  rank: number;
  model: string;
  generalization: Record<MetricMode, number>;
  memory: Record<MetricMode, number>;
  long_horizon: Record<MetricMode, number>;
  precision: Record<MetricMode, number>;
  open: Record<MetricMode, number>;
  average: Record<MetricMode, number>;
};
type LeaderboardData = {
  snapshot_date: string;
  top10: LeaderboardModel[];
  human_reference: LeaderboardModel;
};

const fallbackLeaderboard: LeaderboardData = {
  snapshot_date: '2026-07-03',
  top10: [],
  human_reference: {
    rank: 0,
    model: 'Human Expert (Teleop)',
    generalization: { score: 90.05, success_rate: 87.83 },
    memory: { score: 75.25, success_rate: 74.33 },
    long_horizon: { score: 83.63, success_rate: 74.25 },
    precision: { score: 68.06, success_rate: 64.0 },
    open: { score: 85.13, success_rate: 79.75 },
    average: { score: 80.42, success_rate: 76.03 },
  },
};

const dimUi = [
  ['generalization', 'Generalization'],
  ['memory', 'Memory'],
  ['long_horizon', 'Long-Horizon'],
  ['precision', 'Precision'],
  ['open', 'Open'],
] as const;

function fingerprint(m: LeaderboardModel, data: LeaderboardData, mode: MetricMode) {
  const values = dimUi.map(([k, label]) => ({ key: k, label, value: m[k][mode] }));
  const high = values.reduce((a, b) => (b.value > a.value ? b : a));
  const low = values.reduce((a, b) => (b.value < a.value ? b : a));
  const openLow = m.open[mode] <= 2;
  const top10Avg = dimUi.map(([k]) => data.top10.reduce((s, x) => s + x[k][mode], 0) / Math.max(1, data.top10.length));
  const rel = values.map((v, i) => ({ ...v, ratio: top10Avg[i] ? v.value / top10Avg[i] : 0 })).reduce((a, b) => (b.ratio > a.ratio ? b : a));
  return `${m.model} 相对更强在 ${rel.label || high.label}，自己的最低维度是 ${low.label}${openLow ? '，Open 仍是明显短板' : ''}。这里的“相对更强”只描述 capability profile，不等于该维度已经可靠。`;
}

export const LeaderboardMountain: React.FC<WidgetProps> = () => {
  const [data, setData] = useState<LeaderboardData>(fallbackLeaderboard);
  const [activeRank, setActiveRank] = useState(1);
  const [mode, setMode] = useState<MetricMode>('score');
  const [human, setHuman] = useState(false);
  useEffect(() => {
    fetch(`${D}leaderboard_top10_paper_snapshot.json`).then((r) => r.json()).then(setData).catch(() => undefined);
  }, []);
  const rows = data.top10;
  const active = rows.find((r) => r.rank === activeRank) || rows[0];
  const maxRobot = Math.max(...rows.map((r) => r.average.score), 13.07);
  return (
    <div>
      <div className="rj-mountain" style={{ backgroundImage: `url(${G}12_leaderboard_mountain_backdrop.png)` }}>
        <div className="human-beacon">Human Expert 80.42 / 76.03% SR</div>
        {rows.map((r, i) => {
          const h = Math.sqrt(r.average.score / maxRobot);
          return (
            <button
              key={r.model}
              className={`marker ${activeRank === r.rank ? 'active' : ''}`}
              style={{ left: `${8 + i * 9.3}%`, bottom: `${12 + h * 56}%` }}
              title="山峰高度是论文 frozen Average Score / rank 的可视化，不是真实百分比纵轴。"
              onClick={() => setActiveRank(r.rank)}
            >
              <span>#{r.rank}</span>
              <b>{r.average.score.toFixed(2)}</b>
            </button>
          );
        })}
      </div>
      <div className="chip-row">
        <button className={`chip ${mode === 'score' ? 'selected' : ''}`} onClick={() => setMode('score')}>Score</button>
        <button className={`chip ${mode === 'success_rate' ? 'selected' : ''}`} onClick={() => setMode('success_rate')}>Success Rate</button>
        <button className={`chip ${human ? 'selected' : ''}`} onClick={() => setHuman((x) => !x)}>Compare with Human</button>
      </div>
      {active ? (
        <div className="rj-leader-detail">
          <div>
            <h5>#{active.rank} {active.model}</h5>
            <p>Average Score {active.average.score.toFixed(2)} / Average SR {active.average.success_rate.toFixed(2)}%。排名依据是 Average Score，快照日期 {data.snapshot_date}，不是实时 leaderboard。</p>
            <FeedbackLine feedback={{ text: fingerprint(active, data, mode), cls: active.open[mode] <= 2 ? 'bad' : '' }} />
          </div>
          <MiniBars
            max={human ? 100 : Math.max(30, ...dimUi.map(([k]) => active[k][mode]))}
            unit={mode === 'success_rate' ? '%' : ''}
            rows={dimUi.map(([k, label]) => ({ label: human ? `${label} / Human ${data.human_reference[k][mode].toFixed(1)}` : label, value: active[k][mode], color: k === 'open' ? '#d97706' : '#27446e' }))}
          />
        </div>
      ) : null}
      <FeedbackLine feedback={{ text: 'Leaderboard 不只是排谁第一，更重要的是揭示每个模型到底在哪些能力上强、哪些能力上脆弱。Human reference 单独显示，避免把机器人 Top-10 和人类用同一线性山峰高度压扁。', cls: 'good' }} />
    </div>
  );
};

export const DiagnosticPassport: React.FC<WidgetProps> = () => {
  const profiles = {
    short: '短任务高手：pick/place 和分类表现亮眼，但没有证明长程、多步骤和真实 reset 稳定性。',
    precise: '精细操作型：螺丝、插入等可能较好，但开放目标和随机布局仍需单独验证。',
    broad: '仿真广覆盖型：五维都有一些分数，但如果真实世界 SR 低，仍不能叫可靠 generalist。',
  };
  const [profile, setProfile] = useState<keyof typeof profiles>('short');
  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${profile === 'short' ? 'selected' : ''}`} onClick={() => setProfile('short')}>短任务高手</button>
        <button className={`chip ${profile === 'precise' ? 'selected' : ''}`} onClick={() => setProfile('precise')}>精细操作型</button>
        <button className={`chip ${profile === 'broad' ? 'selected' : ''}`} onClick={() => setProfile('broad')}>仿真广覆盖型</button>
      </div>
      <div className="rj-passport">
        <h5>Diagnostic Passport</h5>
        <p>{profiles[profile]}</p>
        <MiniBars
          rows={[
            { label: '会', value: profile === 'short' ? 85 : 55, color: '#228d5c' },
            { label: '稳', value: profile === 'broad' ? 40 : 28, color: '#d97706' },
            { label: '泛化', value: profile === 'broad' ? 45 : 22, color: '#27446e' },
            { label: '真正通用', value: 12, color: '#c43f52' },
          ]}
        />
      </div>
      <FeedbackLine feedback={{ text: '会做某几个 task 并不足以证明 reliable generalist。Simulation 告诉我们它会不会；Real-world 告诉我们它靠不靠谱。', cls: 'good' }} />
    </div>
  );
};
