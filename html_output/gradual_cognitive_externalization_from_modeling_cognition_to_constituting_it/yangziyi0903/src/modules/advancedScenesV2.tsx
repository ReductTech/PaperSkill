import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { BrainCircuit, CloudRain, Play, RotateCcw, Thermometer } from 'lucide-react';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t);

function useClock(duration: number, playing: boolean, resetKey: number) {
  const [progress, setProgress] = useState(0);
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = 0; setProgress(0); }, [resetKey]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      if (!startedAt.current) startedAt.current = now;
      setProgress(((now - startedAt.current) % duration) / duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, playing, resetKey]);
  return progress;
}

function Walker({ x, y, walking = true }: { x: number; y: number; walking?: boolean }) {
  return <g className={`v2-walker ${walking ? 'walking' : ''}`} transform={`translate(${x} ${y})`}>
    <circle cy="-17" r="6"/><path d="M0 -10 V11 M0 -3 L-9 7 M0 -3 L9 7"/>
    <path className="leg-a" d="M0 11 L-8 26"/><path className="leg-b" d="M0 11 L8 26"/>
  </g>;
}

function Vehicle({ color = '#d86b32', driver = true }: { color?: string; driver?: boolean }) {
  return <g className="v2-vehicle">
    <rect x="-17" y="-8" width="34" height="17" rx="4" fill={color}/>
    <path d="M-10 -8 L-4 -17 H8 L14 -8" fill={color}/>
    {driver ? <circle className="vehicle-driver" cx="2" cy="-12" r="3.5"/> : null}
    <circle cx="-10" cy="11" r="4"/><circle cx="10" cy="11" r="4"/>
  </g>;
}

const routes = {
  direct: 'M164 277 C270 248 322 75 664 86',
  middle: 'M164 277 C255 92 468 255 664 86',
  safe: 'M164 277 C292 328 520 275 664 86',
};

