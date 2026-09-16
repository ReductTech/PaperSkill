import React, { useEffect, useMemo, useState } from 'react';

const MEDIA = 'media/embodiedgen';
const FIG = 'images/embodiedgen';
const ModelViewer = 'model-viewer' as React.ElementType;

function Hud({ source, title }: { source: string; title: string }) {
  return <div className="og-hud"><span>{source}</span><strong>{title}</strong><i><b /> INTERACTIVE EXPLAINER</i></div>;
}

function useSequence(count: number, delay = 950) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (step >= count - 1) {
      const done = window.setTimeout(() => setPlaying(false), 400);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), delay);
    return () => window.clearTimeout(timer);
  }, [count, delay, playing, step]);
  const play = () => { setStep(0); setPlaying(true); };
  const select = (value: number) => { setPlaying(false); setStep(value); };
  return { step, playing, play, select };
}

export function PaperHeroOverview({ variant }: { variant: string }) {
  if (variant === 'new') {
    return <div className="og-hero is-live"><video src={`${MEDIA}/video/hero_bg.mp4`} poster={`${MEDIA}/posters/hero_poster.jpg`} autoPlay muted loop playsInline preload="auto" /><span><b /> INTENT → EXECUTABLE WORLD</span></div>;
  }
  return <div className="og-hero is-failed"><img src={`${FIG}/figure-11-case-2.jpg`} alt="Missing table support failure" /><div className="og-failure-box"><i />MISSING SUPPORT</div><span><b /> VISUAL-ONLY MESH · REJECTED</span></div>;
}

const contracts = [
  { key: '01', title: 'Metric geometry', text: '真实尺度、闭合 mesh 与稳定坐标，而不是 normalized shape。', payload: 'visual mesh · collision mesh · metric scale' },
  { key: '02', title: 'Physical assets', text: '质量、摩擦、惯性与 collision proxy 决定接触是否可信。', payload: 'mass · friction · inertia · collision' },
  { key: '03', title: 'Task semantics + Affordance', text: 'Scene Graph 与 part-level affordance 把语言目标连接到可执行接触。', payload: 'roles · relations · grasp poses' },
  { key: '04', title: 'Simulator interfaces', text: '统一中间表示可转换为 URDF、MJCF 与 USD。', payload: 'URDF · MJCF · USD' },
];

function ContractLab() {
  const [enabled, setEnabled] = useState([true, true, true, true]);
  const [active, setActive] = useState(0);
  const ready = enabled.every(Boolean);
  const toggle = (index: number) => {
    setActive(index);
    setEnabled((value) => value.map((item, itemIndex) => itemIndex === index ? !item : item));
  };
  return (
    <div className="og-shell og-contract-lab">
      <Hud source="WORLD STATE · FOUR REQUIREMENTS" title="UNIFIED SIM-READY WORLD CONTRACT" />
      <div className="og-contract-layout">
        <div className={`og-world-core ${ready ? 'is-ready' : 'is-rejected'}`}>
          <div className="og-core-rings" aria-hidden="true"><i /><i /><i /></div>
          <div className="og-wire-cube" aria-hidden="true"><span className="front" /><span className="back" /><span className="top" /><span className="side" /></div>
          <small>TWO-LEVEL REPRESENTATION</small>
          <strong>SIM-READY CONTRACT</strong>
          <p>{ready ? '所有 contract 同时成立：world 可执行' : `缺少 ${contracts[enabled.findIndex((item) => !item)]?.title ?? 'contract'}：阻止部署`}</p>
          <div><span>OBJECT LEVEL</span><b>ASSET</b><i>→</i><span>SCENE LEVEL</span><b>WORLD</b></div>
        </div>
        <div className="og-contract-cards">
          {contracts.map((item, index) => (
            <button key={item.key} className={`${active === index ? 'is-active' : ''} ${enabled[index] ? 'is-on' : 'is-off'}`} onClick={() => toggle(index)}>
              <span>{item.key}</span><div><strong>{item.title}</strong><small>{item.text}</small><em>{item.payload}</em></div><b>{enabled[index] ? 'ON' : 'OFF'}</b>
            </button>
          ))}
        </div>
      </div>
      <div className={`og-contract-status ${ready ? 'ok' : 'bad'}`}><i />{ready ? 'SIMULATION-READY · 四项要求缺一不可' : 'CONTRACT VIOLATION · 点击 OFF 项恢复'}</div>
    </div>
  );
}

