import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;
const AW = 244;
const AH = 130;

type Family = 'segmentation' | 'geometry' | 'generation';
type ProtocolId = 'cityscapes-zero' | 'saco-zero-combined' | 'refcocog-zero' | 'reasonseg-zero-singleturn' | 'depth-six' | 'depth-four-matched' | 'normal-four-matched' | 'normal-indoor' | 'normal-vkitti' | 'genai-pairwise' | 'imgedit-pairwise';
type MetricId = 'miou' | 'cgf1' | 'ciou' | 'giou' | 'delta1' | 'absrel' | 'mean-angle' | 'median-angle' | 'win-rate';

interface ValueRecord { name: string; value: number; method?: boolean; auxiliary?: boolean }
interface MetricRecord {
  id: MetricId;
  label: string;
  direction: 'higher' | 'lower';
  domain: [number, number];
  values: ValueRecord[];
  feedback: string;
  supplement?: string;
}
interface ProtocolRecord {
  id: ProtocolId;
  family: Family;
  button: string;
  dataset: string;
  transfer: string;
  system: string;
  metrics: MetricRecord[];
  excluded: string;
}
interface BenchmarkState {
  family: Family;
  protocolId: ProtocolId;
  metricId: MetricId;
}

const PROTOCOLS: ProtocolRecord[] = [
  {
    id: 'cityscapes-zero', family: 'segmentation', button: 'Cityscapes 零样本', dataset: 'Cityscapes val', transfer: '零样本迁移', system: 'Vision Banana 单模型', excluded: 'SegMan-L 84.2：非零样本/闭集设置，只能另列。',
    metrics: [{ id: 'miou', label: 'mIoU ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana',value:69.9,method:true},{name:'SAM 3',value:65.2}], feedback: 'Cityscapes val、零样本迁移、mIoU 越高越好：Vision Banana 69.9，SAM 3 为 65.2，高 4.7 点。SegMan-L 的 84.2 属于非零样本/闭集设置，只能另列。' }],
  },
  {
    id: 'saco-zero-combined', family: 'segmentation', button: 'SA-Co/Gold 零样本组合', dataset: 'SA-Co/Gold', transfer: '零样本组合流水线', system: 'Vision Banana + Gemini 3.1 Flash-Lite', excluded: 'SA-Co 训练：SAM 3 为 54.1；SAM 3 + 微调 Llama 为 61.2。',
    metrics: [{ id: 'cgf1', label: 'cgF1 ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana + Gemini',value:47.5,method:true,auxiliary:true},{name:'OWLv2',value:24.6}], feedback: 'SA-Co/Gold、零样本组合流水线、cgF1 越高越好：Vision Banana + Gemini 3.1 Flash-Lite 为 47.5，OWLv2 为 24.6。Gemini 负责负查询过滤；在 SA-Co 上训练的 SAM 3 为 54.1，SAM 3 + 微调 Llama 为 61.2，协议不同且数值更高。', supplement: '同一组合还报告 IL_MCC 0.84 与 pmF1 56.0；它们不是 cgF1 的同尺度条，分别作为文本记录。' }],
  },
  {
    id: 'refcocog-zero', family: 'segmentation', button: 'RefCOCOg 零样本', dataset: 'RefCOCOg UMD val', transfer: '零样本迁移', system: 'Vision Banana；对照含 Gemini', excluded: '使用 RefCOCOg 训练的 X-SAM 83.8 不进入该赛道。',
    metrics: [{ id: 'ciou', label: 'cIoU ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana',value:73.8,method:true},{name:'SAM 3 + Gemini',value:73.4,auxiliary:true}], feedback: 'RefCOCOg UMD val、零样本迁移、cIoU 越高越好：Vision Banana 73.8，SAM 3 + Gemini 2.5 Pro 为 73.4。使用 RefCOCOg 训练的 X-SAM 83.8 不进入该赛道。' }],
  },
  {
    id: 'reasonseg-zero-singleturn', family: 'segmentation', button: 'ReasonSeg 单轮组合', dataset: 'ReasonSeg val', transfer: '零样本、单轮组合', system: 'Vision Banana + Gemini 2.5 Pro', excluded: '79.3 是组合流水线结果，不归因于 Vision Banana 单体。',
    metrics: [{ id: 'giou', label: 'gIoU ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana + Gemini',value:79.3,method:true,auxiliary:true},{name:'SAM 3 + Gemini',value:77.0,auxiliary:true}], feedback: 'ReasonSeg val、单轮组合流水线、gIoU 越高越好：Vision Banana + Gemini 2.5 Pro 为 79.3，SAM 3 + Gemini 2.5 Pro 为 77.0。Gemini 先把推理查询改写成描述性指代，两个模型各调用一次。' }],
  },
  {
    id: 'depth-six', family: 'geometry', button: '深度六数据集', dataset: '六个深度基准完整平均', transfer: '零样本迁移', system: 'Vision Banana；预测不使用相机内参', excluded: 'Depth Anything V3 仅报告匹配四数据集，0.918 不进入六数据集轴。',
    metrics: [
      { id: 'delta1', label: 'δ1 ↑', direction: 'higher', domain: [0,1], values: [{name:'Vision Banana',value:.882,method:true},{name:'UniK3D',value:.823}], feedback: '六个深度基准的完整平均：Vision Banana δ1=0.882，UniK3D 为 0.823，越高越好。Depth Anything V3 的 0.918 只覆盖四个匹配数据集，不能放入这条六数据集轴。' },
      { id: 'absrel', label: 'AbsRel ↓', direction: 'lower', domain: [0,.25], values: [{name:'Vision Banana',value:.116,method:true},{name:'MoGe-2',value:.144}], feedback: '同一六数据集完整平均：Vision Banana AbsRel=0.116，MoGe-2 为 0.144，越低越好，约降低 20%。δ1 与 AbsRel 方向和尺度不同，因此使用独立坐标轴。' },
    ],
  },
  {
    id: 'depth-four-matched', family: 'geometry', button: '深度匹配四数据集', dataset: 'NYU、ETH3D、DIODE、KITTI', transfer: '匹配四数据集零样本平均', system: 'Vision Banana 对 Depth Anything V3', excluded: '0.929 不能被称为六数据集平均。',
    metrics: [{ id: 'delta1', label: 'δ1 ↑', direction: 'higher', domain: [0,1], values: [{name:'Vision Banana',value:.929,method:true},{name:'Depth Anything V3',value:.918}], feedback: '只在 NYU、ETH3D、DIODE、KITTI 四个共同数据集上：Vision Banana 平均 δ1=0.929，Depth Anything V3 为 0.918。0.929 不能被称为六数据集平均。' }],
  },
  {
    id: 'normal-four-matched', family: 'geometry', button: '法线四集复算', dataset: 'NYUv2、DIODE-indoor、ScanNet、VKitti', transfer: '按表 7 四数据集 mean 算术平均', system: 'Vision Banana 对 Lotus-2', excluded: 'Lotus-2 使用 VKitti 训练；18.928°/19.642° 是由表内四项复算，不是论文另报指标。',
    metrics: [{ id: 'mean-angle', label: 'mean ↓', direction: 'lower', domain: [0,35], values: [{name:'Vision Banana',value:18.928,method:true},{name:'Lotus-2',value:19.642}], feedback: '按表 7 的 NYUv2、DIODE-indoor、ScanNet、VKitti 四项 mean 角误差做算术平均：Vision Banana 为 18.928°，Lotus-2 为 19.642°，越低越好。这是同范围复算；同时必须注明 Lotus-2 使用了 VKitti 训练。' }],
  },
  {
    id: 'normal-indoor', family: 'geometry', button: '室内法线', dataset: 'NYUv2、DIODE-indoor、ScanNet', transfer: '室内三数据集聚合', system: 'Vision Banana', excluded: 'VKitti 属于独立室外协议，不进入本轴。',
    metrics: [
      { id: 'mean-angle', label: 'mean ↓', direction: 'lower', domain: [0,35], values: [{name:'Vision Banana',value:15.549,method:true}], feedback: 'NYUv2、DIODE-indoor、ScanNet 室内平均角误差：Vision Banana mean=15.549°，为表中最低；越低越好。' },
      { id: 'median-angle', label: 'median ↓', direction: 'lower', domain: [0,35], values: [{name:'Vision Banana',value:9.300,method:true}], feedback: '同一室内三数据集聚合：Vision Banana median=9.300°，为表中最低；mean 与 median 分开绘制。' },
    ],
  },
  {
    id: 'normal-vkitti', family: 'geometry', button: 'VKitti 法线', dataset: 'VKitti 室外', transfer: 'Vision Banana 零样本；Lotus-2 域内训练', system: '不同训练背景，单独解释', excluded: 'Vision Banana 在 VKitti 上可比但不是最佳。',
    metrics: [
      { id: 'mean-angle', label: 'mean ↓', direction: 'lower', domain: [0,35], values: [{name:'Vision Banana',value:29.063,method:true},{name:'Lotus-2',value:28.894}], feedback: 'VKitti 室外：Vision Banana mean=29.063°，Lotus-2 为 28.894°；越低越好，所以 Vision Banana 不是最佳。' },
      { id: 'median-angle', label: 'median ↓', direction: 'lower', domain: [0,35], values: [{name:'Vision Banana',value:10.699,method:true},{name:'Lotus-2',value:9.677}], feedback: 'VKitti 室外：Vision Banana median=10.699°，Lotus-2 为 9.677°；越低越好。Lotus-2 在该数据集上训练，而 Vision Banana 为零样本迁移，协议背景需同时显示。' },
    ],
  },
  {
    id: 'genai-pairwise', family: 'generation', button: 'GenAI-Bench', dataset: 'GenAI-Bench 文生图', transfer: '相对 Nano Banana Pro 成对人评', system: 'Vision Banana 对基础模型', excluded: '53.5% 接近 50% 平手线，结论是大致持平。',
    metrics: [{ id: 'win-rate', label: '胜率 ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana',value:53.5,method:true},{name:'Nano Banana Pro',value:46.5}], feedback: 'GenAI-Bench 文生图对 Nano Banana Pro 的成对人评：Vision Banana 胜率 53.5%，基座侧 46.5%；接近 50% 平手线，证据支持大致持平。' }],
  },
  {
    id: 'imgedit-pairwise', family: 'generation', button: 'ImgEdit', dataset: 'ImgEdit 图像编辑', transfer: '相对 Nano Banana Pro 成对人评', system: 'Vision Banana 对基础模型', excluded: '47.8% 低于 50%，不应表述为全面提升。',
    metrics: [{ id: 'win-rate', label: '胜率 ↑', direction: 'higher', domain: [0,100], values: [{name:'Vision Banana',value:47.8,method:true},{name:'Nano Banana Pro',value:52.2}], feedback: 'ImgEdit 图像编辑对 Nano Banana Pro 的成对人评：Vision Banana 胜率 47.8%，基座侧 52.2%；接近 50% 平手线，不应表述为全面提升。' }],
  },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
