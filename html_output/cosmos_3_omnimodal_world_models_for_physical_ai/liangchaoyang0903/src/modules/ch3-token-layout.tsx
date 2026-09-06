import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token } from './studio-kit';

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

export const Ch1Unification: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (step >= 3) { setRunning(false); return; }
    const id = window.setTimeout(() => setStep((s) => s + 1), 720);
    return () => window.clearTimeout(id);
  }, [running, step]);
  const ref = useCanvas((ctx) => {
    ctx.clearRect(0, 0, 720, 300); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 720, 300);
    rounded(ctx, 18, 20, 326, 224, 14, '#fffafa', C.red); rounded(ctx, 376, 20, 326, 224, 14, '#fbfffc', C.green);
    label(ctx, '多个专用模型', 181, 46, C.red, 16); label(ctx, 'Cosmos 3', 539, 46, C.green, 16);
    const names = ['理解', '预测', '行动'];
    names.forEach((n, i) => {
      const x1 = 35 + i * 101; const x2 = 393 + i * 101;
      rounded(ctx, x1, 88, 78, 50, 8, C.white, step === i + 1 ? C.red : C.line); label(ctx, n, x1 + 39, 113, C.ink, 12);
      rounded(ctx, x2, 88, 78, 50, 8, C.white, step >= i + 1 ? C.green : C.line); label(ctx, n, x2 + 39, 113, C.ink, 12);
      if (i < 2) { arrow(ctx, x1 + 79, 113, x1 + 99, 113, i === 1 && step >= 2 ? C.red : C.muted, 2); arrow(ctx, x2 + 79, 113, x2 + 99, 113, C.blue, 3); }
    });
    const leftText = step < 2 ? '杯子 · 位置 · 目标' : step === 2 ? '杯子 · 目标' : '只剩目标';
    token(ctx, 73, 164, 216, leftText, step === 3 ? 'noisy' : 'clean');
    token(ctx, 431, 164, 216, '杯子 · 位置 · 目标', 'ar');
    if (step === 3) { label(ctx, '× 上下文断开', 181, 224, C.red, 13); label(ctx, '✓ 闭环完成', 539, 224, C.green, 13); }
    ['看懂', '推演', '执行'].forEach((n,i)=>{label(ctx,n,120+i*240,276,step>=i+1?C.blue:C.muted,12);});
  }, 720, 300, [step]);
  const feedback = step === 0 ? '启动同一任务，观察线索在哪里断开。'
    : step === 1 ? '两边都能看懂，但左侧开始转交摘要。'
    : step === 2 ? '左侧的“杯子位置”已在第二次转交中丢失。'
    : '旧流程丢失空间线索；统一序列保留上下文并完成闭环。';
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="传统链路与统一闭环对照" />
    <div className="paper-control-row">
      <button className="paper-action" disabled={running} onClick={() => { setStep(0); setRunning(true); }}>{step === 3 ? '再演示一次' : running ? '闭环运行中…' : '开始一次闭环'}</button>
    </div>
    <div className={'feedback ' + (step === 3 ? 'good' : step === 2 ? 'bad' : '')}>{feedback}</div>
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

type Segment = 'all'|'ar'|'clean'|'noisy';
const segmentLabels: Array<[Segment,string]> = [
  ['all','完整格式'],
  ['ar','自回归前缀'],
  ['clean','干净条件'],
  ['noisy','加噪目标'],
];
const segmentCopy: Record<Segment,string> = {
  all:'统一序列 S=[S_AR, S_DM]；扩散子序列 S_DM=[C_clean, X̃_target]。',
  ar:'S_AR 位于序列前部，按因果顺序生成语言或推理 token，并以特殊标记结束。',
  clean:'C_clean 保持原值，向后续生成提供条件；这些位置不加入噪声，也不计算去噪损失。',
  noisy:'X̃_target 是加入噪声的连续目标，由扩散分支恢复，并在这些位置计算训练损失。',
};

export const Ch3TokenLayout: React.FC<WidgetProps> = () => {
  const [segment,setSegment]=useState<Segment>('all');
  const active=(id:Exclude<Segment,'all'>)=>segment==='all'||segment===id;
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,300);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,300);
    label(ctx,'统一序列  S = [ S_AR  |  S_DM ]',360,31,C.ink,16);

    rounded(ctx,24,62,242,142,12,active('ar')?'#eef4fb':C.white,segment==='ar'?C.blue:C.line);
    label(ctx,'自回归子序列 S_AR',145,84,active('ar')?C.blue:C.muted,13);
    token(ctx,35,108,34,'l₁','ar');
    token(ctx,75,108,34,'l₂','ar');
    token(ctx,115,108,34,'…','ar');
    token(ctx,155,108,48,'EOS','ar');
    token(ctx,209,108,48,'BOG','ar');
    label(ctx,'因果顺序：前一个 token → 后一个 token',145,181,active('ar')?C.ink:C.muted,11);

    arrow(ctx,268,133,292,133,C.blue,3);
    rounded(ctx,296,62,174,142,12,active('clean')?'#f2f7fd':C.white,segment==='clean'?C.blue:C.line);
    label(ctx,'干净条件 C_clean',383,84,active('clean')?C.blue:C.muted,13);
    token(ctx,315,108,62,'c₁','clean');
    token(ctx,386,108,62,'cₚ','clean');
    label(ctx,'保持原值',383,181,active('clean')?C.ink:C.muted,11);

    arrow(ctx,472,133,492,133,C.purple,3);
    rounded(ctx,496,62,200,142,12,active('noisy')?'#fff3f4':C.white,segment==='noisy'?C.red:C.line);
    label(ctx,'加噪目标 X̃_target',596,84,active('noisy')?C.red:C.muted,13);
    token(ctx,514,108,76,'x̃₁','noisy');
    token(ctx,600,108,76,'x̃Q','noisy');
    label(ctx,'扩散恢复并计算损失',596,181,active('noisy')?C.ink:C.muted,11);

    rounded(ctx,296,222,400,43,8,C.white,active('clean')||active('noisy')?C.purple:C.line);
    label(ctx,'扩散子序列  S_DM = [ C_clean  |  X̃_target ]',496,244,active('clean')||active('noisy')?C.purple:C.muted,12);
  },720,300,[segment]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="Cosmos 3 统一序列的组成与排列" />
    <div className="paper-control-row">{segmentLabels.map(([id,n])=><Chip key={id} active={segment===id} onClick={()=>setSegment(id)}>{n}</Chip>)}</div>
    <div className="feedback good">{segmentCopy[segment]}</div>
  </div>;
};
