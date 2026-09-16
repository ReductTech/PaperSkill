import {useState,useRef,useEffect} from 'react';
import {CanvasView,Controls,Feedback,palette as p,page,line,label,stamp} from './proofKit';

const steps=[
{name:'生成标准',question:'用户到底要求了什么？',input:'只读取任务，不看代理轨迹。',action:'拆成互不重叠的子目标；把“没有直飞就报告”写成条件，而不额外要求订票、酒店或链接。',output:['C1：查指定日期与航线','C2：确认直飞是否存在','C3：有航班时报告靠窗选座费'],why:'先定尺子再打分，防止标准迁就代理已经做过的行为。',source:'§3.1、A.2'},
{name:'全量相关性',question:'哪张截图能回答哪一项标准？',input:'全部截图 × 全部评分条目。',action:'每张截图对所有条目评分，形成相关性矩阵。图中每行是一帧、每列是一个标准；颜色深代表更相关，不代表完成得更好。',output:['每帧参与，不只保留结尾','S1–S2：搜索条件','S3–S4：航班与选座费用'],why:'相关性只决定“值得检查”，不能直接当作成功分。',source:'Algorithm 1 第2步；A.3.1'},
{name:'逐项选图',question:'每项标准应交给哪些截图作证？',input:'相关性矩阵与每项选图上限 k。',action:'分别为C1、C2、C3取最相关截图。本例k=2；同一帧可服务多个标准，相关性并列时优先较晚截图。',output:['C1 ← S1、S2','C2 ← S2、S3','C3 ← S3、S4'],why:'全量扫描发生在筛选阶段；最终判断不用一次塞入全部截图。',source:'Algorithm 1 第3步；A.3.1'},
{name:'分析证据',question:'截图究竟证明了什么？',input:'选出的“标准—截图”配对。',action:'从配对中提取可定位的事实，而不是直接给总分。同一截图服务多项标准时，可合并分析调用。',output:['S1：指定航线、日期已填写','S3：符合条件的直飞存在','S4：靠窗选座费为 ¥40'],why:'证据必须保留帧位置，后续才能核查代理说法。',source:'Algorithm 1 第4步；A.3.1'},
{name:'消解条件',question:'哪些条目现在真的适用？',input:'条件标准与已经提取的视觉证据。',action:'S3确认有符合条件的航班，所以C3必须评分。若没有符合条件的航班，C3应从分子、分母同时排除，而非计零分。',output:['本例：C3适用','无航班分支：排除C3','条件由证据决定，不由代理声称决定'],why:'不会因为现实中无法完成的条件项，扩大扣分分母。',source:'Algorithm 1 第5步；A.2、表5'},
{name:'现实校验',question:'评分标准的假设与真实页面一致吗？',input:'标准假设、动作记录、截图事实。',action:'将标准中对现实的假设与页面对齐，形成现实说明，并保留仅依据动作记录的评分供后续比较。本例代理说费用¥60，但S4显示¥40。',output:['现实：有航班且费用可见','代理说法：¥60','视觉证据：¥40（S4）'],why:'不能用截图中的正确事实替代理“补写”它实际没有正确报告的答案。',source:'Algorithm 1 第6步；A.2两遍评分、表7'},
{name:'整体重评分',question:'有了视觉证据，原评分要改吗？',input:'完整标准、现实说明、动作评分、截图证据。',action:'整体审阅标准：C1和C2完成，C3报告金额与截图矛盾，应扣分。权重仅为本网页教学设定：各项1分，所得1、1、0。',output:['C1：1/1；C2：1/1','C3：0/1，因金额矛盾','示意过程分：2/3'],why:'视觉证据优先；不重复惩罚同一根因，但也不免除根本错误。',source:'Algorithm 1 第7步；公式1、表6–7'},
{name:'副作用检查',question:'有没有做用户根本没要求的事？',input:'完整轨迹、原始委托、已经扣分的条目。',action:'检查额外购买、加购、订阅等持久修改，初始标准未必枚举这些行为。本例只查费用，没有额外修改，因此保持2/3。',output:['检查额外持久修改','本例：未发现副作用','不重复扣已经惩罚的同一问题'],why:'主任务看似完成，也可能伴随未请求的操作。',source:'Algorithm 1 第8步；§3.5、图7'},
{name:'结果判定',question:'站在用户立场，任务完成了吗？',input:'用户目标、最终交付、视觉证据与边界条件。',action:'用户要的是正确选座费，代理交付¥60而实际为¥40，因此结果失败。它不是把过程分与0.8比较后得到的标签。',output:['交付金额与事实不符','结果标签 r_out = 0','独立于过程评分阈值'],why:'过程分描述执行质量；结果标签回答用户目标是否实现。',source:'Algorithm 1 第9步；§3.2、表6'},
{name:'失败诊断',question:'错在哪里，怎样追溯？',input:'评分结果、代理陈述及相关截图位置。',action:'把金额不一致归入输出矛盾，关联S4和最终答复。形成诊断报告，而不只输出一个“失败”。',output:['过程分：2/3（教学设定）','结果：失败','诊断：输出矛盾；证据S4；最终答复¥60'],why:'返回(r_proc, r_out, d)，帮助定位错误并改进代理。',source:'Algorithm 1 第10步；表10：2.1输出矛盾'}
];
export function VerifierPipeline(){
 const [stage,setStage]=useState(0),[show,setShow]=useState(false),[auto,setAuto]=useState(false);const start=useRef(0);const s=steps[stage];
 const choose=(n:number)=>{setAuto(false);setStage(n);setShow(true);start.current=performance.now()}; useEffect(()=>{if(!auto)return;setShow(true);start.current=performance.now();const id=window.setInterval(()=>{setStage(n=>n>=9?(setAuto(false),9):n+1);start.current=performance.now()},6500);return()=>window.clearInterval(id)},[auto]);
 const math=[
['C = GenerateRubric(g)','C={c₁,c₂,c₃}。初始标准生成不以轨迹τ为输入；标准权重与实际所得分是不同量。'],
['R ∈ ℝᴹ×ᴺ，M=4，N=3','Rᵢⱼ表示截图i对标准j的相关性。矩阵小数仅作示意，不是论文规定的评分标度，也不是成功概率。每张截图对全部标准评分可并行。'],
['Sⱼ = TopKᵢ(Rᵢⱼ)，|Sⱼ| ≤ k','k=2时每列独立排序。C1选S1/S2，C2选S3/S2，C3选S4/S3。顺序按相关性降序；同一截图可重复服务不同标准。'],
['eᵢⱼ = Analyze(sᵢ,cⱼ)，i ∈ Sⱼ','这是算法操作的教学记法：从标准与截图配对提取可定位证据，不是论文新提出的损失函数。选图只筛材料，本步才解释视觉事实。'],
['A = {j : 条件成立或无条件}','本例A={1,2,3}；无合格航班时A={1,2}。归一化仅在A上求和，分母须为正。'],
['动作记录评分 ↔ 视觉现实说明','对齐标准假设与截图事实，并比较文本与多模态评分的差异。¥60≠¥40提示输出矛盾；不能假定代理说过截图中的正确金额。'],
['r_proc = (Σⱼ∈A earnedⱼ)/(Σⱼ∈A maxⱼ)','本例earned=(1,1,0)，max=(1,1,1)，故r_proc=2/3。等权为教学设定；论文允许按条目权重评分，不是普遍都用三等份。'],
['已罚问题 ∪ 新发现的副作用','对尚未惩罚的持久副作用补充条目、结合严重性调整过程评分。论文没有统一的固定扣分常数；本例无新增副作用，保留2/3。'],
['r_out ∈ {0,1}；本例 r_out=0','独立核验主要目标、证据和权限边界。r_out不是1[r_proc≥0.8]；0.8用于实验中把过程分二值化。'],
['V(g,τ) = (2/3, 0, d)','d记录类型、位置与证据：表10的2.1输出矛盾，最终答复¥60与S4的¥40冲突。可选重复第7–9步：过程中位数、结果多数票。']
];
 return <div>
 <style>{`.stage-track{display:flex;gap:6px;overflow-x:auto;width:100%;padding:8px 0 12px}.stage-dot{flex:0 0 86px;display:grid;justify-items:center;gap:5px;border:0;border-bottom:3px solid #d7deea;background:transparent;padding:8px 2px;color:#27446e;min-height:72px}.stage-dot span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;border:1px solid #d7deea}.stage-dot small{font-size:13px}.stage-dot.current{border-color:#27446e;font-weight:700;background:#eef3fa}.stage-dot.current span{background:#27446e;color:white}.stage-dot.done span{background:#228d5c;color:white}.uv-math{padding:16px;border:1px solid #d7deea;border-radius:12px;margin:14px 0;overflow-wrap:anywhere}.uv-math code{display:block;font-size:clamp(15px,2.4vw,22px);white-space:normal;color:#27446e;margin:10px 0}`}</style>
 <p><b>贯穿案例：</b>查询指定往返航线与日期的靠窗选座费；若没有直飞，报告无航班。代理正确找到航班，但把页面的<b>¥40</b>报告为<b>¥60</b>。</p>
 <p>案例改编自论文表5的条件任务；4帧、金额、k=2与等权评分均为教学设定，不是论文实验记录。每步可独立查看。</p>
 <Controls>{steps.map((x,i)=><button key={x.name} className={'chip'+(stage===i?' active':'')} aria-pressed={stage===i} style={{minHeight:44}} onClick={()=>choose(i)}>{i+1}. {x.name}</button>)}</Controls>
 <h3>{stage+1}/10 · {s.question}</h3>
 <p><b>输入：</b>{s.input}</p><div className="uv-math"><b>技术对象与计算</b><code>{math[stage][0]}</code><p>{math[stage][1]}</p></div>
 <CanvasView height={360} animate={show} label={`${s.name}：${show?s.output.join('；'):'等待展开处理结果'}`} draw={(c,w,h,time)=>{
 const t=!show?0:time===0?1:Math.min(1,(time-start.current)/1500);const progress=Math.max(0,t);
 if(stage===1||stage===2){
 const scores=[[.9,.1,.1],[.8,.7,.1],[.2,.9,.8],[.1,.3,1]];
 scores.forEach((row,i)=>{label(c,'S'+(i+1),100,100+i*65,p.ink,25);row.forEach((v,j)=>{const x=220+j*245,y=65+i*65;c.globalAlpha=.12+v*.8*progress;c.fillStyle=p.blue;c.fillRect(x,y,180,45);c.globalAlpha=1;if(show&&stage===2&&[[0,1],[1,2],[2,3]][j].includes(i)){c.strokeStyle=p.orange;c.lineWidth=5;c.strokeRect(x,y,180,45)}label(c,show?v.toFixed(1):'—',x+65,y+31,p.ink,24)})});
 ['C1','C2','C3'].forEach((v,j)=>label(c,v,275+j*245,40,p.ink,25));
 }else if(stage===0||stage===4||stage===6||stage===7){
 page(c,100,30,880,295);[0,1,2].forEach(i=>{const y=90+i*83;label(c,'C'+(i+1),140,y,p.blue,32);line(c,220,y-10,840,y-10,p.border,10);if(show){line(c,220,y-10,220+600*progress,y-10,i===2&&stage>=6?p.red:p.green,10);label(c,stage>=6?(i===2?'0/1':'1/1'):'✓',870,y,i===2&&stage>=6?p.red:p.green,28)}});
 }else if(stage===3||stage===5){
 page(c,80,45,410,265);page(c,590,45,410,265);label(c,stage===3?'截图 S4':'代理答复',130,100,p.blue,30);label(c,stage===3?'证据记录':'截图 S4',640,100,p.blue,30);label(c,stage===3?'¥40':'¥60',180,205,stage===3?p.blue:p.red,60);c.globalAlpha=progress;label(c,'¥40',700,205,p.green,60);line(c,650,225,880,225,p.green,5);c.globalAlpha=1;
 }else{page(c,120,35,840,290);label(c,stage===8?'结果判定':'失败定位',175,100,p.blue,32);if(show){c.globalAlpha=progress;stamp(c,820,195,false);label(c,stage===8?'0':'S4',205,210,p.red,70);line(c,360,190,710,190,p.red,5);c.globalAlpha=1}}
 }}/>
 <Controls><button className="chip" style={{minHeight:44}} onClick={()=>{start.current=performance.now();setShow(true)}}>{show?'再次演示本步':'展开本步处理'}</button><button className="chip" style={{minHeight:44}} disabled={stage===0} onClick={()=>choose(stage-1)}>上一步</button><button className="chip" style={{minHeight:44}} disabled={stage===9} onClick={()=>choose(stage+1)}>下一步</button></Controls>
 <Feedback tone={show&&stage>=8?'bad':'neutral'}>{show?s.action:'当前只展示输入。展开本步后，图形与下面的产物同步显示这一操作的结果。'}</Feedback>
 {show&&<div style={{border:'1px solid '+p.border,borderRadius:12,padding:18,overflowWrap:'anywhere'}}><b>本步产物</b><ul style={{paddingLeft:24,marginTop:8}}>{s.output.map(x=><li key={x}>{x}</li>)}</ul><p><b>为什么需要这步：</b>{s.why}</p></div>}
 <p><a href="https://arxiv.org/pdf/2604.06240#page=6" target="_blank" rel="noreferrer">原文：{s.source}</a></p>
 <p>论文还允许重复执行第7–9步来降低波动：过程分取中位数、结果取多数票。本演示不调用真实模型，也不把重复投票当成正确性的保证。</p>
 </div>
}
