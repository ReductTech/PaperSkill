import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { OfficialGif, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',floor:'#dce8d2',line:'#d7deea',ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',brown:'#92400e',white:'#fff'};
function CanvasView({width=560,height=250,animate=false,draw}:{width?:number;height?:number;animate?:boolean;draw:(ctx:CanvasRenderingContext2D,time:number)=>void}){const ref=useRef<HTMLCanvasElement>(null);const drawRef=useRef(draw);drawRef.current=draw;useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,width,height)}catch{return}let raf:number|null=null;const paint=(time:number)=>{drawRef.current(ctx,time);canvas.classList.add('is-ready');if(animate)raf=requestAnimationFrame(paint)};const start=()=>{if(raf===null)raf=requestAnimationFrame(paint)};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()}},[width,height,animate,draw]);return <canvas ref={ref} width={width} height={height}/>}
function clear(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=C.floor;ctx.fillRect(0,h*.72,w,h*.28);ctx.strokeStyle='#b8c9a7';ctx.lineWidth=1;for(let x=20;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,h*.72);ctx.lineTo(x-20,h);ctx.stroke()}}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=14,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px Segoe UI, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left'}
function camera(ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue,s=.8){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=color;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-25,-14,50,28,6);ctx.fill();ctx.stroke();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(4,0,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(4,0,4,0,Math.PI*2);ctx.fill();ctx.restore()}
function route(ctx:CanvasRenderingContext2D,pts:Array<[number,number]>,color=C.blue,width=4,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([])}
function bars(ctx:CanvasRenderingContext2D,items:Array<{name:string;value:number;display:string;color:string}>,x:number,y:number,maxW=190){const max=Math.max(...items.map(v=>v.value));const step=items.length>2?20:31;items.forEach((it,i)=>{label(ctx,it.name,x,y+i*step,C.muted,12);ctx.fillStyle=C.line;ctx.fillRect(x+88,y-12+i*step,maxW,14);ctx.fillStyle=it.color;ctx.fillRect(x+88,y-12+i*step,maxW*it.value/max,14);label(ctx,it.display,x+94+maxW,y+i*step,C.ink,12)})}

const stages=[{t:'领域适配',sub:'关键帧潜空间 + 相机适配器',color:C.blue,fb:'领域适配：关键帧潜空间与相机适配器建立精确控制。'},{t:'中段训练',sub:'GGM + SSM++',color:C.purple,fb:'中段训练：GGM 与 SSM++ 让多轨迹保持一致。'},{t:'后蒸馏',sub:'DMD 四步 DiT',color:C.green,fb:'后蒸馏：DMD 将生成器压缩为四步 DiT。'}];
export const HyTrainingStages:React.FC<WidgetProps>=()=>{const[stage,setStage]=useState(0);return <div><CanvasView draw={(ctx)=>{clear(ctx,560,250);stages.forEach((s,i)=>{const x=65+i*180;ctx.fillStyle=i===stage?s.color:C.white;ctx.strokeStyle=i===stage?s.color:C.line;ctx.lineWidth=i===stage?4:2;ctx.beginPath();ctx.roundRect(x,70,130,70,8);ctx.fill();ctx.stroke();label(ctx,s.t,x+65,95,i===stage?C.white:C.ink,14,'center');label(ctx,s.sub,x+65,119,i===stage?C.white:C.muted,11,'center');if(i<2)route(ctx,[[x+130,105],[x+180,105]],i<stage?C.green:C.line,4)});camera(ctx,80+stage*180,185,stages[stage].color,.72);label(ctx,stage===2?'4 steps':'能力逐段加入',280,225,stage===2?C.green:C.blue,13,'center')}}/><div className="step-ctrl"><button className="tiny ghost" onClick={()=>setStage(Math.max(0,stage-1))} disabled={stage===0}>上一步</button><span className="step-label"><b>{stage+1}</b> / 3</span><button className="tiny" onClick={()=>setStage(Math.min(2,stage+1))} disabled={stage===2}>下一步</button><button className="tiny ghost" onClick={()=>setStage(0)}>重置</button></div><div className={`feedback ${stage===2?'good':''}`}>{stages[stage].fb}</div></div>};

