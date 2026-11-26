import {useState} from 'react';
import {ThoughtBanner,Robot,Gallery,TargetArt,GlassBarrier} from './visual-kit';
import {useTween} from './museum-cover';
const blue='#27446e',green='#228d5c',red='#c43f52',orange='#ef8a3f';
export function GlobalQueryProposal(){const[known,setKnown]=useState(0),[count,setCount]=useState(0),[last,setLast]=useState(0);const ask=(bit:number)=>{setKnown(v=>v|bit);setCount(n=>n+1);setLast(bit);};const reveal=useTween(known&2?1:0),beam=useTween(known&1?1:0),path=useTween((known&6)===6?1:0);
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
 <ThoughtBanner kind="proposal" quote="如果能通过某种方式更广泛，高效地采集周围环境的各种信息，那么让现在的大模型更好地发挥作用。"/>
 <div style={{display:'grid',gridTemplateColumns:'900px 544px',gap:28}}>
 <Gallery width={900} height={390} label="四足机器人、观察视锥与拐角后面的目标">
  <TargetArt x={740} y={66} w={100} h={118}/>
  <path d={`M178 251L${470+reveal*170} ${70+reveal*60}L${530+reveal*180} ${342-reveal*65}Z`} fill="#27446e12" stroke={blue} strokeWidth="3" strokeDasharray="10 7"/>
  <path d="M375 50L556 80V271L375 235Z" fill="#c7c0af" stroke="#9d9483" strokeWidth="4"/>
  <GlassBarrier x={580} y={185} w={94} h={105}/>
  <g opacity={1-reveal}><rect x="680" y="196" width="194" height="97" rx="12" fill="#e6e5dc"/><text x="704" y="229" fill="#7d8587" fontSize="28">尚未观察</text><text x="704" y="267" fill="#7d8587" fontSize="28">拐角后方</text></g>
  <g opacity={reveal}><path d="M680 254V52H875V254" fill="none" stroke="#9f8a6c" strokeWidth="13"/><path d="M705 252V77H850V252" fill="#ecf3e620" stroke="#d5d7bd" strokeWidth="4"/><text x="650" y="325" fontSize="28" fill={green}>观察到通路入口</text></g>
  <path d={`M185 251L${185+beam*598} ${251-beam*113}`} fill="none" stroke={orange} strokeWidth="5" strokeDasharray="11 8" opacity={beam}/>
  {known&1?<g><rect x="674" y="30" width="193" height="48" rx="10" fill="#fff7e7"/><text x="686" y="64" fontSize="28" fill="#ad641e">轴向深度 6 m</text></g>:null}
  <path d="M175 302L332 302L332 345L713 345L780 275" stroke={green} strokeWidth="7" strokeDasharray="14 9" fill="none" opacity={path}/>
  <Robot x={130} y={302} scale={1.06} color={blue}/>
  <text x="25" y="36" fontSize="28" fill={blue}>先别出发，先针对缺口调用技能。</text>
  <text x="25" y="378" fontSize="28" fill="#68778f">教学示例：查询改变的是信息与候选路线。</text>
 </Gallery>
 <svg width="544" height="390" viewBox="0 0 544 390" role="img" aria-label="同步更新的俯视地图与通路信息" style={{background:'#f5f7f8',borderRadius:18,fontFamily:'inherit',fontSize:28}}>
  <text x="18" y="39" fontSize="34" fontWeight="750" fill={blue}>同一时刻：地图知道了什么</text>
  <rect x="22" y="62" width="500" height="228" rx="16" fill="#e9e3d6" stroke="#b5a98e" strokeWidth="5"/>
  <path d="M270 62V212H394V290" fill="none" stroke="#a69981" strokeWidth="14"/>
  <g opacity={1-reveal}><rect x="282" y="71" width="231" height="132" fill="#d1d5d3"/><text x="317" y="143" fill="#68778f">未观察区域</text></g>
  <g opacity={reveal}><rect x="330" y="85" width="72" height="22" fill="#27446e"/><path d="M394 171V213" stroke="#e9e3d6" strokeWidth="20"/></g>
  <path d="M78 250L215 250L215 230L300 230L300 191L430 191L430 115" fill="none" stroke={green} strokeWidth="7" strokeDasharray="13 8" opacity={path}/>
  {(known&6)===6?<g><circle cx="215" cy="250" r="12" fill={green}/><circle cx="430" cy="191" r="12" fill={green}/><circle cx="430" cy="115" r="12" fill={green}/></g>:null}
  <Robot x={87} y={260} scale={.55} color={blue}/>
  <text x="20" y="329" fill={known&1?orange:'#68778f'}>{known&1?'深度：6 m':'深度：未知'}</text><text x="260" y="329" fill={known&4?green:'#68778f'}>{known&4?'连通：已核验':'连通：待核验'}</text>
  <text x="20" y="375" fill={(known&6)===6?green:blue}>{(known&6)===6?'信息补齐，更新可行候选。':last===1?'知道距离 ≠ 确认能通行。':'先判断缺什么，再决定问什么。'}</text>
 </svg>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'318px 318px 318px 482px',gap:12}}>
  <button aria-pressed={!!(known&1)} onClick={()=>ask(1)} style={{borderColor:known&1?orange:undefined}}>问目标多远<br/>获得轴向深度</button>
  <button aria-pressed={!!(known&2)} onClick={()=>ask(2)} style={{borderColor:known&2?green:undefined}}>补看拐角<br/>揭示未观察区域</button>
  <button aria-pressed={!!(known&4)} onClick={()=>ask(4)} style={{borderColor:known&4?green:undefined}}>核验通路<br/>更新地图与候选</button>
  <div style={{fontSize:28,lineHeight:1.1,padding:'0 8px',display:'flex',flexDirection:'column',justifyContent:'center',color:'#68778f'}}><strong style={{color:blue}}>已查询 {count} 次 · 设想待验证</strong><span>全局已有感知；扩展按需查询，也要计成本。</span></div>
 </div>
 </div>;}