export const FunctionalBoundarySceneV2: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [reset, setReset] = useState(0);
  const p = useClock(9000, playing, reset);
  const stage = p < .13 ? 0 : p < .28 ? 1 : p < .43 ? 2 : p < .78 ? 3 : 4;
  const walkIn = clamp((p - .13) / .15);
  const walkOut = clamp((p - .78) / .15);
  const route = mode === 2 ? routes.safe : routes.direct;
  const personX = stage === 1 ? lerp(102, 164, walkIn) : stage === 4 ? lerp(664, 700, walkOut) : 102;
  const personY = stage === 1 ? lerp(250, 261, walkIn) : stage === 4 ? lerp(86, 73, walkOut) : 250;
  const boundaryExpanded = mode === 2 && stage === 4;
  const captions = [
    '人物收到“去医院”的现实任务，从家门出发',
    '人物走到车辆；路况传感器发现暴雨封路',
    mode === 2 ? 'AI 按这个人的“安全优先”偏好生成绕行方案' : '人物自行判断；AI 没有进入决定路线的回路',
    mode === 2 ? '人物采纳建议，车辆沿绿色安全路线真实行驶' : '车辆沿人物自己选择的路线行驶',
    mode === 2 ? '人物下车到达；结果回传 AI，因果闭环完成' : '人物到达，但结果不会继续改变 AI',
  ];
  return <div className="advanced-scene boundary-v5">
    <div className="advanced-toolbar"><div><span>一个完整任务，而不是几张会变色的图</span><strong>人走路 → 上车 → 改变路线 → 到达 → 反馈，逐步观察边界为什么扩张</strong></div><button onClick={() => setPlaying(v => !v)}>{playing ? '暂停' : '继续播放'}</button></div>
    <div className="mode-selector">{['人物独立完成', 'AI 只提供路况', 'AI 参与决策闭环'].map((label, i) => <button key={label} className={mode === i ? 'active' : ''} onClick={() => { setMode(i); setReset(v => v + 1); setPlaying(true); }}><span>实验 {i + 1}</span>{label}</button>)}</div>
    <svg viewBox="0 0 760 390" className={`boundary-v4-svg mode-${mode} step-${stage}`} role="img" aria-label="人物从家走到车辆，驾驶到医院并形成反馈闭环的动画">
      <defs><marker id="v5arrow" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path className="marker-tip" d="M0 0 L9 4.5 L0 9Z"/></marker></defs>
      <rect width="760" height="390" className="scene-ground"/><text x="28" y="28" className="scene-axis-title">现实任务：暴雨天前往医院</text>
      <path className="v4-road" d={routes.direct}/><path className="v4-road" d={routes.middle}/><path className="v4-road" d={routes.safe}/>
      <path className={`chosen-route ${stage >= 2 ? 'visible' : ''} ${mode === 2 ? 'coupled' : 'human'}`} d={route}/>
      <g className="small-home" transform="translate(48 228)"><path d="M0 24 L35 0 L70 24 V68 H0Z"/><rect x="27" y="43" width="16" height="25"/></g>
      <g className="small-hospital" transform="translate(641 36)"><rect width="66" height="72"/><path d="M33 14 V54 M13 34 H53"/></g>
      <g className="v4-block" transform="translate(292 112)"><rect width="74" height="31" rx="4"/><text x="37" y="20" textAnchor="middle">暴雨封路</text></g>
      {stage < 2 || stage === 4 ? <Walker x={personX} y={personY} walking={stage === 1 || stage === 4}/> : null}
      {stage < 3 ? <g transform="translate(164 277)"><Vehicle driver={stage === 2}/><path className={stage === 2 ? 'car-door open' : 'car-door'} d="M-17 -8 L-25 -18"/></g> : null}
      {stage === 3 ? <g className="driving-car"><Vehicle/><animateMotion dur="3.05s" path={route} fill="freeze" calcMode="spline" keySplines=".42 0 .2 1"/></g> : null}
      <g className={`nav-console ${mode === 0 ? 'inactive' : ''}`} transform="translate(535 263)"><rect x="-45" y="-35" width="90" height="70" rx="6"/><rect x="-35" y="-25" width="70" height="42"/><path d="M-25 -12 H20 M-25 0 H10 M-25 12 H25"/><text y="53" textAnchor="middle">AI 导航</text></g>
      {mode > 0 && stage >= 1 ? <g className="road-data"><circle r="6"/><text x="10" y="4">路况进入 AI</text><animateMotion dur="1.3s" path="M330 128 C405 145 470 202 525 245" repeatCount="indefinite"/></g> : null}
      {mode === 2 && stage >= 2 ? <path className="recommendation-flow" d="M515 270 C420 306 310 321 190 286" markerEnd="url(#v5arrow)"/> : null}
      {boundaryExpanded ? <g className="arrival-feedback"><circle r="6"/><text x="10" y="4">到达结果更新模型</text><animateMotion dur="1.5s" path="M670 90 C635 170 600 225 555 255" repeatCount="indefinite"/></g> : null}
      <path className={`v4-boundary ${boundaryExpanded ? 'expanded' : ''}`} d={boundaryExpanded ? 'M25 42 H731 V350 H25Z' : 'M25 42 H438 V350 H25Z'}/>
      <text x="42" y="62" className="v4-boundary-label">{boundaryExpanded ? '扩张后的任务系统边界：人 + AI + 反馈回路' : '当前任务系统边界：只包含人物的感知、判断与行动'}</text>
      <g className="v4-action-label" transform="translate(325 348)"><rect width="405" height="34"/><text x="202" y="22" textAnchor="middle">{captions[stage]}</text></g>
    </svg>
    <div className="v4-timeline">{['接到任务', '走向车辆', '形成路线', '真实驾驶', '到达反馈'].map((label, i) => <div className={stage === i ? 'active current' : stage > i ? 'active' : ''} key={label}><span>{i + 1}</span>{label}</div>)}</div>
    <div className={`advanced-conclusion ${boundaryExpanded ? 'good' : ''}`}><strong>{boundaryExpanded ? '边界现在有理由移动' : '边界暂不移动'}</strong><span>{mode === 2 ? '关键不是 AI 出现在画面里，而是它改变了人物的现实路线，行动结果又反过来更新 AI。' : mode === 1 ? 'AI 提供信息，但人物仍独立组织判断；信息流不自动等于认知构成。' : '全部关键步骤由人物完成，AI 不在这次任务的因果链中。'}</span></div>
  </div>;
};

