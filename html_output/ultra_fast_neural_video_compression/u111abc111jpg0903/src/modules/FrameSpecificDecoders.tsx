import React,{useEffect,useRef,useState} from 'react';
import {observeCanvas,setupCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';

const W=900,H=430;
const C={bg:'#f4fafc',ink:'#12233b',muted:'#5d7189',blue:'#176b92',green:'#20936f',red:'#d75d72',orange:'#f08b66',purple:'#7868d8',line:'#cbdce6'};
const text=(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,size=13,color=C.ink,weight=400)=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.fillText(s,x,y)};
const round=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke:string,line=2)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()};
const arrow=(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const a=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-9*Math.cos(a-.5),y2-9*Math.sin(a-.5));ctx.lineTo(x2-9*Math.cos(a+.5),y2-9*Math.sin(a+.5));ctx.closePath();ctx.fill()};

export const FrameSpecificDecoders:React.FC<WidgetProps>=()=>{
 const ref=useRef<HTMLCanvasElement>(null);const [n,setN]=useState(6);const [special,setSpecial]=useState(true);const [sel,setSel]=useState(0);
 useEffect(()=>{if(sel>=n)setSel(n-1)},[n,sel]);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H)}catch{return}
  let raf=0,visible=true;
  const draw=()=>{const t=(Date.now()%1500)/1500;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
   ctx.save();ctx.setLineDash([8,6]);ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.strokeRect(12,8,W-24,H-20);ctx.restore();
   ctx.fillStyle=C.orange;ctx.fillRect(28,0,190,28);text(ctx,`视频块 Xᵢ：包含 ${n} 帧`,123,20,13,'#fff',700);
   text(ctx,'当前正在重建同一个视频块 Xᵢ',W/2,25,14,C.muted,600);
   round(ctx,315,42,270,54,12,C.blue,C.blue,3);text(ctx,'Chunk Decoder  →  公共特征 Fᵢ',450,75,17,'#fff',700);
   if(special){
    text(ctx,`一个块含 ${n} 帧 → 调用 ${n} 个位置专属解码器 → 一帧对应一个解码器`,450,121,14,C.green,700);
    const gap=14,margin=38,bw=(W-margin*2-gap*(n-1))/n,decoderY=174,frameY=310;
    for(let i=0;i<n;i++){const x=margin+i*(bw+gap),cx=x+bw/2,on=i===sel,flow=(t+i/n)%1;
     const pathColor=on?C.orange:C.green;arrow(ctx,450,96,cx,decoderY-8,pathColor,on?4:2);
     const px=450+(cx-450)*flow,py=96+(decoderY-8-96)*flow;ctx.fillStyle=pathColor;ctx.beginPath();ctx.arc(px,py,on?6:4,0,Math.PI*2);ctx.fill();
     round(ctx,x,decoderY,bw,62,10,on?'#fff4df':'#fff',pathColor,on?4:2);text(ctx,`D${sub(i)}`,cx,201,17,pathColor,700);text(ctx,`第 ${i+1} 帧专属`,cx,221,11,C.muted);
     arrow(ctx,cx,decoderY+62,cx,frameY-8,pathColor,on?4:2);const py2=decoderY+62+(frameY-8-decoderY-62)*flow;ctx.fillStyle=pathColor;ctx.beginPath();ctx.arc(cx,py2,on?6:4,0,Math.PI*2);ctx.fill();
     round(ctx,x,frameY,bw,60,7,on?'#fff4df':'#fff',pathColor,on?4:2);text(ctx,`x̂ᵢ,${i}`,cx,337,16,pathColor,700);text(ctx,`块 i · 第 ${i+1} 帧`,cx,358,11,C.muted);
    }
    text(ctx,`块 Xᵢ 内：D${sub(sel)} 只重建第 ${sel+1} 帧 x̂ᵢ,${sel}；N 个 Dⱼ 同时运行`,450,406,15,C.orange,700);
   }else{
    text(ctx,'同一组参数必须兼顾块内所有时间位置',450,121,14,C.red,700);arrow(ctx,450,96,450,166,C.red,3);
    round(ctx,335,174,230,62,10,'#fff1f2',C.red,3);text(ctx,'Dshared（统一解码器）',450,211,17,C.red,700);
    const gap=18,margin=58,bw=(W-margin*2-gap*(n-1))/n;
    for(let i=0;i<n;i++){const x=margin+i*(bw+gap),cx=x+bw/2;arrow(ctx,450,236,cx,310,C.red,2);round(ctx,x,310,bw,60,7,'#fff',C.red,2);text(ctx,`x̂ᵢ,${i}`,cx,337,16,C.red,700);text(ctx,`位置 ${i}`,cx,358,11,C.muted)}
    text(ctx,'× 一个“万事通”解码器重复服务所有位置，难以分别适配各帧',450,406,15,C.red,700);
   }
   canvas.classList.add('is-ready');if(visible)raf=requestAnimationFrame(draw)
  };
  const start=()=>{visible=true;if(!raf)raf=requestAnimationFrame(draw)},stop=()=>{visible=false;cancelAnimationFrame(raf);raf=0};
  const click=(e:MouseEvent)=>{if(!special)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,gap=14,margin=38,bw=(W-margin*2-gap*(n-1))/n;for(let i=0;i<n;i++){const bx=margin+i*(bw+gap);if(x>=bx&&x<=bx+bw)setSel(i)}};
  canvas.addEventListener('click',click);const off=observeCanvas(canvas,start,stop);return()=>{stop();off();canvas.removeEventListener('click',click)}
 },[n,sel,special]);
 return <div><div className="ctrl"><button type="button" className={!special?'active':''} onClick={()=>setSpecial(false)}>统一解码器（对照）</button><button type="button" className={special?'active':''} onClick={()=>setSpecial(true)}>帧专属解码器（DCVC-UF）</button><label>块内帧数 N <span className="val">{n}</span></label><input aria-label="块内帧数 N" type="range" min="2" max="8" value={n} onChange={e=>setN(Number(e.target.value))}/></div><canvas ref={ref} width={W} height={H} role="img" aria-label="一个含N帧的视频块通过N个帧专属解码器一一对应并行重建的交互动画"/><div className={`feedback ${special?'good':'bad'}`}>{special?`✓ 一个块 Xᵢ 含 ${n} 帧，本次重建同时调用 ${n} 个帧专属解码器：D${sub(sel)} 与块内第 ${sel+1} 帧 x̂ᵢ,${sel} 一一对应。Dⱼ 是按块内时间位置训练的参数组，会在不同视频块之间复用。`:'× 统一解码器只用一组参数重建块内全部帧，必须兼顾所有时间位置。'}</div><div className="decoder-compare-wrap"><table className="decoder-compare"><caption>同样处理 {n} 帧：逐帧 NVC 与 DCVC-UF 的结构对比</caption><thead><tr><th>项目</th><th>老逐帧 NVC（如 DCVC-RT）</th><th>DCVC-UF chunk={n}</th></tr></thead><tbody><tr><th>潜变量组织方式</th><td>逐帧产生 latent</td><td><strong>每个 chunk 产生 1 份 latent</strong></td></tr><tr><th>熵编码组织方式</th><td>逐帧 latent 分别进入熵编码流程</td><td><strong>块 latent 统一进入熵编码流程</strong></td></tr><tr><th>编码器</th><td>逐帧调用编码器</td><td>Chunk Encoder 联合读取全部 {n} 帧</td></tr><tr><th>解码执行</th><td>帧间存在顺序依赖</td><td>得到 Fᵢ 后，{n} 个帧专属解码器并行运行</td></tr><tr><th>解码器</th><td>每帧调用共享的逐帧解码路径</td><td>1 个 Chunk Decoder + {n} 个时间位置专属解码器</td></tr><tr><th>长视频训练</th><td>总 latent size 随训练帧数增长</td><td>论文报告块编码显著降低总 latent size，从而支持更长训练序列</td></tr></tbody></table></div><div className="decoder-rate-note">Chunk 编码器把块内 N 帧的联合时空信息编码进一份 chunk latent，显著提高吞吐，但也提高了从共享表示重建不同时间位置的难度。Table 2 中，仅加入块编码且没有帧专属解码器时，BD-Rate 为 −10.1%；加入 N 个时间位置专属解码器后，在相近解码速度下改善到 −25.3%。这说明帧专属解码器增强了从块表示重建各帧的能力。</div></div>;
};

function sub(i:number){return String(i).replace(/0/g,'₀').replace(/1/g,'₁').replace(/2/g,'₂').replace(/3/g,'₃').replace(/4/g,'₄').replace(/5/g,'₅').replace(/6/g,'₆').replace(/7/g,'₇').replace(/8/g,'₈').replace(/9/g,'₉')}
