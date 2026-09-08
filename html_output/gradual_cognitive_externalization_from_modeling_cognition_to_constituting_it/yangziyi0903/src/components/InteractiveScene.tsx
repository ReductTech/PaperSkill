import React, { useState } from 'react';
import { PaperBoundaryNote } from './PaperBoundaryNote';

function Guide({ step, action, watch }: { step: string; action: string; watch: string }) {
  return <div className="instruction-ribbon"><span>现在做什么</span><strong>{action}</strong><i>{step}</i><p>请观察：{watch}</p></div>;
}
function Action({ children, onClick, disabled=false }: { children: React.ReactNode; onClick:()=>void; disabled?:boolean }) {
  return <button className="primary-action" disabled={disabled} onClick={onClick}>{children}<span>→</span></button>;
}
function Result({ children, tone='neutral' }: { children:React.ReactNode; tone?:string }) {
  return <div className={'scene-result '+tone}>{children}</div>;
}

const routePaths:Record<string,string>={
  '河畔路':'M55 205 C165 195 175 70 310 80 S500 185 665 55',
  '环城路':'M55 205 C120 40 360 25 665 55',
  '高架主路':'M55 205 C205 235 430 215 665 55',
  '积水小路':'M55 205 C190 190 265 135 355 132',
};
function AnimatedRouteMap({route,human,label,replay=0}:{route:string;human:boolean;label:string;replay?:number}){
  const path=routePaths[route]??routePaths['河畔路'];
  return <svg className="animated-route-map" viewBox="0 0 720 250" role="img" aria-label={`${label}沿${route}行动`}>
    <rect className="map-grass" x="0" y="0" width="720" height="250"/>
    <path className="map-road faint" d={routePaths['河畔路']}/><path className="map-road faint" d={routePaths['环城路']}/><path className="map-road faint" d={routePaths['高架主路']}/>
    <path className={'map-road selected '+(human?'human-route':'ai-route')} d={path}/>
    <g className="map-home" transform="translate(30 185)"><path d="M0 18 L25 0 L50 18 V50 H0Z"/><rect x="19" y="29" width="12" height="21"/></g>
    <g className="map-lab" transform="translate(650 18)"><rect width="48" height="58"/><rect x="9" y="10" width="9" height="9"/><rect x="29" y="10" width="9" height="9"/><rect x="19" y="38" width="11" height="20"/></g>
    {route==='积水小路'?<g className="flood-block"><path d="M325 126 q18 -15 36 0 q18 15 36 0"/><text x="327" y="112">积水阻断</text></g>:null}
    <g key={`${route}-${replay}`} className={'moving-actor '+(human?'human-actor':'ai-actor')}>
      {human?<><rect x="-16" y="-9" width="32" height="18" rx="4"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/></>:<><rect x="-17" y="-12" width="34" height="24" rx="3"/><path d="M-10 -5 H10 M-10 1 H6 M-10 7 H12"/></>}
      <animateMotion dur="2.8s" path={path} fill="freeze" calcMode="spline" keySplines="0.42 0 0.2 1"/>
    </g>
    <text className="route-name" x="360" y="238" textAnchor="middle">{label}：{route}</text>
  </svg>
}

const cases = [
  ['常规通勤','08:30 到实验室，偏好避开拥堵','河畔路'],
  ['时间权衡','提前 15 分钟到达，但不走高风险小路','环城路'],
  ['新情境：暴雨封路','熟悉路线关闭，必须把“安全优先”迁移到陌生路网','高架主路'],
];

