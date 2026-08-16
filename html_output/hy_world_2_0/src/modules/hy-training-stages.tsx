import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',floor:'#dce8d2',line:'#d7deea',ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',brown:'#92400e',white:'#fff'};
function CanvasView({width=560,height=250,animate=false,draw}:{width?:number;height?:number;animate?:boolean;draw:(ctx:CanvasRenderingContext2D,time:number)=>void}){const ref=useRef<HTMLCanvasElement>(null);const drawRef=useRef(draw);drawRef.current=draw;useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,width,height)}catch{return}let raf:number|null=null;const paint=(time:number)=>{drawRef.current(ctx,time);canvas.classList.add('is-ready');if(animate)raf=requestAnimationFrame(paint)};const start=()=>{if(raf===null)raf=requestAnimationFrame(paint)};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()}},[width,height,animate,draw]);return <canvas ref={ref} width={width} height={height}/>}
function clear(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=C.floor;ctx.fillRect(0,h*.72,w,h*.28);ctx.strokeStyle='#b8c9a7';ctx.lineWidth=1;for(let x=20;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,h*.72);ctx.lineTo(x-20,h);ctx.stroke()}}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=14,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px Segoe UI, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left'}
function camera(ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue,s=.8){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=color;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-25,-14,50,28,6);ctx.fill();ctx.stroke();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(4,0,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(4,0,4,0,Math.PI*2);ctx.fill();ctx.restore()}
function route(ctx:CanvasRenderingContext2D,pts:Array<[number,number]>,color=C.blue,width=4,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([])}
function bars(ctx:CanvasRenderingContext2D,items:Array<{name:string;value:number;display:string;color:string}>,x:number,y:number,maxW=190){const max=Math.max(...items.map(v=>v.value));items.forEach((it,i)=>{label(ctx,it.name,x,y+i*31,C.muted,12);ctx.fillStyle=C.line;ctx.fillRect(x+88,y-12+i*31,maxW,14);ctx.fillStyle=it.color;ctx.fillRect(x+88,y-12+i*31,maxW*it.value/max,14);label(ctx,it.display,x+94+maxW,y+i*31,C.ink,12)})}

const stages=[
  {
    t:'领域适配',
    short:'先学会听相机指令',
    sub:'关键帧潜空间 + 相机适配器',
    color:C.blue,
    prerequisite:'预训练视频扩散骨干',
    introduced:'关键帧 VAE 潜空间、相机条件适配器',
    ability:'受控相机轨迹生成',
    inherited:'通用视频生成先验',
    symptom:'解决“画面能生成，但镜头偏离指定轨迹”。',
    why:'先把表示空间和相机条件对齐，后续记忆模块才有稳定的受控轨迹可连接。',
  },
  {
    t:'中段记忆训练',
    short:'再让多条轨迹记住同一世界',
    sub:'GGM + SSM++',
    color:C.purple,
    prerequisite:'已经可控的关键帧轨迹',
    introduced:'全局几何记忆 GGM、选择性局部记忆 SSM++',
    ability:'跨轨迹结构与纹理一致性',
    inherited:'相机控制、关键帧生成能力',
    symptom:'解决“单条轨迹可用，但回到同一房间时外观和结构变化”。',
    why:'记忆训练建立在第一阶段的轨迹控制上；否则模型连参考帧与目标视角都难以稳定对应。',
  },
  {
    t:'后蒸馏',
    short:'最后把成熟生成器压到四步',
    sub:'DMD 四步 DiT',
    color:C.green,
    prerequisite:'已经具备控制与跨轨迹记忆的教师生成器',
    introduced:'冻结教师、少步学生、DMD 分布匹配目标',
    ability:'WorldStereo 2.0 四步采样',
    inherited:'相机控制、全局与局部记忆',
    symptom:'解决“质量和一致性已建立，但扩散采样步数仍然较多”。',
    why:'蒸馏负责压缩已学能力，而不是重新学习控制或记忆；过早蒸馏会把不完整教师的缺陷一起压缩。',
  },
];

