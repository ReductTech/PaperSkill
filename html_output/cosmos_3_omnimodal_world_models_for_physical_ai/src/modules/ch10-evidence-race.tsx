import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token } from './studio-kit';

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

type ActionMode='fd'|'id'|'policy';
const actionLabels:Array<[ActionMode,string]>=[['fd','前向动力学 FD'],['id','逆动力学 ID'],['policy','策略 Policy']];
const actionSpec:Record<ActionMode,{inputs:string[];target:string;metric:string;copy:string;change:string}> = {
  fd:{inputs:['状态','动作'],target:'未来视觉',metric:'PSNR ↑',copy:'给状态与动作，预测未来视觉。',change:'27.13 → 26.22（联合训练有代价）'},
  id:{inputs:['起始视觉','目标视觉'],target:'动作',metric:'MSE ↓',copy:'给起点与目标画面，反推中间动作。',change:'1.11e−3 → 3.09e−4（约降 72%）'},
  policy:{inputs:['观察','语言'],target:'动作',metric:'Coverage ↑',copy:'根据观察与语言直接生成动作。',change:'74.1 → 77.3'},
};

export const Ch9ActionInterface: React.FC<WidgetProps> = () => {
  const [mode,setMode]=useState<ActionMode>('fd');
  const s=actionSpec[mode];
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,320);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,320);
    label(ctx,'干净条件',116,34,C.blue,14);label(ctx,'统一序列任务',355,34,C.ink,14);label(ctx,'加噪目标',604,34,C.red,14);
    s.inputs.forEach((n,i)=>token(ctx,42,72+i*62,150,n,n==='动作'?'action':'clean'));
    rounded(ctx,264,77,180,109,12,mode==='fd'?'#eef4fb':mode==='id'?'#f5f0ff':'#fff7e8',mode==='fd'?C.blue:mode==='id'?C.purple:C.orange);
    label(ctx,mode.toUpperCase(),354,110,mode==='fd'?C.blue:mode==='id'?C.purple:C.orange,24);
    label(ctx,mode==='fd'?'模拟下一状态':mode==='id'?'由结果反推动作':'从观察直接行动',354,151,C.ink,12);
    s.inputs.forEach((_,i)=>arrow(ctx,194,93+i*62,264,118+i*8,C.blue,3));
    arrow(ctx,444,132,523,132,C.blue,4);token(ctx,525,111,150,s.target,s.target==='动作'?'action':'noisy');
    rounded(ctx,43,225,632,61,10,C.white,C.line);
    label(ctx,'基础  →  动作 mid-training 初始化  →  任务 post-training',360,244,C.muted,12);
    label(ctx,s.metric+'   '+s.change,360,269,mode==='fd'?C.orange:C.green,12);
  },720,320,[mode,s]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={320} aria-label="FD ID Policy 的条件与目标切换" />
    <div className="paper-control-row">{actionLabels.map(([id,n])=><Chip key={id} active={mode===id} onClick={()=>setMode(id)}>{n}</Chip>)}</div>
    <div className={'feedback '+(mode==='fd'?'':'good')}>{s.copy} {s.metric}：{s.change}</div>
  </div>;
};

