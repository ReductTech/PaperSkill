import {motion} from 'framer-motion';
import Icon from './Icon';
import {budgetAt,maskAt,schedulePolicies,schedulePhase,phaseNames,directionIds} from '../data/budgetSchedule';
import type {useTower} from '../store/towerStore';
export default function BudgetTimeline({state:s,dispatch:d,reduced}:ReturnType<typeof useTower>&{reduced:boolean}){
  const budget=budgetAt(s.policy,s.time),mask=maskAt(s.policy,s.time),phase=schedulePhase(s.time);
  const xy=(value:number,radius:number)=>{const a=(-200+value/24*220)*Math.PI/180;return [200+radius*Math.cos(a),200+radius*Math.sin(a)];};
  const needle=xy(budget,115);
  const graphPoints=Array.from({length:12},(_,t)=>`${40+t*50},${175-budgetAt(s.policy,t)/24*140}`).join(' ');
  return <>
    <div className="score-methods" role="group" aria-label="预算削减策略">{schedulePolicies.map(p=><button key={p.id} className="secondary-button" aria-pressed={s.policy===p.id} onClick={()=>d({type:'policy',value:p.id})}>{p.label}{s.visited.includes(p.id)&&<Icon name="check" size={13}/>}</button>)}</div>
    <div className="tower-console">
      <div className="budget-gauge"><p className="eyebrow">GLOBAL DIRECTION BUDGET</p><svg viewBox="0 0 400 285" role="img" aria-label={`全局有效方向预算 ${budget}，最终目标 16，初始 24`}>
        <path d="M54.34 253.01A155 155 0 1 1 345.66 253.01" fill="none" stroke="var(--line)" strokeWidth="3"/>
        {Array.from({length:25},(_,n)=>{const a=xy(n,145),b=xy(n,n%8===0?127:137);return <line key={n} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={n===16?'var(--teal)':'var(--brass)'} strokeWidth={n%8===0?2:1}/>;})}
        {[0,8,16,24].map(n=>{const p=xy(n,175);return <text key={n} x={p[0]} y={p[1]+7} textAnchor="middle" fill={n===16?'var(--teal)':'var(--muted)'} fontSize="20">{n}</text>;})}
        <motion.line x1="200" y1="200" animate={{x2:needle[0],y2:needle[1]}} stroke="var(--brass)" strokeWidth="3" transition={{duration:reduced?0:.65,ease:'easeInOut'}}/>
        <circle cx="200" cy="200" r="8" fill="var(--bg)" stroke="var(--brass)" strokeWidth="2"/>
      </svg><div className="gauge-readout"><strong>{budget}</strong><span>当前可保留方向</span></div><p className="gauge-target">最终目标 <strong>16</strong> · 初始可用 24</p></div>
      <div className="direction-manifold"><p className="eyebrow">当前集合 / 教学位置 A–D</p>{['A','B','C','D'].map((group,i)=><div className="manifold-row" key={group}><span>位置 {group}</span><div aria-label={`${group} 位置保留 ${mask.filter(id=>id[0]===group).length} 条`}>{directionIds.slice(i*6,i*6+6).map(id=><motion.span key={id} title={id} className={mask.includes(id)?'enabled':''} animate={{opacity:mask.includes(id)?1:.3}} transition={{duration:reduced?0:.4}}><span className="sr-only">{id}：{mask.includes(id)?'保留':'抑制'}</span></motion.span>)}</div></div>)}<p className="inline-note">亮起 {mask.length} / 24 条。暗色表示当前贡献被抑制，方向结构仍在；这里没有计算参数存储。</p><p className="fixed-allocation-note">{s.policy==='staged'&&phase==='final'?<><Icon name="check" size={15}/>集合固定；保留方向仍继续优化。</>:s.policy==='never'?'预算 24 超过最终目标 16，尚未满足要求。':s.policy==='immediate'?'起点就收紧到 16，没有高预算预热阶段。':phase==='warmup'?'先让更多方向工作，积累判断信号。':'随人工优先级选择当前 top-b，集合仍可调整。'}</p></div>
    </div>
    <div className="schedule-phases">{(['warmup','reduction','final'] as const).map((p,i)=><span key={p} className={s.policy==='staged'&&phase===p?'current':''}><small>{String(i+1).padStart(2,'0')}</small>{phaseNames[p]}</span>)}</div>
    <div className="budget-trace"><div className="trace-heading"><span>当前策略的预算走势</span><span>纵轴：方向数 0–24 · 横轴：教学时间 1–12</span></div><svg viewBox="0 0 640 220" role="img" aria-label={`${schedulePolicies.find(p=>p.id===s.policy)?.label}：预算${Array.from({length:12},(_,t)=>budgetAt(s.policy,t)).join('、')}。当前教学点 ${s.time+1}`}>
      {[0,16,24].map(n=><g key={n}><line x1="40" x2="590" y1={175-n/24*140} y2={175-n/24*140} stroke={n===16?'var(--teal)':'var(--line)'} strokeDasharray={n===16?'4 5':undefined}/><text x="28" y={181-n/24*140} textAnchor="end" fill="var(--muted)" fontSize="22">{n}</text></g>)}
      <polyline points={graphPoints} stroke="var(--line)" strokeWidth="3" fill="none"/>
      <polyline points={graphPoints.split(' ').slice(0,s.time+1).join(' ')} stroke="var(--brass)" strokeWidth="3" fill="none"/>
      <motion.circle r="6" fill="var(--teal)" animate={{cx:40+s.time*50,cy:175-budget/24*140}} transition={{duration:reduced?0:.4}}/>
      {[0,2,8,11].map(t=><text key={t} x={40+t*50} y="208" textAnchor="middle" fill="var(--muted)" fontSize="22">{t+1}</text>)}
    </svg><p className="inline-note">虚线为最终目标，浅色路径为本策略的示意安排。仅画预算，不画损失或准确率；整数化可能让部分相邻时间点数量相同。</p></div>
    <div className="signal-toolbar"><span>教学时间 <strong>{s.time+1} / 12</strong></span><div><button className="secondary-button" disabled={s.time===0} onClick={()=>d({type:'time',value:s.time-1})}>上一步</button><button className="primary-button compact" disabled={s.time===11} onClick={()=>d({type:'time',value:s.time+1})}>下一步 <Icon name="arrow" size={16}/></button></div></div>
    <p className="feedback" role="status">{s.policy==='never'?'保留更多方向，却没有达到目标预算。这说明预算约束尚未满足，不说明任务效果更好。':s.policy==='immediate'?'你从起点就减少了探索容量。是否影响实际任务效果，需要另外实验；此处没有测量。':phase==='warmup'?'预热：先积累训练信号，让之后的选择有依据。':phase==='reduction'?'逐步削减：收紧数量，同时依据当前优先级重新选择；预算数相同，集合仍可能变化。':'最后微调：保留集合已经固定，训练仍继续优化参数，不是停止学习。'}<span>切换策略会回到其起点，已看过的三段时间点仍记在学习记录中。</span></p>
    <details className="technical-details"><summary>查看教学设定与当前保留名单</summary><div className="details-content"><p>初始 24、目标 16 只是 1.5 倍预算的例子，不是所有论文实验的固定值。12 个时间点和三段长度由教学设计设定。三次下降是归一化示意，并向上取整，不冒充 Appendix A 的逐步实现。</p><p>当前名单：{mask.join('、')}。所有教学方向在同一个列表中排序，取前 b 条；没有给 A–D 各自规定相同份额。</p><p>人工优先级用固定正弦、余弦函数随方向编号与时间变化，只展示“名单可以变化”；不是上一章评分的实测结果，也没有隐藏的真实重要性标签。三段与立即削减都使用相同人工优先级，在教学点 10–12 沿用点 9 的名单；立即削减只把可保留数量从起点就设为 16，前期名单仍可调整。永不削减保留全部。</p></div></details>
  </>;
}
