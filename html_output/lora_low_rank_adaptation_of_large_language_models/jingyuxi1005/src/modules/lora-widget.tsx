import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

type State = { choice: string; rank: number; step: number; coverage: number; started: boolean; synced: boolean; focus: string; route: number; round: number };
const ranks = [1, 2, 4, 8, 64];
const ink = '#17324c', muted = '#678097', blue = '#355c91', green = '#208866', red = '#c65b61', orange = '#dc9350', lineColor = '#d5e2e8';

function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 14) {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
}
function stroke(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = lineColor, radius = 14) {
  c.strokeStyle = color; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x, y, w, h, radius); c.stroke();
}
function txt(c: CanvasRenderingContext2D, t: string, x: number, y: number, size = 18, color = ink, bold = false) {
  c.fillStyle = color; c.font = `${bold ? 700 : 500} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`; c.fillText(t, x, y);
}
function path(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = blue, width = 3) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function photo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tint = 0) {
  box(c,x,y,w,h,'#e8d7bc',12); c.save(); c.beginPath(); c.roundRect(x,y,w,h,12); c.clip();
  c.fillStyle='#c5d9db'; c.fillRect(x,y,w,h*.58); c.fillStyle='#f6e9d2'; c.beginPath(); c.arc(x+w*.73,y+h*.25,h*.14,0,Math.PI*2); c.fill();
  c.fillStyle='#72927e'; c.beginPath(); c.moveTo(x,y+h*.82); c.lineTo(x+w*.24,y+h*.42); c.lineTo(x+w*.52,y+h*.82); c.closePath(); c.fill();
  c.fillStyle='#497e78'; c.beginPath(); c.moveTo(x+w*.24,y+h); c.lineTo(x+w*.7,y+h*.35); c.lineTo(x+w,y+h*.83); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  if(tint>0){c.fillStyle=`rgba(57,117,183,${Math.min(.46,tint*.46)})`;c.fillRect(x,y,w*tint,h);}
  c.restore(); stroke(c,x,y,w,h,'#aabcb6',12);
}
function matrix(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, label: string) {
  box(c,x,y,w,h,color,8); txt(c,label,x+12,y+Math.min(35,h*.55),16,'#fff',true);
}
function pill(c: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, active = false) {
  box(c,x,y,w,53,active?green:'#e8eef2',11); txt(c,label,x+15,y+33,18,active?'#fff':ink,true);
}
function draw(c: CanvasRenderingContext2D, chapterId: string, moduleId: string, s: State, phase: number, w: number, h: number) {
  c.clearRect(0,0,w,h); box(c,0,0,w,h,'#f7faf8',18);
  if(chapterId==='hero') {
    photo(c,30,22,w-60,h-55,moduleId==='new'?1:0);
    if(moduleId==='old') { box(c,w-168,45,122,96,'rgba(198,91,97,.92)',10); txt(c,'整份复制',w-152,100,18,'#fff',true); }
    else {box(c,w-173,50,129,87,'rgba(32,136,102,.9)',10);txt(c,'仅存 BA',w-159,101,18,'#fff',true);}
    return;
  }
  if(moduleId==='ana') {
    photo(c,34,16,380,108,chapterId==='chap-3'||chapterId==='chap-6'?.75:0);
    const bx=62+(phase%1)*310; box(c,bx,22,16,96,'rgba(220,147,80,.65)',7);
    box(c,443,34,89,69,'#e6eeeb',10); txt(c,chapterId==='chap-10'?'边界':'任务层',456,75,17,green,true); return;
  }
  const n=Number(chapterId.replace('chap-',''));
  box(c,18,18,510,242,'#fff',15); stroke(c,18,18,510,242);
  box(c,550,18,512,242,'#fff',15); stroke(c,550,18,512,242);
  if(n===1){
    photo(c,47,59,177,144); txt(c,'一个预训练底座',45,45,19,ink,true);
    [0,1,2].forEach((i)=>{box(c,262+i*77,81,59,95,s.synced?'#d8eee5':'#f4d6d8',6);txt(c,s.synced?'BA':'W',273+i*77,133,18,s.synced?green:red,true);});
    txt(c,'任务 A / B / C',269,202,18,muted); txt(c,s.synced?'共享 W₀ + 三个小增量':'每个任务复制完整权重',584,105,24,s.synced?green:red,true);
    txt(c,'权重副本的方向性示意',584,145,17,muted); txt(c,'训练显存还取决于梯度与优化器状态',584,183,17,ink);
  } else if(n===2){
    txt(c,'LoRA 之前：把训练缩到一小部分',47,54,21,ink,true);
    if(s.choice==='adapter') {
      pill(c,61,116,94,'原层'); pill(c,221,116,124,'Adapter',true); path(c,157,143,214,143,blue);
      txt(c,'新增串行模块',583,82,25,blue,true);
      txt(c,'论文所测设置：小 batch 下有延迟代价',583,137,18,ink);
    } else if(s.choice==='prefix') {
      [0,1,2].forEach(i=>box(c,66+i*53,103,40,52,'#cfc6e8',7));
      pill(c,276,103,170,'原输入'); path(c,225,129,268,129,blue);
      txt(c,'学习前缀表示',583,82,25,blue,true);
      txt(c,'会占用输入序列预算',583,137,18,ink);
    } else {
      matrix(c,84,94,333,103,blue,'原权重');
      [0,1,2].forEach(i=>box(c,120+i*76,122,43,46,green,5));
      txt(c,'只更新选定参数',583,82,25,blue,true);
      txt(c,'训练规模取决于选哪些原权重',583,137,18,ink);
    }
    txt(c,'点击下方方案，观察结构与取舍',583,193,17,muted);
  } else if(n===7){
    const labels=({'ft':'Full FT','adapter':'Adapter','prefix':'Prefix / Prompt'} as Record<string,string>);
    txt(c,'被比较方法',49,64,19,muted); txt(c,labels[s.choice],50,112,27,red,true);
    txt(c,'训练对象 / 推理结构 / 任务存储',49,185,18,ink);
    txt(c,'固定参照',584,64,19,muted); txt(c,'LoRA',584,112,29,green,true);
    txt(c,s.focus==='train'?'只训练 A、B':s.focus==='infer'?'合并后保持稠密层形状':'共享底座 + 小任务模块',584,185,19,green,true);
  } else if(n===3){
    photo(c,48,49,436,170,s.coverage/100); txt(c,'W₀ 冻结',47,40,19,blue,true);
    matrix(c,591,84,171,110,blue,'W₀'); txt(c,'+',781,148,28,ink,true);
    matrix(c,824,100,73,78,green,'B'); matrix(c,922,100,72,78,orange,'A');
    txt(c,'ΔW = BA',792,63,20,green,true); txt(c,`可见调色层 ${s.coverage}%`,590,228,17,muted);
  } else if(n===4 && moduleId==='4.1'){
    const full=4096*4096, small=s.rank*8192, ratio=(small/full*100).toFixed(2);
    matrix(c,52,70,396,131,red,'完整 ΔW'); txt(c,'4096 × 4096',64,226,18,muted);
    matrix(c,595,80,80,111,green,'B'); txt(c,'×',699,150,27,ink,true); matrix(c,746,108,245,54,orange,'A');
    txt(c,`r = ${s.rank} · 比例 ${ratio}%`,591,218,20,ink,true);
  } else if(n===4){
    const labels=['完整更新 ΔW','拆成 B 与 A','比较可训练参数'];
    txt(c,labels[s.step],57,67,22,ink,true); matrix(c,70,104,s.step===0?391:93,107,s.step===0?red:green,s.step===0?'ΔW':'B');
    if(s.step>0) matrix(c,194,129,274,57,orange,'A');
    txt(c,s.step===0?'dk':s.step===1?'B: d×r；A: r×k':'dk → r(d+k)',598,137,28,s.step===2?green:blue,true);
    txt(c,'W₀ 仍需保存与加载',598,190,18,muted);
  } else if(n===5 && moduleId==='5.1'){
    txt(c,'简化的注意力投影',52,61,22,ink,true);
    ['q','k','v','o'].forEach((k,i)=>{const active=s.choice==='qv'?(k==='q'||k==='v'):s.choice===k; pill(c,53+i*111,112,85,'W'+k,active);});
    path(c,91,171,449,171,'#aec4cc',2); txt(c,'论文主实验：Wq + Wv',582,87,23,green,true);
    txt(c,s.choice==='qv'?'当前高亮主设置':`当前查看 W${s.choice}；位置消融包含它`,583,135,18,blue);
    txt(c,'方法可加在稠密层；并非只能加这两处',583,183,17,muted);
  } else if(n===5){
    const rows=[['q','Wq',70.4,91.0],['v','Wv',73.0,91.0],['qv','Wq+Wv',73.7,91.3],['all','四投影',73.7,91.7]] as const;
    rows.forEach((r,i)=>{const y=55+i*48;box(c,48,y,428,39,s.choice===r[0]?'#d8eee5':'#eef3f5',8);txt(c,r[1],65,y+26,18,ink,true);txt(c,`WikiSQL ${r[2]}`,226,y+26,17,blue);});
    const selected=rows.find(r=>r[0]===s.choice)||rows[2];
    txt(c,'GPT-3 · 表 5 · 约 18M 参数',580,71,20,ink,true);txt(c,`${selected[1]}  MNLI ${selected[3]}%`,580,122,24,green,true);txt(c,'验证集准确率；越高越好',580,167,17,muted);
  } else if(n===6){
    const labels=['冻结原权重','训练低秩分支','合并为稠密权重','不同任务切换'];
    photo(c,51,59,430,161,s.step>=2?1:0);txt(c,labels[s.step],591,85,23,ink,true);
    txt(c,s.step===0?'W₀ 不更新':s.step===1?'只训练 A 与 B':s.step===2?'Wmerged = W₀ + (α/r)BA':'每个任务需要对应的 BA',589,135,22,s.step===2?green:blue,true);
    txt(c,s.step===2?'比较条件：已合并、同形状稠密层':s.step===3?'已合并模块不便在批内动态混用':'训练态与部署态可以不同',589,187,17,muted);
  } else if(n===8){
    const labels=({'roberta':['RoBERTa','GLUE · 文本理解'],'deberta':['DeBERTa','GLUE · 文本理解'],'gpt2':['GPT-2','E2E · 文本生成'],'gpt3':['GPT-3','WikiSQL / MNLI / SAMSum']} as Record<string,string[]>)[s.choice];
    photo(c,56,56,423,161);txt(c,'论文实验地图',58,44,21,ink,true);
    txt(c,labels[0],586,88,28,green,true);txt(c,labels[1],586,136,19,ink);
    txt(c,s.choice==='gpt2'?'示例指标：BLEU':s.choice==='gpt3'?'示例指标：准确率 / ROUGE':'GLUE：按子任务指标评价',586,188,18,muted);
  } else if(n===9 && moduleId==='9.1'){
    const data=({'mnli':['GPT-3 · MNLI-m','准确率 (%)',89.5,91.7,'175,255.8M','4.7M'],'wikisql':['GPT-3 · WikiSQL','验证准确率 (%)',73.8,73.4,'175,255.8M','4.7M'],'e2e':['GPT-2 medium · E2E','BLEU',68.2,70.4,'354.92M','0.35M']} as Record<string,(string|number)[]>)[s.choice];
    txt(c,data[0] as string,50,57,21,ink,true); const p=s.started?Math.min(1,phase*2):1;
    box(c,65,93,Math.max(15,(data[2] as number)*4.1*p),36,red,7);txt(c,`Full FT ${data[2]}`,65,154,18,red,true);
    box(c,65,178,Math.max(15,(data[3] as number)*4.1*p),36,green,7);txt(c,`LoRA ${data[3]}`,65,239,18,green,true);
    txt(c,data[1] as string,589,78,19,muted);txt(c,`FT: ${data[4]} 参数`,589,135,20,red,true);txt(c,`LoRA: ${data[5]} 参数`,589,184,20,green,true);
  } else if(n===9){
    const vals=[73.4,73.3,73.7,73.8,73.5];
    txt(c,'GPT-3 · WikiSQL · Wq+Wv',53,53,20,ink,true);
    const yFor=(v:number)=>207-(v-73.2)*190;
    [73.2,73.4,73.6,73.8].forEach(v=>{
      const y=yFor(v);path(c,73,y,457,y,'#d6e2e7',1);txt(c,v.toFixed(1),30,y+5,14,muted);
    });
    path(c,73,224,457,224,'#9db3bd',2);path(c,73,79,73,224,'#9db3bd',2);
    vals.forEach((v,i)=>{const x=103+i*82,y=yFor(v); box(c,x-9,y-9,18,18,ranks[i]===s.rank?green:'#9db3bd',9);txt(c,String(ranks[i]),x-8,248,16,ink);});
    txt(c,`r = ${s.rank}`,591,95,27,green,true);txt(c,`验证准确率 ${vals[ranks.indexOf(s.rank)].toFixed(1)}%`,591,146,23,ink,true);txt(c,'更大的 rank 不保证更好',591,199,18,muted);
    txt(c,'纵轴从 73.2% 起；WikiSQL 波动约 ±0.5%',591,238,15,muted);
  } else if(n===10){
    const names=['rank 与位置','底座仍在','任务切换','文本范围','后续四篇'];
    photo(c,52,49,427,170,s.step===4?.6:0);txt(c,names[s.step],587,85,24,s.step===4?green:ink,true);
    const info=['需结合任务选择，低 rank 不一定总有效。','基础模型仍需存储和加载。','已合并模块批内动态混用不直接。','原论文未验证视觉语言与长期偏好。','LoRA 与后续四篇构成五篇研究路线。'];
    txt(c,info[s.step],587,141,18,blue);txt(c,'箭头表示研究问题演进，不表示技术继承。',587,202,16,muted);
  }
}

