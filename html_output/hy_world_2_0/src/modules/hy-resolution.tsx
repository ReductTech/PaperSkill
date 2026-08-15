import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { PaperTable } from './hy-paper-evidence';
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

const res=[
  {name:'低 L',px:'189×259',old:80.55,now:83.43,density:6,summary:'训练分辨率附近，两代模型都能维持较稳定的相机估计。'},
  {name:'中 M',px:'378×518',old:86.13,now:86.48,density:9,summary:'中档是旧模型表现最好的对照点，两代结果接近。'},
  {name:'高 H',px:'756×1036',old:66.29,now:86.89,density:13,summary:'进入训练外高分辨率后，旧模型明显退化，归一化位置编码仍保持稳定。'},
];
const probes=[
  {name:'靠近起点',ratio:.08},
  {name:'网格中心',ratio:.5},
  {name:'靠近终点',ratio:.92},
];

export const HyResolution:React.FC<WidgetProps>=()=>{
  const[idx,setIdx]=useState(1);
  const[probeIdx,setProbeIdx]=useState(1);
  const d=res[idx];
  const probe=probes[probeIdx];
  const sampleIndex=Math.round(probe.ratio*(d.density-1));
  const normalized=(2*sampleIndex+1)/d.density-1;
  const gain=d.now-d.old;

  return <div className="resolution-lab">
    <div className="resolution-levels" role="group" aria-label="选择论文评测分辨率档位">
      {res.map((item,i)=><button key={item.name} type="button" className={idx===i?'selected':''} aria-pressed={idx===i} onClick={()=>setIdx(i)}><strong>{item.name}</strong><span>{item.px}</span></button>)}
    </div>
    <CanvasView width={600} height={286} draw={(ctx)=>{
      clear(ctx,600,286);
      label(ctx,`当前档位：${d.name} · ${d.px}`,300,28,C.ink,15,'center');
      const panels=[{x:34,title:'标准 RoPE：索引范围随网格扩张',color:C.red},{x:326,title:'归一化 RoPE：始终落在 [-1, 1]',color:C.green}];
      panels.forEach((panel,panelIdx)=>{
        ctx.fillStyle=C.white;
        ctx.strokeStyle=panel.color;
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.roundRect(panel.x,54,240,142,7);
        ctx.fill();
        ctx.stroke();
        label(ctx,panel.title,panel.x+120,45,panel.color,12,'center');
        const innerX=panel.x+20;
        const innerW=200;
        for(let i=0;i<d.density;i++){
          const x=innerX+i*innerW/(d.density-1);
          const active=i===sampleIndex;
          ctx.strokeStyle=active?C.orange:C.line;
          ctx.lineWidth=active?4:1;
          ctx.beginPath();
          ctx.moveTo(x,73);
          ctx.lineTo(x,166);
          ctx.stroke();
          if(active){
            ctx.fillStyle=C.orange;
            ctx.beginPath();
            ctx.arc(x,119,7,0,Math.PI*2);
            ctx.fill();
          }
        }
        if(panelIdx===0){
          label(ctx,`示意索引 i = ${sampleIndex}`,panel.x+120,185,C.red,12,'center');
        }else{
          label(ctx,`x̂ᵢ ≈ ${normalized.toFixed(2)}`,panel.x+120,185,C.green,12,'center');
        }
      });
      label(ctx,'橙色探针跟随同一相对位置；线数仅示意采样变密，不代表真实 patch 数量。',300,220,C.muted,11,'center');
      ctx.fillStyle=C.line;
      ctx.fillRect(92,247,170,12);
      ctx.fillRect(338,247,170,12);
      ctx.fillStyle=idx===2?C.red:C.blue;
      ctx.fillRect(92,247,170*d.old/90,12);
      ctx.fillStyle=C.green;
      ctx.fillRect(338,247,170*d.now/90,12);
      label(ctx,`WM 1.0 AUC@30 ${d.old.toFixed(2)}`,92,278,idx===2?C.red:C.blue,12);
      label(ctx,`WM 2.0 AUC@30 ${d.now.toFixed(2)}`,338,278,C.green,12);
    }}/>
    <div className="resolution-probes" role="group" aria-label="选择网格观察位置">
      <span>把探针放到：</span>
      {probes.map((item,i)=><button key={item.name} type="button" className={probeIdx===i?'selected':''} aria-pressed={probeIdx===i} onClick={()=>setProbeIdx(i)}>{item.name}</button>)}
    </div>
    <div className="resolution-readout" aria-live="polite">
      <div><span>标准索引</span><strong>0 … Hₚ-1</strong><small>网格变大时出现训练外位置</small></div>
      <div><span>归一化坐标</span><strong>{normalized.toFixed(2)}</strong><small>同一相对位置仍在 [-1,1] 内</small></div>
      <div><span>AUC@30 差值</span><strong>{gain>=0?'+':''}{gain.toFixed(2)}</strong><small>WorldMirror 2.0 - 1.0</small></div>
    </div>
    <div className="resolution-protocol-note"><strong>两个低档尺寸不要混用：</strong><span>上方相机姿态 AUC 对应论文正文与表 12 的 L=189×259；表 11 点图重建单独注明 L=182×252。M=378×518、H=756×1036 在两处一致。</span></div>
    <div className={`feedback ${idx===2?'good':''}`}>{d.summary} 当前探针位于“{probe.name}”，它展示的是公式如何把网格相对位置映射到固定区间。下方表 12 核查相机 / 深度 / NVS，表 11 核查点图误差与几何先验条件。</div>
    <div className="resolution-table-guide"><strong>先看表 12：位置编码与跨分辨率结果</strong><span>灰色提示：点击展开完整相机姿态、深度与新视角合成结果；“-”只表示对应子表未报告。</span></div>
    <PaperTable tableId="table-12" />
    <div className="resolution-table-guide"><strong>再看表 11：点图重建与先验端点</strong><span>灰色提示：点击展开 7-Scenes 点图子表；注意它的低分辨率尺寸与表 12 不同。</span></div>
    <PaperTable tableId="table-11" />
  </div>;
};