export const MutualAdaptationSceneV2: React.FC<WidgetProps> = () => {
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [trip, setTrip] = useState(0);
  useEffect(() => { if (!playing || removed) return; const id = setInterval(() => setMonth(m => m === 12 ? 0 : m + 1), 4200); return () => clearInterval(id); }, [playing, removed]);
  const route = month < 3 ? routes.direct : month < 6 ? routes.middle : routes.safe;
  const routeLabel = month < 3 ? '最短路线' : month < 6 ? '共同修正路线' : '安全优先路线';
  return <div className={`advanced-scene mutual-v4 ${removed ? 'removed' : ''}`}>
    <div className="advanced-toolbar"><div><span>每一个月都重新完成一次现实任务</span><strong>路线、人物的决策步骤、AI 的偏好模型必须同时变化，才叫双向适应</strong></div><button onClick={() => setPlaying(v => !v)}>{playing ? '暂停' : '自动播放'}</button></div>
    <svg viewBox="0 0 760 390" className="mutual-v4-svg" role="img" aria-label="人物驾驶车辆随互动月份改变路线，移除 AI 后停在岔路">
      <defs><marker id="adaptArrowBlue" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9Z"/></marker><marker id="adaptArrowGreen" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9Z"/></marker></defs>
      <rect width="760" height="390" className="scene-ground"/><path className="v4-road" d={routes.direct}/><path className="v4-road" d={routes.middle}/><path className="v4-road" d={routes.safe}/><path className={`chosen-route visible ${month >= 3 ? 'coupled' : 'human'}`} d={route}/>
      <g className="start-garage" transform="translate(66 236)"><rect width="82" height="75"/><path d="M0 22 L41 0 L82 22"/></g><g className="small-hospital" transform="translate(644 38)"><rect width="58" height="64"/><path d="M29 13 V49 M11 31 H47"/></g>
      <g className="month-context" transform="translate(24 22)"><rect width="280" height="98"/><text x="15" y="24">第 {month} 个月 · 本月真实任务</text><text x="15" y="50">事件：{month < 3 ? '普通拥堵' : month < 6 ? '临时施工' : '暴雨封路'}</text><text x="15" y="74">人物步骤：{month < 3 ? '自己比较全部路线' : month < 6 ? '审核并修正 AI 候选' : '确认 AI 的安全绕行方案'}</text></g>
      <g className="learned-model" transform="translate(500 22)"><rect width="235" height="98"/><text x="14" y="24">AI 学到的个人结构</text><rect x="14" y="40" width={190 * month / 12} height="12"/><text x="14" y="71">“安全优先”稳定度：{Math.round(month / 12 * 100)}%</text></g>
      {removed ? <><g className="hesitating-car" transform="translate(300 151)"><Vehicle/><path d="M-34 31 Q0 48 34 31"/><text x="0" y="64" textAnchor="middle">缺少路线初筛与风险排序：人物停车重新计算</text></g><g className="decision-confusion" transform="translate(300 108)"><text textAnchor="middle">最短？施工？积水？</text></g></> : <g key={`${month}-${trip}`} className="trip-car"><Vehicle/><animateMotion dur="3.25s" path={route} repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .2 1"/></g>}
      <g className="nav-small" transform="translate(556 278)"><rect x="-42" y="-32" width="84" height="64" rx="5"/><path d="M-28 -15 H25 M-28 -2 H12 M-28 11 H28"/></g>
      {!removed ? <><path className="adapt-flow ai-to-human" d="M535 292 C445 342 282 344 185 303" markerEnd="url(#adaptArrowBlue)"/><text className="adapt-flow-label" x="355" y="357" textAnchor="middle">AI 候选路线 → 改变人物的比较顺序</text><path className="adapt-flow human-to-ai" d="M680 115 C656 174 621 226 580 254" markerEnd="url(#adaptArrowGreen)"/><text className="adapt-flow-label feedback" x="654" y="196" textAnchor="middle">实际结果回写</text></> : null}
      <g className="route-now" transform="translate(520 326)"><rect width="190" height="34"/><text x="95" y="22" textAnchor="middle">当前实际路线：{routeLabel}</text></g><g className="month-track" transform="translate(45 367)">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 56} width="42" height="11" className={i < month ? 'filled' : ''}/>)}</g>
    </svg>
    <div className="adaptation-controls-v3"><label>互动时间 <b>{month} 个月</b><input type="range" min="0" max="12" value={month} onChange={e => { setPlaying(false); setRemoved(false); setMonth(+e.target.value); setTrip(v => v + 1); }}/></label><button className={removed ? 'danger' : ''} onClick={() => { setPlaying(false); setRemoved(v => !v); }}>{removed ? '恢复 AI 并重跑' : '执行移除测试'}</button></div>
    <div className="v4-evidence"><div className={month >= 3 ? 'met' : ''}><b>AI → 人物</b><span>{month >= 3 ? 'AI 候选改变了人物比较路线的顺序' : '人物仍独立完成全部比较'}</span></div><div className={month >= 6 ? 'met' : ''}><b>人物 → AI</b><span>{month >= 6 ? '人物的修正使模型稳定偏向安全路线' : 'AI 尚未形成稳定个人结构'}</span></div><div className={removed ? 'failed' : ''}><b>移除后果</b><span>{removed ? (month >= 6 ? '人物在岔路停车，必须重建已外化的步骤' : '只失去一般导航便利') : '点击按钮观察具体缺失什么'}</span></div></div>
    <div className={`advanced-conclusion ${month >= 6 && !removed ? 'good' : ''}`}><strong>{month >= 6 && !removed ? '形成双向适应候选' : removed ? '依赖被具体看见' : '继续观察实际任务'}</strong><span>{removed ? '移除不是让一个图标消失，而是让人物的行动在岔路处真正中断。' : '拖动月份时，橙色/绿色实际路线、人物工作流程和蓝色偏好模型会一起改变。'}</span></div>
  </div>;
};

