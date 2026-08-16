import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token } from './studio-kit';

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

export const Ch1Unification: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState<0|1|2>(0);
  const ref = useCanvas((ctx) => {
    ctx.clearRect(0, 0, 720, 330);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,330);
    label(ctx,'同一任务：绕过障碍，从杯柄抓起左侧红杯',360,26,C.ink,15);
    rounded(ctx,18,48,326,258,14,'#fffafa',C.red);
    rounded(ctx,376,48,326,258,14,'#fbfffc',C.green);
    label(ctx,'分离式模型管线',181,72,C.red,15);
    label(ctx,'Cosmos 3 统一序列',539,72,C.green,15);

    const details=['红杯','左侧','避障','抓杯柄'];
    if(step===0){
      rounded(ctx,45,98,272,48,9,C.white,C.blue);label(ctx,'视觉语言模型接收完整任务',181,122,C.blue,12);
      rounded(ctx,403,98,272,48,9,C.white,C.blue);label(ctx,'AR 前缀接收完整任务',539,122,C.blue,12);
      details.forEach((n,i)=>{token(ctx,48+i*67,170,60,n,'clean');token(ctx,406+i*67,170,60,n,'clean');});
      label(ctx,'输入信息相同',181,252,C.muted,12);label(ctx,'输入信息相同',539,252,C.muted,12);
    }else if(step===1){
      rounded(ctx,45,98,272,44,9,C.white,C.line);label(ctx,'视觉语言模型',181,120,C.ink,12);
      arrow(ctx,181,144,181,168,C.red,3);
      rounded(ctx,74,174,214,52,9,'#fff1f2',C.red);label(ctx,'接口摘要：抓取红杯',181,200,C.red,13);
      label(ctx,'左侧 · 避障 · 杯柄：可能未进入接口',181,256,C.red,11);

      rounded(ctx,403,98,272,44,9,C.white,C.blue);label(ctx,'统一序列中的 AR 前缀',539,120,C.blue,12);
      arrow(ctx,539,144,539,164,C.blue,3);
      details.forEach((n,i)=>token(ctx,406+i*67,170,60,n,'ar'));
      label(ctx,'四项 token 级信息继续保留',539,256,C.green,12);
    }else{
      rounded(ctx,74,98,214,48,9,'#fff1f2',C.red);label(ctx,'接口摘要：抓取红杯',181,122,C.red,12);
      arrow(ctx,181,148,181,176,C.red,3);
      rounded(ctx,65,182,232,62,10,C.white,C.line);label(ctx,'独立生成 / 控制模型',181,204,C.ink,12);label(ctx,'只能依据接口摘要',181,228,C.muted,11);
      label(ctx,'细节是否保留取决于接口设计',181,273,C.red,11);

      details.forEach((n,i)=>token(ctx,406+i*67,98,60,n,'ar'));
      arrow(ctx,539,146,539,174,C.blue,4);
      rounded(ctx,432,180,214,62,10,'#f5f0ff',C.purple);label(ctx,'DM 分支读取完整 AR 上下文',539,202,C.purple,12);label(ctx,'生成未来视频与动作',539,226,C.ink,11);
      label(ctx,'无需先压成单一摘要',539,273,C.green,12);
    }
  },720,330,[step]);
  const feedback = step===0
    ?'两种方法从相同的任务信息出发。'
    :step===1
      ?'分离式模型通过接口传递中间结果，接口可能只保留摘要；Cosmos 3 将完整 AR token 保留在统一序列中。'
      :'后续生成时，独立模型只能使用接口提供的信息；Cosmos 3 的 DM 分支可直接读取完整 AR token 级上下文。该对照描述论文关注的信息路径，不表示所有分离式系统都会丢失相同细节。';
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={330} aria-label="分离式模型接口与 Cosmos 3 统一序列的信息保留对照" />
    <div className="paper-control-row">
      <Chip active={step===0} onClick={()=>setStep(0)}>1 原始信息</Chip>
      <Chip active={step===1} onClick={()=>setStep(1)}>2 接口传递</Chip>
      <Chip active={step===2} onClick={()=>setStep(2)}>3 生成阶段</Chip>
    </div>
    <div className={'feedback '+(step===2?'good':'')}>{feedback}</div>
  </div>;
};

type Modality = 'text'|'vision'|'audio'|'action'|'hidden';
const modalityCopy: Record<Modality, string> = {
  text: '语言由 tokenizer 形成自回归 token，再进入统一隐空间。',
  vision: '视觉理解使用 ViT；视觉生成使用冻结的 Wan2.2 VAE latent。',
  audio: '48 kHz ÷ 1920 = 25 token/s，之后按物理时间对齐。',
  action: 'ego 9D、effector 9D、grasp 15D/1D 先经过域相关投影。',
  hidden: '统一发生在隐空间，不发生在原始数据格式。',
};

