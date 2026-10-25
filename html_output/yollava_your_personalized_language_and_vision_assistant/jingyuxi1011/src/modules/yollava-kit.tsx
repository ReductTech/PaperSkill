import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const PAPER = 'https://proceedings.neurips.cc/paper_files/paper/2024/file/48088756ec0ce6ba362bddc7ebeb3915-Paper-Conference.pdf';
const css = `
.yl{font-size:18px;line-height:1.65;color:#21324a;min-width:0}
.yl *{box-sizing:border-box}.yl p{margin:0 0 14px}.yl h5{font-size:20px;line-height:1.4;margin:0 0 10px;font-weight:750}
.yl button{font:inherit;cursor:pointer}.yl button:focus-visible,.yl a:focus-visible,.yl input:focus-visible{outline:3px solid #f07e47;outline-offset:3px}.yl button:disabled{cursor:default;opacity:.45}
.yl-step-controls{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;margin:18px 0}.yl-step-controls button{padding:7px 12px;border:1px solid #d7deea;background:white;border-radius:8px;color:#27446e}.yl-step-detail{min-height:220px;margin-top:20px}.yl-route{padding:16px;border:1px solid #d7deea;border-radius:12px;background:#f7f9fc;margin:15px 0}.yl-route .lit{color:#27446e;border-color:#27446e;background:#edf3fa}.yl-route .learned{color:#92400e;border-color:#f07e47;background:#fff5ef}.yl-route .inactive{opacity:.6}.yl-path-readout{font-size:16px;line-height:1.6;padding:14px;border-radius:9px;background:#edf3fa;margin:14px 0}.yl-metric-explainer{min-height:76px}.yl-evidence-choice{border-top:1px solid #d7deea;margin-top:20px;padding-top:18px}
.yl-tabs{display:flex;flex-wrap:wrap;gap:9px;margin:20px 0}.yl-tab{padding:9px 17px;border:1px solid #d7deea;border-radius:10px;background:#fff;color:#27446e;transition:background .16s,border-color .16s}
.yl-tab[aria-pressed=true]{background:#27446e;color:#fff;border-color:#27446e;font-weight:700}.yl-tab:hover{border-color:#27446e}
.yl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.yl-card{background:#f7f9fc;border:1px solid #d7deea;border-radius:14px;padding:22px;min-width:0}.yl-card.white{background:white}.yl-card.active{border:2px solid #27446e;padding:21px;background:#f0f4fa}
.yl-kicker{font-size:13px;letter-spacing:.09em;font-weight:800;text-transform:uppercase;color:#68778f;margin:0 0 8px}.yl-big{font-size:42px;line-height:1.2;letter-spacing:-.03em;font-weight:800;color:#27446e}.yl-unit{font-size:16px;color:#68778f;margin-left:6px}
.yl-caption{font-size:14px;line-height:1.55;color:#68778f;margin:9px 0 0}.yl-caption a{color:#27446e;text-decoration:underline;text-underline-offset:3px}.yl-source{border-top:1px solid #d7deea;padding-top:11px;margin-top:18px}
.yl-figure{margin:0;min-width:0}.yl-photo{display:block;width:100%;border-radius:12px;object-fit:contain;background:#f5f8f0}.yl-photo.scene{height:270px;object-fit:contain}.yl-photo.small{max-height:200px}.yl-original{padding:14px;border:1px solid #d7deea;border-radius:12px;background:white}
.yl-feedback{padding:15px 19px;margin:20px 0 0;border-left:4px solid #27446e;background:#edf3fa;border-radius:0 10px 10px 0;line-height:1.65}.yl-feedback.good{border-color:#228d5c;background:#edf7f1}.yl-feedback.bad{border-color:#c43f52;background:#fff1f3}
.yl-bubble{padding:17px 20px;margin:12px 0;border-radius:13px;background:white;border:1px solid #d7deea}.yl-bubble.answer{background:#edf7f1;border-color:#b4d9c5}.yl-bubble.error{background:#fff1f3;border-color:#e6b2bc}.yl-bubble strong{display:block;font-size:14px;letter-spacing:.04em;color:#68778f;margin-bottom:7px}
.yl-tags{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.yl-tag{font-size:14px;padding:4px 9px;border:1px solid #d7deea;border-radius:7px;background:white}.yl-tag.train{border-color:#f07e47;color:#92400e}.yl-tag.frozen{color:#27446e;background:#edf3fa}
.yl-token-strip{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;width:218px;max-width:100%;margin:15px 0}.yl-token{width:100%;height:30px;background:#f9decf;border:1.5px solid #f07e47;border-radius:5px}.yl-code{font:16px/1.7 "Cascadia Code",Consolas,monospace;overflow-wrap:anywhere;background:#f1f4f8;padding:15px;border-radius:10px;color:#27446e}
.yl-flow{display:flex;align-items:stretch;gap:8px;min-width:0}.yl-node{flex:1;border:1px solid #d7deea;background:#fff;border-radius:12px;padding:17px 12px;text-align:center;min-width:0}.yl-node[aria-pressed=true],.yl-node.on{border:2px solid #f07e47;padding:16px 11px;background:#fff5ef}.yl-node b{display:block;font-size:17px;line-height:1.4}.yl-node small{display:block;font-size:14px;color:#68778f;margin-top:7px}.yl-arrow{display:flex;align-items:center;color:#9fb0c8;font-weight:800;font-size:20px}.yl-number{display:block;font-size:13px;color:#68778f;margin-bottom:7px}
.yl-gallery{display:flex;gap:10px;align-items:center;justify-content:center;padding:16px;border:1px dashed #b8c9a7;border-radius:12px;background:#f5f8f0}.yl-gallery img{width:74px;height:76px;object-fit:cover;border:4px solid white;box-shadow:0 2px 6px #21324a14;border-radius:4px}.yl-gallery .yl-subject{font-weight:800;color:#92400e;font-family:Consolas,monospace}
.yl-architecture{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:20px}.yl-architecture-path{padding:20px;border-radius:14px;background:#f0f4fa;display:flex;flex-direction:column;gap:10px}.yl-architecture-path .yl-node{flex:none}.yl-architecture-path .yl-arrow{justify-content:center}.yl-subject{color:#92400e;font-family:Consolas,monospace;font-weight:700}.yl-freeze{font-size:14px;color:#27446e;background:#edf3fa;padding:5px 10px;border-radius:6px}.yl-learn{font-size:14px;color:#92400e;background:#fff0e7;padding:5px 10px;border-radius:6px}
.yl-two-branch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}.yl-branch{border:1px solid #d7deea;background:white;padding:20px;border-radius:12px}.yl-branch img{width:100%;height:135px;object-fit:contain;border-radius:7px}.yl-step-line{text-align:center;color:#27446e;font-weight:750;margin:15px 0}
.yl-result-button{text-align:left;display:block;width:100%;color:#21324a}.yl-result-button p{font-size:15px;color:#68778f;margin-bottom:8px}.yl-result-button .yl-big{font-size:36px}.yl-bars{display:flex;flex-direction:column;gap:14px;margin:20px 0}.yl-bar-row{display:grid;grid-template-columns:minmax(130px,1.15fr) minmax(80px,2fr) 63px;gap:12px;align-items:center;font-size:15px}.yl-bar-track{height:18px;border-radius:4px;background:#e5eaf1;overflow:hidden}.yl-bar-fill{height:100%;background:#9fb0c8;border-radius:4px}.yl-bar-fill.method{background:#228d5c}.yl-bar-value{font-weight:750;text-align:right;font-variant-numeric:tabular-nums}.yl-result-detail{margin-top:22px;border:1px solid #d7deea;padding:24px;border-radius:14px;background:white}
.yl-range{width:100%;accent-color:#f07e47;cursor:pointer}.yl-axis-wrap{position:relative;background:white;border:1px solid #d7deea;border-radius:10px;overflow:hidden}.yl-axis-wrap img{width:100%;height:auto;display:block}.yl-axis-marker{position:absolute;top:12%;bottom:15%;width:2px;background:#f07e47;box-shadow:0 0 0 3px #f07e4733;pointer-events:none}.yl-axis-value{display:flex;justify-content:space-between;align-items:center;margin:15px 0;font-size:17px}.yl-range-label{display:flex;justify-content:space-between;gap:14px;margin-top:8px;font-size:14px;color:#68778f}.yl-rule{border-top:1px solid #d7deea;margin:22px 0}
.yl-fact-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0}.yl-fact{border-left:3px solid #9fb0c8;padding:2px 0 2px 15px}.yl-fact b{display:block;margin-bottom:5px}.yl-fact p{font-size:16px;color:#68778f;margin:0}.yl-no-image{height:270px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;border:2px dashed #9fb0c8;border-radius:12px;background:#f4f7fb;color:#27446e}.yl-no-image span{font-size:38px}.yl-option{display:block;width:100%;padding:16px 18px;text-align:left;background:#fff;border:1px solid #d7deea;border-radius:10px;margin:12px 0}.yl-option[aria-pressed=true]{border:2px solid #27446e;padding:15px 17px;background:#edf3fa}.yl-link-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.yl-link-row a{color:#27446e;font-size:15px;border:1px solid #d7deea;padding:7px 12px;border-radius:7px;text-decoration:none}.yl-album canvas{display:block;width:100%!important;height:auto!important;max-width:560px;border-radius:12px;margin:auto}.yl-hero-img{height:200px;width:100%;object-fit:contain;border-radius:12px;background:#f5f8f0}.yl-hero-caption{font-size:14px;color:#68778f;text-align:center;margin-top:12px}.yl-hero-mark{font-size:23px;font-weight:800;color:#92400e;text-align:center;margin:12px 0}
@media(max-width:760px){.yl-grid,.yl-architecture,.yl-two-branch,.yl-fact-list{grid-template-columns:1fr}.yl{font-size:17px}.yl-card,.yl-result-detail{padding:17px}.yl-card.active{padding:16px}.yl-flow{flex-direction:column}.yl-arrow{justify-content:center;transform:rotate(90deg);height:21px}.yl-node{padding:13px}.yl-node[aria-pressed=true],.yl-node.on{padding:12px}.yl-bar-row{grid-template-columns:minmax(90px,1fr) minmax(60px,1.2fr) 52px;gap:8px;font-size:14px}.yl-tabs{gap:7px}.yl-tab{padding:8px 12px}.yl-photo.scene{height:230px}.yl-no-image{height:180px}.yl-gallery img{width:59px;height:62px}.yl-axis-marker{box-shadow:0 0 0 2px #f07e4733}}
`;