const res=[{name:'低 L',px:'189×259',old:80.55,now:83.43},{name:'中 M',px:'378×518',old:86.13,now:86.48},{name:'高 H',px:'756×1036',old:66.29,now:86.89}];
export const HyResolution:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(1);const d=res[idx];return <div><CanvasView draw={(ctx)=>{clear(ctx,560,250);label(ctx,`推理分辨率 ${d.px}`,40,32,C.orange,14);ctx.strokeStyle=C.line;ctx.strokeRect(40,58,215,120);ctx.strokeRect(305,58,215,120);label(ctx,'标准 RoPE 整数索引',148,52,C.red,13,'center');label(ctx,'归一化 RoPE [-1,1]',412,52,C.green,13,'center');const n=[5,8,12][idx];for(let i=0;i<n;i++){const x=55+i*180/(n-1);ctx.strokeStyle=i>7?C.red:C.blue;ctx.beginPath();ctx.moveTo(x,72);ctx.lineTo(x,164);ctx.stroke();const x2=320+i*185/(n-1);ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(x2,72);ctx.lineTo(x2,164);ctx.stroke()}bars(ctx,[{name:'WM 1.0 AUC',value:d.old,display:d.old.toFixed(2),color:idx===2?C.red:C.blue},{name:'WM 2.0 AUC',value:d.now,display:d.now.toFixed(2),color:C.green}],75,213,230)}}/><div className="ctrl"><label>分辨率档位 <span className="val">{d.name}</span></label><input type="range" min={0} max={2} step={1} value={idx} onChange={e=>setIdx(Number(e.target.value))}/></div><div className={`feedback ${idx===2?'good':''}`}>{idx===2?'高分辨率下，WorldMirror 1.0 的 AUC@30 从中档 86.13 降到 66.29；2.0 保持 86.89。':'归一化坐标让不同分辨率在同一范围内重新采样。'} 结论仅覆盖论文测试的 L/M/H 分辨率。</div></div>};

const nodes=[{n:'图像',d:'多视图 RGB 是基础输入。'},{n:'可选先验',d:'相机姿态、内参和深度可独立提供；训练时每种先验以 0.5 概率丢弃。'},{n:'Token 合并',d:'图像 token 与几何先验 token 被合并到统一序列。'},{n:'Transformer',d:'共享骨干使用全局-局部注意力聚合跨视图信息。'},{n:'任务头',d:'点图、相机、深度、法线和 3DGS 使用各自 DPT 解码头。'},{n:'输出',d:'一次前馈同时给出多类三维几何与渲染属性。'}];
export const HyArchitecture:React.FC<WidgetProps>=()=>{const[active,setActive]=useState(0);return <div><CanvasView width={600} height={270} draw={(ctx)=>{clear(ctx,600,270);nodes.forEach((node,i)=>{const x=25+i*94;const on=i<=active;ctx.fillStyle=i===active?C.orange:on?'#e8f0fa':C.white;ctx.strokeStyle=i===active?C.orange:on?C.blue:C.line;ctx.lineWidth=i===active?4:2;ctx.beginPath();ctx.roundRect(x,80,76,66,7);ctx.fill();ctx.stroke();label(ctx,node.n,x+38,118,i===active?C.white:on?C.blue:C.muted,12,'center');if(i<5)route(ctx,[[x+76,113],[x+94,113]],i<active?C.green:C.line,4)});const outs=['点图','深度','法线','相机','3DGS'];outs.forEach((o,i)=>{ctx.fillStyle=active===5?C.green:C.line;ctx.fillRect(350+i*43,185,34,28);label(ctx,o,367+i*43,229,active===5?C.green:C.muted,10,'center')});label(ctx,'Any-Modal Tokenization → 共享骨干 → 专用输出头',300,34,C.blue,15,'center')}}/><div className="chip-row">{nodes.map((x,i)=><button key={x.n} className={`chip ${active===i?'selected':''}`} onClick={()=>setActive(i)}>{x.n}</button>)}</div><div className={`feedback ${active===5?'good':''}`}>{nodes[active].d}</div></div>};

