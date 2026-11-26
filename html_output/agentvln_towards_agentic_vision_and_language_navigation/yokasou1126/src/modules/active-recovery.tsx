import { useState } from 'react';
import { Person, Painting, useTween } from './museum-cover';
type Action='none'|'left'|'right'|'forward';
export function ActiveRecovery(){
 const [action,setAction]=useState<Action>('none'); const angle=useTween(action==='left'?-50:action==='right'?50:0,650); const step=useTween(action==='forward'?70:0,650); const found=action==='left';
 const controls:[Action,string][]=[['left','左转观察'],['forward','继续前进'],['right','右转观察']];
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'390px 214px',gap:18}}>
  <div style={{display:'grid',gridTemplateColumns:'450px 450px 524px',gap:24}}>
   <div style={{background:'#f6f1e8',borderRadius:22,position:'relative'}}>
    <svg viewBox="0 0 450 390" width="450" height="390" role="img" aria-label="展厅俯视图，视野被拐角遮挡">
     <rect x="30" y="55" width="390" height="300" rx="20" fill="#e6dfd1"/>
     <rect x="210" y="55" width="42" height="210" rx="5" fill="#b7a98f"/>
     <rect x="65" y="55" width="100" height="25" rx="4" fill="#27446e"/>
     <path d="M150 300 L240 150 L340 300 Z" fill="#c43f5214"/>
     <Person x={175+step*.3} y={330-step} scale={.75}/>
     <text x="28" y="36" fontSize="28" fill="#68778f">先前：没有匹配提示</text>
     <text x="30" y="375" fontSize="28" fill="#27446e">屏风后的蓝色画作</text>
    </svg>
   </div>
   <div style={{background:'#edf1ef',borderRadius:22,position:'relative'}}>
    <svg viewBox="0 0 450 390" width="450" height="390" role="img" aria-label={found?'左转后目标方向进入视野':'当前视野仍未获得目标方向'}>
     <text x="28" y="36" fontSize="28" fill="#68778f">当前：{action==='none'?'尚未调整':action==='left'?'向左观察':action==='right'?'向右观察':'向前移动'}</text>
     <path d="M0 270 L130 210 H320 L450 270 V390 H0" fill="#d9d0c2"/>
     <Painting x={145} y={100} w={120} h={130}/>
     <rect x={Math.max(50,Math.min(225,105-angle*2.4))} y="65" width="220" height="230" rx="8" fill="#b8aa91" stroke="#a5967c" strokeWidth="5"/>
     {found&&<g><ellipse cx="110" cy="300" rx="31" ry="15" fill="#228d5c"/><path d="M110 286 V235" stroke="#228d5c" strokeWidth="5"/><text x="90" y="345" fontSize="28" fill="#228d5c">可行提示恢复</text></g>}
     {!found&&<text x="65" y="345" fontSize="28" fill="#c43f52">仍无指令相关提示</text>}
    </svg>
   </div>
   <div style={{padding:'28px 28px',display:'flex',flexDirection:'column',gap:18}}>
    <h3 style={{fontSize:34,margin:0,color:found?'#228d5c':'#27446e'}}>{found?'恢复长程规划技能':'先做细粒度探索'}</h3>
    <p style={{fontSize:28,lineHeight:1.5,margin:0}}>{found?'换个视角以后，蓝画方向的提示出现了。大模型现在有了可选的目标，再把对应三维点交给规划技能。':'但是，如果连一个与指令相关的可行提示都没有，硬走可能越走越偏。所以先结合历史，用小动作换个视角。'}</p>
    <p style={{fontSize:28,color:'#68778f',margin:0}}>例子里左转能看见目标；换个房间，答案未必相同。</p>
   </div>
  </div>
  <div style={{padding:'4px 24px',display:'flex',flexDirection:'column',gap:20}}>
   <div style={{display:'flex',gap:22}}>{controls.map(([key,title])=><button key={key} onClick={()=>setAction(key)} aria-pressed={action===key} style={{fontSize:28,border:'2px solid '+(action===key?'#27446e':'#d7deea'),background:action===key?'#e5edf4':'white',color:'#27446e',borderRadius:14,padding:'12px 30px',cursor:'pointer'}}>{title}</button>)}</div>
   <div className="av-feedback" aria-live="polite" style={{fontSize:28,lineHeight:1.5,color:found?'#228d5c':action==='none'?'#27446e':'#c43f52'}}>{found?'左转补充了有效观测：提示恢复后，回到“感知—规划”的技能交替。':action==='forward'?'前进没有解决遮挡，仍缺少目标方向的可行提示。':action==='right'?'右转后仍看不到相关提示；换个观察方向。':'先选择一个小动作，观察能否恢复目标方向的几何提示。'}</div>
  </div>
 </div>;
}