const assetStages = [
  { title: 'Input Preparation', detail: 'text / image → foreground candidate' },
  { title: 'Generate + Quality Gate', detail: 'semantic · geometry · alignment · aesthetic' },
  { title: 'Repair + Physics', detail: 'mesh fixing · CoACD · scale · mass · friction' },
  { title: 'Export → Affordance', detail: 'URDF/MJCF/USD · then part semantics + grasp validation' },
];

const modelForStage = ['ear_hear.glb', 'ear_hear.glb', 'ear_hear_collision.glb', 'ear_hear_afford.glb'];

export function AssetPipeline() {
  const { step, playing, play, select } = useSequence(assetStages.length, 1250);
  const [attempt, setAttempt] = useState(1);
  useEffect(() => {
    if (step !== 1 || !playing) { setAttempt(1); return; }
    const timer = window.setTimeout(() => setAttempt(2), 580);
    return () => window.clearTimeout(timer);
  }, [playing, step]);
  useEffect(() => { void import('@google/model-viewer'); }, []);
  return (
    <div className="og-shell og-asset-foundry">
      <Hud source="ASSET FACTORY · QUALITY CONTROL" title="GENERATE → VERIFY → RETRY → PACKAGE" />
      <div className="og-pipeline-tabs">
        {assetStages.map((stage, index) => <button key={stage.title} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => select(index)}><span>{step > index ? '✓' : `0${index + 1}`}</span><div><strong>{stage.title}</strong><small>{stage.detail}</small></div></button>)}
      </div>
      <div className="og-foundry-layout">
        <div className={`og-foundry-stage stage-${step}`}>
          <ModelViewer key={modelForStage[step]} src={`${MEDIA}/models/${modelForStage[step]}`} camera-controls="" interaction-prompt="none" auto-rotate="" rotation-per-second="20deg" shadow-intensity="1" exposure="1.3" environment-image="neutral" camera-orbit="35deg 75deg 165%" alt={`Headphones ${assetStages[step].title}`} />
          <div className="og-foundry-grid" aria-hidden="true" />
          {step === 1 ? <div className={`og-qc-scan ${attempt === 2 ? 'is-pass' : ''}`}><i /><small>ATTEMPT {attempt}</small><strong>{attempt === 1 ? 'MESH INCOMPLETE' : 'ALL CHECKS PASSED'}</strong><b>{attempt === 1 ? 'AUTO-RETRY' : 'ACCEPT'}</b></div> : null}
          {step === 2 ? <div className="og-physics-readout"><span>CoACD</span><span>metric scale</span><span>mass range</span><span>friction range</span></div> : null}
          {step === 3 ? <div className="og-grasp-readout"><span>headband <b>graspable</b></span><span>earcup <b>graspable</b></span><span>cushion <em>avoid</em></span></div> : null}
        </div>
        <aside className="og-foundry-console">
          <small>ACTIVE STAGE // 0{step + 1}</small>
          <strong>{assetStages[step].title}</strong>
          <p>{assetStages[step].detail}</p>
          <div className="og-gate-log">
            {['Semantic Appearance', 'Mesh Geometry', 'Cross-modal Alignment', 'Physics Compatibility'].map((name, index) => <span key={name} className={step > 1 || (step === 1 && attempt === 2) || index === 0 ? 'ok' : step === 1 ? 'checking' : ''}><i />{name}<b>{step > 1 || (step === 1 && attempt === 2) || index === 0 ? 'PASS' : step === 1 ? 'SCAN' : 'WAIT'}</b></span>)}
          </div>
          <button className={playing ? 'is-running' : ''} onClick={play}>{playing ? 'PIPELINE RUNNING…' : 'RUN CLOSED LOOP'}</button>
        </aside>
      </div>
      <div className="og-evidence-strip"><span><small>Full pipeline</small><strong>96.5%</strong> human acceptance</span><span><small>Collision success</small><strong>98.6%</strong></span><span><small>w/o mesh fixing</small><strong>1.43 → 51.63 MB</strong></span><span><small>Affordance pass</small><strong>31% → 50%</strong></span></div>
    </div>
  );
}

