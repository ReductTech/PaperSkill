import React, { useState } from 'react';
import { C } from './viper-kit';
import { LabStyles, CodePane, Stepper, PaperPhoto } from './lab-kit';
const program = ['def execute_command(image):','    image_patch = ImagePatch(image)','    pizzas = image_patch.find("pizza")','    pizzas.sort(key=lambda p: p.compute_depth())','    return pizzas[0]'];
const systemNodes = [
 {id:'q',name:'问题 q',x:95,y:35,input:'用户文字问题',output:'返回最前面的披萨',detail:'文字问题与固定的接口规范一起进入生成器；图像不是 Codex 的输入。'},
 {id:'spec',name:'接口规范',x:95,y:95,input:'API签名、用途与返回类型',output:'find、compute_depth 等调用说明',detail:'API specification给生成器读；它与执行阶段的API implementation分开。'},
 {id:'pi',name:'Codex · π',x:310,y:65,input:'问题 q + 接口规范',output:'Python 程序 z',detail:'生成器决定怎么做；这一阶段没有读取披萨像素或执行工具。'},
 {id:'z',name:'程序 z',x:540,y:65,input:'程序生成器的输出',output:'传给执行引擎的函数定义',detail:'代码已经生成，工具调用仍未发生。'},
 {id:'x',name:'视觉输入 x',x:165,y:240,input:'Figure 3 的披萨图像',output:'在 φ 中包装为 ImagePatch',detail:'视觉输入在执行阶段与程序汇合，没有指向 Codex 的依赖边。'},
 {id:'python',name:'Python 解释器',x:490,y:185,input:'x、z 与工具返回值',output:'调用工具、排序 [B,A]、取首项',detail:'Python 是执行引擎 φ 的组成部分，负责控制流与确定运算。'},
 {id:'impl',name:'API 实现',x:715,y:185,input:'解释器发起的 find / compute_depth 调用',output:'模型预测封装成区域与数值',detail:'API implementation在执行时实际调用底层模块；生成器只读规范。'},
 {id:'tools',name:'预训练模块',x:715,y:265,input:'API实现传入的图像区域',output:'GLIP → [A,B]；MiDaS → 0.7、0.3',detail:'底层模块负责感知；深度值来自图3执行记录，为相对值。'},
 {id:'r',name:'结果 r',x:980,y:185,input:'解释器返回的首项',output:'披萨 B 的 ImagePatch',detail:'r 可能是区域、文字或其他类型；本例返回前方披萨区域。'},
 {id:'phi',name:'执行引擎 φ',x:0,y:0,input:'视觉输入 x + 程序 z',output:'执行结果 r',detail:'φ 包含 Python 解释器、API实现及其调用的预训练模块；不是与Python并列的另一个组件。'},
];
const systemEdges=[
 {a:'q',b:'pi',d:'M 175 35 L 220 35 L 220 55 L 230 55'},
 {a:'spec',b:'pi',d:'M 175 95 L 220 95 L 220 75 L 230 75'},
 {a:'pi',b:'z',d:'M 390 65 L 460 65'},
 {a:'z',b:'python',d:'M 540 93 L 540 140 L 490 140 L 490 157'},
 {a:'x',b:'python',d:'M 245 240 L 330 240 L 330 185 L 410 185'},
 {a:'python',b:'impl',d:'M 570 175 L 635 175'},
 {a:'impl',b:'python',d:'M 635 195 L 570 195'},
 {a:'impl',b:'tools',d:'M 730 213 L 730 237'},
 {a:'tools',b:'impl',d:'M 700 237 L 700 213'},
 {a:'python',b:'r',d:'M 490 213 L 490 295 L 890 295 L 890 185 L 900 185'},
];
export function SystemLab(){
 const [selected,setSelected]=useState('phi');
 const node=systemNodes.find(n=>n.id===selected)!;
 return <div className="vlab"><LabStyles/><p className="lab-question">点选组件：规范给生成器，实现在执行引擎中工作。图像在哪里加入？</p>
 <p className="system-scroll-hint">窄窗口可在图中左右滚动，查看完整依赖。</p><div role="region" aria-label="完整架构" tabIndex={0} onKeyDown={e=>e.stopPropagation()} style={{overflowX:'auto'}}>
 <div className="system-graph" style={{position:'relative',width:"100%",height:310}}>
 <div style={{position:'absolute',left:'36%',top:110,width:'45%',height:200,background:'#edf7f0',border:`3px solid ${selected==='phi'?C.blue:C.green}`,borderRadius:8}}/>
 <svg viewBox="0 0 1080 310" preserveAspectRatio="none" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
 <defs><marker id="sys-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={C.blue}/></marker></defs>
 {systemEdges.map(e=><path key={e.a+e.b} d={e.d} fill="none" stroke={selected==='phi'||e.a===selected||e.b===selected?C.blue:C.border} strokeWidth={e.a===selected||e.b===selected?4:2} markerEnd="url(#sys-arrow)"/>)}</svg>
 {systemNodes.filter(n=>n.id!=='phi').map(n=><button key={n.id} type="button" aria-pressed={selected===n.id} onClick={()=>setSelected(n.id)} style={{position:'absolute',left:`${n.x/1080*100}%`,top:n.y,transform:'translate(-50%,-50%)',width:'14.8%',minHeight:54,fontSize:'clamp(12px,1.35vw,18px)',padding:'4px',color:C.text,background:selected===n.id?'#dce9f5':['q','spec','x'].includes(n.id)?'#edf3f8':['pi','z'].includes(n.id)?'#eaeaf7':n.id==='r'?'#dcefe1':'#f3f9f0',border:`2px solid ${selected===n.id?C.blue:C.border}`,borderRadius:6}}>{n.name}</button>)}
 <button type="button" aria-pressed={selected==='phi'} onClick={()=>setSelected('phi')} style={{position:'absolute',top:115,left:'37%',background:'#edf7f0',border:0,fontSize:18,color:C.green,fontWeight:700,cursor:'pointer'}}>执行引擎 φ</button>
 </div></div>
 <div className="lab-formula"><strong>z = π(q)　；　r = φ(x, z)</strong><small>π 的固定提示还包含 API 规范；φ 由解释器与接口实现构成。</small></div>
 <div className="lab-output is-active" role="status" aria-live="polite"><strong>{node.name}</strong><div>输入：{node.input}</div><div>输出：{node.output}</div><p style={{margin:'8px 0 0'}}>{node.detail}</p></div>
 <details><summary>展开执行示例：图像、代码与返回区域</summary><div className="lab-columns"><div style={{maxWidth:260}}><PaperPhoto name="pizza" alt="图3披萨输入"/><PaperPhoto name="pizza-b" alt="返回前方披萨B"/></div><CodePane lines={program} title="等价简化代码 · Figure 3 逻辑"/></div></details>
 </div>;
}