function NBIRScene(){
  const [caseNo,setCaseNo]=useState(0);
  const [claim,setClaim]=useState<'none'|'no'|'yes'>('none');
  const [tested,setTested]=useState(false);
  const divergence=caseNo===2&&claim==='yes'&&tested;
  const item=cases[caseNo];
  return <div className="immersive-scene teaching-scene">
    <Guide step={(caseNo+1)+' / 4'} action={caseNo<2?'比较同一情境下人类与 AI 的具体选择':'检验“隐藏残余”是否真的影响规划功能'} watch="两个系统的路线与理由是否相同；若声称存在必要的隐藏残余，它是否产生下游差异" />
    <div className="scene-question-row"><div><span className="overline">NBIR · 行为之外还缺什么？</span><h3>如果人类和 AI 连续做出相同选择，我们能否说它们实现了同一规划功能？</h3></div><div className="hypothesis-stamp">可证伪假设<br/><b>不是既定事实</b></div></div>
    <div className="scenario-card"><span>{item[0]}</span><strong>{item[1]}</strong></div>
    <div className={'decision-comparison '+(divergence?'diverged':'')}>
      <Decision who="人类" route={item[2]} reason="安全优先，其次时间" human />
      <div className="comparison-sign">{divergence?'≠':'≈'}</div>
      <Decision who="AI" route={divergence?'积水小路':item[2]} reason={divergence?'只复现旧路线，未迁移安全原则':'安全优先，其次时间'} />
    </div>
    {caseNo<2?<div className="scene-actions"><Result tone="good">当前输入、路线和理由都一致。但这还没有检验隐藏残余。</Result><Action onClick={()=>{setCaseNo(caseNo+1);setClaim('none');setTested(false)}}>换一个更难的新情境</Action></div>:
    <div className="residual-experiment"><div><span>假设人类内部存在“隐藏残余”R</span><p>关键不是 R 是否神秘，而是它是否对目标规划功能具有可观察后果。</p></div><div className="binary-choice"><button className={claim==='no'?'active':''} onClick={()=>{setClaim('no');setTested(false)}}>R 不影响规划结果</button><button className={claim==='yes'?'active danger':''} onClick={()=>{setClaim('yes');setTested(false)}}>R 对规划必不可少</button></div><Action disabled={claim==='none'} onClick={()=>setTested(true)}>运行结构相关的新任务</Action></div>}
    {caseNo===2&&(tested?(claim==='yes'?<Result tone="bad"><b>出现可观察分歧：</b>人类把安全原则迁移到新路网，AI 失败。这直接挑战该规划领域的 NBIR。</Result>:<Result tone="good">R 没有改变输出或迁移表现，因此无法用它区分这一规划功能的实现。</Result>):<Result tone="uncertain">先选择一个可检验主张，再运行下游任务。</Result>)}
    <div className="concept-reveal"><span>现在才命名概念</span><strong>NBIR：若隐藏属性对认知功能真正必要，它应当产生功能性后果。</strong></div>
    <PaperBoundaryNote text="对规划、偏好、沟通，行为签名相对清晰；对感质与自我意识，论文保留更高不确定性。GCE 不主张意识或感质转移。" />
  </div>
}
function Decision({who,route,reason,human=false}:{who:string;route:string;reason:string;human?:boolean}){
  return <div className={'decision-agent '+(human?'human-decision':'ai-decision')}><header>{who}</header><div className="decision-actor">{human?<div className="mini-person"><i/><b/></div>:<div className="mini-nav"><span>AI</span><i/><i/></div>}</div><AnimatedRouteMap route={route} human={human} label={human?'人的实际行动':'AI 的规划结果'}/><footer>选择：{route}<small>理由：{reason}</small></footer></div>
}

