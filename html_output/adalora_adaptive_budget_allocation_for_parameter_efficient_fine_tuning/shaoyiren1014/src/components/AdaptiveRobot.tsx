import {robotDisplayAllocation} from '../data/robotSimulation';
import {motion} from 'framer-motion';
import {robotParts} from '../data/robotStory';
import type {RobotState} from '../store/robotStore';
export default function AdaptiveRobot({state:s,reduced}:{state:RobotState;reduced:boolean}){
 const active=s.act,part=(i:number)=>s.chapters[i].completed||(i===active&&[s.awake,s.tuning==='lora',s.chapters[2].operated,s.paused,s.sensor==='history',s.times.length===4][i]===true),awake=s.awake||s.chapters[0].completed;
 const inspecting=(i:number)=>active===7&&((s.preview==='structure'||s.preview==='orthogonal')&&i===3||s.preview==='score'&&i===4||s.preview==='time'&&i===5);const color=(i:number)=>part(i)&&!inspecting(i)?'#c7ab7c':'#5b5142';const muted=(i:number)=>part(i)&&!inspecting(i)?1:.35;
 return <figure className="ada-blueprint" data-source-type="conceptual_simulation"><div className="ada-drawing-label"><span>ADA / 阿达</span><span>装配蓝图</span></div><svg viewBox="0 0 430 500" role="img" aria-label={`阿达的装配蓝图，已装配 ${robotParts.filter((_,i)=>part(i)).length} 个部件`}>
 <defs><linearGradient id="ada-brass" x1="0" x2="1"><stop stopColor="#594a31"/><stop offset=".5" stopColor="#d0b587"/><stop offset="1" stopColor="#705936"/></linearGradient></defs>
 <path d="M35 453H395M215 37V460" stroke="#494034" strokeDasharray="3 8"/>
 <motion.g animate={{opacity:awake?1:.8}} transition={{duration:reduced?0:.5}}>
 <path d="M206 74V49h18v25" stroke="#c7ab7c" fill="none"/><circle cx="215" cy="41" r="7" fill={awake?'#8ab7ac':'#514637'}/>
 <rect x="122" y="78" width="186" height="142" rx="24" fill="#211e18" stroke="url(#ada-brass)" strokeWidth="3"/>
 <path d="M137 114h156" stroke="#594f3f"/><rect x="138" y="126" width="154" height="44" rx="12" fill="#14130f" stroke="#594f3f"/>
 <motion.g animate={{opacity:awake?1:.4}}><path d="M157 150h35m46 0h35" stroke={awake?'#8ab7ac':'#c7ab7c'} strokeWidth="5" strokeLinecap="round"/></motion.g>
 <path d="M195 190h40" stroke="#c7ab7c" strokeWidth="2"/><path d="M177 220v15m76-15v15" stroke="#8c7651" strokeWidth="8"/>
 <path d="M112 268H88v100h21M318 268h24v100h-21" fill="none" stroke="#8c7651" strokeWidth="12" strokeLinejoin="round"/><circle cx="90" cy="369" r="12" fill="#211e18" stroke="#c7ab7c"/>
 <circle cx="340" cy="369" r="12" fill="#211e18" stroke="#c7ab7c"/>
 <path d="M164 394v42h-27v17h58v-59m71 0v42h27v17h-58v-59" fill="#211e18" stroke="#8c7651" strokeWidth="3"/>
 <path d="M134 235h162l24 24v122l-24 20H134l-24-20V259z" fill="#211e18" stroke="url(#ada-brass)" strokeWidth="3"/>
 </motion.g>
 <g opacity={muted(1)}><rect x="137" y="96" width="69" height="18" fill="none" stroke="#c7ab7c"/><text x="146" y="109">{active===1&&s.tuning==='full'?'原权重可训练':'冻结机械脑'}</text><path d="M211 104h33v8h38" fill="none" stroke={color(1)} strokeWidth="2"/><circle cx="249" cy="105" r="5" fill={color(1)}/></g>
 <g opacity={muted(2)}><text x="136" y="263">调节通道 · 容量示意</text>{robotDisplayAllocation(s).map((v,i)=><g key={i}><path d={`M${140+i*38} 280v33`} stroke="#544a3d" strokeWidth="12"/>{Array.from({length:v},(_,j)=><path key={j} d={`M${134+i*38} ${285+j*3}h12`} stroke={color(2)} strokeWidth="2"/>)}</g>)}</g>
 <g opacity={muted(3)}><path d="M138 334h36m76 0h39" stroke="#c7ab7c"/><text x="138" y="330">Q</text><text x="278" y="330">P</text><circle cx="214" cy="334" r="17" fill="#171512" stroke={color(3)} strokeWidth="2"/><motion.path d="M214 334v-12" stroke={s.strengthOn?color(3):'#827562'} strokeWidth="3" animate={{rotate:s.strengthOn?45:-60}} style={{transformOrigin:'214px 334px'}} transition={{duration:reduced?0:.4}}/><text x="207" y="360">Λ</text></g>
 <g opacity={muted(4)}><path d="M137 370h54" stroke="#8ab7ac" strokeWidth="2"/><circle cx="155" cy="371" r="4" fill={s.sensor==='history'?'#8ab7ac':color(4)}/><text x="137" y="390">巡检记忆</text></g>
 <g opacity={muted(5)}><path d="M241 373h46m-43 3v-13m14 13v-10m14 10v-6m12 6v-6" stroke={color(5)} strokeWidth="2"/><text x="239" y="390">预算调度</text></g>
 <path d="M119 182H46m73 119H34m287 32h74" stroke="#594f3f"/><text x="20" y="172">保留旧知识</text><text x="9" y="291">小型更新</text><text x="337" y="322">贡献可调</text>
 </svg><figcaption>装配进度 · 每件装置对应一个适配机制</figcaption><div className="ada-parts">{robotParts.map((p,i)=><span key={p} className={part(i)?'installed':''}>{part(i)?'●':'○'} {p}</span>)}</div></figure>;
}
