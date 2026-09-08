import React, { useEffect, useMemo, useState } from 'react';
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
  vision: '视觉理解使用视觉 Transformer；视觉生成使用冻结的 Wan2.2 视频压缩编码器。',
  audio: '48 kHz ÷ 1920 = 25 token/s，之后按物理时间对齐。',
  action: '机体、末端执行器和抓取动作先经各机器人域专用的线性层投影。',
  hidden: '统一发生在公共表示空间，而不是原始数据格式。',
};

export const Ch2Modalities: React.FC<WidgetProps> = () => {
  const [expanded, setExpanded] = useState(false);
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
  },720,300,[selected, expanded]);
  if (!expanded) return <div className="paper-widget-shell paper-backup-gate">
    <div className="feedback">视觉、音频和动作使用不同编码路径，再投影到公共表示维度。</div>
    <button className="paper-chip paper-backup-toggle" onClick={()=>setExpanded(true)}>展开编码细节</button>
  </div>;
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="五种模态的专用编码器与统一隐空间" />
    <div className="paper-control-row">{items.map(([id,n])=><Chip key={id} active={selected===id} onClick={()=>setSelected(id)}>{n}</Chip>)}</div>
    <div className={'feedback ' + (selected==='hidden'?'good':'')}>{modalityCopy[selected]}</div>
    <div className="paper-control-row"><button className="paper-chip" onClick={()=>setExpanded(false)}>收起扩展材料</button></div>
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
