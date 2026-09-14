import React, { useRef, useState } from 'react';

type Mode = 'steps' | 'puzzle' | 'dial';
type Step = { question: string; options: string[]; correct: string };
type Config = {
  mode: Mode;
  title: string;
  background: string;
  steps?: Step[];
  chain?: string[];
  pieces?: string[];
};

const configs: Record<string, Config> = {
  'mod-1-2': { mode:'steps', title:'两帧之间，藏着多少种可能？', background:'“观测”是摄像头记录到的画面；“动作”是机器人发出的控制信号；“环境因素”包括镜头移动、遮挡和物体自身运动。这三个概念描述的是不同来源的信息。', steps:[
    {question:'杯子的位置变了，原因只可能有一个吗？', options:['只可能有一个','可能有多个'], correct:'可能有多个'},
    {question:'录像没有动作标签，现在能给“真正理解”盖章吗？', options:['可以盖章','证据还不够'], correct:'证据还不够'}
  ]},
  'mod-2-1': { mode:'puzzle', title:'补上失踪的中间证据', background:'人工动作真值来自机器人控制记录；下一帧像素是未来画面的颜色值；潜在表示 z 是模型内部学习到的一组数值。三者都可能与画面变化有关，但来源和用途不同。', chain:['前后观察','?','可被独立检验'], pieces:['潜在表示 z','人工动作真值','下一帧像素'] },
  'mod-3-1': { mode:'puzzle', title:'把两份证据送进正确的审讯室', background:'分类任务从有限类别中选标签，例如“倒水”；回归任务预测连续数值，例如轨迹坐标。Accuracy 统计类别命中比例，MSE 衡量连续数值之间的平方距离。', chain:['潜在表示 z','?','?'], pieces:['语义分类','控制回归','漂亮的重建图'] },
  'mod-4-1': { mode:'steps', title:'谁在替表示回答问题？', background:'聚类图把相似样本摆在一起；完整策略包含感知、规划与控制；Probe 是接在冻结表示之后的小型读出器。它们观察表示的方式和额外计算能力并不相同。', steps:[
    {question:'完整策略表现好，能确认表示本身一定好吗？', options:['能，足够确认','不能，策略可能代答'], correct:'不能，策略可能代答'},
    {question:'怎样让不同表示接受更可比的抽查？', options:['统一同一种 Probe','各用最强策略'], correct:'统一同一种 Probe'}
  ]},
  'mod-5-1': { mode:'dial', title:'拨动时间：动作轨迹会发生什么？', background:'控制回归预测连续动作数值。时间跨度 s 表示两次观察相隔多久；动作块是这段时间内的一串控制信号；MSE 是预测值与真值之间平方距离的平均数。' },
  'mod-6-1': { mode:'puzzle', title:'通才进入动作世界，要经过哪道窄门？', background:'视觉骨干负责提取画面特征；投影层负责对齐维度；量化会把连续特征映射到有限码字；动作真值则是数据集记录的控制信号。这些部件承担不同工作。', chain:['冻结视觉骨干','?','潜在动作'], pieces:['量化瓶颈','完整机器人策略','动作真值标签'] },
  'mod-7-1': { mode:'steps', title:'先学会读榜，再押冠军', background:'Accuracy 是语义分类答对样本占全部样本的比例；MSE 是连续控制预测与真值的平均平方距离。论文为分类统一 attentive probe，为回归统一 MLP Action Expert；两条赛道使用的读出器不同。', steps:[
    {question:'Accuracy 从 60 升到 76，通常是哪边更好？', options:['60 更好','76 更好'], correct:'76 更好'},
    {question:'MSE 从 0.57 降到 0.19，通常是哪边更好？', options:['0.57 更好','0.19 更好'], correct:'0.19 更好'},
    {question:'方向理清后，模型排名应在哪里比较？', options:['统一协议中','不同论文标题里'], correct:'统一协议中'}
  ]},
  'mod-8-1': { mode:'dial', title:'拖动监控时间轴，观察视线与误差', background:'Attention heatmap 用颜色显示读出器关注的区域；stride 是两次观察之间的时间间隔；跨 stride 实验是在多个时间间隔上重复同一测量。', },
  'mod-9-1': { mode:'dial', title:'转动实验旋钮，看词典有没有真被使用', background:'离散码本包含 K 个可选码字；利用率 U 是训练中被使用过的码字比例；Codebook Collapse 指模型长期只使用很少一部分码字。', },
  'mod-10-1': { mode:'steps', title:'结案前，先检查推理有没有越界', background:'“条件性结论”会明确数据、任务和评测协议；“因果结论”声称某因素导致某结果；“普遍能力结论”则把主张推广到更多环境。三者的证据要求不同。', steps:[
    {question:'Probe 成绩能直接证明普遍机器人智能吗？', options:['能直接证明','不能直接证明'], correct:'不能直接证明'},
    {question:'结案报告里最该保留什么？', options:['评测条件与边界','最响亮的口号'], correct:'评测条件与边界'}
  ]}
};