const taskStages = [
  { title: 'Task Description', note: '明确 action 与 target' },
  { title: 'Scene Graph', note: '分配角色与空间关系' },
  { title: 'Asset Instantiation', note: '生成 Simulation-Ready 实例' },
  { title: 'BFS Placement', note: '求解稳定的 6-DoF pose' },
];

const placementPhases = [
  { title: '锁定场景锚点', note: 'table 先确定可放置表面', tag: 'ANCHOR LOCKED' },
  { title: '采样 dish pose', note: '筛选桌面上的稳定候选位置', tag: 'POSE SELECTED' },
  { title: '满足 ON 关系', note: 'broccoli 对齐 white dish', tag: 'RELATION SOLVED' },
  { title: 'Physics settling', note: '重力与碰撞检查通过', tag: 'STABLE' },
];

function PlacementSimulation() {
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    if (phase >= placementPhases.length - 1) {
      const done = window.setTimeout(() => setRunning(false), 420);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setPhase((value) => value + 1), 1050);
    return () => window.clearTimeout(timer);
  }, [phase, running]);
  const choose = (index: number) => { setRunning(false); setPhase(index); };
  const replay = () => { setPhase(0); setRunning(true); };
  return (
    <div className={`og-placement-sim phase-${phase}`}>
      <div className="og-placement-scene">
        <div className="og-photo-frame">
          <img className="og-placement-bg" src={`${FIG}/task-broccoli.jpg`} alt="Robot, broccoli and white dish in a kitchen task" />
          <div className="og-scene-vignette" />
          <div className="og-task-caption"><small>ACTIVE TASK</small><strong>Put the broccoli on the white dish</strong></div>
          <span className="og-scene-tag arm"><i />ROBOT ARM</span>
          <span className="og-scene-tag dish"><i />WHITE DISH</span>
          <span className="og-scene-tag vegetable"><i />BROCCOLI</span>
          <div className="og-table-surface"><span>PLACEABLE SURFACE</span></div>
          <div className="og-pose-candidates"><i /><i /><i /><b>SELECTED POSE</b></div>
          <svg className="og-relation-path" viewBox="0 0 225 225" aria-hidden="true"><path className="search" d="M165 132 C148 94 119 94 99 132" /><path className="chosen" d="M165 132 C148 94 119 94 99 132" /><circle cx="165" cy="132" r="3" /><circle cx="99" cy="132" r="3" /></svg>
          <div className="og-source-mask" />
          <div className="og-moving-broccoli"><img src={`${FIG}/task-broccoli.jpg`} alt="" /></div>
          <div className="og-placement-readout"><small>6-DoF POSE</small><span>support ✓</span><span>IoU = 0</span><span>reachable ✓</span><b>{placementPhases[phase].tag}</b></div>
        </div>
      </div>
      <aside className="og-placement-steps">
        <div className="og-placement-heading"><small>BFS PLACEMENT</small><strong>按父子关系逐层落位</strong><p>先放置 table，再求解 dish，最后满足 broccoli ON dish。</p></div>
        {placementPhases.map((item, index) => <button key={item.title} className={`${phase === index ? 'is-active' : ''} ${phase > index ? 'is-done' : ''}`} onClick={() => choose(index)}><span>{phase > index ? '✓' : `0${index + 1}`}</span><div><strong>{item.title}</strong><small>{item.note}</small></div><i>{phase > index ? 'PASS' : phase === index ? 'CHECK' : 'WAIT'}</i></button>)}
        <div className={`og-placement-result ${phase === 3 ? 'is-ready' : ''}`}><span><i />{phase === 3 ? 'WORLD ACCEPTED' : 'SOLVING WORLD…'}</span><button onClick={replay}>REPLAY</button></div>
      </aside>
    </div>
  );
}

