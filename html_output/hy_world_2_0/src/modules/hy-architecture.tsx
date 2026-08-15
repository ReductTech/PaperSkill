import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { OfficialGif } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',floor:'#dce8d2',line:'#d7deea',ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',brown:'#92400e',white:'#fff'};
function CanvasView({width=560,height=250,animate=false,draw}:{width?:number;height?:number;animate?:boolean;draw:(ctx:CanvasRenderingContext2D,time:number)=>void}){const ref=useRef<HTMLCanvasElement>(null);const drawRef=useRef(draw);drawRef.current=draw;useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,width,height)}catch{return}let raf:number|null=null;const paint=(time:number)=>{drawRef.current(ctx,time);canvas.classList.add('is-ready');if(animate)raf=requestAnimationFrame(paint)};const start=()=>{if(raf===null)raf=requestAnimationFrame(paint)};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()}},[width,height,animate,draw]);return <canvas ref={ref} width={width} height={height}/>}
function clear(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=C.floor;ctx.fillRect(0,h*.72,w,h*.28);ctx.strokeStyle='#b8c9a7';ctx.lineWidth=1;for(let x=20;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,h*.72);ctx.lineTo(x-20,h);ctx.stroke()}}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=14,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px Segoe UI, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left'}
function camera(ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue,s=.8){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=color;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-25,-14,50,28,6);ctx.fill();ctx.stroke();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(4,0,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(4,0,4,0,Math.PI*2);ctx.fill();ctx.restore()}
function route(ctx:CanvasRenderingContext2D,pts:Array<[number,number]>,color=C.blue,width=4,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([])}
function bars(ctx:CanvasRenderingContext2D,items:Array<{name:string;value:number;display:string;color:string}>,x:number,y:number,maxW=190){const max=Math.max(...items.map(v=>v.value));items.forEach((it,i)=>{label(ctx,it.name,x,y+i*31,C.muted,12);ctx.fillStyle=C.line;ctx.fillRect(x+88,y-12+i*31,maxW,14);ctx.fillStyle=it.color;ctx.fillRect(x+88,y-12+i*31,maxW*it.value/max,14);label(ctx,it.display,x+94+maxW,y+i*31,C.ink,12)})}

const stages=[{t:'领域适配',sub:'关键帧潜空间 + 相机适配器',color:C.blue,fb:'领域适配：关键帧潜空间与相机适配器建立精确控制。'},{t:'中段训练',sub:'GGM + SSM++',color:C.purple,fb:'中段训练：GGM 与 SSM++ 让多轨迹保持一致。'},{t:'后蒸馏',sub:'DMD 四步 DiT',color:C.green,fb:'后蒸馏：DMD 将生成器压缩为四步 DiT。'}];
export const HyTrainingStages:React.FC<WidgetProps>=()=>{const[stage,setStage]=useState(0);return <div><CanvasView draw={(ctx)=>{clear(ctx,560,250);stages.forEach((s,i)=>{const x=65+i*180;ctx.fillStyle=i===stage?s.color:C.white;ctx.strokeStyle=i===stage?s.color:C.line;ctx.lineWidth=i===stage?4:2;ctx.beginPath();ctx.roundRect(x,70,130,70,8);ctx.fill();ctx.stroke();label(ctx,s.t,x+65,95,i===stage?C.white:C.ink,14,'center');label(ctx,s.sub,x+65,119,i===stage?C.white:C.muted,11,'center');if(i<2)route(ctx,[[x+130,105],[x+180,105]],i<stage?C.green:C.line,4)});camera(ctx,80+stage*180,185,stages[stage].color,.72);label(ctx,stage===2?'4 steps':'能力逐段加入',280,225,stage===2?C.green:C.blue,13,'center')}}/><div className="step-ctrl"><button className="tiny ghost" onClick={()=>setStage(Math.max(0,stage-1))} disabled={stage===0}>上一步</button><span className="step-label"><b>{stage+1}</b> / 3</span><button className="tiny" onClick={()=>setStage(Math.min(2,stage+1))} disabled={stage===2}>下一步</button><button className="tiny ghost" onClick={()=>setStage(0)}>重置</button></div><div className={`feedback ${stage===2?'good':''}`}>{stages[stage].fb}</div></div>};

