import React, { useEffect, useRef, useState } from 'react';
import { ReusableToolsScene, RequestScene, RepairScene, WorkshopScene } from './VividScenes';
import { lessons, resultSets } from '../data/lesson';
const C={blue:'#27446e',green:'#228d5c',orange:'#f07e47',red:'#c43f52',muted:'#68778f',line:'#d7deea',bg:'#f5f8f0',ink:'#21324a'};
function useTimeline(count:number,duration=3.2){
 const [playing,setPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);const [time,setTime]=useState(0);const clock=useRef(0);
 useEffect(()=>{if(!playing)return;let id=0,last=performance.now(),paint=last;const run=(now:number)=>{clock.current+=Math.min((now-last)/1000,.1);last=now;if(now-paint>40){setTime(clock.current);paint=now;}id=requestAnimationFrame(run)};id=requestAnimationFrame(run);return()=>cancelAnimationFrame(id)},[playing]);
 return {playing,time,step:Math.floor(time/duration)%count,progress:(time%duration)/duration,setPlaying,select:(i:number)=>{clock.current=i*duration;setTime(clock.current);setPlaying(false)},restart:()=>{clock.current=0;setTime(0);setPlaying(true)}};
}
function txt(x:number,y:number,text:string,fill=C.ink,size=20,anchor:'start'|'middle'|'end'='start'){return <text x={x} y={y} fill={fill} fontSize={size} textAnchor={anchor}>{text}</text>}
function Card({x,y,w=190,h=84,title,lines=[],active=false,color=C.blue}:{x:number;y:number;w?:number;h?:number;title:string;lines?:string[];active?:boolean;color?:string}){return <g><rect x={x} y={y} width={w} height={h} rx={13} fill={active?'#edf3f9':'#fff'} stroke={active?color:C.line} strokeWidth={active?3:1.5}/>{txt(x+16,y+29,title,active?color:C.ink,19)}{lines.map((s,i)=><text key={i} x={x+16} y={y+55+i*24} fill={C.muted} fontSize={16} fontFamily="Consolas, 'Microsoft YaHei', monospace">{s}</text>)}</g>}
function Arrow({x1,y1,x2,y2,active=false,color=C.blue}:{x1:number;y1:number;x2:number;y2:number;active?:boolean;color?:string}){return <path d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke={active?color:C.line} strokeWidth={active?3.5:2} markerEnd="url(#arrow)" className={active?'flow-line':''}/>}
function Chair({x,y,color=C.blue,selected=false,scale=1}:{x:number;y:number;color?:string;selected?:boolean;scale?:number}){return <g transform={`translate(${x} ${y}) scale(${scale})`}>{selected&&<rect x={-42} y={-62} width={84} height={100} rx={14} fill="none" stroke={C.orange} strokeWidth={3} className="selection-glow"/>}<rect x={-24} y={-55} width={48} height={30} rx={5} fill={color}/><path d="M-23,-26 L-23,0 M23,-26 L23,0 M-24,4 L-28,33 M24,4 L28,33" stroke={color} strokeWidth={6}/><rect x={-30} y={-6} width={60} height={13} rx={4} fill={color}/></g>}
function TopChair({x,y,color=C.blue,selected=false}:{x:number;y:number;color?:string;selected?:boolean}){return <g transform={`translate(${x} ${y})`}>{selected&&<circle r={38} fill="none" stroke={C.green} strokeWidth={3} className="selection-glow"/>}<rect x={-22} y={-20} width={44} height={40} rx={8} fill={color}/><rect x={-28} y={-31} width={56} height={9} rx={4} fill="#92400e"/><path d="M-29,-15V21 M29,-15V21" stroke={color} strokeWidth={5}/></g>}
function SceneBase({children,label,handlers}:{children:React.ReactNode;label:string;handlers?:React.SVGProps<SVGSVGElement>}){return <svg viewBox="0 0 1120 360" className="teaching-svg" role="img" aria-label={label} {...handlers}><defs><marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C.blue}/></marker></defs><rect width={1120} height={360} rx={18} fill={C.bg}/>{children}</svg>}
function Geometry({depth,step,progress,draggable=false,onDepth}:{depth:number;step:number;progress:number;draggable?:boolean;onDepth?:(n:number)=>void}){
 const dragging=useRef(false);const cx=315+(depth-1)*44;const height=depth;const measuring=draggable||step>=1;const computed=draggable||step>=3;const depthKnown=draggable||step>=2;const update=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();const px=(e.clientX-r.left)*1120/r.width;onDepth?.(Math.max(1,Math.min(6,(px-315)/44+1)))};
 return <SceneBase label={`${measuring?'投影同高120像素':'先确定参照物'}，${depthKnown?`目标深度${depth.toFixed(1)}米`:'目标深度待读取'}，${computed?`估计高度${height.toFixed(1)}米`:'估计高度待计算'}`} handlers={draggable?{onPointerDown:e=>{const r=e.currentTarget.getBoundingClientRect();const px=(e.clientX-r.left)*1120/r.width;const py=(e.clientY-r.top)*360/r.height;if(Math.abs(px-cx)<65&&py>90&&py<260){dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e)}},onPointerMove:e=>{if(dragging.current)update(e)},onPointerUp:()=>{dragging.current=false},onPointerCancel:()=>{dragging.current=false},style:{touchAction:'none',cursor:'grab'}}:undefined}>
  {txt(32,40,draggable?'固定投影，调节深度参数':'相同投影，不同深度',C.blue,23)}<path d="M30 265H620 M660 24V330" stroke={C.line} strokeWidth={2}/>
  <rect x={82} y={127} width={149} height={13} rx={3} fill="#76906a"/><path d="M98 140V247 M216 140V247" stroke="#76906a" strokeWidth={8}/>
  <Chair x={cx} y={202} scale={120/88} selected={draggable||step===2}/>{!draggable&&step===0&&<rect x={71} y={117} width={171} height={140} rx={9} fill="none" stroke={C.orange} strokeWidth={3}/>}{txt(77,295,'桌深 2 m · 高 2 m',C.ink,18)}{txt(cx,295,depthKnown?`椅深 ${depth.toFixed(1)} m`:'椅深：待读取',C.blue,18,'middle')}
  {measuring&&<><path d="M44 127H610 M44 247H610" stroke="#b8c9a7" strokeDasharray="5 5"/>{txt(260,89,'投影均为 120 px',C.muted,19,'middle')}</>}
  {txt(704,40,'按参考尺度估计',C.blue,23)}<path d="M740 275H1070 M750 72V275" stroke={C.line} strokeWidth={2}/>
  {[0,1,2,3,4,5,6].map(v=><g key={v}><path d={`M750 ${275-v*30}H1050`} stroke={C.line}/>{txt(730,281-v*30,String(v),C.muted,15,'end')}</g>)}
  {computed?<><rect x={813} y={275-height*30} width={100} height={height*30} rx={5} fill={C.blue}/>{txt(965,195,`${height.toFixed(1)} m`,C.green,31,'middle')}</>:txt(902,185,step===0?'先确定参照':step===1?'像素尚不足够':'深度信息就绪',C.muted,24,'middle')}
  {txt(705,323,computed?`2 × (120 × ${depth.toFixed(1)}) ÷ (120 × 2)`:'参考高度 2 m · 逐步补齐测量',C.ink,21)}
  {!draggable&&<rect x={32} y={337} width={(300+progress*760)*((step+1)/4)} height={4} rx={2} fill={C.orange}/>}
 </SceneBase>
}
function ToolsScene({step,p}:{step:number;p:number}){const labels=['loc(image, "chair")','get_2D_object_size(...)','depth(image, x, y)','vqa(image, "颜色")','same_object(boxA, boxB)'];const values=['[(390, 170)]','(70, 94) px','4.0 m','蓝色','True'];return <SceneBase label={labels[step]+'返回'+values[step]}>
 {txt(35,39,'从图像读取线索',C.blue,23)}<rect x={32} y={61} width={530} height={260} rx={18} fill="#e9efe3"/><rect x={73} y={162} width={170} height={17} rx={5} fill="#76906a"/><path d="M90 179V282 M225 179V282" stroke="#76906a" strokeWidth={9}/><Chair x={390} y={221} scale={1.3}/>
 {step===0&&<><circle cx={390} cy={170} r={10+8*(1-p)} fill="none" stroke={C.orange} strokeWidth={3}/><path d={`M340 170H${370+40*p} M390 128V${160+60*p}`} stroke={C.orange} strokeWidth={3}/></>}
 {step===1&&<rect x={346} y={142} width={88} height={124} fill="none" stroke={C.orange} strokeWidth={4} strokeDasharray={`${(88+124)*2*p} 500`}/>}
 {step===2&&<><path d={`M286 298H${310+145*p}`} stroke={C.blue} strokeWidth={5}/>{txt(391,113,'4.0 m',C.blue,24,'middle')}</>}
 {step===3&&<circle cx={391} cy={166} r={38+5*p} stroke={C.orange} strokeWidth={4} fill="none"/>}
 {step===4&&<><rect x={346} y={142} width={88} height={124} fill="none" stroke={C.blue} strokeWidth={3}/><rect x={350+10*(1-p)} y={146} width={88} height={124} fill="none" stroke={C.green} strokeWidth={3}/></>}
 <Arrow x1={578} y1={184} x2={629} y2={184} active/><Card x={649} y={77} w={423} h={124} title="本次调用" lines={[labels[step],`返回：${values[step]}`]} active/>
 <Card x={649} y={230} w={423} h={91} title="输出是什么？" lines={[['对象位置列表','二维包围框尺寸','深度估计','对象属性','对象身份判断'][step]]}/></SceneBase>}