function TaskStageView({ step }: { step: number }) {
  if (step === 0) return <div className="og-task-prompt"><small>NATURAL-LANGUAGE TASK</small><strong>Put the broccoli on the white dish</strong><span>action: PUT · object: broccoli · target: white dish</span></div>;
  if (step === 1) return <div className="og-scene-graph"><svg viewBox="0 0 600 250" aria-label="Task-conditioned Scene Graph"><path d="M300 35L150 105M300 35L300 105M300 35L450 105M150 105L85 195M150 105L215 195M300 105L300 195M450 105L410 195M450 105L500 195" /><g className="root"><circle cx="300" cy="35" r="28" /><text x="300" y="40">Kitchen</text></g><g><circle cx="150" cy="105" r="27" /><text x="150" y="110">Table</text><circle cx="300" cy="105" r="27" /><text x="300" y="110">Robot</text><circle cx="450" cy="105" r="27" /><text x="450" y="110">Task</text><circle cx="85" cy="195" r="25" /><text x="85" y="200">Dish</text><circle cx="215" cy="195" r="25" /><text x="215" y="200">Knife</text><circle cx="300" cy="195" r="25" /><text x="300" y="200">Reach</text><circle cx="410" cy="195" r="25" /><text x="410" y="200">Broccoli</text><circle cx="500" cy="195" r="25" /><text x="500" y="200">ON</text></g></svg><div><span>BACKGROUND</span><span>CONTEXT</span><span>ROBOT</span><span>MANIPULATED</span><span>TARGET</span></div></div>;
  if (step === 2) return <div className="og-asset-instantiation"><div className="scene"><img src={`${FIG}/task-broccoli.jpg`} alt="Broccoli manipulation task world" /></div>{['table', 'white dish', 'broccoli', 'robot', 'knife'].map((item, index) => <span key={item} style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}><i>{String(index + 1).padStart(2, '0')}</i><b>{item}</b><small>SIM-READY · 6-DoF</small></span>)}</div>;
  return <PlacementSimulation />;
}

function TaskWorldLab() {
  const { step, playing, play, select } = useSequence(4, 1100);
  return (
    <div className="og-shell og-task-compiler">
      <Hud source="TASK → SCENE GRAPH → WORLD" title="TASK-CONDITIONED WORLD COMPILER" />
      <div className="og-task-tabs">{taskStages.map((stage, index) => <button key={stage.title} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => select(index)}><span>{step > index ? '✓' : `0${index + 1}`}</span><strong>{stage.title}</strong><small>{stage.note}</small></button>)}</div>
      <div className="og-task-stage" key={step}><TaskStageView step={step} /></div>
      <div className="og-task-footer"><button className={playing ? 'is-running' : ''} onClick={play}>{playing ? 'COMPILING WORLD…' : 'PLAY FULL COMPILATION'}</button><span><b>150</b> worlds</span><span><b>128</b> categories</span><span><b>1.35</b> attempts / valid asset</span><span><b>83.3%</b> final acceptance</span></div>
    </div>
  );
}

