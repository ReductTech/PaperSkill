import React, { useEffect, useMemo, useRef, useState } from 'react';

const contractLayers = [
  {
    icon: '⌖', title: '度量几何', short: '尺度与位姿可度量',
    detail: '统一坐标、真实尺度和稳定原点，让动作与距离具有物理意义。',
    missing: '距离和物体尺度失真，机器人轨迹无法复用。',
    fields: ['统一坐标系', '真实尺度', '稳定原点', '6-DoF 位姿'],
  },
  {
    icon: '⬡', title: '物理资产', short: '接触行为可信',
    detail: 'collision geometry、质量、摩擦和惯性共同定义接触结果。',
    missing: '物体可能穿透、漂浮，或在接触后产生错误运动。',
    fields: ['collision geometry', '质量', '摩擦', '惯性'],
  },
  {
    icon: '◎', title: '任务语义', short: '对象与动作可查询',
    detail: '角色、部件和 affordance 把语言目标连接到可执行区域。',
    missing: '语言目标无法定位对象、部件以及允许执行的动作。',
    fields: ['任务角色', '部件语义', 'affordance', '对象关系'],
  },
  {
    icon: '⇄', title: '模拟器接口', short: '同一世界可迁移',
    detail: '标准资产与场景描述可导出到不同 simulator backend。',
    missing: '切换 simulator 时需要手工重建资产和场景布局。',
    fields: ['URDF', 'MJCF / XML', 'USD', '布局描述'],
  },
];

