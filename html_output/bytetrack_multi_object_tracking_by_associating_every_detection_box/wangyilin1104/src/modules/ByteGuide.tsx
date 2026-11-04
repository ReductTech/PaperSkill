import {useEffect,useId,useState} from 'react';
import type {ReactNode} from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
import type {WidgetProps} from './registry';
import {associate, frameCount, iou, position, predict, simulate} from './model';
import type {Box, Frame, Track} from './model';

const ink='#142941', blue='#2866a0', green='#17805b', orange='#a65013', purple='#7858a0', red='#ad4050';
const baseline=simulate({two:false});
const byte=simulate();
const fixed=(v:number)=>v.toFixed(2);
const foot=(b:Box)=>[b.x+b.w/2,b.y+b.h] as const;

function Person({box,color}:{box:Box;color:string}) {
  return <g transform={`translate(${box.x} ${box.y}) scale(${box.w/61} ${box.h/111})`}>
    <ellipse cx="31" cy="108" rx="24" ry="5" fill={ink} opacity=".17"/>
    <circle cx="31" cy="16" r="11" fill="#dba782"/><path d="M20 9q13-15 22 0" stroke={ink} strokeWidth="5" fill="none"/>
    <path d="M21 34 12 67 M41 34 49 62" stroke="#dba782" strokeWidth="8" strokeLinecap="round"/>
    <path d="M20 32 Q30 27 42 32L45 70H17Z" fill={color}/>
    <path d="M24 69 18 103 M37 69 44 102" stroke={ink} strokeWidth="9" strokeLinecap="round"/>
  </g>;
}
function MotionOverlay({track, frame, box=predict(track,frame)}:{track:Track;frame:number;box?:Box}) {
  const arrowId=useId();
  const [px,py]=foot(box);
  const points=track.points.slice(-3);
  const last=points[points.length-1];
  const [lx,ly]=foot(last);
  return <g aria-label={`ID 1 运动预测，距上次观测 ${frame-track.last} 帧`}>
    <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill={purple}/></marker></defs>
    <polyline points={points.map(p=>`${foot(p)[0]},${foot(p)[1]+17}`).join(' ')} stroke={blue} strokeWidth="4" fill="none"/>
    {points.map(p=><circle key={p.frame} cx={foot(p)[0]} cy={foot(p)[1]+17} r="5" fill={blue} stroke="white" strokeWidth="1.5"/>)}
    <path d={`M${lx} ${ly+17}L${px} ${py+17}`} stroke={purple} strokeWidth="4" strokeDasharray="6 5" markerEnd={`url(#${arrowId})`}/>
    <rect x={box.x-5} y={box.y-5} width={box.w+10} height={box.h+10} rx="4" fill="none" stroke={purple} strokeWidth="4" strokeDasharray="8 5"/>
    <path d={`M${px} ${box.y-7}V${box.y-32}`} stroke={purple} strokeWidth="2" strokeDasharray="4 3"/>
    <text x={px} y={box.y-39} textAnchor="middle" fontSize="24" fontWeight="800" fill={purple} stroke="#f8fbff" strokeWidth="4" paintOrder="stroke">ID 1 预测</text>
  </g>;
}
function MotionLegend() {
  return <div className="bt-legend"><span><i/> 历史观测</span><span><i className="bt-dashed"/> 外推方向与预测框</span><span><i className="bt-detection"/> 当前检测框</span></div>;
}
export function Street({frame,ghosts=false,output=false,raw=true,mini=false,high=.6,prediction}:{frame:Frame;ghosts?:boolean;output?:boolean;raw?:boolean;mini?:boolean;high?:number;prediction?:Box}) {
  const accepted=frame.tracks.filter(t=>t.state==='active');
  const prior=frame.before.find(t=>t.id===1);
  return <svg viewBox="0 0 800 332" className="bt-street" role="img" aria-label={`第${frame.frame+1}帧街景，${frame.input.length}个检测框，${accepted.length}条可见轨迹`}>
    <rect width="800" height="332" fill="#eaf3f9"/>
    <path d="M0 112H800V332H0Z" fill="#edf0e7"/><path d="M0 135H800M0 299H800" stroke="#c7d5c5" strokeWidth="3"/>
    <path d="M0 47H90V112H0ZM101 18H190V112H101ZM203 57H274V112H203ZM638 36H726V112H638ZM740 16H800V112H740Z" fill="#bcd0dd"/>
    <path d="M0 280H800V300H0Z" fill="#d1dcd3"/><path d="M12 290H790" stroke="white" strokeWidth="4" strokeDasharray="26 22"/>
    <Person box={position('A',frame.frame)} color="#d67844"/><Person box={position('B',frame.frame)} color="#537aab"/>
    <g opacity=".86"><rect x="149" y="153" width="108" height="57" rx="10" fill="#a6b8c4"/><rect x="149" y="201" width="108" height="62" rx="8" fill="#a6b8c4" opacity=".48"/><path d="M151 263H255M155 204H250" stroke="#667d91" strokeWidth="3"/></g>
    {output && frame.tracks.map(t=><g key={t.id}>{t.points.map((p,i)=>i>0&&p.frame===t.points[i-1].frame+1?
      <line key={p.frame} x1={foot(t.points[i-1])[0]} y1={foot(t.points[i-1])[1]+12} x2={foot(p)[0]} y2={foot(p)[1]+12} stroke={t.id===1?green:blue} strokeWidth="5"/>:null)}
      {t.points.map(p=><circle key={p.frame} cx={foot(p)[0]} cy={foot(p)[1]+12} r="4" fill={t.id===1?green:blue}/>)}</g>)}
    {ghosts&&prior&&<MotionOverlay track={prior} frame={frame.frame} box={prediction}/>}
    {raw&&frame.input.map(b=>{const matched=frame.matches.find(m=>m.key===b.key);const color=output?(matched?.pass===2?green:accepted.some(t=>t.box===b)?blue:orange):b.score<high?orange:blue;return <g key={b.key}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="none" stroke={color} strokeWidth="3"/>
      {!mini&&<text x={b.x} y={b.y-7} fill={color} fontSize="22" fontWeight="800">{b.key} {fixed(b.score)}{matched&&output?` · ID ${matched.id}`:''}</text>}</g>;})}
    {output&&!raw&&accepted.map(t=><g key={t.id}><rect x={t.box.x} y={t.box.y} width={t.box.w} height={t.box.h} rx="4" fill="none" stroke={t.id===1?green:blue} strokeWidth="4"/><text x={t.box.x} y={t.box.y-8} fill={t.id===1?green:blue} fontWeight="800" fontSize="24">ID {t.id}</text></g>)}
  </svg>;
}
export function Button({active=false,children,onClick}:{active?:boolean;children:ReactNode;onClick:()=>void}) {
  return <button type="button" className={`bt-button ${active?'is-active':''}`} aria-pressed={active} onClick={onClick}>{children}</button>;
}
export function Slider({label,value,min,max,step=1,set}:{label:string;value:number;min:number;max:number;step?:number;set:(v:number)=>void}) {
  return <label className="bt-slider"><span>{label}<strong>{step===1?value:fixed(value)}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(+e.target.value)}/></label>;
}
export function Frames({frame,set,playable=false}:{frame:number;set:(f:number)=>void;playable?:boolean}) {
  const [playing,play]=useState(false);
  useEffect(()=>{if(!playing)return;const t=window.setTimeout(()=>set((frame+1)%frameCount),720);return()=>window.clearTimeout(t);},[playing,frame,set]);
  return <div className="bt-frames">
    {playable&&<Button active={playing} onClick={()=>play(!playing)}>{playing?'暂停':'播放'}</Button>}
    {Array.from({length:frameCount},(_,i)=><Button key={i} active={frame===i} onClick={()=>{play(false);set(i);}}>{i+1}</Button>)}
  </div>;
}
function Panel({children}:{children:ReactNode}) {return <div className="bt-panel">{children}</div>;}
export function Feedback({children}:{children:ReactNode}) {return <div className="bt-feedback" role="status">{children}</div>;}
export function Layout({scene,side,controls,feedback}:{scene:ReactNode;side:ReactNode;controls?:ReactNode;feedback:ReactNode}) {
  return <div className="bt-scene"><div className="bt-row"><div className="bt-visual">{scene}</div><Panel>{side}</Panel></div>{controls}<Feedback>{feedback}</Feedback></div>;
}
export function Cover({moduleId}:WidgetProps) {
  const {progress}=useCoverPlayback();
  const f=Math.min(9,Math.floor(progress*10)), full=moduleId==='newMethod';
  const result=(full?byte:baseline)[f];
  return <div className="bt-cover"><Street frame={result} output ghosts raw={false} mini/><p>{f+1} / 10 帧 · {result.tracks.some(t=>t.id===1&&t.state==='active')?'ID 1 有观测':'ID 1 当前未匹配'}</p></div>;
}
export function DetectionLab() {
  const [f,set]=useState(3),[high,setHigh]=useState(.6);
  const row=simulate({high})[f];
  return <Layout scene={<Street frame={row} high={high}/>} side={<><h3>同一帧，三个分数</h3><Slider label="高分阈值" value={high} min={.2} max={.95} step={.01} set={setHigh}/><div className="bt-box-list">{row.input.map(b=><div key={b.key}><b>{b.key} · {fixed(b.score)}</b><span>{b.score>=high?'高分池':'低分池'}</span></div>)}</div></>} controls={<Frames frame={f} set={set}/>} feedback="调高阈值会让更多检测框进入低分池。遮挡行人的框与背景误检都可能分数偏低。"/>;
}
export function PredictionLab() {
  const [offset,set]=useState(18);
  const row=byte[3], track=row.before.find(t=>t.id===1)!, detection=row.input.find(d=>d.key==='A')!;
  const expected=predict(track,row.frame);
  const predicted={...expected,x:expected.x+offset};
  const overlap=iou(predicted,detection);
  return <Layout scene={<Street frame={row} ghosts prediction={predicted}/>} side={<>
    <h3>从历史位置外推</h3>
    <p>前两次观测：x = {track.points[track.points.length-2]?.x} → {track.box.x}</p>
    <p>每帧向右 {track.vx} px，预计 x = {expected.x}</p>
    <Slider label="额外位置偏差（像素）" value={offset} min={0} max={100} set={set}/>
    <p>虚线框 x = {predicted.x} · IoU <b>{fixed(overlap)}</b></p>
  </>} controls={<MotionLegend/>} feedback={overlap>=.35?'预测框与 A 检测框的交并比达到示意门槛 0.35，可进入候选关联。':'预测偏差让交并比低于 0.35，当前 A 框无法接续这条轨迹。'}/>;
}