const nodes=[{n:'图像',d:'多视图 RGB 是基础输入。'},{n:'可选先验',d:'相机姿态、内参和深度可独立提供；训练时每种先验以 0.5 概率丢弃。'},{n:'Token 合并',d:'图像 token 与几何先验 token 被合并到统一序列。'},{n:'Transformer',d:'共享骨干使用全局-局部注意力聚合跨视图信息。'},{n:'任务头',d:'点图、相机、深度、法线和 3DGS 使用各自 DPT 解码头。'},{n:'输出',d:'一次前馈同时给出多类三维几何与渲染属性。'}];
export const HyArchitecture:React.FC<WidgetProps>=()=>{const[active,setActive]=useState(0);return <div><CanvasView width={600} height={270} draw={(ctx)=>{clear(ctx,600,270);nodes.forEach((node,i)=>{const x=25+i*94;const on=i<=active;ctx.fillStyle=i===active?C.orange:on?'#e8f0fa':C.white;ctx.strokeStyle=i===active?C.orange:on?C.blue:C.line;ctx.lineWidth=i===active?4:2;ctx.beginPath();ctx.roundRect(x,80,76,66,7);ctx.fill();ctx.stroke();label(ctx,node.n,x+38,118,i===active?C.white:on?C.blue:C.muted,12,'center');if(i<5)route(ctx,[[x+76,113],[x+94,113]],i<active?C.green:C.line,4)});const outs=['点图','深度','法线','相机','3DGS'];outs.forEach((o,i)=>{ctx.fillStyle=active===5?C.green:C.line;ctx.fillRect(350+i*43,185,34,28);label(ctx,o,367+i*43,229,active===5?C.green:C.muted,10,'center')});label(ctx,'Any-Modal Tokenization → 共享骨干 → 专用输出头',300,34,C.blue,15,'center')}}/><div className="chip-row">{nodes.map((x,i)=><button key={x.n} className={`chip ${active===i?'selected':''}`} onClick={()=>setActive(i)}>{x.n}</button>)}</div><div className={`feedback ${active===5?'good':''}`}>{nodes[active].d}</div></div>};

