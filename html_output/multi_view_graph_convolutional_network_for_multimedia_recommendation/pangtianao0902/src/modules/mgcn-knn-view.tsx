import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 560, H = 240;
const C = { bg:'#f5f8f0', paper:'#b8c9a7', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', text:'#21324a', muted:'#68778f', border:'#d7deea' };
type Dataset = 'Baby' | 'Sports' | 'Clothing';
type Modality = 'visual' | 'text';
type Phase = 'graph' | 'done';
type State = { dataset: Dataset; k: number; modality: Modality; phase: Phase; judgment: ''|'right'|'wrong' };
type Props = { chapterId: string; moduleId: string };
const ks = [5,10,15,20,30];
const quota: Record<number,number> = {5:2,10:3,15:4,20:5,30:6};
const neighbors = [
  {x:72,y:54,label:'b'}, {x:154,y:38,label:'c'}, {x:264,y:54,label:'d'}, {x:310,y:112,label:'e'},
  {x:264,y:172,label:'f'}, {x:154,y:188,label:'g'}, {x:72,y:172,label:'h'}, {x:38,y:112,label:'i'},
];

function status(s: State) {
  if (s.phase === 'done') return { cls:'good', text:'只沿保留边传播一层：中心照片已汇入相近物品的公共模态特征。' };
  if (s.k === 15 && s.dataset !== 'Baby') return { cls:'good', text:'在论文设置中，多数数据集约 K=15 较合适；这不是通用常数。' };
  if (s.k === 20 && s.dataset === 'Baby') return { cls:'good', text:'Baby 在论文敏感性实验中更适合 K=20。' };
  if (s.k === 30) return { cls:'bad', text:'警惕：保留过多边会让不重要邻居重新进入传播。' };
  return { cls:'', text:'你正在检验不同稀疏度：较小 K 可减少无关邻居，但也可能漏掉有效语义。' };
}

export const MgcnKnnView: React.FC<Props> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state,setState] = useState<State>({dataset:'Sports',k:15,modality:'visual',phase:'graph',judgment:''});
  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return; let ctx:CanvasRenderingContext2D;
    try{ctx=setupCanvas(canvas,W,H);}catch{return;}
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.strokeStyle=C.border;
    ctx.fillRect(12,12,348,216);ctx.strokeRect(12,12,348,216);ctx.fillRect(372,12,176,216);ctx.strokeRect(372,12,176,216);
    const center={x:176,y:112}; const kept=quota[state.k];
    neighbors.forEach((n,idx)=>{
      ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(n.x,n.y);
      const active=idx<kept;ctx.strokeStyle=active?(state.phase==='done'?C.green:C.orange):C.red;ctx.lineWidth=active?2:1;
      if(!active)ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);
    });
    neighbors.forEach((n,idx)=>{
      ctx.fillStyle=C.paper;ctx.fillRect(n.x-16,n.y-11,32,22);ctx.strokeStyle=idx<kept?C.orange:C.border;ctx.lineWidth=2;ctx.strokeRect(n.x-16,n.y-11,32,22);
      ctx.fillStyle=C.text;ctx.font='11px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillText(`${idx+1}`,n.x,n.y+4);
    });
    ctx.fillStyle='#fff';ctx.fillRect(center.x-27,center.y-20,54,40);ctx.strokeStyle=state.phase==='done'?C.green:C.blue;ctx.lineWidth=3;ctx.strokeRect(center.x-27,center.y-20,54,40);
    ctx.fillStyle=C.text;ctx.font='bold 12px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillText('目标 a',center.x,center.y+4);
    ctx.textAlign='left';ctx.fillStyle=C.text;ctx.font='bold 13px "Segoe UI",sans-serif';ctx.fillText(`${state.dataset} · ${state.modality==='visual'?'视觉':'文本'}`,388,34);
    ctx.fillStyle=C.orange;ctx.font='bold 22px "Segoe UI",sans-serif';ctx.fillText(`K = ${state.k}`,388,65);
    ctx.fillStyle=C.muted;ctx.font='11px "Segoe UI",sans-serif';ctx.fillText(`画布保留 ${kept} 条代表边`,388,86);ctx.fillText('画布仅示意边数',388,103);ctx.fillText('K 标签保留论文含义',388,119);
    ctx.fillStyle=C.red;ctx.fillText(`示意剔除边：${8-kept}`,388,145);ctx.fillStyle=C.text;ctx.fillText('仅传播一层',388,165);
    ctx.fillStyle=C.muted;ctx.fillText('依据：第 3–4 页 §2.3.2',388,192);ctx.fillText('第 7 页 §3.4.1',388,208);ctx.fillText('K 为数据集相关参数',388,224);
    canvas.classList.add('is-ready');
  },[state]);
  const update=(patch:Partial<State>)=>setState(s=>({...s,...patch,phase:'graph',judgment:''}));
  const st=status(state);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{maxWidth:'100%',height:'auto'}} aria-label="物品-物品 top-K 稀疏相似图" />
    <div className="ctrl" role="group" aria-label="数据集">{(['Baby','Sports','Clothing'] as Dataset[]).map(d=><button key={d} aria-pressed={state.dataset===d} onClick={()=>update({dataset:d})}>{d}</button>)}</div>
    <div className="ctrl" role="group" aria-label="近邻数量 K" onKeyDown={e=>{const i=ks.indexOf(state.k);if(e.key==='ArrowRight'&&i<ks.length-1)update({k:ks[i+1]});if(e.key==='ArrowLeft'&&i>0)update({k:ks[i-1]});}}>{ks.map(k=><button key={k} aria-pressed={state.k===k} onClick={()=>update({k})}>K={k}</button>)}</div>
    <div className="ctrl" role="group" aria-label="模态">
      <button aria-pressed={state.modality==='visual'} onClick={()=>update({modality:'visual'})}>视觉</button>
      <button aria-pressed={state.modality==='text'} onClick={()=>update({modality:'text'})}>文本</button>
      <button onClick={()=>setState(s=>({...s,phase:'done'}))}>传播一次</button>
      <button onClick={()=>setState(s=>({...s,phase:'graph'}))}>清除传播</button>
    </div>
    <div className={`feedback ${st.cls}`} aria-live="polite">{st.text}</div>
    <details><summary>为什么只传播一层？</summary><p>论文指出，模态语义相似性会随路径增长而下降；堆叠更多层既可能过平滑，也更容易接收噪声特征。因此这里采用浅层的一次传播。</p></details>
    <div className="ctrl" role="group" aria-label="学习判断"><strong>判断：Baby 也必须固定用 K=15 吗？</strong>
      <button onClick={()=>setState(s=>({...s,judgment:'right'}))}>否，应按数据集验证</button>
      <button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>是，所有数据集统一</button>
      <button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>只要 K 越大越好</button>
    </div>
    {state.judgment&&<div className={`feedback ${state.judgment==='right'?'good':'bad'}`}>{state.judgment==='right'?'正确：论文中多数情况约为 15，但 Baby 更适合 20。':'不成立：论文没有给出跨数据集通用 K，且更大 K 可能引入无关边。'}</div>}
  </div>;
};

export default MgcnKnnView;