const res=[{name:'低 L',px:'189×259',old:80.55,now:83.43},{name:'中 M',px:'378×518',old:86.13,now:86.48},{name:'高 H',px:'756×1036',old:66.29,now:86.89}];
export const HyResolution:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(1);const d=res[idx];return <div><CanvasView draw={(ctx)=>{clear(ctx,560,250);label(ctx,`推理分辨率 ${d.px}`,40,32,C.orange,14);ctx.strokeStyle=C.line;ctx.strokeRect(40,58,215,120);ctx.strokeRect(305,58,215,120);label(ctx,'标准 RoPE 整数索引',148,52,C.red,13,'center');label(ctx,'归一化 RoPE [-1,1]',412,52,C.green,13,'center');const n=[5,8,12][idx];for(let i=0;i<n;i++){const x=55+i*180/(n-1);ctx.strokeStyle=i>7?C.red:C.blue;ctx.beginPath();ctx.moveTo(x,72);ctx.lineTo(x,164);ctx.stroke();const x2=320+i*185/(n-1);ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(x2,72);ctx.lineTo(x2,164);ctx.stroke()}bars(ctx,[{name:'WM 1.0 AUC',value:d.old,display:d.old.toFixed(2),color:idx===2?C.red:C.blue},{name:'WM 2.0 AUC',value:d.now,display:d.now.toFixed(2),color:C.green}],75,213,230)}}/><div className="ctrl"><label>分辨率档位 <span className="val">{d.name}</span></label><input type="range" min={0} max={2} step={1} value={idx} onChange={e=>setIdx(Number(e.target.value))}/></div><div className={`feedback ${idx===2?'good':''}`}>{idx===2?'高分辨率下，WorldMirror 1.0 的 AUC@30 从中档 86.13 降到 66.29；2.0 保持 86.89。':'归一化坐标让不同分辨率在同一范围内重新采样。'} 结论仅覆盖论文测试的 L/M/H 分辨率。</div></div>};

type PriorId = 'pose' | 'intrinsics' | 'depth';
type OutputId = 'pointmap' | 'camera' | 'depth' | 'normal' | 'gaussian';

const priorSpecs: Array<{id:PriorId;name:string;short:string;role:string;color:string}> = [
  {id:'pose',name:'相机位姿',short:'Pose',role:'提供跨视图的全局空间布局线索。',color:C.purple},
  {id:'intrinsics',name:'相机内参',short:'K',role:'帮助解析焦距、主点与尺度歧义。',color:C.orange},
  {id:'depth',name:'多视图深度',short:'D',role:'提供逐像素几何约束，但仍需处理无效区域。',color:C.green},
];

const outputSpecs: Array<{id:OutputId;name:string;short:string;role:string;upgrade:string}> = [
  {id:'pointmap',name:'点图 / 稠密点云',short:'Pts3D',role:'为每个像素预测三维位置，承担后续点云融合与世界合成的几何骨架。',upgrade:'2.0 在高分辨率下使用归一化位置编码，避免位置外推导致结构崩塌。'},
  {id:'camera',name:'相机参数',short:'Camera',role:'从共享特征回归相机参数；输入位姿是可选条件，不是启用该输出头的开关。',upgrade:'Any-Modal 允许有位姿先验时利用它、没有时仍执行相机估计。'},
  {id:'depth',name:'深度 + 有效掩码',short:'Depth',role:'预测多视图深度，并用独立有效掩码头过滤天空、极端深度与断裂区域。',upgrade:'2.0 新增 depth-to-normal 监督与深度有效掩码头。'},
  {id:'normal',name:'表面法线',short:'Normal',role:'预测局部表面朝向，并通过 depth-to-normal 损失反向约束深度几何。',upgrade:'2.0 使用 normal-only 伪标签增强真实数据监督，避免逐视图伪深度的层叠误差。'},
  {id:'gaussian',name:'像素级 3DGS 属性',short:'3DGS',role:'从共享几何特征解码可渲染的高斯属性，连接重建与最终世界表示。',upgrade:'两阶段课程先联合训练几何头，再冻结几何参数、单独训练 3DGS 头。'},
];