function ChapterOne({ moduleId }: { moduleId: string }) {
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(0);
  const compare = !moduleId.endsWith('.2');

  if (!compare) {
    const item = contractLayers[active];
    return (
      <div className="concept-panel contract-checklist">
        <div className="contract-check-head">
          <div>
            <span className="concept-kicker">SIMULATION-READY CONTRACT</span>
            <strong>逐项检查：缺少任何一项，世界都不能直接执行</strong>
          </div>
          <div className="contract-progress" aria-label="四项契约">
            {contractLayers.map((layer, index) => <span key={layer.title} className={active === index ? 'is-current' : ''}>✓</span>)}
            <b>4 / 4 必需</b>
          </div>
        </div>
        <div className="contract-accordion">
          {contractLayers.map((layer, index) => (
            <div key={layer.title} className={`contract-row ${active === index ? 'is-active' : ''}`}>
              <button onClick={() => setActive(index)} aria-expanded={active === index}>
                <span className="contract-row-number">0{index + 1}</span>
                <span className="contract-row-icon">{layer.icon}</span>
                <span className="contract-row-title"><strong>{layer.title}</strong><small>{layer.short}</small></span>
                <span className="contract-required">必需</span>
                <span className="contract-chevron">{active === index ? '−' : '+'}</span>
              </button>
              {active === index && (
                <div className="contract-row-detail">
                  <div><span>它解决什么</span><strong>{layer.detail}</strong></div>
                  <div className="contract-missing"><span>缺少时</span><strong>{layer.missing}</strong></div>
                  <div className="contract-fields"><span>系统必须保存</span><p>{layer.fields.map((field) => <b key={field}>{field}</b>)}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="contract-conclusion"><span>✓</span><p><strong>联合契约</strong>四类信息共享同一份世界表示，下游模块才能查询、验证和复用。</p></div>
      </div>
    );
  }

  return (
    <div className="concept-panel compare-worlds">
      <div className="compare-head">
        <div><span className="concept-kicker">TASK · 把西兰花放到白盘中</span><strong>执行同一句放置任务，结果为什么不同？</strong></div>
        <button className="concept-action" onClick={() => { setRunning(false); requestAnimationFrame(() => setRunning(true)); }}>{running ? '重新运行' : '运行同一任务'}</button>
      </div>
      <div className="world-comparison">
        <div className={`world-case old ${running ? 'is-running' : ''}`}>
          <div className="world-case-title"><span>视觉生成结果</span><b>停在外观</b></div>
          <div className="mini-world"><i className="mini-robot">⌄</i><i className="mini-prop">🥦</i><i className="mini-dish" /></div>
          <div className="task-rail"><span>识别</span><span>接触</span><span>移动</span><span>验证</span></div>
          <p>缺少碰撞、质量与任务接口，道具无法稳定完成任务。</p>
        </div>
        <div className={`world-case new ${running ? 'is-running' : ''}`}>
          <div className="world-case-title"><span>Simulation-Ready 世界</span><b>完成闭环</b></div>
          <div className="mini-world"><i className="mini-robot">⌄</i><i className="mini-prop">🥦</i><i className="mini-dish" /></div>
          <div className="task-rail"><span>识别</span><span>接触</span><span>移动</span><span>验证</span></div>
          <p>共享表示让感知、物理、任务语义与 simulator 连成一条执行链。</p>
        </div>
      </div>
    </div>
  );
}

const gateSteps = [
  ['生成候选', '先产生候选，不直接当作最终资产。'],
  ['语义与几何检查', '检查语义、完整性和跨模态一致性。'],
  ['失败重试', '失败候选更换随机种子并返回生成端。'],
  ['网格修复', '修复网格并进行凸分解，补齐物理可用性。'],
  ['标准封装', '只有通过全部检查的资产才进入标准格式。'],
];

function ChapterThree() {
  const [step, setStep] = useState(0);
  return (
    <div className="concept-panel gate-panel">
      <div className="gate-visual">
        <div className="gate-candidate">
          <span className={`candidate-object step-${step}`}>▰</span>
          <div><small>CANDIDATE ASSET</small><strong>{step < 2 ? '待检查候选' : step === 2 ? '缺陷已退回' : step === 3 ? '网格修复中' : '可用资产'}</strong></div>
          <b className={step === 2 ? 'bad' : step === 4 ? 'good' : ''}>{step === 2 ? 'RETRY' : step === 4 ? 'PASSED' : 'IN REVIEW'}</b>
        </div>
        <div className="gate-funnel" aria-label="Quality Gate 流程">
          {gateSteps.map(([name], index) => (
            <button key={name} onClick={() => setStep(index)} className={`gate-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
              <span>{index === 2 ? '↺' : index === 4 ? '✓' : index + 1}</span><strong>{name}</strong>
            </button>
          ))}
        </div>
        <div className={`gate-loop ${step === 2 ? 'is-visible' : ''}`}>失败不会静默放行：重新采样 → 再次检查</div>
      </div>
      <div className="concept-answer">
        <span>{step === 2 ? '↺' : step === 4 ? '✓' : '⌁'}</span>
        <div><small>当前环节</small><strong>{gateSteps[step][0]}</strong><p>{gateSteps[step][1]}</p></div>
        <div className="step-controls"><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>上一步</button><button onClick={() => setStep((value) => Math.min(4, value + 1))} disabled={step === 4}>下一步</button></div>
      </div>
    </div>
  );
}

function ChapterFour() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 49 });
  const supported = position.x >= 14 && position.x <= 86 && position.y >= 20 && position.y <= 76;
  const clear = !(position.x >= 43 && position.x <= 64 && position.y >= 34 && position.y <= 66);
  const reachable = Math.hypot(position.x - 14, position.y - 81) <= 82;
  const valid = supported && clear && reachable;

  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.type === 'pointermove' && event.buttons === 0) return;
    event.preventDefault();
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPosition({
      x: Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(12, Math.min(84, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };
  const nudge = (dx: number, dy: number) => setPosition((value) => ({
    x: Math.max(7, Math.min(93, value.x + dx)),
    y: Math.max(12, Math.min(84, value.y + dy)),
  }));

  return (
    <div className="concept-panel placement-panel">
      <div className="placement-head">
        <div><span className="concept-kicker">CONSTRAINED PLACEMENT</span><strong>把西兰花拖到白盘中</strong></div>
        <b className={valid ? 'is-valid' : ''}>{valid ? '位姿可行' : '仍有约束未满足'}</b>
      </div>
      <div
        ref={boardRef}
        className="placement-board"
        onPointerDown={updateFromPointer}
        onPointerMove={updateFromPointer}
        style={{ touchAction: 'none' }}
        aria-label="拖动道具检查支撑、避碰和机器人可达性"
      >
        <div className="reach-zone"><span>机器人可达范围</span></div>
        <span className="placement-robot">♟<small>ROBOT</small></span>
        <div className="support-surface"><span>桌面支撑区域 Hₚ</span></div>
        <div className="placed-obstacle"><span>已放物体</span></div>
        <div className="placement-target"><span>白盘</span></div>
        <div className={`draggable-prop ${valid ? 'is-valid' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}><span>🥦</span></div>
      </div>
      <div className="placement-footer">
        <div className="constraint-status">
          <span className={supported ? 'pass' : 'fail'}><i>{supported ? '✓' : '×'}</i><b>支撑</b><small>投影落在 Hₚ 内</small></span>
          <span className={clear ? 'pass' : 'fail'}><i>{clear ? '✓' : '×'}</i><b>避碰</b><small>不覆盖已放物体</small></span>
          <span className={reachable ? 'pass' : 'fail'}><i>{reachable ? '✓' : '×'}</i><b>可达</b><small>位于机器人工作区</small></span>
        </div>
        <div className="placement-nudge" aria-label="微调道具位置">
          <button onClick={() => nudge(-4, 0)}>←</button><button onClick={() => nudge(0, -4)}>↑</button><button onClick={() => nudge(0, 4)}>↓</button><button onClick={() => nudge(4, 0)}>→</button>
        </div>
      </div>
    </div>
  );
}

const affordanceStages = [
  { name: '部件分割', metric: '69.5%', note: '定位功能部件的面级区域', kind: 'segment' },
  { name: '语义标注', metric: '99.3%', note: '补充名称、功能和可抓取性', kind: 'semantic' },
  { name: '抓取候选', metric: '72.5%', note: '生成部件关联的 6-DoF 候选', kind: 'grasp' },
  { name: 'SAPIEN 验证', metric: '50.0%', note: '闭合、抬升、扰动与放下', kind: 'verify' },
];

function Headphones({ stage }: { stage: number }) {
  return (
    <svg className={`headphone-svg stage-${stage}`} viewBox="0 0 620 360" role="img" aria-label={affordanceStages[stage].name}>
      <path className="headband" d="M180 220 C180 65 440 65 440 220" />
      <rect className="ear left" x="130" y="190" width="105" height="125" rx="42" />
      <rect className="ear right" x="385" y="190" width="105" height="125" rx="42" />
      <path className="arm" d="M197 155 L188 212 M423 155 L432 212" />
      {stage >= 0 && <g className="segment-overlay"><rect x="137" y="197" width="91" height="111" rx="36" /><rect x="392" y="197" width="91" height="111" rx="36" /></g>}
      {stage >= 1 && <g className="semantic-tags"><text x="183" y="255">左耳罩</text><text x="438" y="255">右耳罩</text><text x="310" y="92">头梁</text></g>}
      {stage >= 2 && <g className="grasp-rays"><path d="M78 252 H143 M542 252 H477" /><path d="M94 238 L78 252 L94 266 M526 238 L542 252 L526 266" /></g>}
      {stage >= 3 && <g className="verify-mark"><circle cx="310" cy="225" r="62" /><path d="M278 226 L301 249 L345 201" /></g>}
    </svg>
  );
}

function ChapterFive() {
  const [stage, setStage] = useState(0);
  const current = affordanceStages[stage];
  return (
    <div className="concept-panel affordance-panel">
      <div className="affordance-workbench">
        <div className="workbench-head"><span>PART → SEMANTICS → GRASP → VALIDATION</span><strong>从耳机表面走到稳定抓取</strong></div>
        <Headphones stage={stage} />
        <div className="affordance-metric"><small>当前阶段指标</small><strong>{current.metric}</strong><span>{current.note}</span></div>
      </div>
      <div className="affordance-stage-list">
        {affordanceStages.map((item, index) => (
          <button key={item.name} onClick={() => setStage(index)} className={`affordance-stage ${stage === index ? 'is-active' : ''}`}>
            <span>0{index + 1}</span><div><strong>{item.name}</strong><small>{item.note}</small></div><b>{item.metric}</b>
          </button>
        ))}
        <p className="protocol-note">各百分比属于级联协议；后级指标以通过前级为条件。</p>
      </div>
    </div>
  );
}

const taskStages = [
  ['Task Instruction', '读懂任务', '提取 broccoli、white dish 与 put-on 关系'],
  ['Scene Graph', '搭建关系', 'Kitchen → Table → White dish → Broccoli'],
  ['Asset Instantiation', '放入资产', '检索 Simulation-Ready 机器人、餐桌、盘子和食材'],
  ['BFS Placement', '求解并稳定', '父节点先落位，子节点跟随；最后经过重力稳定'],
];

function ChapterSix() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (step >= taskStages.length - 1) {
      const done = window.setTimeout(() => setPlaying(false), 650);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const play = () => {
    setPlaying(false);
    setStep(0);
    requestAnimationFrame(() => setPlaying(true));
  };

  return (
    <div className="concept-panel graph-panel">
      <div className="room-plan">
        <div className="room-label"><span>任务：</span>把西兰花放到白盘中</div>
        <div className={`room-floor task-build stage-${step}`}>
          <span className="room-wall one" /><span className="room-wall two" />
          {step === 0 && <div className="task-bubble"><span>“Put the broccoli on the white dish.”</span><small>自然语言任务</small></div>}
          {step >= 1 && <div className="graph-overlay"><span>Kitchen</span><i>CONTAINS</i><span>Table</span><i>SUPPORTS</i><span>White dish</span><i>ON</i><span>Broccoli</span></div>}
          {step >= 2 && <>
            <span className="room-robot">♟<small>ROBOT</small></span>
            <span className="room-background">KITCHEN</span>
            <span className="room-table"><i className="room-dish">白盘</i><small>TABLE</small></span>
            <span className={`room-target ${step >= 3 ? 'is-placed' : ''}`}>🥦<small>BROCCOLI</small></span>
          </>}
          {step >= 3 && <svg className="room-route is-drawing" viewBox="0 0 500 300"><path d="M92 246 C170 220 180 155 275 152 S388 111 421 77" /></svg>}
          {step >= 3 && <div className="task-success">✓ 位置可行 · 重力稳定</div>}
        </div>
      </div>
      <div className="scene-graph">
        <div className="graph-head"><span>WORLD BUILD</span><strong>{taskStages[step][1]}</strong></div>
        <div className="task-stage-list">
          {taskStages.map(([name, short, detail], index) => (
            <button key={name} onClick={() => { setPlaying(false); setStep(index); }} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
              <span>{step > index ? '✓' : index + 1}</span>
              <div><strong>{name}</strong><small>{short} · {detail}</small></div>
            </button>
          ))}
        </div>
        <button className={`concept-action task-play ${playing ? 'is-playing' : ''}`} onClick={play}>{playing ? '正在生成…' : step === 3 ? '重新播放' : '播放生成过程'}</button>
      </div>
    </div>
  );
}

const complexityLevels = [
  ['Minimalist', '只保留任务必需物体'],
  ['Simple', '加入房间功能所需家具'],
  ['Medium', '加入支撑面上的中尺度物体'],
  ['Detail', '补充桌面细节与杂物'],
];

function ChapterSeven() {
  const [level, setLevel] = useState(0);
  const furniture = useMemo(() => Array.from({ length: 4 + level * 4 }, (_, index) => index), [level]);
  return (
    <div className="concept-panel floorplan-panel">
      <div className="complexity-tabs">
        {complexityLevels.map(([name, note], index) => (
          <button key={name} onClick={() => setLevel(index)} className={level === index ? 'is-active' : ''}>
            <span>0{index + 1}</span><strong>{name}</strong><small>{note}</small>
          </button>
        ))}
      </div>
      <div className={`house-plan level-${level}`}>
        <div className="house-room living"><span>LIVING</span></div>
        <div className="house-room kitchen"><span>KITCHEN</span></div>
        <div className="house-room bedroom"><span>BEDROOM</span></div>
        <div className="house-room hall"><span>HALL</span></div>
        <svg className="house-route" viewBox="0 0 900 410"><path d="M110 310 C245 310 250 195 400 195 S600 100 780 100" /></svg>
        {furniture.map((item) => <span key={item} className={`furniture f-${item + 1}`}>{item % 4 === 0 ? '▰' : item % 4 === 1 ? '▦' : item % 4 === 2 ? '●' : '◆'}</span>)}
        <div className="plan-status"><i /> 门洞连通 · 路径可通行</div>
      </div>
      <div className="complexity-summary"><span>当前复杂度</span><strong>{complexityLevels[level][0]}</strong><p>{complexityLevels[level][1]}；增加内容时，几何与拓扑约束保持不变。</p></div>
    </div>
  );
}

const editSteps = [
  ['Parse', '解析指令并选择技能'],
  ['Ground', '定位当前世界中的类型化引用'],
  ['Invoke', '确定性 backend 尝试生成 ΔS'],
  ['Commit', '可行时原子提交，失败则保持原状态'],
  ['Render', '渲染 Sₜ₊₁ 并写入历史'],
];

function ChapterEight() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const committed = step >= 3;

  useEffect(() => {
    if (!playing) return;
    if (step >= editSteps.length - 1) {
      const done = window.setTimeout(() => setPlaying(false), 650);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 720);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const play = () => {
    setPlaying(false);
    setStep(0);
    requestAnimationFrame(() => setPlaying(true));
  };

  return (
    <div className="concept-panel state-panel">
      <div className="edit-command"><span>USER EDIT</span><strong>“Add a table and four chairs around it.”</strong><b>局部修改</b></div>
      <div className="state-canvas">
        <div className="state-snapshot"><small>Sₜ · 空餐厅</small><div className="state-room dining-room"><span className="room-window" /><span className="room-door" /></div></div>
        <div className={`delta-card ${committed ? 'is-committed' : ''}`}><span>ΔS</span><strong>{committed ? 'COMMITTED' : step < 2 ? 'PENDING' : 'VALIDATING'}</strong><small>新增 table + 4 chairs</small></div>
        <div className="state-snapshot"><small>Sₜ₊₁ · 新世界</small><div className="state-room dining-room"><span className="room-window" /><span className="room-door" /><span className={`dining-table ${step === 2 ? 'is-preview' : ''} ${committed ? 'is-visible' : ''}`} /><span className={`dining-chair c1 ${step === 2 ? 'is-preview' : ''} ${committed ? 'is-visible' : ''}`} /><span className={`dining-chair c2 ${step === 2 ? 'is-preview' : ''} ${committed ? 'is-visible' : ''}`} /><span className={`dining-chair c3 ${step === 2 ? 'is-preview' : ''} ${committed ? 'is-visible' : ''}`} /><span className={`dining-chair c4 ${step === 2 ? 'is-preview' : ''} ${committed ? 'is-visible' : ''}`} /></div></div>
      </div>
      <div className="edit-pipeline">
        {editSteps.map(([name], index) => <button key={name} onClick={() => { setPlaying(false); setStep(index); }} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}><span>{step > index ? '✓' : index + 1}</span><strong>{name}</strong></button>)}
      </div>
      <div className="concept-answer">
        <span>{step >= 3 ? '✓' : 'Δ'}</span><div><small>当前系统动作</small><strong>{editSteps[step][0]}</strong><p>{editSteps[step][1]}。</p></div>
        <button className="concept-action" onClick={play}>{playing ? '正在执行…' : step === 4 ? '重新播放' : '播放完整编辑'}</button>
      </div>
    </div>
  );
}

const simulators = [
  ['Genesis', 'XML'],
  ['SAPIEN', 'URDF'],
  ['Isaac Sim', 'USD'],
  ['Isaac Gym', 'Asset description'],
  ['MuJoCo', 'MJCF / XML'],
  ['PyBullet', 'URDF'],
];

function ChapterNine() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="concept-panel simulator-panel">
      <div className="world-package">
        <span className="package-icon">◇</span><small>STANDARDIZED WORLD</small><strong>资产 + 布局 + 任务语义</strong>
        <div><span>Mesh</span><span>Physics</span><span>Scene</span></div>
      </div>
      <div className="export-route"><span /><b>EXPORT</b><span /></div>
      <div className="simulator-grid">
        {simulators.map(([name, format], index) => (
          <button key={name} onClick={() => setSelected(index)} className={selected === index ? 'is-active' : ''}>
            <span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{format}</small></div><b>{selected === index ? '已连接' : '选择'}</b>
          </button>
        ))}
      </div>
      <div className="route-summary"><span>当前导出路径</span><strong>统一世界描述 → {simulators[selected][1]} → {simulators[selected][0]}</strong><p>布局无需手工重做；不同物理引擎的动力学结果仍可能不同。</p></div>
    </div>
  );
}

function ChapterTen() {
  const [view, setView] = useState<'export' | 'learning'>('export');
  const [selected, setSelected] = useState(0);
  return (
    <div className="concept-panel value-panel">
      <div className="value-switch" role="tablist" aria-label="价值视图">
        <button onClick={() => setView('export')} className={view === 'export' ? 'is-active' : ''}>一个世界 · 六个 simulator</button>
        <button onClick={() => setView('learning')} className={view === 'learning' ? 'is-active' : ''}>生成数据 · 策略提升</button>
      </div>
      {view === 'export' ? (
        <div className="export-showcase">
          <div className="export-core"><span>◇</span><small>SIMULATION-READY</small><strong>同一个世界包</strong><p>Mesh · Physics · Scene · Task</p></div>
          <div className="export-rays" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className="export-destinations">
            {simulators.map(([name, format], index) => <button key={name} onClick={() => setSelected(index)} className={selected === index ? 'is-active' : ''}><span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{format}</small></div></button>)}
          </div>
          <div className="export-caption"><span>当前路径</span><strong>统一表示 → {simulators[selected][1]} → {simulators[selected][0]}</strong></div>
        </div>
      ) : (
        <div className="learning-showcase">
          <div className="training-world"><span>1</span><i>→</i><span>10</span><i>→</i><span>100</span><strong>可复用的训练世界</strong></div>
          <div className="gain-card sim"><small>SIMULATION TASK SUCCESS</small><div><span>9.7%</span><i>→</i><strong>79.8%</strong></div><b style={{ '--gain': '79.8%' } as React.CSSProperties} /></div>
          <div className="gain-card real"><small>REAL-ROBOT TASK SUCCESS</small><div><span>21.7%</span><i>→</i><strong>75.0%</strong></div><b style={{ '--gain': '75%' } as React.CSSProperties} /></div>
          <p>策略结果来自论文引用的独立下游研究 [6]；这里展示生成世界对训练数据规模的实际价值。</p>
        </div>
      )}
    </div>
  );
}

export function PaperHeroExample({ variant }: { variant: 'old' | 'new' }) {
  const ready = variant === 'new';
  return (
    <div className={`hero-paper-example ${ready ? 'is-ready' : 'is-visual-only'}`}>
      <div className="hero-task-line"><span>任务</span><strong>把西兰花放到白盘中</strong></div>
      <div className="hero-tabletop">
        <span className="hero-gripper">⌄</span>
        <span className={`hero-broccoli ${ready ? 'on-dish' : ''}`}>🥦</span>
        <span className="hero-dish" />
        {!ready && <span className="hero-unknown">?</span>}
        {ready && <svg viewBox="0 0 240 100" aria-hidden="true"><path d="M73 69 C112 23 148 28 177 58" /><path d="M168 50 L179 59 L165 65" /></svg>}
      </div>
      <div className="hero-task-status">
        {ready ? (
          <><b>可执行</b><span>Scene Graph ✓</span><span>Physics ✓</span><span>Simulator ✓</span></>
        ) : (
          <><b>仅可观看</b><span>尺度 ?</span><span>碰撞 ?</span><span>任务关系 ?</span></>
        )}
      </div>
    </div>
  );
}

export function PaperAnalogy({ chapter }: { chapter: number }) {
  if (chapter === 1) return (
    <div className="paper-example task-example">
      <div className="paper-prompt">“Put the broccoli on the white dish.”</div>
      <div className="paper-flow"><span>任务指令</span><i>→</i><span>Scene Graph</span><i>→</i><span className="good">稳定布局</span></div>
    </div>
  );
  if (chapter === 3) return (
    <div className="paper-example qc-example">
      <div className="paper-flow"><span>生成候选</span><i>→</i><span>语义 / 几何 / 美学检查</span><i>→</i><span className="good">标准资产</span></div>
      <div className="retry-line">检查失败 <b>↺ auto-retry</b> 返回生成端</div>
    </div>
  );
  if (chapter === 4) return (
    <div className="paper-example placement-example">
      <div className="example-table"><span className="example-dish" /><span className="example-broccoli">🥦</span></div>
      <div className="example-checks"><span>✓ 支撑</span><span>✓ 不重叠</span><span>✓ 机器人可达</span></div>
    </div>
  );
  if (chapter === 5) return (
    <div className="paper-example headphone-example">
      <div className="mini-headphone"><span className="band" /><span className="cup left">L</span><span className="cup right">R</span><i className="grasp left">→</i><i className="grasp right">←</i></div>
      <div className="paper-flow"><span>部件分割</span><i>→</i><span>抓取姿态</span><i>→</i><span className="good">SAPIEN 验证</span></div>
    </div>
  );
  if (chapter === 6) return (
    <div className="paper-example graph-example">
      <span className="graph-root">Kitchen</span><i>IN</i><span>Table</span><i>ON</i><span>White dish</span><i>ON</i><span className="good">Broccoli</span>
    </div>
  );
  if (chapter === 7) return (
    <div className="paper-example rooms-example">
      <div className="mini-house"><span>Living</span><span>Kitchen</span><span>Bedroom</span><svg viewBox="0 0 320 95"><path d="M35 70 C110 88 154 20 275 38" /></svg></div>
      <div className="paper-flow"><span>Scene Router</span><i>→</i><span>World Solver</span><i>→</i><span className="good">Sim-ready Scene</span></div>
    </div>
  );
  if (chapter === 8) return (
    <div className="paper-example dialogue-example">
      <div className="dialogue-lines"><span>“Create an empty dining room.”</span><span>“Add a table and four chairs around it.”</span></div>
      <div className="room-change"><span className="empty-room">空房间</span><i>→</i><span className="furnished-room">桌 + 4 把椅子</span></div>
    </div>
  );
  if (chapter === 9) return (
    <div className="paper-example export-example">
      <strong>同一标准布局</strong><i>→</i><div>{['GE','SA','IS','IG','MU','PY'].map((name) => <span key={name}>{name}</span>)}</div>
    </div>
  );
  return (
    <div className="paper-example learning-example">
      <div><span>Simulation task success</span><strong>9.7% → 79.8%</strong></div>
      <div><span>Real-robot task success</span><strong>21.7% → 75.0%</strong></div>
    </div>
  );
}

export function WorldScene({ chapter, moduleId }: { chapter: number; moduleId: string }) {
  if (chapter === 1) return <ChapterOne moduleId={moduleId} />;
  if (chapter === 3) return <ChapterThree />;
  if (chapter === 4) return <ChapterFour />;
  if (chapter === 5) return <ChapterFive />;
  if (chapter === 6) return <ChapterSix />;
  if (chapter === 7) return <ChapterSeven />;
  if (chapter === 8) return <ChapterEight />;
  if (chapter === 9) return <ChapterNine />;
  if (chapter === 10) return <ChapterTen />;
  return null;
}