function Bars({names,scores,selected=-1,p=1,title,protocol}:{names:string[];scores:number[];selected?:number;p?:number;title:string;protocol:string}){return <SceneBase label={title+' '+protocol+' '+names.map((n,i)=>n+scores[i]+'%').join('，')}>
 {txt(30,36,title,C.blue,23)}{txt(30,64,protocol+' · 得分 %，越高越好',C.muted,18)}
 {[0,25,50,75,100].map(v=><g key={v}><path d={`M${282+v*7} 87V319`} stroke={C.line}/>{txt(282+v*7,342,String(v),C.muted,16,'middle')}</g>)}
 {names.map((n,i)=>{const y=114+i*55;const active=selected<0?n==='VADAR':i===selected;return <g key={n}>{txt(30,y+7,n,active?C.blue:C.ink,19)}<rect x={282} y={y-13} width={scores[i]*7*Math.min(1,p*2)} height={26} rx={5} fill={active?C.green:'#b8c9a7'}/>{txt(290+scores[i]*7,y+7,scores[i].toFixed(1)+'%',active?C.green:C.ink,20)}{i===selected&&<rect x={275} y={y-20} width={scores[i]*7+14} height={40} rx={9} stroke={C.orange} strokeWidth={2} fill="none"/>}</g>})}
 </SceneBase>}