const tierData = [
  { name: 'Minimalist', count: 3, note: '保留结构与通行空间' },
  { name: 'Simple', count: 6, note: '加入必要家具骨架' },
  { name: 'Medium', count: 10, note: '补充功能性实例' },
  { name: 'Detail', count: 16, note: '加入 tabletop clutter' },
];
const houseObjects = [
  { type: 'sofa', label: 'SOFA', room: 'living', tier: 0, left: 11, top: 18 },
  { type: 'bed', label: 'BED', room: 'bedroom', tier: 0, left: 69, top: 66 },
  { type: 'counter', label: 'COUNTER', room: 'kitchen', tier: 0, left: 68, top: 13 },
  { type: 'dining', label: 'DINING TABLE', room: 'hall', tier: 1, left: 21, top: 70 },
  { type: 'coffee', label: 'COFFEE TABLE', room: 'living', tier: 1, left: 31, top: 31 },
  { type: 'wardrobe', label: 'WARDROBE', room: 'bedroom', tier: 1, left: 88, top: 75 },
  { type: 'tv', label: 'TV', room: 'living', tier: 2, left: 43, top: 15 },
  { type: 'chair', label: 'ARMCHAIR', room: 'living', tier: 2, left: 12, top: 40 },
  { type: 'island', label: 'ISLAND', room: 'kitchen', tier: 2, left: 72, top: 34 },
  { type: 'nightstand', label: 'NIGHTSTAND', room: 'bedroom', tier: 2, left: 65, top: 84 },
  { type: 'plant', label: 'PLANT', room: 'living', tier: 3, left: 46, top: 43 },
  { type: 'lamp', label: 'LAMP', room: 'bedroom', tier: 3, left: 91, top: 56 },
  { type: 'stool', label: 'STOOL', room: 'kitchen', tier: 3, left: 61, top: 38 },
  { type: 'stool', label: 'STOOL', room: 'kitchen', tier: 3, left: 82, top: 38 },
  { type: 'rug', label: 'RUG', room: 'living', tier: 3, left: 25, top: 27 },
  { type: 'shelf', label: 'BOOKSHELF', room: 'hall', tier: 3, left: 45, top: 80 },
];
const roomNotes: Record<string, string> = {
  living: '会客与通行中心，保留沙发前方操作空间。',
  kitchen: '操作台和 island 之间必须允许机器人转向。',
  bedroom: '床边留出接近路径，避免 wardrobe 阻塞门口。',
  hall: '连接各房间的共享区域，优先保证路线连续。',
};

function LargeSceneLab() {
  const [tier, setTier] = useState(1);
  const [room, setRoom] = useState('living');
  const current = tierData[tier];
  const objects = houseObjects.filter((item) => item.tier <= tier);
  const roomObjects = objects.filter((item) => item.room === room);
  return (
    <div className="og-shell og-large-scene">
      <Hud source="ROOM TOPOLOGY · PATH PLANNING" title="NAVIGABLE MULTI-ROOM WORLD SOLVER" />
      <div className="og-tier-tabs">{tierData.map((item, index) => <button key={item.name} className={tier === index ? 'is-active' : ''} onClick={() => setTier(index)}><span>0{index + 1}</span><strong>{item.name}</strong><small>{item.note}</small></button>)}</div>
      <div className="og-home-solver-layout">
        <div className={`og-home-plan tier-${tier}`}>
          <div className="og-room-shell living"><button className={room === 'living' ? 'is-active' : ''} onClick={() => setRoom('living')}><span>LIVING ROOM</span><small>social · navigation</small></button></div>
          <div className="og-room-shell kitchen"><button className={room === 'kitchen' ? 'is-active' : ''} onClick={() => setRoom('kitchen')}><span>KITCHEN</span><small>prepare · manipulate</small></button></div>
          <div className="og-room-shell bedroom"><button className={room === 'bedroom' ? 'is-active' : ''} onClick={() => setRoom('bedroom')}><span>BEDROOM</span><small>rest · storage</small></button></div>
          <div className="og-room-shell hall"><button className={room === 'hall' ? 'is-active' : ''} onClick={() => setRoom('hall')}><span>DINING / HALL</span><small>connect · traverse</small></button></div>
          {objects.map((item, index) => <span key={`${item.type}-${index}`} className={`og-furniture-object ${item.type} ${item.room === room ? 'is-selected-room' : ''}`} style={{ left: `${item.left}%`, top: `${item.top}%`, '--delay': `${index * 45}ms` } as React.CSSProperties}><i /><b>{item.label}</b></span>)}
          <svg viewBox="0 0 600 360" aria-label="Robot route through the furnished home"><path className="route-shadow" d="M62 304 C105 282 122 228 188 222 S254 260 304 218 S334 91 413 102 S505 140 537 238" /><path className="route-live" d="M62 304 C105 282 122 228 188 222 S254 260 304 218 S334 91 413 102 S505 140 537 238" /></svg>
          <span className="og-home-robot"><i>R</i><b>ROBOT</b></span><div className="og-plan-status"><i />PATH CLEAR · 4 ROOMS CONNECTED</div>
        </div>
        <aside className="og-home-inspector"><div className="og-blueprint-thumb"><img src={`${FIG}/floorplan-pairs.jpg`} alt="Generated floorplan examples" /><span>LAYOUT REFERENCE</span><i /></div><small>ROOM INSPECTOR</small><strong>{room.toUpperCase()}</strong><p>{roomNotes[room]}</p><div className="og-room-assets">{roomObjects.length ? roomObjects.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>) : <span>STRUCTURE ONLY</span>}</div><dl><div><dt>Complexity</dt><dd>{current.name}</dd></div><div><dt>Instances</dt><dd>{objects.length}</dd></div><div><dt>Navigation check</dt><dd>PASS</dd></div><div><dt>Route</dt><dd>CONNECTED</dd></div></dl><div className="og-layer-stack"><span>STRUCTURE</span><i /><span>FURNITURE</span><i /><span>NAVIGATION</span></div></aside>
      </div>
    </div>
  );
}