function label(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = '#21324a', size = 11, align: CanvasTextAlign = 'left') { ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI", sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y); }
function seal(ctx: CanvasRenderingContext2D, x: number, y: number) { ctx.strokeStyle='#228d5c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.stroke();label(ctx,'✓',x,y+5,'#228d5c',16,'center'); }

const BenchmarkAnalogy: React.FC<{chapterId:string;moduleId:string}> = ({chapterId,moduleId}) => {
  const ref=useRef<HTMLCanvasElement>(null); const raf=useRef<number|null>(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,AW,AH);const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;let origin=0;
    const draw=(seconds:number)=>{const p=reduced?3.0:seconds%3.6;ctx.clearRect(0,0,AW,AH);ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,AW,AH);
      [[14,'同协议'],[128,'不同协议']].forEach(([rawX,txt])=>{const x=Number(rawX);ctx.fillStyle='#fff';ctx.strokeStyle=txt==='同协议'?'#b8c9a7':'#d7deea';ctx.lineWidth=2;roundRect(ctx,x,28,102,72,8);ctx.fill();ctx.stroke();label(ctx,String(txt),x+51,48,'#21324a',10,'center');ctx.strokeStyle='#76906a';ctx.beginPath();ctx.moveTo(x+15,78);ctx.lineTo(x+85,60);ctx.stroke();});
      const t=p<1.4?clamp(p/1.4,0,1):clamp((p-1.4)/1.2,0,1);const mx=p<1.4?36+50*t:86+92*t;const my=65+7*Math.sin(t*Math.PI);ctx.strokeStyle='#27446e';ctx.lineWidth=4;ctx.beginPath();ctx.arc(mx,my,14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(mx+10,my+10);ctx.lineTo(mx+25,my+25);ctx.stroke();
      if(p>=2.6){seal(ctx,102,22);ctx.strokeStyle='#c43f52';ctx.lineWidth=2;ctx.setLineDash([5,4]);roundRect(ctx,126,26,106,76,9);ctx.stroke();ctx.setLineDash([]);}label(ctx,'同协议',14,118,'#228d5c',11);label(ctx,'另列说明',230,118,'#c43f52',11,'right');canvas.classList.add('is-ready');};
    const tick=(now:number)=>{if(!origin)origin=now;draw((now-origin)/1000);raf.current=requestAnimationFrame(tick);};const stop=()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;};const start=()=>{if(reduced)draw(3);else if(raf.current===null)raf.current=requestAnimationFrame(tick);};draw(reduced?3:0);const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};
  },[]);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} aria-label="放大镜核对两张地图，只给同协议比较盖章" style={{width:'100%',maxWidth:AW,height:'auto'}}/>;
};