function CountScene({x,exclude,onX,p}:{x:number;exclude:boolean;onX?:(n:number)=>void;p:number}){const dragging=useRef(false);const values=[180,420,540];const correct=values.filter(v=>v>=x).length;const update=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();onX?.(Math.round(Math.min(550,Math.max(130,(e.clientX-r.left)*1120/r.width))))};return <SceneBase label={`参照位置${x}，当前计数${correct+(exclude?0:1)}`} handlers={{onPointerDown:e=>{const r=e.currentTarget.getBoundingClientRect();const px=(e.clientX-r.left)*1120/r.width,py=(e.clientY-r.top)*360/r.height;if(Math.abs(px-x)<50&&Math.abs(py-263)<60){dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e)}},onPointerMove:e=>{if(dragging.current)update(e)},onPointerUp:()=>{dragging.current=false},onPointerCancel:()=>{dragging.current=false},style:{touchAction:'none',cursor:'grab'}}}>
 {txt(30,38,'筛选 x ≥ 参照位置，再排除参照物',C.blue,22)}<rect x={55} y={64} width={575} height={263} rx={15} fill="#fff" stroke={C.line}/><rect x={x} y={67} width={627-x} height={256} fill="#e9f4ec"/><path d={`M${x} 69V322`} stroke={C.orange} strokeWidth={3} strokeDasharray="6 6"/>
 {values.map((v,i)=><TopChair key={v} x={v} y={i===2?195:128} selected={v>=x}/>)}<TopChair x={x} y={263} color={C.orange} selected={!exclude}/>{txt(x,317,'参照椅',C.orange,18,'middle')}
 <Card x={681} y={65} w={392} h={103} title={exclude?'已经排除参照物':'参照物被误计入“其他”'} lines={[exclude?'c.id != reference.id':'漏掉了对象身份排除条件','统计条件：c.x >= reference.x']} active color={exclude?C.green:C.red}/>
 {txt(698,223,'当前输出',C.muted,20)}{txt(907,242,String(correct+(exclude?0:1)),exclude?C.green:C.red,64,'middle')}{txt(697,303,`正确数量 ${correct} · ${exclude?'没有重复计数':'多算 1 件'}`,C.ink,22)}<rect x={683} y={336} width={390*Math.min(1,p*2)} height={4} rx={2} fill={exclude?C.green:C.red}/></SceneBase>}