export const HyArchitecture:React.FC<WidgetProps>=()=>{
  const[activePriors,setActivePriors]=useState<PriorId[]>([]);
  const[focusedOutput,setFocusedOutput]=useState<OutputId>('pointmap');
  const focused = outputSpecs.find((item)=>item.id===focusedOutput) ?? outputSpecs[0];
  const allPriors = activePriors.length===priorSpecs.length;
  const noPriors = activePriors.length===0;
  const togglePrior=(id:PriorId)=>setActivePriors((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id]);
  const priorSummary=noPriors?'仅图像':allPriors?'图像 + 全部先验':`图像 + ${activePriors.map((id)=>priorSpecs.find((item)=>item.id===id)?.name).filter(Boolean).join(' + ')}`;

  return <div className="architecture-lab">
    <CanvasView width={620} height={340} draw={(ctx)=>{
      clear(ctx,620,340);
      label(ctx,'Any-Modal Tokenization',28,30,C.blue,14);
      label(ctx,'一次前馈，五个输出头同时工作',592,30,C.green,12,'right');

      for(let i=0;i<3;i++){
        const y=68+i*38;
        ctx.fillStyle='#e8f0fa';ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.fillRect(32,y,70,27);ctx.strokeRect(32,y,70,27);
        label(ctx,`图像 V${i+1}`,67,y+18,C.blue,10,'center');
        route(ctx,[[102,y+13],[196,126]],C.blue,2);
      }

      priorSpecs.forEach((prior,index)=>{
        const y=205+index*34;
        const on=activePriors.includes(prior.id);
        ctx.fillStyle=on?prior.color:C.white;ctx.strokeStyle=on?prior.color:C.line;ctx.lineWidth=on?3:2;
        ctx.fillRect(32,y,70,25);ctx.strokeRect(32,y,70,25);
        label(ctx,prior.short,67,y+17,on?C.white:C.muted,10,'center');
        route(ctx,[[102,y+12],[196,154]],on?prior.color:C.line,on?3:2,on?[]:[5,4]);
      });

      ctx.fillStyle='#fff';ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(196,98,92,84,6);ctx.fill();ctx.stroke();
      label(ctx,'Token',242,130,C.orange,13,'center');label(ctx,'合并',242,151,C.orange,13,'center');
      route(ctx,[[288,140],[326,140]],C.green,4);

      ctx.fillStyle='#e8f0fa';ctx.strokeStyle=C.blue;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(326,88,118,104,6);ctx.fill();ctx.stroke();
      label(ctx,'共享 Transformer',385,132,C.blue,13,'center');label(ctx,'global-local attention',385,154,C.muted,9,'center');

      outputSpecs.forEach((output,index)=>{
        const y=52+index*52;
        const focusedNow=output.id===focusedOutput;
        route(ctx,[[444,140],[472,y+16]],focusedNow?C.orange:C.green,focusedNow?4:2);
        ctx.fillStyle=focusedNow?C.orange:'#ecf8f1';ctx.strokeStyle=focusedNow?C.orange:C.green;ctx.lineWidth=focusedNow?4:2;
        ctx.fillRect(472,y,116,32);ctx.strokeRect(472,y,116,32);
        label(ctx,output.short,530,y+21,focusedNow?C.white:C.green,10,'center');
      });
      label(ctx,`${activePriors.length} / 3 可选先验已接入`,190,317,allPriors?C.green:C.orange,11,'center');
      label(ctx,`正在检查：${focused.short}`,590,317,C.orange,11,'right');
    }}/>

    <div className="architecture-input-grid">
      <section className="architecture-required-input">
        <header><span>必需输入</span><strong>多视图 RGB 图像</strong></header>
        <div className="architecture-view-stack"><i>V1</i><i>V2</i><i>V3+</i></div>
        <p>WorldMirror 2.0 是多视图 / 视频重建模型；位姿、内参和深度只是可选先验，不能替代图像输入。</p>
      </section>
      <section className="architecture-prior-control">
        <header><span>可选输入</span><strong>接入几何先验</strong><small>{activePriors.length} / 3 已选择</small></header>
        <div className="architecture-prior-list">
          {priorSpecs.map((prior)=><label key={prior.id} className={activePriors.includes(prior.id)?'selected':''}>
            <input type="checkbox" checked={activePriors.includes(prior.id)} onChange={()=>togglePrior(prior.id)}/>
            <span style={{'--prior-color':prior.color} as React.CSSProperties}>{prior.short}</span>
            <b>{prior.name}</b>
            <small>{prior.role}</small>
          </label>)}
        </div>
      </section>
    </div>

    <section className="architecture-output-inspector">
      <header><span>输出头检查器</span><strong>五类结果会在一次前馈中同时预测</strong><small>点击只切换讲解焦点，不会关闭其它输出头</small></header>
      <div className="architecture-output-tabs" role="tablist" aria-label="检查 WorldMirror 输出头">
        {outputSpecs.map((output)=><button key={output.id} type="button" role="tab" aria-selected={focusedOutput===output.id} className={focusedOutput===output.id?'selected':''} onClick={()=>setFocusedOutput(output.id)}><i aria-hidden="true"/><span>{output.short}</span><small>{output.name}</small></button>)}
      </div>
      <div className="architecture-output-detail">
        <div><span>当前职责</span><strong>{focused.name}</strong><p>{focused.role}</p></div>
        <div><span>2.0 相关改进</span><strong>{focused.upgrade}</strong><p>这些改进的有效范围分别由第 6 章方法说明和第 8.2 节任务评测限定。</p></div>
      </div>
    </section>

    <div className="architecture-diagnostics">
      <div className="ready"><span>基础输入</span><strong>多视图图像已接入</strong></div>
      <div className={allPriors?'ready':activePriors.length?'partial':'waiting'}><span>先验状态</span><strong>{priorSummary}</strong></div>
      <div className="ready"><span>共享预测</span><strong>5 个 DPT 头在线</strong></div>
    </div>

    <div className={`feedback ${allPriors?'good':''}`}>{allPriors?'全部先验已接入。它们通过统一 token 序列协同提供全局布局、相机标定与像素几何约束，但不是每个任务都必须具备全部先验。':noPriors?'无几何先验仍是合法输入：训练时每种先验以 0.5 概率独立丢弃，使模型能在推理时灵活接受不同组合。':'当前部分先验组合合法；Any-Modal 的重点是按现有观测条件接入信息，而不是强制凑齐全部附件。'}</div>

    <section className="architecture-evidence-strip">
      <header><span>论文表 11 · 7-Scenes 高分辨率端点</span><strong>Acc. / Comp. 均值均为越低越好</strong></header>
      <div className="architecture-evidence-pair">
        <div className={noPriors?'active':''}><span>仅图像</span><strong>Acc. 均值 0.037 · Comp. 均值 0.040</strong><small>WorldMirror 2.0，H 分辨率</small></div>
        <i aria-hidden="true">→</i>
        <div className={allPriors?'active':''}><span>图像 + 全部先验</span><strong>Acc. 均值 0.012 · Comp. 均值 0.016</strong><small>位姿 + 内参 + 深度</small></div>
      </div>
      <p>{activePriors.length>0&&!allPriors?'当前部分先验组合在表 11 没有单独一行；Figure 27 另行比较各先验条件，不能把端点数字插值成中间结果。':'上方数字是论文表 11 的两个真实端点，不由配线盘计算。'}</p>
    </section>

    <div className="architecture-glossary-grid">
      <details><summary>Any-Modal 为什么不是“任意输入”？</summary><p>它指论文规定的四类模态被编码到统一 token 序列：图像必需，位姿、内参、深度可选。它不表示模型能接收未定义的传感器或任意数据格式。</p></details>
      <details><summary>DPT 输出头是什么？</summary><p>共享 Transformer 先提取跨视图特征，再由任务专用 DPT 解码头恢复像素级空间输出。共享骨干负责融合，专用头负责各自的预测格式。</p></details>
      <details><summary>为什么 3DGS 单独第二阶段训练？</summary><p>论文先联合训练点图、深度、相机和法线等几何头，再冻结几何参数，只训练 3DGS 头，以解耦几何学习与外观建模。</p></details>
    </div>

    <OfficialGif src="/images/official-reconstruction.gif" title="多图与视频重建演示" caption="官方仓库展示 WorldMirror 2.0 从多视图或视频输入恢复可浏览三维资产。该 GIF 用于理解产品流程，不替代论文表格中的定量评测。" alt="HY-World 2.0 官方多视图与视频重建演示" />
  </div>;
};

