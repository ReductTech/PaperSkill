import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token } from './studio-kit';

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

type MaskMode='paper'|'leak'|'cut';
type Cell='ar-ar'|'ar-dm'|'dm-ar'|'dm-dm';
const cellNames:Record<Cell,string>={'ar-ar':'AR 读 AR','ar-dm':'AR 读 DM','dm-ar':'DM 读 AR','dm-dm':'DM 读 DM'};

export const Ch4AttentionMask: React.FC<WidgetProps> = () => {
  const [mode,setMode]=useState<MaskMode>('paper');
  const [cell,setCell]=useState<Cell>('dm-ar');
  const allowed=(c:Cell)=> mode==='paper' ? c!=='ar-dm' : mode==='leak' ? true : c==='ar-ar'||c==='dm-dm';
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,320);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,320);
    label(ctx,'Key →',222,30,C.muted,12);label(ctx,'Query ↓',37,79,C.muted,12);
    ['AR','DM'].forEach((n,i)=>label(ctx,n,156+i*112,60,i===0?C.blue:C.purple,13));
    (['AR','DM'] as const).forEach((q,qi)=>(['AR','DM'] as const).forEach((k,ki)=>{
      const id=(q.toLowerCase()+'-'+k.toLowerCase()) as Cell; const ok=allowed(id); const active=id===cell;
      rounded(ctx,99+ki*112,82+qi*82,102,70,8,ok?(ok&&id==='ar-dm'?'#fff1f2':'#edf8f1'):'#f2f4f7',active?(ok?C.blue:C.red):C.line);
      label(ctx,ok?'可见':'× 阻断',150+ki*112,117+qi*82,ok?C.green:C.red,13);
    }));
    rounded(ctx,380,52,310,208,14,C.white,C.line);label(ctx,'方向图',535,76,C.ink,14);
    rounded(ctx,415,110,91,52,9,'#eef4fb',C.blue);label(ctx,'AR 推理',461,136,C.blue,13);
    rounded(ctx,566,110,91,52,9,'#f5f0ff',C.purple);label(ctx,'DM 生成',611,136,C.purple,13);
    if(mode!=='cut') arrow(ctx,506,136,566,136,C.blue,4);
    if(mode==='leak') arrow(ctx,566,177,506,177,C.red,4);
    if(mode==='cut') {ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(529,124);ctx.lineTo(545,148);ctx.moveTo(545,124);ctx.lineTo(529,148);ctx.stroke();}
    label(ctx,mode==='paper'?'条件单向流入 DM':mode==='leak'?'DM 目标反向泄漏':'AR 条件无法到达 DM',535,219,mode==='paper'?C.green:C.red,13);
  },720,320,[mode,cell]);
  const feedback=mode==='paper'?'论文掩码：推理保持因果，生成仍能读取全部条件。'
    :mode==='leak'?'目标泄漏：AR 读到了尚待预测的 DM token，训练与推理条件不一致。'
    :'条件断开：DM 看不到 AR 计划，统一推理失去作用。';
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={320} aria-label="AR 与 DM 的非对称注意力矩阵" />
    <div className="paper-control-row">
      <Chip active={mode==='paper'} onClick={()=>setMode('paper')}>论文掩码</Chip>
      <Chip active={mode==='leak'} onClick={()=>setMode('leak')}>AR 可看 DM</Chip>
      <Chip active={mode==='cut'} onClick={()=>setMode('cut')}>DM 不看 AR</Chip>
    </div>
    <div className="paper-control-row paper-subcontrols">{(Object.keys(cellNames) as Cell[]).map(id=><Chip key={id} active={cell===id} onClick={()=>setCell(id)}>{cellNames[id]}：{allowed(id)?'可见':'阻断'}</Chip>)}</div>
    <div className={'feedback '+(mode==='paper'?'good':'bad')}>{feedback} 当前检查：{cellNames[cell]}。</div>
  </div>;
};

type CondMode='t2v'|'i2v'|'v2v'|'a2v';
const condLabels:Array<[CondMode,string]>=[['t2v','T2V'],['i2v','I2V'],['v2v','V2V 迁移'],['a2v','动作条件视频']];
const condCopy:Record<CondMode,string>={
  t2v:'文字给语义方向，视频 token 从噪声开始生成。',
  i2v:'首帧保持干净，后续视频是待预测目标。',
  v2v:'文字与参考视频共同约束迁移；滑块只演示参考条件占比变化。',
  a2v:'动作 token 给运动约束，视频目标仍由 DM 去噪。',
};

