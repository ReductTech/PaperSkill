import {useState} from 'react';
import {useTween} from './museum-cover';
import {Gallery,Robot,TargetArt,V} from './visual-kit';
export function SystemOverview(){
 const [stage,setStage]=useState(0);const x=useTween(stage===3?665:170,1000);
 const labels=['先拿到图像、深度和位姿','感知技能把三维路点投回图像','大脑按指令选中蓝画方向','规划技能执行，再交回新观察'];
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'478px 134px',gap:10}}>
 <div style={{position:'relative',display:'grid',gridTemplateColumns:'900px 552px',gap:20}}>
 <Gallery width={900} height={478} label="教学重画：同一个机器人从观察到执行的一轮变化">
 <rect x="24" y="19" width="853" height="55" rx="12" fill="#fffdf7"/><text x="44" y="58" fill={V.ink} fontSize="28">指令：经过长椅，走向蓝色画作</text>
 <TargetArt x={616} y={104} w={100} h={116}/><TargetArt x={310} y={113} w={90} h={98} color={V.red}/>
 <path d="M356 325H497V341H356ZM370 341V369M481 341V369" fill="#ac8d64" stroke="#816b50" strokeWidth="6"/>
 {stage<3&&<path d="M190 336L620 153L730 234Z" fill="#98b9d92a" stroke="#90a6bb" strokeWidth="2"/>}
 {stage>=1&&[335,677].map((cx,i)=><g key={cx}><circle cx={cx} cy="351" r="27" fill={stage>=2&&i===1?V.green:V.blue}/><circle cx={cx} cy="351" r={stage>=2&&i===1?39:32} fill="none" stroke={stage>=2&&i===1?V.green:V.blue} strokeWidth="3"/><text x={cx} y="361" textAnchor="middle" fontSize="28" fill="white">{i+1}</text><path d={`M${cx} 316V273`} stroke={V.blue} strokeWidth="3" strokeDasharray="6 5"/></g>)}
 {stage>=2&&<path d="M170 400L290 400L550 390L677 351" fill="none" stroke={V.green} strokeWidth="7" strokeDasharray="14 10"/>}
 <Robot x={x} y={stage===3?375:408} scale={1.18} color={stage===3?V.green:V.blue}/>
 <text x="28" y="458" fill={V.muted} fontSize="28">教学示例 · 图中距离、候选点与路线不是论文实测</text>
 </Gallery>
 <svg width="552" height="478" viewBox="0 0 552 478" role="img" aria-label="技能分工：模型选择，感知准备几何，规划执行">
 <rect width="552" height="478" rx="18" fill="#f4f5f0"/>
 <rect x="46" y="25" width="460" height="95" rx="18" fill={V.blue}/><text x="276" y="66" textAnchor="middle" fontSize="34" fill="white">3B 大脑：理解与调度</text><text x="276" y="104" textAnchor="middle" fontSize="28" fill="#dbe6f0">{stage===2?'我选 ②，方向符合蓝色画作':'不直接输出每一步腿部动作'}</text>
 <path d="M168 120V171M384 120V171" stroke={V.blue} strokeWidth="5"/>
 <rect x="24" y="172" width="242" height="174" rx="16" fill={stage===1?'#dcebec':'white'} stroke={stage===1?V.blue:V.line} strokeWidth={stage===1?5:2}/><text x="145" y="218" textAnchor="middle" fontSize="34" fill={V.blue}>感知技能</text><path d="M67 272L110 246L176 291L220 254" stroke={V.blue} strokeWidth="4" fill="none"/>{[67,110,176,220].map((cx,i)=><circle key={cx} cx={cx} cy={[272,246,291,254][i]} r="8" fill={V.blue}/>)}<text x="145" y="330" textAnchor="middle" fontSize="28" fill={V.ink}>几何与视觉提示</text>
 <rect x="286" y="172" width="242" height="174" rx="16" fill={stage===3?'#e0ecde':'white'} stroke={stage===3?V.green:V.line} strokeWidth={stage===3?5:2}/><text x="407" y="218" textAnchor="middle" fontSize="34" fill={V.green}>规划技能</text><path d="M320 283L369 261L414 288L487 249" stroke={V.green} strokeWidth="6" fill="none" strokeDasharray="10 6"/><circle cx="487" cy="249" r="12" fill={V.green}/><text x="407" y="330" textAnchor="middle" fontSize="28" fill={V.ink}>执行一段动作</text>
 <path d="M407 346V391H145V346" stroke={V.green} strokeWidth="4" fill="none"/><text x="276" y="438" textAnchor="middle" fontSize="28" fill={V.ink}>{stage===0?'输入：RGB-D + 位姿 + 历史':stage===3?'执行以后，把新观察交回大脑':'几何计算和底层执行由技能负责'}</text>
 </svg>
 </div>
 <div style={{display:'grid',gridTemplateRows:'64px 52px',gap:12}}>
 <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>{['① 拿到输入','② 准备几何','③ 按指令选点','④ 执行与反馈'].map((s,i)=><button key={s} onClick={()=>setStage(i)} aria-pressed={stage===i} style={{background:stage===i?'#e0ece2':'white',borderColor:stage===i?V.green:V.line}}>{s}</button>)}</div>
 <div style={{fontSize:34,color:V.blue,fontWeight:700,paddingLeft:10}}>{labels[stage]}。</div>
 </div>
 </div>;
}