export const HyTrainingStages:React.FC<WidgetProps>=()=>{
  const[active,setActive]=useState(0);
  const current=stages[active];
  const next=()=>setActive(value=>(value+1)%stages.length);

  return <div className="training-clinic">
    <div className="training-timeline-head">
      <div><span>三阶段训练能力时间轴</span><strong>沿课程顺序检查每一段新增了什么</strong></div>
      <div><b>0{active+1}/03</b><small>当前阶段</small></div>
      <button type="button" onClick={next}>下一阶段</button>
    </div>
    <div className="training-stage-tabs" role="tablist" aria-label="选择训练阶段">
      {stages.map((stage,i)=><button key={stage.t} type="button" role="tab" aria-selected={active===i} className={active===i?'selected':''} onClick={()=>setActive(i)}><span>阶段 0{i+1}</span><strong>{stage.t}</strong><small>{stage.short}</small></button>)}
    </div>
    <CanvasView width={600} height={278} draw={(ctx)=>{
      clear(ctx,600,278);
      label(ctx,'能力不是同时出现，而是从左到右累积',34,30,C.ink,15);
      label(ctx,`当前观察：${current.t}`,34,53,current.color,12);
      stages.forEach((stage,i)=>{
        const x=35+i*188;
        const selected=active===i;
        const available=i<=active;
        ctx.fillStyle=selected?stage.color:available?'#edf8f1':C.white;
        ctx.strokeStyle=selected?stage.color:available?C.green:C.line;
        ctx.lineWidth=selected?4:2;
        ctx.beginPath();
        ctx.roundRect(x,82,154,106,7);
        ctx.fill();
        ctx.stroke();
        label(ctx,`第 ${i+1} 段`,x+77,105,selected?C.white:stage.color,11,'center');
        label(ctx,stage.t,x+77,131,selected?C.white:C.ink,13,'center');
        label(ctx,stage.ability,x+77,157,selected?C.white:available?C.green:C.muted,11,'center');
        label(ctx,selected?'正在拆解':available?'已经继承':'等待前置',x+77,177,selected?C.white:available?C.green:C.muted,11,'center');
        if(i<2)route(ctx,[[x+154,135],[x+188,135]],i<active?C.green:C.line,4,i<active?[]:[5,5]);
      });
      const abilities=[{name:'相机控制',on:active>=0},{name:'跨轨迹一致',on:active>=1},{name:'四步生成器',on:active>=2}];
      abilities.forEach((ability,i)=>{
        const x=65+i*176;
        ctx.fillStyle=ability.on?C.green:C.line;
        ctx.fillRect(x,229,120,10);
        label(ctx,ability.name,x+60,261,ability.on?C.green:C.muted,11,'center');
      });
      label(ctx,`已累积 ${active+1}/3 组能力`,560,212,active===2?C.green:C.blue,12,'right');
    }}/>
    <section className="training-stage-detail" aria-live="polite">
      <header><span>{`阶段 0${active+1}`}</span><strong>{current.t}</strong><small>{current.sub}</small></header>
      <div className="training-detail-grid">
        <div><span>前置能力</span><p>{current.prerequisite}</p></div>
        <div><span>本段引入</span><p>{current.introduced}</p></div>
        <div><span>能力增量</span><p>{current.ability}</p></div>
        <div><span>继承能力</span><p>{current.inherited}</p></div>
      </div>
      <div className="training-order-note"><strong>为什么放在这里？</strong><p>{current.why}</p></div>
    </section>
    <div className="training-symptom-strip">
      <strong>它主要处理的症状</strong>
      <span>{current.symptom}</span>
    </div>
    <div className="feedback good">
      依次点击三个阶段，注意绿色能力条只会向右累积。四步采样是最后对 WorldStereo 2.0 生成器做的蒸馏结果，不代表完整世界生成管线只需四步。
    </div>
  </div>;
};