export function ContextLab(){
 const [country,setCountry]=useState<'US'|'UK'>('US');const isUK=country==='UK';
 const code=[`# Context: the picture was taken in the ${country}`,'cars = image.find("car")','for car in cars:',`    if car.horizontal_center ${isUK?'<':'>'} image.horizontal_center:`,'        return car','return None'];
 return <div className="vlab"><LabStyles/>
 <div className="lab-stage" role="group" aria-label="照片拍摄国家">{(['US','UK'] as const).map(c=><button type="button" key={c} aria-pressed={country===c} onClick={()=>setCountry(c)}>{c==='US'?'美国 US':'英国 UK'}</button>)}</div>
 <div className="lab-columns"><div><PaperPhoto name="car" alt="论文图8：汽车位于图像中心左侧"><div aria-hidden="true" style={{position:'absolute',left:isUK?0:'50%',top:0,bottom:0,width:'50%',background:'#f07e4720',border:'2px solid #f07e47'}}/><div className={`region ${isUK?'returned':''}`} style={{left:'10%',top:'3%',width:'39%',height:'92%'}}><span>car</span></div></PaperPhoto><div className={`lab-output ${isUK?'is-good':''}`} role="status"><strong>{country}：选择图像{isUK?'左':'右'}半侧</strong><span className="lab-value">{isUK?'返回 car':'返回 None'}</span><span>只重现图8中的相机视角。</span></div></div>
 <div className="is-experiment"><CodePane highlightOperators lines={[code[0],code[3],isUK?code[4]:code[5]]} active={[1]} lineNumbers={[1,4,isUK?5:6]} title="等价整理 · 当前条件与返回值"/><details><summary>完整 Context 程序</summary><CodePane lines={code} active={[0,3,isUK?4:5]} title="等价整理代码 · Figure 8"/></details></div></div>
 </div>;
}

