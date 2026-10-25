import {useEffect,useState} from 'react';
import {useVisibleAnimation} from './useVisibleAnimation';
const colors={ink:'#21324a',blue:'#27446e',green:'#228d5c',muted:'#68778f',line:'#d7deea',sage:'#b8c9a7'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function Train({x=0,y=0,open=0,scale=1}:{x?:number;y?:number;open?:number;scale?:number}){
 return <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
  <rect x="0" y="0" width="290" height="115" rx="17" fill="#e8edf1" stroke="#9caebd" strokeWidth="2"/>
  <path d="M2 78H288V96H2Z" fill="#54738f"/>
  {[21,71,200,250].map(v=><rect key={v} x={v} y="20" width="30" height="42" rx="5" fill="#afc8d3"/>)}
  <rect x="113" y="12" width="73" height="87" rx="4" fill="#273a49"/>
  <rect x={114-open*27} y="13" width="35" height="84" rx="2" fill="#cbd7df" stroke="#9caebd"/>
  <rect x={150+open*27} y="13" width="35" height="84" rx="2" fill="#cbd7df" stroke="#9caebd"/>
  <rect x={120-open*27} y="24" width="22" height="36" rx="3" fill="#8caebf"/>
  <rect x={156+open*27} y="24" width="22" height="36" rx="3" fill="#8caebf"/>
  <path d="M0 116H290" stroke="#9ba889" strokeWidth="4"/><path d="M0 124H290" stroke="#c5cfbb" strokeWidth="2"/>
 </g>;
}
export function CoverOverview(){
 const {ref:sceneRef,visible}=useVisibleAnimation<HTMLDivElement>();
 const [elapsed,setElapsed]=useState(0),[playing,setPlaying]=useState(true);
 useEffect(()=>{if(!playing||!visible)return;let id=0,last=performance.now();const tick=(now:number)=>{const delta=Math.min(now-last,80);last=now;if(document.visibilityState==='visible')setElapsed(t=>t+delta);id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,visible]);
 const phase=(elapsed%4000)/4000,step=Math.floor(phase*4),opening=clamp((phase-.5)*4),scan=phase<.25?phase*4:1;
 const labels=['浏览整段视频','选中待看片段','观察车门变化','形成定位答案'];
 return <div ref={sceneRef} className="cover-overview" data-animation="cover-overview">
  <div className="hero-compare">
   <section className="bg-side old">
    <h2 className="bg-side-head">先看全局，发现需要确认的细节</h2>
    <div className="cover-canvas">
     <svg viewBox="0 0 520 320" role="img" aria-label="封面专属动画：浏览站台录像并提出待确认的问题">
      <rect width="520" height="320" rx="12" fill="#f5f8f0"/>
      <text x="27" y="34" fill={colors.muted} fontSize="15">一段站台录像 · 示意</text>
      {[0,30,90].map((t,i)=><g key={t}>
       <rect x={27+i*162} y="56" width="145" height="98" rx="8" fill="#fff" stroke={scan>=i/3?colors.blue:colors.line} strokeWidth={step===0&&Math.floor(scan*3)===i?2.5:1}/>
       <svg x={33+i*162} y="64" width="133" height="64" viewBox="0 0 290 140" overflow="hidden">
        <rect width="290" height="140" fill="#eaf0e3"/><Train x={i===0?-95:i===2?85:0} y={7}/>
       </svg>
       <text x={99+i*162} y="143" textAnchor="middle" fontSize="13" fill={colors.muted}>{t} 秒</text>
      </g>)}
      <path d="M35 179H485" stroke="#dce4d5" strokeWidth="5" strokeLinecap="round"/>
      <path d={'M35 179H'+(35+450*scan)} stroke={colors.blue} strokeWidth="5" strokeLinecap="round"/>
      <circle cx={35+450*scan} cy="179" r="6" fill={colors.blue}/>
      <rect x="27" y="207" width="466" height="80" rx="12" fill="#fff" stroke={colors.line}/>
      <circle cx="62" cy="247" r="19" fill="#eef3fb"/><text x="62" y="254" textAnchor="middle" fill={colors.blue} fontSize="24" fontWeight="700">?</text>
      <text x="98" y="240" fill={colors.ink} fontSize="18" fontWeight="650">车门从什么时候开始打开？</text>
      <text x="98" y="265" fill={colors.muted} fontSize="14">{step===0?'先浏览录像，理解问题':'仅凭概览，还需要确认动作边界'}</text>
     </svg>
    </div>
    <p className="bg-side-tag">从已有画面中提出需要验证的问题。</p>
   </section>
   <section className="bg-side new">
    <h2 className="bg-side-head">再看局部，让证据回到答案中</h2>
    <div className="cover-canvas">
     <svg viewBox="0 0 520 320" role="img" aria-label="封面专属动画：选择视频片段、观察车门并生成定位答案">
      <rect width="520" height="320" rx="12" fill="#f5f8f0"/>
      <text x="27" y="33" fill={colors.muted} fontSize="15">{step===0?'等待确定回看范围':'回看请求：42–66 秒'}</text>
      <rect x="27" y="50" width="466" height="15" rx="7" fill="#dbe4d1"/>
      <rect x="190" y="44" width={step>=1?94:0} height="27" rx="5" fill="#f07e4740" stroke={step>=1?'#f07e47':'none'} strokeWidth="2"/>
      <path d="M237 78V93" stroke={step>=1?'#f07e47':colors.line} strokeWidth="2"/>
      <path d="M231 87L237 94L243 87" stroke={step>=1?'#f07e47':colors.line} strokeWidth="2" fill="none"/>
      <g opacity={step>=1?1:.28}><Train x={115} y={102} open={opening}/></g>
      <rect x="27" y="250" width="466" height="43" rx="8" fill={step===3?'#e4f1e9':'#fff'} stroke={step===3?colors.green:colors.line}/>
      <text x="260" y="277" textAnchor="middle" fill={step===3?colors.green:colors.muted} fontSize="18" fontWeight={step===3?650:500}>{step===0?'按证据需要发起回看':step===1?'取出局部片段，补充视觉输入':step===2?'新画面：车门逐渐打开':'定位答案：52–58 秒，车门打开'}</text>
     </svg>
    </div>
    <p className="bg-side-tag">把新画面加入上下文，再继续判断。</p>
   </section>
  </div>
  <div className="cover-controls"><div className="cover-steps">{labels.map((name,i)=><span key={name} className={step===i?'active':''}><b>{i+1}</b>{name}</span>)}</div><div className="cover-playback"><button onClick={()=>{setElapsed(0);setPlaying(true);}} aria-label="重播封面动画">↻ 重播</button><button onClick={()=>setPlaying(v=>!v)} aria-label={playing?'暂停封面动画':'播放封面动画'}>{playing?'Ⅱ 暂停':'▶ 播放'}</button></div></div>
 </div>;
}