function Diagram({scene, progress}:{scene:string;progress:number}) {
  const labels = scene==='mod-4-1' ? ['表示','统一试卷','读出结果'] : scene==='mod-7-1' ? ['读方向','统一协议','再排名'] : scene==='mod-10-1' ? ['实验结果','条件边界','可靠结论'] : ['前一帧','未知原因','后一帧'];
  return <div className="prelude-diagram" aria-hidden="true">{labels.map((label,index)=><React.Fragment key={label}><div className={index<=progress?'lit':''}><span>{index+1}</span><b>{label}</b></div>{index<labels.length-1&&<i>→</i>}</React.Fragment>)}</div>;
}

function ResultChart() {
  const rows=[
    {label:'V-JEPA 2',value:76.62,tone:'vision'},
    {label:'DINOv3',value:68.68,tone:'vision'},
    {label:'LAPA-DINOv2 · General LAM',value:49.36,tone:'general'},
    {label:'villa-X · Embodied LAM',value:20.90,tone:'embodied'}
  ];
  return <div className="result-evidence-chart" role="img" aria-label="统一 attentive probe 下的平均语义分类准确率：V-JEPA 2 为 76.62，DINOv3 为 68.68，LAPA-DINOv2 为 49.36，villa-X 为 20.90">
    <div className="result-chart-title"><b>平均语义分类证据 · Accuracy</b><span>同一 attentive probe · ↑ 越高越好</span></div>
    {rows.map(row=><div className="result-chart-row" key={row.label}><span>{row.label}</span><div><i className={row.tone} style={{width:`${row.value}%`}}/></div><strong>{row.value.toFixed(2)}</strong></div>)}
    <p>控制侧交叉证据：DINOv3（通用视觉）取得代表性 MSE 0.19 ↓。先根据图表形成判断，再回到最终选项下注。</p>
  </div>;
}

function StepPrelude({scene,config,onReady,onMisstep}:{scene:string;config:Config;onReady:()=>void;onMisstep:()=>void}) {
  const [index,setIndex]=useState(0); const [message,setMessage]=useState('先完成这一步，最终选项稍后才会出现。'); const [done,setDone]=useState(false);
  const step=config.steps![Math.min(index,config.steps!.length-1)];
  const choose=(answer:string)=>{
    if(answer!==step.correct){onMisstep();setMessage('菲比：好像不太对，再想想呢？先看图中这一步与下一步的关系。');return;}
    if(index===config.steps!.length-1){setDone(true);setMessage('菲比：证据链接上了。现在可以作出你的最终判断。');onReady();}
    else {setIndex(index+1);setMessage('这一环成立。别急着背结论，我们再推进一步。');}
  };
  return <div className="prelude-interaction"><Diagram scene={scene} progress={done?3:index}/>{scene==='mod-7-1'&&<ResultChart/>}<div className="prelude-step"><small>推理步骤 {Math.min(index+1,config.steps!.length)} / {config.steps!.length}</small><p>{done?'中间推理已完成，请回到主问题作答。':step.question}</p>{!done&&<div className="prelude-options">{step.options.map(x=><button key={x} onClick={()=>choose(x)}>{x}</button>)}</div>}<div className={message.includes('不太对')?'prelude-message retry':'prelude-message'}>{message}</div></div></div>;
}

