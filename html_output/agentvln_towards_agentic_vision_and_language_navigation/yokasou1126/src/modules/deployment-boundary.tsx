import React,{useState} from 'react';
import {ThoughtBanner,Robot,TargetArt,V} from './visual-kit';
import {authorQuotes} from '../authorQuotes';
export function DeploymentBoundary(){
 const [mode,setMode]=useState<'indoor'|'outdoor'|'stairs'>('indoor');const stairs=mode==='stairs';const outdoor=mode==='outdoor';
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 388px 102px',gap:10}}>
 <ThoughtBanner kind="critique" quote={authorQuotes.gap}/>
 <div style={{display:'grid',gridTemplateColumns:'704px 748px',gap:20}}>
 <figure style={{margin:0,display:'grid',gridTemplateRows:'44px 300px 44px',background:'#f2f1e9',borderRadius:16}}>
 <figcaption style={{fontSize:34,fontWeight:750,paddingLeft:18,lineHeight:1.2,color:V.blue}}>论文已经展示：{stairs?'室内与室外实机':outdoor?'室外四足机器人':'室内四足机器人'}</figcaption>
 <img src={stairs?'./images/paper-realworld-full.png':outdoor?'./images/paper-outdoor.png':'./images/paper-indoor.png'} alt={stairs?'论文图4原图：室内和室外真实四足机器人导航':outdoor?'论文图4室外庭院的Go2机器人照片裁剪':'论文图4室内房间中Go2机器人的照片裁剪'} style={{width:704,height:300,objectFit:'contain',background:'white'}}/>
 <div style={{fontSize:28,paddingLeft:18,color:V.muted,lineHeight:1.5}}>英文原文 Fig.4 裁剪 · 非生成照片</div>
 </figure>
 <div style={{background:stairs?'#fcf0df':'#edf2ed',borderRadius:16,display:'grid',gridTemplateRows:'44px 300px 44px'}}>
 <div style={{fontSize:34,fontWeight:750,paddingLeft:18,lineHeight:1.2,color:stairs?'#a66323':V.green}}>{stairs?'我的追问：能不能跨楼层？':'从照片看清：大脑之外还有什么？'}</div>
 <svg width="748" height="300" viewBox="0 0 748 300" role="img" aria-label={stairs?'待验证设想：同一机器人跨越楼层需要楼层定位和楼梯技能':'教学重画：四足机器人、RGB-D相机、建图定位及计算设备'}>
 <path d="M0 246H748V300H0Z" fill="#ded9c9"/>
 {stairs?<><path d="M330 247H415V200H490V150H565V100H645V50H748V300H330Z" fill="#c9bd9f" stroke="#9c8f77" strokeWidth="4"/><path d="M128 246H379L451 198L526 149L605 98L690 48" fill="none" stroke={V.orange} strokeWidth="6" strokeDasharray="12 10"/><Robot x={155} y={247} color={V.orange}/><text x="30" y="54" fontSize="28" fill={V.ink}>楼层定位？楼梯通行？失败恢复？</text><rect x="335" y="70" width="203" height="48" rx="10" fill="#fff9ef"/><text x="353" y="104" fontSize="28" fill="#a66323">都需要专门验证</text><text x="42" y="288" fontSize="28" fill="#a66323">主文未提供系统跨楼层评测</text></>:<>
 <path d="M277 150L532 87L532 205Z" fill="#89b9b72d" stroke="#8cb4ae" strokeWidth="2"/>
 <Robot x={246} y={239} scale={1.35} color={V.blue}/>
 <rect x="36" y="24" width="208" height="58" rx="13" fill="white" stroke={V.blue} strokeWidth="2"/><text x="140" y="63" textAnchor="middle" fontSize="28" fill={V.blue}>D455 · RGB-D</text><path d="M170 82L280 133" stroke={V.blue} strokeWidth="3"/>
 <rect x="406" y="18" width="292" height="58" rx="13" fill="white" stroke={V.green} strokeWidth="2"/><text x="552" y="57" textAnchor="middle" fontSize="28" fill={V.green}>RTAB-Map · 建图定位</text>
 <rect x="461" y="121" width="236" height="58" rx="13" fill="white" stroke={V.blue} strokeWidth="2"/><text x="579" y="160" textAnchor="middle" fontSize="28" fill={V.blue}>Jetson · 端侧计算</text><path d="M460 150L280 180" stroke={V.blue} strokeWidth="3"/>
 <TargetArt x={574} y={198} w={48} h={57}/><text x="31" y="287" fontSize="28" fill={V.muted}>重画示意 · 非实测路线 / 非设备位置图</text></>}
 </svg>
 <div style={{fontSize:28,paddingLeft:18,lineHeight:1.5,color:stairs?'#a66323':V.ink}}>{stairs?'我的设想，尚未证明；不能拿室外照片当跨楼层证据。':'3B 指大脑规模；整机仍需感知与规划计算。'}</div>
 </div>
 </div>
 <div style={{display:'grid',gridTemplateRows:'58px 34px',gap:10}}>
 <div style={{display:'flex',gap:14}}>{([['indoor','看室内实机'],['outdoor','看室外实机'],['stairs','画出我想补的跨楼层验证']] as const).map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>setMode(id)} style={{background:mode===id?'#e3ece7':'white',padding:'6px 18px',borderColor:mode===id?V.green:V.line}}>{label}</button>)}</div>
 <div style={{fontSize:28,color:V.muted,lineHeight:1.2}}>原文有室外展示；大区域与跨楼层的可靠性、端到端延迟，仍需另外测。</div>
 </div>
 </div>;
}