function EquivalenceScene(){
  const [agent,setAgent]=useState<'surface'|'structure'|null>(null);
  const [test,setTest]=useState(0);
  const pass=agent==='structure'||test===0;
  const testNames=['复现训练路线','应对从未见过的封路','保持用户的关系性偏好'];
  return <div className="immersive-scene teaching-scene">
    <Guide step={(test+1)+' / 3'} action={agent?testNames[test]:'先选择要测试的 AI'} watch="Gate 由系统行为决定：它是复制旧答案，还是迁移了“安全优先、时间其次”的结构" />
    <div className="scene-question-row"><div><span className="overline">功能等价</span><h3>“训练样本上答对”为什么仍然不够？</h3></div><span className="toy-label">教学示意，不是论文实验</span></div>
    <div className="agent-selector narrative"><button className={agent==='surface'?'active':''} onClick={()=>{setAgent('surface');setTest(0)}}><strong>表面记忆系统</strong><span>记住“平时走河畔路”</span></button><button className={agent==='structure'?'active':''} onClick={()=>{setAgent('structure');setTest(0)}}><strong>结构学习系统</strong><span>学到“安全优先，其次时间”</span></button></div>
    {!agent?<Result tone="uncertain">先选择一个 AI。系统随后依次运行三项测试，不能手动把 Gate 点亮。</Result>:<>
      <div className={'equivalence-journey '+(pass?'pass':'fail')+' test-'+test}><div className="route-simulator"><svg viewBox="0 0 600 230" role="img" aria-label="路线测试动画"><path className="street street-a" d="M45 175 C150 180 210 115 305 112 S455 118 550 55"/><path className="street street-b" d="M45 175 C155 65 290 200 550 55"/><path className="street street-c" d="M45 175 C185 220 400 210 550 55"/><rect className="route-block" x="282" y="91" width="55" height="42" rx="3"/><text x="293" y="117">封路</text><circle className="route-home" cx="45" cy="175" r="14"/><rect className="route-lab" x="535" y="38" width="30" height="34"/><circle className="route-car" cx="45" cy="175" r="10"/></svg><div className="simulation-caption"><strong>{test===0?'训练路线复现':test===1?'突发封路：必须重新规划':'换到陌生城市：偏好结构还能迁移吗？'}</strong><span>{pass?'车辆沿可通行安全路线到达':'车辆仍冲向记忆中的旧路线并停在封路处'}</span></div></div><div className="reasoning-panel"><small>{agent==='surface'?'表面记忆系统正在做什么':'结构学习系统正在做什么'}</small><div className="memory-strips">{agent==='surface'?<><i className="active">旧输入</i><b>匹配</b><i className="active">旧路线</i></>:<><i className="active">安全优先</i><b>权衡</b><i className="active">时间其次</i></>}</div><strong>{agent==='surface'?'找到相似记录 → 原样复用':'读取风险变化 → 按同一关系重新规划'}</strong></div><div className="observable-outcome"><span>系统行为决定结果</span><b>{test===0?'旧情境输出正确':pass?'陌生情境下仍得到安全替代路线':'在新情境中失败'}</b></div></div>
      <div className="gate-sequence">{testNames.map((name,index)=><div key={name} className={(index===test?'current ':'')+(index<=test?((agent==='structure'||index===0)?'pass':'fail'):'')}><span>{index+1}</span><p>{name}</p><b>{index>test?'未测试':(agent==='structure'||index===0)?'通过':'失败'}</b></div>)}</div>
      <div className="scene-actions"><Action onClick={()=>setTest(Math.min(2,test+1))}>{test<2?'运行下一项测试':'保留最终判定'}</Action></div>
      <Result tone={test>0&&!pass?'bad':test===2&&pass?'good':'neutral'}>{agent==='surface'?'它只通过“输出保真”；封路后缺少“新输入泛化”，也没有保留偏好关系结构。':'它在新输入中仍按同一偏好关系选择路线，因此三项测试共同支持功能等价。'}</Result>
      <div className="formula-with-meaning"><div><span>功能实现程度</span>φ(c<sub>i</sub>, S) ∈ [0,1]</div><div><span>目标功能阈值</span>φ(c<sub>i</sub>,A<sub>t</sub>) ≥ (1−δ)φ(c<sub>i</sub>,H<sub>0</sub>), ∀c<sub>i</sub>∈C′</div></div>
    </>}
  </div>
}

