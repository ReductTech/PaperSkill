import { useState } from 'react';
import { Room, Person, Painting, useTween } from './museum-cover';
const choices=[{name:'雕塑',x:260,world:'(−1, 3, 0)'},{name:'蓝色画作',x:760,world:'(1, 4, 0)'},{name:'红色画作',x:1190,world:'(2, 5, 0)'}];
export function WaypointChoice(){
 const [selected,setSelected]=useState(0); const walked=useTween(choices[selected].x,900); const good=selected===1;
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'440px 164px',gap:18}}>
  <div style={{borderRadius:24,background:'#f5f1e8',position:'relative'}}>
   <Room width={1472} height={440}>
    <rect x="230" y="210" width="70" height="70" fill="#c3bcae"/>
    <path d="M241 207 Q215 125 267 103 Q312 153 282 207 Z" fill="#9aab9b" stroke="#76906a" strokeWidth="5"/>
    <Painting x={690} y={65} w={140} h={160}/>
    <Painting x={1120} y={65} w={140} h={160} color="#c43f52"/>
    <rect x="455" y="286" width="185" height="34" rx="7" fill="#b28b62"/><path d="M475 320 V365 M620 320 V365" stroke="#92400e" strokeWidth="8"/>
    <path d={`M90 390 Q480 390 ${choices[selected].x} 335`} stroke={good?'#228d5c':'#c43f52'} strokeWidth="8" fill="none" strokeDasharray="16 12"/>
    {choices.map((choice,i)=><g key={choice.name} role="button" tabIndex={0} aria-label={`选择候选提示${i+1}，${choice.name}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}} style={{cursor:'pointer'}}>
      <circle cx={choice.x} cy="335" r="37" fill={selected===i?(good?'#228d5c':'#c43f52'):'#27446e'} stroke="white" strokeWidth="6"/>
      <text x={choice.x} y="346" fontSize="34" fill="white" textAnchor="middle">{i+1}</text>
      <text x={choice.x} y="405" fontSize="28" fill="#27446e" textAnchor="middle">{choice.name}</text>
    </g>)}
    <Person x={walked-68} y={376} scale={.64} color={good?'#228d5c':'#c43f52'}/>
    <text x="32" y="44" fontSize="28" fill="#27446e">指令：经过长椅，走向蓝色画作</text>
   </Room>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'540px 1fr',gap:44,padding:'10px 26px'}}>
   <div><strong style={{fontSize:34,color:good?'#228d5c':'#c43f52'}}>选择提示 {selected+1} → {choices[selected].name}</strong><p style={{fontSize:28,margin:'10px 0',color:'#68778f'}}>三维路点 {choices[selected].world} m · 教学示例</p></div>
   <div className="av-feedback" aria-live="polite" style={{fontSize:28,lineHeight:1.5,color:good?'#228d5c':'#c43f52'}}>{good?'选对蓝画了。大模型把该提示绑定的三维点交给规划技能，让后者去算路、控制机器人。':'这个点虽然能走，但指令要的是蓝画。问题出在语义选择，不是要把相机几何再算一遍。'}</div>
  </div>
 </div>;
}
