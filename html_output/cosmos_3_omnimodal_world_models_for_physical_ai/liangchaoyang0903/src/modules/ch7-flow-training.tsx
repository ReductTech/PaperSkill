import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token } from './studio-kit';

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

export const Ch7FlowTraining: React.FC<WidgetProps> = () => {
  const [sigma,setSigma]=useState(.35);
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,300);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,300);
    rounded(ctx,35,45,132,88,10,'#eaf7ef',C.green);label(ctx,'x₀',101,72,C.green,20);label(ctx,'干净数据',101,106,C.ink,12);
    rounded(ctx,553,45,132,88,10,'#fff1f2',C.red);label(ctx,'ε',619,72,C.red,20);label(ctx,'纯噪声',619,106,C.ink,12);
    ctx.strokeStyle=C.route;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(174,89);ctx.lineTo(546,89);ctx.stroke();
    arrow(ctx,178,156,542,156,C.purple,5);label(ctx,'v* = ε − x₀（方向固定）',360,181,C.purple,13);
    const x=174+(546-174)*sigma;
    ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(x,89,13,0,Math.PI*2);ctx.fill();label(ctx,'xσ',x,61,C.orange,14);
    rounded(ctx,218,210,284,57,9,C.white,C.line);
    label(ctx,'数据系数 '+(1-sigma).toFixed(2)+'  +  噪声系数 '+sigma.toFixed(2),360,229,C.ink,12);
    label(ctx,'干净条件：不计损失    加噪目标：计算均方误差',360,251,C.muted,11);
    ctx.save();ctx.globalAlpha=sigma;ctx.strokeStyle=C.red;for(let i=0;i<118;i+=11){ctx.beginPath();ctx.moveTo(41+i,128);ctx.lineTo(41+i+36,49);ctx.stroke();}ctx.restore();
  },720,300,[sigma]);
  const txt=sigma===0?'xσ=x₀：这是干净数据端。':sigma===1?'xσ=ε：这是纯噪声端，仍要沿速度场返回数据。':'xσ 同时含数据与噪声，模型学习同一方向 v*=ε−x₀。';
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="rectified flow 的数据噪声插值" />
    <div className="ctrl paper-range"><label>噪声水平 σ <span className="val">{sigma.toFixed(2)}</span></label><input aria-label="噪声水平 sigma" type="range" min="0" max="100" value={Math.round(sigma*100)} onInput={e=>setSigma(Number(e.currentTarget.value)/100)} onChange={e=>setSigma(Number(e.currentTarget.value)/100)}/></div>
    <div className="feedback">{txt} 当前 xσ = {sigma.toFixed(2)}·ε + {(1-sigma).toFixed(2)}·x₀。</div>
  </div>;
};

type Part='ar'|'dm'|'attention'|'private'|'init';
const partLabels:Array<[Part,string]>=[['ar','AR 塔'],['dm','DM 塔'],['attention','共享注意力'],['private','独立 LN·MLP'],['init','共初始化']];
const partCopy:Record<Part,string>={
  ar:'AR 塔处理因果推理，不能读取 DM 目标。',
  dm:'DM 塔专门处理生成 token，可读取 AR 与 DM 条件。',
  attention:'两塔只在共享多模态注意力处交换上下文。',
  private:'每层 LN、注意力投影与 MLP 均保持专门化。',
  init:'两塔从预训练 VLM 共初始化，不等于训练后共用全部权重。',
};