function CausalScene(){
  const [effect,setEffect]=useState<'generic'|'personal'>('generic');
  const [intervened,setIntervened]=useState(false);
  const [assembled,setAssembled]=useState(false);
  const [replay,setReplay]=useState(0);
  const causal=intervened&&effect==='personal';
  return <div className={'immersive-scene teaching-scene causal-story '+(assembled?'assembled':'')}>
    <Guide step={intervened?'2 / 3':'1 / 3'} action={intervened?'比较通用效应与该用户特有的效应':'先看长期相关，再只改变 AI 建议'} watch="其它情境保持不变时，改变 Aₜ 是否改变这个用户的 Hₜ₊₁" />
    <div className="scene-question-row"><div><span className="overline">因果耦合</span><h3>人类与 AI 一直同步变化，仍然不能证明 AI 在因果上改变了人类。</h3></div></div>
    <div className="observation-story"><div><header>只观察过去 6 个月</header><p>AI 建议早点出发时，用户也经常早点出发。</p><svg viewBox="0 0 600 150"><path className="human-line" d="M20 120 C90 30 160 130 230 55 S370 120 440 40 S530 100 580 30"/><path className="ai-line" d="M20 132 C90 42 160 142 230 67 S370 132 440 52 S530 112 580 42"/></svg><strong>因果方向：未知</strong></div><div className="why-unknown"><span>三种解释都可能</span><p>共同日程让两者同时变化</p><p>用户先改变，AI 只是跟随</p><p>AI 建议真正改变用户</p></div></div>
    <div className="intervention-story"><div className="fixed-context"><span>实验控制</span><b>日期、天气、会议时间和道路状态全部保持不变</b></div><div className="causal-route-stage"><div className="route-before"><span>干预前</span><AnimatedRouteMap route="河畔路" human label="用户按原建议出发" replay={replay}/></div><div className={'route-after '+(intervened?'running':'waiting')}><span>只改变 AI 状态之后</span>{intervened?<AnimatedRouteMap route={causal?'高架主路':'环城路'} human label={causal?'该用户改走符合其安全偏好的路线':'用户只作通用的小幅调整'} replay={replay}/>:<div className="intervention-placeholder"><div className="parked-person"><i/><b/></div><strong>用户仍在家中等待建议</strong></div>}</div><div className="causal-control"><div><small>原建议 Aₜ</small><strong>08:20 · 河畔路</strong></div><button className="do-button" onClick={()=>{setIntervened(true);setReplay(v=>v+1)}}>执行干预<br/><b>do(Aₜ := a′)</b></button><div><small>新建议 a′</small><strong>07:55 · {effect==='personal'?'高架主路':'环城路'}</strong></div></div></div><div className="effect-toggle"><button className={effect==='generic'?'active':''} onClick={()=>{setEffect('generic');setIntervened(false);setAssembled(false)}}>通用工具效应<small>任何用户都会作出的轻微调整</small></button><button className={effect==='personal'?'active':''} onClick={()=>{setEffect('personal');setIntervened(false);setAssembled(false)}}>个性化因果效应<small>路线改变体现该用户的“安全优先”结构</small></button></div></div>
    {intervened?<div className={'causal-verdict '+(causal?'good':'bad')}><span>{causal?'发现个性化因果箭头':'仍不足以满足 GCE'}</span><strong>A<sub>t</sub> → H<sub>t+1</sub></strong><p>{causal?'改变 AI 后，该用户的下一步选择按其个性化结构改变。':'这只是通用工具效应，未显示该用户特有的影响。'}</p></div>:null}
    {causal?<div className="equation-reveal"><span>干预后才出现公式</span>P(H<sub>t+1</sub> | do(A<sub>t</sub> := a′)) ≠ P(H<sub>t+1</sub>)</div>:null}
    <div className="criteria-assembly"><div className="criterion met">双向适应<span>双方长期一起改变</span></div><div className="criterion met">功能等价<span>新情境仍实现目标功能</span></div><div className={'criterion '+(causal?'met':'')}>因果耦合<span>干预 AI 改变该用户输出</span></div><Action disabled={!causal} onClick={()=>setAssembled(true)}>将三个判据放入同一系统</Action></div>
    <div className="boundary-demonstration"><div className="human-zone">人类</div><div className="boundary-wall">认知边界</div><div className="ai-zone">AI 模型</div></div><div className="model-component-copy"><span>模型</span><b>→</b><strong>{assembled?'组件':'模型'}</strong></div>
    <Result tone={assembled?'good':'uncertain'}>{assembled?'三个必要判据同时成立：AI 成为该认知过程实际工作的组件。':'边界不会因为 AI 很准确就移动。完成个性化干预并汇集三个判据。'}</Result>
  </div>
}

function ActionCycle({time,index}:{time:number;index:number}){
  const progress=Math.min(1,Math.max(0,(time-index*12)/42));
  return <div className="action-cycle" style={{opacity:.18+progress*.82}}><div className="cycle-map"><svg viewBox="0 0 320 120"><path d="M18 96 C80 18 165 110 302 24"/><g className="cycle-car" style={{offsetDistance:`${progress*100}%`}}><rect x="-10" y="-5" width="20" height="10" rx="2"/><circle cx="-6" cy="7" r="3"/><circle cx="6" cy="7" r="3"/></g></svg></div><div className="cycle-step"><b>{['AI 提出路线','用户执行并修正','结果反馈给 AI'][index]}</b><span>{progress<.35?'尚未稳定发生':progress<.75?'正在形成习惯':'已进入重复闭环'}</span></div></div>
}