const interventions=[
 {id:'find',text:'查找对象区域',kind:'感知模块',strategy:'把 find 替换成“返回完整输入图像”。目标级区域信息被移除。'},
 {id:'exists',text:'检查对象存在',kind:'感知模块',strategy:'用不提供对象存在信息的默认输出替换模型预测；正文未逐项给出具体默认值。'},
 {id:'verify_property',text:'核验对象属性',kind:'感知模块',strategy:'让属性核验不再返回有信息的预测，检查同一程序对它的依赖。'},
 {id:'best_image_match',text:'匹配候选区域',kind:'感知模块',strategy:'替换区域匹配的有信息输出，不再依据描述选择最佳候选。'},
 {id:'compute_depth',text:'估计相对深度',kind:'感知模块',strategy:'替换相对深度的有信息输出；不要把干预后的默认值当成真实深度。'},
 {id:'distance',text:'计算像素距离',kind:'Python 运算',strategy:'让距离运算失去功能；其他检测输出与原程序保持不变。'},
 {id:'sort',text:'排序',kind:'Python 运算',strategy:'让排序失去功能，观察相同样本与程序的表现变化。'},
 {id:'comparisons',text:'比较 >、<',kind:'Python 运算',strategy:'让比较运算失去功能，检查逻辑条件对结果的作用。'},
 {id:'arithmetic',text:'算术 +、−、×、÷',kind:'Python 运算',strategy:'让算术运算失去功能；图7没有报告各运算独立的量化分数。'},
] as const;
const wildCases=[
 {name:'零酒精饮料',asset:'drinks',question:'返回不含酒精的饮料区域',lines:['drinks = image.find("drink")','for drink in drinks:','    name = drink.simple_query("What is this?")','    alcoholic = llm_query(f"Does {name} have alcohol?")','    if alcoholic == "no": return drink'],values:['检测得到多个饮料图像块。','论文记录依次识别 tullamore dew、bacardi、gin、dr pepper；前三者对应 yes。','dr pepper 对应 no，返回它的图像区域；外部知识参与筛选。'],active:[[0],[1,2,3],[4]]},
 {name:'颜色组合',asset:'color-mix',question:'将蛇与花的颜色组合，会得到什么颜色？',lines:['viper = image.find("viper")[0]','flower = image.find("flower")[0]','viper_color = viper.simple_query("What color is the viper?")','flower_color = flower.simple_query("What color is the flower?")','return llm_query(f"Combine {viper_color} and {flower_color}")'],values:['分别定位蛇与花。','论文记录的视觉颜色为 blue 与 red。','论文示例文本回答 purple；这不是浏览器光学混色实验，也不是对任意颜料的物理保证。'],active:[[0,1],[2,3],[4]]},
 {name:'汽车创始人',asset:'sports-cars',question:'左侧品牌的创始人会对右侧品牌的创始人说什么？',lines:['cars = image.find("car")','cars.sort(key=lambda car: car.horizontal_center)','left_brand = cars[0].simple_query("What is the brand?")','right_brand = cars[-1].simple_query("What is the brand?")','left_founder, right_founder = llm_query(...)','return llm_query(f"What would {left_founder} say to {right_founder}?")'],values:['找到汽车区域，按水平中心排序。','图1记录的品牌对应创始人为 Ferruccio Lamborghini 与 Enzo Ferrari。','最终对话属于模型想象生成，不能当作创始人的真实发言或历史引文。'],active:[[0,1],[2,3,4],[5]]},
 {name:'摩天楼知识',asset:'skyscrapers',question:'介绍图中两座摩天楼之间的竞争',lines:['buildings = image.find("skyscraper")','name_1 = buildings[0].simple_query("What is the name?")','name_2 = buildings[1].simple_query("What is the name?")','return llm_query(f"Tell me about the competition between {name_1} and {name_2}")'],values:['先获取两座摩天楼的图像区域。','论文记录识别为 Chrysler Building 与 Empire State Building。','再向文本模型查询竞争背景。图像不能独自提供建筑史；文本知识仍需核实。'],active:[[0],[1,2],[3]]},
 {name:'拥抱之前',asset:'hug-before',question:'返回女人拥抱女孩前一帧中，离女人最远的两个孩子',lines:['for i, frame in enumerate(video.frame_iterator()):','    if frame.exists("woman") and frame.exists("girl") and hugging(frame): break','index_frame = i - 1','frame = ImagePatch(video, index_frame)','woman = frame.find("woman")[0]','kids = frame.find("kid")','kids.sort(key=lambda kid: distance(kid, woman))','return [kids[-1], kids[-2]]'],values:['顺序检查帧，寻找女人拥抱女孩的事件。','找到事件帧 i，再选择 i − 1；这是“之前”，不是“之后”。原图代码没有展示首帧边界处理，教程不补造保证。','在前一帧找到女人与孩子，按像素距离排序，取末尾两个区域；并非以真实米数测距。'],active:[[0,1],[2,3],[4,5,6,7]]},
] as const;

