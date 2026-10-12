import React, { useCallback, useEffect, useState } from 'react';
import { C, ViperCanvas, clearScene, box, line, label, drawLoupe, drawRuler } from './viper-kit';
import { LabStyles, CodePane, Stepper, PaperPhoto, usePaperImage, drawPhoto } from './lab-kit';

export const pizzaProgram = [
 'def execute_command(image):',
 '    patch = ImagePatch(image)',
 '    pizza_patches = patch.find("pizza")',
 '    pizza_patches.sort(key=lambda pizza: pizza.compute_depth())',
 '    return pizza_patches[0]',
];
const candidates = [{id:'A',depth:0.7,name:'pizza-a'},{id:'B',depth:0.3,name:'pizza-b'}];
const labels = ['读取问题','选择检测','选择深度','确定排序','返回首项','函数就绪'];
const explanations = [
 '查询中的“披萨”给出检测对象，“最前面”要求比较候选的相对深度。',
 'find("pizza") 返回区域列表；生成时只写下调用，并没有检测图像。',
 'compute_depth() 为每个候选提供相对深度数值，稍后才会运行 MiDaS。',
 'Python 的 sort 使用每个候选的深度作为键，按升序排列。',
 '取排序后列表的首项，函数返回 ImagePatch，不是披萨名称。',
 '程序已确定。图像到达 Python 执行器后，才产生区域和数值。',
];
export const PizzaProgramLab: React.FC = () => {
 const [step,setStep] = useState(0);
 return <div className="vlab"><LabStyles/>
  <div className="lab-formula"><strong>z = π(q)</strong><span>q：问题　π：程序生成器 Codex　z：Python 程序</span><small>公式省略固定的接口规范上下文；实际提示包含问题与 API specification。</small></div><div className="lab-flow"><span>问题 q + 接口规范</span><b>→</b><span>Codex · π</span><b>→</b><span>程序 z</span></div><p className="lab-question">查询：返回图中<span style={{color:C.blue,fontWeight:700}}>最前面的披萨</span>区域。</p>
  <Stepper compact labels={labels} step={step} onChange={setStep}/>
  <div className="lab-columns"><CodePane lines={pizzaProgram} active={[step===0?0:step===1?2:step<=3?3:4]} revealed={step===0?2:step===1?3:step<=3?4:5} title="等价简化代码 · Figure 3 生成中的函数"/>
   <div><p className="lab-heading">本步确定什么？</p><div className={`lab-output ${step===5?'is-good':'is-active'}`} aria-live="polite">{explanations[step]}</div><p className="lab-caption">输入到 Codex 的是文本查询与 API 规范。当前展示的是生成中的代码；尚未产生检测结果或深度值。</p><details><summary>相关工作：模块化推理此前怎样实现？</summary><ul><li>神经模块网络：论文讨论的方法需要程序监督，并训练感知模块。</li><li>VisProg：基于示例生成受限的视觉伪代码。</li><li>ViperGPT：根据接口规范生成通用 Python，支持控制流与数学运算。</li></ul><p className="lab-caption">依据论文§2与§3.1；是方法定位摘要，不代表所有模块网络都采用同一训练方式。</p></details></div>
  </div>
 </div>;
};
export const PizzaExecutionLab: React.FC = () => {
 const [step,setStep]=useState(0),[running,setRunning]=useState(false),[started,setStarted]=useState(false);
 const [sorting,setSorting]=useState(false);
 const [depths,setDepths]=useState([.7,.3]),[detected,setDetected]=useState([true,true]);
 const [reverse,setReverse]=useState(false),[prediction,setPrediction]=useState<string|null>(null);
 const photo=usePaperImage('pizza'),a=usePaperImage('pizza-a'),b=usePaperImage('pizza-b');
 const patches=candidates.map((v,i)=>({...v,depth:depths[i]})).filter((_,i)=>detected[i]);
 const sorted=[...patches].sort((a,b)=>(reverse?-1:1)*(a.depth-b.depth));
 const ordered=step>=4?sorted:patches;
 const result=sorted[0]?.id??'程序报错';
 const changed=depths[0]!==.7||depths[1]!==.3||!detected.every(Boolean)||reverse;
 const program=reverse?reversePizzaProgram:pizzaProgram;
 const invalidate=()=>{setRunning(false);setSorting(false);setStarted(false);setStep(0);setPrediction(null);};
 const restore=()=>{invalidate();setDepths([.7,.3]);setDetected([true,true]);setReverse(false);};
 useEffect(()=>{if(!running)return;if(step===5){setRunning(false);return;}const timer=window.setTimeout(()=>{setSorting(step===3);setStep(s=>s+1);},900);return()=>window.clearTimeout(timer);},[running,step]);
 useEffect(()=>{if(!sorting)return;const timer=window.setTimeout(()=>setSorting(false),700);return()=>window.clearTimeout(timer);},[sorting]);
 const execute=()=>{setStarted(true);setSorting(false);setStep(0);setRunning(true);};
 const singleStep=()=>{const next=Math.min(5,step+1);setRunning(false);setStarted(true);setSorting(next===4);setStep(next);};
 const messages=[
  '图像 x 进入执行器。ImagePatch(image) 包装整张图，Codex 不在这里看图。',
  `find 返回 ${patches.length} 个区域，列表是 [${patches.map(v=>v.id).join(', ')}]。${patches.length?'下一步只读取检出的区域。':'没有候选时，排序不会凭空产生对象。'}`,
  detected[0]?`读取 A 的深度键：${depths[0].toFixed(2)}。数值越小，程序认为越靠前。`:'A 被漏检：不读取 A 的深度。',
  detected[1]?`读取 B 的深度键：${depths[1].toFixed(2)}。下一步比较这些数值。`:'B 被漏检：即使照片里存在，也不会进入排序。',
  `${reverse?'降序（故意修改的代码）':'升序'}排列后：[${sorted.map(v=>v.id).join(', ')}]。${sorted.length===2&&depths[0]===depths[1]?'键相同，保持检测列表中原来的顺序。':''}`,
  sorted.length?`取列表首项，返回 ${result} 的 ImagePatch。${result==='B'?'与这张照片的前方区域一致。':'这张原图前方仍是 B；检查被改动的感知值或排序代码。'}`:'空列表没有第0项：原程序在 return 处产生 IndexError。需要额外设计空列表处理；本例没有偷偷补上。',
 ];
 const draw=useCallback((ctx:CanvasRenderingContext2D,time:number)=>{
  clearScene(ctx,1080,280);drawPhoto(ctx,photo,20,20,440,240);
  if(step>=1){ctx.lineWidth=4;ctx.setLineDash(detected[0]?[]:[7,5]);ctx.strokeStyle=detected[0]?step===2?C.orange:C.blue:C.red;ctx.strokeRect(187,80,165,52);ctx.setLineDash(detected[1]?[]:[7,5]);ctx.strokeStyle=detected[1]?step===3?C.orange:C.blue:C.red;ctx.strokeRect(46,140,308,112);ctx.setLineDash([]);label(ctx,'A',193,87,'white',20);label(ctx,'B',53,153,'white',20);}
  if(step===0){[a,b].forEach((image,i)=>{const x=550+260*i;box(ctx,x,45,215,190,'#f8f9fb',C.border);ctx.save();ctx.globalAlpha=.38;drawPhoto(ctx,image,x+8,65,199,125);ctx.restore();});label(ctx,'等待 find 产生候选',625,258,C.muted,22);return;}
  const progress=step===4&&sorting?Math.min(1,time/650):step>=4?1:0;
  const eased=progress*progress*(3-2*progress);
  patches.forEach((item,i)=>{const target=sorted.findIndex(v=>v.id===item.id);const x=550+260*(i+(target-i)*eased);const winner=step===5&&item.id===result;box(ctx,x,45,215,190,'white',winner?(result==='B'?C.green:C.orange):(step===2&&item.id==='A')||(step===3&&item.id==='B')?C.orange:C.border);drawPhoto(ctx,item.id==='A'?a:b,x+8,58,199,125);if((step>=2&&item.id==='A')||(step>=3&&item.id==='B')){ctx.fillStyle=C.blue;ctx.fillRect(x+20,205,175*item.depth,10);}if(winner){ctx.fillStyle=result==='B'?'#228d5c22':'#f07e4722';ctx.fillRect(x,45,215,190);}});
 },[step,sorting,depths,detected,reverse,photo,a,b]);
 return <div className="vlab"><LabStyles/><p className="lab-question">先预测返回 A、B，还是程序报错；再执行验证。试着改动输入，观察答案为什么变。</p>
  <div className="lab-main-controls"><div className="lab-stage" role="group" aria-label="预测披萨程序结果">{['A','B','程序报错'].map(id=><button type="button" key={id} aria-pressed={prediction===id} onClick={()=>setPrediction(id)}>我预测：{id}</button>)}</div>
  <div className="lab-stage"><button type="button" className="lab-primary" onClick={execute}>执行并验证</button>{started&&<><button type="button" disabled={!running&&(!started||step===5)} onClick={()=>setRunning(v=>!v)}>{running?'暂停执行':'继续执行'}</button><button type="button" disabled={step===5} onClick={singleStep}>单步执行</button><button type="button" onClick={restore}>恢复原文设置</button></>}</div></div>
  <div style={{position:'relative'}}><ViperCanvas draw={draw} animate={sorting} ariaLabel={step===0?"真实裁片预览，等待find产生候选，不表示已完成检测":`当前步骤${step+1}，检测${patches.length}个区域，列表${ordered.map(x=>x.id).join('、')}${step===5?`，返回${result}`:''}`}/>{step>=1&&patches.map((item,i)=><span key={item.id} className="pizza-patch-label" style={{left:`${(565+260*(step>=4?sorted.findIndex(v=>v.id===item.id):i))/1080*100}%`}}>{item.id}{(item.id==='A'&&step>=2)||(item.id==='B'&&step>=3)?` · ${item.depth.toFixed(2)}`:''}</span>)}</div>
  <style>{`.vlab .pizza-patch-label{position:absolute;top:18%;background:white;color:#27446e;padding:0 5px;font-weight:700;font-size:clamp(14px,1.4vw,18px);transition:left .65s cubic-bezier(.33,0,.67,1)}`}</style>
  <div className="lab-live-strip" role="status" aria-live="polite"><b>{['等待执行','检测区域','读取 A 的键','读取 B 的键','排序候选','程序结束'][step]}</b><span>{step===0?'先选择输入，再执行程序':step===5?sorted.length?`返回 ${result} · 键=${sorted[0].depth.toFixed(2)}${result==='A'?'；原照片前方仍为B':''}`:'IndexError · 空列表无法取首项':step>=4?`[${sorted.map(v=>`${v.id}: ${v.depth.toFixed(2)}`).join(', ')}]`:`[${patches.map(v=>v.id).join(', ')}]`}</span></div>
  <details className="lab-experiment"><summary>教学实验：修改深度、漏检与排序</summary><div className="lab-columns">{candidates.map((v,i)=><div key={v.id}><label className="lab-switch"><input type="checkbox" checked={detected[i]} onChange={e=>{invalidate();setDetected(old=>old.map((x,j)=>j===i?e.target.checked:x));}}/> 检出区域 {v.id}（{i===0?'后方':'前方'}）</label><label htmlFor={`pizza-depth-${v.id}`}>深度键 {v.id}：<strong>{depths[i].toFixed(2)}</strong></label><input id={`pizza-depth-${v.id}`} aria-label={`区域${v.id}的教学深度键`} type="range" min="0" max="1" step="0.05" value={depths[i]} disabled={!detected[i]} onKeyDown={e=>e.stopPropagation()} onChange={e=>{invalidate();setDepths(old=>old.map((x,j)=>j===i?Number(e.target.value):x));}} className="lab-range"/></div>)}</div><label className="lab-switch"><input type="checkbox" checked={reverse} onChange={e=>{invalidate();setReverse(e.target.checked);}}/> 教学实验：把升序改成降序（reverse=True）</label><p className="lab-caption">{changed?'当前为教学实验。原照片没变；只改变预设的模型返回值、检测列表或排序代码。':'Figure 3 执行示例值：A=0.7、B=0.3；升序返回B。'}相对深度不是米数。</p></details>
  <details><summary>定位执行步骤（当前 {step+1} / 6）</summary><Stepper labels={['输入图像','检测披萨','读取 A 深度','读取 B 深度','排序列表','返回区域']} step={step} onChange={value=>{setRunning(false);setSorting(value===4);setStarted(value>0);setStep(value);}}/></details>
  <div className="lab-columns"><CodePane lines={program} active={[step===0?1:step===1?2:step<5?3:4]} title={reverse?'教学实验代码 · 降序排序':'等价简化代码 · Figure 3 逻辑（升序排序）'}/>
   <div><div className={`lab-output ${step===5&&sorted.length&&result==='B'?'is-good':'is-active'}`} aria-live="polite"><b>{step<5?'执行记录':'执行结果'}</b><span className="lab-value">{step===0?'等待检测':step===5?sorted.length?`返回 ${result}`:'IndexError：空列表':`[${ordered.map(x=>x.id).join(', ')}]`}</span>{messages[step]}</div>{step===5&&prediction&&<p className="lab-verdict" data-correct={prediction===result}>{prediction===result?'预测正确。':'预测与程序结果不同。'}你的选择：{prediction}；程序结果：{result}。</p>}
    {step>=2&&<div className="lab-table-scroll"><table><thead><tr><th>候选</th><th>深度键</th><th>列表位置</th></tr></thead><tbody>{ordered.map((v,i)=><tr key={v.id}><td>{v.id}</td><td>{v.id==='A'||step>=3?v.depth:'等待读取'}</td><td>{i}</td></tr>)}</tbody></table></div>}
   </div></div>
  <p className="lab-caption">原图与裁片来自图3，覆盖框近似。网页执行确定的列表与排序演示，不调用真实模型或Python。</p>
 </div>;
};
export const reversePizzaProgram = [
 'def execute_command(image):',
 '    patch = ImagePatch(image)',
 '    pizza_patches = patch.find("pizza")',
 '    pizza_patches.sort(key=lambda pizza: pizza.compute_depth(), reverse=True)',
 '    return pizza_patches[0]',
];
const tools=[
 {name:'find',zh:'检测对象',model:'GLIP',input:'ImagePatch + 文本 "pizza"',type:'list[ImagePatch]',value:'[A, B]',photo:'pizza',patch:'pizza-b',code:'pizza_patches = patch.find("pizza")',why:'检测返回区域列表；之后才能计数、筛选和排序。',source:'图3：实际披萨候选；A、B 为教程标记。'},
 {name:'exists',zh:'检查存在',model:'GLIP',input:'第25帧 + 文本 "boy"',type:'bool',value:'True',photo:'after-25',patch:'boy-patch',code:'has_boy = frame.exists("boy")',why:'布尔值参与事件条件，不能把它当作区域列表。',source:'图6：事件帧存在男孩；这里只展示 exists 子判断。'},
 {name:'verify_property',zh:'检查属性',model:'X-VLM',input:'煎饼区域 + 对象 "pancake" + 属性 "brown"',type:'bool',value:'True',photo:'pancake',patch:'pancake-patch',code:'is_brown = pancake.verify_property("pancake", "brown")',why:'属性预测交给模型，多个属性随后由 Python 的 and 组合。',source:'图4：棕色属性为 True。'},
 {name:'best_image_match',zh:'选择区域',model:'X-VLM',input:'候选区域列表 + “木书架”',type:'ImagePatch',value:'木书架区域',photo:'bookcase',patch:'bookcase-patch',code:'selected = best_image_match(bookcases, "wooden bookcase")',why:'从已检测的候选中，选与文字描述最匹配的区域。',source:'§4.1 / 图4：这里概括其用途，不补造相似度数值。'},
 {name:'compute_depth',zh:'估计深度',model:'MiDaS',input:'候选 B : ImagePatch',type:'float',value:'0.3',photo:'pizza',patch:'pizza-b',code:'depth = pizza_b.compute_depth()',why:'区域像素深度的中位数用作相对数值，可作为排序键。',source:'图3：0.3 是相对深度，无米制单位。'},
 {name:'simple_query',zh:'视觉问答',model:'BLIP-2',input:'玩具照片 + “这是什么玩具？”',type:'str',value:'bear',photo:'bear',patch:'bear',code:'toy = patch.simple_query("What is this toy?")',why:'图像问答先确定指代，答案文本还可用于知识查询。',source:'图5：对象识别输出 bear。'},
 {name:'llm_query',zh:'查询知识',model:'GPT-3',input:'文本：真的熊冬天做什么？',type:'str',value:'hibernate',photo:'bear',patch:'bear',code:'answer = llm_query("The real live version of bear does what in the winter?")',why:'此工具的输入是文本；旁边照片仅显示 bear 这个指代的来源。',source:'图5：知识答案 hibernate。'},
 {name:'select_answer',zh:'选择答案',model:'GPT-3',input:'场景文字 + 问题 + 选项列表',type:'str',value:'Sit on the ground',photo:'dog-end',patch:'dog-patch',code:'answer = select_answer(scene_info, question, possible_answers)',why:'根据文本场景信息与选项选择答案，不直接接收视频像素。',source:'图6：末帧狗的行为选择；中文为“坐在地上”。'},
 {name:'best_text_match',zh:'选择描述',model:'X-VLM',input:'图像块 + 候选描述列表',type:'str',value:'候选描述之一',photo:'bear',patch:'bear',code:'text = best_text_match(descriptions, patch)',why:'固定图像，从若干候选短语中选最匹配的一项。',source:'§4.1介绍此工具；论文未给出该照片的候选描述与分值，不补造。'},
 {name:'distance',zh:'计算距离',model:'Python 运算',input:'两个图像块的像素中心',type:'float',value:'369.5 像素',photo:'bookcase',patch:'bottle-patch',code:'distance = ((608.5 - 239.0)**2 + (100 - 100)**2)**0.5',why:'二维像素距离是确定运算，不需另一个训练模型。',source:'教学构造：横坐标借用图4，纵坐标均设为100；不是论文报告的对象距离。'},
];
export const distancePrograms = [
 ['from math import hypot','p1 = (239.0, 100.0)','p2 = (608.5, 100.0)','pixel_distance = hypot(p2[0]-p1[0], p2[1]-p1[1])'],
 ['from math import hypot','p1 = (239.0, 100.0)','p2 = (608.5, 250.0)','pixel_distance = hypot(p2[0]-p1[0], p2[1]-p1[1])'],
];
export const ApiToolboxLab:React.FC=()=>{
 const [selected,setSelected]=useState(0),[distanceMode,setDistanceMode]=useState(0);const tool=tools[selected];
 const deltaY=distanceMode===0?0:150;
 const distanceValue=Math.hypot(608.5-239,deltaY);
 const returnedValue=selected===9?`${distanceValue.toFixed(1)} 像素`:tool.value;
 const image=usePaperImage(tool.photo),patch=usePaperImage(tool.patch),pizzaA=usePaperImage('pizza-a'),bookcase=usePaperImage('bookcase-patch');
 const draw=(ctx:CanvasRenderingContext2D)=>{clearScene(ctx,1080,280);
 if(selected===9){
  drawPhoto(ctx,bookcase,30,25,265,215);drawPhoto(ctx,patch,330,25,140,215);
  line(ctx,580,20,580,255,C.muted,2);line(ctx,580,255,1060,255,C.muted,2);
  const ax=600+239*.6,bx=600+608.5*.6,ay=80,by=80+deltaY*.6;
  ctx.setLineDash([7,6]);line(ctx,ax,ay,bx,ay,C.orange,3);line(ctx,bx,ay,bx,by,C.orange,3);ctx.setLineDash([]);
  line(ctx,ax,ay,bx,by,C.blue,4);
  [[ax,ay,C.blue],[bx,by,C.green]].forEach(([x,y,color])=>{ctx.beginPath();ctx.arc(Number(x),Number(y),8,0,Math.PI*2);ctx.fillStyle=String(color);ctx.fill();});
  label(ctx,'A',ax-25,ay-20,C.blue,24);label(ctx,'B',bx+10,by+15,C.green,24);return;
 }
 drawPhoto(ctx,image,24,20,440,240);line(ctx,480,140,575,140,C.support,4);line(ctx,562,131,575,140,C.support,4);line(ctx,562,149,575,140,C.support,4);box(ctx,620,20,410,240,'white',C.green);drawPhoto(ctx,patch,635,35,180,205);if(tool.type==='bool'){ctx.beginPath();ctx.arc(915,128,34,0,Math.PI*2);ctx.fillStyle=C.green;ctx.fill();label(ctx,'True',883,129,'white',24);}else if(tool.type==='float'){ctx.fillStyle=C.blue;ctx.fillRect(846,187,150*(selected===4?.3:.74),18);label(ctx,selected===4?'0.3':'369.5',856,126,C.blue,28);}else if(tool.type==='str'){const value=selected===5?'bear':selected===6?'冬眠':selected===7?'坐在地上':'候选短语';label(ctx,value,845,130,C.blue,26);}else if(selected===0){drawPhoto(ctx,pizzaA,830,35,180,130);label(ctx,'A',911,201,C.blue,24);label(ctx,'B',716,235,C.green,24);}else{ctx.strokeStyle=C.green;ctx.lineWidth=5;ctx.strokeRect(640,40,170,195);}};
 return <div className="vlab"><LabStyles/><p className="lab-question">教程汇总的主要接口：选择工具，核对输入、返回类型与实现来源。</p>
 <div className="api-groups" aria-label="按能力选择API">{[{title:"感知",indices:[0,1,2,4]},{title:"匹配／简单问答",indices:[3,8,5]},{title:"知识／答案",indices:[6,7]},{title:"几何",indices:[9]}].map(g=><section key={g.title}><h5>{g.title}</h5><div className="lab-stage">{g.indices.map(i=><button type="button" key={tools[i].name} aria-pressed={i===selected} onClick={()=>setSelected(i)}><span className="lab-term">{tools[i].name}</span></button>)}</div></section>)}</div>
 {selected===9&&<div className="lab-stage" role="group" aria-label="选择教学中心坐标"><button type="button" aria-pressed={distanceMode===0} onClick={()=>setDistanceMode(0)}>同一水平线</button><button type="button" aria-pressed={distanceMode===1} onClick={()=>setDistanceMode(1)}>增加纵向差</button></div>}
 <ViperCanvas draw={draw} ariaLabel={selected===9?`教学坐标A(239,100)、B(608.5,${100+deltaY})，二维距离${distanceValue.toFixed(1)}像素`:`${tool.zh}：照片及相关区域，返回${returnedValue}，类型${tool.type}`}/>
 {selected===9&&<div className="lab-output" aria-live="polite">A：木书架区域；B：水瓶区域。教学中心分别设为 (239, 100) 和 (608.5, {100+deltaY})。<span className="lab-value">Δx = 369.5；Δy = {deltaY}；距离 = {distanceValue.toFixed(1)} 像素</span>右侧线段连接教学坐标；横纵差用橙色辅助线标出。它不是由照片测得的原文距离。</div>}
 <div className="lab-columns"><div><p className="lab-heading">接口规范告诉生成器</p><div className="lab-output">输入：{tool.input}<span className="lab-value">返回类型：{tool.type}</span>{tool.why}</div><CodePane lines={selected===9?distancePrograms[distanceMode]:[tool.code]} active={selected===9?[3]:[0]} title={selected===9?'教学坐标的二维距离计算':'接口用途示例 · 非完整 API 签名'}/></div>
 <div><p className="lab-heading">实现负责实际调用</p><div className="lab-output is-good" aria-live="polite">论文使用：<b>{tool.model}</b><span className="lab-value">{returnedValue}</span>{selected===9?'教学构造：横坐标借用图4，纵坐标由当前选项设定；不是论文报告的对象距离。':tool.source}</div><p className="lab-caption">右侧照片是返回区域或与返回值相关的视觉证据；文本工具只接收文字。图像预测采用论文已报告的值。</p></div></div>
 <details><summary>为什么接口说明与实现分开？</summary><p>论文§3.2把类型、说明与查询—代码示例放进提示，未把完整模型实现放入有限上下文。执行器通过这些接口调用实现；实现可替换，生成器仍使用接口契约。</p></details>
 </div>;
};