const gs=[{n:'基线',count:6,psnr:25.176,lpips:.209,color:C.blue,fb:'6.000M 高斯画质最高，但渲染负担大。'},{n:'仅体素降采样',count:1,psnr:24.504,lpips:.276,color:C.red,fb:'均匀降采样把数量降到 1.000M，却明显损伤高频细节。'},{n:'+ 自适应增密',count:5.254,psnr:25.158,lpips:.210,color:C.orange,fb:'增密恢复画质，但数量回升到 5.254M。'},{n:'+ MaskGaussian',count:1.383,psnr:25.017,lpips:.216,color:C.purple,fb:'概率掩码删除低频冗余，高斯数量显著下降。'},{n:'完整配置',count:1.381,psnr:25.023,lpips:.215,color:C.green,fb:'非天空增密 + MaskGaussian 在该消融中减少约 77% 高斯数量。'}];
export const HyComposition:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const d=gs[idx];return <div><CanvasView height={270} draw={(ctx)=>{clear(ctx,560,270);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(45,88);ctx.lineTo(240,70);ctx.stroke();ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(45,135);ctx.lineTo(240,135);ctx.stroke();label(ctx,'深度对齐',142,165,C.green,13,'center');const dots=Math.round(20+d.count*5);for(let i=0;i<dots;i++){const x=310+(i*37)%210;const y=48+((i*53)%116);ctx.fillStyle=i%7===0&&idx<4?C.red:d.color;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;bars(ctx,[{name:'高斯数(M)',value:d.count,display:d.count.toFixed(3),color:d.color},{name:'PSNR',value:d.psnr/5,display:d.psnr.toFixed(3),color:C.green},{name:'LPIPS×20',value:d.lpips*20,display:d.lpips.toFixed(3),color:C.orange}],60,214,165)}}/><div className="chip-row">{gs.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>setIdx(i)}>{x.n}</button>)}</div><div className={`feedback ${idx===1?'bad':idx===4?'good':''}`}>{d.fb} 稀疏引导或困难轨迹仍可能产生错误对齐系数。</div></div>};