const boundaryCases = [
  { label: '天气模型', icon: CloudRain, title: '准确预测，不等于进入被预测对象的因果过程' },
  { label: '恒温器', icon: Thermometer, title: '反馈回路存在，不等于具备丰富的认知结构' },
  { label: '意识边界', icon: BrainCircuit, title: '功能外化成立，不等于主观体验被复制' },
];

export const EvidenceBoundarySceneV2: React.FC<WidgetProps> = () => {
  const [caseNo, setCaseNo] = useState(0);
  const [step, setStep] = useState(0);
  const [replay, setReplay] = useState(0);
  const current = boundaryCases[caseNo];
  const advance = () => { if (step === 3) { setStep(0); setReplay(v => v + 1); } else setStep(v => v + 1); };
  const stepLabels = caseNo === 0
    ? ['观察真实天气', '模型读取天气数据', '主动篡改模型预测', '检查真实天气是否改变']
    : caseNo === 1
      ? ['恒温器维持单一温度', '加入陌生的多约束任务', '观察简单控制器如何失败', '检查功能等价三道门']
      : ['验证可观察的规划功能', '在陌生任务中再次通过', '尝试推出“体验也已复制”', '停在论文的证据边界'];
  return <div className={`advanced-scene evidence-v5 evidence-case-${caseNo} evidence-step-${step}`}>
    <div className="advanced-toolbar"><div><span>论文边界实验 · 点击推进</span><strong>{current.title}</strong></div><button onClick={() => { setStep(0); setReplay(v => v + 1); }}><RotateCcw size={17}/>重置</button></div>
    <div className="evidence-case-tabs">{boundaryCases.map((item, i) => { const Icon = item.icon; return <button key={item.label} className={caseNo === i ? 'active' : ''} onClick={() => { setCaseNo(i); setStep(0); setReplay(v => v + 1); }}><Icon size={20}/><span>{item.label}</span></button>; })}</div>
    <div className="evidence-step-head"><div><span>步骤 {step + 1} / 4</span><strong>{stepLabels[step]}</strong></div><button onClick={advance}>{step === 3 ? <RotateCcw size={17}/> : <Play size={17}/>} {step === 3 ? '重新演示' : '推进下一步'}</button></div>
    {caseNo === 0 ? <svg key={`weather-${replay}`} viewBox="0 0 900 430" className="evidence-v5-svg weather-causality" role="img" aria-label="天气影响模型但篡改模型不会反向影响天气的因果实验">
      <defs><marker id="weatherArrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z"/></marker></defs><rect width="900" height="430" className="scene-ground"/>
      <g className="weather-world"><rect x="35" y="45" width="355" height="300" rx="14"/><text className="scene-title" x="60" y="79">真实大气系统</text><g className="cloud-bank" transform="translate(95 128)"><path d="M0 70 Q18 25 65 43 Q94 -4 144 36 Q198 18 218 70Z"/>{[25,62,100,138,176].map(x => <line key={x} x1={x} y1="86" x2={x - 18} y2="145"/>)}</g><path className="wind-trajectory" d="M74 290 C155 245 244 320 345 250"/><text className="weather-state" x="212" y="325" textAnchor="middle">锋面持续向东移动 · 降雨继续</text></g>
      <g className="weather-model"><rect x="510" y="45" width="355" height="300" rx="14"/><text className="scene-title" x="535" y="79">天气预测模型</text><g className="model-screen" transform="translate(575 115)"><rect width="225" height="145" rx="8"/><path className="forecast-line original" d="M25 110 C65 90 75 35 120 62 S180 95 202 32"/><path className="forecast-line perturbed" d="M25 45 C72 82 102 102 142 65 S175 30 202 95"/><line x1="25" y1="120" x2="205" y2="120"/></g><text className="model-state" x="687" y="306" textAnchor="middle">{step < 2 ? '根据观测更新预测' : '预测已被人为改成“晴天”'}</text></g>
      <path className="sensor-stream" d="M390 145 C440 118 465 118 510 145" markerEnd="url(#weatherArrow)"/><text className="stream-label" x="450" y="108" textAnchor="middle">观测数据</text>
      <path className="blocked-causal-return" d="M510 280 C465 310 435 310 390 280"/><g className="causal-cross" transform="translate(450 298)"><path d="M-12 -12 L12 12 M12 -12 L-12 12"/></g><text className="no-effect-label" x="450" y="350" textAnchor="middle">篡改模型后，真实云层与降雨轨迹没有变化</text>
    </svg> : caseNo === 1 ? <svg key={`thermo-${replay}`} viewBox="0 0 900 430" className="evidence-v5-svg thermostat-test" role="img" aria-label="恒温器在简单单房间任务中成功，但在多约束陌生任务中失败">
      <defs><marker id="thermoArrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z"/></marker></defs><rect width="900" height="430" className="scene-ground"/>
      <g className="simple-room"><rect x="40" y="65" width="310" height="250" rx="12"/><text className="scene-title" x="65" y="98">训练内任务：单房间恒温</text><g className="house-outline" transform="translate(100 145)"><path d="M0 54 L75 0 L150 54 V145 H0Z"/><path className="heater-wave" d="M32 116 Q45 90 58 116 Q71 90 84 116 Q97 90 110 116"/></g><text className="room-temp" x="275" y="184">19°C</text><text className="target-temp" x="275" y="216">目标 22°C</text><text className="pass-label" x="195" y="286" textAnchor="middle">简单反馈任务通过</text></g>
      <g className="thermostat-controller" transform="translate(405 145)"><circle r="62"/><path className="dial" d="M0 0 L28 -28"/><text y="8" textAnchor="middle">22°</text></g><path className="thermo-loop a" d="M350 150 C380 105 400 100 418 112" markerEnd="url(#thermoArrow)"/><path className="thermo-loop b" d="M418 235 C385 275 360 270 335 245" markerEnd="url(#thermoArrow)"/>
      <g className="novel-constraints"><rect x="535" y="65" width="325" height="250" rx="12"/><text className="scene-title" x="560" y="98">陌生结构任务</text><g className="constraint-grid"><text x="570" y="143">房间 A：老人需要 24°C</text><text x="570" y="178">房间 B：婴儿需要 22°C</text><text x="570" y="213">电价高峰：降低能耗</text><text x="570" y="248">用户偏好：睡眠优先</text></g><path className="single-rule" d="M580 280 H815"/><text className="fail-label" x="697" y="301" textAnchor="middle">单一设定点无法保持这些关系</text></g>
      <g className="equivalence-gates" transform="translate(105 355)">{['输出正确', '新输入泛化', '结构对应'].map((x, i) => <g key={x} transform={`translate(${i * 245} 0)`} className={i === 0 ? 'pass' : 'fail'}><rect width="210" height="48" rx="5"/><text x="105" y="29" textAnchor="middle">{x} {i === 0 ? '✓' : '✕'}</text></g>)}</g>
    </svg> : <svg key={`conscious-${replay}`} viewBox="0 0 900 430" className="evidence-v5-svg consciousness-boundary" role="img" aria-label="规划功能的可观察证据通过测试，但主观体验停在证据边界之外">
      <defs><marker id="mindArrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z"/></marker></defs><rect width="900" height="430" className="scene-ground"/>
      <text className="lane-label" x="45" y="66">可观察、可检验的功能层</text><g className="compact-human" transform="translate(95 135)"><circle cy="-24" r="9"/><path d="M0 -13 V27 M0 -2 L-20 14 M0 -2 L20 14 M0 27 L-14 51 M0 27 L14 51"/></g><g className="function-packet" transform="translate(165 105)"><rect width="180" height="60" rx="6"/><text x="90" y="25" textAnchor="middle">规划关系结构</text><text x="90" y="45" textAnchor="middle">安全优先 · 时间其次</text></g><path className="function-transfer" d="M345 135 H610" markerEnd="url(#mindArrow)"/><g className="compact-ai" transform="translate(645 93)"><rect width="150" height="90" rx="8"/><path d="M25 30 H125 M25 50 H105 M25 70 H132"/></g><g className="novel-pass"><rect x="620" y="210" width="205" height="52" rx="6"/><text x="722" y="242" textAnchor="middle">结构相关新任务通过 ✓</text></g><path className="result-drop" d="M720 183 V207" markerEnd="url(#mindArrow)"/>
      <line className="evidence-boundary-line" x1="455" y1="285" x2="455" y2="405"/><text className="evidence-boundary-name" x="455" y="277" textAnchor="middle">论文的证据边界</text><text className="lane-label uncertain" x="45" y="326">不可由上述测试自动推出的主观层</text><g className="experience-claim" transform="translate(120 350)"><rect width="240" height="55" rx="6"/><text x="120" y="23" textAnchor="middle">“第一人称体验也被复制”</text><text x="120" y="43" textAnchor="middle">目前没有可操作证据</text></g><path className="blocked-claim" d="M360 378 H442"/><g className="boundary-stop" transform="translate(455 378)"><path d="M-11 -11 L11 11 M11 -11 L-11 11"/></g><g className="uncertain-zone"><rect x="505" y="318" width="320" height="87" rx="8"/><text x="665" y="350" textAnchor="middle">意识 · 感质 · 自我意识</text><text x="665" y="378" textAnchor="middle">保持高度不确定，不宣称“上传”</text></g>
    </svg>}
    <div className="evidence-step-strip">{stepLabels.map((label, i) => <div key={label} className={i < step ? 'done' : i === step ? 'current' : ''}><span>{i + 1}</span>{label}</div>)}</div>
  </div>;
};
