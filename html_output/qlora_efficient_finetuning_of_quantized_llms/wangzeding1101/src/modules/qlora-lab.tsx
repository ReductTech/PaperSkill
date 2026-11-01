import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea', pale: '#edf3ec' };

type State = { choice: number; sub: number; value: number; running: boolean };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 18, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, color: string) {
  roundRect(ctx, x, y, w, h, 9); ctx.fillStyle = '#e8edf2'; ctx.fill();
  const fw = clamp(p, 0, 1) * w; if (fw > 1) { roundRect(ctx, x, y, fw, h, 9); ctx.fillStyle = color; ctx.fill(); }
}
function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, title: string, active: boolean, color = C.blue) {
  roundRect(ctx, x, y, w, 64, 10); ctx.fillStyle = active ? color : '#f8fafb'; ctx.fill(); ctx.strokeStyle = active ? color : C.border; ctx.lineWidth = 2; ctx.stroke();
  label(ctx, title, x + w / 2, y + 32, active ? '#fff' : C.text, 17, 'center');
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.muted) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10 * Math.cos(a - .45), y2 - 10 * Math.sin(a - .45)); ctx.lineTo(x2 - 10 * Math.cos(a + .45), y2 - 10 * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
}
function backpack(ctx: CanvasRenderingContext2D, cx: number, base: number, scale: number, fill: number, color: string, pulse = 0) {
  const w = 120 * scale, h = 125 * scale;
  const pocketY = h * .55, pocketH = h * .28, pocketGap = 10 * scale;
  const rawFillStart = h * (1 - clamp(fill, 0, 1));
  const pocketFilled = rawFillStart <= pocketY + pocketH / 2;
  const fillStart = pocketFilled
    ? Math.min(rawFillStart, pocketY - pocketGap)
    : Math.max(rawFillStart, pocketY + pocketH + pocketGap);
  ctx.save(); ctx.translate(cx, base - h + pulse);
  ctx.strokeStyle = C.text; ctx.lineWidth = 7 * scale; ctx.beginPath(); ctx.arc(0, 12 * scale, 36 * scale, Math.PI, 0); ctx.stroke();
  roundRect(ctx, -w / 2, 10 * scale, w, h, 22 * scale); ctx.fillStyle = '#e9eef1'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 5 * scale; ctx.stroke();
  ctx.save(); roundRect(ctx, -w / 2 + 5, 15 * scale, w - 10, h - 10, 17 * scale); ctx.clip(); ctx.fillStyle = color; ctx.globalAlpha = .82; ctx.fillRect(-w / 2, fillStart, w, h - fillStart + 20); ctx.restore();
  roundRect(ctx, -w * .28, pocketY, w * .56, pocketH, 9);
  ctx.fillStyle = pocketFilled ? color : '#d9e0e6'; ctx.globalAlpha = pocketFilled ? .82 : 1; ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = C.text; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
function sceneTitle(ctx: CanvasRenderingContext2D, left: string, right: string, w: number) { label(ctx, left, 28, 28, C.muted, 16); label(ctx, right, w - 28, 28, C.blue, 18, 'right'); }

function drawAnalogy(ctx: CanvasRenderingContext2D, chapter: string, w: number, h: number) {
  const n = Number(chapter.replace('chap-', '')) || 1;
  ctx.fillStyle = C.pale; ctx.fillRect(0, 0, w, h); if(n !== 10)backpack(ctx, 118, 126, .66, n === 1 ? 1 : .68, n === 1 ? C.red : C.green);
  if (n === 2 || n === 3) { ctx.fillStyle = C.orange; roundRect(ctx, 245, 46, 88 - n * 5, 54, 12); ctx.fill(); arrow(ctx, 340, 74, 430, 74, C.green); }
  else if (n === 4) { for (let i = 0; i < 5; i++) { ctx.fillStyle = C.orange; roundRect(ctx, 238 + i * 27, 55, 20, 35, 4); ctx.fill(); } arrow(ctx, 380, 73, 450, 73, C.purple); }
  else if (n === 5) { ctx.fillStyle = C.purple; roundRect(ctx, 282, 42, 100, 72, 12); ctx.fill(); arrow(ctx, 178, 78, 262, 78, C.purple); }
  else if (n === 6) { ctx.fillStyle = C.blue; roundRect(ctx, 315, 42, 78, 75, 8); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (let y=60;y<102;y+=14){ctx.beginPath();ctx.moveTo(330,y);ctx.lineTo(380,y);ctx.stroke();} }
  else if (n === 7) { for (let i=0;i<4;i++){ctx.fillStyle=C.green;roundRect(ctx,245+i*62,48,46,54,9);ctx.fill();} }
  else if (n === 8) { backpack(ctx, 375, 127, .67, .64, C.green); ctx.fillStyle=C.blue;roundRect(ctx,357,93,36,16,5);ctx.fill(); }
  else if (n === 9) { const xs=[260,340,420]; xs.forEach((x,i)=>{ctx.fillStyle=i===1?C.green:'#bcc6d2';roundRect(ctx,x,45,54,66,9);ctx.fill();}); }
  else if (n === 10) { [C.red,C.blue,C.green].forEach((c,i)=>backpack(ctx,140+i*140,126,.55,.45+i*.2,c)); }
  label(ctx, `第 ${n} 章`, w - 22, n === 10 ? 20 : h - 21, C.muted, 16, 'right');
}

function drawModule(ctx: CanvasRenderingContext2D, id: string, s: State, w: number, h: number) {
  ctx.fillStyle = '#fbfcfa'; ctx.fillRect(0, 0, w, h);
  if (id === '1.1') {
    const sizes=[7,13,33,65], q=[5,10,21,41], mode=['全量','LoRA','QLoRA'][s.choice]; const size=sizes[s.sub]; const exact=s.choice===2?q[s.sub]:(size===65&&s.choice===0?780:Math.min(160, size*6));
    sceneTitle(ctx,'48 GB 单卡预算',`${size}B · ${mode}`,w); backpack(ctx,170,245,.82,exact/48,exact>48?C.red:C.green); bar(ctx,350,95,650,44,exact/800,exact>48?C.red:C.green); label(ctx,exact>=780?'>780 GB':`${exact} GB`,350, seventy(0),C.text,22);
    ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(350+650*48/800,78);ctx.lineTo(350+650*48/800,158);ctx.stroke(); label(ctx,'48 GB',350+650*48/800,175,C.orange,16,'center');
  } else if (id === '1.2') {
    label(ctx,'16 位全量微调',280,32,C.red,20,'center'); label(ctx,'QLoRA',800,32,C.green,20,'center');
    ctx.strokeStyle=C.orange;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(90,82);ctx.lineTo(990,82);ctx.stroke();ctx.setLineDash([]); label(ctx,'48 GB 参考线',540,62,C.orange,17,'center');
    backpack(ctx,280,258,.82,s.running?1:.32,s.running?C.red:'#9ba8b6'); backpack(ctx,800,258,.82,s.running?.72:.32,s.running?C.green:'#9ba8b6');
    if(s.running){label(ctx,'超出预算',280,110,C.red,18,'center');label(ctx,'单卡可容纳',800,110,C.green,18,'center');}
  } else if (id === '2.1' || id === '6.1') {
    const names=id==='2.1'?['NF4 存储','BF16 反量化','矩阵乘法','LoRA 梯度']:['输入','冻结基础分支','输出与损失','更新 LoRA'];
    names.forEach((n,i)=>{node(ctx,20+i*260,100,220,n,i===s.choice,i===names.length-1?C.green:C.blue);if(i<3)arrow(ctx,240+i*260,132,280+i*260,132,i<s.choice?C.green:C.muted);});
    if(id==='6.1'){label(ctx,'冻结',390,205,C.muted,16,'center');label(ctx,'可训练',910,205,C.green,16,'center');}
  } else if (id === '3.1') {
    sceneTitle(ctx,s.choice===0?'均匀 FP4':'等概率 NF4',`探针 ${s.value.toFixed(2)}`,w); const ox=70,oy=225,ww=940,hh=170; ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+ww,oy);ctx.stroke();
    ctx.strokeStyle=s.choice===0?C.red:C.green;ctx.lineWidth=5;ctx.beginPath();for(let i=0;i<=200;i++){const x=-3+6*i/200,y=Math.exp(-x*x/2);const px=ox+ww*i/200,py=oy-y*hh;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
    for(let i=1;i<8;i++){const frac=s.choice===0?i/8:(.5+.5*Math.sin((i/8-.5)*Math.PI));const x=ox+ww*frac;ctx.strokeStyle='#9ba8b6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,oy);ctx.lineTo(x,oy-120);ctx.stroke();}
    const px=ox+ww*s.value; const xx=-3+6*s.value; const py=oy-Math.exp(-xx*xx/2)*hh; ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fill();
  } else if (id === '4.1') {
    const blocks=[32,64,128],b=blocks[s.sub], dq=s.choice===1, overhead=dq?(b===64?.127:.127*64/b):32/b; sceneTitle(ctx,'量化常数开销',`块大小 ${b}`,w); bar(ctx,110,95,800,48,Math.min(overhead/.7,1),dq?C.green:C.orange); label(ctx,`${overhead.toFixed(3)} bit/参数`,510,170,dq?C.green:C.orange,24,'center');
    for(let i=0;i<Math.max(4,128/b*5);i++){ctx.fillStyle=dq?C.purple:C.orange;roundRect(ctx,120+i*38,215,25,28,4);ctx.fill();}
  } else if (id === '5.1') {
    const use=[.54,.78,1.08][s.sub],paged=s.choice===1; sceneTitle(ctx,'GPU 显存',paged?'分页已开启':'未分页',w); bar(ctx,80,95,690,55,paged&&use>1?.88:use,use>1&&!paged?C.red:C.green); ctx.fillStyle=C.purple;roundRect(ctx,850,80,145,90,12);ctx.fill();label(ctx,'CPU',922,125,'#fff',22,'center'); if(paged&&use>1)arrow(ctx,780,122,850,122,C.purple);
  } else if (id === '7.1') {
    sceneTitle(ctx,s.choice===0?'仅 Q/V 投影':'全部线性层',`rank ${[8,16,64][s.sub]}`,w); const names=['Q','K','V','O','Up','Down']; names.forEach((n,i)=>node(ctx,55+i*168,102,122,n,s.choice===1||n==='Q'||n==='V',s.choice===1?C.green:C.blue));
  } else if (id === '8.1') {
    const names=['NF4 基础','双反量化','BF16 计算','LoRA','分页']; names.forEach((n,i)=>{node(ctx,24+i*210,98,166,n,i===s.choice,[C.blue,C.purple,C.blue,C.green,C.purple][i]);if(i<4)arrow(ctx,190+i*210,130,234+i*210,130,i<s.choice?C.green:C.muted);});
  } else if (id === '8.2') {
    const modes=['全量微调','LoRA','QLoRA'], parts=[[.72,.20,.08],[.67,.08,.05],[.33,.08,.04]][s.choice]; sceneTitle(ctx,'内存组成示意',modes[s.choice],w); let x=100; [C.blue,C.orange,C.green].forEach((c,i)=>{ctx.fillStyle=c;roundRect(ctx,x,105,parts[i]*850,68,6);ctx.fill();x+=parts[i]*850;}); label(ctx,s.choice===0?'全量权重可训练':'基础冻结 · 仅适配器可训练',540,220,s.choice===0?C.red:C.green,20,'center');
  } else if (id === '9.1') {
    const names=['OASST1','FLAN v2','Alpaca']; sceneTitle(ctx,'规模与任务匹配',names[s.choice],w); const size=[.18,1,.52][s.choice],chat=[.86,.62,.56][s.choice],mmlu=[.54,.9,.48][s.choice]; [['样本规模',size,C.blue],['聊天匹配',chat,C.green],['知识任务',mmlu,C.orange]].forEach((a,i)=>{label(ctx,a[0] as string,90,95+i*60,C.text,17);bar(ctx,230,75+i*60,710,34,a[1] as number,a[2] as string);});
  } else if (id === '9.2') {
    const active=s.running; roundRect(ctx,55,48,430,172,14);ctx.fillStyle=active?'#fff7ed':'#f4f6f8';ctx.fill();ctx.strokeStyle=active?C.orange:C.border;ctx.lineWidth=2;ctx.stroke();
    roundRect(ctx,595,48,430,172,14);ctx.fillStyle=active?'#edf8f2':'#f4f6f8';ctx.fill();ctx.strokeStyle=active?C.green:C.border;ctx.lineWidth=2;ctx.stroke();
    label(ctx,'MMLU 知识测验',270,78,active?C.orange:C.muted,21,'center');label(ctx,'聊天偏好评测',810,78,active?C.green:C.muted,21,'center');
    label(ctx,'选择题 → 正确率',270,122,C.text,19,'center');label(ctx,'多轮回答 → 相对偏好',810,122,C.text,19,'center');
    label(ctx,'知识与推理',270,165,C.muted,17,'center');label(ctx,'帮助性、风格与指令遵循',810,165,C.muted,17,'center');
    if(active)label(ctx,'高 MMLU  ≠  高聊天偏好',540,250,C.red,21,'center');else label(ctx,'点击“开始比较”查看两把尺子的差异',540,250,C.muted,18,'center');
  } else if (id === '10.1') {
    const mem=[5,10,21,41],vic=[87,90.4,97.8,99.3],vals=s.choice===0?mem:vic,max=s.choice===0?48:100; sceneTitle(ctx,s.choice===0?'Guanaco 显存':'Vicuna 相对 ChatGPT',s.choice===0?'GB':'%',w); vals.forEach((v,i)=>{const x=95+i*245,hv=s.running?150*v/max:12;ctx.fillStyle=s.running?(i===3?C.green:C.blue):'#cbd3dd';roundRect(ctx,x,225-hv,130,hv,8);ctx.fill();label(ctx,`${[7,13,33,65][i]}B`,x+65,248,C.text,17,'center');if(s.running)label(ctx,`${v}${s.choice===0?' GB':'%'}`,x+65,205-hv,C.text,16,'center');});
  } else if (id === '10.2') {
    const names=['事实错误','数学推理','拒答一致性','评测偏差']; names.forEach((n,i)=>node(ctx,55+i*255,105,210,n,i===s.choice,i===s.choice?C.red:C.blue)); label(ctx,'定性案例 ≠ 总体错误率',540,220,C.orange,20,'center');
  }
}

function seventy(_: number) { return 60; }

const choices: Record<string,string[]> = {
  '1.1':['全量','LoRA','QLoRA'],'2.1':['NF4 存储','BF16 反量化','矩阵乘法','LoRA 梯度'],'3.1':['均匀 FP4','NF4'],'4.1':['不使用 DQ','使用 DQ'],'5.1':['未分页','分页优化器'],'6.1':['输入','基础分支','输出/损失','LoRA 更新'],'7.1':['仅 Q/V','全部线性层'],'8.1':['NF4','双反量化','BF16','LoRA','分页'],'8.2':['全量微调','LoRA','QLoRA'],'9.1':['OASST1','FLAN v2','Alpaca'],'10.1':['显存','Vicuna'],'10.2':['事实错误','数学推理','拒答一致性','评测偏差']
};
const subs: Record<string,string[]> = {'1.1':['7B','13B','33B','65B'],'4.1':['32','64','128'],'5.1':['稳定','长序列','尖峰'],'7.1':['rank 8','rank 16','rank 64']};

function feedback(id: string, s: State) {
  if(id==='1.1'){const size=[7,13,33,65][s.sub];if(s.choice===2)return `论文报告的 Guanaco ${size}B 占用为 ${[5,10,21,41][s.sub]} GB。`;if(size===65&&s.choice===0)return '论文指出 65B 的 16 位全量微调需要超过 780 GB。';return '此组合用于结构比较；论文未给出这里的精确显存总量。';}
  if(id==='1.2')return s.running?'比较完成：全量微调超出 48 GB 预算，QLoRA 在论文设置下可装入单卡。':'点击开始，比较全量微调与 QLoRA 的装载结果。';
  if(id==='2.1')return ['NF4 降低基础权重的常驻存储。','使用权重时反量化为 BF16。','矩阵乘法在 BF16 中进行。','反向传播只更新 BF16 LoRA 参数。'][s.choice];
  if(id==='3.1')return s.choice===1?'NF4 在高概率区域放置更密的表示点，前提是权重近似正态分布。':'FP4 等宽区间没有主动匹配权重的正态分布。';
  if(id==='4.1')return s.sub===1?(s.choice===1?'论文设置：约 0.127 bit/参数，较 0.5 节省约 0.373。':'块大小 64 时，第一层常数约需 0.5 bit/参数。'):'非 64 的显示值只说明块大小与常数数量的结构关系。';
  if(id==='5.1')return s.choice===1&&s.sub===2?'峰值时把优化器状态分页到 CPU；它不减少稳定计算量。':'分页只在内存峰值出现时发挥作用，不直接改善准确率。';
  if(id==='6.1')return s.choice===3?'基础权重仍被冻结，只有 L₁、L₂ 接收更新。':'梯度穿过计算图，但不会写回 NF4 基础权重。';
  if(id==='7.1')return s.choice===1?'论文测试中，覆盖全部线性层比单纯提高 rank 更重要。':'只覆盖 Q/V 会限制适配路径；该结论来自 LLaMA 7B 的特定实验。';
  if(id==='8.1')return ['4 位、冻结、常驻存储。','先恢复两级常数，再恢复计算权重。','BF16 执行矩阵运算。','唯一持续学习的低秩分支。','只在瞬时峰值时辅助迁移。'][s.choice];
  if(id==='8.2')return ['全部基础权重可训练，优化器状态庞大。','冻结高精度基础权重，只训练低秩分支。','进一步把基础权重以 NF4 存储，并处理峰值。'][s.choice];
  if(id==='9.1')return ['OASST1 规模较小但更贴近开放式聊天。','FLAN v2 规模大且更贴近多任务知识评测。','Alpaca 是常用指令数据，但规模本身不能解释质量。'][s.choice]+' 这些比较不是严格控制变量实验。';
  if(id==='9.2')return s.running?'MMLU 看选择题正确率；聊天评测比较多轮回答偏好。两者不能相互替代。':'点击开始，查看两种评测分别在衡量什么。';
  if(id==='10.1')return s.choice===0?'5/10/21/41 GB 是论文报告的 Guanaco 7B/13B/33B/65B 占用。':'87.0/90.4/97.8/99.3% 仅对应 GPT-4 评审的 Vicuna aggregate 协议。';
  if(id==='10.2')return ['论文展示了自信但错误的事实回答，未报告总体发生率。','算术与多步推理仍可能失败，参数高效不等于推理增强。','相似问题可能得到不一致的拒答，安全评估覆盖有限。','排名会随题集、提示与裁判变化，模型裁判并非无偏。'][s.choice];
  return '拖动或点击控件，观察机制如何变化。';
}

export const QLoRALab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef=useRef<HTMLCanvasElement>(null); const stateRef=useRef<State>({choice:0,sub:moduleId==='1.1'?3:moduleId==='4.1'?1:0,value:.5,running:false});
  const [state,setState]=useState(stateRef.current); const isHero=chapterId==='hero', isAna=moduleId==='ana'; const W=isHero?520:isAna?560:1080,H=isHero?170:isAna?140:280;
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);}catch{return;}let raf:number|null=null;
    const render=()=>{ctx.clearRect(0,0,W,H);if(isHero){ctx.fillStyle=C.pale;ctx.fillRect(0,0,W,H);const old=moduleId==='old';label(ctx,old?'>780 GB':'<48 GB',24,25,old?C.red:C.green,20);backpack(ctx,W/2,151,.7,old?1:.67,old?C.red:C.green);}else if(isAna)drawAnalogy(ctx,chapterId,W,H);else drawModule(ctx,moduleId,stateRef.current,W,H);if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready');raf=requestAnimationFrame(render);};
    const start=()=>{if(raf===null)raf=requestAnimationFrame(render);};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null;};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};
  },[W,H,isHero,isAna,chapterId,moduleId]);
  const update=(p:Partial<State>)=>{const next={...stateRef.current,...p};stateRef.current=next;setState(next);};
  const main=choices[moduleId]||[]; const secondary=subs[moduleId]||[]; const hasRun=['1.2','9.2','10.1'].includes(moduleId);
  const status=useMemo(()=>feedback(moduleId,state),[moduleId,state]);
  return <div className="qlora-widget"><canvas ref={canvasRef} width={W} height={H} aria-label={`${moduleId} 交互图`}/>{!isHero&&!isAna&&<>
    {main.length>0&&<div className="ctrl qlora-chips" role="group" aria-label="主要选项">{main.map((x,i)=><button key={x} className={state.choice===i?'active':''} onClick={()=>update({choice:i})}>{x}</button>)}</div>}
    {secondary.length>0&&<div className="ctrl qlora-chips secondary" role="group" aria-label="辅助选项">{secondary.map((x,i)=><button key={x} className={state.sub===i?'active':''} onClick={()=>update({sub:i})}>{x}</button>)}</div>}
    {moduleId==='3.1'&&<div className="ctrl"><label>分布位置 <span className="val">{state.value.toFixed(2)}</span></label><input type="range" min="0" max="100" value={Math.round(state.value*100)} onChange={e=>update({value:Number(e.target.value)/100})}/></div>}
    {hasRun&&<div className="ctrl"><button className="qlora-run" onClick={()=>update({running:!state.running})}>{state.running?'重置比较':'开始比较'}</button></div>}
    <div className={`feedback ${status.includes('超过')||status.includes('失败')?'bad':state.choice>0?'good':''}`}>{status}</div>
  </>}</div>;
};

export default QLoRALab;
