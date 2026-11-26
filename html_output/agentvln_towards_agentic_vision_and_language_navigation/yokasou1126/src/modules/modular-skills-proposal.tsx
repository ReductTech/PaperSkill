import { useState } from 'react';
import { Robot, TargetArt, ThoughtBanner, V } from './visual-kit';
import { useTween } from './museum-cover';
const modes=[{name:'论文：平层导航',camera:'RGB-D 感知',map:'占据地图',planner:'路径规划',color:V.blue},{name:'设想：换成跨层技能',camera:'楼梯 / 通路识别',map:'跨层定位',planner:'爬楼执行接口',color:V.orange}];
export function ModularSkillsProposal(){
 const [mode,setMode]=useState(0),[ready,setReady]=useState(false);const m=modes[mode],progress=useTween(mode&&ready?1:0,800);
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
 <ThoughtBanner kind="good" quote="这和现在的skill模式非常像，简直就是机器人版本的skill"/>
 <svg width="1472" height="390" viewBox="0 0 1472 390" role="img" aria-label={mode?'我的设想：保持大脑接口，把平层工具换成跨层工具，跨楼层能力仍待实机验证':'论文分工示意：3B大脑通过感知、地图、规划技能控制机器人'}>
 <defs><marker id="skill-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill={V.green}/></marker></defs>
 <rect width="1472" height="390" rx="20" fill="#f5f2e9"/>
 <rect x="25" y="55" width="300" height="280" rx="22" fill="#e7edf1" stroke={V.blue} strokeWidth="3"/>
 <text x="175" y="98" textAnchor="middle" fill={V.blue} fontSize="34" fontWeight="750">理解指令的大脑</text>
 <path d="M109 168Q92 131 130 132Q143 110 167 133Q204 120 213 154Q239 171 210 192Q217 222 182 223Q161 244 141 222Q103 230 110 198Q83 189 109 168Z" fill="#c4d2de" stroke={V.blue} strokeWidth="4"/>
 <path d="M162 139V215M125 158L145 175L130 194M198 155L180 177L200 197" fill="none" stroke={V.blue} strokeWidth="4"/>
 <text x="175" y="270" textAnchor="middle" fontSize="44" fontWeight="750" fill={V.blue}>3B，保持不变</text>
 <text x="175" y="309" textAnchor="middle" fontSize="28" fill={V.muted}>不等于整机只需 3B</text>
 {[m.camera,m.map,m.planner].map((label,i)=><g key={i}>
 <path d={`M325 195H348V${75+i*112}H378`} stroke={V.green} strokeWidth="4" fill="none" markerEnd="url(#skill-arrow)"/>
 <rect x="388" y={25+i*112} width="320" height="98" rx="15" fill="white" stroke={m.color} strokeWidth="3"/>
 {i===0?<g transform={`translate(410 ${49+i*112})`}><rect width="53" height="40" rx="7" fill={m.color}/><circle cx="33" cy="20" r="12" fill="#d8edf1"/><path d="M7 -2L17 -11H36L42 -2" fill={m.color}/></g>:i===1?<g transform={`translate(414 ${43+i*112})`}><path d="M0 0L17 8L34 0L51 8V54L34 46L17 54L0 46Z" fill="#d6e3d8" stroke={m.color} strokeWidth="3"/><path d="M17 8V54M34 0V46" stroke={m.color} strokeWidth="2"/></g>:<path d={`M416 ${83+i*112}V${63+i*112}H437V${43+i*112}H466`} fill="none" stroke={m.color} strokeWidth="7"/>}
 <text x="485" y={67+i*112} fontSize="28" fontWeight="700" fill={V.ink}>{label}</text>
 <text x="485" y={104+i*112} fontSize="28" fill={V.muted}>{mode?'新接口：待验证':i===0?'看环境':i===1?'记位置':'把目标变动作'}</text>
 <path d={`M708 ${75+i*112}H735V195H770`} stroke={m.color} strokeWidth="4" fill="none"/>
 </g>)}
 <rect x="780" y="18" width="668" height="354" rx="18" fill={mode?'#fff0db':'#e9efe5'}/>
 <text x="802" y="59" fontSize="34" fontWeight="700" fill={mode?'#a05c1e':V.green}>{mode?'我的设想：换工具，去更大场景':'论文做得好：模型和技能分工'}</text>
 <path d="M805 318H1424M805 136V318M1424 136V318" fill="none" stroke="#a99e89" strokeWidth="5"/>
 {mode?<><path d="M1035 318H1085V291H1135V264H1185V237H1235V210H1285V183H1420" fill="none" stroke="#bbaa90" strokeWidth="9"/><TargetArt x={1340} y={91} w={49} h={62}/><path d="M935 290H1020L1295 151H1332" fill="none" stroke={ready?V.green:V.red} strokeWidth="5" strokeDasharray="11 9"/><text x="1030" y="350" fontSize="28" fill={ready?V.green:V.red}>{ready?'接口齐了，还得实测':'通行、执行、定位仍待验证'}</text></>:<><TargetArt x={1340} y={153} w={49} h={62}/><path d="M950 293H1335" stroke={V.green} strokeWidth="5" strokeDasharray="12 9"/><text x="1095" y="350" fontSize="28" fill={V.green}>已有室内外实机展示</text></>}
 <Robot x={920+progress*368} y={313-progress*130} scale={.9} color={m.color}/>
 {mode&&ready&&<text x="817" y="108" fontSize="28" fill="#a05c1e">教学动画，不是爬楼实测</text>}
 </svg>
 <div style={{display:'flex',alignItems:'center',gap:18,padding:'12px 20px',borderRadius:16,background:'#edf1ed'}}>
 {modes.map((item,i)=><button key={item.name} aria-pressed={mode===i} onClick={()=>setMode(i)} style={{borderColor:mode===i?m.color:V.line,background:mode===i?'#e0eadf':'white'}}>{item.name}</button>)}
 <button onClick={()=>{setMode(1);setReady(v=>!v)}} aria-pressed={ready}>{ready?'拔下跨层接口':'接上跨层接口'}</button>
 <span style={{fontSize:28,color:mode?'#a05c1e':V.green,marginLeft:'auto'}} aria-live="polite">{mode?'未来潜力：待验证':'我的肯定：模块化分工'}</span>
 </div></div>;
}