type GaussianConfig = {
  id:'baseline'|'voxel'|'densify'|'mask'|'final';
  code:string;
  name:string;
  count:number;
  psnr:number;
  ssim:number;
  lpips:number;
  color:string;
  recipe:string;
  reading:string;
  pareto:boolean;
};

const gaussianConfigs:GaussianConfig[]=[
  {id:'baseline',code:'B',name:'6M 基线',count:6,psnr:25.176,ssim:.751,lpips:.209,color:C.blue,recipe:'原始扩展点云采样；不做体素降采样、增密或概率掩码。',reading:'画质最高，但高斯数量和渲染负担最大。',pareto:true},
  {id:'voxel',code:'V',name:'仅体素降采样',count:1,psnr:24.504,ssim:.720,lpips:.276,color:C.red,recipe:'统一体素降采样。',reading:'数量最低，但均匀删除会严重伤害高频细节。',pareto:true},
  {id:'densify',code:'D',name:'+ 自适应增密',count:5.254,psnr:25.158,ssim:.750,lpips:.210,color:C.orange,recipe:'体素降采样 + 标准自适应增密。',reading:'画质几乎恢复到基线，但数量又回升到 5.254M。',pareto:true},
  {id:'mask',code:'M',name:'+ MaskGaussian',count:1.383,psnr:25.017,ssim:.747,lpips:.216,color:C.purple,recipe:'体素降采样 + 自适应增密 + MaskGaussian。',reading:'概率掩码删除低频冗余；按表 9 的数量与 PSNR，它被完整配置轻微支配。',pareto:false},
  {id:'final',code:'F',name:'完整配置',count:1.381,psnr:25.023,ssim:.747,lpips:.215,color:C.green,recipe:'体素降采样 + 仅非天空区域自适应增密 + MaskGaussian。',reading:'在抑制天空漂浮物的同时，相对基线减少约 77% 高斯。',pareto:true},
];

const budgetPresets=[
  {name:'轻量交付',count:1.5,psnr:25},
  {name:'画质审查',count:6,psnr:25.15},
  {name:'极限压缩',count:1.1,psnr:24.5},
];