const vibeTurns = [
  { cmd: 'Generate a simple kitchen', delta: '初始化厨房空间', change: '场景已创建', focus: 'room', note: '先建立可以继续编辑的厨房世界。' },
  { cmd: 'Add a dining table with four chairs', delta: '加入餐桌与四把椅子', change: '新增 5 个资产', focus: 'furniture', note: '系统定位中央空地，再放置一组满足碰撞约束的桌椅。' },
  { cmd: 'Have some fruit on the table', delta: '在桌面摆放水果与餐具', change: '桌面已更新', focus: 'tabletop', note: '“on the table” 被解析为空间关系，物品落在桌面而不是任意位置。' },
  { cmd: 'Remove the two side chairs', delta: '移除左右两把椅子', change: '移除 2 个资产', focus: 'chairs', note: '只删除被语言指向的实例，其余场景状态保持不变。' },
];

function VibeCodingLab() {
  const [turn, setTurn] = useState(0);
  const [failed, setFailed] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    vibeTurns.forEach((_, index) => { const image = new Image(); image.src = `${FIG}/vibe-state-${index}.webp`; });
  }, []);
  useEffect(() => {
    if (!playing) return;
    setReveal(0);
    const revealTimer = window.setTimeout(() => setReveal(100), 180);
    const advanceTimer = window.setTimeout(() => {
      if (turn >= vibeTurns.length - 1) setPlaying(false);
      else { setTurn((value) => value + 1); setRunKey((value) => value + 1); }
    }, 1550);
    return () => { window.clearTimeout(revealTimer); window.clearTimeout(advanceTimer); };
  }, [playing, turn]);
  const choose = (index: number) => { setPlaying(false); setFailed(false); setTurn(index); setReveal(0); setRunKey((value) => value + 1); };
  const fail = () => { setPlaying(false); setFailed(true); setReveal(0); setRunKey((value) => value + 1); };
  const play = () => { setFailed(false); setTurn(0); setReveal(0); setRunKey((value) => value + 1); setPlaying(true); };
  const before = failed ? turn : Math.max(0, turn - 1);
  return (
    <div className="og-shell og-vibe-lab">
      <Hud source="LANGUAGE → WORLD STATE" title="VIBE CODING：把一句话变成可执行的场景修改" />
      <div className="og-edit-workbench">
        <div className="og-vibe-history">
          <div className="og-history-intro"><small>EDIT HISTORY</small><strong>点选一句话，观察世界如何改变</strong></div>
          {vibeTurns.map((item, index) => <button key={item.cmd} className={turn === index && !failed ? 'is-active' : ''} onClick={() => choose(index)}><span>0{index + 1}</span><div><strong>{item.cmd}</strong><small>{item.delta}</small></div><i>{index <= turn ? 'COMMITTED' : 'PENDING'}</i></button>)}
          <button className={`og-failure-command ${failed ? 'is-active' : ''}`} onClick={fail}><span>!</span><div><strong>“Put it over there”</strong><small>指代不清，拒绝修改场景</small></div><i>TRY</i></button>
          <button className="og-play-history" onClick={play}>{playing ? '正在依次执行…' : '▶ 播放完整编辑过程'}</button>
        </div>
        <div className={`og-state-comparison change-${turn} ${failed ? 'is-failed' : ''} ${playing ? 'is-playing' : ''}`}>
          <div className="og-state-canvas" key={`scene-${turn}-${failed}-${runKey}`}>
            <img className="before" src={`${FIG}/vibe-state-${before}.webp`} alt={`执行前的厨房状态 S${before}`} draggable="false" />
            <div className="og-after-layer" style={{ opacity: reveal / 100 }}><img src={`${FIG}/vibe-state-${turn}.webp`} alt={`执行后的厨房状态 S${turn}`} draggable="false" /></div>
            <div className="og-compare-handle" style={{ '--position': `${reveal}%` } as React.CSSProperties}><span /><b>{reveal < 50 ? 'BEFORE' : 'AFTER'}</b></div>
            <span className={`og-before-label ${reveal < 50 ? 'is-current' : ''}`}>执行前 · S{before}</span><span className={`og-after-label ${reveal >= 50 ? 'is-current' : ''}`}>执行后 · S{turn}</span>
            <div className={`og-scene-focus focus-${vibeTurns[turn].focus}`}><i /><span>{vibeTurns[turn].change}</span></div>
            <div className="og-command-caption"><small>当前指令</small><strong>{vibeTurns[turn].cmd}</strong><p>{vibeTurns[turn].note}</p></div>
            <div className={`og-edit-diagnostic ${failed ? 'is-visible' : ''}`}><small>EDIT REJECTED</small><strong>“there” 指向不明确</strong><p>Ground 阶段无法确定对象与位置，因此没有执行 Commit；当前厨房仍保持 S{turn}。</p></div>
          </div>
          <div className="og-compare-controls"><span>执行前</span><input aria-label="拖动查看编辑前后差异" type="range" min="0" max="100" value={reveal} onChange={(event) => setReveal(Number(event.target.value))} /><span>执行后</span><b>{failed ? '场景未改变' : reveal < 50 ? `当前：S${before}` : vibeTurns[turn].change}</b></div>
          <div className="og-edit-flow" key={`flow-${turn}-${failed}-${runKey}`}>{['PARSE','GROUND','INVOKE','COMMIT'].map((item, index) => <span key={item} style={{ '--flow-delay': `${index * 95}ms` } as React.CSSProperties} className={failed && index >= 1 ? 'is-blocked' : 'is-done'}><i>{index + 1}</i>{item}</span>)}</div>
        </div>
      </div>
      <div className="og-world-state"><span>G<small>Scene Graph</small></span><span>A<small>Assets</small></span><span>P<small>6-DoF poses</small></span><span>H<small>Edit history</small></span><strong>每次修改都写回同一个可模拟世界状态</strong></div>
    </div>
  );
}

