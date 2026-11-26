import {useState} from 'react';
import {ThoughtBanner,Robot,Gallery,TargetArt} from './visual-kit';
import {Range,Hint,useTween} from './museum-cover';
const blue='#27446e',green='#228d5c',red='#c43f52',orange='#ef8a3f',ink='#21324a';
function MeasuredBars(){return <svg width="544" height="390" viewBox="0 0 544 390" role="img" aria-label="固定论文表3：SR65.6到67.2，SPL63.4到64.7，不随教学控制变化" style={{background:'#f6f8fa',borderRadius:18,fontSize:28,fontFamily:'inherit'}}>
 <text x="20" y="43" fontSize="34" fontWeight="750" fill={blue}>表 3：固定实测结果</text>
 {[['SR',65.6,67.2,104],['SPL',63.4,64.7,231]].map(([metric,a,b,y])=><g key={String(metric)}><text x="20" y={Number(y)-12} fontSize="34" fill={ink}>{metric}</text><text x="20" y={Number(y)+26} fill={ink}>加入前</text><text x="20" y={Number(y)+69} fill={ink}>加入后</text><rect x="130" y={Number(y)+2} width={Number(a)*3.4} height="28" rx="4" fill={blue}/><rect x="130" y={Number(y)+45} width={Number(b)*3.4} height="28" rx="4" fill={green}/><text x={144+Number(a)*3.4} y={Number(y)+25} fill={blue}>{a}</text><text x={144+Number(b)*3.4} y={Number(y)+68} fill={green}>{b}</text><text x="432" y={Number(y)+46} fontSize="34" fill={green}>+{metric==='SR'?'1.6':'1.3'}</text></g>)}
 <path d="M130 315H470" stroke="#c7ced2" strokeWidth="2"/>{[0,50,100].map(v=><text key={v} x={130+v*3.4} y="344" textAnchor="middle" fill="#68778f">{v}{v===100?'%':''}</text>)}<text x="20" y="380" fill="#68778f">增量为百分点；p 未报告。</text>
 </svg>;}
export function QDMarginalCritique(){const[pct,setPct]=useState(20),[scope,setScope]=useState<'local'|'global'>('local');const extent=useTween(scope==='global'?1:0);const n=pct/5;
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'112px 390px 100px',gap:10}}>
 <ThoughtBanner kind="critique" quote="这个查询驱动的信息增量获取功能应该可以很好地解决单目尺度歧义的问题啊，为什么几乎没什么改善？"/>
 <div style={{display:'grid',gridTemplateColumns:'900px 544px',gap:28}}>
 <Gallery width={900} height={390} label="导航全程与查询覆盖的教学示意">
  <TargetArt x={756} y={72} w={88} h={105}/>
  <path d="M268 73H401V235H350V120H268Z" fill="#c3bdac" stroke="#a59c88" strokeWidth="4"/>
  <path d="M88 277L220 277L220 157L469 157L469 277L788 277" fill="none" stroke="#b9aa90" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M88 277L220 277L220 157L469 157L469 277L788 277" fill="none" stroke={scope==='global'?green:blue} strokeWidth="6" strokeDasharray="15 11"/>
  <Robot x={96} y={277} scale={.8}/>
  <ellipse cx="781" cy="274" rx="93" ry="36" fill="#228d5c20" stroke={green} strokeWidth="4"/>
  <path d="M738 244L779 173L819 244" fill="#228d5c18" stroke={green} strokeWidth="3"/>
  <text x="650" y="318" fill={green} fontSize="28">终点附近查询深度</text>
  <g opacity={1-extent}><circle cx="224" cy="157" r="30" fill="#fff5ef" stroke={red} strokeWidth="4"/><text x="224" y="169" textAnchor="middle" fontSize="34" fill={red}>?</text><text x="36" y="52" fontSize="28" fill={red}>早期拐角能不能通行？还不知道。</text></g>
  <g opacity={extent}><path d="M170 240L220 157L290 188Z" fill="#ef8a3f25" stroke={orange} strokeWidth="3"/><circle cx="224" cy="157" r="30" fill="#fff6e4" stroke={orange} strokeWidth="4"/><path d="M210 157L220 169L240 144" stroke={orange} strokeWidth="5" fill="none"/><text x="26" y="52" fontSize="28" fill="#ad641e">我的设想：在拐角就补问，再继续走。</text></g>
  <text x="26" y="352" fontSize="28" fill={ink}>教学假设：20 个任务中，{n} 个触发查询</text>
  {Array.from({length:20},(_,i)=><g key={i} transform={`translate(${28+i*42} 365)`}><rect width="34" height="18" rx="3" fill={i<n?orange:'#dce0df'}/><path d="M8 4H26M8 9H20" stroke={i<n?'#fff7e8':'#a8b1b5'} strokeWidth="2"/></g>)}
 </Gallery><MeasuredBars/>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'426px 596px 418px',gap:16,alignItems:'center'}}>
  <div style={{padding:'0 8px'}}><Range label="假设触发率 p" value={pct} min={5} max={100} step={5} unit="%" onChange={setPct}/></div>
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,height:88}}><button onClick={()=>setScope('local')} aria-pressed={scope==='local'} style={{borderColor:scope==='local'?green:undefined,padding:'6px 10px',lineHeight:1.2,height:88}}>局部查询<br/>论文机制示意</button><button onClick={()=>setScope('global')} aria-pressed={scope==='global'} style={{borderColor:scope==='global'?orange:undefined,padding:'6px 10px',lineHeight:1.2,height:88}}>全程按需查询<br/>我的设想，待验证</button></div>
  <div style={{fontSize:28,lineHeight:1.3,color:ink}}>条件算例：未触发任务不变<br/><Hint meaning="此处假定同一总体与固定触发子集，且未触发任务不受影响；p是教学设定，论文未报告，不能据此反推实际子集增益。">1.6 ÷ {pct}% = {(1.6/(pct/100)).toFixed(1)} 个百分点</Hint></div>
 </div>
 </div>;}
