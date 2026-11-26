import {useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {ThoughtBanner,Robot,TargetArt,PanelTitle,V} from './visual-kit';
import {Range,useTween} from './museum-cover';
const candidates=[{id:'A',x:-1,z:3,mx:230,my:150},{id:'B',x:.8,z:4,mx:464,my:100},{id:'C',x:1.5,z:3,mx:555,my:150}];
export function WaypointCritique(){
 const [view,setView]=useState<'generation'|'deviation'>('deviation'),[task,setTask]=useState<'global'|'local'>('global'),[pred,setPred]=useState({x:430,y:260});const image=useRef<SVGSVGElement|null>(null);
 const imageCandidates=[{id:'A',x:210,y:238},{id:'B',x:385,y:225},{id:'C',x:575,y:205}];const near=imageCandidates.map(p=>({...p,d:Math.hypot(pred.x-p.x,pred.y-p.y)})).sort((a,b)=>a.d-b.d)[0];const drag=(e:PointerEvent<SVGGElement>)=>{if(!e.isPrimary||(e.type!=='pointerdown'&&!e.currentTarget.hasPointerCapture(e.pointerId)))return;if(e.type==='pointerdown')e.currentTarget.setPointerCapture(e.pointerId);const box=image.current!.getBoundingClientRect();setPred({x:Math.max(65,Math.min(655,(e.clientX-box.left)*720/box.width)),y:Math.max(155,Math.min(285,(e.clientY-box.top)*340/box.height))});};
 const [filtered,setFiltered]=useState(false),[selected,setSelected]=useState(2),[focal,setFocal]=useState(400);const active=candidates[selected];const u=320+focal*active.x/active.z;const projected=useTween(40+u,350);
 const choose=(i:number)=>{if(!(filtered&&i===2))setSelected(i)};
 const apply=()=>{setFiltered(v=>!v);if(!filtered&&selected===2)setSelected(1)};
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
  <ThoughtBanner kind="critique" quote={view==='generation'?'到底是通过什么算法去实现候选航点的生成的':'模型选择的航点与候选航点之间有时是会存在比较明显的偏差的'}/>
  {view==='generation'?<div style={{display:'grid',gridTemplateColumns:'720px 720px',gap:32}}>
   <div><div style={{height:50}}><PanelTitle kind="doubt">我的质疑：哪些候选真的能走？</PanelTitle></div>
    <svg width="720" height="340" viewBox="0 0 720 340" role="group" aria-label="候选覆盖和围挡内不可达点的平面教学图" style={{background:'#f4f0e5',borderRadius:18}}>
     <rect x="30" y="53" width="650" height="260" rx="14" fill="#e7decb" stroke="#b8ad97" strokeWidth="4"/>
     {[100,170,240,310,380,450,520,590].flatMap(x=>[85,140,195,250].map(y=><circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#bcbaa6"/>))}
     <text x="22" y="33" fontSize="28" fill={V.ink}>俯视示意：地图中的路点与拐角</text>
     <path d="M490 74V252H660" fill="none" stroke="#8a8e88" strokeWidth="14" strokeLinejoin="round"/>
     <path d="M490 74H660V252" fill="none" stroke="#77a2b0" strokeWidth="7"/>
     <path d="M495 84L642 234M540 84L650 198" stroke="#eff7f5" strokeWidth="5"/>
     <text x="520" y="225" fontSize="28" fill={V.muted}>玻璃围挡</text>
     <path d={`M360 290L${active.mx} ${active.my}`} stroke={filtered?V.green:V.orange} strokeWidth="6" strokeDasharray="12 9"/>
     <Robot x={360} y={296} scale={.64}/>
     {candidates.map((p,i)=><g key={p.id} role="button" tabIndex={0} aria-label={`选择候选${p.id}`} aria-disabled={filtered&&i===2} onClick={()=>choose(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(i)}}} style={{cursor:filtered&&i===2?'not-allowed':'pointer'}}>
      <circle cx={p.mx} cy={p.my} r="35" fill="#ffffff99" stroke={selected===i?V.blue:'transparent'} strokeWidth="4"/>
      <circle cx={p.mx} cy={p.my} r="25" fill={filtered&&i===2?'#f2d5d3':filtered?V.green:V.orange}/>
      <text x={p.mx} y={p.my+9} textAnchor="middle" fontSize="28" fill={filtered&&i===2?V.red:'white'}>{p.id}</text>
      {filtered&&i===2&&<path d={`M${p.mx-28} ${p.my-28}L${p.mx+28} ${p.my+28}M${p.mx+28} ${p.my-28}L${p.mx-28} ${p.my+28}`} stroke={V.red} strokeWidth="5"/>}
     </g>)}
     <text x="35" y="327" fontSize="28" fill={filtered?V.green:V.orange}>{filtered?'示例校验：围挡内 C 被剔除':'未筛选：点出现在地图上，不等于可执行'}</text>
    </svg>
   </div>
   <div><div style={{height:50}}><PanelTitle kind="idea">我的方案：校验后，再投给模型选</PanelTitle></div>
    <svg width="720" height="340" viewBox="0 0 720 340" role="group" aria-label={`候选投影到相机，当前${active.id}的像素u为${u.toFixed(1)}`} style={{background:'#eef1e9',borderRadius:18}}>
     <path d="M0 230L180 165H540L720 230V340H0Z" fill="#dcd1bd"/>
     <TargetArt x={560} y={40} w={80} h={108}/>
     <path d="M40 196H680M360 42V285" stroke="#aebdc6" strokeWidth="2" strokeDasharray="8 7"/>
     <text x="24" y="34" fontSize="28" fill={V.blue}>论文：三维路点投影成图像提示</text>
     {candidates.map((p,i)=>{const px=40+320+focal*p.x/p.z;return <g key={p.id} opacity={filtered&&i===2?.2:1}>
      <circle cx={px} cy="235" r="25" fill={filtered&&i===2?V.red:filtered?V.green:V.orange}/>{filtered&&i===2&&<path d={`M${px-22} 213L${px+22} 257M${px+22} 213L${px-22} 257`} stroke={V.red} strokeWidth="5"/>}<text x={px} y="244" textAnchor="middle" fontSize="28" fill="white">{p.id}</text>
     </g>})}
     <circle cx={projected} cy="235" r="36" fill="none" stroke={V.blue} strokeWidth="5"/>
     <text x="30" y="300" fontSize="28" fill={V.ink}>选 {active.id}：X={active.x} m，Z={active.z} m，u={u.toFixed(1)} px</text>
     <text x="30" y="332" fontSize="28" fill={V.muted}>筛选是我的教学方案，不是论文公布的算法</text>
    </svg>
   </div>
  </div>
  :<div style={{display:'grid',gridTemplateColumns:'720px 720px',gap:32}}>
   <div><div style={{height:50}}><PanelTitle kind="paper">先看原图：选中，还是新预测？</PanelTitle></div>
    <div style={{height:340,display:'grid',gridTemplateColumns:'344px 344px',gridTemplateRows:'258px 37px 35px',columnGap:32,rowGap:5}}>
     <img src="./images/paper-global-candidates.png" alt="论文图3全局候选选择一帧，红圈与绿色提示" style={{width:344,height:258,objectFit:'contain',borderRadius:12}}/>
     <img src="./images/paper-local-target.png" alt="论文图3局部目标预测一帧，红圈可能是新的目标像素" style={{width:344,height:258,objectFit:'contain',borderRadius:12}}/>
     <div style={{fontSize:28,lineHeight:1.2,color:V.blue}}>全局：候选选择</div><div style={{fontSize:28,lineHeight:1.2,color:V.blue}}>局部：目标预测</div>
     <div style={{gridColumn:'1/-1',fontSize:28,lineHeight:1.2,color:V.ink}}>图 3 红圈含 selected OR predicted，不能混判。</div>
    </div>
   </div>
   <div><div style={{height:50}}><PanelTitle kind="idea">我的方案：执行前核对选点约束</PanelTitle></div>
    <svg ref={image} width="720" height="340" viewBox="0 0 720 340" role="group" aria-label="拖动预测点，按全局或局部任务解释候选偏差" style={{background:'#f3f0e8',borderRadius:18}}>
     <path d="M0 228L180 155H540L720 228V340H0Z" fill="#ded3c0"/><TargetArt x={535} y={56} w={94} h={112}/><Robot x={85} y={277} scale={.6}/>
     <text x="24" y="34" fontSize="28" fill={V.blue}>拖动橙圈，看选点偏差如何变化</text>
     {imageCandidates.map(p=><g key={p.id} opacity={task==='global'?1:.35}><circle cx={p.x} cy={p.y} r="23" fill={V.green}/><text x={p.x} y={p.y+9} textAnchor="middle" fill="white" fontSize="28">{p.id}</text></g>)}
     {task==='global'?<><path d={`M${pred.x} ${pred.y}L${near.x} ${near.y}`} fill="none" stroke={V.orange} strokeWidth="4" strokeDasharray="9 6"/><circle cx={near.x} cy={near.y} r="34" fill="none" stroke={V.blue} strokeWidth="4"/></>:<path d={`M100 272L${pred.x} ${pred.y}`} stroke={V.blue} strokeWidth="4" strokeDasharray="12 8"/>}
     <g role="slider" tabIndex={0} aria-label="预测点横向位置" aria-valuemin={65} aria-valuemax={655} aria-valuenow={Math.round(pred.x)} onPointerDown={drag} onPointerMove={drag} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();setPred(p=>({x:Math.max(65,Math.min(655,p.x+(e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0))),y:Math.max(155,Math.min(285,p.y+(e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0)))}))}}} style={{cursor:'grab'}}>
      <circle cx={pred.x} cy={pred.y} r="31" fill="#fff9ee" stroke={V.orange} strokeWidth="6"/><path d={`M${pred.x-16} ${pred.y}h32M${pred.x} ${pred.y-16}v32`} stroke={V.orange} strokeWidth="4"/>
     </g>
     <text x="24" y="331" fontSize="28" fill={V.muted}>最近像素点，也未必语义正确或实际可达。</text>
    </svg>
   </div>
  </div>}
  <div style={{display:'grid',gridTemplateColumns:'320px 330px 1fr',gap:25,alignItems:'center'}}>
   <div style={{display:'flex',gap:12}}><button onClick={()=>setView('generation')} aria-pressed={view==='generation'} style={{flex:1,padding:'12px 10px'}}>生成候选</button><button onClick={()=>setView('deviation')} aria-pressed={view==='deviation'} style={{flex:1,padding:'12px 10px'}}>选点偏差</button></div>
   {view==='generation'?<Range label="相机焦距 fₓ" value={focal} min={250} max={600} step={10} onChange={setFocal} unit="px"/>:<div style={{display:'flex',gap:12}}><button onClick={()=>setTask('global')} aria-pressed={task==='global'} style={{flex:1,padding:'12px 10px'}}>全局选择</button><button onClick={()=>setTask('local')} aria-pressed={task==='local'} style={{flex:1,padding:'12px 10px'}}>局部目标</button></div>}
   <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:18,alignItems:'center'}}>
    {view==='generation'?<button onClick={apply} aria-pressed={filtered}>{filtered?'撤回可达性校验':'试用可达性校验'}</button>:<button onClick={()=>setPred({x:near.x,y:near.y})}>回吸候选（设想）</button>}
    <div aria-live="polite" style={{fontSize:28,lineHeight:1.3,color:V.ink}}>{view==='generation'?<><div>{filtered?'3 个候选 → 2 个':'点 A/B/C 看对应投影'}</div><div style={{color:V.muted}}>筛选规则为教学设想</div></>:<><div style={{fontSize:34,color:V.orange}}>偏差 {near.d.toFixed(1)} px</div><div>{task==='global'?'全局选择：应核对候选约束':'局部预测：新目标未必是错'}</div></>}</div>
   </div>
  </div>
 </div>;
}