export const HyComposition:React.FC<WidgetProps>=()=>{
  const[maxCount,setMaxCount]=useState(1.5);
  const[minPsnr,setMinPsnr]=useState(25);
  const[inspectedId,setInspectedId]=useState<GaussianConfig['id']>('final');
  const feasible=gaussianConfigs.filter((item)=>item.count<=maxCount+1e-6&&item.psnr>=minPsnr-1e-6);
  const recommendation=[...feasible].sort((a,b)=>a.count-b.count||b.psnr-a.psnr)[0];
  const inspected=gaussianConfigs.find((item)=>item.id===inspectedId)??gaussianConfigs[4];
  const feasibleIds=new Set(feasible.map((item)=>item.id));
  const selectedIsFeasible=feasibleIds.has(inspected.id);

  return <div className="gaussian-lab">
    <CanvasView width={620} height={360} draw={(ctx)=>{
      clear(ctx,620,360);
      const left=78,top=48,width=478,height=242;
      const xFor=(count:number)=>left+(count-1)/5*width;
      const yFor=(psnr:number)=>top+(25.2-psnr)/.75*height;
      const budgetX=xFor(clamp(maxCount,1,6));
      const floorY=yFor(clamp(minPsnr,24.45,25.2));

      ctx.fillStyle='rgba(34,141,92,.10)';ctx.fillRect(left,top,Math.max(0,budgetX-left),Math.max(0,floorY-top));
      ctx.strokeStyle=C.line;ctx.lineWidth=1;
      for(let tick=0;tick<=5;tick++){const x=left+tick*width/5;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+height);ctx.stroke();label(ctx,String(tick+1),x,top+height+22,C.muted,9,'center');}
      for(let tick=0;tick<=3;tick++){const value=24.5+tick*.2;const y=yFor(value);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+width,y);ctx.stroke();label(ctx,value.toFixed(1),left-10,y+3,C.muted,9,'right');}

      ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(budgetX,top);ctx.lineTo(budgetX,top+height);ctx.stroke();ctx.beginPath();ctx.moveTo(left,floorY);ctx.lineTo(left+width,floorY);ctx.stroke();ctx.setLineDash([]);
      label(ctx,`预算 ≤ ${maxCount.toFixed(1)}M`,budgetX+6,top+14,C.orange,10);
      label(ctx,`PSNR ≥ ${minPsnr.toFixed(2)}`,left+width-4,floorY-7,C.orange,10,'right');

      const pareto=gaussianConfigs.filter((item)=>item.pareto).sort((a,b)=>a.count-b.count);
      route(ctx,pareto.map((item)=>[xFor(item.count),yFor(item.psnr)] as [number,number]),C.green,2,[4,4]);
      label(ctx,'表 9 数字形成的教学帕累托前沿',left+width-8,top+height-10,C.green,10,'right');

      gaussianConfigs.forEach((item)=>{
        const x=xFor(item.count),y=yFor(item.psnr);
        const isFeasible=feasibleIds.has(item.id);
        const isRecommended=recommendation?.id===item.id;
        ctx.globalAlpha=isFeasible?1:.42;
        ctx.fillStyle=item.color;ctx.strokeStyle=isRecommended?C.green:C.white;ctx.lineWidth=isRecommended?7:3;
        ctx.beginPath();ctx.arc(x,y,isRecommended?10:8,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(item.id===inspected.id){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.stroke();}
        label(ctx,item.code,x+12,item.id==='final'?y+18:y-9,item.color,10);
        ctx.globalAlpha=1;
      });

      label(ctx,'高斯数量（M，越低越轻）',left+width/2,338,C.ink,11,'center');
      ctx.save();ctx.translate(20,top+height/2);ctx.rotate(-Math.PI/2);label(ctx,'PSNR（越高越好）',0,0,C.ink,11,'center');ctx.restore();
      label(ctx,recommendation?`推荐：${recommendation.code} ${recommendation.name}`:'当前约束无可行配置',590,324,recommendation?C.green:C.red,11,'right');
    }}/>

    <div className="gaussian-presets" role="group" aria-label="快速设置资源约束">
      <span>教学情境</span>
      {budgetPresets.map((preset)=><button key={preset.name} type="button" className={Math.abs(maxCount-preset.count)<.01&&Math.abs(minPsnr-preset.psnr)<.001?'selected':''} onClick={()=>{setMaxCount(preset.count);setMinPsnr(preset.psnr)}}>{preset.name}</button>)}
      <small>情境阈值是教程任务，不是论文部署标准</small>
    </div>

    <div className="gaussian-threshold-grid">
      <label><span>最大高斯预算</span><strong>{maxCount.toFixed(1)}M</strong><div className="gaussian-stepper"><button type="button" aria-label="降低最大高斯预算" onClick={()=>setMaxCount((value)=>Math.max(1,Number((value-.1).toFixed(1))))} disabled={maxCount<=1}>−</button><input aria-label="最大高斯预算" type="range" min={1} max={6} step={.1} value={maxCount} onChange={(event)=>setMaxCount(Number(event.target.value))}/><button type="button" aria-label="提高最大高斯预算" onClick={()=>setMaxCount((value)=>Math.min(6,Number((value+.1).toFixed(1))))} disabled={maxCount>=6}>+</button></div><small>拖动或用 ±0.1M 步进；越小表示希望资产更轻。</small></label>
      <label><span>最低画质门槛</span><strong>PSNR {minPsnr.toFixed(2)}</strong><div className="gaussian-stepper"><button type="button" aria-label="降低最低 PSNR 门槛" onClick={()=>setMinPsnr((value)=>Math.max(24.5,Number((value-.05).toFixed(2))))} disabled={minPsnr<=24.5}>−</button><input aria-label="最低 PSNR 门槛" type="range" min={24.5} max={25.18} step={.01} value={minPsnr} onChange={(event)=>setMinPsnr(Number(event.target.value))}/><button type="button" aria-label="提高最低 PSNR 门槛" onClick={()=>setMinPsnr((value)=>Math.min(25.18,Number((value+.05).toFixed(2))))} disabled={minPsnr>=25.18}>+</button></div><small>拖动或用 ±0.05 步进；越大表示更不愿牺牲画质。</small></label>
    </div>

    <div className="gaussian-diagnostics">
      <div className={feasible.length?'ready':'waiting'}><span>可行配置</span><strong>{feasible.length} / 5</strong></div>
      <div className={recommendation?'ready':'waiting'}><span>最低数量推荐</span><strong>{recommendation?`${recommendation.code} · ${recommendation.count.toFixed(3)}M`:'无'}</strong></div>
      <div className={selectedIsFeasible?'ready':'partial'}><span>当前检查点</span><strong>{inspected.code} · {selectedIsFeasible?'满足约束':'约束外'}</strong></div>
    </div>

    <div className={`feedback ${recommendation?'good':'bad'}`}>{recommendation?`在当前约束下，${recommendation.name}以 ${recommendation.count.toFixed(3)}M 高斯满足 PSNR ${recommendation.psnr.toFixed(3)}。推荐规则只选择“可行点中高斯数量最少者”，不是论文给出的自动部署策略。`:'表 9 的五个已报告配置都无法同时满足这两个阈值；请提高数量预算或降低画质门槛。'}</div>

    <section className="gaussian-config-inspector">
      <header><span>论文配置坐标</span><strong>点击一个点检查完整消融读数</strong><small>绿色边框表示满足当前阈值；灰色不代表论文配置无效</small></header>
      <div className="gaussian-config-list" role="group" aria-label="选择论文表 9 配置">
        {gaussianConfigs.map((item)=><button key={item.id} type="button" className={`${inspected.id===item.id?'selected':''} ${feasibleIds.has(item.id)?'feasible':'outside'} ${item.pareto?'':'dominated'}`} aria-pressed={inspected.id===item.id} onClick={()=>setInspectedId(item.id)}>
          <i style={{background:item.color}}>{item.code}</i><span><strong>{item.name}</strong><small>{item.count.toFixed(3)}M · PSNR {item.psnr.toFixed(3)}</small></span>{!item.pareto?<em>被 F 轻微支配</em>:null}
        </button>)}
      </div>
      <div className="gaussian-config-detail">
        <div><span>组件组合</span><strong>{inspected.recipe}</strong><p>{inspected.reading}</p></div>
        <div><span>完整指标</span><strong>{inspected.count.toFixed(3)}M · PSNR {inspected.psnr.toFixed(3)}</strong><p>SSIM {inspected.ssim.toFixed(3)} · LPIPS {inspected.lpips.toFixed(3)}；PSNR / SSIM 越高越好，LPIPS 越低越好。</p></div>
      </div>
    </section>

    <section className="gaussian-paper-comparison">
      <header><span>论文结论锚点</span><strong>完整配置不是“无损压缩”</strong></header>
      <div><span>高斯数量</span><strong>6.000M → 1.381M</strong><small>减少约 77%</small></div>
      <div><span>PSNR</span><strong>25.176 → 25.023</strong><small>下降 0.153 dB</small></div>
      <div><span>LPIPS</span><strong>0.209 → 0.215</strong><small>增加 0.006</small></div>
      <p>完整配置在表 9 协议内取得紧凑表示与接近基线的视觉质量；这不代表所有场景、所有硬件或所有下游任务都保持同样取舍。</p>
    </section>

    <div className="gaussian-glossary-grid">
      <details><summary>为什么只做体素降采样会糊？</summary><p>统一体素会在天空和纹理丰富区域使用相同删点规则。论文指出，高频纹理本来就需要更密的高斯覆盖，因此均匀删点会优先伤害细节。</p></details>
      <details><summary>自适应增密为何又产生漂浮物？</summary><p>标准策略按视图空间位置梯度克隆和分裂高斯，能补回细节；但天空缺少可靠深度监督，增密容易在那里生成漂浮伪影。</p></details>
      <details><summary>MaskGaussian 如何删冗余？</summary><p>它用 Gumbel-Softmax 学习每个高斯的存在掩码，并以稀疏损失鼓励低激活高斯被永久剪枝，不是一次性的硬阈值删除。</p></details>
    </div>

    <PaperTable tableId="table-9" />
    <div className="official-gif-grid"><OfficialGif src="/images/official-mesh.gif" title="轻量 Mesh 漫游" caption="官方演示展示从生成结果得到的可漫游完整三维资产，帮助理解网格为何需要兼顾碰撞代理与快速加载。" alt="HY-World 2.0 官方轻量网格漫游演示" /></div>
  </div>;
};