export function MatchingLab() {
  const [stage,setStage]=useState<1|2>(1),[gate,setGate]=useState(.35),[pick,setPick]=useState('A');
  const row=byte[3];
  const input=row.input.map(b=>b.key==='A'?{...b,x:b.x+11}:b);
  const highBoxes=input.filter(b=>b.score>=.6), lowBoxes=input.filter(b=>b.score<.6);
  const first=associate(row.before,highBoxes,3,gate);
  const remaining=row.before.filter(t=>t.state==='active'&&!first.some(m=>m.t.id===t.id));
  const second=associate(remaining,lowBoxes,3,gate);
  const pairs=stage===1?first:second;
  const shown=stage===1?first:[...first,...second];
  const visual={...row,input,matches:shown.map(m=>({id:m.t.id,key:m.b.key,overlap:m.overlap,pass:first.includes(m)?1 as const:2 as const})),tracks:shown.map(m=>({...m.t,box:m.b}))};
  const t=row.before.find(t=>t.id===1)!;
  const d=input.find(b=>b.key===pick)!;
  const overlap=iou(predict(t,3),d);
  const pool=stage===1?highBoxes:lowBoxes;
  return <Layout scene={<Street frame={visual} ghosts output/>} side={<><h3>第 {stage} 轮</h3><p>{stage===1?'高分框优先关联。':'剩余活跃轨迹尝试匹配低分框。'}</p><p className="bt-emphasis">{pairs.length?pairs.map(m=>`ID ${m.t.id} ↔ ${m.b.key}`).join(' · '):'本轮没有成功匹配'}</p><div className="bt-pills">{input.map(b=><Button key={b.key} active={pick===b.key} onClick={()=>setPick(b.key)}>{b.key}</Button>)}</div><p>ID 1 与 {pick} 的 IoU {fixed(overlap)} · {pool.some(b=>b.key===pick)?'在本轮框池':'不在本轮框池'}</p></>} controls={<div className="bt-controls"><Button active={stage===1} onClick={()=>setStage(1)}>第一轮</Button><Button active={stage===2} onClick={()=>setStage(2)}>第二轮</Button><Slider label="最低 IoU" value={gate} min={.2} max={.95} step={.01} set={setGate}/></div>} feedback={stage===1?'先处理高分框 B。A 与 C 留在低分池，等待第二轮。':second.length?'A 通过门槛，接续 ID 1。背景框 C 缺少位置吻合的轨迹。':'当前门槛下没有低分框成功匹配。降低门槛后再观察 A。'}/>;

}
export function TimelineLab() {
  const [f,set]=useState(3),[showMotion,setShowMotion]=useState(true);
  const variants=[{title:'只用高分框',data:baseline},{title:'两阶段关联',data:byte}];
  return <div className="bt-scene bt-timeline"><div className="bt-compare">{variants.map(({title,data})=>{
    const row=data[f];
    const a=row.input.find(b=>b.key==='A');
    const match=row.matches.find(m=>m.id===1);
    const active=row.tracks.some(t=>t.id===1&&t.state==='active');
    return <section key={title}><h3>{title}</h3><Street frame={row} output ghosts={showMotion}/>
      <p className="bt-verdict">{match?`ID 1 接续 A · 第 ${match.pass} 轮 · IoU ${fixed(match.overlap)}`:active?'ID 1 从高分框建立':row.before.some(t=>t.id===1)?`A 得分 ${fixed(a!.score)} · 本帧未接续`:'旧 ID 1 已过期'}</p>
      <div className="bt-history" aria-label="ID 1 各帧的观测记录">{data.slice(0,f+1).map((r,i)=><i key={i} className={r.tracks.some(t=>t.id===1&&t.state==='active')?'on':''}>{i+1}</i>)}</div>
    </section>;
  })}</div>
    <MotionLegend/>
    <div className="bt-controls"><Frames frame={f} set={set} playable/><Button active={showMotion} onClick={()=>setShowMotion(!showMotion)}>显示运动预测</Button></div>
    <Feedback>两边接收相同检测框。第 3 至 6 帧，A 虽然分低，却与预测位置吻合。右侧用第二轮关联更新 ID 1，左侧时间轴留下观测缺口。</Feedback></div>;
}