function Panel({children,feature}:{children:React.ReactNode;feature?:string}){return <div className="yl" data-feature={feature}><style>{css}</style>{children}</div>}
function Tabs<T extends string | number>({options,value,onChange,label}:{options:{value:T;label:string}[];value:T;onChange:(v:T)=>void;label:string}){return <div className="yl-tabs" role="group" aria-label={label}>{options.map(o=><button type="button" key={o.value} className="yl-tab" aria-pressed={value===o.value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>}
function Source({children,page}:{children:React.ReactNode;page:number}){return <div className="yl-caption yl-source"><a href={`${PAPER}#page=${page}`} target="_blank" rel="noreferrer">{children}</a></div>}
function Feedback({children,tone='guide'}:{children:React.ReactNode;tone?:'guide'|'good'|'bad'}){return <div className={`yl-feedback ${tone}`} aria-live="polite">{children}</div>}
function Tokens({count=16}:{count?:number}){return <div className="yl-token-strip" aria-label={`${count} 个 latent tokens 示意，无真实向量值`}>{Array.from({length:count},(_,i)=><span className="yl-token" key={i}/>)}</div>}
function Photo({file,caption,scene=false}:{file:string;caption:string;scene?:boolean}){return <figure className="yl-figure"><img className={`yl-photo ${scene?'scene':''}`} src={`./images/${file}.png`} alt={caption}/><figcaption className="yl-caption">{caption}</figcaption></figure>}
function Gallery(){return <div className="yl-gallery">{[1,2,3].map(i=><img key={i} src={`./images/bo-reference-${i}.png`} alt={`bo 的参考图片 ${i}，Table 3 局部`}/>)}<span className="yl-subject">&lt;bo&gt;</span></div>}
function Teaching({children}:{children?:React.ReactNode}){return <div className="yl-caption">教学示意图 / 根据论文内容重绘{children?<> · {children}</>:null}</div>}

function HeroScene({personal}:{personal:boolean}){return <Panel><img className="yl-hero-img" src="./images/bo-park.png" alt="Table 3 中 T 抱着 bo 的论文输入图片"/><div className="yl-hero-mark">{personal?'用户的 <bo>':'一只狗'}</div>{personal?<Tokens/>:<div className="yl-tags" style={{justifyContent:'center'}}><span className="yl-tag">一般类别知识</span><span className="yl-tag">主体身份未知</span></div>}<div className="yl-hero-caption">照片：Table 3（局部）· 表示与标签：教学示意</div></Panel>}

function AlbumAnalogy({chapterId}:{chapterId:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const c=setupCanvas(canvas,560,140);const img=new Image();let disposed=false;img.onload=()=>{if(disposed)return;c.clearRect(0,0,560,140);c.fillStyle='#f5f8f0';c.fillRect(0,0,560,140);c.fillStyle='#b8c9a7';c.beginPath();c.roundRect(87,26,164,95,10);c.fill();c.fillStyle='#fff';c.beginPath();c.roundRect(102,17,154,100,7);c.fill();c.drawImage(img,111,26,135,75);c.strokeStyle='#d7deea';c.lineWidth=2;c.strokeRect(111,26,135,75);c.fillStyle='#21324a';c.font='700 15px Segoe UI';c.fillText('主体照片',124,128);c.fillStyle='#f07e47';c.beginPath();c.roundRect(294,43,84,38,7);c.fill();c.fillStyle='#fff';c.font='700 18px Consolas';c.fillText(chapterId==='chap-8'?'<T>':'<bo>',309,68);c.strokeStyle='#9fb0c8';c.beginPath();c.moveTo(267,62);c.lineTo(281,62);c.stroke();c.fillStyle='#68778f';for(let i=0;i<16;i++){c.beginPath();c.roundRect(397+(i%8)*16,39+Math.floor(i/8)*25,12,20,3);c.fill();}canvas.classList.add('is-ready');};img.src=chapterId==='chap-8'?'./images/failure-negative.png':'./images/bo-park.png';return()=>{disposed=true;};},[chapterId]);
 const summary=<div className="yl-album-summary" role="img" aria-label="主体照片、主体标识与 latent tokens 的摘要教学示意">
   <img src={chapterId==='chap-8'?'./images/failure-negative.png':'./images/bo-park.png'} alt=""/>
   <span className="yl-summary-arrow" aria-hidden="true">→</span><span className="yl-subject">{chapterId==='chap-8'?'<T>':'<bo>'}</span>
   <span className="yl-summary-arrow" aria-hidden="true">→</span><div><span className="yl-summary-label">latent tokens</span><Tokens/></div>
  </div>;
 return <Panel><div className={`yl-album ${chapterId==='chap-1'?'':'yl-album-compact'}`}>
  {chapterId==='chap-1'?<><canvas ref={ref} role="img" aria-label="主体照片与可学习提示的静态教学示意图"/><div className="yl-album-mobile">{summary}</div></>:summary}
  <div className="yl-caption" style={{textAlign:'center'}}>教学示意图 / 根据论文内容重绘</div></div></Panel>
}

function GenericCompare(){
 const [mode,setMode]=useState<'generic'|'personal'>('generic');
 const [question,setQuestion]=useState<'category'|'identity'>('identity');
 const personal=mode==='personal';
 const answer=question==='category'?'图片中有一只狗，正被人抱着。':personal?'图中出现了 <bo>，它正被抱着。':'我能看出这是狗，但仅凭类别知识无法确定它是不是用户的 <bo>。';
 return <Panel feature="generic">
  <Tabs value={mode} onChange={setMode} label="模型设定" options={[{value:'generic',label:'通用 LMM'},{value:'personal',label:'个性化 Yo’LLaVA'}]}/>
  <div className="yl-grid"><div><Photo file="bo-park" caption="论文原图（局部）· Table 3，p.6：T 与 bo 在公园" scene/><div className="yl-tags"><span className="yl-tag">固定同一张图片</span><span className="yl-tag">只改变问题或是否学过主体</span></div></div>
  <div className="yl-card"><div className="yl-kicker">类别与身份：同图对照</div>
   <Tabs value={question} onChange={setQuestion} label="对照问题" options={[{value:'category',label:'问类别：是什么？'},{value:'identity',label:'问身份：是 <bo> 吗？'}]}/>
   <h5>{personal?'已经学习 <bo> 的主体表示':'尚未学习 <bo> 的身份关联'}</h5>
   {personal?<><div className="yl-code">&lt;bo&gt; is &lt;token₁&gt; … &lt;token₁₆&gt;.</div><Tokens/></>:<div className="yl-no-image" style={{height:115}}><b>有类别知识，缺主体关联</b></div>}
   <div className="yl-bubble answer"><strong>教学回答 · 非模型实测输出</strong>{answer}</div>
   <Teaching>用于解释信息需求，未运行模型；不代表每次身份判断都正确</Teaching>
  </div></div>
  <Feedback tone={personal&&question==='identity'?'good':'guide'}>{question==='category'?'两种设定都可利用当前图描述类别与动作；识别一般类别并不需要先个性化。':personal?'具体身份判断需要把新图与已经学习的主体信息关联，不能只把“狗”替换成名字。':'只给名字不能建立视觉身份；模型还需要从用户参考图学习这个具体主体。'}</Feedback>
  <div className="yl-caption yl-source"><b>论文信息：</b>Thao Nguyen · Haotian Liu · Yuheng Li · Mu Cai · Utkarsh Ojha · Yong Jae Lee<br/>University of Wisconsin–Madison · NeurIPS 2024</div><Links/>
 </Panel>
}

function Links(){return <div className="yl-link-row"><a href={PAPER} target="_blank" rel="noreferrer">正式论文</a><a href="https://arxiv.org/abs/2406.09400" target="_blank" rel="noreferrer">arXiv</a><a href="https://github.com/WisconsinAIVision/YoLLaVA" target="_blank" rel="noreferrer">官方代码</a><a href="https://thaoshibe.github.io/YoLLaVA/" target="_blank" rel="noreferrer">项目页面</a><a href="https://huggingface.co/datasets/thaoshibe/YoLLaVA" target="_blank" rel="noreferrer">数据集</a></div>}

const overview=[
 {title:'参考图片',sub:'默认 n=5',detail:'用户给出同一个具体主体的少量参考图片与主体标识。论文相册缩略图仅展示其中几个样例；不把 3 张缩略图误作默认训练图数量。'},
 {title:'主体表示',sub:'标识 + k=16',detail:'系统由照片准备监督，学习“<bo> is <token₁>…<token₁₆>.”的主体提示。标识便于引用，连续嵌入承载学习的信息。'},
 {title:'冻结 LLaVA',sub:'1.5 · 13B',detail:'保留原模型的视觉编码器、视觉投影器与语言模型，只调整新主体的输入嵌入和标识输出权重。不是从头训练新的 LMM。'},
 {title:'个性化对话',sub:'文字 / 图片',detail:'之后输入文字问题，或加入一张新图片；主体提示帮助模型回答已学属性，或在新场景中识别主体并描述活动。'},
];
function OverviewMap(){const [step,setStep]=useState(0);return <Panel feature="overview"><Gallery/><div className="yl-caption">论文原图（局部）· Table 3，p.6：3 张示例缩略图；默认训练使用 5 张。</div><div className="yl-flow" style={{marginTop:22}}>{overview.map((n,i)=><React.Fragment key={n.title}>{i>0&&<span className="yl-arrow" aria-hidden="true">→</span>}<button className="yl-node" aria-pressed={step===i} onClick={()=>setStep(i)}><span className="yl-number">0{i+1}</span><b>{n.title}</b><small>{n.sub}</small></button></React.Fragment>)}</div><div className="yl-card" style={{marginTop:20}}><h5>{overview[step].title}</h5><p>{overview[step].detail}</p>{step===1&&<Tokens/>}{step===3&&<div className="yl-tags"><span className="yl-tag">没有新图：主体属性</span><span className="yl-tag">有新图：身份 + 当前场景</span></div>}<Teaching>箭头表示方法依赖，不表示参考图逐张转换成 token</Teaching></div><Feedback>{['few-shot 指主体参考图片少；构造的识别与属性训练样本不止五条。','默认 16 个 latent tokens，加上一个主体标识，共 17 个新增输入嵌入。','基础 LLaVA 的通用能力作为底座，不需要重新训练全部参数。','同一主体表示服务两种对话；照片数量与表示长度不是一一对应。'][step]}</Feedback><details style={{marginTop:20}}><summary style={{cursor:'pointer'}}>查看论文总览原图</summary><div style={{marginTop:16}}><Photo file="figure-1" caption="论文原图（局部）· Figure 1，p.1：个性化主体与两种对话"/></div></details><Source page={1}>Figure 1；§3–4，pp.4–7</Source></Panel>}

type Part='identifier'|'latent'|'vision'|'llm'|'output';
const parts:Record<Part,{title:string;train:boolean;detail:string;quantity:string}>={
 identifier:{title:'主体标识 <bo>',train:true,detail:'新增的词表标识让用户和模型能在问题与回答中引用这个具体主体。它本身有一个可学习的输入嵌入。',quantity:'1 个新增输入嵌入'},
 latent:{title:'latent tokens',train:true,detail:'16 个可学习的连续输入嵌入，通过识别与属性回答监督编码主体视觉信息。它们不需要对应自然语言单词，也没有论文规定的逐槽语义。',quantity:'k=16 个连续输入嵌入'},
 vision:{title:'视觉编码器 + projector',train:false,detail:'识别训练与有图推理中，新图片经过原有视觉编码器和视觉投影器进入语言模型。两部分在 personalization 中保持冻结。',quantity:'原有视觉参数冻结'},
 llm:{title:'LLaVA 语言模型主体',train:false,detail:'学习提示与问题一起成为语言模型输入；有图时还包含视觉表示。LLaVA-1.5-13B 的原语言模型权重不更新。',quantity:'原有 LLM 参数冻结'},
 output:{title:'新增标识的输出权重',train:true,detail:'为了在回答中输出主体标识，论文将 W 从 C×N 扩展到 C×(N+1)，仅优化标识对应的新增列。原有输出权重不整体微调。',quantity:'1 个新增输出列'},
};
function SubjectArchitecture(){
 const [route,setRoute]=useState<'input'|'update'|'output'>('input');
 const [part,setPart]=useState<Part>('identifier');
 const info=parts[part];
 const routeParts:Record<typeof route,Part[]>={input:['identifier','latent','vision','llm'],update:['identifier','latent','output'],output:['llm','output']};
 const selectPart=(p:Part)=>{setPart(p);setRoute(p==='output'?'output':p==='latent'?'update':'input')};
 const note={input:'输入：主体标识 + 16 个连续嵌入 + 问题；有图时另加视觉表示。',update:'更新：回答监督的 loss 反传，只优化 17 个新输入嵌入和新标识输出列。',output:'输出：普通回答词沿用旧词表；新增的 <bo> 输出列允许回答中生成主体名。latent tokens 是输入表示，不是 16 个待输出描述词。'}[route];
 return <Panel feature="architecture">
 <Tabs value={route} onChange={v=>{setRoute(v);setPart(v==='input'?'identifier':v==='update'?'latent':'output')}} label="主体信息路径" options={[{value:'input',label:'输入如何引用'},{value:'update',label:'哪些参数更新'},{value:'output',label:'输出如何命名'}]}/>
 <div className="yl-code">&lt;bo&gt; is &lt;token₁&gt; &lt;token₂&gt; … &lt;token₁₆&gt;.</div>
 <div className="yl-architecture" style={{marginTop:22}}><div className="yl-architecture-path yl-route">
  <div className="yl-grid" style={{gap:9}}>{(['identifier','latent'] as Part[]).map(p=><button key={p} className={`yl-node ${routeParts[route].includes(p)?'learned':'inactive'}`} aria-pressed={part===p} onClick={()=>selectPart(p)}><b>{p==='identifier'?'主体标识 <bo>':'连续 latent tokens'}</b><small>{p==='identifier'?'1 个输入嵌入':'16 个输入嵌入'}</small>{p==='latent'&&<Tokens/>}</button>)}</div>
  <button className={`yl-node ${route==='input'?'lit':'inactive'}`} aria-pressed={part==='vision'} onClick={()=>selectPart('vision')}><b>可选图片 → 编码器 / projector</b><small>原参数冻结，仍参与计算</small></button>
  <span className={`yl-arrow ${route!=='update'?'lit':''}`} aria-hidden="true">↓</span>
  <button className={`yl-node ${routeParts[route].includes('llm')?'lit':'inactive'}`} aria-pressed={part==='llm'} onClick={()=>selectPart('llm')}><b>LLaVA-1.5-13B</b><small>原语言模型冻结</small></button>
  <span className={`yl-arrow ${route==='output'?'lit':''}`} aria-hidden="true">↓</span>
  <button className={`yl-node ${routeParts[route].includes('output')?'learned':'inactive'}`} aria-pressed={part==='output'} onClick={()=>selectPart('output')}><b>普通回答词 + 新主体标识</b><small>仅新增标识输出列参与训练</small></button>
  <div className="yl-caption">橙：新主体参数 · 蓝：当前计算路径 · 灰：此视图非重点</div>
 </div><div className="yl-card white"><div className="yl-kicker">选中组件</div><h5>{info.title}</h5><span className={info.train?'yl-learn':'yl-freeze'}>{info.train?'● 参与 personalization':'◇ 冻结'}</span><p style={{marginTop:16}}>{info.detail}</p><div className="yl-code">{info.quantity}</div><div className="yl-rule"/><p>输入侧默认 1+16 个新表示；输出侧只为可引用的主体标识增加权重列，两者不能互换。</p></div></div>
 <Feedback tone={route==='update'?'good':'guide'}>{note}</Feedback>
 <Teaching>§3.1 / Figure 2；高亮仅表示路径和更新范围，不展示真实梯度或向量值</Teaching>
 <details style={{marginTop:20}}><summary style={{cursor:'pointer'}}>查看论文结构原图</summary><div className="yl-original" style={{marginTop:16,maxWidth:560}}><Photo file="figure-2" caption="论文原图（局部）· Figure 2，p.4：训练路径"/></div></details><Source page={4}>§3.1；Figure 2，p.4</Source>
 </Panel>
}

function TrainingObjective(){const [task,setTask]=useState<'recognition'|'attribute'>('recognition');return <Panel feature="objective"><Tabs value={task} onChange={setTask} label="监督类型" options={[{value:'recognition',label:'识别监督：保留图片'},{value:'attribute',label:'属性对话：优化时无图'}]}/><div className="yl-grid"><div className="yl-card">{task==='recognition'?<><Photo file="bo-park" caption="识别监督输入示意；图片取自 Table 3" scene/><div className="yl-tags"><span className="yl-tag">主体正例</span><span className="yl-tag">随机负例</span><span className="yl-tag">困难负例</span></div></>:<><div className="yl-no-image"><span aria-hidden="true">▣</span><b>优化时不输入参考图</b></div><div className="yl-caption">准备问答时仍由 LLaVA 看参考图生成描述与回答。</div></>}</div><div className="yl-card white"><div className="yl-kicker">问题 / 目标回答 · 教学示意</div><div className="yl-bubble"><strong>问题</strong>{task==='recognition'?'这张图片里有 <bo> 吗？':'<bo> 的外观是什么样？'}</div><div className="yl-bubble answer"><strong>监督目标</strong>{task==='recognition'?'主体图：Yes；非主体图：No。':'来自参考图自动构造的主体属性回答。'}</div><div className="yl-code">共同更新 θ：新主体输入嵌入 + 标识输出列</div><p style={{marginTop:15}}>训练提高监督目标回答逐 token 的条件概率；回答监督的 loss 信号用于调整 θ，原有模型参数保持冻结。</p></div></div><Feedback>{task==='recognition'?'训练识别不仅要“见到就认出”，还要在随机或相似负例中拒认。':'若属性问答优化时一直给图片，模型可直接看图回答；去图旨在让主体信息进入可学习提示。'}</Feedback><div className="yl-fact-list"><div className="yl-fact"><b>优化</b><p>AdamW，学习率 0.001，每主体至多 15 轮；按训练集识别正确率选 checkpoint，单 A6000。</p></div><div className="yl-fact"><b>监督组织</b><p>两类训练数据，不应写成论文规定的两个顺序训练阶段。</p></div></div><Source page={4}>Eq.(1)，p.4；§3.2–3.3，pp.4–6；§4，pp.6–7</Source></Panel>}

const trainingSteps=[
 {title:'准备参考材料',detail:'用户提供同一主体的少量图片与标识，默认 n=5。额外负图和自动问答由系统准备。',status:'尚未执行主体参数优化'},
 {title:'构造两类监督',detail:'识别保留正 / 负图；属性回答由 LLaVA 看参考图合成，但随后优化时去掉图像。两类数据并列使用，不是规定的先后训练阶段。',status:'数据准备：识别有图 / 属性优化无图'},
 {title:'优化主体参数',detail:'通过目标回答的 loss 更新 θ：1 个标识输入嵌入、16 个 latent 嵌入、新标识输出列。基础模型其余参数冻结。',status:'只有新主体相关变量更新'},
 {title:'保留学好的表示',detail:'每主体至多训练 15 epochs；原文按训练集 recognition accuracy 选择最佳 checkpoint。得到的表示可在后续查询中复用。',status:'checkpoint 依据是训练集，不是测试集'},
];
const inferenceSteps=[
 {title:'调用已有主体表示',detail:'使用已经个性化的主体提示及标识输出权重；不重复提供整个参考图库。',status:'参数固定：没有新的优化'},
 {title:'加入当前查询',detail:'纯文本问题调用已学属性；视觉问题另加入一张当前图片，经冻结的视觉编码器和 projector 得到视觉表示。',status:'文字问题 + 可选当前图片'},
 {title:'冻结 LMM 生成回答',detail:'LLaVA 使用主体提示、问题及可选视觉信息生成回答。识别由 LMM 回答完成，无推理时外部身份识别器。',status:'生成回答，不执行参数更新'},
];
function PipelineSwitch(){
 const [mode,setMode]=useState<'training'|'inference'>('training');
 const [step,setStep]=useState(0);
 const steps=mode==='training'?trainingSteps:inferenceSteps;
 const current=steps[step];
 return <Panel feature="pipeline"><Tabs value={mode} onChange={v=>{setMode(v);setStep(0)}} label="训练与推理" options={[{value:'training',label:'训练 Training'},{value:'inference',label:'推理 Inference'}]}/>
 <div className="yl-flow">{steps.map((s,i)=><React.Fragment key={s.title}>{i>0&&<span className="yl-arrow" aria-hidden="true">→</span>}<button className="yl-node" aria-pressed={step===i} onClick={()=>setStep(i)}><span className="yl-number">{i+1}</span><b>{s.title}</b><small>{i===step?'正在查看':'点击探索'}</small></button></React.Fragment>)}</div>
 <div className="yl-card white yl-step-detail" aria-live="polite"><h5>{current.title}</h5><p>{current.detail}</p>
 {mode==='training'&&step===0&&<Gallery/>}
 {mode==='training'&&step===1&&<div className="yl-two-branch"><div className="yl-branch"><b>识别监督</b><div className="yl-tags"><span className="yl-tag">保留图像</span><span className="yl-tag">Yes / No</span></div><p className="yl-caption">默认约 100 easy + 100 hard negatives。CLIP 只用于离线准备相似负图。</p></div><div className="yl-branch"><b>属性问答监督</b><div className="yl-tags"><span className="yl-tag">合成时看图</span><span className="yl-tag train">优化时无图</span></div><p className="yl-caption">使用 10 个主体类型相关问题模板，自动生成答案并替换主体名称。</p></div></div>}
 {(mode==='training'&&step>=2||mode==='inference'&&step===0)&&<><div className="yl-code">&lt;bo&gt; is &lt;token₁&gt; … &lt;token₁₆&gt;.</div><Tokens/></>}
 {mode==='inference'&&step===1&&<div className="yl-tags"><span className="yl-tag">Textual：没有新图</span><span className="yl-tag">Visual：当前图像路径启用</span></div>}
 {mode==='inference'&&step===2&&<div className="yl-code">已学提示 + 问题 + 可选视觉表示 → 个性化回答</div>}
 </div>
 <div className="yl-step-controls" role="group" aria-label="流程步骤控制"><button onClick={()=>setStep(step-1)} disabled={step===0}>上一步</button><span>第 {step+1} / {steps.length} 步</span><button onClick={()=>setStep(step+1)} disabled={step===steps.length-1}>{step===steps.length-1?'本流程已完成':'下一步'}</button><button onClick={()=>setStep(0)}>重置流程</button></div>
 <Feedback tone={mode==='inference'?'good':'guide'}>{current.status}</Feedback><Teaching>根据 §3–4 重绘；步骤用于教学探索，不模拟真实训练。两类监督不表示两个顺序优化阶段</Teaching><Source page={4}>§3–4，pp.4–7（checkpoint：p.7）</Source></Panel>
}

const conversations={
 text:{title:'纯文本：调用已学外观',file:null,source:'Table 7，p.9',page:9,question:'请详细描述 <bo>。',answer:'<bo> 是一只具有狐狸般外观的柴犬……',basis:'回答依据学习到的主体属性，不来自当前图片。',boundary:'这是论文未用该问题训练的定性例子；此处为中文转述。无新图不能断言它现在在哪里。'},
 visual:{title:'新图包含主体：身份与场景结合',file:'bo-park',source:'Table 3，p.6',page:6,question:'图片里有 <T> 和 <bo> 吗？能描述这个场景吗？',answer:'能看到 <T> 和 <bo>。他们在公园的草地上；<T> 抱着 <bo>。',basis:'主体提示提供身份关联，新图片提供“公园、草地、抱着”的场景线索。',boundary:'Table 3 是 T 与 bo 两个已学主体的例子；原文未详述两套主体表示的组合载入实现。此处仅展示其报告的输入与回答。'},
 absent:{title:'新图不含主体：同类别不等于同个体',file:'other-cats',source:'Table 12，p.17',page:17,question:'这张图里有 <mam> 吗？',answer:'图片中没有 <mam>；这里是另外两只猫。',basis:'模型仍需对新图进行主体识别，不能看到猫就回答 <mam>。',boundary:'主体换为 <mam>，用于展示拒认例子；不是与 <bo> 进行同一段对话。'},
};
function ConversationSwitch(){
 const [mode,setMode]=useState<keyof typeof conversations>('text');
 const [evidence,setEvidence]=useState<'learned'|'image'|null>(null);
 const x=conversations[mode];
 const learned=mode==='text';
 const correct=evidence===(learned?'learned':'image');
 return <Panel feature="conversation"><Tabs value={mode} onChange={v=>{setMode(v);setEvidence(null)}} label="对话输入" options={[{value:'text',label:'纯文本 Textual'},{value:'visual',label:'图片含主体 Visual'},{value:'absent',label:'图片不含主体'}]}/>
 <div className="yl-grid"><div className="yl-card"><h5>{x.title}</h5>{x.file?<Photo file={x.file} caption={`论文原图（局部）· ${x.source}`} scene/>:<div className="yl-no-image"><span aria-hidden="true">T</span><b>没有新输入图片</b></div>}<div className="yl-tags"><span className="yl-tag train">{mode==='absent'?'<mam>':mode==='visual'?'<T> 与 <bo>':'<bo>'} 的已学主体信息</span><span className="yl-tag">{learned?'文字问题':'文字 + 新图片'}</span></div></div>
 <div><div className="yl-bubble"><strong>用户问题 · 中文转述 / 节选</strong>{x.question}</div><div className="yl-bubble answer"><strong>Yo’LLaVA 回答 · 中文转述 / 节选</strong>{x.answer}</div><p>{x.basis}</p>
 <div className="yl-route"><div className="yl-tags"><span className="yl-tag learned">已学主体信息</span><span className={`yl-tag ${learned?'inactive':'lit'}`}>{learned?'当前图像路径：无输入':'当前图像路径：启用'}</span><span className="yl-tag lit">冻结 LMM → 回答</span></div><div className="yl-caption">教学路径 / 根据 §3 重绘。{learned?'此例只使用已学主体信息与文字，没有当前图像观察。':'已学身份信息与当前观察共同使用，不用新图重新训练。'}</div></div></div></div>
 <Feedback>{x.boundary}</Feedback>
 <div className="yl-evidence-choice"><h5>判断证据来源</h5><p>{learned?'回答 bo 的已学外观，主要依靠哪一类信息？':mode==='visual'?'“此刻在公园被抱着”这一场景判断，还必须查看什么？':'要判断“这一张图没有 mam”，还必须查看什么？'}</p>
 <Tabs value={evidence??''} onChange={v=>setEvidence(v as 'learned'|'image')} label="证据来源选择" options={[{value:'learned',label:'已学主体信息'},{value:'image',label:'当前图片证据'}]}/>
 {evidence!==null&&<Feedback tone={correct?'good':'bad'}><b>{correct?'判断正确。':'再区分属性与当前场景。'}</b>{learned?'该例没有新图，已学属性来自 personalization；无法据此知道当前地点。':'已学表示帮助关联身份，但主体是否在这张图里、正在做什么，都需要当前图片证据。'}</Feedback>}
 <div className="yl-caption">教学判断题，不增加新的模型输出或实验数据。</div></div>
 <Source page={x.page}>{x.source}；不同主体与案例不构成连续聊天记录</Source></Panel>
}

const results=[
 {name:'主体识别',tag:'Recognition',score:'92.4',metric:'weighted accuracy (%) ↑',protocol:'40 主体数据集；weighted = 0.5 × 正例正确率 + 0.5 × 负例正确率，不按正负样本量加权。默认 5 张参考图，k=16。',source:'Table 5，p.8',bars:[['Vanilla LLaVA',50],['LLaVA 人工文本提示',82.2],['Yo’LLaVA',92.4]],meaning:'正例正确率 94.9%，负例正确率 89.8%。同时会认出与会拒认，才支持 92.4% 这个识别指标。',caveat:'并非所有条件都最好：GPT-4V 5 图提示为 92.5%。其提示约 5K tokens；本文学习表示含 16 个 latent tokens。输入与 personalization 条件不同，不能据此宣称推理速度提升。'},
 {name:'文本问答',tag:'Textual QA',score:'88.3',metric:'A/B answer accuracy (%) ↑',protocol:'400 条 A/B 问答；问题中引用主体；Yo’LLaVA 测试时没有新图片；GPT 图提示基线仍提供参考图。',source:'Table 5，p.8',bars:[['Vanilla LLaVA',65.9],['LLaVA 自动短描述',80.3],['Yo’LLaVA',88.3]],meaning:'主体表示能够支持无新图的属性问题；相比自动短描述提示，提高 8.0 个百分点。',caveat:'GPT-4V 参考图提示达到 98.2% / 98.7%，高于本文。这项准确率不是开放式多轮对话综合评分。'},
 {name:'视觉问答',tag:'Visual QA',score:'92.9',metric:'A/B answer accuracy (%) ↑',protocol:'171 条 A/B 问答；输入测试新图片和文字问题。',source:'Table 5，p.8',bars:[['Vanilla LLaVA',89.9],['LLaVA 人工文本提示',92.5],['Yo’LLaVA',92.9]],meaning:'结合新图与主体提示可以回答视觉问题；比基础 LLaVA 高 3.0 个百分点。',caveat:'人工提示基线已经较强，GPT-4V 人工文本提示为 93.6%，仍高于本文；不应写成全面领先。'},
 {name:'caption 使用主体名',tag:'Name recall',score:'100.0',metric:'identifier recall (%) ↑',protocol:'独立的 29 物体协议。生成 caption 中主体标识至少出现一次即计入名称 recall。',source:'Table 6，p.8',bars:[['MyVLM',96],['Yo’LLaVA',100]],meaning:'学到的标识能够进入生成输出。与 MyVLM 的这项比较限于名称使用，不衡量整句事实完整性。',caveat:'100% 不表示 caption 100% 正确。MyVLM 的识别数字来自外部 concept heads，本文识别来自 LMM 回答，两者机制不同。'},
];
function Bars({bars,selected}:{bars:(string|number)[][];selected?:number}){return <div className="yl-bars">{bars.map((b,i)=><div className="yl-bar-row" key={String(b[0])}><span>{b[0]}</span><div className="yl-bar-track"><div className={`yl-bar-fill ${String(b[0]).includes('Yo')||selected===i?'method':''}`} style={{width:`${b[1]}%`}}/></div><span className="yl-bar-value">{Number(b[1]).toFixed(1)}%</span></div>)}</div>}
function ResultsCards(){const [selected,setSelected]=useState(0);const r=results[selected];return <Panel feature="results"><div className="yl-fact-list"><div className="yl-fact"><b>数据 / 主体</b><p>40 主体：人 10、宠物 5、地标 5、物品 15、虚构主体 5；每主体 10–20 图，默认 5 参考、5–10 测试。</p></div><div className="yl-fact"><b>Backbone / 基线</b><p>LLaVA-1.5-13B；Vanilla、自动/人工文本提示、GPT-4V 图像提示；另在 29 物体协议比较 MyVLM。</p></div></div><div className="yl-grid yl-results-selectors">{results.map((x,i)=><button key={x.tag} className={`yl-card yl-result-button ${selected===i?'active':''}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}><div className="yl-kicker">{x.tag}</div><h5>{x.name}</h5><div className="yl-big">{x.score}<span className="yl-unit">%</span></div><p>{x.metric}</p><span className="yl-caption">{x.source}</span></button>)}</div><div className="yl-current-result" aria-live="polite" aria-atomic="true"><div><strong>{r.name}</strong><span>{r.metric} · {r.source}</span></div><b>{r.score}%</b></div><div className="yl-result-detail"><div className="yl-kicker">当前任务的受控比较</div><h5>{r.name}</h5><p>{r.protocol}</p><Bars bars={r.bars}/><div className="yl-caption">从 0% 起始，条长仅表示当前任务中的同一指标。↑ 越高越好。</div><Feedback tone="good">{r.meaning}</Feedback><p style={{marginTop:18,fontSize:16,color:'#68778f'}}>{r.caveat}</p></div><Source page={8}>{r.source}；数值由论文比例转为百分比展示</Source></Panel>}

const stages=[['Vanilla LLaVA',50],['+ 识别数据',70.7],['+ 属性对话数据',75.4],['+ 检索困难负例',91.4]] as const;
type PlotMetric='weighted'|'positive'|'negative';
const plotMetrics:Record<PlotMetric,{label:string;detail:string;origin:number;span:number;width:number}>={
 weighted:{label:'正负等权 Weighted',detail:'0.5 × 正例正确率 + 0.5 × 负例正确率。会认出和会拒认需要一起衡量。',origin:36,span:206,width:272},
 positive:{label:'正例 Positive',detail:'图中确实有主体时答对 Yes 的比例。只看负例表现不能替代这个识别能力。',origin:36,span:206,width:255},
 negative:{label:'负例 Negative',detail:'图中没有主体时答对 No 的比例。全部拒认可得到很高负例分数，却不能认出主体。',origin:54,span:206,width:272},
};
function AblationExplorer(){
 const [view,setView]=useState<'data'|'images'|'tokens'>('data');
 const [stage,setStage]=useState(3);
 const [n,setN]=useState(5);
 const [k,setK]=useState<0|16>(16);
 const [metric,setMetric]=useState<PlotMetric>('weighted');
 const m=plotMetrics[metric];
 const marker=(m.origin+m.span*(view==='images'?(n-1)/9:k/36))/m.width*100;
 const previous=stage===0?null:stages[stage-1][1];
 return <Panel feature="ablation"><Tabs value={view} onChange={setView} label="消融类型" options={[{value:'data',label:'训练数据设置'},{value:'images',label:'参考图数量 n'},{value:'tokens',label:'latent token 数量 k'}]}/>
 {view==='data'?<><div className="yl-kicker">累计数据配置 · Table 7</div><Tabs value={stage} onChange={setStage} label="累计数据设置" options={stages.map((s,i)=>({value:i,label:s[0]}))}/>
 <div className="yl-card white"><div className="yl-axis-value"><b>{stages[stage][0]}</b><span className="yl-big">{stages[stage][1].toFixed(1)}<span className="yl-unit">%</span></span></div><Bars bars={stages.slice(0,stage+1).map(s=>[s[0],s[1]])} selected={stage}/>
 <div className="yl-tags"><span className="yl-tag">weighted recognition accuracy ↑</span><span className="yl-tag train">{previous===null?'基线':`相对上一累计配置：+${(stages[stage][1]-previous).toFixed(1)} 个百分点`}</span></div>
 <div className="yl-bubble"><strong>未训练的问题 · Table 7 中文转述</strong>请详细描述 &lt;bo&gt;。</div><div className={`yl-bubble ${stage>=2?'answer':''}`}><strong>该配置的定性回答 · 节选 / 中文转述</strong>{stage<2?'抱歉，我不确定你在问什么……':'<bo> 是一只具有狐狸般外观的柴犬……'}</div><div className="yl-caption">差值由原表相减；定性样例不是另一项 QA 准确率。累计配置不代表四个规定训练阶段。</div></div>
 <Feedback tone={stage>=2?'good':'guide'}>{['基础模型几乎全部拒认，正负等权后为 50.0%，并非认出了一半主体。','加入识别监督可提升到 70.7%，但未训练的描述请求仍不能回答。','增加属性对话数据后为 75.4%，并能回答这个未训练的描述请求。','加入检索困难负例后，75.4% → 91.4%；这组累计配置支持相似主体区分的重要性。'][stage]}</Feedback></>:
 <><div className="yl-grid"><div className="yl-card"><div className="yl-kicker">{view==='images'?'固定 k=16 · Figure 5 下排':'固定 n=10 · Figure 5 上排'}</div><h5>{view==='images'?'参考图片数量':'latent tokens 数量'}</h5>
 {view==='images'?<><div className="yl-axis-value"><label htmlFor="reference-count">n = {n} 张</label><b>{n===5?'论文默认':''}</b></div><input id="reference-count" className="yl-range" type="range" min={1} max={10} step={1} value={n} onChange={e=>setN(Number(e.target.value))}/><div className="yl-range-label"><span>1 张</span><span>10 张</span></div></>:<Tabs value={k} onChange={setK} label="latent tokens" options={[{value:0,label:'k=0：仅主体标识'},{value:16,label:'k=16：论文选择'}]}/>}
 <div className="yl-code" style={{marginTop:20}}>{view==='images'?`横轴：n=${n}`:`新输入表示数：k+1=${k+1}`}</div>
 <p className="yl-caption">只定位原曲线，不插值、不生成点值，也不联合预测 n×k 性能。</p></div>
 <div><Tabs value={metric} onChange={setMetric} label="消融曲线指标" options={(Object.keys(plotMetrics) as PlotMetric[]).map(v=>({value:v,label:plotMetrics[v].label}))}/>
 <div className="yl-axis-wrap"><img src={`./images/figure5-${view}-${metric}.png`} alt={`Figure 5 ${view==='images'?'下排图片数':'上排token数'} / ${m.label} 原始曲线`}/><span className="yl-axis-marker" style={{left:`${marker}%`}}/></div>
 <div className="yl-caption">论文原图（局部）· Figure 5，p.9。橙线只定位横轴，不表示该点的预测性能。原图阴影的统计定义未说明。</div>
 <p className="yl-metric-explainer" style={{marginTop:14,fontSize:16}}>{m.detail}</p></div></div>
 <Feedback>{view==='images'?(n===5?'作者报告：n=5 是该消融达到 90%+ 表现的最少图数；这是正文的近似结论，不能给每个主体作保证。':`正在查看 n=${n} 的原图位置。正文未列该点精确值，局部变化并非单调。`):(k===16?'作者正文报告 k=16 约为 91%，此实验固定 n=10；不要与默认 n=5 的 Table 5 92.4% 混写。':'k=0 仍优化标识输入与对应输出权重。正文写 24% 却未明确指标；读图看它接近正例曲线，不能据此称 weighted accuracy 为 24%。')}</Feedback>
 <details style={{marginTop:18}}><summary style={{cursor:'pointer'}}>查看完整 Figure 5 与原文歧义</summary><Photo file="figure-5" caption="Figure 5 原图局部：上排 token 数，下排图数量，三列为负例、正例、等权"/><p className="yl-caption">正文写 k 变化到 36，图最后标注刻度为 32，右侧还有点；保留原图，不补画刻度。此处 k=0 / 16 对应位置已核对。24% 的指标歧义在正式版与 arXiv v2 中均存在。</p></details></>}
 <Source page={9}>{view==='data'?'Table 7':'Figure 5 / §6'}，p.9</Source>
 <div className="yl-rule"/><h5>泛化证据：从参考图走向新图</h5><div className="yl-grid"><Photo file="mam-desk" caption="论文原图（局部）· Table 12：mam 在桌旁的新场景" scene/><Photo file="mam-bath" caption="论文原图（局部）· Table 12：mam 洗澡，外观与情境变化" scene/></div>
 <Feedback>测试新图片、未训练描述问题与定性样例支持有限迁移；不能推断任意姿态、遮挡或长期变化都能可靠识别。</Feedback>
 <div className="yl-fact-list"><div className="yl-fact"><b>迁移范围</b><p>部分新图、新场景、新问题有成功例子，缺少系统姿态与外观变化评测。</p></div><div className="yl-fact"><b>底座能力</b><p>Table 8 中 MMBench / Wild 保持；POPE 部分设置小幅下降，不能称完全无损。</p></div></div><Source page={17}>Table 12，p.17；Table 7，p.9；Table 8，p.13</Source>
 </Panel>
}

const failures={
 miss:{name:'漏认：本人被判不在图中',file:'failure-negative',question:'请检查图片里是否有 <T>。',answer:'我可以确认 <T> 不在这张照片中。',truth:'<T> 实际在图片中。',why:'作者指出小脸的细粒度识别尤其困难；该图展示漏认，但没有单独隔离因素的因果实验。'},
 confusion:{name:'误认：相似人物被当作本人',file:'failure-positive',question:'这张照片是 <T> 吗？请解释。',answer:'这是 <T> 的照片……她戴着眼镜，头发上有星形装饰。',truth:'照片中的人不是 <T>。',why:'相似的外观线索并不能确定个体身份。'},
 hallucination:{name:'幻觉：编造未提供的个人信息',file:null,question:'你知道 <T> 的生日吗？',answer:'我知道，<T> 的生日是 12 月 25 日。',truth:'论文将该日期标为模型猜测，参考图没有提供生日证据。',why:'学习主体外观没有解决语言模型的无依据生成；同表还展示虚构手表细节。'},
};
function FailureExplorer(){const [item,setItem]=useState<keyof typeof failures>('miss');const f=failures[item];return <Panel feature="failures"><div className="yl-kicker">作者明确指出 · Appendix E / Table 15</div><Tabs value={item} onChange={setItem} label="失败类型" options={[{value:'miss',label:'漏认 False negative'},{value:'confusion',label:'误认 False positive'},{value:'hallucination',label:'幻觉 Hallucination'}]}/><div className="yl-grid"><div className="yl-card"><h5>{f.name}</h5>{f.file?<Photo file={f.file} caption="论文原图（局部）· Table 15，p.20" scene/>:<div className="yl-no-image"><span aria-hidden="true">?</span><b>生日没有参考图证据</b></div>}</div><div><div className="yl-bubble"><strong>问题 · 中文转述</strong>{f.question}</div><div className="yl-bubble error"><strong>错误回答 · 中文转述</strong>{f.answer}</div><p><b>真实情况：</b>{f.truth}</p></div></div><Feedback tone="bad">{f.why}</Feedback><Source page={20}>Appendix E；Table 15，p.20</Source><div className="yl-rule"/><h5>根据实验范围可以观察到</h5><div className="yl-fact-list"><div className="yl-fact"><b>多主体：有例子，规模尚未验证</b><p>Table 3 的 T 与 bo 可同时出现；不应写成“不支持多主体”。大规模多主体共存没有系统测试。</p></div><div className="yl-fact"><b>外观变化：证据有限</b><p>洗澡等新图有成功例子；跨长期外观、严重遮挡与难场景的可靠性没有充分评测。</p></div><div className="yl-fact"><b>新主体：仍要 personalization</b><p>训练较少参数，不等于零训练成本；本文每主体至多 15 轮，未报告统一分钟级耗时。</p></div><div className="yl-fact"><b>记忆、偏好与持续状态</b><p>论文学习主体视觉表示，未实现并验证长期记忆系统、持续更新状态或完整 Personal Agent。</p></div></div><Feedback>作者还讨论偏见、幻觉与评测复杂性。结论中的用户偏好及更多个人信息属于未来方向，不能当作本文已实现能力。</Feedback><details style={{marginTop:20}}><summary style={{cursor:'pointer'}}>查看原始失败案例表</summary><div className="yl-original" style={{marginTop:16}}><Photo file="failure-table" caption="论文原图（局部）· Table 15：红字标出作者指出的错误"/></div></details><Source page={13}>Appendix A，p.13；Conclusion，p.10；Table 3，p.6</Source></Panel>}

const quiz=[
 {q:'latent tokens 在这里是什么？',options:['可学习的连续输入嵌入','普通词表中选出的 16 个描述词'],correct:0,feedback:'它们通过回答监督优化，不需要对应人类可读单词，也没有固定的逐槽属性含义。'},
 {q:'学习主体以后，推理时需要做什么？',options:['每个问题都重新优化主体参数','调用已学主体提示，结合新文字或图片生成回答'],correct:1,feedback:'personalization 与推理分开；新图片用于当前场景理解，不是每次重新学习的参考图库。'},
 {q:'Table 6 的名称 recall 为 100% 意味着什么？',options:['caption 中至少出现一次主体标识','所有生成句子的身份、属性和场景描述都正确'],correct:0,feedback:'名称 recall 只统计标识是否出现。这项结果不证明整句 caption 的事实完全正确。'},
];
function SummaryCheck(){const [question,setQuestion]=useState(0);const [answer,setAnswer]=useState<number|null>(null);const q=quiz[question];return <Panel feature="summary"><div className="yl-flow">{['少量参考图','学习主体表示','调用文字 / 新图','个性化回答'].map((x,i)=><React.Fragment key={x}>{i>0&&<span className="yl-arrow">→</span>}<div className="yl-node"><b>{x}</b></div></React.Fragment>)}</div><Teaching>根据全文重绘</Teaching><Tabs value={question} onChange={v=>{setQuestion(v);setAnswer(null)}} label="理解检查" options={quiz.map((_,i)=>({value:i,label:`判断 ${i+1}`}))}/><h5>{q.q}</h5>{q.options.map((x,i)=><button className="yl-option" aria-pressed={answer===i} onClick={()=>setAnswer(i)} key={x}>{x}</button>)}{answer!==null&&<Feedback tone={answer===q.correct?'good':'bad'}><b>{answer===q.correct?'✓ 理解正确。':'✕ 还需区分。'}</b>{q.feedback}</Feedback>}<div className="yl-rule"/><div className="yl-grid"><div className="yl-card"><h5>本文解决了什么</h5><p>给通用 LMM 注入少量参考图对应的具体主体表示，并支持之后的文本与视觉问题。</p></div><div className="yl-card"><h5>仍需谨慎的地方</h5><p>身份混淆与幻觉仍存在；问答评测范围有限，不能将表示学习等同于长期个人 Agent。</p></div></div><Links/><Source page={4}>§3.1；Table 5–7；Appendix E</Source></Panel>}

export function YoLLaVAWidgets({view,chapterId=''}:{view?:string;chapterId?:string}){
 switch(view){
  case 'hero-generic':return <HeroScene personal={false}/>;
  case 'hero-personalized':return <HeroScene personal/>;
  case 'album-analogy':return <AlbumAnalogy chapterId={chapterId}/>;
  case 'generic-compare':return <GenericCompare/>;
  case 'overview-map':return <OverviewMap/>;
  case 'subject-architecture':return <SubjectArchitecture/>;
  case 'training-objective':return <TrainingObjective/>;
  case 'pipeline-switch':return <PipelineSwitch/>;
  case 'conversation-switch':return <ConversationSwitch/>;
  case 'results-cards':return <ResultsCards/>;
  case 'ablation-explorer':return <AblationExplorer/>;
  case 'failure-explorer':return <FailureExplorer/>;
  case 'summary-check':return <SummaryCheck/>;
  default:return null;
 }
}