function BeyondBenchmarks(){const [which,setWhich]=useState(0),[step,setStep]=useState(0);const item=wildCases[which];return <details style={{marginTop:24}}><summary style={{cursor:'pointer',fontSize:20,color:C.blue,fontWeight:700}}>展开图1：超出标准评测的五类查询</summary><div className="lab-stage" role="group" aria-label="论文图1查询案例">{wildCases.map((c,i)=><button type="button" key={c.name} aria-pressed={which===i} onClick={()=>{setWhich(i);setStep(0);}}>{c.name}</button>)}</div><p className="lab-question">{item.question}</p><Stepper labels={['找到视觉对象','组合区域与知识','返回答案']} step={step} onChange={setStep}/><div className="lab-columns"><div><div style={{maxWidth:which===0?250:440,maxHeight:380,overflow:'auto'}}><PaperPhoto name={which===4?(step===0?'hug-video':step===1?'hug-event':'hug-before'):item.asset} alt={`论文图1原始视觉输入：${item.name}`}/></div><div className="lab-output is-active">{item.values[step]}</div></div><CodePane lines={[...item.lines]} active={[...item.active[step]]} title="图1程序逻辑摘要 · 省略号和 hugging 是展示用简写"/></div><p className="lab-caption">来源：PDF 第2页图1、第8页 §5.1。预设记录重现论文案例，网页不执行 Python 或模型推理。</p></details>;}

const approximateDrops = [68.7, 20.2, 26.3, 29.4, 10.9, 7.4, 39.1, 40.0, 27.2];
export function InterventionLab(){
 const [selected,setSelected]=useState(0),[replaceFind,setReplaceFind]=useState(false);const item=interventions[selected];
 return <div className="vlab"><LabStyles/>
 <label className="lab-switch" htmlFor="intervention-choice">选择组件</label><select id="intervention-choice" value={selected} onKeyDown={e=>e.stopPropagation()} onChange={e=>setSelected(Number(e.target.value))} style={{font:'inherit',padding:8,maxWidth:'100%'}}>{interventions.map((m,i)=><option key={m.id} value={i}>{m.id} · {m.text}</option>)}</select>
 <div className="lab-live-strip" role="status"><b>{item.id} · 相对mIoU下降约 {approximateDrops[selected].toFixed(1)}%</b><span>{item.strategy}</span></div>
 <p className="lab-caption">教学重绘 · RefCOCO · 统一0–70%。数值按原图比例近似换算；条越长，相对下降越大。</p>
 <div className="intervention-bars" aria-label="相对mIoU下降，统一0至70百分比刻度">{interventions.map((m,i)=><button className="intervention-row" key={m.id} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{m.id==='comparisons'?'>, <':m.id==='arithmetic'?'+, −, ×, ÷':m.id}</span><span className="intervention-track"><span style={{width:`${approximateDrops[i]/70*100}%`}}/></span><span>≈{approximateDrops[i].toFixed(1)}%</span></button>)}</div>
 <div className="lab-experiment"><span className="source-tag" data-source="教学实验">教学实验</span><label className="lab-switch"><input type="checkbox" checked={replaceFind} onChange={e=>setReplaceFind(e.target.checked)}/> 将 find 替换为总是返回整张图像</label><div className="lab-live-strip" role="status"><b>find("pizza") → {replaceFind?'[full_image]':'[A, B]'}</b><span>{replaceFind?'失去两块目标区域，不能恢复原来的深度排序。':'区域列表支持深度估计和排序。'}开关不重跑评测，图中近似值不变。</span></div></div>
 <details><summary>查看论文原 Figure 7 与换算说明</summary><PaperPhoto name="figure-7" alt="论文图7原图：组件干预的相对mIoU下降"/><p>柱的端点从PDF矢量矩形提取，使用印出的0与−70刻度换算，四舍五入至一位小数；仅用于重绘。论文在使用受影响组件的样本上保持代码不变，替换其默认输出；下降不等于该组件自身准确率。</p></details>
 <details><summary>更多代码与图1组合案例</summary><CodePane lines={program} active={[2]} title="等价简化代码 · 仅替换 find 实现的返回值"/><BeyondBenchmarks/></details>
 </div>;
}