const domains=[['规划',.25,.94],['偏好选择',.22,.82],['沟通表达',.20,.69],['知识检索',.18,.57],['复杂决策',.15,.42]] as const;
function GradualScene(){
  const [time,setTime]=useState(0);const [level,setLevel]=useState(0);const [weights,setWeights]=useState(false);
  const values=domains.map((item)=>Math.min(.92,time/100*item[2]));const e=values.reduce((sum,value,index)=>sum+value*domains[index][1],0);const levels=['静态','响应式','耦合式','替代式','整合式'];
  return <div className={'immersive-scene teaching-scene gradual-story '+(level>=2?'inside-boundary':'')}>
    <Guide step={(time<35?'1':time<70?'2':'3')+' / 3'} action="向右推进共同使用时间" watch="不同认知功能如何以不同速度从“人类独立完成”变成“人机共享完成”" />
    <div className="scene-question-row"><div><span className="overline">渐进式认知外化</span><h3>外化不是一次上传：AI 逐渐承担不同认知功能中的部分工作。</h3></div><span className="toy-label">教学示意值</span></div>
    <div className="gradual-action-stage"><div className="day-plan"><div className="planner-person"><i/><b/></div><div className="plan-sheet"><strong>今天的实际出行计划</strong><span className={time>18?'delegated':''}>比较 4 条路线</span><span className={time>42?'delegated':''}>按安全偏好排序</span><span className={time>68?'delegated':''}>结合日程决定出发时间</span></div><div className="planner-ai"><div className="device-screen"><b>AI 副驾驶</b><small>{time<20?'只给建议':time<55?'共同完成规划':'稳定承担部分规划工作'}</small></div></div></div><div className="action-cycle-list"><ActionCycle time={time} index={0}/><ActionCycle time={time} index={1}/><ActionCycle time={time} index={2}/></div></div>
    <div className="territory-story"><div className="territory-labels"><span>人类完成</span><span>共享完成</span><span>AI 实现</span></div>{domains.map((item,index)=>{const value=values[index],shared=Math.min(value,.45),aiPart=Math.max(0,value-.45);return <div className="work-row" key={item[0]}><strong>{item[0]}</strong><div className="work-ownership"><i className="human-work" style={{width:((1-value)*100)+'%'}}/><i className="shared-work" style={{width:(shared*100)+'%'}}/><i className="ai-work" style={{width:(aiPart*100)+'%'}}/></div><p>{value<.18?'几乎由人类独立完成':value<.5?'人类与 AI 共同完成':'AI 已承担较多功能实现'}</p></div>})}</div>
    <div className="time-narrative"><span>首次使用</span><input type="range" min="0" max="100" value={time} onChange={(event)=>setTime(Number(event.target.value))}/><span>长期耦合</span><strong>时间 {time}</strong></div>
    <div className="ratio-explanation"><div className="fraction"><span>Σᵢ wᵢ φ(cᵢ,Aₜ)</span><span>Σᵢ wᵢ φ(cᵢ,H₀)</span></div><b>= E(t) {e.toFixed(2)}</b><button onClick={()=>setWeights(!weights)}>wᵢ 是什么？</button>{weights?<p>wᵢ 由 AI 引入前日志中的功能频率与后果重要性确定，并做敏感性分析；它不是可随意调节的旋钮。</p>:null}</div>
    <div className="level-task"><p>选择一个整合层级，观察 AI 是否进入认知边界：</p><div className="depth-continuum clear">{levels.map((name,index)=><button key={name} className={index===level?'active':''} onClick={()=>setLevel(index)}><span>层级 {index}</span><strong>{name}</strong><small>{index<2?'仍是工具使用':index===2?'进入因果回路':'整合程度继续增加'}</small></button>)}</div></div>
    <div className="boundary-demo-clear"><div>人类认知系统</div><span className="moving-cut">边界</span><div>AI</div></div>
    <Result tone={level>=2?'good':'neutral'}>{level<2?'层级 0–1：E < 0.2。AI 很有用，但仍在认知边界外。':level===2?'层级 2：0.2 ≤ E < 0.5。双向适应开始且 AI 进入因果循环：模型 → 组件。':'层级 3–4：E ≥ 0.5；论文没有给二者设定单独数值分界。'}</Result>
  </div>
}