export const Ch5Conditioning: React.FC<WidgetProps> = () => {
  const [mode,setMode]=useState<CondMode>('t2v');
  const [reference,setReference]=useState(55);
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,300);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,300);
    label(ctx,'干净条件',120,35,C.blue,14);label(ctx,'条件融合',360,35,C.orange,14);label(ctx,'加噪目标',602,35,C.red,14);
    const cards=mode==='t2v'?['文字']:mode==='i2v'?['文字','首帧']:mode==='v2v'?['文字','参考视频']:['文字','动作'];
    cards.forEach((n,i)=>{const kind=n==='动作'?'action':'clean';token(ctx,47,74+i*62,145,n,kind);});
    ctx.strokeStyle=C.orange;ctx.lineWidth=9;ctx.beginPath();ctx.arc(357,136,40,-.7,4.7);ctx.stroke();label(ctx,'GUIDANCE',357,136,C.orange,10);
    cards.forEach((n,i)=>{
      const strength=n==='参考视频'?reference/100:.7;
      arrow(ctx,194,95+i*62,315,130+i*8,n==='动作'?C.orange:n==='参考视频'?C.green:C.blue,2+strength*4);
    });
    arrow(ctx,400,136,511,136,C.blue,4);
    rounded(ctx,513,79,174,114,12,'#f4fbf6',reference>80&&mode==='v2v'?C.orange:C.green);
    label(ctx,mode==='v2v'&&reference>80?'参考条件权重较高':'目标 latent 恢复',600,119,mode==='v2v'&&reference>80?C.orange:C.green,13);
    label(ctx,mode==='a2v'?'视频 ← 动作':mode==='i2v'?'后续视频 ← 首帧':'生成视频',600,155,C.ink,12);
    rounded(ctx,66,231,588,42,8,C.white,C.line);label(ctx,'CLEAN：'+cards.join(' + ')+'    NOISY：视频目标',360,252,C.ink,12);
  },720,300,[mode,reference]);
  const warn=mode==='v2v'&&reference>80;
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={300} aria-label="条件与目标的组合关系" />
    <div className="paper-control-row">{condLabels.map(([id,n])=><Chip key={id} active={mode===id} onClick={()=>setMode(id)}>{n}</Chip>)}</div>
    {mode==='v2v'&&<div className="ctrl paper-range"><label>参考影响 <span className="val">{reference}%</span></label><input aria-label="参考影响" type="range" min="0" max="100" value={reference} onChange={e=>setReference(Number(e.target.value))}/><small>教学演示值，不是论文最优超参数</small></div>}
    <div className={'feedback '+(warn?'':'good')}>{warn?'参考影响很强：更贴近原视频，也要警惕只复制外观。':condCopy[mode]}</div>
  </div>;
};

const steps=['条件就位','AR 计划','噪声初始化','迭代去噪','输出完成'];
const stepCopy=[
  '输入条件保持干净，但还没有生成推理或目标。',
  'AR 以因果方式续写导演计划。',
  '只给目标模态采样噪声。',
  'DM 读取计划与条件，沿速度场去噪。',
  '推理与生成在同一序列中闭环完成。',
];

export const Ch6Inference: React.FC<WidgetProps> = () => {
  const [step,setStep]=useState(0);
  const ref=useCanvas((ctx)=>{
    ctx.clearRect(0,0,720,320);ctx.fillStyle=C.bg;ctx.fillRect(0,0,720,320);
    label(ctx,'统一序列',65,30,C.muted,12,'left');
    token(ctx,36,50,104,'干净条件','clean');
    if(step>=1){token(ctx,152,50,82,'AR 计划①','ar');token(ctx,244,50,82,'计划②','ar');}
    if(step>=2){token(ctx,350,50,105,step>=4?'视频输出':'视频目标',step>=4?'clean':'noisy');token(ctx,466,50,105,step>=4?'音频输出':'音频目标',step>=4?'audio':'noisy');token(ctx,582,50,102,step>=4?'动作输出':'动作目标',step>=4?'action':'noisy');}
    rounded(ctx,38,132,280,112,12,'#eef4fb',step===1?C.blue:C.line);label(ctx,'导演台 · AR',178,157,C.blue,14);label(ctx,step>=1?'问题 → 计划① → 计划②':'等待因果续写',178,202,C.ink,12);
    rounded(ctx,402,132,280,112,12,'#f7f2ff',step>=2?C.purple:C.line);label(ctx,'摄影棚 · DM',542,157,C.purple,14);
    const clarity=step<2?0:step===2?0.08:step===3?0.58:1;
    rounded(ctx,475,179,134,47,8,clarity===1?'#eaf7ef':'#fff3f4',clarity===1?C.green:C.red);label(ctx,'清晰度 '+Math.round(clarity*100)+'%',542,202,clarity===1?C.green:C.red,12);
    if(step>=3) arrow(ctx,318,188,402,188,C.blue,4);
    steps.forEach((n,i)=>{ctx.fillStyle=i<=step?C.blue:C.line;ctx.beginPath();ctx.arc(96+i*132,285,7,0,Math.PI*2);ctx.fill();label(ctx,n,96+i*132,266,i===step?C.blue:C.muted,10);});
  },720,320,[step]);
  return <div className="paper-widget-shell">
    <canvas ref={ref} width={720} height={320} aria-label="统一推理的五个状态" />
    <div className="paper-control-row">
      <button className="paper-chip" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>上一步</button>
      <span className="paper-step-count">{step+1} / 5</span>
      <button className="paper-action" disabled={step===4} onClick={()=>setStep(s=>Math.min(4,s+1))}>下一步</button>
      {step===4&&<button className="paper-chip" onClick={()=>setStep(0)}>重新开始</button>}
    </div>
    <div className={'feedback '+(step===4?'good':'')} aria-live="polite">{stepCopy[step]}</div>
  </div>;
};