const resultSets=[{n:'I2P CLIP-I',unit:'',direction:'越高越好',a:'HY-World 1.0',av:.831,b:'HY-Pano 2.0',bv:.844,normA:.831/.844,normB:1,detail:'表 4，图像到全景。'},{n:'7-Scenes 高分辨率 Acc.',unit:'',direction:'越低越好',a:'WorldMirror 1.0',av:.079,b:'WorldMirror 2.0',bv:.037,normA:.037/.079,normB:1,detail:'表 11，点图误差。'},{n:'3DGS 高斯数量',unit:'M',direction:'越低越好',a:'基线',av:6,b:'完整配置',bv:1.381,normA:1.381/6,normB:1,detail:'表 9；PSNR 25.176→25.023。'},{n:'128 视图耗时',unit:'s',direction:'越低越好',a:'FP32 单卡',av:18,b:'SP+BF16+FSDP 四卡',bv:5.60,normA:5.6/18,normB:1,detail:'表 14，518×378，NVIDIA H20。'}];
export const HyResults:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const[run,setRun]=useState(0);const start=useRef(0);const d=resultSets[idx];const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={260} animate={run>0} draw={(ctx,time)=>{clear(ctx,560,260);const p=run?easeInOutQuad(clamp((time-start.current)/1600,0,1)):0;label(ctx,d.n,280,30,C.ink,15,'center');label(ctx,d.direction,280,52,C.orange,12,'center');const baseX=75,max=390;ctx.strokeStyle=C.line;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(baseX,105);ctx.lineTo(baseX+max,105);ctx.moveTo(baseX,180);ctx.lineTo(baseX+max,180);ctx.stroke();const xa=baseX+max*d.normA*p,xb=baseX+max*d.normB*p;ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(xa,105,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(xb,180,13,0,Math.PI*2);ctx.fill();label(ctx,`${d.a}: ${d.av}${d.unit}`,75,86,C.red,12);label(ctx,`${d.b}: ${d.bv}${d.unit}`,75,161,C.green,12);if(p>.98)label(ctx,'协议内领先',485,208,C.green,13,'right')}}/><div className="chip-row">{resultSets.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>{setIdx(i);setRun(0)}}>{x.n}</button>)}</div><div className="step-ctrl"><button className="tiny" onClick={go}>开始比较</button></div><div className={`feedback ${run?'good':''}`}>{d.direction}。{d.detail} 完整世界生成总耗时为 712 秒；Marble 只提供定性比较。</div></div>};

export default HyResults;