export function BufferLab() {
  const [f,set]=useState(6),[buffer,setBuffer]=useState(4);
  const row=simulate({noBox:true,buffer})[f], a=row.tracks.find(t=>t.id===1);
  return <Layout scene={<Street frame={row} output ghosts/>} side={<><h3>短暂丢失与删除</h3><Slider label="缓冲帧数（示意）" value={buffer} min={0} max={6} set={setBuffer}/><p className="bt-emphasis">{a?(a.state==='lost'?'ID 1 暂存':'ID 1 已匹配'):'ID 1 已移除'}</p><p>{row.before.some(t=>t.id===1)?`距上次观测 ${f-row.before.find(t=>t.id===1)!.last} 帧`:'本帧没有可用的旧预测框'}</p>
    <p>{row.matches.some(m=>m.id===1)?'高分 A 与旧预测框匹配':a?.state==='lost'?'保留预测位置，等待新观测':'观察当前帧是否建立了新 ID'}</p></>} controls={<Frames frame={f} set={set}/>} feedback="第 3 至 6 帧完全没有 A 的检测框。第 7 帧恢复高分检测后，旧 ID 是否接续取决于缓存和位置匹配。"/>;
}
export function FailureLab() {
  const [noBox,setNoBox]=useState(false),[near,setNear]=useState(0);
  const row=simulate({noBox,distractor:near})[2];
  const found=row.matches.find(m=>m.id===1);
  return <Layout scene={<Street frame={row} output ghosts/>} side={<><h3>把低分误检移近</h3><Button active={noBox} onClick={()=>setNoBox(!noBox)}>{noBox?'A 真框缺失':'A 真框存在'}</Button><Slider label="误检向左移动（像素）" value={near} min={0} max={335} set={setNear}/><p className="bt-emphasis">{found?`ID 1 匹配 ${found.key} · IoU ${fixed(found.overlap)}`:'ID 1 未匹配'}</p></>} feedback={found?.key==='C'?'误检框通过位置门槛，错误更新了 ID 1。低分关联依赖运动预测与场景条件。':'尝试移除 A 真框，再把 C 移到虚线预测框附近，观察身份可能怎样被错误延续。'}/>;
}
const metrics=[
  {key:'MOTA',v:80.3,desc:'综合漏检、误检与身份切换的跟踪准确度。'},
  {key:'IDF1',v:77.3,desc:'衡量整段视频中身份对应是否一致。'},
  {key:'HOTA',v:63.1,desc:'同时考虑检测与关联质量。'},
];
export function EvidenceLab() {
  const [m,set]=useState(1);
  return <div className="bt-scene"><div className="bt-evidence"><section><h3>ByteTrack · MOT17 测试集</h3>{metrics.map((x,i)=><button key={x.key} onClick={()=>set(i)} type="button" aria-pressed={m===i} className={`bt-bar ${m===i?'is-active':''}`}><strong>{x.key}</strong><span><i style={{width:`${x.v}%`}}/></span><b>{x.v}</b></button>)}</section><Panel><h3>{metrics[m].key}</h3><p>{metrics[m].desc}</p><p>论文表 4 · 私有检测器协议</p><a href="https://arxiv.org/html/2110.06864#S4.T4" target="_blank" rel="noreferrer">查看论文表 4 ↗</a></Panel></div><Feedback>这三项是完整 ByteTrack 系统的论文实测。要隔离低分关联的贡献，应看控制检测输入的对照实验。</Feedback></div>;
}
export function HandoffLab() {
  const [two,setTwo]=useState(true),[cut,setCut]=useState(6);
  const history=(two?byte:baseline).slice(0,cut).flatMap(r=>r.tracks.filter(t=>t.id===1&&t.state==='active').map(t=>({f:r.frame,y:192-t.box.x*.34})));
  return <Layout scene={<svg className="bt-street" viewBox="0 0 800 332" role="img" aria-label="随所选关联策略更新的历史坐标时间轴">
    <rect width="800" height="332" fill="#eef5f8"/><path d="M73 36V268H739" fill="none" stroke="#8ba0b5" strokeWidth="2"/>
    <text x="88" y="40" fontSize="25" fill={ink}>ID 1 历史位置 · 示意</text><text x="670" y="310" fontSize="25" fill={ink}>帧</text>
    {Array.from({length:9},(_,i)=><g key={i}><path d={`M${98+i*70} 68V268`} stroke="#d0dfe8"/><text x={92+i*70} y="300" fontSize="20" fill={ink}>{i+1}</text></g>)}
    {history.map((p,i)=>i&&history[i-1].f+1===p.f?<line key={p.f} x1={98+history[i-1].f*70} y1={history[i-1].y} x2={98+p.f*70} y2={p.y} stroke={green} strokeWidth="5"/>:null)}
    {history.map(p=><circle key={p.f} cx={98+p.f*70} cy={p.y} r="9" fill={green}/>)}
  </svg>} side={<><h3>交给预测器的历史</h3><p className="bt-emphasis">{history.length} / {cut} 帧有位置</p><Button active={two} onClick={()=>setTwo(!two)}>{two?'两阶段关联':'只用高分框'}</Button><Slider label="观察截止帧" value={cut} min={2} max={9} set={setCut}/></>} feedback="导读只展示跟踪历史如何变化。下一步可固定预测器，比较带缺口与较连续的历史输入。"/>;
}