const resultSets=[{n:'I2P CLIP-I',unit:'',direction:'越高越好',a:'HY-World 1.0',av:.831,b:'HY-Pano 2.0',bv:.844,normA:.831/.844,normB:1,detail:'表 4，图像到全景。'},{n:'7-Scenes 高分辨率 Acc.',unit:'',direction:'越低越好',a:'WorldMirror 1.0',av:.079,b:'WorldMirror 2.0',bv:.037,normA:.037/.079,normB:1,detail:'表 11，点图误差。'},{n:'3DGS 高斯数量',unit:'M',direction:'越低越好',a:'基线',av:6,b:'完整配置',bv:1.381,normA:1.381/6,normB:1,detail:'表 9；PSNR 25.176→25.023。'},{n:'128 视图耗时',unit:'s',direction:'越低越好',a:'FP32 单卡',av:18,b:'SP+BF16+FSDP 四卡',bv:5.60,normA:5.6/18,normB:1,detail:'表 14，518×378，NVIDIA H20。'}];
export const HyResults:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const[run,setRun]=useState(0);const start=useRef(0);const d=resultSets[idx];const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={260} animate={run>0} draw={(ctx,time)=>{clear(ctx,560,260);const p=run?easeInOutQuad(clamp((time-start.current)/1600,0,1)):0;label(ctx,d.n,280,30,C.ink,15,'center');label(ctx,d.direction,280,52,C.orange,12,'center');const baseX=75,max=390;ctx.strokeStyle=C.line;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(baseX,105);ctx.lineTo(baseX+max,105);ctx.moveTo(baseX,180);ctx.lineTo(baseX+max,180);ctx.stroke();const xa=baseX+max*d.normA*p,xb=baseX+max*d.normB*p;ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(xa,105,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(xb,180,13,0,Math.PI*2);ctx.fill();label(ctx,`${d.a}: ${d.av}${d.unit}`,75,86,C.red,12);label(ctx,`${d.b}: ${d.bv}${d.unit}`,75,161,C.green,12);if(p>.98)label(ctx,'协议内领先',485,208,C.green,13,'right')}}/><div className="chip-row">{resultSets.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>{setIdx(i);setRun(0)}}>{x.n}</button>)}</div><div className="step-ctrl"><button className="tiny" onClick={go}>开始比较</button></div><div className={`feedback ${run?'good':''}`}>{d.direction}。{d.detail} 完整世界生成总耗时为 712 秒；Marble 只提供定性比较。</div></div>};

export default HyResults;