function FalsificationScene(){
  const [condition,setCondition]=useState(5);const [run,setRun]=useState(0);const broken=condition===1?0:condition===5?2:4;
  const labels=['数据增加但预测停滞','没有人类反向适应','AI 输出始终可区分','人机变化不相关','相关新任务中 AI 失败'];
  return <div className="immersive-scene teaching-scene falsification-v4">
    <Guide step={`${condition} / 5`} action="选择一个失败条件并运行实验" watch="具体观察如何击中一个前提，并让后续结论逐级失去支撑" />
    <div className="scene-question-row"><div><span className="overline">证伪实验室</span><h3>不是把理论卡片划掉，而是让一次真实失败沿论证链传播。</h3></div></div>
    <div className="falsify-layout"><div className="falsify-selector">{labels.map((x,i)=><button key={x} className={condition===i+1?'active':''} onClick={()=>setCondition(i+1)}><span>条件 {i+1}</span><b>{x}</b></button>)}</div><div className="falsify-lab"><div className="falsify-toolbar"><strong>{labels[condition-1]}</strong><button onClick={()=>setRun(v=>v+1)}>运行实验 / 重播</button></div><svg key={`${condition}-${run}`} viewBox="0 0 850 390" className={`falsify-svg condition-${condition}`}><rect width="850" height="390" className="scene-ground"/>{condition===5?<><g className="trained-city"><text x="165" y="42" textAnchor="middle">熟悉城市 · 训练任务</text><path d="M45 180 C105 80 200 245 285 90"/><g className="human-test"><circle cx="65" cy="180" r="9"/><animateMotion dur="2s" path="M45 180 C105 80 200 245 285 90" fill="freeze"/></g><g className="ai-test"><rect x="-8" y="-8" width="16" height="16"/><animateMotion dur="2s" path="M45 195 C110 95 205 260 285 105" fill="freeze"/></g><text x="165" y="270" textAnchor="middle">人类 ✓　AI ✓</text></g><path className="transfer-bridge" d="M315 175 H500"/><text x="408" y="155" textAnchor="middle">迁移相同原则</text><g className="novel-city"><text x="670" y="42" textAnchor="middle">陌生城市 · 结构相关新任务</text><path d="M530 180 C600 65 705 240 810 85"/><path className="blocked-route" d="M530 195 C610 95 690 175 695 150"/><g className="human-test"><circle cx="540" cy="180" r="9"/><animateMotion dur="2.5s" begin="2.1s" path="M530 180 C600 65 705 240 810 85" fill="freeze"/></g><g className="ai-test failed"><rect x="-8" y="-8" width="16" height="16"/><animateMotion dur="1.8s" begin="2.1s" path="M530 195 C610 95 690 175 695 150" fill="freeze"/></g><g className="failure-barrier"><rect x="682" y="130" width="50" height="32"/><text x="707" y="151" textAnchor="middle">失败</text></g><text x="670" y="270" textAnchor="middle">人类迁移原则 ✓　AI 只复制表面 ✕</text></g></>:condition===2?<><g className="update-agent"><rect x="95" y="105" width="180" height="115"/><text x="185" y="140" textAnchor="middle">AI 模型</text><path d="M130 175 H240"/><path d="M130 195 H220"/></g><g className="static-worker"><circle cx="665" cy="118" r="20"/><path d="M665 140 V220 M665 160 L625 195 M665 160 L705 195 M665 220 L640 270 M665 220 L690 270"/><text x="665" y="310" textAnchor="middle">人的工作流程始终不变</text></g><path className="one-way-learning" d="M300 170 H570"/><text x="435" y="145" textAnchor="middle">AI 持续学习用户</text><path className="missing-return" d="M570 220 H300"/><text x="435" y="250" textAnchor="middle">没有用户反向适应</text></>:condition===1?<><path className="plateau-axis" d="M90 300 V65 M90 300 H760"/><path className="plateau-line" d="M100 280 C190 105 310 115 420 118 S640 118 745 118"/><g className="data-dots">{[140,220,300,380,460,540,620,700].map((x,i)=><circle key={x} cx={x} cy={i<3?245-i*55:118} r="7" style={{animationDelay:`${i*.2}s`}}/>)}</g><text x="420" y="90" textAnchor="middle">数据继续增加，预测能力长期停滞</text></>:<><g className="generic-failure"><circle cx="220" cy="190" r="80"/><rect x="535" y="110" width="170" height="160"/><path d="M320 190 H500"/><text x="220" y="185" textAnchor="middle">{condition===3?'人类输出':'人类变化'}</text><text x="620" y="185" textAnchor="middle">{condition===3?'AI 输出':'AI 变化'}</text><text x="420" y="235" textAnchor="middle">{condition===3?'评委持续正确区分':'长期没有稳定相关'}</text></g></>}<g className="collapse-chain" transform="translate(55 325)">{['可学习性','BMH','NBIR','功能主义','三个判据','GCE'].map((x,i)=><g key={x} transform={`translate(${i*126} 0)`} className={i===broken?'fracture':i>broken?'collapsed':''}><rect width="105" height="42"/><text x="52" y="26" textAnchor="middle">{x}</text>{i<5?<path d="M106 21 H124"/>:null}</g>)}</g></svg><div className="falsify-conclusion"><strong>{condition===5?'NBIR 在该认知领域断裂':condition===1?'行为可学习性路径失去支持':condition===2?'双向适应判据失败':condition===3?'功能等价判据失败':'因果耦合证据失败'}</strong><span>后续节点失去支撑，不等于所有认知领域都被一并否定。</span>{condition===5?<b>GCE 在该认知领域被证伪</b>:null}</div></div></div>
    <PaperBoundaryNote text="最严格的结论始终限定在被测试的认知领域。失败会打断相应论证路径，不自动证明所有形式的 GCE 都错误。" />
  </div>
}

