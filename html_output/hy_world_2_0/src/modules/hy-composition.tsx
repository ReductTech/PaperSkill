import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type StepId='baseline'|'voxel'|'densify'|'mask'|'final';
const C={bg:'#f5f8f0',line:'#d7deea',ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',white:'#fff'};
const steps:Record<StepId,{code:string;title:string;count:number;psnr:number;ssim:number;lpips:number;detail:number;floaters:number;lesson:string;why:string;color:string}>={
  baseline:{code:'B',title:'6M 基线',count:6,psnr:25.176,ssim:.751,lpips:.209,detail:100,floaters:2,lesson:'细节完整，但每处都保留大量高斯，资产最重。',why:'先建立不压缩的画质上限。',color:C.blue},
  voxel:{code:'V',title:'仅体素降采样',count:1,psnr:24.504,ssim:.720,lpips:.276,detail:48,floaters:0,lesson:'统一删点让数量骤降，但砖缝、窗框等高频细节一起消失。',why:'说明只追求少点会明显伤害画质。',color:C.red},
  densify:{code:'D',title:'+ 自适应增密',count:5.254,psnr:25.158,ssim:.750,lpips:.210,detail:96,floaters:10,lesson:'高梯度区域重新增密，细节几乎恢复；天空缺少可靠深度，产生漂浮高斯。',why:'说明增密能补细节，也会把错误区域一起放大。',color:C.orange},
  mask:{code:'M',title:'+ MaskGaussian',count:1.383,psnr:25.017,ssim:.747,lpips:.216,detail:91,floaters:5,lesson:'学习存在掩码并永久剪除低激活高斯，数量显著下降，但天空增密源头仍在。',why:'说明概率稀疏化负责删冗余。',color:C.purple},
  final:{code:'F',title:'完整配置',count:1.381,psnr:25.023,ssim:.747,lpips:.215,detail:92,floaters:1,lesson:'只在非天空区域增密，再用 MaskGaussian 稀疏化：细节保留，天空漂浮物受控。',why:'把“在哪里补点”和“哪些点留下”同时设计。',color:C.green},
};
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=12,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px Segoe UI, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left';}
function CompositionCanvas({step}:{step:StepId}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,620,340)}catch{return}const paint=()=>{const d=steps[step];ctx.clearRect(0,0,620,340);ctx.fillStyle=C.bg;ctx.fillRect(0,0,620,340);
  ctx.fillStyle='#d9e8f2';ctx.fillRect(26,44,568,116);ctx.fillStyle='#a7b99a';ctx.fillRect(26,160,568,138);ctx.fillStyle='#d2b27b';ctx.fillRect(210,112,202,186);ctx.fillStyle='#7190a2';ctx.fillRect(272,150,78,72);
  const cols=Math.max(3,Math.round(d.detail/12));const rows=Math.max(2,Math.round(d.detail/18));ctx.strokeStyle=d.color;ctx.globalAlpha=.3+.7*d.detail/100;for(let r=0;r<rows;r+=1)for(let c=0;c<cols;c+=1){ctx.strokeRect(214+c*194/cols,118+r*174/rows,190/cols,168/rows);}ctx.globalAlpha=1;
  for(let i=0;i<d.floaters;i+=1){const x=62+(i*83)%500,y=62+(i*31)%72;ctx.fillStyle=i%2?C.red:C.orange;ctx.globalAlpha=.58;ctx.beginPath();ctx.arc(x,y,5+(i%3),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  label(ctx,step==='voxel'?'砖缝被统一删薄':step==='densify'?'细节恢复，但天空漂浮':step==='final'?'非天空增密 + 稀疏掩码':'当前资产外观',310,24,d.color,13,'center');
  label(ctx,'高斯 '+d.count.toFixed(3)+'M',34,326,d.color,11);label(ctx,'PSNR '+d.psnr.toFixed(3),224,326,C.green,11);label(ctx,'LPIPS '+d.lpips.toFixed(3),410,326,C.orange,11);canvas.classList.add('is-ready');};const disconnect=observeCanvas(canvas,paint,()=>undefined);paint();return disconnect;},[step]);return <canvas ref={ref} width={620} height={340}/>;}

export const HyComposition:React.FC<WidgetProps>=()=>{const[step,setStep]=useState<StepId>('baseline');const d=steps[step];return <div className="composition-rebuild">
  <div className="learning-contract"><div><span>为什么学</span><p>WorldMirror 输出的初始 3DGS 可达 6M，高质量但过重；直接删点又会破坏纹理，普通增密还会在天空产生漂浮物。</p></div><div><span>本次操作</span><p>按论文 Table 9 的五个配方逐步切换，观察墙面细节、天空漂浮物和高斯数量如何一起变化。</p></div><div><span>应得判断</span><p>最终方案不是单一压缩技巧，而是体素降采样、非天空增密与 MaskGaussian 的因果组合。</p></div></div>
  <div className="composition-step-tabs" role="tablist" aria-label="选择 3DGS 配方">{(Object.keys(steps) as StepId[]).map((id,index)=><button key={id} type="button" role="tab" aria-selected={step===id} className={step===id?'selected':''} onClick={()=>setStep(id)}><b>{index+1}</b><span>{steps[id].title}</span><small>{steps[id].code}</small></button>)}</div>
  <CompositionCanvas step={step}/>
  <section className="composition-causal-card"><div><span>这一步为什么存在</span><strong>{d.why}</strong></div><i>→</i><div><span>画面上应该看到</span><strong>{d.lesson}</strong></div></section>
  <div className="composition-metric-ledger"><div><span>高斯数量</span><strong>{d.count.toFixed(3)}M</strong><small>越低越轻</small></div><div><span>PSNR</span><strong>{d.psnr.toFixed(3)}</strong><small>越高越好</small></div><div><span>SSIM</span><strong>{d.ssim.toFixed(3)}</strong><small>越高越好</small></div><div><span>LPIPS</span><strong>{d.lpips.toFixed(3)}</strong><small>越低越好</small></div></div>
  <div className={`feedback ${step==='final'?'good':step==='voxel'?'bad':''}`}>{step==='final'?'相对 6M 基线，高斯减少约 77%，PSNR 下降 0.153 dB，LPIPS 增加 0.006；这是有代价的紧凑表示，不是无损压缩。':d.lesson}</div>
  <div className="composition-glossary-grid"><details><summary>MaskGaussian 怎么删点？</summary><p>它用 Gumbel-Softmax 学习每个高斯的存在掩码，并以稀疏损失鼓励低激活高斯被永久剪枝。</p></details><details><summary>为什么天空不适合普通增密？</summary><p>天空缺少可靠深度监督，位置梯度可能驱动高斯在空中克隆和分裂，形成漂浮伪影。</p></details></div>
  <PaperTable tableId="table-9"/><EvidenceMediaDrawer mediaType="官方 GIF" src="/images/official-mesh.gif" title="轻量 Mesh 漫游与交付效果" caption="官方演示用于理解资产压缩最终服务于加载与漫游，不对应 Table 9 的独立指标。" alt="官方轻量 Mesh 漫游" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗"/>
  </div>;};

export default HyComposition;