const ablations = [
  { name: 'Full pipeline', human: 96.5, collision: 98.6, time: 2.6, visual: 1.43, proxy: .29 },
  { name: 'w/o Quality checker', human: 91.0, collision: 98.1, time: 2.2, visual: 1.44, proxy: .30 },
  { name: 'w/o Mesh fixing', human: 95.5, collision: 98.3, time: 21.3, visual: 51.63, proxy: .31 },
  { name: 'w/o Convex decomp.', human: 94.5, collision: 96.5, time: 2.3, visual: 1.45, proxy: 1.45 },
];

function EvidenceLab() {
  const [view, setView] = useState<'cross' | 'ablation' | 'policy'>('cross');
  const [setting, setSetting] = useState(0);
  const [sceneCount, setSceneCount] = useState<1 | 50>(1);
  const data = ablations[setting];
  const policy = sceneCount === 1 ? { ood: 53.2, gap: 41.1 } : { ood: 77.9, gap: 2.6 };
  const formats = useMemo(() => [
    ['SAPIEN3','URDF'],['PyBullet','URDF'],['Isaac Gym','URDF'],['MuJoCo','MJCF'],['Genesis','MJCF'],['Isaac Sim','USD'],
  ], []);
  return (
    <div className="og-shell og-evidence-lab">
      <Hud source="PORTABILITY · ABLATION · POLICY" title="DOES THE GENERATED WORLD ACTUALLY WORK?" />
      <div className="og-evidence-tabs"><button className={view === 'cross' ? 'is-active' : ''} onClick={() => setView('cross')}>Cross-Sim</button><button className={view === 'ablation' ? 'is-active' : ''} onClick={() => setView('ablation')}>Asset ablation</button><button className={view === 'policy' ? 'is-active' : ''} onClick={() => setView('policy')}>World → Policy</button></div>
      {view === 'cross' ? <div className="og-cross-sim"><div className="og-world-package"><div className="og-package-cube"><i /><i /><i /></div><small>CANONICAL WORLD PACKAGE</small><strong>geometry + collision + physics + semantics</strong><p>一次生成，按目标 simulator 投影格式</p></div><svg viewBox="0 0 250 360"><path d="M10 180L235 35M10 180L235 90M10 180L235 145M10 180L235 215M10 180L235 270M10 180L235 325" /></svg><div className="og-sim-grid">{formats.map(([name,format], index) => <button key={name} style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}><span>0{index + 1}</span><div><strong>{name}</strong><small>{format}</small></div><i>READY</i></button>)}</div></div> : null}
      {view === 'ablation' ? <div className="og-ablation"><div className="og-ablation-settings">{ablations.map((item,index) => <button key={item.name} className={setting === index ? 'is-active' : ''} onClick={() => setSetting(index)}><span>0{index + 1}</span>{item.name}</button>)}</div><div className="og-metric-board" key={setting}>{[
        ['Human acceptance',data.human,100,'%'],['Collision success',data.collision,100,'%'],['Runtime',data.time,22,' min'],['Visual mesh',data.visual,52,' MB'],['Collision mesh',data.proxy,1.5,' MB'],
      ].map(([name,value,max,unit]) => <div key={String(name)}><span>{name}</span><strong>{Number(value).toFixed(Number(value) < 2 || Number(value) > 50 && Number(value) < 52 ? 2 : 1)}{unit}</strong><i><b style={{ width: `${Math.max(3, Number(value) / Number(max) * 100)}%` }} /></i></div>)}</div><aside><small>WHAT BREAKS?</small><strong>{setting === 0 ? '完整流水线取得最佳综合结果' : setting === 1 ? '省 0.4 min，却损失 5.5 points acceptance' : setting === 2 ? 'runtime 约 8×，visual mesh 膨胀约 36×' : 'collision proxy 增至 1.45 MB，接触成功率下降'}</strong></aside></div> : null}
      {view === 'policy' ? <div className="og-policy-evidence"><div className="og-policy-visual"><img src={`${FIG}/learning-evidence.jpg`} alt="Parallelized RL and real-world deployment" /><div><button className={sceneCount === 1 ? 'is-active' : ''} onClick={() => setSceneCount(1)}>N = 1 scene</button><button className={sceneCount === 50 ? 'is-active' : ''} onClick={() => setSceneCount(50)}>N = 50 scenes</button></div></div><div className="og-policy-metrics" key={sceneCount}><div><small>OOD SUCCESS</small><span>53.2%</span><i>→</i><strong>{policy.ood}%</strong><b style={{ '--value': `${policy.ood}%` } as React.CSSProperties} /></div><div><small>ID–OOD GAP</small><span>41.1 pt</span><i>→</i><strong>{policy.gap} pt</strong><b className="reverse" style={{ '--value': `${Math.max(6,policy.gap)}%` } as React.CSSProperties} /></div><div className="og-real-result"><span>SIM</span><b>9.7 → 79.8%</b><span>REAL</span><b>21.7 → 75.0%</b><span>DYNAMICS FAIL</span><b>66.7 → 18.3%</b><small>12 scenes · 240 trials</small></div></div></div> : null}
      <div className="og-extension-strip"><span>EXTENSIONS</span><b>4K+ affordance assets</b><b>deformable garments</b><b>single-image in-place completion</b></div><div className="og-limit-strip"><span>REMAINING FAILURES</span><b>object-scale mismatch</b><b>local geometry defects</b><b>initial placement</b></div>
    </div>
  );
}

export function PaperFigureScene({ chapter }: { chapter: number }) {
  if (chapter === 1) return <ContractLab />;
  if (chapter === 6) return <TaskWorldLab />;
  if (chapter === 7) return <LargeSceneLab />;
  if (chapter === 8) return <VibeCodingLab />;
  if (chapter === 10) return <EvidenceLab />;
  return null;
}