const gs=[{n:'基线',count:6,psnr:25.176,lpips:.209,color:C.blue,fb:'6.000M 高斯画质最高，但渲染负担大。'},{n:'仅体素降采样',count:1,psnr:24.504,lpips:.276,color:C.red,fb:'均匀降采样把数量降到 1.000M，却明显损伤高频细节。'},{n:'+ 自适应增密',count:5.254,psnr:25.158,lpips:.210,color:C.orange,fb:'增密恢复画质，但数量回升到 5.254M。'},{n:'+ MaskGaussian',count:1.383,psnr:25.017,lpips:.216,color:C.purple,fb:'概率掩码删除低频冗余，高斯数量显著下降。'},{n:'完整配置',count:1.381,psnr:25.023,lpips:.215,color:C.green,fb:'非天空增密 + MaskGaussian 在该消融中减少约 77% 高斯数量。'}];
export const HyComposition:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const d=gs[idx];return <div><CanvasView height={270} draw={(ctx)=>{clear(ctx,560,270);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(45,88);ctx.lineTo(240,70);ctx.stroke();ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(45,135);ctx.lineTo(240,135);ctx.stroke();label(ctx,'深度对齐',142,165,C.green,13,'center');const dots=Math.round(20+d.count*5);for(let i=0;i<dots;i++){const x=310+(i*37)%210;const y=48+((i*53)%116);ctx.fillStyle=i%7===0&&idx<4?C.red:d.color;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;bars(ctx,[{name:'高斯数(M)',value:d.count,display:d.count.toFixed(3),color:d.color},{name:'PSNR',value:d.psnr/5,display:d.psnr.toFixed(3),color:C.green},{name:'LPIPS×20',value:d.lpips*20,display:d.lpips.toFixed(3),color:C.orange}],60,214,165)}}/><div className="chip-row">{gs.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>setIdx(i)}>{x.n}</button>)}</div><div className={`feedback ${idx===1?'bad':idx===4?'good':''}`}>{d.fb} 稀疏引导或困难轨迹仍可能产生错误对齐系数。</div></div>};

const resultSets=[{n:'I2P CLIP-I',unit:'',direction:'越高越好',a:'HY-World 1.0',av:.831,b:'HY-Pano 2.0',bv:.844,normA:.831/.844,normB:1,detail:'表 4，图像到全景。'},{n:'7-Scenes 高分辨率 Acc.',unit:'',direction:'越低越好',a:'WorldMirror 1.0',av:.079,b:'WorldMirror 2.0',bv:.037,normA:.037/.079,normB:1,detail:'表 11，点图误差。'},{n:'3DGS 高斯数量',unit:'M',direction:'越低越好',a:'基线',av:6,b:'完整配置',bv:1.381,normA:1.381/6,normB:1,detail:'表 9；PSNR 25.176→25.023。'},{n:'128 视图耗时',unit:'s',direction:'越低越好',a:'FP32 单卡',av:18,b:'SP+BF16+FSDP 四卡',bv:5.60,normA:5.6/18,normB:1,detail:'表 14，518×378，NVIDIA H20。'}];
export const HyResults:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const[run,setRun]=useState(0);const start=useRef(0);const d=resultSets[idx];const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={260} animate={run>0} draw={(ctx,time)=>{clear(ctx,560,260);const p=run?easeInOutQuad(clamp((time-start.current)/1600,0,1)):0;label(ctx,d.n,280,30,C.ink,15,'center');label(ctx,d.direction,280,52,C.orange,12,'center');const baseX=75,max=390;ctx.strokeStyle=C.line;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(baseX,105);ctx.lineTo(baseX+max,105);ctx.moveTo(baseX,180);ctx.lineTo(baseX+max,180);ctx.stroke();const xa=baseX+max*d.normA*p,xb=baseX+max*d.normB*p;ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(xa,105,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(xb,180,13,0,Math.PI*2);ctx.fill();label(ctx,`${d.a}: ${d.av}${d.unit}`,75,86,C.red,12);label(ctx,`${d.b}: ${d.bv}${d.unit}`,75,161,C.green,12);if(p>.98)label(ctx,'协议内领先',485,208,C.green,13,'right')}}/><div className="chip-row">{resultSets.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>{setIdx(i);setRun(0)}}>{x.n}</button>)}</div><div className="step-ctrl"><button className="tiny" onClick={go}>开始比较</button></div><div className={`feedback ${run?'good':''}`}>{d.direction}。{d.detail} 完整世界生成总耗时为 712 秒；Marble 只提供定性比较。</div></div>};

export default HyResults;