const res=[{name:'低 L',px:'189×259',old:80.55,now:83.43},{name:'中 M',px:'378×518',old:86.13,now:86.48},{name:'高 H',px:'756×1036',old:66.29,now:86.89}];
export const HyResolution:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(1);const d=res[idx];return <div><CanvasView draw={(ctx)=>{clear(ctx,560,250);label(ctx,`推理分辨率 ${d.px}`,40,32,C.orange,14);ctx.strokeStyle=C.line;ctx.strokeRect(40,58,215,120);ctx.strokeRect(305,58,215,120);label(ctx,'标准 RoPE 整数索引',148,52,C.red,13,'center');label(ctx,'归一化 RoPE [-1,1]',412,52,C.green,13,'center');const n=[5,8,12][idx];for(let i=0;i<n;i++){const x=55+i*180/(n-1);ctx.strokeStyle=i>7?C.red:C.blue;ctx.beginPath();ctx.moveTo(x,72);ctx.lineTo(x,164);ctx.stroke();const x2=320+i*185/(n-1);ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(x2,72);ctx.lineTo(x2,164);ctx.stroke()}bars(ctx,[{name:'WM 1.0 AUC',value:d.old,display:d.old.toFixed(2),color:idx===2?C.red:C.blue},{name:'WM 2.0 AUC',value:d.now,display:d.now.toFixed(2),color:C.green}],75,213,230)}}/><div className="ctrl"><label>分辨率档位 <span className="val">{d.name}</span></label><input type="range" min={0} max={2} step={1} value={idx} onChange={e=>setIdx(Number(e.target.value))}/></div><div className={`feedback ${idx===2?'good':''}`}>{idx===2?'高分辨率下，WorldMirror 1.0 的 AUC@30 从中档 86.13 降到 66.29；2.0 保持 86.89。':'归一化坐标让不同分辨率在同一范围内重新采样。'} 结论仅覆盖论文测试的 L/M/H 分辨率。</div></div>};

const nodes=[{n:'图像',d:'多视图 RGB 是基础输入。'},{n:'可选先验',d:'相机姿态、内参和深度可独立提供；训练时每种先验以 0.5 概率丢弃。'},{n:'Token 合并',d:'图像 token 与几何先验 token 被合并到统一序列。'},{n:'Transformer',d:'共享骨干使用全局-局部注意力聚合跨视图信息。'},{n:'任务头',d:'点图、相机、深度、法线和 3DGS 使用各自 DPT 解码头。'},{n:'输出',d:'一次前馈同时给出多类三维几何与渲染属性。'}];
export const HyArchitecture:React.FC<WidgetProps>=()=>{const[active,setActive]=useState(0);return <div><CanvasView width={600} height={270} draw={(ctx)=>{clear(ctx,600,270);nodes.forEach((node,i)=>{const x=25+i*94;const on=i<=active;ctx.fillStyle=i===active?C.orange:on?'#e8f0fa':C.white;ctx.strokeStyle=i===active?C.orange:on?C.blue:C.line;ctx.lineWidth=i===active?4:2;ctx.beginPath();ctx.roundRect(x,80,76,66,7);ctx.fill();ctx.stroke();label(ctx,node.n,x+38,118,i===active?C.white:on?C.blue:C.muted,12,'center');if(i<5)route(ctx,[[x+76,113],[x+94,113]],i<active?C.green:C.line,4)});const outs=['点图','深度','法线','相机','3DGS'];outs.forEach((o,i)=>{ctx.fillStyle=active===5?C.green:C.line;ctx.fillRect(350+i*43,185,34,28);label(ctx,o,367+i*43,229,active===5?C.green:C.muted,10,'center')});label(ctx,'Any-Modal Tokenization → 共享骨干 → 专用输出头',300,34,C.blue,15,'center')}}/><div className="chip-row">{nodes.map((x,i)=><button key={x.n} className={`chip ${active===i?'selected':''}`} onClick={()=>setActive(i)}>{x.n}</button>)}</div><div className={`feedback ${active===5?'good':''}`}>{nodes[active].d}</div></div>};

