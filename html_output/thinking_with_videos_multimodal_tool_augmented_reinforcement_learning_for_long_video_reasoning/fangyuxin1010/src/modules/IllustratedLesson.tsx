import React,{useEffect,useState} from 'react';
import type {Kind} from '../data/lessons';
import {useRewardDemo} from './RewardDemo';
import {VisualReturnScene} from './VisualReturnScene';
import {Film} from './AnimatedLesson';
import {useVisibleAnimation} from './useVisibleAnimation';
const C={blue:'#27446e',green:'#228d5c',orange:'#ed8651',red:'#bb5261',ink:'#21324a',muted:'#697b8c',line:'#d5dfdf',soft:'#e8efe9'};
const clip=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*clip(t);
function T({x,y,children,size=24,color=C.ink,anchor='middle'}:{x:number;y:number;children:React.ReactNode;size?:number;color?:string;anchor?:'start'|'middle'|'end'}){return <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} dominantBaseline="middle" fontWeight="600">{children}</text>;}
function Sheet({x,y,w=200,h=135,children,color='#fff'}:{x:number;y:number;w?:number;h?:number;children?:React.ReactNode;color?:string}){return <g transform={'translate('+x+' '+y+')'}><rect x="5" y="6" width={w} height={h} rx="13" fill="#294357" opacity=".06"/><rect width={w} height={h} rx="13" fill={color} stroke={C.line}/>{children}</g>;}
function Tag({x,y,text,color=C.blue}:{x:number;y:number;text:string;color?:string}){return <g><rect x={x-62} y={y-18} width="124" height="36" rx="18" fill={color+'13'}/><T x={x} y={y} size={20} color={color}>{text}</T></g>;}
const stories:Record<string,{title:string;steps:string[];notes:string[]}>={
 tools:{title:'同一段录像，三种信息返回',steps:['读取片段','选择工具','生成返回','继续判断'],notes:['先从原视频取得与问题有关的时间范围。','工具类型决定返回一段描述、一个答案，还是视觉内容。','文字工具压缩信息；裁剪工具保留重新检查动作的机会。','返回类型不同，后续能够验证的细节也不同。']},
 runtime:{title:'在剪辑台上执行一次请求',steps:['给出输出','检查参数','执行分支','返回结果'],notes:['模型可以给出最终答案，也可以请求工具。','起点、终点和调用格式必须能被执行端识别。','有效请求才会真正提取帧，错误请求不会生成新证据。','视觉结果进入下一轮；最终答案则结束循环。']},
 training:{title:'从示范轨迹，到多次尝试的反馈',steps:['读取题目','生成轨迹','检查反馈','学习调整'],notes:['观察问题与现有视觉内容，明确本次任务。','SFT 跟随示范；强化学习从当前策略采样多条尝试。','示范提供学习目标，奖励用于比较候选轨迹的结果。','这是一轮学习的示意，不代表只保留最高分候选。']},
 filter:{title:'让八次尝试通过样本筛选口',steps:['采样八次','读取奖励','计算极差','决定去向'],notes:['对同一道题形成八次尝试，而不是八道不同题。','每张记录都保留实际示例分数。','最高奖励减去最低奖励，得到这一组的极差。','整道题被保留或过滤，不是只筛掉组内低分轨迹。']},
 architecture:{title:'从回看片段到新的视觉输入',steps:['生成请求','裁剪取帧','编码与投影','加入上下文'],notes:['模型提出回看42–66秒，解析器把起止时间交给工具。','从原录像取得新片段；52、55、58秒是其中三个示例采样点。','新帧先经过视觉编码，再合并与投影为模型能接收的视觉表示。','新的视觉表示插入上下文，原问题、历史和初始视觉仍保留，供下一轮继续判断。']},
 'task-reward':{title:'同一份时间重叠，两把奖励尺',steps:['确定重叠','读取 IoU','映射刻度','比较奖励'],notes:['预测与参考区间决定 IoU，奖励映射不移动这些边界。','IoU 先作为同一个输入，送入两套任务映射。','上下界之间线性变化，超出部分截断到0或1。','读数差别来自任务刻度，不是同一预测的准确程度改变。']},
 'sample-reward':{title:'八份奖励，一起经过软折扣',steps:['收集奖励','求平均值','得到权重','逐条缩放'],notes:['示例八条奖励围绕同一个均值分布，范围保持在0到2。','D 是八条预权重奖励的平均值。','D≤1 时不折扣；D 越接近2，权重越接近0.5。','每条奖励乘同一个权重，不会直接把容易样本清零。']},
 results:{title:'连续的重叠分数，与离散的达标判断',steps:['参考区间','移动预测','计算重叠','检查门槛'],notes:['先把预测与参考放在同一条时间轴上。','移动预测边界会同时改变交集和并集。','单例 IoU 是连续读数，mIoU 是这些读数的平均。','R@0.5 统计达到门槛的比例，示例只展示其中一次判断。']},
 ablations:{title:'翻开训练记录，检查工具示范是否存在',steps:['准备示范','生成请求','接收片段','继续回答'],notes:['这段动画展示训练条件，不冒充两个模型的实测输出。','工具 SFT 的示范包含合法调用及其位置。','视觉返回连接到后面的推理与回答，而非孤立的接口说明。','有无这一类轨迹的效果，需要查看对应消融数据。']},
 limits:{title:'回看能够补什么，又缺少什么',steps:['确认问题','检查输入','观察变化','辨认边界'],notes:['先判断问题需要视觉、声音、空间位置还是更多观察。','目前输入与工具支持范围，决定了可以补充什么证据。','重复视觉回看不能自动补上音频，也不能替代空间工具。','多一轮观察还增加生成、执行与视觉处理的工作。']}
};
export function IllustratedLesson({kind}:{kind:Kind}){
 const {ref,visible}=useVisibleAnimation<HTMLElement>();
 const shared=useRewardDemo(visible),hasShared=shared!==null;
 const [localClock,setClock]=useState(0),[localPlaying,setPlaying]=useState(true),[mode,setMode]=useState(0),[value,setValue]=useState(.4),[manual,setManual]=useState(false);
 const clock=shared?.clock??localClock,playing=shared?.playing??localPlaying;
 useEffect(()=>{if(hasShared||!visible||!playing)return;let id=0,last=performance.now();const tick=(now:number)=>{if(now-last>=40){const dt=now-last;last=now;if(document.visibilityState==='visible')setClock(x=>x+Math.min(dt,100));}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,visible,hasShared]);
 const phase=(clock%4000)/4000,s=Math.min(3,Math.floor(phase*4)),p=clip((phase-.08)/.7),reveal=clip((phase-.36)/.35),story=stories[kind];
 const act=(n:number)=>{setMode(n);setClock(0);setPlaying(true);};
 const seek=(n:number)=>{if(shared){shared.seek(n*1000+500);return;}setClock(n*1000+500);setPlaying(false);};
 const range=(label:string,min:number,max:number,step:number,v:number)=> <label className="story-range"><span>{label}</span><input type="range" aria-label={label} min={min} max={max} step={step} value={v} onChange={e=>{if(shared)shared.change(+e.target.value);else{setValue(+e.target.value);setManual(true);}}}/><output>{v.toFixed(2)}</output></label>;
 const chips=(labels:string[])=> <div className="story-options">{labels.map((label,i)=><button key={label} aria-pressed={mode===i} onClick={()=>act(i)}>{label}</button>)}</div>;
 let art:React.ReactNode=null,controls:React.ReactNode=null,extra='',stats:React.ReactNode=null;
 if(kind==='tools'){
  const labels=['片段描述','片段问答','视频裁剪'];controls=chips(labels);extra=mode===0?'示例返回：一辆小车通过闸门。':mode===1?'示例问题：什么通过了闸门？返回：小车。':'返回视觉片段，可继续检查通过的起止时刻。';
  art=<><Film x={30} y={22} w={270} h={175} time={42+24*phase}/><Tag x={165} y={221} text="42–66 秒"/><path d="M322 109 C383 109 362 220 425 220" stroke={C.line} strokeWidth="3" fill="none"/>
   {mode<2?<g opacity={reveal} transform={'translate('+mix(-45,0,reveal)+' 0)'}><Sheet x={409} y={134} w={280} h={157}><T x={140} y={38} size={22} color={C.muted}>{labels[mode]+' · 文字'}</T><T x={140} y={90} size={26}>{mode===0?'小车通过闸门':'答案：小车'}</T><T x={140} y={126} size={19} color={C.muted}>{mode===0?'概括动作内容':'回答指定问题'}</T></Sheet></g>:
   [50,54,58].map((t,i)=><g key={t} opacity={clip((phase-.25-i*.1)*5)} transform={'translate('+(341+i*117)+' '+mix(60,153,clip((phase-.25-i*.1)*4))+')'}><Film x={0} y={0} w={112} h={135} time={t}/></g>)}
   <T x={165} y={295} size={22} color={C.blue}>同一片段</T><T x={550} y={328} size={23} color={C.green}>{mode===2?'视觉内容继续进入推理':'主模型读到文字返回'}</T></>;
 }
 if(kind==='runtime'){
  const labels=['合法裁剪','反向时间','直接回答'];controls=chips(labels);
  const valid=mode===0,answer=mode===2,q=clip((phase-.3)/.5);
  art=<><T x={360} y={33} size={24}>{answer?'答案：小车通过闸门':valid?'请求：开始42秒，结束66秒':'请求：开始66秒，结束42秒'}</T>
   <rect x="48" y="74" width="624" height="103" rx="12" fill="#e4ebe4"/>
   {Array.from({length:8},(_,i)=><Film key={i} x={53+i*77} y={79} w={74} h={91} time={7.5+i*15}/>)}
   {!answer&&<g><rect x="266.4" y="70" width="124.8" height="111" rx="7" fill={valid?C.green+'16':C.red+'16'} stroke={valid?C.green:C.red} strokeWidth="3"/><path d={valid?'M266.4 70V53M391.2 70V53':'M277 83L380 168M380 83L277 168'} stroke={valid?C.green:C.red} strokeWidth="3"/></g>}
   {valid?<g transform={'translate('+mix(266.4,196,q)+' '+mix(74,213,q)+')'} opacity={q}><Film x={0} y={0} w={145} h={129} time={52+6*phase}/><Film x={164} y={0} w={145} h={129} time={58+6*phase}/></g>:
   <g opacity={reveal}><Sheet x={160} y={222} w={400} h={103} color={answer?'#eef6ef':'#fff0ee'}><T x={200} y={39} color={answer?C.green:C.red}>{answer?'本轮结束':'无法裁剪：起点晚于终点'}</T><T x={200} y={77} size={21} color={C.muted}>{answer?'不再提取新帧':'返回错误，不返回画面'}</T></Sheet></g>}
   </>;extra=valid?'选中的时间段从录像带中被取出，作为新的视觉结果返回。':answer?'证据足够时，可以直接结束；调用工具不是必经步骤。':'错误返回不会自动变成合法请求，也不能保证后续一定修复。';
 }
 if(kind==='training'){
  const names=['基础 SFT · 54k','基础 DGRPO · 94k','工具 SFT · 18k','工具 DGRPO · 16k'],rl=mode%2===1,tool=mode>1;controls=chips(names);
  art=<><Tag x={107} y={30} text={rl?'自主尝试':'示范轨迹'}/><T x={419} y={30} size={23}>{tool?'学习带工具的推理':'学习基本视频推理'}</T>
   {rl?<>{Array.from({length:8},(_,i)=>{const y=81+i*31,good=i%3!==0,end=clip((phase-i*.024)*1.65);return <g key={i}><path d={'M52 192 C160 192 142 '+y+' 270 '+y+' S399 '+y+' 515 '+y} fill="none" stroke={good?C.green:C.orange} strokeWidth="3" pathLength="1" strokeDasharray="1" strokeDashoffset={1-end}/><circle cx={mix(53,515,end)} cy={mix(192,y,end)} r="5" fill={good?C.green:C.orange}/><text x="545" y={y+7} fontSize="20" fill={good?C.green:C.orange} opacity={clip((phase-.45)*5)}>{tool?(good?'回看 · 有效':'回看 · 不足'):(good?'回答 · 较好':'回答 · 待改')}</text></g>;})}<T x={112} y={337} size={21}>同一道题</T><T x={550} y={337} size={21}>八条候选 · 示例反馈</T></>:
   <>{[0,1,2].map(i=><g key={i} opacity={clip((phase-i*.16)*5)} transform={'translate(0 '+mix(25,0,clip((phase-i*.16)*5))+')'}><Sheet x={26+i*232} y={77} w={213} h={228}><T x={106} y={33} size={22}>{[tool?'请求':'观察',tool?'新帧':'推理','回答'][i]}</T>{((i===1&&tool)||(i===0&&!tool))?<Film x={16} y={68} w={181} h={133} time={tool?52+phase*6:42+phase*24}/>:<><T x={106} y={105} size={21}>{i===0?(tool?'回看42–66秒':'小车在闸门前'):i===1?'比较前后位置':'小车通过闸门'}</T><T x={106} y={154} size={20} color={C.muted}>{i===0?'读取示范内容':i===1?'连接已有证据':'形成完整轨迹'}</T></>}</Sheet></g>)}</>}
  </>;extra=rl?'曲线表示不同生成轨迹；比较反馈用于策略学习，不是只选一条胜出答案。':'内容按真实顺序展开：先阅读示范，再学习相应的推理或工具行为。';
 }
 if(kind==='filter'){
  const arrays=[[1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0],[.4,.41,.42,.4,.43,.41,.42,.4],[0,1,0,1,1,0,1,0]],values=arrays[mode],delta=Math.max(...values)-Math.min(...values),keep=delta>.05;
  controls=chips(['全部成功','全部失败','几乎相同','明显不同']);
  art=<><T x={360} y={29}>同一题的八次奖励</T><path d="M80 140H640L469 227V251H251V227Z" fill="#e7eee7" stroke={C.line} strokeWidth="2"/><T x={360} y={207} size={23}>极差 {delta.toFixed(2)} {keep?'>':'≤'} 0.05</T>
   <rect x="53" y="230" width="280" height="129" rx="13" fill="#e1f0e7" stroke={C.green}/><T x={193} y={251} size={21} color={C.green}>保留整道题</T>
   <rect x="386" y="230" width="280" height="129" rx="13" fill="#f7e8e5" stroke={C.red}/><T x={526} y={251} size={21} color={C.red}>过滤整道题</T>
   {values.map((v,i)=>{const move=clip((phase-.42)*2.8),x=mix(213+(i%4)*76,(keep?77:410)+(i%4)*59,move),y=mix(49+Math.floor(i/4)*68,271+Math.floor(i/4)*43,move),scale=mix(1,.63,move);return <g key={i} transform={'translate('+x+' '+y+') scale('+scale+')'}><rect width="62" height="62" rx="8" fill="#fff" stroke={keep?C.green:C.blue}/><T x={31} y={18} size={15} color={C.muted}>{'#'+(i+1)}</T><T x={31} y={42} size={22}>{v.toFixed(2)}</T></g>;})}</>;
  extra='最高 '+Math.max(...values).toFixed(2)+' − 最低 '+Math.min(...values).toFixed(2)+' = '+delta.toFixed(2)+'；'+(keep?'保留这道题的训练样本。':'过滤这道题的训练样本。');stats=<span data-filter-range={delta} data-filter-keep={keep}/>;
 }
 if(kind==='architecture'){
  art=<VisualReturnScene phase={phase}/>;
  extra='沿新帧与彩色表示的移动路径，观察裁剪、视觉编码、合并投影和上下文接入。块数与大小只作示意，不对应实际 token 数量或特征维度。';
 }
 if(kind==='task-reward'){
  const q=shared?.value??(manual?value:Math.round(mix(.1,.85,p)*100)/100),a=clip((q-.2)/.6),b=clip(q/.5);controls=range('定位 IoU',0,1,.01,q);
  const width=180,offset=width*(1-q)/(1+q);
  art=<><T x={46} y={28} anchor="start" size={22}>相同的区间重叠</T><rect x="67" y="59" width={width} height="24" rx="7" fill={C.blue}/><rect x={67+offset} y="96" width={width} height="24" rx="7" fill={C.orange}/><T x={538} y={86} size={38}>{'IoU '+q.toFixed(2)}</T>
   {[{name:'短视频',v:a,low:.2,high:.8,color:C.blue},{name:'长 VidCh',v:b,low:0,high:.5,color:C.green}].map((r,i)=><g key={r.name}><T x={111} y={185+i*109} size={24}>{r.name}</T><path d={'M226 '+(184+i*109)+'H561'} stroke={C.line} strokeWidth="10" strokeLinecap="round"/><path d={'M'+(226+r.low*335)+' '+(184+i*109)+'H'+(226+r.high*335)} stroke={r.color} strokeWidth="10" strokeLinecap="round"/>
   {[0,r.low,r.high,1].filter((v,i,a)=>a.indexOf(v)===i).map(n=><T key={n} x={226+n*335} y={215+i*109} size={18} color={C.muted}>{n.toFixed(1)}</T>)}
   <path d={'M'+(226+q*335-9)+' '+(160+i*109)+'l9 13 9-13Z'} fill={C.orange}/><T x={644} y={185+i*109} size={32} color={r.color}>{r.v.toFixed(3)}</T></g>)}</>;
  extra='IoU='+q.toFixed(2)+'；短视频奖励='+a.toFixed(3)+'，长 VidCh 奖励='+b.toFixed(3)+'。箭头读的是相同 IoU，两把尺的有效区间不同。';
  stats=<span data-iou={q} data-short-reward={a} data-long-reward={b}/>;
 }
 if(kind==='sample-reward'){
  const d=shared?.value??(manual?value:1.5),w=.5+.5*clip(2-d),spread=Math.min(.3,d,2-d),vals=Array.from({length:8},(_,i)=>d+(i%2?1:-1)*spread),pass=clip((phase-.38)/.35);controls=range('样本平均奖励 D',0,2,.02,d);
  art=<><T x={360} y={31} size={25}>{'D = '+d.toFixed(2)+'     w = '+w.toFixed(3)}</T><rect x="53" y="166" width="614" height="62" rx="16" fill={C.orange+'20'}/><T x={360} y={197} color={C.orange}>同组奖励统一乘以 w</T>
   {vals.map((v,i)=>{const y=mix(101,288,pass),r=24*Math.sqrt(Math.max(0,v)/2)*mix(1,Math.sqrt(w),pass);return <g key={i}><circle cx={72+i*82} cy={y} r={r} fill={i%2?C.green:C.blue} opacity=".85"/><T x={72+i*82} y={y+43} size={20}>{(v*mix(1,w,pass)).toFixed(2)}</T></g>;})}
   </>;extra='穿过折扣区前：均值 '+d.toFixed(2)+'；折扣后：均值 '+(d*w).toFixed(3)+'。圆的面积表示奖励大小，最低权重为0.5。';stats=<span data-mean={d} data-weight={w} data-weighted-mean={d*w}/>;
 }
 if(kind==='results'){
  const start=manual?Math.round(value):Math.round(mix(22,50,p)),inter=Math.max(0,Math.min(start+20,70)-Math.max(start,50)),union=40-inter,q=inter/union,pass=q>=.5,x=(v:number)=>40+v*7;controls=<label className="story-range"><span>预测起点（秒）</span><input aria-label="示例预测起点" type="range" min="20" max="70" step="1" value={start} onChange={e=>{setValue(+e.target.value);setManual(true);}}/><output>{start}</output></label>;
  art=<><T x={48} y={36} anchor="start" size={23}>参考：50–70秒</T><path d="M40 78H670M40 150H670" stroke={C.line} strokeWidth="8"/><rect x={x(50)} y={63} width="140" height="30" rx="7" fill={C.blue}/><T x={48} y={116} anchor="start" size={23}>{'预测：'+start+'–'+(start+20)+'秒'}</T><rect x={x(start)} y={135} width="140" height="30" rx="7" fill={C.orange}/>
   {inter>0&&<rect x={x(Math.max(50,start))} y="57" width={inter*7} height="114" rx="5" fill={C.green+'25'} stroke={C.green}/>}
   <g transform={'translate(172 266)'}><circle r="61" fill="#fff" stroke={C.line} strokeWidth="9"/><circle r="61" fill="none" stroke={C.green} strokeWidth="9" pathLength="100" strokeDasharray={q*100+' 100'} transform="rotate(-90)"/><T x={0} y={-7} size={32}>{q.toFixed(3)}</T><T x={0} y={28} size={20}>IoU</T></g>
   <Sheet x={326} y={212} w={339} h={118} color={pass?'#e5f2e9':'#fff4e9'}><T x={170} y={42} size={27} color={pass?C.green:C.orange}>{pass?'✓ 达到0.5':'尚未达到0.5'}</T><T x={170} y={85} size={21}>一次阈值判断</T></Sheet></>;
  extra='交集 '+inter+' 秒 ÷ 并集 '+union+' 秒 = '+q.toFixed(3)+'。这是构造的单例，不是某个基准的实际预测。';stats=<span data-example-iou={q} data-threshold-pass={pass}/>;
 }
 if(kind==='ablations'){
  controls=chips(['保留工具示范','省略工具示范']);const tool=mode===0;
  art=<><path d="M49 62Q182 37 351 63Q533 37 670 62V310Q520 282 351 310Q180 282 49 310Z" fill="#fff" stroke={C.line} strokeWidth="2"/><path d="M351 63V310" stroke={C.line} strokeWidth="3"/>
   <T x={201} y={92} size={23}>已有基础示范</T><T x={510} y={92} size={23}>{tool?'加入工具示范':'未加入工具示范'}</T>
   {['读懂问题','观察视频','推理并回答'].map((txt,i)=><g key={txt} opacity={clip((phase-i*.1)*4)}><circle cx="91" cy={148+i*57} r="13" fill={C.blue+'15'}/><T x={210} y={148+i*57} size={22}>{txt}</T></g>)}
   {tool?<>{['请求42–66秒','接收新的片段','继续推理回答'].map((txt,i)=><g key={txt} opacity={clip((phase-.16-i*.13)*5)}><circle cx="390" cy={148+i*57} r="13" fill={C.green+'20'}/><T x={522} y={148+i*57} size={22} color={C.green}>{txt}</T></g>)}</>:<><T x={510} y={175} size={23} color={C.muted}>没有这一类轨迹</T><T x={510} y={218} size={20} color={C.muted}>工具用法缺少示范</T></>}
   <path d={'M351 62Q'+mix(652,355,p)+' 6 '+mix(670,354,p)+' 63V310Q'+mix(520,354,p)+' 282 351 310Z'} fill="#e9eee4" opacity={1-p} stroke={C.line}/>
   <T x={360} y={346} size={21} color={C.muted}>训练条件示意 · 不是模型输出实录</T></>;
  extra=tool?'含调用、返回与继续回答的示范，把工具行为接入完整轨迹。':'缺少工具示范不等于逻辑上绝对不能调用；是否学会仍需用实验结果检查。';
 }
 if(kind==='limits'){
  controls=chips(['声音线索','空间目标','多轮成本']);
  art=mode===0?<><Film x={36} y={44} w={285} h={192} time={42+24*phase}/><Tag x={178} y={273} text="视觉进入"/>
   <g><T x={526} y={48} size={25}>声音尚未接入</T>{Array.from({length:19},(_,i)=><rect key={i} x={386+i*14} y={145-(12+Math.abs(Math.sin(phase*Math.PI*6+i*.7))*47)} width="7" height={24+Math.abs(Math.sin(phase*Math.PI*6+i*.7))*94} rx="3" fill={C.blue} opacity=".35"/>)}<circle cx="520" cy="146" r="63" fill="#fff" fillOpacity=".55" stroke={C.red} strokeWidth="4"/><path d="M475 101L565 191" stroke={C.red} strokeWidth="5"/><T x={525} y={268} size={23} color={C.red}>无法只凭画面听见鸣笛</T></g></>:
   mode===1?<><Film x={37} y={33} w={323} h={236} time={52+6*phase}/><rect x={mix(138,193,phase)} y="132" width="65" height="44" rx="6" stroke={C.orange} strokeDasharray="7 5" strokeWidth="3" fill="none"/><T x={199} y={304} size={21} color={C.orange}>空间目标示意</T>
   <T x={538} y={74}>时间范围</T><path d="M407 125H668" stroke={C.line} strokeWidth="14" strokeLinecap="round"/><rect x="462" y="110" width="149" height="30" rx="8" fill={C.green}/><T x={537} y={177} size={27} color={C.green}>52–58秒</T><T x={537} y={242} size={22}>定位时间 ≠ 定位轮廓</T><T x={537} y={283} size={19} color={C.muted}>虚线框不是检测输出</T></>:
   <><T x={360} y={34}>增加一轮，就多处理一段视觉证据</T>{[0,1,2].map((n,i)=>{const on=clip((phase-i*.22)*5);return <g key={n} opacity={i===0?1:on}><Sheet x={26+i*232} y={85} w={211} h={202}><T x={105} y={31} size={22}>{n===0?'已有观察':'第'+n+'轮回看'}</T><Film x={15} y={59} w={180} h={129} time={n===0?30:50+phase*10}/></Sheet>{i>0&&<path d={'M'+(246+(i-1)*232)+' 185h10'} stroke={C.green} strokeWidth="3"/>}</g>;})}<T x={360} y={330} size={22} color={C.orange}>新请求 ＋ 工具执行 ＋ 新一轮处理</T></>;
  extra=['声音波形仅说明缺失的输入通道，不是闸口录像的真实音轨。','时间工具返回片段，不直接输出对象每一帧的精确空间轮廓。','动画表达新增工作，不把播放时长当成实际推理耗时；最多两轮也不是每题必须两轮。'][mode];
 }
 if(!story)return null;
 return <section ref={ref} className="illustrated-story" data-animation={'story-'+kind} data-frame={Math.floor(clock/40)} data-step={s}>
  <div className="story-heading"><div><span className="story-kicker">动态演示</span><h3>{story.title}</h3></div><div className="story-playback"><button aria-label="重播过程动画" onClick={()=>{if(shared)shared.replay();else{setClock(0);setPlaying(true);}}}>重播</button><button aria-label={playing?'暂停过程动画':'播放过程动画'} onClick={()=>{if(shared)shared.toggle();else setPlaying(v=>!v);}}>{playing?'暂停':'播放'}</button></div></div>
  {controls&&<div className="story-controls">{controls}</div>}
  {shared&&<p className="reward-sync-note">调整输入或播放进度，展开的曲线与数值会同步变化。</p>}
  <div className="story-stage"><svg viewBox="0 0 720 370" role="img" aria-label={story.title}>{art}</svg></div>
  <div className="story-steps" aria-label="动画步骤">{story.steps.map((label,i)=><button key={label} className={s===i?'current':''} aria-pressed={s===i} onClick={()=>seek(i)}><span>{i+1}</span>{label}</button>)}</div>
  <p className="story-step-note"><strong>{story.steps[s]}：</strong>{story.notes[s]}</p>
  <p className="story-caption">{extra}</p>{stats}
 </section>;
}
