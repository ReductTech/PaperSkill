import { useState } from 'react';
import { Robot, TargetArt, ThoughtBanner, V } from './visual-kit';
const studies=[
 {name:'切换时机',change:'加入定位和通行检查',measure:'测切换、定位、SR / SPL'},
 {name:'候选航点',change:'补候选覆盖和可达校验',measure:'测覆盖、可达率、SR / SPL'},
 {name:'全局主动查询',change:'找路时按信息缺口查询',measure:'测查询质量、触发率、耗时'}
];
export function ResearchProtocol(){
 const [study,setStudy]=useState(0),[extra,setExtra]=useState(false);const chosen=studies[study];
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
 <ThoughtBanner kind="proposal" quote="那么我们是不是也可以在这里做一些改进呢？"/>
 <svg width="1472" height="390" viewBox="0 0 1472 390" role="img" aria-label={`研究对照设计教学示例：比较${chosen.name}。${extra?'提案加装额外传感器，输入预算不再一致':'同一场景、同一机器人、同一RGB-D输入，只改变一个机制'}。性能提升仍待测量。`}>
 {[0,1].map(i=>{const idea=i===1,col=idea?V.green:V.blue;return <g key={i} transform={`translate(${i*746} 0)`}>
 <rect width="726" height="390" rx="20" fill={idea&&extra?'#fbece6':idea?'#ecf2e8':'#edf0f3'}/>
 <text x="22" y="42" fontSize="34" fontWeight="750" fill={col}>{idea?'提案：'+chosen.change:'对照：先复现论文原设置'}</text>
 <text x="22" y="80" fontSize="28" fill={extra&&idea?V.red:V.muted}>{idea&&extra?'换了传感器，比较就混入硬件差异':'同一机器人 + 同一 RGB-D + 同一任务'}</text>
 <path d="M28 110H697V325H28ZM420 112V245M420 290V325" fill="#f7f3e8" stroke="#a89b84" strokeWidth="7"/>
 <path d="M28 275H697M28 220H420M160 110V325M290 110V325M550 110V325" stroke="#ddd4c4" strokeWidth="2" fill="none"/>
 <TargetArt x={604} y={132} w={48} h={64}/>
 <text x="568" y="234" fontSize="28" fill={V.ink}>同一个目标</text>
 {study===0?<>
 <path d={idea?'M143 292H365V268H470L590 230':'M143 292L376 246'} stroke={col} strokeWidth="6" fill="none" strokeDasharray="12 8"/>
 <path d="M150 232L612 168" stroke="#bd9755" strokeWidth="3" strokeDasharray="6 9"/>
 <circle cx={idea?465:376} cy={idea?268:246} r="15" fill={idea?'#d2ebd6':'#e4d0cc'} stroke={idea?V.green:V.red} strokeWidth="3"/>
 {idea?<><circle cx="460" cy="267" r="34" fill="none" stroke={V.orange} strokeWidth="4"/><text x="215" y="164" fontSize="28" fill={V.green}>在这里先验证能否通行</text></>:<text x="200" y="164" fontSize="28" fill={V.blue}>记录：什么时候转入局部？</text>}
 </>:study===1?<>
 <path d="M144 292H370L448 268L583 236" fill="none" stroke={col} strokeWidth="5" strokeDasharray="12 8"/>
 {(idea?[[240,292],[340,292],[390,270],[454,268],[533,244]]:[[240,292],[340,292]]).map(([x,y])=><circle key={x} cx={x} cy={y} r="13" fill={col} stroke="white" strokeWidth="3"/>)}
 <circle cx="422" cy="217" r="13" fill={idea?'#e5d3cc':V.blue} stroke={idea?V.red:'white'} strokeWidth="3"/>
 {idea&&<path d="M408 203L436 231M436 203L408 231" stroke={V.red} strokeWidth="5"/>}
 <text x="205" y="164" fontSize="28" fill={col}>{idea?'补拐角候选，剔除撞墙点':'记录：候选覆盖了哪些通路？'}</text>
 </>:<>
 <path d="M142 292H365V268H475L590 233" fill="none" stroke={col} strokeWidth="5" strokeDasharray="12 8"/>
 <path d="M145 257L360 178L420 250Z" fill={idea?'#edb76d66':'#cad3d755'} stroke={idea?V.orange:'#b0bec5'} strokeWidth="3" strokeDasharray={idea?undefined:'8 7'}/>
 <rect x="337" y="188" width="51" height="45" rx="4" fill={idea?'#b8a388':'#dedacf'} stroke="#a89b84" strokeWidth="3"/>
 <text x="343" y="220" fontSize="28" fill={idea?V.ink:V.muted}>{idea?'障碍':'?'}</text>
 <text x="205" y="153" fontSize="28" fill={col}>{idea?'拐弯之前，多查一次缺失信息':'记录：查询发生在哪一段？'}</text>
 </>}
 <Robot x={112} y={310} scale={.68} color={col}/>
 {extra&&idea&&<g><path d="M101 250V232" stroke={V.orange} strokeWidth="5"/><ellipse cx="102" cy="229" rx="23" ry="9" fill={V.orange}/><path d="M79 229V242Q102 252 125 242V229" fill="#edaa65" stroke={V.orange} strokeWidth="2"/><path d="M135 234L195 199" stroke={V.red} strokeWidth="3"/><text x="202" y="204" fontSize="28" fill={V.red}>额外传感器</text></g>}
 <text x="22" y="367" fontSize="28" fill={idea&&extra?V.red:V.ink}>{idea?(extra?'此时不能只把差异归因于新机制':'只改机制；成功率、耗时都要实测'):'教学示意，路线不代表论文真实失败轨迹'}</text>
 </g>})}
 </svg>
 <div style={{display:'grid',gridTemplateColumns:'650px 350px 1fr',gap:14,alignItems:'center',padding:'10px 16px',background:'#f4efe4',borderRadius:16}}>
 <div style={{display:'flex',gap:10}}>{studies.map((s,i)=><button key={s.name} onClick={()=>setStudy(i)} aria-pressed={study===i} style={{background:study===i?'#dfeadc':'white',borderColor:study===i?V.green:V.line,padding:'12px 14px'}}>{s.name}</button>)}</div>
 <button onClick={()=>setExtra(v=>!v)} aria-pressed={extra} style={{color:extra?V.red:V.blue}}>{extra?'拆下额外传感器':'给提案多装一个传感器'}</button>
 <div aria-live="polite" style={{fontSize:28,lineHeight:1.3,color:extra?V.red:V.muted}}><strong style={{color:extra?V.red:V.green}}>{extra?'对照不公平':'性能提升：待测'}</strong><br/>{extra?'硬件预算也要一致':chosen.measure.replace('要测：','测：')}</div>
 </div></div>;
}