type Dataset='reasoner'|'t2i'|'pai'|'physics'|'audio'|'action'|'ablation';
type Bar={label:string;value:number;max:number;display:string;color:string};
type Evidence={title:string;direction:string;bars:Bar[];verdict:string;caveat:string};
const datasets:Array<[Dataset,string]>=[['reasoner','推理能力'],['t2i','文生图'],['pai','物理智能生成'],['physics','物理一致性'],['audio','音频'],['action','动作'],['ablation','机制消融']];
const E:Record<Dataset,Evidence>={
  reasoner:{title:'Table 10 · Super 分组平均',direction:'各组内指标：↑ 越高越好',bars:[
    {label:'通用',value:73.7,max:100,display:'73.7',color:C.blue},{label:'机器人',value:57.8,max:100,display:'57.8',color:C.green},
    {label:'智能空间',value:62.6,max:100,display:'62.6',color:C.purple},{label:'驾驶',value:79.3,max:100,display:'79.3',color:C.orange}],
    verdict:'覆盖面广，但不是统一准确率。',caveat:'四个分组汇集异质 benchmark，只能逐组解读。'},
  t2i:{title:'Table 11 · UniGenBench All',direction:'↑ 越高越好',bars:[
    {label:'Cosmos Super-T2I',value:91.36,max:100,display:'91.36',color:C.green},{label:'Gemini',value:90.69,max:100,display:'90.69',color:C.blue}],
    verdict:'该协议下 Cosmos 略高。',caveat:'1170 条结构化改写 prompt，1024×1024；其他指标未必同一赢家。'},
  pai:{title:'Table 12 · 论文内部评测',direction:'↑ 越高越好',bars:[
    {label:'Super T2V',value:80,max:100,display:'80.0',color:C.green},{label:'Super I2V',value:82.8,max:100,display:'82.8',color:C.green},{label:'Nano RBench',value:58.4,max:100,display:'58.4%',color:C.blue}],
    verdict:'支持生成覆盖，但需保留口径。',caveat:'内部 Qwen2.5-VL-72B 裁判；5 seeds、720p、16:9、189 帧。'},
  physics:{title:'Table 13 · Physics-IQ',direction:'↑ 越高越好',bars:[
    {label:'图生视频·直接',value:43.8,max:70,display:'43.8',color:C.blue},{label:'图生视频·择优',value:48.9,max:70,display:'48.9',color:C.green},{label:'视频迁移·直接',value:59.7,max:70,display:'59.7',color:C.blue},{label:'视频迁移·择优',value:63.4,max:70,display:'63.4',color:C.green}],
    verdict:'视频迁移与候选筛选均提高物理一致性得分。',caveat:'BoN（从 N 个候选中择优）使用 WMReward 选择结果，需与直接生成区分。'},
  audio:{title:'Table 15 · 音频两面性',direction:'下列同为 0–10 量表，但指标含义不同',bars:[
    {label:'SA 语义对齐',value:8.33,max:10,display:'8.33',color:C.green},{label:'AVAlign',value:8.16,max:10,display:'8.16',color:C.green},{label:'Cosmos AVQ',value:7.34,max:10,display:'7.34',color:C.orange},{label:'Seedance AVQ',value:7.64,max:10,display:'7.64',color:C.blue}],
    verdict:'语义对齐突出，音质并非全面领先。',caveat:'SA、AVAlign 与 AVQ 是不同量尺；这里并列展示，不合成总分。'},
  action:{title:'Table 31 · 联合动作模式',direction:'每一行使用自己的尺度与方向',bars:[
    {label:'ID MSE 前',value:1.11,max:1.2,display:'1.11e−3 ↓',color:C.blue},{label:'ID MSE 后',value:.309,max:1.2,display:'3.09e−4 ↓',color:C.green},{label:'Policy 前',value:74.1,max:100,display:'74.1 ↑',color:C.blue},{label:'Policy 后',value:77.3,max:100,display:'77.3 ↑',color:C.green},{label:'FD PSNR 前',value:27.13,max:30,display:'27.13 ↑',color:C.blue},{label:'FD PSNR 后',value:26.22,max:30,display:'26.22 ↑',color:C.orange}],
    verdict:'ID 与 Policy 获益，FD 画质有代价。',caveat:'MSE 越低越好；Coverage 与 PSNR 越高越好，不能按柱长跨行比较。'},
  ablation:{title:'Tables 28–29 · 机制消融',direction:'MRoPE composite：↑ 越高越好',bars:[
    {label:'无控制',value:8.51,max:11,display:'8.51',color:C.blue},{label:'文本 + MRoPE',value:9.81,max:11,display:'9.81',color:C.green}],
    verdict:'初始化与时间控制都有正向证据。',caveat:'Reasoner 初始化改善 Physical AI 域分数；不等于所有生成指标同时大涨。'},
};

export const Ch10EvidenceRace: React.FC<WidgetProps> = () => {
  const [dataset,setDataset]=useState<Dataset>('reasoner');
  const ev=E[dataset];
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,360);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,360);
    label(ctx,ev.title,28,27,C.ink,15,'left');label(ctx,ev.direction,28,52,C.muted,11,'left');
    const plotX=168,plotW=310;const rowH=Math.min(45,210/ev.bars.length);
    ev.bars.forEach((b,i)=>{
      const y=77+i*rowH;label(ctx,b.label,151,y+10,C.ink,10,'right');
      rounded(ctx,plotX,y,plotW,20,5,'#edf1f6',C.line);
      const w=Math.max(2,plotW*(b.value/b.max));
      ctx.fillStyle=b.color;ctx.beginPath();ctx.roundRect(plotX,y,w,20,5);ctx.fill();
      label(ctx,b.display,plotX+Math.min(w+8,plotW-3),y+10,b.color,10,'left');
    });
    rounded(ctx,504,72,190,196,12,C.white,C.orange);
    label(ctx,'协议与边界',599,96,C.orange,13);
    const wrap=(text:string,max=14)=>{const out:string[]=[];for(let i=0;i<text.length;i+=max)out.push(text.slice(i,i+max));return out;};
    wrap(ev.caveat,14).forEach((line,i)=>label(ctx,line,599,126+i*22,C.muted,10));
    rounded(ctx,40,304,640,34,7,'#eaf7ef',C.green);
    label(ctx,ev.verdict,360,321,C.green,12);
  },720,360,[dataset,ev]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={360} aria-label="论文结果与协议边界比较" />
    <div className="paper-control-row">{datasets.map(([id,n])=><Chip key={id} active={dataset===id} onClick={()=>setDataset(id)}>{n}</Chip>)}</div>
    <div className="feedback good">{ev.verdict} {ev.caveat}</div>
    <div className="paper-boundary-note"><b>适用边界：</b>在论文的合成数据实验中，所列 SDG（合成数据生成）变体均降低了人工评分；作者同时指出合成域到真实域的差距。统一能力不表示所有任务均领先。</div>
  </div>;
};