const gs=[{n:'基线',count:6,psnr:25.176,lpips:.209,color:C.blue,fb:'6.000M 高斯画质最高，但渲染负担大。'},{n:'仅体素降采样',count:1,psnr:24.504,lpips:.276,color:C.red,fb:'均匀降采样把数量降到 1.000M，却明显损伤高频细节。'},{n:'+ 自适应增密',count:5.254,psnr:25.158,lpips:.210,color:C.orange,fb:'增密恢复画质，但数量回升到 5.254M。'},{n:'+ MaskGaussian',count:1.383,psnr:25.017,lpips:.216,color:C.purple,fb:'概率掩码删除低频冗余，高斯数量显著下降。'},{n:'完整配置',count:1.381,psnr:25.023,lpips:.215,color:C.green,fb:'非天空增密 + MaskGaussian 在该消融中减少约 77% 高斯数量。'}];
export const HyComposition:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const d=gs[idx];return <div><CanvasView height={270} draw={(ctx)=>{clear(ctx,560,270);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(45,88);ctx.lineTo(240,70);ctx.stroke();ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(45,135);ctx.lineTo(240,135);ctx.stroke();label(ctx,'深度对齐',142,165,C.green,13,'center');const dots=Math.round(20+d.count*5);for(let i=0;i<dots;i++){const x=310+(i*37)%210;const y=48+((i*53)%116);ctx.fillStyle=i%7===0&&idx<4?C.red:d.color;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;bars(ctx,[{name:'高斯数(M)',value:d.count,display:d.count.toFixed(3),color:d.color},{name:'PSNR',value:d.psnr/5,display:d.psnr.toFixed(3),color:C.green},{name:'LPIPS×20',value:d.lpips*20,display:d.lpips.toFixed(3),color:C.orange}],60,214,165)}}/><div className="chip-row">{gs.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>setIdx(i)}>{x.n}</button>)}</div><div className={`feedback ${idx===1?'bad':idx===4?'good':''}`}>{d.fb} 稀疏引导或困难轨迹仍可能产生错误对齐系数。</div></div>};

const resultSets=[{n:'I2P CLIP-I',unit:'',direction:'越高越好',a:'HY-World 1.0',av:.831,b:'HY-Pano 2.0',bv:.844,normA:.831/.844,normB:1,detail:'表 4，图像到全景。'},{n:'7-Scenes 高分辨率 Acc.',unit:'',direction:'越低越好',a:'WorldMirror 1.0',av:.079,b:'WorldMirror 2.0',bv:.037,normA:.037/.079,normB:1,detail:'表 11，点图误差。'},{n:'3DGS 高斯数量',unit:'M',direction:'越低越好',a:'基线',av:6,b:'完整配置',bv:1.381,normA:1.381/6,normB:1,detail:'表 9；PSNR 25.176→25.023。'},{n:'128 视图耗时',unit:'s',direction:'越低越好',a:'FP32 单卡',av:18,b:'SP+BF16+FSDP 四卡',bv:5.60,normA:5.6/18,normB:1,detail:'表 14，518×378，NVIDIA H20。'}];
export const HyResults:React.FC<WidgetProps>=()=>{const[idx,setIdx]=useState(0);const[run,setRun]=useState(0);const start=useRef(0);const d=resultSets[idx];const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={260} animate={run>0} draw={(ctx,time)=>{clear(ctx,560,260);const p=run?easeInOutQuad(clamp((time-start.current)/1600,0,1)):0;label(ctx,d.n,280,30,C.ink,15,'center');label(ctx,d.direction,280,52,C.orange,12,'center');const baseX=75,max=390;ctx.strokeStyle=C.line;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(baseX,105);ctx.lineTo(baseX+max,105);ctx.moveTo(baseX,180);ctx.lineTo(baseX+max,180);ctx.stroke();const xa=baseX+max*d.normA*p,xb=baseX+max*d.normB*p;ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(xa,105,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(xb,180,13,0,Math.PI*2);ctx.fill();label(ctx,`${d.a}: ${d.av}${d.unit}`,75,86,C.red,12);label(ctx,`${d.b}: ${d.bv}${d.unit}`,75,161,C.green,12);if(p>.98)label(ctx,'协议内领先',485,208,C.green,13,'right')}}/><div className="chip-row">{resultSets.map((x,i)=><button key={x.n} className={`chip ${idx===i?'selected':''}`} onClick={()=>{setIdx(i);setRun(0)}}>{x.n}</button>)}</div><div className="step-ctrl"><button className="tiny" onClick={go}>开始比较</button></div><div className={`feedback ${run?'good':''}`}>{d.direction}。{d.detail} 完整世界生成总耗时为 712 秒；Marble 只提供定性比较。</div></div>};

export default HyResults;