export const Ch2Modalities: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<Modality>('text');
  const items: Array<[Modality,string]> = [['text','语言'],['vision','图像·视频'],['audio','音频'],['action','动作'],['hidden','统一空间']];
  const ref = useCanvas((ctx) => {
    ctx.clearRect(0,0,720,300);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,300);
    label(ctx,'专用入口',105,28,C.muted,13); label(ctx,'编码 / 投影',350,28,C.muted,13); label(ctx,'统一 hidden space',601,28,C.muted,13);
    items.slice(0,4).forEach(([id,name],i)=>{
      const y=52+i*56; const active=selected===id;
      rounded(ctx,28,y,150,38,8,active?'#eef4fb':C.white,active?C.blue:C.line);label(ctx,name,103,y+19,active?C.blue:C.ink,12);
      if(active) arrow(ctx,180,y+19,276,y+19,C.blue,4);
    });
    rounded(ctx,276,64,160,166,12,C.white,selected==='hidden'?C.green:C.blue);
    if(selected==='vision'){
      rounded(ctx,293,88,126,44,7,'#eef4fb',C.blue);label(ctx,'ViT · 理解',356,110,C.blue,12);
      rounded(ctx,293,151,126,55,7,'#f5f0ff',C.purple);label(ctx,'Wan2.2 VAE',356,168,C.purple,11);label(ctx,'生成侧冻结',356,189,C.muted,10);
    }else if(selected==='action'){
      ['ego 9D','effector 9D','grasp 15D/1D'].forEach((n,i)=>{rounded(ctx,291,82+i*48,130,34,6,'#fff7e8',C.orange);label(ctx,n,356,99+i*48,C.orange,11);});
    }else if(selected==='audio'){
      label(ctx,'48 kHz',356,104,C.purple,17);label(ctx,'÷ hop 1920',356,143,C.muted,12);label(ctx,'= 25 token/s',356,184,C.purple,15);
    }else if(selected==='hidden'){
      ['文','视','音','动'].forEach((n,i)=>token(ctx,294+i*31,110,28,n,i===2?'audio':i===3?'action':'clean'));
      label(ctx,'维度统一，速率可不同',356,185,C.green,11);
    }else{
      token(ctx,306,104,100,'文本 token','ar');label(ctx,'因果顺序保留',356,177,C.blue,12);
    }
    arrow(ctx,438,147,508,147,C.blue,4); rounded(ctx,510,76,180,142,12,'#f8fbff',selected==='hidden'?C.green:C.line);
    for(let i=0;i<5;i++) token(ctx,530+i*28,112,22,String(i+1),i===2?'audio':i===3?'action':'clean');
    label(ctx,'共同计算上下文',600,184,selected==='hidden'?C.green:C.ink,12);
  },720,300,[selected]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="五种模态的专用编码器与统一隐空间" />
    <div className="paper-control-row">{items.map(([id,n])=><Chip key={id} active={selected===id} onClick={()=>setSelected(id)}>{n}</Chip>)}</div>
    <div className={'feedback ' + (selected==='hidden'?'good':'')}>{modalityCopy[selected]}</div>
  </div>;
};

type Mode = 'reason'|'t2i'|'t2va'|'i2va'|'v2v'|'fd'|'id'|'policy';
const modeLabels: Array<[Mode,string]> = [['reason','语言推理'],['t2i','T2I'],['t2va','T2V+A'],['i2va','I2V+A'],['v2v','V2V 迁移'],['fd','FD'],['id','ID'],['policy','Policy']];
const specs: Record<Mode,{ar:string[];clean:string[];noisy:string[];note:string}> = {
  reason:{ar:['问题','推理','回答'],clean:[],noisy:[],note:'只有 AR 子序列：按因果顺序续写。'},
  t2i:{ar:['文字'],clean:['文本'],noisy:['图像'],note:'文字是条件，图像是待还原目标。'},
  t2va:{ar:['文字'],clean:['文本'],noisy:['视频','音频'],note:'视频与音频可以一起成为加噪目标。'},
  i2va:{ar:['文字'],clean:['首帧'],noisy:['视频','音频'],note:'首帧保持干净，后续视听内容被预测。'},
  v2v:{ar:['指令'],clean:['参考视频'],noisy:['迁移视频'],note:'参考视频与指令共同约束迁移目标。'},
  fd:{ar:['任务'],clean:['状态','动作'],noisy:['未来视觉'],note:'FD：给状态与动作，预测未来画面。'},
  id:{ar:['任务'],clean:['起始视觉','目标视觉'],noisy:['动作'],note:'ID：给起点和目标，反推动作。'},
  policy:{ar:['指令'],clean:['观察'],noisy:['动作'],note:'Policy：根据语言与观察生成动作。'},
};

export const Ch3TokenLayout: React.FC<WidgetProps> = () => {
  const [mode,setMode]=useState<Mode>('t2va');
  const s=specs[mode];
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,300);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,300);
    label(ctx,'AR 子序列 · 因果',97,42,C.blue,13); label(ctx,'DM 子序列 · 条件在前，目标在后',466,42,C.purple,13);
    let x=30;
    s.ar.forEach((n)=>{token(ctx,x,70,78,n,'ar');x+=88;});
    if(s.ar.length===0) label(ctx,'无 AR token',110,91,C.muted,12);
    arrow(ctx,292,91,339,91,C.blue,3);
    x=352;
    s.clean.forEach((n)=>{const w=n.length>4?100:78;token(ctx,x,70,w,n,'clean');x+=w+10;});
    s.noisy.forEach((n)=>{const w=n.length>4?100:78;token(ctx,x,70,w,n,n==='动作'?'action':'noisy');x+=w+10;});
    rounded(ctx,44,163,632,84,12,C.white,C.line);
    label(ctx,'CLEAN',111,187,C.blue,12);label(ctx,s.clean.length?s.clean.join(' + '):'—',111,220,C.ink,12);
    label(ctx,'NOISY → 输出',376,187,C.red,12);label(ctx,s.noisy.length?s.noisy.join(' + '):'无 DM 输出',376,220,C.ink,12);
    rounded(ctx,548,180,106,48,8,'#eaf7ef',C.green);label(ctx,modeLabels.find(([id])=>id===mode)?.[1]||'',601,204,C.green,12);
  },720,300,[mode,s]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="不同任务模式的 AR 与 DM token 排列" />
    <div className="paper-control-row">{modeLabels.map(([id,n])=><Chip key={id} active={mode===id} onClick={()=>setMode(id)}>{n}</Chip>)}</div>
    <div className="feedback good">{s.note}</div>
  </div>;
};