const methodLabels:Record<string,string> = {ft:'Full FT',adapter:'Adapter',prefix:'Prefix / Prompt'};
const routeNodes = [
  ['LoRA','如何低成本适配大模型？'],
  ['VL-Adapter','如何高效适配视觉语言任务？'],
  ['MyVLM','如何识别用户特有视觉概念？'],
  ["Yo'LLaVA",'多模态大模型如何学习用户主体？'],
  ['PersonaVLM','如何维护长期偏好与记忆？']
] as const;
const comparisonDetails:Record<string,{train:string;infer:string;storage:string}> = {
  ft:{train:'更新全部原权重',infer:'沿原稠密结构推理',storage:'每任务保存完整权重'},
  adapter:{train:'训练新增小模块',infer:'所测串行结构可增加延迟',storage:'共享底座 + 任务模块'},
  prefix:{train:'训练前缀表示',infer:'推理时仍需前缀，占用序列预算',storage:'共享底座 + 任务前缀'},
  lora:{train:'冻结 W₀，只训练 A、B',infer:'合并缩放后的增量，保持原稠密结构',storage:'共享底座 + 小型 A、B'}
};

export const LoraWidget: React.FC<WidgetProps> = ({chapterId,moduleId}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [s,set] = useState<State>({choice:chapterId==='chap-2'?'adapter':chapterId==='chap-5'?'qv':chapterId==='chap-8'?'gpt3':chapterId==='chap-9'?'mnli':'ft',rank:8,step:0,coverage:0,started:false,synced:false,focus:'train',route:0,round:0});
  const isSmall=chapterId==='hero'||moduleId==='ana';
  const w=moduleId==='ana'?560:chapterId==='hero'?460:1080;
  const h=moduleId==='ana'?140:chapterId==='hero'?180:280;
  const n=Number(chapterId.replace('chap-',''));
  useEffect(()=>{
    const el=canvas.current;if(!el)return;const dpr=window.devicePixelRatio||1;el.width=w*dpr;el.height=h*dpr;el.style.width='100%';el.style.height='auto';
    const ctx=el.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
    let id=0;const start=performance.now();
    const tick=(now:number)=>{draw(ctx,chapterId,moduleId,s,(now-start)/1000,w,h);if(!el.classList.contains('is-ready'))el.classList.add('is-ready');id=requestAnimationFrame(tick);};
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[chapterId,moduleId,s,w,h]);
  const change=(patch:Partial<State>)=>set(prev=>({...prev,...patch}));
  const choose=(items:[string,string][],label='选择设置')=> <div className="lora-controls" role="group" aria-label={label}>{items.map(([key,text])=><button key={key} type="button" aria-pressed={s.choice===key} className={`lora-chip ${s.choice===key?'selected':''}`} onClick={()=>change({choice:key,started:false})}>{text}</button>)}</div>;
  const stepper=(max:number)=> <div className="lora-controls"><button type="button" className="lora-chip" onClick={()=>change({step:Math.max(0,s.step-1)})} disabled={s.step===0}>← 上一步</button><span className="lora-step">{s.step+1} / {max+1}</span><button type="button" className="lora-chip" onClick={()=>change({step:Math.min(max,s.step+1)})} disabled={s.step===max}>下一步 →</button></div>;
  const rankControl=()=> <div className="lora-controls" role="group" aria-label="选择秩 r">{ranks.map(r=><button key={r} type="button" aria-pressed={s.rank===r} className={`lora-chip ${s.rank===r?'selected':''}`} onClick={()=>change({rank:r})}>r={r}</button>)}</div>;
  const canvasPosition=(e:React.PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-rect.left)*w/rect.width,y:(e.clientY-rect.top)*h/rect.height};};
  const updateLayer=(e:React.PointerEvent<HTMLCanvasElement>)=>{const {x}=canvasPosition(e);change({coverage:Math.max(0,Math.min(100,Math.round((x-48)/436*100)))});};
  const onCanvasDown=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const {x,y}=canvasPosition(e);
    if(n===3&&y>=49&&y<=219&&x>=48&&x<=484){dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);updateLayer(e);return;}
    if(n===5&&moduleId==='5.1'&&y>=112&&y<=165){const i=Math.floor((x-53)/111);if(i>=0&&i<4&&x<=53+i*111+85)change({choice:['q','k','v','o'][i]});return;}
    if(n===5&&moduleId==='5.2'&&x>=48&&x<=476){const i=Math.floor((y-55)/48);if(i>=0&&i<4&&y<=55+i*48+39)change({choice:['q','v','qv','all'][i]});return;}
    if(n===9&&moduleId==='9.2'&&y>=70&&y<=255){const i=Math.round((x-103)/82);if(i>=0&&i<5&&Math.abs(x-(103+i*82))<30)change({rank:ranks[i]});}
  };
  const onCanvasMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(dragging.current)updateLayer(e);};
  const endCanvasDrag=()=>{dragging.current=false;};
  let control:React.ReactNode=null, feedback='';
  if(!isSmall){
    if(n===1){control=<div className="lora-controls"><button type="button" className="lora-chip selected" onClick={()=>change({synced:!s.synced})}>同步比较：{s.synced?'显示全量微调':'显示共享底座'}</button></div>;feedback=s.synced?'同一个 W₀ 支撑多个任务；各任务只需保存自己的 BA。':'全量微调为每个任务留下一份大权重更新。';}
    if(n===2){
      control=choose([['adapter','Adapter'],['prefix','Prefix / Prompt'],['partial','部分参数微调']],'LoRA 之前的方法');
      feedback=s.choice==='adapter'?'Adapter：新增可训练模块；论文所测配置里，额外串行计算会带来推理延迟。':s.choice==='prefix'?'Prefix / Prompt：学习前缀表示；前缀占用序列预算，效果也依配置变化。':'部分参数微调：只更新选中的原模型参数；需要决定更新哪些位置。';
    }
    if(n===7){
      control=<>{choose([['ft','Full FT'],['adapter','Adapter'],['prefix','Prefix / Prompt']],'选择与 LoRA 对照的方法')}
        <div className="lora-controls" role="group" aria-label="选择比较维度">{([['train','训练对象'],['infer','推理结构'],['storage','任务存储']] as const).map(([key,label])=><button key={key} type="button" aria-pressed={s.focus===key} className={`lora-chip ${s.focus===key?'selected':''}`} onClick={()=>change({focus:key})}>{label}</button>)}</div></>;
      feedback=s.focus==='train'?'比较谁在训练：LoRA 冻结 W₀，仅训练 A、B。':s.focus==='infer'?'比较推理路径：LoRA 的“无额外层”结论要求先将缩放后的增量合并进 W₀。':'比较任务文件：LoRA 可共享底座并为任务保存小型 A、B；底座仍需保留。';
    }
    if(n===3){control=<div className="ctrl"><label htmlFor="lora-layer">拖动增量层 <span className="val">{s.coverage}%</span></label><input id="lora-layer" aria-label="增量层覆盖百分比" type="range" min="0" max="100" value={s.coverage} onKeyDown={e=>e.stopPropagation()} onChange={e=>change({coverage:Number(e.target.value)})}/></div>;feedback=s.coverage===0?'起点：B=0，因此 BA=0，模型输出与冻结底座一致。':'透明层代表可训练的 BA；底层 W₀ 始终冻结。';}
    if(n===4&&moduleId==='4.1'){control=<><div className="ctrl"><label htmlFor="lora-rank-slider">拖动 rank <span className="val">r={s.rank}</span></label><input id="lora-rank-slider" aria-label="选择教学示例的 rank" type="range" min="0" max="4" value={ranks.indexOf(s.rank)} onKeyDown={e=>e.stopPropagation()} onChange={e=>change({rank:ranks[Number(e.target.value)]})}/></div>{rankControl()}</>;feedback=`单矩阵教学示例：r=${s.rank} 时 LoRA 为 ${(s.rank*8192).toLocaleString()} 个参数；完整更新为 16,777,216 个。`;}
    if(n===4&&moduleId==='4.2'){control=stepper(2);feedback=['先看 d×k 的完整更新矩阵。','B 是 d×r，A 是 r×k，两者相乘回到 d×k。','只训练 r(d+k) 个因子参数；W₀ 本身仍需保留。'][s.step];}
    if(n===5&&moduleId==='5.1'){control=choose([['q','Wq'],['k','Wk'],['v','Wv'],['o','Wo'],['qv','Wq + Wv']]);feedback=s.choice==='qv'?'论文主实验主要在 query 与 value 投影加入 LoRA。':`W${s.choice} 可以作为消融中的插入位置；并非主实验的唯一设置。`;}
    if(n===5&&moduleId==='5.2'){
      control=choose([['q','Wq'],['v','Wv'],['qv','Wq+Wv'],['all','四投影']]);
      const results:Record<string,string>={q:'Wq：WikiSQL 70.4%，MNLI 91.0%。',v:'Wv：WikiSQL 73.0%，MNLI 91.0%。',qv:'Wq+Wv：WikiSQL 73.7%，MNLI 91.3%。',all:'四投影：WikiSQL 73.7%，MNLI 91.7%。'};
      feedback=`${results[s.choice]||results.qv} 相近预算下，最佳位置依任务而变。`;
    }
    if(n===6){control=stepper(3);feedback=['训练前：保留冻结的 W₀。','训练时：A、B 形成任务增量 BA，分支按 α/r 缩放。','部署时：合并 W₀+(α/r)BA，才与相同稠密层比较推理延迟。','不同任务的已合并权重在同一批次动态混用并不直接。'][s.step];}
    if(n===8){control=choose([['roberta','RoBERTa'],['deberta','DeBERTa'],['gpt2','GPT-2'],['gpt3','GPT-3']]);feedback=s.choice==='gpt2'?'E2E 的 BLEU 与分类准确率不是同一个指标。':s.choice==='gpt3'?'GPT-3 的 WikiSQL、MNLI、SAMSum 各自有任务指标。':'GLUE 包含多个理解子任务，应逐项看指标。';}
    if(n===9&&moduleId==='9.1'){control=<>{choose([['mnli','MNLI'],['wikisql','WikiSQL'],['e2e','E2E']])}<div className="lora-controls lora-animate-trigger"><button className="lora-chip selected" type="button" onClick={()=>set(prev=>({...prev,started:true,round:prev.round+1}))}>{s.started?'重新比较':'开始比较'}</button></div></>;feedback=s.choice==='wikisql'?'WikiSQL：LoRA 73.4，略低于 FT 73.8；论文报告约 ±0.5% 波动。':s.choice==='e2e'?'E2E：LoRA 70.4±0.1 BLEU（±0.1 为表 3 的置信区间），FT 68.2；FT 值来自既有工作。':'MNLI-m：LoRA 91.7%，FT 89.5%；这是此任务的比较，不代表所有任务。';}
    if(n===9&&moduleId==='9.2'){control=rankControl();feedback=`表 6：r=${s.rank} 的 WikiSQL 验证准确率是 ${([73.4,73.3,73.7,73.8,73.5] as number[])[ranks.indexOf(s.rank)].toFixed(1)}%；结果未随 rank 单调提高，但点差与论文报告约 ±0.5% 波动同量级。`;}
    if(n===10){control=<>{stepper(4)}<div className="lora-route" role="group" aria-label="五篇论文研究问题路线">{routeNodes.map(([name],i)=><button key={name} type="button" className={s.route===i?'selected':''} aria-pressed={s.route===i} onClick={()=>change({step:4,route:i})}>{name}</button>)}</div><div className="lora-route-detail" aria-live="polite"><strong>{routeNodes[s.route][0]}</strong>：{routeNodes[s.route][1]}<br/>这条路线描述研究问题的扩展，不表示直接技术继承。</div></>;feedback=['rank 和插入位置依任务选择；小 rank 并非万能。','低秩只减少任务更新，基础模型仍需加载。','多个已合并任务权重不便在同一批次动态混用。','论文实验主要是语言任务，未证明视觉语言个性化或长期记忆。','LoRA 加上后续四篇，共五篇；点击节点查看各自的研究问题。'][s.step];}
  }
  const compared=comparisonDetails[s.choice]||comparisonDetails.ft;
  const mobileFacts: [string,string][] = (()=>{
    if(n===1) return s.synced?[['共享底座','一份冻结的 W₀'],['每个任务','只保存自己的 BA']]:[['全量微调','每个任务保存整套权重'],['任务增加','完整副本随之增加']];
    if(n===2) return [['当前方法',s.choice==='adapter'?'Adapter':s.choice==='prefix'?'Prefix / Prompt':'部分参数微调'],['观察重点',s.choice==='adapter'?'额外串行层':s.choice==='prefix'?'前缀占用序列':'只改部分原参数']];
    if(n===3) return [['冻结底座','W₀ 不更新'],['任务增量',`BA · 覆盖示意 ${s.coverage}%`]];
    if(n===4&&moduleId==='4.1') return [['完整更新','16,777,216 个参数'],[`LoRA · r=${s.rank}`,`${(s.rank*8192).toLocaleString()} 个参数`]];
    if(n===4) return [['原更新','d×k'],['低秩因子',s.step===0?'下一步查看 A、B':s.step===1?'B: d×r · A: r×k':'r(d+k) 个参数']];
    if(n===5&&moduleId==='5.1') return [['四类投影','Wq · Wk · Wv · Wo'],['论文主设置','Wq + Wv']];
    if(n===5) return [['位置比较','GPT-3 · 约 18M 参数'],['当前结果',feedback.split('。')[0]+'。']];
    if(n===6) return [['训练','W₀ 冻结，A/B 可训练'],['部署',s.step>=2?'缩放后的 BA 可合并':'逐步查看合并过程']];
    if(n===7) return [['当前对照',methodLabels[s.choice]||'Full FT'],['比较维度',s.focus==='train'?'训练对象':s.focus==='infer'?'推理结构':'任务存储']];
    if(n===8) return [['当前模型',({roberta:'RoBERTa',deberta:'DeBERTa',gpt2:'GPT-2',gpt3:'GPT-3'} as Record<string,string>)[s.choice]||'GPT-3'],['示例任务/指标',s.choice==='gpt2'?'E2E · BLEU':s.choice==='gpt3'?'MNLI/WikiSQL · 准确率':'GLUE · 按子任务评价']];
    if(n===9&&moduleId==='9.1'){
      const results:Record<string,[string,string]>={mnli:['89.5%','91.7%'],wikisql:['73.8%','73.4%'],e2e:['68.2 BLEU','70.4 BLEU']};
      const pair=results[s.choice]||results.mnli;
      return [['Full FT',pair[0]],['LoRA',pair[1]],['FT 可训练参数',s.choice==='e2e'?'354.92M':'175,255.8M'],['LoRA 可训练参数',s.choice==='e2e'?'0.35M':'4.7M']];
    }
    if(n===9) return [['当前 rank',`r=${s.rank}`],['WikiSQL 验证准确率',`${([73.4,73.3,73.7,73.8,73.5] as number[])[ranks.indexOf(s.rank)].toFixed(1)}%`]];
    if(n===10) return [['当前边界',['rank 与位置','底座仍在','任务切换','文本范围','后续四篇'][s.step]],['下一问题',routeNodes[s.route][1]]];
    return [];
  })();
  return <div className={`lora-widget ${isSmall?'lora-small':''}`}>
    {!isSmall&&<div className="lora-figure-label">自制教学示意 · 非论文原图</div>}
    {!isSmall&&<div className="lora-mobile-summary" aria-label="手机端图示要点">{mobileFacts.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
    {!isSmall&&n===9&&moduleId==='9.2'&&<div className="lora-mobile-rank-values" aria-label="五个 rank 的 WikiSQL 验证准确率">{ranks.map((rank,i)=><div key={rank} className={s.rank===rank?'selected':''}><span>r={rank}</span><strong>{[73.4,73.3,73.7,73.8,73.5][i]}%</strong></div>)}</div>}
    <canvas ref={canvas} width={w} height={h} role="img" aria-label={isSmall?'修图类比教学示意图':'LoRA 交互教学示意图'} onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={endCanvasDrag} onPointerCancel={endCanvasDrag} style={{touchAction:n===3&&!isSmall?'none':undefined,cursor:!isSmall&&(n===3||n===5||n===9&&moduleId==='9.2')?'pointer':undefined}} />
    {!isSmall&&<>{control}{n===7&&<table className="lora-comparison"><thead><tr><th scope="col">比较维度</th><th scope="col">{methodLabels[s.choice]||'Full FT'}</th><th scope="col">LoRA</th></tr></thead><tbody>{([['train','训练对象'],['infer','推理结构'],['storage','任务存储']] as const).map(([key,label])=><tr key={key} className={s.focus===key?'active-row':''}><td>{label}</td><td>{compared[key]}</td><td>{comparisonDetails.lora[key]}</td></tr>)}</tbody></table>}<div className="feedback good" aria-live="polite">{feedback}</div></>}
  </div>;
};