function PuzzlePrelude({scene,config,onReady,onMisstep}:{scene:string;config:Config;onReady:()=>void;onMisstep:()=>void}) {
  const [filled,setFilled]=useState<string[]>([]); const [message,setMessage]=useState('从候选证据中，挑一块补进发光的空位。'); const [done,setDone]=useState(false);
  const targets = scene==='mod-3-1' ? ['语义分类','控制回归'] : [scene==='mod-2-1'?'潜在表示 z':'量化瓶颈'];
  const choose=(piece:string)=>{
    if(piece!==targets[filled.length]){onMisstep();setMessage('菲比：好像不太对，再想想呢？看看这块证据的输入和输出能否接得上。');return;}
    const next=[...filled,piece];setFilled(next);
    if(next.length===targets.length){setDone(true);setMessage('菲比：拼图严丝合缝。现在用它帮助你回答主问题。');onReady();}
    else setMessage('第一块就位。另一种能力该交给哪间审讯室？');
  };
  let blankIndex=0;
  return <div className="prelude-interaction"><div className="puzzle-chain">{config.chain!.map((item,index)=>{const isBlank=item==='?';const fill=isBlank?filled[blankIndex++]:'';return <React.Fragment key={index}><div className={isBlank?'puzzle-slot':''}>{isBlank?(fill||'拖入证据'):item}</div>{index<config.chain!.length-1&&<i>→</i>}</React.Fragment>})}</div>{!done&&<div className="piece-pool">{config.pieces!.filter(x=>!filled.includes(x)).map(x=><button key={x} onClick={()=>choose(x)}>{x}</button>)}</div>}<div className={message.includes('不太对')?'prelude-message retry':'prelude-message'}>{message}</div></div>;
}

function DialPrelude({scene,onReady}:{scene:string;onReady:()=>void}) {
  const [value,setValue]=useState(0); const [done,setDone]=useState(false); const maxSeen=useRef(0);
  const update=(next:number)=>{setValue(next);maxSeen.current=Math.max(maxSeen.current,next);if(!done&&maxSeen.current>=88){setDone(true);onReady();}};
  const t=value/100;
  const isCode=scene==='mod-9-1'; const isAttention=scene==='mod-8-1';
  const used=isCode?(value<32?1:value<68?16:13):0;
  const sequenceLength=isCode?(value<32?16:value<68?49:64):0;
  return <div className="prelude-interaction dial-prelude"><div className="dial-stage">
    {isCode?<><div className="codebook-mini">{Array.from({length:16},(_,i)=><span key={i} className={i<used?'used':''}/>)}</div><b>码本利用率：{value<32?'1.6%':value<68?'100%':'79.7%'}</b><small>序列长度 {sequenceLength} · 固定 K=64、latent dim=256</small></>:
    isAttention?<><div className="monitor-object"><span className="hand" style={{left:`${18+t*50}%`}}/><span className="cup"/><i style={{left:`${20+t*46}%`,width:`${78-t*38}px`,height:`${78-t*38}px`}}/></div><div className="stride-bars"><span style={{height:`${32+t*10}px`}}>s=5</span><span style={{height:`${46+t*18}px`}}>s=15</span><span style={{height:`${58+t*30}px`}}>s=30</span></div></>:
    <><svg viewBox="0 0 520 150" role="img" aria-label="随时间跨度增长的连续动作轨迹"><path d="M35 118 C150 18, 315 145, 485 34"/><path className="trace" style={{strokeDashoffset:520-(t*520)}} d="M35 118 C150 18, 315 145, 485 34"/><circle cx={35+t*450} cy={118-(Math.sin(t*Math.PI)*72)} r="9"/></svg><div className="action-chunks">{Array.from({length:6},(_,i)=><span key={i} className={i<=Math.floor(t*5)?'lit':''}/>)}</div></>}
  </div><label className="evidence-dial"><span>{isCode?'Sequence Length':'监控时间'}：{isCode?sequenceLength:value}</span><input type="range" min="0" max="100" value={value} onChange={e=>update(+e.target.value)}/></label><div className="prelude-message">{done?(isCode?'菲比：三个离散设置都看过了。利用率并没有随序列长度单调变化。':'菲比：你已经看过变化的两端，可以作最终判断了。'):'菲比：把旋钮慢慢推到右侧，别只盯着第一帧。'}</div></div>;
}

export function PuzzlePreludePanel({scene,onReady,revealHint,onMisstep}:{scene:string;onReady:()=>void;revealHint:boolean;onMisstep:()=>void}) {
  const config=configs[scene]; if(!config){onReady();return null;}
  return <section className="puzzle-prelude" aria-label="谜题前置互动证据"><div className="prelude-head"><span>互动提示图</span><h4>{config.title}</h4></div>
    {config.mode==='steps'?<StepPrelude scene={scene} config={config} onReady={onReady} onMisstep={onMisstep}/>:config.mode==='puzzle'?<PuzzlePrelude scene={scene} config={config} onReady={onReady} onMisstep={onMisstep}/>:<DialPrelude scene={scene} onReady={onReady}/>}
    {revealHint&&<div className="prelude-background is-revealed" role="status"><small>概念补充 · 第一次犹豫后解锁</small><p>{config.background}</p></div>}
  </section>;
}