export const BenchmarkRace: React.FC<WidgetProps> = ({chapterId,moduleId}) => {
  if(moduleId === 'ana' || moduleId.toLowerCase().includes('analogy')) return <BenchmarkAnalogy chapterId={chapterId} moduleId={moduleId}/>;
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [state,setState]=useState<BenchmarkState>(()=>({family:'segmentation',protocolId:'cityscapes-zero',metricId:'miou'}));
  const protocol=useMemo(()=>PROTOCOLS.find((p)=>p.id===state.protocolId)??PROTOCOLS[0],[state.protocolId]);
  const metric=useMemo(()=>protocol.metrics.find((m)=>m.id===state.metricId)??protocol.metrics[0],[protocol,state.metricId]);
  const available=PROTOCOLS.filter((p)=>p.family===state.family);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=setupCanvas(canvas,W,H);
    const draw=()=>{ctx.clearRect(0,0,W,H);ctx.fillStyle='#f5f8f0';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.strokeStyle='#b8c9a7';ctx.lineWidth=2;roundRect(ctx,14,34,366,180,10);ctx.fill();ctx.stroke();roundRect(ctx,396,34,150,136,10);ctx.fill();ctx.stroke();
      label(ctx,`${protocol.dataset} · ${metric.label}`,20,24,'#27446e',12);label(ctx,metric.direction==='higher'?'越高越好 →':'← 越短越好',374,24,'#d97706',10,'right');
      const x0=116,x1=360,axisY=190;ctx.strokeStyle='#68778f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,axisY);ctx.lineTo(x1,axisY);ctx.stroke();
      for(let i=0;i<=4;i+=1){const x=x0+(x1-x0)*i/4;ctx.strokeStyle='#d7deea';ctx.beginPath();ctx.moveTo(x,55);ctx.lineTo(x,axisY);ctx.stroke();const v=metric.domain[0]+(metric.domain[1]-metric.domain[0])*i/4;label(ctx,metric.domain[1]<=1?v.toFixed(2):v.toFixed(0),x,207,'#68778f',9,'center');}
      if(metric.id==='win-rate'){const x=x0+(x1-x0)*.5;ctx.strokeStyle='#d97706';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,axisY);ctx.stroke();ctx.setLineDash([]);label(ctx,'50% 平手',x,48,'#d97706',9,'center');}
      metric.values.forEach((v,i)=>{const y=76+i*54;const frac=clamp((v.value-metric.domain[0])/(metric.domain[1]-metric.domain[0]),0,1);const width=(x1-x0)*frac;label(ctx,v.name,108,y+15,v.auxiliary?'#7c3aed':'#21324a',9,'right');ctx.fillStyle=v.method?'#228d5c':v.auxiliary?'#7c3aed':'#27446e';roundRect(ctx,x0,y,width,22,6);ctx.fill();label(ctx,String(v.value),Math.min(x0+width+7,365),y+16,'#21324a',10);if(v.auxiliary){label(ctx,'链',x0+8,y+16,'#fff',9,'center');}});
      label(ctx,'证据账本',471,55,'#27446e',11,'center');const rows=[`数据集：${protocol.dataset}`,`迁移设置：${protocol.transfer}`,`系统组成：${protocol.system}`,`指标方向：${metric.direction==='higher'?'越高越好':'越低越好'}`];rows.forEach((r,i)=>label(ctx,r.length>22?r.slice(0,22)+'…':r,407,78+i*21,'#21324a',9));
      ctx.fillStyle='#fff7f7';ctx.strokeStyle='#c43f52';ctx.setLineDash([5,4]);roundRect(ctx,396,178,150,52,8);ctx.fill();ctx.stroke();ctx.setLineDash([]);label(ctx,'另列记录',407,194,'#c43f52',10);const ex=protocol.excluded.length>19?protocol.excluded.slice(0,19)+'…':protocol.excluded;label(ctx,ex,407,216,'#68778f',9);canvas.classList.add('is-ready');};
    draw();const disconnect=observeCanvas(canvas,draw,()=>{});return disconnect;
  },[protocol,metric]);

  const selectFamily=(family:Family)=>{const first=PROTOCOLS.find(p=>p.family===family)!;setState(s=>({...s,family,protocolId:first.id,metricId:first.metrics[0].id}));};
  const selectProtocol=(id:ProtocolId)=>{const next=PROTOCOLS.find(p=>p.id===id)!;setState({family:next.family,protocolId:id,metricId:next.metrics[0].id});};
  return <div>
    <div className="benchmark-highlights" role="group" aria-label="选择三条代表性实验结论">
      <button type="button" aria-pressed={state.protocolId==='cityscapes-zero'} onClick={()=>selectProtocol('cityscapes-zero')}><span>代表证据 1 · 2D 语义</span><strong>69.9 vs 65.2</strong><small>Cityscapes 零样本 mIoU</small></button>
      <button type="button" aria-pressed={state.protocolId==='depth-four-matched'} onClick={()=>selectProtocol('depth-four-matched')}><span>代表证据 2 · 3D 深度</span><strong>0.929 vs 0.918</strong><small>四个匹配数据集 δ1</small></button>
      <button type="button" aria-pressed={state.protocolId==='genai-pairwise'||state.protocolId==='imgedit-pairwise'} onClick={()=>selectProtocol('genai-pairwise')}><span>代表证据 3 · 生成保留</span><strong>53.5% / 47.8%</strong><small>两项人评围绕 50% 平手线</small></button>
    </div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`${protocol.dataset}，${metric.label}，${metric.direction==='higher'?'越高越好':'越低越好'}`} style={{width:'100%',maxWidth:W,height:'auto'}}/>
    <div className="feedback" role="status" aria-live="polite">{metric.feedback}</div>
    {metric.supplement&&<div className="feedback">{metric.supplement}</div>}
    <details className="paper-technical-details">
      <summary>完整证据账本：展开全部 2D、3D 与生成评测</summary>
      <div className="paper-technical-details-body">
        <div className="paper-choice-group" role="tablist" aria-label="选择证据族">
          <button type="button" role="tab" aria-selected={state.family==='segmentation'} onClick={()=>selectFamily('segmentation')}>2D 分割</button>
          <button type="button" role="tab" aria-selected={state.family==='geometry'} onClick={()=>selectFamily('geometry')}>3D 几何</button>
          <button type="button" role="tab" aria-selected={state.family==='generation'} onClick={()=>selectFamily('generation')}>生成保留</button>
        </div>
        <div className="paper-choice-group" role="radiogroup" aria-label="选择评测协议">{available.map(p=><button type="button" key={p.id} aria-pressed={state.protocolId===p.id} onClick={()=>selectProtocol(p.id)}>{p.button}</button>)}</div>
        {protocol.metrics.length>1&&<div className="paper-choice-group" aria-label="选择当前协议指标">{protocol.metrics.map(m=><button type="button" key={m.id} aria-pressed={state.metricId===m.id} onClick={()=>setState(s=>({...s,metricId:m.id}))}>{m.label}</button>)}</div>}
        <div className="paper-table-scroll wide" role="region" aria-label="当前评测协议记录表，可横向滚动" tabIndex={0}>
          <table className="paper">
            <caption>{protocol.button}：协议内记录与另列边界</caption>
            <thead><tr><th>数据集/子集</th><th>迁移设置</th><th>系统组成</th><th>指标</th><th>方向</th><th>Vision Banana</th><th>有效对照</th><th>另列记录</th></tr></thead>
            <tbody><tr><td>{protocol.dataset}</td><td>{protocol.transfer}</td><td>{protocol.system}</td><td>{metric.label}</td><td>{metric.direction==='higher'?'越高越好':'越低越好'}</td><td>{metric.values.find(v=>v.method)?.value}</td><td>{metric.values.filter(v=>!v.method).map(v=>`${v.name} ${v.value}`).join('；')||'当前协议无完整对照条'}</td><td>{protocol.excluded}</td></tr></tbody>
          </table>
        </div>
        <p className="note">这里不把 mIoU、cgF1、cIoU、gIoU、δ1、AbsRel、角误差和人评胜率压进同一尺度。每次只显示一个协议内的指标轴，并把不同训练背景、数据集范围或系统组成的结果放入“另列记录”。</p>
      </div>
    </details>
  </div>;
};

export default BenchmarkRace;