function MraScene({prediction,p}:{prediction:number;p:number}){const n=Math.round(prediction*2);const error=Math.abs(n-40);const passed=Array.from({length:10},(_,i)=>error*100<40*(50-i*5));const count=passed.filter(Boolean).length;return <SceneBase label={`预测${prediction}，通过${count}个阈值，MRA ${count*10}%`}>
 {txt(30,40,'真值 20：十个严格相对误差阈值',C.blue,24)}{passed.map((yes,i)=><g key={i}><rect x={30+i*108} y={96} width={94} height={100} rx={12} fill={yes?C.green:'#e2e7ec'} opacity={.65+.35*Math.min(1,p*3)}/>{txt(77+i*108,80,(.5+i*.05).toFixed(2),C.muted,19,'middle')}{txt(77+i*108,158,yes?'通过':'未通过',yes?'#fff':C.muted,19,'middle')}</g>)}
 {txt(30,249,`相对误差 = |${prediction.toFixed(1)} − 20| / 20 = ${(error/40*100).toFixed(1)}%`,C.ink,23)}{txt(30,303,`通过 ${count} / 10 个阈值`,C.ink,23)}{txt(1019,300,`MRA ${count*10}%`,C.green,32,'end')}{txt(30,337,'误差必须严格小于 1 − θ；恰好等于边界不计分。',C.muted,18)}</SceneBase>}
