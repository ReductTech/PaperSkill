import {useState} from 'react';
import {ThoughtBanner,Robot,Gallery,TargetArt,GlassBarrier,PanelTitle,V} from './visual-kit';
import {Range,useTween} from './museum-cover';
export function StageSwitchCritique(){
 const [distance,setDistance]=useState(20),[closed,setClosed]=useState(true),[observed,setObserved]=useState(false),[action,setAction]=useState<'global'|'local'>('global');
 const final=action==='local'&&observed;const rx=useTween(final?605:135,750),ry=useTween(final?235:260,750);const size=150-distance*3;
 const room=(proposal:boolean)=><Gallery width={720} height={340} label={proposal?'模型调用切换技能的教学方案':'目标可见但切换条件尚不明确'}>
  <TargetArt x={610-size/2} y={45} w={size} h={size}/>
  <path d="M150 180L610 90" stroke={V.blue} strokeWidth="3" strokeDasharray="9 7" opacity=".6"/>
  <text x="25" y="35" fontSize="28" fill={V.blue}>目标可见 · 距离 {distance} m</text>
  {closed&&<GlassBarrier x={340} y={122} w={150} h={116}/>}
  {proposal?<>
   {observed&&<path d={closed?'M135 260L290 285H540L605 235':'M135 260L605 235'} fill="none" stroke={V.green} strokeWidth="8" strokeDasharray="16 10"/>}
   {!observed&&<ellipse cx="605" cy="235" rx="72" ry="34" fill="#ef8a3f22" stroke={V.orange} strokeWidth="4" strokeDasharray="10 7"/>}
   {observed&&<g><ellipse cx="605" cy="235" rx="32" ry="12" fill="none" stroke={V.green} strokeWidth="4"/><path d="M190 176L340 140M190 176L480 236" stroke={V.blue} strokeWidth="3" strokeDasharray="8 6"/></g>}
   <Robot x={rx} y={ry} scale={.82} color={final?V.green:V.blue}/>
   <text x="25" y="320" fontSize="28" fill={observed?V.green:V.orange}>{observed?(final?'已请求局部定位；规划仍可绕开围挡':'补观测后：可继续寻路，也可请求切换'):'定位与通路未核对：先别把可见当成充分条件'}</text>
  </>:<>
   <path d="M135 260L605 235" fill="none" stroke={V.orange} strokeWidth="7" strokeDasharray="16 10"/>
   <Robot x={135} y={260} scale={.82}/><text x="25" y="74" fontSize="28" fill={V.muted}>虚线只是待核对方向，不是论文控制轨迹</text>
   <text x="375" y="283" fontSize="44" fill={V.orange}>?</text>
   <text x="25" y="320" fontSize="28" fill={V.ink}>看见画作，不等于已经说明怎样可靠抵达</text>
  </>}
 </Gallery>;
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
  <ThoughtBanner kind="critique" quote="比起通过算法去强制自动转化，让模型自主决策会更好些"/>
  <div style={{display:'grid',gridTemplateColumns:'720px 720px',gap:32}}>
   <div><div style={{height:50}}><PanelTitle kind="paper">论文：目标高度匹配后转局部</PanelTitle></div>{room(false)}</div>
   <div><div style={{height:50}}><PanelTitle kind="idea">我的方案：让切换成为可调用技能</PanelTitle></div>{room(true)}</div>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'360px 1fr 1fr 1fr 1fr',gap:18,alignItems:'center'}}>
   <Range label="远处就看见目标" value={distance} min={8} max={24} onChange={v=>{setDistance(v);setObserved(false)}} unit="m"/>
   <button onClick={()=>{setClosed(v=>!v);setObserved(false)}} aria-pressed={closed}>{closed?'玻璃围挡关闭':'玻璃围挡打开'}</button>
   <button onClick={()=>setObserved(true)} aria-pressed={observed}>先补充观测</button>
   <button onClick={()=>setAction('global')} aria-pressed={action==='global'}>继续全局寻路</button>
   <button onClick={()=>setAction('local')} aria-pressed={action==='local'}>请求切换技能</button>
  </div>
 </div>;
}