export const Ch8MotArchitecture: React.FC<WidgetProps> = () => {
  const [selected,setSelected]=useState<Part>('attention');
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,340);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,340);
    label(ctx,'Mixture-of-Transformers',360,27,C.ink,16);
    rounded(ctx,55,54,242,214,14,'#f4f8fd',selected==='ar'?C.blue:C.line);
    rounded(ctx,423,54,242,214,14,'#f8f4ff',selected==='dm'?C.purple:C.line);
    label(ctx,'AR Tower',176,79,C.blue,15);label(ctx,'DM Tower',544,79,C.purple,15);
    for(let i=0;i<3;i++){
      const y=99+i*52;
      rounded(ctx,78,y,196,38,7,C.white,selected==='private'?(i%2?C.orange:C.blue):C.line);
      rounded(ctx,446,y,196,38,7,C.white,selected==='private'?(i%2?C.purple:C.orange):C.line);
      label(ctx,i===1?'Attention':'LN + MLP',176,y+19,i===1&&selected==='attention'?C.blue:C.ink,11);
      label(ctx,i===1?'Attention':'LN + MLP',544,y+19,i===1&&selected==='attention'?C.purple:C.ink,11);
    }
    if(selected==='attention'){arrow(ctx,274,170,446,170,C.blue,5);label(ctx,'共享多模态上下文',360,145,C.blue,12);}
    else {ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(274,170);ctx.lineTo(446,170);ctx.stroke();}
    rounded(ctx,271,289,178,36,8,selected==='init'?'#eaf7ef':C.white,selected==='init'?C.green:C.line);label(ctx,'预训练 VLM',360,307,selected==='init'?C.green:C.muted,12);
    arrow(ctx,325,289,183,268,selected==='init'?C.green:C.line,2);arrow(ctx,395,289,537,268,selected==='init'?C.green:C.line,2);
    if(selected==='ar') arrow(ctx,99,248,99,104,C.blue,4);
    if(selected==='dm') arrow(ctx,621,248,621,104,C.purple,4);
  },720,340,[selected]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={340} aria-label="MoT 双塔与共享注意力结构" />
    <div className="paper-control-row">{partLabels.map(([id,n])=><Chip key={id} active={selected===id} onClick={()=>setSelected(id)}>{n}</Chip>)}</div>
    <div className={'feedback '+(selected==='attention'||selected==='init'?'good':'')}>{partCopy[selected]}</div>
  </div>;
};

type Track='video'|'audio'|'action';
const trackLabels:Array<[Track,string,number]>=[['video','视频',6],['audio','音频',25],['action','动作',10]];
const trackColor:Record<Track,string>={video:C.blue,audio:C.purple,action:C.orange};

export const Ch8TimeAlignment: React.FC<WidgetProps> = () => {
  const [modality,setModality]=useState<Track>('video');
  const [tps,setTps]=useState(6);
  const choose=(m:Track)=>{setModality(m);setTps(trackLabels.find(([id])=>id===m)?.[2]||6);};
  const delta=6/tps;
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,320);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,320);
    rounded(ctx,34,24,652,48,9,C.white,C.line);label(ctx,'Δt = TPSbase / TPS = 6 / '+tps+' = '+delta.toFixed(2),360,48,C.ink,15);
    const left=90,right=650,span=right-left;
    [0,1,2].forEach(sec=>{const x=left+span*(sec/2);ctx.strokeStyle=sec===1?C.green:C.line;ctx.lineWidth=sec===1?4:2;ctx.beginPath();ctx.moveTo(x,85);ctx.lineTo(x,242);ctx.stroke();label(ctx,sec+' 秒',x,263,sec===1?C.green:C.muted,11);});
    trackLabels.forEach(([id,n,base],i)=>{
      const y=111+i*54;const active=modality===id;label(ctx,n,25,y,active?trackColor[id]:C.muted,12,'left');
      ctx.strokeStyle=active?trackColor[id]:C.line;ctx.lineWidth=active?4:2;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
      const count=Math.min(60,Math.round((active?tps:base)*2));const step=span/count;
      for(let j=0;j<=count;j++){const x=left+j*step;ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();}
      label(ctx,(active?tps:base)+' TPS',681,y,active?trackColor[id]:C.muted,10);
    });
    rounded(ctx,198,282,324,26,6,'#fff7e8',C.orange);label(ctx,'AR 区  ┊  固定时间间隔 15000  ┊  DM 区',360,295,C.orange,10);
  },720,320,[modality,tps,delta]);
  const feedback=tps===6?'Δt=1：基准视频 latent 每个 token 前进一步。':tps===25?'Δt=0.24：音频 token 更密，但一秒仍对齐同一竖线。':'TPS 越高，单个 token 的位置步长越小；物理时间不变。';
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={320} aria-label="视频音频动作的物理时间对齐" />
    <div className="paper-control-row">{trackLabels.map(([id,n])=><Chip key={id} active={modality===id} onClick={()=>choose(id)}>{n}</Chip>)}</div>
    <div className="ctrl paper-range"><label>演示采样率 TPS <span className="val">{tps}</span></label><input aria-label="演示采样率 TPS" type="range" min="3" max="30" step="1" value={tps} onChange={e=>setTps(Number(e.target.value))}/></div>
    <div className="feedback good">{feedback} 这里的非默认值用于理解公式。</div>
  </div>;
};
