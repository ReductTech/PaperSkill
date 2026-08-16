import { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

type StageValues = readonly [number, number, number, number];
type StageMethod = { id: string; label: string; scores: readonly StageValues[] };

const stageMethods: readonly StageMethod[] = [
  { id: 'llm', label: 'LLM-YOLO', scores: [[23,20.3,15,13.9],[6.6,5.5,0,0],[3.8,1.9,0,0],[3.8,1.7,0,0],[4.3,1.1,0,0]] },
  { id: 'uni', label: 'Uni-NaVid', scores: [[19,16.8,16,15.6],[8.1,7.9,2.9,2.9],[5.4,4.4,2.5,1.9],[5.8,4.6,1.3,1.2],[7.3,4.9,0,0]] },
  { id: 'uni-ft', label: 'Uni-NaVid（微调）', scores: [[21,21,20,18.9],[10.3,8.9,3.7,3.1],[5.5,5.1,3.8,3.8],[9,8.5,5.1,4.6],[4,3,0,0]] },
  { id: 'vint', label: 'ViNT', scores: [[9,4.2,1,0],[3.6,2.5,1.5,.5],[3.4,1.3,0,0],[3.2,1.1,0,0],[1.6,.2,0,0]] },
  { id: 'vint-ft', label: 'ViNT（微调）', scores: [[9,5.2,2,2],[3.8,3.3,1.7,1.7],[4.7,2.9,.4,.4],[4.5,2.1,0,0],[2.4,.4,0,0]] },
  { id: 'nomad', label: 'NoMaD', scores: [[5,5,0,0],[3.6,2.7,0,0],[2.5,1.3,0,0],[4.5,2.5,0,0],[4.8,1,0,0]] },
  { id: 'nomad-ft', label: 'NoMaD（微调）', scores: [[12,8,3,2.2],[5.5,3.5,1.7,.6],[1.7,1.6,0,0],[6.4,5.1,0,0],[.8,.2,0,0]] },
  { id: 'sg', label: 'SG-Nav', scores: [[24,20.4,12,6],[8.1,5.3,.7,.1],[5.1,2.9,.4,0],[6.4,3.6,0,0],[1.6,.3,0,0]] },
  { id: 'omni', label: 'OmniNav', scores: [[7,4.7,2,1.9],[5.1,3.3,1.5,1.5],[4.1,2.4,0,0],[4.5,2.4,0,0],[2.4,.8,0,0]] },
  { id: 'rocket', label: 'ROCKET-2', scores: [[18,17.2,13,10.8],[19.8,19,9.6,8.8],[15,13.3,7.5,6.8],[11.5,11.5,5.1,4],[5.6,2.6,0,0]] },
  { id: 'rocket-ft', label: 'ROCKET-2（微调）', scores: [[18,18,16,14],[21.3,20.5,13.9,11],[18.4,17.6,8.8,7.4],[12.2,11.8,2.6,2.4],[2.4,2.1,0,0]] },
  { id: 'human', label: 'Human', scores: [[25,25,25,25],[25,25,25,25],[25,25,25,25],[25,25,25,25],[24.2,24.2,23.4,23.4]] },
  { id: 'oracle', label: 'Oracle', scores: [[25,25,25,25],[25,25,25,25],[25,25,25,25],[25,25,25,25],[25,25,25,25]] },
];

const stageLabels = ['S1 探索', 'S2 定位与救援', 'S3 返回', 'S4 定位与交接'] as const;

export function StageDiagnosisV2(_: WidgetProps) {
  const [methodId, setMethodId] = useState('rocket-ft');
  const [level, setLevel] = useState(2);
  const method = stageMethods.find((item) => item.id === methodId) ?? stageMethods[10];
  const values = method.scores[level];
  const choose = (nextMethod: string, nextLevel: number) => { setMethodId(nextMethod); setLevel(nextLevel); };
  return <div className="stage-diagnosis-v2">
    <div className="diagnosis-controls">
      <label><span>方法</span><select aria-label="选择阶段诊断方法" value={methodId} onChange={(event) => setMethodId(event.target.value)}>{stageMethods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <div className="diagnosis-levels" role="group" aria-label="选择阶段诊断难度">{[0,1,2,3,4].map((index) => <button type="button" key={index} className={level === index ? 'selected' : ''} onClick={() => setLevel(index)}>L{index + 1}</button>)}</div>
    </div>
    <div className="diagnosis-shortcuts"><button type="button" onClick={() => choose('rocket-ft',2)}>探索衰减 · L3</button><button type="button" onClick={() => choose('rocket-ft',3)}>更强返回落差 · L4</button><button type="button" onClick={() => choose('uni-ft',2)}>另一种方法 · L3</button></div>
    <div className="stage-scoreboard-v2" aria-live="polite">
      <header><span>{method.label}</span><strong>L{level + 1}</strong><small>统一横轴 0–25</small></header>
      {stageLabels.map((label, index) => <div className={`stage-score-row stage-${index + 1}`} key={label}><span>{label}</span><i><b style={{ width: `${values[index] / 25 * 100}%` }} /></i><strong>{values[index].toFixed(1)} / 25</strong></div>)}
      <div className="stage-axis"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span></div>
    </div>
    <div className="diagnosis-reading"><section><span>第一断点</span><strong>S1 · 自主探索</strong><p>目标未知时，需要持续决定哪里值得搜索。</p></section><section><span>第二断点</span><strong>S3 · 空间记忆</strong><p>找到目标后，还要调用早期空间信息完成返回。</p></section></div>
    <p className="result-source">来源：论文 Figure 6、Table 4–5</p>
  </div>;
}

const explorationLevels = [
  { level: 'L3', score: 18.4, visited: 9, path: '52,185 105,142 158,161 205,103 265,128 323,73 378,108 438,58 493,92', note: '多个区域被系统访问，覆盖仍较完整。' },
  { level: 'L4', score: 12.2, visited: 6, path: '52,185 105,142 158,161 205,103 265,128 323,73', note: '搜索空间扩大，跨区域后覆盖开始碎裂。' },
  { level: 'L5', score: 2.4, visited: 2, path: '52,185 105,142', note: '多楼层、多区域下，实际覆盖只剩局部。' },
] as const;

export function ExplorationDeclineV2(_: WidgetProps) {
  const [active, setActive] = useState(0);
  const current = explorationLevels[active];
  return <div className="exploration-decline-v2">
    <div className="exploration-level-tabs" role="group" aria-label="切换探索衰减难度">{explorationLevels.map((item,index) => <button type="button" key={item.level} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}><span>{item.level}</span><strong>{item.score.toFixed(1)}</strong><small>S1 / 25</small></button>)}</div>
    <div className="exploration-main">
      <svg viewBox="0 0 550 240" className="coverage-map" role="img" aria-label={`${current.level} 搜索覆盖概念图`}>
        <rect x="18" y="18" width="514" height="204" rx="14" className="coverage-field" />
        {Array.from({length:12},(_,index) => { const x=42+(index%4)*122; const y=42+Math.floor(index/4)*58; return <rect key={index} x={x} y={y} width="98" height="38" rx="7" className={index < current.visited ? 'coverage-zone visited' : 'coverage-zone unknown'} />; })}
        <polyline key={current.level} points={current.path} className="coverage-route" />
        <circle cx="52" cy="185" r="10" className="coverage-agent" /><text x="34" y="211">起点</text>
      </svg>
      <aside><span>ROCKET-2（微调）· {current.level}</span><strong>S1 = {current.score.toFixed(1)} / 25</strong><p>{current.note}</p><div><b>已访问区域</b><i><em style={{ width: `${current.visited / 12 * 100}%` }} /></i><small>{current.visited} / 12</small></div></aside>
    </div>
    <div className="before-after-search"><section><span>找到之前</span><strong>人在哪里？</strong><p>需要自主探索，持续决定下一处搜索方向。</p></section><b>→</b><section><span>找到以后</span><strong>怎样靠近目标？</strong><p>目标已经出现，转为局部接近导航。</p></section></div>
    <p className="exploration-judgment">很多方法真正困难的是“先找到目标”，而不是“看到目标以后走过去”。</p>
    <p className="result-source">来源：论文 Section 3.4、Table 4–5</p>
  </div>;
}

const returnCases = [
  { id:'rocket-l3', label:'ROCKET-2（微调）/ L3', s2:17.6, s3:8.8 },
  { id:'rocket-l4', label:'ROCKET-2（微调）/ L4', s2:11.8, s3:2.6 },
  { id:'uni-l3', label:'Uni-NaVid（微调）/ L3', s2:5.1, s3:3.8 },
] as const;

export function ReturnMemoryGapV2(_: WidgetProps) {
  const [active, setActive] = useState(0);
  const current = returnCases[active];
  const gap = current.s2 - current.s3;
  return <div className="return-memory-v2">
    <div className="return-case-tabs" role="group" aria-label="切换返回记忆案例">{returnCases.map((item,index)=><button type="button" key={item.id} className={active===index?'selected':''} onClick={()=>setActive(index)}>{item.label}</button>)}</div>
    <div className="return-gap-layout">
      <section className="return-bars" aria-live="polite">
        <header><span>{current.label}</span><strong>S2 → S3 下降 {gap.toFixed(1)} 分</strong></header>
        <div><span>S2 定位与救援</span><i><b style={{width:`${current.s2/25*100}%`}} /></i><strong>{current.s2.toFixed(1)}</strong></div>
        <em>↓ 目标切换为返回救护车</em>
        <div className="memory"><span>S3 空间记忆</span><i><b style={{width:`${current.s3/25*100}%`}} /></i><strong>{current.s3.toFixed(1)}</strong></div>
      </section>
      <section className="return-state-cards"><div><span>S2</span><dl><dt>目标</dt><dd>伤员</dd><dt>状态</dt><dd>已发现</dd><dt>任务</dt><dd>靠近目标</dd></dl></div><div><span>S3</span><dl><dt>目标</dt><dd>救护车</dd><dt>新逐步路线</dt><dd>无</dd><dt>需要调用</dt><dd>前期空间信息</dd></dl></div></section>
    </div>
    <div className="return-memory-scene">
      <header><strong>找到人了，不代表回得来</strong><span>返回依赖空间信息检索，而不是原路径倒放</span></header>
      <svg viewBox="0 0 700 245" role="img" aria-label="返回阶段低效回溯的概念动画">
        <rect x="18" y="18" width="664" height="205" rx="14" className="memory-field" />
        <path d="M78 183 C165 126 195 166 282 94 S414 49 548 68" className="memory-outbound" />
        <path d="M548 68 C490 145 430 68 368 154 S230 97 176 181 S112 132 78 183" className="memory-backtrack" />
        <g className="home-base"><circle cx="78" cy="183" r="17"/><text x="48" y="216">救护车</text></g>
        <g className="victim-mark"><circle cx="548" cy="68" r="16"/><text x="522" y="40">伤员</text></g>
        <circle key={current.id} cx="548" cy="68" r="10" className="return-agent" />
      </svg>
    </div>
    <p className="result-source">来源：论文 Section 3.4、Table 4–5</p>
  </div>;
}

type TrajectoryInfo = { id:string; label:string; family:string; image:string; result:'成功'|'失败'; phenomenon:string; diagnosis:string; architecture:string; tag:string };
const trajectories: readonly TrajectoryInfo[] = [
  { id:'human',label:'Human',family:'参照',image:'/images/figure-7-human-success.png',result:'成功',phenomenon:'完成搜索并推进完整任务。',diagnosis:'作为该代表性 L3 episode 的成功参照。',architecture:'不添加超出论文证据的机制解释。',tag:'成功参照' },
  { id:'rocket',label:'ROCKET-2',family:'VLA / 视觉运动',image:'/images/figure-7-rocket-2.png',result:'成功',phenomenon:'形成较系统的主动搜索轨迹。',diagnosis:'该代表性 L3 episode 成功；总体高难度仍有探索衰减和返回缺口。',architecture:'goal-conditioned 视觉运动策略有助于形成覆盖。',tag:'系统搜索' },
  { id:'uni',label:'Uni-NaVid',family:'VLA / 视觉运动',image:'/images/figure-7-uni-navid.png',result:'失败',phenomenon:'具有主动搜索覆盖，但未完成任务。',diagnosis:'终点收敛、低效回溯与返回稳定性仍不足。',architecture:'时间建模有助于搜索，持久空间记忆仍受限。',tag:'返回与收敛不足' },
  { id:'llm',label:'LLM-YOLO',family:'模块化',image:'/images/figure-7-llm-yolo.png',result:'失败',phenomenon:'被障碍困住，随后停滞。',diagnosis:'前级错误缺少有效恢复，向后传播到规划与行动。',architecture:'感知 → 规划 → 行动的串联流程存在级联脆弱性。',tag:'级联脆弱性' },
  { id:'vint',label:'ViNT',family:'VLN',image:'/images/figure-7-vint.png',result:'失败',phenomenon:'持续移动，却反复经过相近区域。',diagnosis:'退化循环耗尽有限时间预算，没有有效扩大覆盖。',architecture:'路线检索在陌生环境中缺少可匹配路线与专门探索逻辑。',tag:'移动 ≠ 探索' },
  { id:'nomad',label:'NoMaD',family:'VLN',image:'/images/figure-7-nomad.png',result:'失败',phenomenon:'轨迹移动明显，但搜索覆盖没有持续扩展。',diagnosis:'重复循环带来高移动量，却未转化为新区域覆盖。',architecture:'目标导向路线策略在未知目标搜索中缺少探索机制。',tag:'退化循环' },
  { id:'sg',label:'SG-Nav',family:'地图方法',image:'/images/figure-7-sg-nav.png',result:'失败',phenomenon:'有限时间内轨迹覆盖范围较小。',diagnosis:'0.2–0.4 FPS 的推理速度限制了有效动作数量。',architecture:'显式空间推理带来较高单步计算开销。',tag:'推理受限' },
  { id:'omni',label:'OmniNav',family:'地图方法',image:'/images/figure-7-omninav.png',result:'失败',phenomenon:'只覆盖局部区域，未形成充分搜索。',diagnosis:'有限时间预算内只能执行较少有效动作。',architecture:'地图与视觉语言推理的计算开销限制实际覆盖。',tag:'推理受限' },
] as const;

const trajectoryEvent = 'rescuebench:trajectory-method';

function MovementComparison() {
  const [mode,setMode]=useState<'search'|'loop'>('search');
  return <div className="movement-comparison-v2">
    <div className="movement-tabs" role="group" aria-label="对比移动与探索"><button type="button" className={mode==='search'?'selected':''} onClick={()=>setMode('search')}>有效搜索</button><button type="button" className={mode==='loop'?'selected':''} onClick={()=>setMode('loop')}>退化循环</button></div>
    <div className="movement-panels">
      <section className={mode==='search'?'active':''}><strong>有效搜索</strong><svg viewBox="0 0 300 145"><path d="M38 108 L92 74 L150 92 L204 48 L264 70"/><circle cx="38" cy="108" r="8"/><circle cx="92" cy="74" r="8"/><circle cx="150" cy="92" r="8"/><circle cx="204" cy="48" r="8"/><circle cx="264" cy="70" r="8"/></svg><p><span>移动距离 ↑</span><span>新区域覆盖 ↑</span></p></section>
      <section className={mode==='loop'?'active':''}><strong>退化循环</strong><svg viewBox="0 0 300 145"><path d="M84 45 L218 45 L218 111 L84 111 Z L218 45 L84 111"/><circle cx="84" cy="45" r="8"/><circle cx="218" cy="45" r="8"/><circle cx="218" cy="111" r="8"/><circle cx="84" cy="111" r="8"/></svg><p><span>移动距离 ↑↑↑</span><span>新区域覆盖 ─</span></p></section>
    </div>
    <p>走了很多路，不等于真正搜索了新的地方。</p>
  </div>;
}

export function TrajectoryLabV2(_: WidgetProps) {
  const [methodId,setMethodId]=useState('human');
  useEffect(()=>{ const handler=(event:Event)=>setMethodId((event as CustomEvent<string>).detail); window.addEventListener(trajectoryEvent,handler); return()=>window.removeEventListener(trajectoryEvent,handler); },[]);
  const current=trajectories.find((item)=>item.id===methodId)??trajectories[0];
  return <div className="trajectory-lab-v2" id="trajectory-lab-v2">
    <div className="trajectory-methods" role="group" aria-label="切换代表性 L3 轨迹">{trajectories.map((item)=><button type="button" key={item.id} className={methodId===item.id?'selected':''} onClick={()=>setMethodId(item.id)}><span>{item.family}</span><strong>{item.label}</strong></button>)}</div>
    <div className="trajectory-main">
      <figure><img src={assetPath(current.image)} alt={`${current.label} 在代表性 L3 episode 中的轨迹面板`}/><figcaption>来源：论文 Figure 7</figcaption></figure>
      <aside aria-live="polite"><header><span className={current.result==='成功'?'success':'failure'}>{current.result}</span><strong>{current.label}</strong><small>{current.family}</small></header><dl><div><dt>轨迹现象</dt><dd>{current.phenomenon}</dd></div><div><dt>论文诊断</dt><dd>{current.diagnosis}</dd></div><div><dt>架构关联</dt><dd>{current.architecture}</dd></div></dl><b>{current.tag}</b></aside>
    </div>
    <p className="trajectory-boundary">Figure 7 展示的是同一个代表性 L3 episode，用于解释典型行为模式，不能替代总体统计成功率。</p>
    <MovementComparison />
    <p className="result-source">来源：论文 Figure 7、Section 3.5</p>
  </div>;
}

const architectureRows = [
  { id:'llm',family:'模块化',trajectory:'被障碍困住 / 停滞',problem:'级联脆弱、缺少恢复',tag:'级联脆弱性' },
  { id:'sg',family:'地图方法',trajectory:'有限时间内覆盖不足',problem:'0.2–0.4 FPS，推理受限',tag:'推理受限' },
  { id:'vint',family:'VLN',trajectory:'持续移动但重复循环',problem:'移动不等于探索',tag:'退化循环' },
  { id:'uni',family:'VLA / 视觉运动',trajectory:'更系统的主动搜索',problem:'返回记忆与终点收敛不足',tag:'会探索，仍难返回' },
] as const;

export function ArchitectureFailureMatrixV2(_: WidgetProps) {
  const select=(index:number)=>{ window.dispatchEvent(new CustomEvent<string>(trajectoryEvent,{detail:architectureRows[index].id})); window.setTimeout(()=>document.getElementById('trajectory-lab-v2')?.scrollIntoView({behavior:'smooth',block:'start'}),40); };
  return <div className="architecture-matrix-v2">
    <div className="architecture-grid" role="group" aria-label="四类架构失败方式">{architectureRows.map((item,index)=><button type="button" key={item.family} onClick={()=>select(index)}><span>{item.family}</span><strong>{item.trajectory}</strong><p>{item.problem}</p><b>{item.tag}</b></button>)}</div>
    <div className="capability-gaps"><section><span>第一缺口</span><strong>开放环境自主探索</strong><p>目标未知时，持续决定哪里值得搜索。</p></section><section><span>第二缺口</span><strong>持久空间记忆</strong><p>保留早期空间信息，并在后续返回任务中稳定调用。</p></section></div>
    <p className="diagnosis-conclusion">RescueBench 暴露的核心问题不是单次导航精度，而是智能体能否在长序列任务中持续搜索，并把早期形成的空间信息带到后续决策中。</p>
    <p className="diagnosis-boundary">这些结论只针对论文评测的架构、数据和实验协议。</p>
    <p className="result-source">来源：论文 Section 3.4 / 3.5</p>
  </div>;
}
