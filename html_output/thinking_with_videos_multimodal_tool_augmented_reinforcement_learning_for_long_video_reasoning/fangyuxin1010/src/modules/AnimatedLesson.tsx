import React,{useEffect,useRef,useState} from 'react';
import type {Kind} from '../data/lessons';
import {resultRows} from '../data/lessons';
import {useRewardDemo} from './RewardDemo';
import {useVisibleAnimation} from './useVisibleAnimation';
const P={ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',orange:'#f07e47',red:'#c43f52',line:'#d7deea',paper:'#fff',soft:'#eef3fb'};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const L=(a:number,b:number,p:number)=>a+(b-a)*clamp(p);
function Text({x,y,children,size=20,fill=P.ink,anchor='start',weight=500}:{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;anchor?:'start'|'middle'|'end';weight?:number}){return <text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} textAnchor={anchor} dominantBaseline="middle">{children}</text>;}
function Card({x,y,w,h=88,title,detail,active=false,color=P.blue}:{x:number;y:number;w:number;h?:number;title:string;detail?:string;active?:boolean;color?:string}){return <g><rect x={x} y={y} width={w} height={h} rx="16" fill={active?color+'12':'#fff'} stroke={active?color:P.line} strokeWidth={active?2.5:1.5}/><Text x={x+w/2} y={y+(detail?h*.38:h*.5)} anchor="middle" size={21} weight={650} fill={active?color:P.ink}>{title}</Text>{detail&&<Text x={x+w/2} y={y+h*.71} anchor="middle" size={16} fill={P.muted}>{detail}</Text>}</g>;}
export function Film({x,y,w=240,h=152,time=54,label=true}:{x:number;y:number;w?:number;h?:number;time:number;label?:boolean}){
 // The front reaches the checkpoint at 52 s; the rear clears it at 58 s.
 const rear=clamp(56+(time-52)*32/6,4,143),crossing=time>=52&&time<=58;
 return <g transform={'translate('+x+' '+y+')'} data-scene="car-checkpoint" data-time={time} data-car-rear={rear} data-car-front={rear+32}>
  <rect width={w} height={h} rx="13" fill="#fff" stroke={P.line}/>
  <svg x="8" y="7" width={w-16} height={h-35} viewBox="0 0 180 95" preserveAspectRatio="xMidYMid meet" overflow="hidden">
   <rect width="180" height="95" rx="7" fill="#eaf0e3"/>
   <path d="M0 35H180V76H0Z" fill="#bdc6cb"/>
   <path d="M0 38H180M0 73H180" stroke="#fff" strokeWidth="1.4"/>
   <path d="M0 55H180" stroke="#f5f7f4" strokeWidth="1.5" strokeDasharray="12 9"/>
   <path d="M88 34V77" stroke={crossing?P.green:'#8198aa'} strokeWidth={crossing?3:2} strokeDasharray="4 3"/>
   <rect x="81" y="21" width="14" height="14" rx="3" fill={P.blue}/>
   <rect x="81" y="76" width="14" height="13" rx="3" fill={P.blue}/>
   <path d="M88 24V6" stroke="#eef2f3" strokeWidth="4"/><path d="M88 10V15M88 19V23" stroke={P.orange} strokeWidth="4"/>
   <circle cx="102" cy="27" r="4" fill={crossing?P.green:'#b5c7b8'}/>
   <path d="M141 17H162L155 12M162 17L155 22" fill="none" stroke="#8ba086" strokeWidth="2" strokeLinecap="round"/>
   <g transform={'translate('+rear+' 45)'}>
    <ellipse cx="16" cy="12" rx="19" ry="10" fill="#264358" opacity=".12"/>
    <rect x="5" y="-3" width="7" height="5" rx="1.5" fill="#354350"/><rect x="22" y="-3" width="7" height="5" rx="1.5" fill="#354350"/>
    <rect x="5" y="18" width="7" height="5" rx="1.5" fill="#354350"/><rect x="22" y="18" width="7" height="5" rx="1.5" fill="#354350"/>
    <path d="M4 0H24Q32 0 32 7V13Q32 20 24 20H4Q0 20 0 16V4Q0 0 4 0Z" fill={P.orange} stroke="#b66735" strokeWidth="1.2"/>
    <path d="M18 3H23L25 6V14L23 17H18Z" fill="#c7e0e8" stroke="#bd713c" strokeWidth=".8"/>
    <path d="M5 3H9V17H5Z" fill="#d5e7ec"/>
    <path d="M11 3H16V17H11Z" fill="#e99458"/>
    <path d="M30 4V7M30 13V16" stroke="#fff6cd" strokeWidth="2" strokeLinecap="round"/>
   </g>
  </svg>
  {label&&<Text x={w/2} y={h-14} size={Math.min(17,w/7)} anchor="middle" fill={P.muted}>{time.toFixed(1)+' 秒'}</Text>}
 </g>;
}
function Arrow({x1,y1,x2,y2,active=false}:{x1:number;y1:number;x2:number;y2:number;active?:boolean}){const color=active?P.green:P.line;return <g><path d={'M'+x1+' '+y1+' L'+x2+' '+y2} stroke={color} strokeWidth={active?4:2} fill="none"/><path d={'M'+(x2-9)+' '+(y2-6)+'L'+x2+' '+y2+'L'+(x2-9)+' '+(y2+6)} stroke={color} strokeWidth="2" fill="none"/></g>;}
function Chips({items,value,change}:{items:string[];value:number;change:(v:number)=>void}){return <div className="v-options">{items.map((s,i)=><button key={s} className={'v-option'+(value===i?' selected':'')} aria-pressed={value===i} onClick={()=>change(i)}>{s}</button>)}</div>;}
export function AnimatedLesson({kind,cover=false}:{kind:Kind|'ablations'|'limits';cover?:boolean}){
 const {ref:sceneRef,visible}=useVisibleAnimation<HTMLElement>();
 const shared=useRewardDemo(visible),hasShared=shared!==null;
 const [localClock,setClock]=useState(0),[localPlaying,setPlaying]=useState(true),[mode,setMode]=useState(0),[manual,setManual]=useState(false),[value,setValue]=useState(kind==='iou'?20:kind==='window'?12:kind==='sample-reward'?.8:.3),[picked,setPicked]=useState<number|null>(null);
 const clock=shared?.clock??localClock,playing=shared?.playing??localPlaying;
 const drag=useRef(false);const svg=useRef<SVGSVGElement>(null);
 useEffect(()=>{if(hasShared||!playing||!visible)return;let id=0,lastPaint=performance.now();const tick=(now:number)=>{if(document.visibilityState==='visible'&&now-lastPaint>=40){const elapsed=now-lastPaint;lastPaint=now;setClock(v=>v+elapsed);}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,visible,hasShared]);
 const phase=(clock%4000)/4000,step=Math.floor(phase*4),reveal=clamp(phase*2.8),sweep=phase<.18?0:phase>.8?1:(phase-.18)/.62;
 const act=(i:number)=>{setMode(i);setClock(0);setPlaying(true);};
 const input=(n:number)=>{if(shared){shared.change(n);return;}setValue(n);setManual(true);setClock(0);};
 const autoValue=kind==='iou'?L(20,50,sweep):kind==='window'?L(12,48,sweep):kind==='sample-reward'?L(.2,2,sweep):L(0,1,sweep);
 const v=shared?.value??(manual?value:autoValue);
 const progress=clamp(phase*3.8);
 let graphic:React.ReactNode=null,controls:React.ReactNode=null,feedback='',tone='blue',caption='',metricExplanation='';
 const stepButtons=(labels:string[])=> <Chips items={labels} value={picked??Math.min(labels.length-1,Math.floor(phase*labels.length))} change={i=>{setPicked(i);setClock(0);}}/>;
 const current=(count:number)=>picked??Math.min(count-1,Math.floor(phase*count));
 const onPointer=(e:React.PointerEvent<SVGSVGElement>)=>{if(kind!=='window'&&kind!=='iou')return;const r=e.currentTarget.getBoundingClientRect();const point=e.currentTarget.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const matrix=e.currentTarget.getScreenCTM();const pos=matrix?point.matrixTransform(matrix.inverse()):{x:(e.clientX-r.left)/r.width*1000,y:0};if(kind==='window')input(Math.round(clamp((pos.x-90)/820*120-12,0,96)));else input(Math.round(clamp((pos.x-90)/820*120-10,0,100)));};
 if(kind==='compare'){
  const t=42+24*phase;
  caption='闸口录像示例 · 从概览到回看';
  graphic=<><Text x={250} y={34} anchor="middle" weight={650}>只看稀疏帧</Text><Text x={750} y={34} anchor="middle" weight={650} fill={P.green}>按需回看片段</Text>{[0,30,60,90,120].map((q,i)=><g key={q} opacity={i<=Math.floor(phase*5)?1:.36}><Film x={35+i*92} y={72} w={84} h={90} time={q}/></g>)}<Film x={624} y={62} w={252} h={160} time={t}/><rect x="565" y="251" width="360" height="14" rx="7" fill="#dce9e5"/><rect x="565" y="251" width={360*phase} height="14" rx="7" fill={P.green}/><Text x={565} y={285} size={17}>42 秒</Text><Text x={925} y={285} size={17} anchor="end">66 秒</Text><Card x={48} y={218} w={404} h={112} title={phase>.45?'看见了前后变化':'寻找小车通过的过程'} detail={phase>.45?'30秒在闸前，60秒已通过':'关键动作发生在52–58秒'} color={P.red} active={phase>.45}/><Text x={750} y={330} anchor="middle" fill={P.green} weight={650}>{t<52?'小车接近闸门':t<58?'正在看见：小车通过闸门':'确认：整辆车已经通过'}</Text></>;
  feedback='稀疏帧能显示前后变化；局部密集采样补出动作过程，而不是凭文字猜出缺失画面。';tone='green';
 }
 if(kind==='tasks'){
  const names=['时间定位','视频问答','带定位问答'];caption='同一事件 · 三种输出目标';
  graphic=<><Film x={54} y={82} w={310} h={210} time={42+24*phase}/><Arrow x1={389} y1={184} x2={493} y2={184} active/><Card x={526} y={57} w={408} h={70} title={names[mode]} active/><g opacity={reveal}>{mode!==1&&<Card x={526} y={150} w={408} h={73} title="时间：52–58 秒" detail="动作发生的证据区间" color={P.blue} active/>}{mode!==0&&<Card x={526} y={mode===1?171:242} w={408} h={82} title="答案：小车通过闸门" detail="回答画面中发生的动作" color={P.green} active/>}</g></>;
  controls=<Chips items={names} value={mode} change={act}/>;feedback=['输出起止时间，判断事件发生在哪里。','输出动作答案，判断画面中发生了什么。','答案与时间区间一起输出，让判断对应到可检查的视觉证据。'][mode];
 }
 if(kind==='window'){
  const start=Math.round(v),end=start+24,t=start+24*phase,overlap=Math.max(0,Math.min(end,58)-Math.max(start,52)),full=start<=52&&end>=58;
  caption='回看范围 · '+start+'–'+end+' 秒';
  graphic=<><Film x={389} y={12} w={222} h={133} time={t}/><Text x={74} y={51} size={18} fill={P.muted}>原视频 0–120 秒</Text><Text x={74} y={84} size={23} weight={650}>选区内重新采样</Text><Text x={726} y={54} size={18} fill={P.muted}>需要确认的动作</Text><Text x={726} y={85} size={23} fill={P.green}>52–58 秒</Text>{Array.from({length:9},(_,i)=><g key={i} opacity={phase*9>=i?.99:.34}><Film x={44+i*102} y={166} w={92} h={101} time={start+i*3}/></g>)}<path d="M90 327H910" stroke={P.line} strokeWidth="12" strokeLinecap="round"/><rect x={90+820*52/120} y={303} width={820*6/120} height={50} rx="7" fill={P.green+'35'}/><rect x={90+820*start/120} y={303} width={820*24/120} height={50} rx="10" fill={P.orange+'25'} stroke={P.orange} strokeWidth="2.5"/><Text x={90} y={379} size={17}>0 秒</Text><Text x={910} y={379} anchor="end" size={17}>120 秒</Text></>;
  controls=<label className="v-range">回看起点 <input aria-label="回看起点" type="range" min="0" max="96" step="1" value={start} onChange={e=>input(+e.target.value)}/><output>{start} 秒</output></label>;
  feedback=full?'选区覆盖完整动作，9个示例采样点中有帧能观察通过过程。':overlap>0?'选区只覆盖部分动作；移动边界可以补足前后过程。':'当前选区没有覆盖通过动作；向52–58秒附近移动窗口。';tone=full?'green':overlap?'blue':'red';
 }
 if(kind==='history'){
  const s=current(4),names=['最初观察','发出请求','接收新帧','更新答案'];caption='证据更新 · '+names[s];
  graphic=<>{names.map((name,i)=><g key={name}><circle cx={100+i*263} cy="37" r="15" fill={i<=s?P.green:P.line}/><Text x={100+i*263} y={71} anchor="middle" size={18} fill={i===s?P.green:P.muted}>{name}</Text>{i<3&&<Arrow x1={123+i*263} y1={37} x2={338+i*263} y2={37} active={i<s}/>}</g>)}<Film x={47} y={111} w={288} h={203} time={s<2?30:52+6*phase}/><Card x={402} y={108} w={537} h={99} title={['暂时只知道：前后画面发生变化','请求：回看42–66秒','新证据：小车正在通过闸门','判断：52–58秒，小车通过闸门'][s]} detail={['动作时刻尚不确定','起点42秒，终点66秒','新帧加入此前的推理历史','答案随新增证据得到更新'][s]} active color={s>=2?P.green:P.blue}/><g opacity={s>=2?1:.35}><Card x={402} y={233} w={537} h={92} title="保留上下文，再加入新证据" detail="问题 + 先前观察 + 工具请求 + 返回画面" color={P.green} active={s>=2}/></g></>;
  controls=stepButtons(names);feedback=['现有证据不足以确定动作，不应直接把猜测当成结论。','工具请求明确指出需要补看的时间范围。','返回的是新视觉内容，不只是重复一段已有文字。','后续回答使用新增证据；这就是文字与视觉交替的推理过程。'][s];
 }
 if(kind==='iou'){
  const start=Math.round(v),end=start+20,inter=Math.max(0,Math.min(end,70)-Math.max(start,50)),union=40-inter,iou=inter/union,x=(n:number)=>90+n/120*820;
  caption='边界对齐 · 交集与并集同步计算';
  graphic=<><Text x={70} y={40} size={19}>参考区间：50–70秒</Text><Text x={70} y={130} size={19}>预测区间：{start}–{end}秒</Text><path d="M90 85H910M90 174H910" stroke={P.line} strokeWidth="10" strokeLinecap="round"/><rect x={x(50)} y={64} width={x(20)-90} height={42} rx="8" fill={P.blue}/><rect x={x(start)} y={154} width={x(20)-90} height={42} rx="8" fill={P.orange}/>{inter>0&&<rect x={x(Math.max(start,50))} y={59} width={inter/120*820} height={143} rx="6" fill={P.green+'40'} stroke={P.green} strokeDasharray="5 5"/>}<Card x={73} y={252} w={240} h={105} title={'交集 '+inter+' 秒'} detail="共同覆盖的时间" active color={P.green}/><Text x={348} y={301} size={35} anchor="middle">÷</Text><Card x={383} y={252} w={240} h={105} title={'并集 '+union+' 秒'} detail="两者覆盖的总时间" active/><Text x={664} y={301} size={35} anchor="middle">=</Text><Card x={708} y={252} w={225} h={105} title={'IoU '+iou.toFixed(3)} detail={iou===1?'边界完全对齐':inter?'部分重叠':'没有重叠'} active color={iou===1?P.green:inter?P.blue:P.red}/></>;
  controls=<><label className="v-range">预测起点<input aria-label="预测起点" type="range" min="0" max="100" value={start} onChange={e=>input(+e.target.value)}/><output>{start} 秒</output></label><button className="v-option" onClick={()=>input(50)}>对齐边界</button></>;
  feedback='交集'+inter+'秒 ÷ 并集'+union+'秒 = '+iou.toFixed(3)+'。改变预测边界，分子和分母同时变化。';tone=iou===1?'green':inter?'blue':'red';
 }
 if(kind==='tools'){
  const names=['无工具推理','片段描述','片段问答','视频裁剪'],scores=[28.4,2,2,25.5];caption='零样本对照 · GPT-4.1 · VidCh 3k子集';
  graphic=<><Card x={42} y={38} w={381} h={65} title={names[mode]} active/>{mode===3?<Film x={104} y={134} w={259} h={170} time={42+24*phase}/>:<Card x={42} y={134} w={381} h={170} title={['继续已有推理','画面中一辆小车通过闸门','答案：小车'][mode]} detail={['没有新的工具返回','示例返回：文字描述','示例返回：文字答案'][mode]} active color={P.orange}/>}<Text x={516} y={58} weight={650}>mIoU（%），越高越好</Text>{[28.4,scores[mode]].map((a,i)=><g key={i}><Text x={516} y={121+i*104} size={18}>{i===0?'无工具推理':names[mode]}</Text><rect x="516" y={146+i*104} width="359" height="29" rx="7" fill={P.soft}/><rect x="516" y={146+i*104} width={359*a/35*progress} height="29" rx="7" fill={i?P.red:P.blue}/><Text x={927} y={162+i*104} anchor="end" size={24} weight={650}>{(a*progress).toFixed(1)}</Text></g>)}<Text x={516} y={343} size={17} fill={P.muted}>统一刻度：0–35；不是VITAL最终成绩</Text></>;
  controls=<Chips items={names} value={mode} change={act}/>;feedback=mode===0?'无工具推理的28.4%是本组零样本实验的比较基线。':names[mode]+'得到'+scores[mode].toFixed(1)+'%，低于28.4%。工具能提供信息，不代表模型已经学会正确使用。';tone=mode?'red':'blue';
 }
 if(kind==='runtime'){
  const names=['直接回答','合法裁剪','参数错误'],texts=[['答案：小车通过闸门','不再发出工具请求','本轮结束'],['开始42秒；结束66秒','参数合法，执行视频裁剪','返回片段，继续推理'],['开始66秒；结束42秒','起点晚于终点，无法执行','返回错误信息']];
  caption='一轮执行 · '+names[mode];const s=step;
  graphic=<><Card x={46} y={139} w={230} h={105} title="模型输出" detail={names[mode]} active/><Arrow x1={283} y1={191} x2={349} y2={191} active={s>=1}/><Card x={365} y={57} w={574} h={83} title={texts[mode][0]} detail={mode===0?'最终答案':'工具调用参数'} active={s>=1} color={mode===2?P.red:P.blue}/><Card x={365} y={164} w={574} h={77} title={texts[mode][1]} active={s>=2} color={mode===2?P.red:P.blue}/><Card x={365} y={267} w={574} h={82} title={s>=3?texts[mode][2]:'等待本轮处理结果'} active={s>=3} color={mode===2?P.red:P.green}/></>;
  controls=<Chips items={names} value={mode} change={act}/>;feedback=['工具调用是可选动作，证据充分时直接结束。','新片段交回模型，下一轮可以基于新增视觉证据继续判断。','错误信息不是新画面；返回错误也不代表后续一定能修复成功。'][mode];tone=mode===2?'red':mode===1?'green':'blue';
 }
 if(kind==='training'){
  const s=current(4),names=['基础SFT','基础DGRPO','工具SFT','工具DGRPO'],counts=[54,94,18,16],outs=['学习示范推理','优化多任务奖励','模仿工具调用轨迹','优化何时回看的策略'];caption='四阶段学习 · 第'+(s+1)+'阶段';
  graphic=<>{names.map((name,i)=><g key={name}><Card x={27+i*247} y={25} w={220} h={88} title={name} detail={counts[i]+'k样本 · '+(i<2?'无工具':'有工具')} active={i===s}/>{i<3&&<Arrow x1={251+i*247} y1={69} x2={268+i*247} y2={69} active={i<s}/>}</g>)}<Card x={62} y={167} w={390} h={152} title={s%2===0?'示范：怎样得到答案':'采样：比较8条尝试'} detail={s%2===0?(s===2?'问题 → 调用片段 → 观察 → 回答':'问题 → 观察 → 推理 → 回答'):'准确性奖励 + 格式奖励'+(s===3?' + 工具奖励':'')} active/><Arrow x1={472} y1={243} x2={545} y2={243} active/><Card x={566} y={167} w={370} h={152} title={outs[s]} detail={'学习率 '+(s%2===0?'10⁻⁵':'10⁻⁶')+' · 1轮训练'} active color={P.green}/>{(s%2===0?['读取示范轨迹','模仿推理与动作','更新可训练参数']:['生成8条候选轨迹','计算奖励与优势','更新可训练参数']).map((label,i)=><g key={label}><Card x={62+i*301} y={342} w={271} h={49} title={label} active={Math.floor(clock%1800/600)===i} color={P.green}/>{i<2&&<Arrow x1={338+i*301} y1={366} x2={359+i*301} y2={366} active={Math.floor(clock%1800/600)>i}/>}</g>)}</>;
  controls=stepButtons(names);feedback='当前阶段使用'+counts[s]+'k个样本。SFT合计72k、RL合计110k；这不是独立视频的数量。';
 }
 if(kind==='filter'){
  const arrays=[[1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0],[.4,.41,.42,.4,.43,.41,.42,.4],[0,1,0,1,1,0,1,0]],a=arrays[mode],min=Math.min(...a),max=Math.max(...a),range=max-min,keep=range>.05;
  caption='八次尝试 · 从奖励差异中筛选样本';
  graphic=<>{a.map((q,i)=><g key={i} opacity={phase*16>=i?1:.18}><rect x={43+i*120} y={61} width="101" height="164" rx="14" fill="#fff" stroke={P.line}/><Text x={94+i*120} y={88} anchor="middle" size={17} fill={P.muted}>{'尝试 '+(i+1)}</Text><rect x={75+i*120} y={185-70*q} width="38" height={Math.max(3,70*q)} rx="5" fill={q===max?P.green:P.blue}/><Text x={94+i*120} y={207} anchor="middle" size={20} weight={650}>{q.toFixed(2)}</Text></g>)}<g opacity={reveal}><Card x={48} y={265} w={598} h={91} title={max.toFixed(2)+' − '+min.toFixed(2)+' = '+range.toFixed(2)} detail="最高奖励 − 最低奖励 = 极差" active/><Card x={692} y={265} w={257} h={91} title={keep?'保留样本':'过滤样本'} detail={keep?'极差 > 0.05':'极差 ≤ 0.05'} active color={keep?P.green:P.red}/></g></>;
  controls=<Chips items={['全部成功','全部失败','全部差不多','有明显差异']} value={mode} change={act}/>;feedback='这组示例的奖励极差为'+range.toFixed(2)+'，因此'+(keep?'保留。':'过滤。')+'筛选看同题尝试之间的差异，不看平均分高低。';tone=keep?'green':'red';
 }
 if(kind==='architecture'){
  const s=current(5),names=['视觉编码','合并投影','语言模型','解析输出','视频工具'],desc=['视频帧 → 视觉表征','视觉表征 → 模型输入','历史上下文 → 推理与请求','生成序列 → 合法调用或答案','时间范围 → 新视觉片段'],xs=[38,363,688,688,363],ys=[44,44,44,231,231];caption='观察循环 · '+names[s];
  const flow=(clock%1100)/1100;
  const flowPoint=s===0?[L(295,349,flow),98]:s===1?[L(620,674,flow),98]:s===2?[815,L(157,217,flow)]:s===3?[L(679,629,flow),286]:flow<.6?[L(351,165,flow/.6),286]:[165,L(286,166,(flow-.6)/.4)];

  graphic=<><Arrow x1={294} y1={98} x2={349} y2={98} active={s===0}/><Arrow x1={620} y1={98} x2={674} y2={98} active={s===1}/><path d="M815 157V217" fill="none" stroke={s===2?P.green:P.line} strokeWidth={s===2?4:2}/><path d="M679 286H629" stroke={s===3?P.green:P.line} strokeWidth={s===3?4:2}/><path d="M351 286H165V166" fill="none" stroke={s===4?P.green:P.line} strokeWidth={s===4?4:2} strokeDasharray={s===4?'8 4':undefined}/>{names.map((name,i)=><g key={name} onClick={()=>setPicked(i)} role="button" tabIndex={0} aria-label={name} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPicked(i);}}} style={{cursor:'pointer'}}><Card x={xs[i]} y={ys[i]} w={257} h={112} title={name} detail={['参数冻结','合并视觉信息','生成推理与动作','提取结构化参数','回到原始视频'][i]} active={s===i} color={s===4?P.green:P.blue}/></g>)}<circle cx={flowPoint[0]} cy={flowPoint[1]} r="6" fill={P.green}/><Text x={180} y={280} size={18} anchor="middle" fill={P.green}>新帧回传</Text><Text x={500} y={378} size={22} anchor="middle" fill={P.green} weight={650}>{desc[s]}</Text></>;
  controls=stepButtons(names);feedback=desc[s]+'。'+(s===3?'识别为最终答案时，也可以直接结束而不调用工具。':s===4?'新视觉证据进入下一轮，原来的问题与历史仍然保留。':'选中一个组件，可以检查它在循环中的职责。');
 }
 if(kind==='task-reward'){
  const q=Math.round(v*100)/100,a=clamp((q-.2)/.6),b=clamp(q/.5),path=(fn:(n:number)=>number)=>Array.from({length:101},(_,i)=>(i?'L':'M')+(72+i*4.1)+' '+(316-fn(i/100)*222)).join(' ');
  caption='同一IoU · 两套任务刻度';
  graphic=<><path d="M72 75V316H482" stroke={P.line} strokeWidth="2" fill="none"/>{[0,.5,1].map(q=><g key={q}><Text x={48} y={316-q*222} size={16} anchor="end">{q.toFixed(1)}</Text><Text x={72+q*410} y={344} size={16} anchor="middle">{q.toFixed(1)}</Text></g>)}<path d={path(x=>clamp((x-.2)/.6))} stroke={P.blue} strokeWidth="4" fill="none"/><path d={path(x=>clamp(x/.5))} stroke={P.green} strokeWidth="4" fill="none"/><path d={'M'+(72+q*410)+' 75V316'} stroke={P.orange} strokeWidth="2" strokeDasharray="5 5"/><circle cx={72+q*410} cy={316-a*222} r="7" fill={P.blue}/><circle cx={72+q*410} cy={316-b*222} r="7" fill={P.green}/><Text x={270} y={34} anchor="middle" size={20}>IoU → 定位奖励</Text><Card x={546} y={60} w={401} h={113} title={'短视频：'+a.toFixed(3)} detail={'clamp(('+q.toFixed(2)+' − 0.2) ÷ 0.6)'} active/><Card x={546} y={211} w={401} h={113} title={'长VidCh：'+b.toFixed(3)} detail={'clamp('+q.toFixed(2)+' ÷ 0.5)'} active color={P.green}/></>;
  controls=<label className="v-range">IoU<input aria-label="IoU" type="range" min="0" max="1" step=".01" value={q} onChange={e=>input(+e.target.value)}/><output>{q.toFixed(2)}</output></label>;
  feedback='IoU本身仍是'+q.toFixed(2)+'。变化的是奖励刻度：短视频'+a.toFixed(3)+'，长VidCh '+b.toFixed(3)+'；映射在0与1处截断。';
 }
 if(kind==='sample-reward'){
  const d=Math.round(v*100)/100,w=.5+.5*clamp(2-d),spread=Math.min(.3,d,2-d),rewards=Array.from({length:8},(_,i)=>d+(i%2?1:-1)*spread);
  caption='八条奖励 → 平均值 → 软权重 → 加权奖励';
  graphic=<>{rewards.map((r,i)=><g key={i} opacity={phase*18>=i?1:.22}><Card x={28+i*122} y={27} w={108} h={86} title={r.toFixed(2)} detail={'尝试'+(i+1)} active={step===0}/></g>)}<Card x={58} y={165} w={245} h={117} title={'平均 D = '+d.toFixed(2)} detail="8条奖励求和，再除以8" active={step>=1}/><Arrow x1={314} y1={225} x2={352} y2={225} active={step>=2}/><Card x={371} y={165} w={245} h={117} title={'权重 w = '+w.toFixed(3)} detail={d<=1?'不打折':'对更容易的样本软折扣'} active={step>=2} color={P.orange}/><Arrow x1={630} y1={225} x2={669} y2={225} active={step>=3}/><Card x={688} y={165} w={254} h={117} title={'均值变为 '+(d*w).toFixed(3)} detail="每条奖励均乘同一个w" active={step>=3} color={P.green}/><Text x={500} y={341} anchor="middle" size={22} fill={P.green}>{d<=1?'D ≤ 1：保留原奖励':d===2?'D = 2：w = 0.5，仍保留部分贡献':'D从1升向2：w从1降向0.5'}</Text></>;
  controls=<label className="v-range">平均奖励 D<input aria-label="平均奖励 D" type="range" min="0" max="2" step=".02" value={d} onChange={e=>input(+e.target.value)}/><output>{d.toFixed(2)}</output></label>;
  feedback='这组示例平均奖励为'+d.toFixed(2)+'，软权重为'+w.toFixed(3)+'。权重的下限是0.5，不会把容易样本的奖励清零。';tone='green';
 }
 if(kind==='results'){
  const row=resultRows[mode],names=['Qwen2.5-VL-7B','VITAL 无工具','VITAL'],colors=[P.muted,P.blue,P.green];
  caption=row.dataset+' · '+row.metric+'（%）';
  metricExplanation=row.metric==='IoU AUC'?'IoU AUC 是 IoU 曲线下面积的汇总指标；这里的35.3按0–100刻度展示，不表示平均时间重叠为35.3%。它与 mIoU 的汇总口径不同，应在同一数据集、同一指标和相同设置下比较。':row.metric==='mIoU'?'mIoU 是各样本时间交并比的平均值，按0–100刻度显示。它描述平均重叠程度，不是答案正确率，也不是 IoU AUC。':row.metric==='R@0.5'?'R@0.5 统计时间交并比达到0.5门槛的比例；与连续的 mIoU 或曲线面积 AUC 不同。': '准确率统计回答正确的比例；它不直接衡量预测时间区间的边界是否准确。';
  graphic=<>{[0,25,50,75,100].map(n=><g key={n}><path d={'M'+(277+n*5.7)+' 58V334'} stroke={P.line}/><Text x={277+n*5.7} y={366} size={17} anchor="middle">{n}</Text></g>)}{row.values.map((n,i)=><g key={i}><Text x={251} y={107+i*89} anchor="end" size={21} weight={i===2?650:500}>{names[i]}</Text><rect x="277" y={84+i*89} width={n*5.7*progress} height="45" rx="9" fill={colors[i]}/><Text x={916} y={107+i*89} size={28} anchor="end" weight={650} fill={colors[i]}>{(n*progress).toFixed(1)}</Text></g>)}</>;
  controls=<label className="v-select">比较指标<select aria-label="比较指标" value={mode} onChange={e=>act(+e.target.value)}>{resultRows.map((r,i)=><option key={r.dataset} value={i}>{r.dataset} · {r.metric}</option>)}</select></label>;
  feedback='VITAL '+row.values[2].toFixed(1)+'%，无工具VITAL '+row.values[1].toFixed(1)+'%，相差'+(row.values[2]-row.values[1]).toFixed(1)+'个百分点。'+(mode===1?'同组Gemini 1.5 Pro为75.0%。':'统一0–100刻度，越高越好。');tone='green';
 }
 if(kind==='ablations'){
  const configs=[{name:'难度平衡',labels:['GRPO','DGRPO'],values:[66,70.2],max:100,unit:'%',desc:'同为无工具、Think风格；LVR准确率提升，但Charades mIoU从57.2%变为57.1%。'},{name:'工具冷启动',labels:['省略工具SFT','保留工具SFT'],values:[70.5,79.3],max:100,unit:'%',desc:'平均成功调用次数从0变为0.87；专门的工具示范有助于学习调用。'},{name:'像素预算',labels:['高像素无工具','VITAL'],values:[73.7,79.3],max:100,unit:'%',desc:'增加像素的无工具基线仍低于VITAL；这不等于严格相同运行时间。'},{name:'样本权重',labels:['硬权重','软权重'],values:[58.3,70.2],max:100,unit:'%',desc:'两阶段、无工具实验中，保留容易样本的部分贡献更有利。'},{name:'工具RL训练进度',labels:['已用8k','已用12k','已用16k'],values:[76.1,75.8,79.3],max:100,unit:'%',desc:'比较第四阶段训练中累计已用8k、12k、16k样本时的检查点，不是三个分别从头训练的数据规模实验。训练总体有所提高，中间结果仍会波动。'},{name:'任务组合',labels:['仅定位','仅推理问答','两者组合','加入带定位问答'],values:[59.5,76.5,78.3,79.3],max:100,unit:'%',desc:'任务之间具有互补性；样本量也随组合改变，不是严格的单变量比较。'}],c=configs[mode];
  caption=mode===4?'工具RL训练进度 · 第四阶段累计已用样本':'消融观察 · LVR准确率（%）';
  graphic=<>{c.values.map((v,i)=><g key={i}><Text x={252} y={65+i*83} size={20} anchor="end">{c.labels[i]}</Text><rect x={279} y={46+i*83} width={v*5.9*progress} height={38} rx="8" fill={i===c.values.length-1?P.green:P.blue}/><Text x={930} y={65+i*83} size={24} anchor="end" weight={650}>{(v*progress).toFixed(1)}</Text></g>)}<Text x={500} y={387} size={17} anchor="middle" fill={P.muted}>{mode===4?'第四阶段累计已用样本；条长表示 LVR 准确率（%）':'每次只比较一组实验，不能把不同条件的数值合成总分'}</Text></>;
  controls=<label className="v-select">观察因素<select aria-label="观察因素" value={mode} onChange={e=>act(+e.target.value)}>{configs.map((c,i)=><option key={c.name} value={i}>{c.name}</option>)}</select></label>;feedback=c.desc;
 }
 if(kind==='limits'){
  const s=current(3),names=['视觉与音频','时间与空间','观察与成本'];
  caption='适用边界 · '+names[s];
  graphic=s===0?<><Film x={45} y={92} w={275} h={185} time={42+24*phase}/><Arrow x1={338} y1={165} x2={407} y2={165} active/><Card x={429} y={83} w={511} h={91} title="视频画面：进入视觉推理" detail="当前主要使用视觉特征" active color={P.green}/><Card x={429} y={222} w={511} h={91} title="声音信息：尚未整合" detail="只靠声音才能判断的内容仍可能遗漏" active color={P.red}/></>:s===1?<><Text x={63} y={59} size={24} weight={650}>时间定位</Text><rect x={62} y={92} width={876} height={27} rx={8} fill={P.soft}/><rect x={62+phase*430} y={87} width={220} height={37} rx={8} fill={P.green+'60'} stroke={P.green}/><Text x={63} y={157} size={20}>支持寻找“何时发生”</Text><Card x={63} y={220} w={875} h={112} title="细粒度空间定位：当前支持有限" detail="时间段中的事件定位，不等于逐帧定位每个对象的空间边界" active color={P.red}/></>:<>{[0,1,2].map((q,i)=><g key={q} opacity={i<=Math.floor(phase*3)?1:.25}><Card x={53+i*316} y={89} w={273} h={146} title={q+' 轮工具调用'} detail={['直接回答','增加一次观察与生成','继续补充证据'][i]} active={i===Math.floor(phase*3)}/></g>)}<Text x={500} y={300} size={24} anchor="middle" fill={P.orange}>增加回看机会，也增加多轮生成与工具执行成本</Text><Text x={500} y={343} size={18} anchor="middle">评测上限是2轮，不是每个问题都必须调用2次</Text></>;
  controls=stepButtons(names);feedback=['没有音频输入时，不能期待模型利用尚未看见的声音信息。','当前工具聚焦时间范围和视频问答，不能直接推广到任意空间定位任务。','工具调用的价值要与额外计算一起衡量，不应把更多调用自动当作更好。'][s];
 }
 return <section ref={sceneRef} className={'v-scene'+(cover?' cover-scene':'')} data-shared-value={shared?.value} data-shared-clock={shared?.clock}><div className="v-scene-heading"><span><i className={playing?'live-dot':'paused-dot'}/>{caption}</span><div className="v-playback"><button onClick={()=>{if(shared){shared.replay();return;}setClock(0);setPicked(null);setManual(false);setPlaying(true);}} aria-label="重新演示">↻</button><button onClick={()=>{if(shared)shared.toggle();else setPlaying(p=>!p);}} aria-label={playing?'暂停动画':'播放动画'}>{playing?'暂停':'播放'}</button></div></div>{shared&&<p className="reward-sync-note">与上方动画使用同一组输入；在这里调整，上方也会同步更新。</p>}<div className="v-graphic"><svg ref={svg} viewBox="0 0 1000 410" role="img" aria-label={caption} onPointerDown={e=>{if(kind==='window'||kind==='iou'){drag.current=true;e.currentTarget.setPointerCapture(e.pointerId);onPointer(e);}}} onPointerMove={e=>{if(drag.current)onPointer(e);}} onPointerUp={e=>{drag.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{drag.current=false;}} style={{touchAction:kind==='window'||kind==='iou'?'none':'auto'}}>{graphic}</svg></div>{controls&&<div className="v-scene-controls" onKeyDown={e=>e.stopPropagation()}>{controls}</div>}{metricExplanation&&<p className="metric-explanation"><strong>当前指标怎么读：</strong>{metricExplanation}</p>}<div className={'v-feedback '+tone} aria-live={manual||picked!==null?'polite':'off'}>{feedback}</div></section>;
}