export function TeachingScene({chapter,kind='explore',variant=1}:{chapter:number;kind?:'intro'|'explore'|'recap';variant?:number}){
 const lesson=lessons[chapter-1],mra=chapter===10&&variant===2;const timeline=useTimeline(mra?4:lesson.steps.length,chapter===10?5:3.2);const {step,progress,time,playing}=timeline;const [mode,setMode]=useState(2);const [query,setQuery]=useState(2);const [manualDepth,setManualDepth]=useState(2);const [manualX,setManualX]=useState(280);const [exclude,setExclude]=useState(false);const [prediction,setPrediction]=useState(15);
 const depth=playing?1+5*(.5-.5*Math.cos(time*Math.PI/6)):manualDepth;const refX=playing?(step===3?500:280):manualX;const effectiveExclude=playing?step>=2:exclude;const pred=mra&&playing?[15,20,10,19][step]:prediction;
 const setDepth=(v:number)=>{setManualDepth(Math.round(v*10)/10);timeline.setPlaying(false)};const setX=(v:number)=>{setManualX(v);if(playing)setExclude(effectiveExclude);timeline.setPlaying(false)};
 const resultCondition=chapter===10&&!mra?resultSets[step].conditionNote:undefined;
 const steps=mra?['预测 15','预测 20','预测 10','预测 19']:chapter===3&&mode===0?['定位对象','估计深度','关系未补齐','定位对象','估计深度','关系未补齐']:chapter===3&&mode===1?['问题一：定位','问题一：深度','问题一：比较','问题二：定位','问题二：深度','问题二：比较']:lesson.steps;
 let picture:React.ReactNode=null;
 if(chapter===1)picture=<Geometry depth={4} step={step} progress={progress}/>;
 if(chapter===2)picture=<ToolsScene step={step} p={progress}/>;
 if(chapter===3)picture=<ReusableToolsScene step={step} mode={mode} p={playing?progress:1}/>;
 if(chapter===4)picture=<Geometry depth={depth} step={step} progress={progress} draggable onDepth={setDepth}/>;
 if(chapter===5)picture=<RequestScene step={step} query={query} p={playing?progress:1}/>;
 if(chapter===6)picture=<RepairScene step={step} p={playing?progress:1}/>;
 if(chapter===7)picture=<Bars names={['无 API','API','API + 弱 ICL','API + 弱 ICL + 伪 ICL']} scores={[60.7,64,65.7,66.7]} selected={step} p={playing?progress+.2:1} title="提示策略的累计消融" protocol="CLEVR100 · 100 题 · 同一设置"/>;
 if(chapter===8)picture=<WorkshopScene step={step} p={playing?progress:1}/>;
 if(chapter===9)picture=<CountScene x={refX} exclude={effectiveExclude} onX={setX} p={progress}/>;
 if(chapter===10&&!mra){const r=resultSets[step];picture=<Bars names={r.names} scores={r.scores} p={playing?progress+.1:1} title={r.title+' / '+r.key} protocol={r.protocol}/>;}
 if(mra)picture=<MraScene prediction={pred} p={progress}/>;
 let message=mra?`当前预测 ${pred.toFixed(1)}，严格按十个阈值计分；自动示例与手动数值采用同一计算规则。`:lesson.outputs[step];
 if(chapter===3&&mode===0)message='本例的固定 API 只有基础能力，尚未提供前后关系组合；扩展需要另行定义，不代表所有固定 API 都无法处理空间题。';
 if(chapter===3&&mode===1)message='每个问题都直接写定位、深度与比较代码；它仍使用基础视觉工具，只是不预先建立公共函数库。';
 if(chapter===4)message=`目标深度 ${depth.toFixed(1)} 米，对应参考尺度下高度 ${depth.toFixed(1)} 米。投影仍为 120 像素；这一比例依赖同焦距与可比较方向。`;
 if(chapter===9)message=`区域内其他椅子的正确数量为 ${[180,420,540].filter(v=>v>=refX).length}；${effectiveExclude?'当前已排除参照椅，计数与对象一致。':'当前把参照椅也算进去，会多算 1 件。'}`;
 return <div className={'scene-block '+kind} data-chapter={chapter} data-variant={variant} data-playing={playing} data-step={step}>
  <div className="scene-toolbar"><div className="play-controls"><button onClick={()=>{if(playing){if(chapter===4)setManualDepth(depth);if(chapter===9){setManualX(refX);setExclude(effectiveExclude)}if(mra)setPrediction(pred)}timeline.setPlaying(!playing)}} aria-pressed={playing}>{playing?'Ⅱ 暂停演示':'▶ 自动演示'}</button><button onClick={timeline.restart}>↻ 从头演示</button></div><span>{mra?'相对误差与严格阈值':`${step+1} / ${steps.length} · ${steps[step]}`}</span></div>
  {picture}
  {resultCondition&&<p className="result-condition-note">{resultCondition}</p>}
  {kind==='explore'&&<div className="operation-row">
   {chapter===3&&['固定 API','逐题直接写','动态 API'].map((n,i)=><button key={n} className={mode===i?'selected':''} aria-pressed={mode===i} onClick={()=>{setMode(i);timeline.restart()}}>{n}</button>)}
   {chapter===4&&<><label htmlFor="depth-control">目标深度 <b>{depth.toFixed(1)} m</b></label><input id="depth-control" type="range" min="1" max="6" step="0.1" value={depth} onInput={e=>setDepth(Number(e.currentTarget.value))}/><span>拖动橙框椅子也可改变深度</span></>}
   {chapter===5&&['查询颜色','比较前后','颜色与位置计数'].map((n,i)=><button key={n} className={query===i?'selected':''} aria-pressed={query===i} onClick={()=>{setQuery(i);timeline.restart()}}>{n}</button>)}
   {chapter===9&&<><button onClick={()=>{setExclude(!effectiveExclude);setManualX(refX);timeline.setPlaying(false)}}>{effectiveExclude?'排除参照物：开':'排除参照物：关'}</button><label>参照位置 <input aria-label="参照位置" type="range" min="130" max="550" step="10" value={refX} onInput={e=>setX(Number(e.currentTarget.value))}/></label></>}
   {mra&&<><label htmlFor="mra-control">预测值 <b>{pred.toFixed(1)}</b></label><input id="mra-control" type="range" min="0" max="30" step="0.5" value={pred} onInput={e=>{setPrediction(Number(e.currentTarget.value));timeline.setPlaying(false)}}/></>}
   {![3,4,5,9].includes(chapter)&&!mra&&<><button disabled={step===0} onClick={()=>timeline.select(step-1)}>上一步</button><button disabled={step===steps.length-1} onClick={()=>timeline.select(step+1)}>下一步</button></>}
  </div>}
  <div className="step-strip" aria-label="演示步骤">{steps.map((s,i)=><button key={i} className={step===i?'active':''} aria-pressed={step===i} onClick={()=>{if(chapter===4)setManualDepth(depth);timeline.select(i);if(chapter===9){setManualX(i===3?500:280);setExclude(i>=2)}if(mra)setPrediction([15,20,10,19][i])}}><span>{i+1}</span>{s}</button>)}</div>
  <div className="scene-feedback" role="status" aria-live={playing?'off':'polite'}><span className="feedback-mark">{chapter===9&&!effectiveExclude?'!':'↳'}</span><p>{message}</p></div>
 </div>
}
export function CoverAnimation(){return <TeachingScene chapter={8} kind="intro"/>}