function FalsificationSceneV5(){
  const [condition,setCondition]=useState(5);const [run,setRun]=useState(0);
  const labels=['数据继续增加，但预测能力停滞','人类从不围绕 AI 改变流程','AI 在新情境中始终可区分','人机变化长期没有因果关系','相关新任务中，AI 无法迁移结构'];
  const breakAt=condition===1?0:condition===5?2:4;
  const chain=['行为可学习','BMH','NBIR','功能主义','三个判据','GCE'];
  const verdict=condition===1?'行为可学习性没有得到支持':condition===2?'双向适应判据失败':condition===3?'功能等价判据失败':condition===4?'个性化因果耦合失败':'NBIR 在这个规划领域断裂';
  return <div className="immersive-scene teaching-scene falsification-v5">
    <Guide step={`${condition} / 5`} action="选择一个可观察的失败条件，再运行实验" watch="失败不是一句红色结论；它必须先产生真实行为后果，再沿论证链切断后续支持" />
    <div className="scene-question-row"><div><span className="overline">证伪机器</span><h3>让理论承担风险：什么具体结果会让 GCE 在一个认知领域失败？</h3></div></div>
    <div className="falsify-layout"><div className="falsify-selector">{labels.map((x,i)=><button key={x} className={condition===i+1?'active':''} onClick={()=>{setCondition(i+1);setRun(v=>v+1)}}><span>条件 {i+1}</span><b>{x}</b></button>)}</div>
      <div className="falsify-lab"><div className="falsify-toolbar"><div><small>当前实验</small><strong>{labels[condition-1]}</strong></div><button onClick={()=>setRun(v=>v+1)}>重新运行完整动画</button></div>
        <svg key={`${condition}-${run}`} viewBox="0 0 900 480" className={`falsify-svg condition-${condition}`} role="img" aria-label="证伪条件产生行为后果并切断 GCE 论证链的动画">
          <rect width="900" height="480" className="scene-ground"/>
          {condition===5?<>
            <g className="test-panel trained" transform="translate(25 35)"><rect width="400" height="285" rx="10"/><text className="panel-title" x="20" y="30">第一幕 · 熟悉任务</text><text x="20" y="54">训练城市：沿熟悉主路到达医院</text><path className="test-road" d="M45 225 C115 80 260 245 355 68"/><g className="test-car human-car"><path d="M-15 -7 H15 V8 H-15Z M-9 -7 L-3 -15 H8 L13 -7"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/><animateMotion dur="2.4s" path="M45 225 C115 80 260 245 355 68" fill="freeze"/></g><g className="test-car ai-car"><path d="M-15 -7 H15 V8 H-15Z M-9 -7 L-3 -15 H8 L13 -7"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/><animateMotion dur="2.4s" begin=".18s" path="M45 241 C115 96 260 261 355 84" fill="freeze"/></g><text className="pass-label" x="200" y="270" textAnchor="middle">人类到达 ✓　AI 到达 ✓</text></g>
            <g className="transfer-rule"><path d="M430 175 H470"/><text x="450" y="153" textAnchor="middle">迁移同一原则</text></g>
            <g className="test-panel novel" transform="translate(475 35)"><rect width="400" height="285" rx="10"/><text className="panel-title" x="20" y="30">第二幕 · 结构相关的新任务</text><text x="20" y="54">陌生城市：主路封闭，仍应坚持“安全优先”</text><path className="test-road" d="M45 225 C115 75 270 235 355 68"/><path className="detour-road" d="M45 225 C85 270 270 270 355 68"/><g className="novel-barrier" transform="translate(223 143)"><rect x="-35" y="-15" width="70" height="30" rx="3"/><text y="5" textAnchor="middle">主路封闭</text></g><g className="test-car human-car"><path d="M-15 -7 H15 V8 H-15Z M-9 -7 L-3 -15 H8 L13 -7"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/><animateMotion dur="2.8s" begin="2.65s" path="M45 225 C85 270 270 270 355 68" fill="freeze"/></g><g className="test-car ai-car crash"><path d="M-15 -7 H15 V8 H-15Z M-9 -7 L-3 -15 H8 L13 -7"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/><animateMotion dur="1.6s" begin="2.65s" path="M45 241 C110 105 185 192 218 151" fill="freeze"/></g><g className="impact" transform="translate(223 143)"><path d="M0 -34 V-20 M0 20 V34 M-34 0 H-20 M20 0 H34 M-25 -25 L-15 -15 M25 -25 L15 -15"/></g><text className="fail-label" x="200" y="270" textAnchor="middle">人类绕行并迁移原则 ✓　AI 撞上旧路线 ✕</text></g>
          </>:condition===1?<><g className="plateau-demo"><path className="plateau-axis" d="M90 300 V60 M90 300 H810"/><path className="plateau-line" d="M105 278 C200 105 335 108 445 112 S670 112 795 112"/><text x="450" y="82" textAnchor="middle">新增数据不断进入，但预测表现不再提高</text>{[145,230,315,400,485,570,655,740].map((x,i)=><circle key={x} cx={x} cy={i<4?260-i*47:112} r="7" style={{animationDelay:`${i*.2}s`}}/>)}</g></>:condition===2?<><g className="adaptation-failure"><g className="ai-model-box"><rect x="80" y="95" width="220" height="130" rx="8"/><text x="190" y="135" textAnchor="middle">AI 每周更新</text><path d="M120 170 H260 M120 195 H235"/></g><path className="one-way-learning" d="M320 155 H570"/><text x="445" y="135" textAnchor="middle">只发生 AI → 用户模型</text><g className="walking-routine" transform="translate(695 160)"><circle cy="-30" r="12"/><path d="M0 -16 V35 M0 0 L-27 19 M0 0 L27 19 M0 35 L-20 68 M0 35 L20 68"/><text x="0" y="105" textAnchor="middle">人的工作流程始终不变</text></g><path className="missing-return" d="M570 235 H320"/><text x="445" y="263" textAnchor="middle">没有用户 → AI 的组织性反向适应</text></g></>:<><g className="observable-failure"><g className="human-output"><rect x="80" y="100" width="235" height="145" rx="10"/><text x="197" y="150" textAnchor="middle">{condition===3?'人类在新任务中的行为':'人类状态变化'}</text><path d="M125 190 C165 150 215 225 270 175"/></g><path className="comparison-wire" d="M330 175 H570"/><g className="ai-output"><rect x="585" y="100" width="235" height="145" rx="10"/><text x="702" y="150" textAnchor="middle">{condition===3?'AI 在新任务中的行为':'AI 状态变化'}</text><path d="M625 205 C670 230 720 130 780 195"/></g><text className="fail-label" x="450" y="295" textAnchor="middle">{condition===3?'盲评者持续能够可靠区分二者':'主动改变 AI 后，人类后续行为没有稳定变化'}</text></g></>}
          <g className="collapse-chain-v5" transform="translate(45 382)">{chain.map((x,i)=><g key={x} transform={`translate(${i*143} 0)`} className={i===breakAt?'fracture':i>breakAt?'collapsed':''}><rect width="118" height="54" rx="5"/><text x="59" y="32" textAnchor="middle">{x}</text>{i<5?<path d="M119 27 H140"/>:null}</g>)}</g>
        </svg>
        <div className="falsify-conclusion"><strong>{verdict}</strong><span>上面的行为后果先出现，下面的论证节点才随后断裂；不是先画红线再宣布失败。</span>{condition===5?<b>GCE 在该认知领域被证伪</b>:<b>该条件使 GCE 的相应支持路径失败</b>}</div>
      </div></div>
    <PaperBoundaryNote text="结论只限于被测试的认知领域。规划领域的一次失败，不自动证明所有认知功能中的 GCE 都错误。" />
  </div>
}

export function InteractiveScene({chapterId}:{chapterId:string}){
  if(chapterId==='chap-3')return <NBIRScene/>;if(chapterId==='chap-6')return <EquivalenceScene/>;if(chapterId==='chap-7')return <CausalScene/>;if(chapterId==='chap-8')return <GradualScene/>;return <FalsificationSceneV5/>
}
