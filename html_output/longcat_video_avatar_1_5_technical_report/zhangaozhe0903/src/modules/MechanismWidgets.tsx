import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 330;
const c = { bg:'#f5f8f0', panel:'#fff', light:'#b8c9a7', dark:'#76906a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea' };
type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function useCanvas(draw: Draw, deps: React.DependencyList, width = W, height = H) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height); let raf = 0; let running = false;
    const frame = (time:number) => { ctx.clearRect(0,0,width,height); ctx.fillStyle=c.bg; ctx.fillRect(0,0,width,height); draw(ctx,time); if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready'); if(running)raf=requestAnimationFrame(frame); };
    const start=()=>{if(!running){running=true;raf=requestAnimationFrame(frame);}}; const stop=()=>{running=false;cancelAnimationFrame(raf);};
    const disconnect=observeCanvas(canvas,start,stop); return()=>{stop();disconnect();};
  }, [...deps, width, height]);
  return ref;
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,r=10){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function txt(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color=c.text,size=14,bold=false){ctx.fillStyle=color;ctx.font=`${bold?700:500} ${size}px system-ui,sans-serif`;ctx.fillText(s,x,y);}
function ctxt(ctx:CanvasRenderingContext2D,s:string,cx:number,y:number,color=c.text,size=14,bold=false){ctx.fillStyle=color;ctx.font=`${bold?700:500} ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(s,cx,y);ctx.textAlign='start';}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=3,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
function ChipRow({labels,value,onChange}:{labels:string[];value:number;onChange:(n:number)=>void}){return <div className="ctrl lc-chip-row" role="group">{labels.map((x,i)=><button key={x} className={`chip ${i===value?'selected':''}`} onClick={()=>onChange(i)} aria-pressed={i===value}>{x}</button>)}</div>;}
function Canvas({canvasRef,label,width=W,height=H,compact=false}:{canvasRef:React.Ref<HTMLCanvasElement>;label:string;width?:number;height?:number;compact?:boolean}){return <div className={`lc-canvas-shell ${compact?'compact':''}`}><canvas ref={canvasRef} width={width} height={height} aria-label={label}/></div>;}
function PaperEvidence({src,alt,figure,title,children}:{src:string;alt:string;figure:string;title:string;children:React.ReactNode}){
  return <section className="lc-paper-evidence" aria-label={`${figure} 论文定性结果`}>
    <div className="lc-subfigure-head"><span>PAPER EVIDENCE</span><b>{title}</b></div>
    <figure>
      <img src={src} alt={alt} loading="lazy" />
      <figcaption><div>{children}</div><span>来源：论文 {figure}</span></figcaption>
    </figure>
  </section>;
}

export const FailureLab:React.FC<WidgetProps>=()=>{
  const requirements=[
    ['短片生成','一次成功即可展示','每次请求都要可用'],
    ['复杂发音','识别与表征可能偏差','跨语言仍需准确'],
    ['手脸结构','偶发局部崩坏','局部结构持续可靠'],
    ['推理成本','可容忍高步数','延迟与成本可控制'],
    ['多人归因','音轨可能绑定错人','人物—音轨明确对应'],
    ['长时一致','颜色、身份可能漂移','长时身份与画面稳定'],
  ];
  const ref=useCanvas(ctx=>{
    txt(ctx,'同一项能力，两套验收标准',28,30,c.text,17,true);
    rr(ctx,154,42,270,38,'#eef3f9',10);ctxt(ctx,'研究 Demo · 证明“能生成”',289,66,c.blue,14,true);
    rr(ctx,444,42,288,38,'#edf8f2',10);ctxt(ctx,'商业部署 · 证明“持续可靠”',588,66,c.green,14,true);
    requirements.forEach((r,i)=>{
      const y=90+i*35;
      rr(ctx,28,y,106,27,'#fff',7);ctxt(ctx,r[0],81,y+18,c.text,12,true);
      rr(ctx,154,y,270,27,i===0?'#e8f0f8':'#fdf0f2',7);ctxt(ctx,r[1],289,y+18,i===0?c.blue:c.red,11.5,true);
      rr(ctx,444,y,288,27,'#edf8f2',7);ctxt(ctx,r[2],588,y+18,c.green,11.5,true);
      line(ctx,424,y+13.5,440,y+13.5,i===0?c.blue:c.green,2);
    });
    rr(ctx,154,306,578,16,'#f6f8fb',8);rr(ctx,154,306,578,3,c.green,2);
    ctxt(ctx,'研究演示关注一次结果；商业系统关注复杂输入下可重复、可预测的质量。',443,320,c.muted,10.5,true);
  },[]);
  return <div><Canvas canvasRef={ref} label="研究演示与商业部署的并列验收标准"/><div className="feedback good"><b>LongCat 1.5 的问题定义：</b>生成能力已经存在，论文集中补齐音频表征、局部质量、推理成本、多人归因与长时稳定性。</div></div>;
};

const fixes=[
  {problem:'嘴型不准',from:'Wav2Vec2 · 94M',to:'Whisper-large · 1.5B',detail:'更丰富的多语言音素与上下文表示',color:c.blue},
  {problem:'局部崩坏',from:'整段一个奖励',to:'Per-frame GRPO',detail:'时间分区优势让坏帧获得直接信号',color:c.green},
  {problem:'推理太贵',from:'50 步 · 150 NFE',to:'DMD2 · 8 NFE',detail:'生成分布蒸馏压缩前向评估次数',color:c.orange},
  {problem:'多人串音',from:'背景无音频条件',to:'背景 → Silent',detail:'非目标人物获得明确的静音归属',color:c.purple},
  {problem:'长时漂移',from:'粗放混合素材',to:'标注 + 窗口验证',detail:'离线理解整段，在线检查训练片段',color:c.green},
];
export const SolutionMap:React.FC<WidgetProps>=()=>{
  const [selected,setSelected]=useState(0);
  const ref=useCanvas(ctx=>{txt(ctx,'问题',42,26,c.muted,12,true);txt(ctx,'原来',233,26,c.muted,12,true);txt(ctx,'LongCat 1.5',518,26,c.muted,12,true);fixes.forEach((f,i)=>{const y=38+i*52;const active=i===selected;rr(ctx,28,y,160,36,active?c.red:'#fff',9);rr(ctx,214,y,218,36,active?'#fff':'#fff',9);rr(ctx,492,y,240,36,active?f.color:'#fff',9);txt(ctx,f.problem,48,y+23,active?'#fff':c.text,13,true);txt(ctx,f.from,230,y+23,active?c.red:c.muted,12,true);txt(ctx,f.to,510,y+23,active?'#fff':f.color,12,true);line(ctx,442,y+18,480,y+18,active?f.color:c.border,active?5:2);ctx.fillStyle=active?f.color:c.border;ctx.beginPath();ctx.moveTo(480,y+18);ctx.lineTo(469,y+11);ctx.lineTo(469,y+25);ctx.fill();});rr(ctx,118,300,524,24,'#fff',8);ctxt(ctx,fixes[selected].detail,380,317,fixes[selected].color,13,true);},[selected]);
  return <div><Canvas canvasRef={ref} label="五类产品障碍从旧方案到 LongCat 1.5 的变化"/><ChipRow labels={fixes.map(x=>x.problem)} value={selected} onChange={setSelected}/><div className="feedback good"><b>{fixes[selected].from} → {fixes[selected].to}</b>：{fixes[selected].detail}</div></div>;
};

export const PhonemeCompare:React.FC<WidgetProps>=()=>{
  const [playing,setPlaying]=useState(false);const startRef=useRef(0);
  const ref=useCanvas((ctx,time)=>{if(playing&&startRef.current===0)startRef.current=time;const p=playing?Math.min(1,(time-startRef.current)/3600):0;const labels=['/p/ 闭唇','/i/ 展开','/a/ 张口'];
    txt(ctx,'同一段复杂发音：观察声学表示如何驱动嘴型',28,25,c.text,16,true);
    const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    const whisper=(x:number)=>.06+.48*smooth(.20,.48,x)+.46*smooth(.53,.86,x);
    const wav=(x:number)=>{const delayed=Math.max(0,x-.12);return delayed<.38?.06:delayed<.74?.58:1;};
    const panels=[{x:34,title:'Wav2Vec2',color:c.red,value:wav(p),curve:wav,note:'音素识别迟滞，口型突然跳变'},{x:397,title:'Whisper-large',color:c.green,value:whisper(p),curve:whisper,note:'连续上下文带来柔和过渡'}];
    panels.forEach(panel=>{rr(ctx,panel.x,42,330,116,'#fff',12);txt(ctx,panel.title,panel.x+18,66,panel.color,15,true);const cx=panel.x+70;ctx.fillStyle=panel.color;ctx.beginPath();ctx.arc(cx,104,26,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(cx,113,12,2+panel.value*11,0,0,Math.PI*2);ctx.stroke();line(ctx,panel.x+124,129,panel.x+302,129,c.border,2);ctx.strokeStyle=panel.color;ctx.lineWidth=4;ctx.lineJoin=panel.title==='Wav2Vec2'?'miter':'round';ctx.beginPath();for(let i=0;i<=42;i++){const q=i/42;const xx=panel.x+124+q*178;const yy=129-panel.curve(q)*42;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();const markerX=panel.x+124+p*178;ctx.fillStyle=panel.color;ctx.beginPath();ctx.arc(markerX,129-panel.curve(p)*42,5,0,Math.PI*2);ctx.fill();txt(ctx,panel.note,panel.x+124,150,panel.color,10,true);});
    rr(ctx,34,173,330,67,'#fff',12);txt(ctx,'Raw waveform → Conv encoder → Transformer',50,197,c.text,12,true);txt(ctx,'94M 参数 · 复杂音素表征有限',50,222,c.red,12,true);
    rr(ctx,397,173,330,67,'#fff',12);txt(ctx,'Log-Mel → 32-layer Transformer encoder',413,197,c.text,12,true);txt(ctx,'1.5B 参数 · 68 万小时多语言语音',413,222,c.green,12,true);
    line(ctx,82,278,678,278,c.border,4);labels.forEach((x,i)=>{const xx=130+i*250;ctx.fillStyle=c.orange;ctx.beginPath();ctx.arc(xx,278,6,0,Math.PI*2);ctx.fill();txt(ctx,x,xx-31,307,c.muted,12,true);});const cursor=82+p*596;line(ctx,cursor,259,cursor,291,c.blue,4);txt(ctx,'播放时间轴',82,260,c.blue,11,true);
  },[playing]);
  const start=()=>{startRef.current=0;setPlaying(true);setTimeout(()=>setPlaying(false),3600);};
  return <div><Canvas canvasRef={ref} label="Wav2Vec2 与 Whisper 嘴型轨迹和结构比较"/><div className="ctrl"><button className="btn" onClick={start}>同步播放这段发音</button><span className="val">/p/ → /i/ → /a/</span></div><div className="feedback good">Whisper-large 的规模、多语言预训练和多层上下文表示更适合捕捉连续音素变化。上方动画用连续轨迹解释“自然度”，论文原图则在下方给出具体发音的真实嘴形对照。</div><PaperEvidence src="./images/fig6_whisper_lipsync.png" alt="论文 Figure 6：Wav2Vec2 与 Whisper-large 在三个具体发音上的嘴形对照" figure="Figure 6 · 第 10 页" title="真实发音对照：三组发音的嘴形是否落在正确位置？">逐列观察 <b>/ˈpipəl/、/ˈlʌv/、/ˈsi/</b>：作者用这些发音片段展示 Whisper-large 对细粒度音素的响应。这里关注具体音素与嘴形的对应关系；上方交互关注口型从一个音素过渡到下一个音素时是否连续、自然。该图属于论文的定性比较。</PaperEvidence></div>;
};

const alignSteps=[['33 层特征','Embedding + 32 Transformer layers'],['池化为 5 组','4×8 层均值 + 1 个单层'],['50 Hz → 25 FPS','线性插值匹配视频帧率'],['匹配 VAE 潜变量','Audio Projector 聚合邻域并压缩时间'],['注入 DiT','在 Text Cross-Attn 后加入 Audio Cross-Attn']];
export const AudioAlignment:React.FC<WidgetProps>=()=>{
  const [playing,setPlaying]=useState(true);const [progress,setProgress]=useState(0);const progressRef=useRef(0);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setProgress(v=>{const next=(v+.0085)%1;progressRef.current=next;return next;}),80);return()=>window.clearInterval(timer);},[playing]);
  const ref=useCanvas(ctx=>{const p=progressRef.current;const step=Math.min(4,Math.floor(p*5));const local=p*5-step;
    txt(ctx,'完整流程',28,25,c.text,15,true);alignSteps.forEach((s,i)=>{const x=28+i*145;rr(ctx,x,39,126,40,i===step?c.orange:'#fff',9);txt(ctx,s[0],x+12,65,i===step?'#fff':c.text,12,true);if(i<4){line(ctx,x+126,59,x+142,59,c.green,3);}});
    rr(ctx,28,99,704,194,'#fff',13);txt(ctx,`${step+1}. ${alignSteps[step][0]}`,48,125,step===4?c.green:c.blue,16,true);txt(ctx,alignSteps[step][1],48,149,c.muted,12);
    if(step===0){for(let i=0;i<33;i++){const col=i%11,row=Math.floor(i/11),x=62+col*55,y=177+row*31;rr(ctx,x,y,38,20,i===0?c.orange:c.blue,5);txt(ctx,i===0?'E':String(i),x+11,y+15,'#fff',10,true);}const scan=Math.min(32,Math.floor(local*33));ctx.strokeStyle=c.orange;ctx.lineWidth=3;ctx.strokeRect(57+(scan%11)*55,172+Math.floor(scan/11)*31,48,30);txt(ctx,'E + 32 层隐藏状态',574,270,c.orange,12,true);
    }else if(step===1){for(let i=0;i<5;i++){const x=60+i*132;const count=i<4?8:1;rr(ctx,x,181,104,68,i===4?c.orange:c.blue,9);txt(ctx,`组 ${i+1}`,x+28,204,'#fff',12,true);txt(ctx,i<4?'8 层取均值':'单独保留',x+18,230,'#fff',11);const fill=Math.min(count,Math.ceil(local*count));for(let j=0;j<fill;j++){rr(ctx,x+10+j*(84/Math.max(1,count)),258,7,16,c.green,2);}}txt(ctx,'输出 5 个通道 × 1280 维',269,283,c.green,12,true);
    }else if(step===2){txt(ctx,'Whisper 特征 · 50 Hz',58,181,c.blue,12,true);for(let i=0;i<24;i++){ctx.fillStyle=i<=Math.floor(local*23)?c.blue:c.border;ctx.beginPath();ctx.arc(60+i*27,201,4,0,Math.PI*2);ctx.fill();}txt(ctx,'视频帧 · 25 FPS',58,236,c.green,12,true);for(let i=0;i<12;i++){rr(ctx,60+i*54,247,26,20,i<=Math.floor(local*11)?c.green:c.border,5);line(ctx,73+i*54,221,73+i*54,247,c.orange,1,[3,3]);}txt(ctx,'线性插值：每个视频帧获得对应声学表示',386,284,c.orange,12,true);
    }else if(step===3){for(let i=0;i<8;i++){const x=64+i*72;rr(ctx,x,183,45,32,i<=Math.floor(local*7)?c.green:c.border,7);txt(ctx,`F${i+1}`,x+13,204,i<=Math.floor(local*7)?'#fff':c.muted,11,true);}for(let i=0;i<2;i++){const x=210+i*230;rr(ctx,x,246,116,31,c.blue,8);txt(ctx,`潜变量 ${i+1}`,x+27,267,'#fff',11,true);for(let j=0;j<4;j++)line(ctx,86+(i*4+j)*72,215,x+58,246,c.orange,1.5);}txt(ctx,'Audio Projector 汇总邻域，使音频长度匹配 VAE 的 4× 时间下采样',85,166,c.orange,11,true);
    }else{
      txt(ctx,'每个 DiT block 内，视觉 token 沿主干依次更新；文本和音频从侧面提供条件',48,169,c.muted,11);
      const blocks=[['视觉 xₜ',48,76,c.blue],['3D Self-Attn',147,112,c.blue],['Text Cross-Attn',286,118,c.blue],['Audio Cross-Attn',431,128,c.green],['FFN',586,84,c.blue]] as const;
      blocks.forEach((n,i)=>{const active=Math.min(4,Math.floor(local*5))===i;rr(ctx,n[1],213,n[2],43,active?c.orange:n[3],9);ctxt(ctx,n[0],n[1]+n[2]/2,239,'#fff',i===0||i===4?10.5:10,true);if(i<4)line(ctx,n[1]+n[2]+4,234,blocks[i+1][1]-5,234,active?c.orange:c.border,3);});
      rr(ctx,292,177,106,25,'#eef3f9',7);ctxt(ctx,'UMT5 文本特征',345,194,c.blue,9.5,true);line(ctx,345,202,345,211,c.blue,2);
      rr(ctx,442,177,106,25,'#eef8f3',7);ctxt(ctx,'对齐音频 Aₜ',495,194,c.green,9.5,true);line(ctx,495,202,495,211,c.green,2);
      txt(ctx,'adaLN gate',443,273,c.purple,9,true);line(ctx,485,258,485,266,c.purple,1.5,[3,3]);
      ctxt(ctx,'输出：被文本语义与当前音频时刻共同调制的视觉 token',380,286,c.green,11.5,true);
    }
  },[]);
  const macroRef=useCanvas((ctx,time)=>{const p=progressRef.current;const active=Math.min(3,Math.floor(p*4));const pulse=.55+.45*Math.sin(time/260);
    txt(ctx,'宏观视角：统一架构接收不同视觉配置，音频始终作为独立条件支路',26,23,c.text,14.5,true);
    txt(ctx,'AUDIO CONDITION',26,54,c.green,9.5,true);txt(ctx,'VISUAL INPUT MODES',26,93,c.blue,9.5,true);

    line(ctx,135,52,171,52,c.green,2);ctx.strokeStyle=c.green;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=36;i+=3){const x=135+i,y=52+Math.sin(i*.55+time/310)*6;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    rr(ctx,180,33,108,37,'#fff',8);ctxt(ctx,'Whisper-large',234,49,c.green,10.5,true);ctxt(ctx,'50 Hz → 25 FPS',234,63,c.muted,8.5);
    line(ctx,288,51,303,51,c.green,2);rr(ctx,307,33,105,37,'#fff',8);ctxt(ctx,'Audio Projector',359.5,49,c.green,9.5,true);ctxt(ctx,'时间压缩 4×',359.5,63,c.muted,8.5);

    rr(ctx,27,100,136,38,'#fff',8);ctxt(ctx,'参考图像 / 上下文视频',95,116,c.blue,9.5,true);ctxt(ctx,'AI2V / Video Continuation',95,131,c.muted,7.8);
    line(ctx,163,119,177,119,c.blue,2);rr(ctx,181,100,78,38,'#fff',8);ctxt(ctx,'3D VAE',220,116,c.blue,10.5,true);ctxt(ctx,'→ Ref / Context',220,131,c.muted,8);
    rr(ctx,181,148,78,28,'#eef3f9',8);ctxt(ctx,'Noise Latents',220,166,c.blue,9,true);
    line(ctx,259,119,278,119,c.blue,2);line(ctx,259,162,278,136,c.blue,2);
    rr(ctx,282,105,130,52,'#fff',8);ctxt(ctx,'时间拼接',347,124,c.blue,10,true);ctxt(ctx,'Ref / Context + Noise',347,141,c.muted,8.5);

    // Audio/visual latent sequences share the generated-video time index.
    for(let i=0;i<4;i++){
      const x=438+i*15;const on=i===active;
      rr(ctx,x,42,11,18,on?c.orange:'#d7e1eb',3);rr(ctx,x,119,11,18,on?c.orange:'#d7e1eb',3);
      if(on){ctx.save();ctx.globalAlpha=.18+.12*pulse;rr(ctx,x-4,37,19,105,c.orange,6);ctx.restore();line(ctx,x+5.5,60,x+5.5,119,c.orange,1.5,[3,3]);}
    }
    ctxt(ctx,'Aₜ',466,75,c.green,9.5,true);ctxt(ctx,'Vₜ',466,151,c.blue,9.5,true);
    line(ctx,412,51,434,51,c.green,2);line(ctx,412,131,434,131,c.blue,2);
    line(ctx,500,51,535,78,c.green,2);line(ctx,500,131,535,105,c.blue,2);
    rr(ctx,539,66,128,58,c.blue,10);ctxt(ctx,'Shared DiT Block',603,87,'#fff',10.5,true);ctxt(ctx,'Text CA → Audio CA',603,104,'#fff',8.5,true);ctxt(ctx,'Aₜ 条件化 Vₜ',603,118,'#d9f4e6',8.5,true);
    line(ctx,667,95,681,95,c.green,2);rr(ctx,685,78,50,34,'#edf8f2',8);ctxt(ctx,'视频',710,99,c.green,10,true);

    rr(ctx,27,188,708,19,'#fff',8);ctxt(ctx,'AT2V：只用 Noise · AI2V：Reference + Noise · VC：Context + Noise · 三种模式都接收音频条件',381,201,c.muted,9.5,true);
  },[],760,218);
  const change=(n:number)=>{const v=n/100;setPlaying(false);setProgress(v);progressRef.current=v;};const step=Math.min(4,Math.floor(progress*5));
  return <div><Canvas canvasRef={ref} label="Whisper 33 层特征分组、时间对齐与 DiT 注入动画"/><div className="ctrl"><button className="btn" onClick={()=>setPlaying(v=>!v)}>{playing?'暂停动画':'继续播放'}</button><input aria-label="拖动查看音频对齐过程" type="range" min="0" max="99" value={Math.round(progress*100)} onChange={e=>change(Number(e.target.value))}/><span className="val">{step+1} / 5</span></div><div className={`feedback ${step===4?'good':''}`}>{alignSteps[step][1]}。拖动时间轴可停在任一阶段查看细节。</div><div className="lc-subfigure-head"><span>PIPELINE VIEW</span><b>整个模型到底接收 Image + Audio，还是 Video + Audio？</b></div><Canvas canvasRef={macroRef} label="多种视觉潜变量配置与音频条件在统一 DiT 中汇合" width={760} height={218} compact/><div className="lc-pipeline-note"><b>按任务选择视觉输入。</b>AI2V 把参考图像编码成 reference latent；视频续写把上下文视频编码成 context latent；AT2V 只提供 noise latents。视觉潜变量与噪声在时间维拼接，音频特征压缩到对应潜变量长度后，通过 Audio Cross-Attention 注入。</div></div>;
};

export const FrameRewardProbe:React.FC<WidgetProps>=()=>{
  const [mode,setMode]=useState(0);const [frame,setFrame]=useState(0);const [auto,setAuto]=useState(true);const modeRef=useRef(0);const frameRef=useRef(0);const rewards=[.82,.78,.74,.18,.76,.43,.81,.79];
  useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>setFrame(v=>{const next=(v+1)%8;frameRef.current=next;if(v===7)setMode(m=>{const nextMode=1-m;modeRef.current=nextMode;return nextMode;});return next;}),700);return()=>window.clearInterval(timer);},[auto]);
  const ref=useCanvas(ctx=>{const mode=modeRef.current,frame=frameRef.current;txt(ctx,mode?'新方法：奖励保留时间位置':'原方法：整段视频得到一个标量奖励',28,25,mode?c.green:c.red,16,true);const old=[['8 帧视频',28,145],['Rₖ(video)',211,145],['相对优势 Âᵢ',394,145],['扩散策略损失',577,155]] as const;const newer=[['时间分区 j',28,145],['奖励 rₖ,ⱼ',211,145],['组内归一化',394,145],['ΣwₖÂₖ,ⱼ → loss',577,155]] as const;(mode?newer:old).forEach((n,i,a)=>{rr(ctx,n[1],42,n[2],42,i===a.length-1?(mode?c.green:c.red):c.blue,9);ctxt(ctx,n[0],n[1]+n[2]/2,68,'#fff',12,true);if(i<a.length-1)line(ctx,n[1]+n[2]+5,63,a[i+1][1]-5,63,mode?c.green:c.orange,3);});txt(ctx,mode?'每个时间分区的优势只强化或惩罚对应片段':'同一个 Âᵢ 被用于整段去噪轨迹，坏帧位置被平均掉',28,105,mode?c.green:c.red,12,true);
    rewards.forEach((r,i)=>{const x=34+i*89;const bad=r<.5;rr(ctx,x,125,70,57,bad?c.red:c.light,9);ctxt(ctx,`帧 ${i+1}`,x+35,148,bad?'#fff':c.text,11,true);if(i===3)ctxt(ctx,'融手',x+35,170,'#fff',11,true);if(i===5)ctxt(ctx,'跳帧',x+35,170,'#fff',11,true);const value=mode?r:.66;const h=value*72;rr(ctx,x,278-h,70,h,mode?(bad?c.red:c.green):c.orange,7);ctxt(ctx,value.toFixed(2),x+35,298,mode?(bad?c.red:c.green):c.orange,11,true);if(i===frame){ctx.strokeStyle=c.orange;ctx.lineWidth=4;ctx.strokeRect(x-5,119,80,185);}});txt(ctx,mode?`第 ${frame+1} 帧：rₖ,ⱼ → Âₖ,ⱼ → Âtotal,ⱼ → policy loss`:`第 ${frame+1} 帧仍使用整段优势 Âᵢ，无法单独定位异常`,28,323,mode?c.green:c.red,12,true);},[]);
  const chooseMode=(n:number)=>{modeRef.current=n;setMode(n);setAuto(false);};const chooseFrame=(n:number)=>{frameRef.current=n;setFrame(n);setAuto(false);};
  return <div><Canvas canvasRef={ref} label="视频级奖励与逐帧 GRPO 的奖励计算和训练信号"/><ChipRow labels={['原来：视频级奖励','现在：逐帧 GRPO']} value={mode} onChange={chooseMode}/><div className="ctrl"><button className="btn secondary" onClick={()=>setAuto(v=>!v)}>{auto?'暂停自动演示':'继续自动演示'}</button><label>奖励探针 <span className="val">第 {frame+1} 帧</span></label><input type="range" min="0" max="7" value={frame} onChange={e=>chooseFrame(Number(e.target.value))}/></div><div className={`feedback ${mode?(rewards[frame]<.5?'bad':'good'):'bad'}`}>{mode?(rewards[frame]<.5?'该时间分区获得低优势，扩散策略优化会直接针对这里的融手或跳帧。':'当前帧质量较好，对应优势会保留并强化这一时间分区。'):'视频级奖励经过组相对归一化后仍是样本级标量，整段轨迹共享同一训练方向。'}</div></div>;
};

export const HandPresence:React.FC<WidgetProps>=()=>{
  const [hands,setHands]=useState(0);const [pipelineStage,setPipelineStage]=useState(0);const [pipelineAuto,setPipelineAuto]=useState(true);const handsRef=useRef(0);const pipelineStageRef=useRef(0);
  useEffect(()=>{if(!pipelineAuto)return;const timer=window.setInterval(()=>setPipelineStage(v=>{const next=(v+1)%5;pipelineStageRef.current=next;return next;}),1700);return()=>window.clearInterval(timer);},[pipelineAuto]);
  const ref=useCanvas(ctx=>{const hands=handsRef.current;txt(ctx,'首帧手部检查如何接入偏好优化',28,27,c.text,17,true);const nodes=[['I2V / 续写样本',28,150,c.blue],['MediaPipe 检测',215,150,hands?c.green:c.red],['手部样本比例',402,150,hands?c.orange:c.muted],['Per-frame GRPO',589,143,hands?c.green:c.blue]] as const;nodes.forEach((n,i,a)=>{rr(ctx,n[1],44,n[2],42,n[3],9);txt(ctx,n[0],n[1]+14,70,'#fff',12,true);if(i<a.length-1)line(ctx,n[1]+n[2],65,a[i+1][1]-10,65,hands?c.green:c.border,3);});
    rr(ctx,28,112,300,186,'#fff',13);txt(ctx,'条件首帧',48,139,c.blue,13,true);ctx.fillStyle=c.blue;ctx.beginPath();ctx.arc(177,177,31,0,Math.PI*2);ctx.fill();line(ctx,177,208,177,261,c.text,7);line(ctx,177,225,128,260,hands?c.orange:c.text,9);line(ctx,177,225,226,260,hands?c.orange:c.text,9);if(hands){ctx.strokeStyle=c.orange;ctx.lineWidth=4;ctx.strokeRect(111,246,33,29);ctx.strokeRect(210,246,33,29);}txt(ctx,hands?'检测结果：双手可见':'检测结果：未发现可见手部',50,288,hands?c.green:c.red,13,true);
    rr(ctx,360,112,372,186,hands?'#f0faf4':'#f7f9fc',12);txt(ctx,'它改变的是进入 GRPO 的样本分布',382,139,hands?c.green:c.blue,13.5,true);
    txt(ctx,'普通采样池',382,169,c.muted,11,true);for(let i=0;i<5;i++){ctx.fillStyle=i===0?c.orange:'#dce4ee';ctx.beginPath();ctx.arc(505+i*38,165,9,0,Math.PI*2);ctx.fill();}txt(ctx,'含手 1 / 5',650,169,c.orange,10,true);
    txt(ctx,'偏好优化批次',382,211,hands?c.green:c.muted,11,true);for(let i=0;i<5;i++){const handCount=hands?3:1;ctx.fillStyle=i<handCount?c.orange:'#dce4ee';ctx.beginPath();ctx.arc(505+i*38,207,9,0,Math.PI*2);ctx.fill();}txt(ctx,hands?'含手 3 / 5':'含手 1 / 5',650,211,hands?c.green:c.muted,10,true);
    line(ctx,382,232,710,232,c.border,1);txt(ctx,hands?'检测到手 → 提高该类样本的采样优先级':'未检测到手 → 保持普通采样权重',382,257,hands?c.green:c.muted,11.5,true);txt(ctx,'不新增独立 hand loss；后续仍使用逐帧多奖励 GRPO',382,281,c.purple,10.5,true);
  },[]);
  const pipelineRef=useCanvas((ctx,time)=>{const hands=handsRef.current,pipelineStage=pipelineStageRef.current;const stages=[['任务样本','首帧检查'],['策略 Rollout','生成一组视频'],['多奖励模型','得到 rₖ,ⱼ'],['组相对优势','ΣwₖÂₖ,ⱼ'],['Diffusion Policy','Loss → 更新 DiT']] as const;
    txt(ctx,'宏观视角：首帧筛样与逐帧奖励如何进入一次 GRPO 更新',26,24,c.text,14.5,true);
    stages.forEach((s,i)=>{const x=25+i*146;const active=i===pipelineStage;rr(ctx,x,50,126,54,active?c.orange:'#fff',9);ctxt(ctx,s[0],x+63,72,active?'#fff':i===4?c.green:c.blue,10.5,true);ctxt(ctx,s[1],x+63,91,active?'#fff':c.muted,8.8);if(i<4)line(ctx,x+126,77,x+143,77,i<pipelineStage?c.green:c.border,2);});
    const travel=(time%1700)/1700;const startX=25+pipelineStage*146,endX=Math.min(735,startX+126);ctx.fillStyle=c.orange;ctx.beginPath();ctx.arc(startX+12+travel*(endX-startX-24),112,3.5,0,Math.PI*2);ctx.fill();
    rr(ctx,25,126,184,116,hands?'#eef8f3':'#f6f8fb',9);txt(ctx,'① 样本比例',42,149,hands?c.green:c.blue,10.5,true);txt(ctx,hands?'手可见 → 提高采样优先级':'无手 → 普通采样权重',42,171,hands?c.green:c.muted,9.5);txt(ctx,'只改变进入 rollout',42,197,c.text,9.2);txt(ctx,'的样本组成',42,214,c.text,9.2);txt(ctx,'没有独立 hand loss',42,234,c.purple,8.8,true);
    rr(ctx,225,126,510,116,'#fff',9);txt(ctx,'② 示例：候选视频 i 的第 j=4 帧出现融手',243,148,c.red,10.5,true);
    const rewardItems=[['结构 r₁,ⱼ','0.18',c.red],['画质 r₂,ⱼ','0.72',c.orange],['时序 r₃,ⱼ','0.64',c.blue]] as const;rewardItems.forEach((r,i)=>{const x=243+i*124;rr(ctx,x,158,112,27,pipelineStage===2?r[2]:'#eef2f7',7);ctxt(ctx,`${r[0]} = ${r[1]}`,x+56,176,pipelineStage===2?'#fff':r[2],8.6,true);});
    txt(ctx,'同一奖励 k、同一时间 j，在组内候选 i 之间归一化：',243,203,pipelineStage===3?c.orange:c.muted,9.1,true);txt(ctx,'Âᵢₖ,ⱼ=(rᵢₖ,ⱼ−μₖ,ⱼ)/σmaxₖ,ⱼ  →  Âᵢtotal,ⱼ=ΣₖwₖÂᵢₖ,ⱼ = −0.63',243,222,pipelineStage>=3?c.orange:c.text,9.2,true);
    ctxt(ctx,'−0.63 只绑定第 j=4 时间分区的去噪 transition，作为该局部 diffusion policy loss 的权重',380,262,pipelineStage===4?c.green:c.muted,9.5,true);
  },[],760,272);
  const chooseHands=(n:number)=>{handsRef.current=n;setHands(n);};const choosePipelineStage=(n:number)=>{pipelineStageRef.current=n;setPipelineAuto(false);setPipelineStage(n);};
  return <div><Canvas canvasRef={ref} label="首帧手部检测改变 Per-frame GRPO 手部样本比例"/><ChipRow labels={['首帧无手','首帧有手']} value={hands} onChange={chooseHands}/><div className={`feedback ${hands?'good':'bad'}`}>{hands?'MediaPipe 检测到可见手部后，提高这类样本进入偏好优化批次的概率；逐帧多奖励因而会看到更多真实的手部变化与错误。':'该样本仍可参与整体偏好优化，但不会获得“含手样本”的采样优先级。'}</div><div className="lc-subfigure-head"><span>TRAINING VIEW</span><b>从提高含手样本比例，到算出某一帧的局部训练优势</b></div><Canvas canvasRef={pipelineRef} label="手部筛样、策略 rollout、逐帧多奖励、组内归一化和扩散策略损失" width={760} height={272} compact/><div className="ctrl"><button className="btn secondary" onClick={()=>setPipelineAuto(v=>!v)}>{pipelineAuto?'暂停宏观动画':'继续宏观动画'}</button><input aria-label="控制 Per-frame GRPO 宏观阶段" type="range" min="0" max="4" value={pipelineStage} onChange={e=>choosePipelineStage(Number(e.target.value))}/><span className="val">{pipelineStage+1} / 5</span></div><div className="lc-pipeline-note">逐帧奖励的关键是同时保留 <b>奖励类型 k</b> 和 <b>时间分区 j</b>：每种奖励先在同组候选视频之间标准化，再按权重求和得到 Âᵢtotal,ⱼ；这个局部优势只作用到对应时间分区的扩散策略更新。</div></div>;
};

export const NfeRace:React.FC<WidgetProps>=()=>{
  const stages=[
    {title:'教师定目标',short:'Base 分布',detail:'多步 Base 提供高质量目标分布 pteacher。'},
    {title:'学生少步生成',short:'8 NFE',detail:'Generator Gθ 从噪声出发，只走 8 次前向得到当前分布 pG。'},
    {title:'双 Score 比较',short:'real − fake',detail:'Real Score 与 Fake Score 分别估计目标分布和学生分布的方向。'},
    {title:'反向 KL 更新',short:'pG → pteacher',detail:'两条 score 的差形成更新方向，推动 8 步学生分布靠近教师。'},
  ] as const;
  const [stage,setStage]=useState(0);const [auto,setAuto]=useState(true);const stageRef=useRef(0);const autoRef=useRef(true);
  useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>setStage(v=>{const next=(v+1)%4;stageRef.current=next;return next;}),2500);return()=>window.clearInterval(timer);},[auto]);
  const ref=useCanvas((ctx,time)=>{const stage=stageRef.current;const local=autoRef.current?Math.min(1,(time%2500)/1700):1;const teacherCenter=188;const studentCenter=stage===3?286-(98*local):286;
    const curve=(center:number,color:string,alpha=1)=>{ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();for(let x=54;x<=462;x+=4){const q=(x-center)/55;const y=198-69*Math.exp(-q*q/2);if(x===54)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.restore();};
    txt(ctx,'DMD2：用分布匹配把多步扩散蒸馏为 8-NFE 生成器',25,23,c.text,14.5,true);
    stages.forEach((s,i)=>{const x=25+i*181;const active=i===stage;rr(ctx,x,37,164,43,active?c.orange:'#fff',8);ctxt(ctx,`${i+1}. ${s.title}`,x+82,55,active?'#fff':i===3?c.green:c.blue,9.8,true);ctxt(ctx,s.short,x+82,71,active?'#fff':c.muted,8.2);if(i<3)line(ctx,x+164,59,x+178,59,i<stage?c.green:c.border,2);});

    rr(ctx,25,94,462,124,'#fff',11);txt(ctx,'生成分布',43,116,c.text,11,true);txt(ctx,'pteacher',358,116,c.blue,9,true);txt(ctx,'pG',426,116,c.green,9,true);line(ctx,344,112,354,112,c.blue,3);line(ctx,412,112,422,112,c.green,3);
    line(ctx,54,198,462,198,c.border,2);curve(teacherCenter,c.blue,stage===1?.32:1);curve(studentCenter,c.green,stage===0?.22:1);
    if(stage===0){for(let i=0;i<13;i++){const x=108+(i*29)%166,y=188-((i*17)%45);ctx.fillStyle='rgba(39,68,110,.32)';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}ctxt(ctx,'Base / teacher：用多步采样刻画目标分布',256,210,c.blue,9.2,true);}
    if(stage===1){for(let i=0;i<8;i++){const x=62+i*34;ctx.fillStyle=i<7?c.green:'#fff';ctx.strokeStyle=c.green;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,207,4.5,0,Math.PI*2);ctx.fill();ctx.stroke();}txt(ctx,'噪声 → 8 个校正点 → pG',330,211,c.green,8.8,true);}
    if(stage===2){const sampleX=248;line(ctx,sampleX,139,sampleX,198,c.orange,2,[4,4]);rr(ctx,112,139,104,25,c.blue,7);ctxt(ctx,'Real Score  sreal',164,156,'#fff',8.8,true);rr(ctx,280,139,104,25,c.purple,7);ctxt(ctx,'Fake Score  sfake',332,156,'#fff',8.8,true);line(ctx,216,151,sampleX-7,151,c.blue,2);line(ctx,280,151,sampleX+7,151,c.purple,2);ctxt(ctx,'同一个噪声尺度 xt 上比较两条方向',256,210,c.orange,9.2,true);}
    if(stage===3){line(ctx,286,177,studentCenter+8,177,c.orange,3);ctxt(ctx,'∇θ DKL(pG ∥ pteacher)  ∝  sreal − sfake',256,210,c.orange,9.2,true);}

    rr(ctx,505,94,230,124,stage===3?'#eef8f3':'#f7f9fc',11);txt(ctx,`STEP ${stage+1}`,524,117,stage===3?c.green:c.orange,9,true);txt(ctx,stages[stage].title,524,142,c.text,14,true);const detailLines=stage===0?['多步 Base 提供','高质量目标分布']:stage===1?['8 次前向先得到','有偏差的 pG']:stage===2?['两个 score 分别看','目标与学生的方向']:['利用方向差更新 Gθ','让 pG 逐渐重合'];detailLines.forEach((s,i)=>txt(ctx,s,524,167+i*20,i===1&&stage===3?c.green:c.muted,10.5,i===1&&stage===3));

  },[],760,228);
  const nfeRef=useCanvas(ctx=>{txt(ctx,'推理成本单独看：NFE 统计一次采样需要多少次网络前向',25,22,c.text,14,true);
    txt(ctx,'Base',25,58,c.blue,11,true);rr(ctx,91,37,315,31,'#fff',8);ctxt(ctx,'50 个扩散步 × 每步约 3 次前向',248.5,58,c.text,10.5,true);line(ctx,406,52,429,52,c.blue,2);rr(ctx,433,37,112,31,c.blue,8);ctxt(ctx,'150 NFE',489,58,'#fff',11,true);
    txt(ctx,'Fast',25,98,c.green,11,true);rr(ctx,91,77,315,31,'#fff',8);ctxt(ctx,'8 个蒸馏采样步 × 每步 1 次前向',248.5,98,c.text,10.5,true);line(ctx,406,92,429,92,c.green,2);rr(ctx,433,77,112,31,c.green,8);ctxt(ctx,'8 NFE',489,98,'#fff',11,true);
    rr(ctx,570,37,165,71,'#fff7e8',10);ctxt(ctx,'前向次数减少',652.5,61,c.orange,10,true);ctxt(ctx,'约 18.75×',652.5,86,c.orange,18,true);ctxt(ctx,'不等同于墙钟加速倍数',652.5,101,c.muted,8.2);
  },[],760,122);
  const choose=(n:number)=>{stageRef.current=n;autoRef.current=false;setStage(n);setAuto(false);};const toggle=()=>setAuto(v=>{autoRef.current=!v;return !v;});
  return <div><Canvas canvasRef={ref} label="DMD2 教师目标、8 步生成、双 Score 比较和反向 KL 更新" width={760} height={228} compact/><div className="ctrl"><button className="btn secondary" onClick={toggle}>{auto?'暂停自动演示':'继续自动演示'}</button><input aria-label="控制 DMD2 蒸馏阶段" type="range" min="0" max="3" value={stage} onChange={e=>choose(Number(e.target.value))}/><span className="val">{stage+1} / 4 · {stages[stage].title}</span></div><div className="feedback good"><b>{stages[stage].title}：</b>{stages[stage].detail} DMD2 属于生成模型蒸馏，匹配的是生成分布。</div><div className="lc-subfigure-head"><span>INFERENCE COST</span><b>150 NFE 与 8 NFE 分别是怎样算出来的？</b></div><Canvas canvasRef={nfeRef} label="Base 150 NFE 与 Fast 8 NFE 的独立计算对比" width={760} height={122} compact/><div className="lc-pipeline-note">这里比较的是 <b>Network Function Evaluations</b>：Base 的 50 个扩散步包含约 150 次网络前向，Fast 直接以 8 次前向完成采样。NFE 减少约 18.75 倍，实际墙钟加速还会受到硬件、序列长度和工程实现影响。</div></div>;
};

const roles=[
  {name:'Generator DiT',identity:'少步学生 · 最终部署',job:'噪声 → 8-NFE 样本 pG',weights:'W + ΔWᴳ',color:c.green},
  {name:'Fake Score DiT',identity:'训练期辅助估计器',job:'估计学生分布 sfake',weights:'W + ΔWᶠ',color:c.purple},
  {name:'Real Score DiT',identity:'冻结教师 / 目标估计器',job:'提供目标分布 sreal',weights:'仅使用冻结 W',color:c.blue},
] as const;
export const LoraMemory:React.FC<WidgetProps>=()=>{
  const [role,setRole]=useState(0);const [auto,setAuto]=useState(true);const roleRef=useRef(0);
  useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>setRole(v=>{const next=(v+1)%3;roleRef.current=next;return next;}),2400);return()=>window.clearInterval(timer);},[auto]);
  const ref=useCanvas(ctx=>{const role=roleRef.current;txt(ctx,'DMD2 的三个 DiT：谁是学生、教师和训练期辅助角色？',28,24,c.text,16,true);
    roles.forEach((r,i)=>{const x=28+i*244,active=i===role;rr(ctx,x,42,216,91,active?r.color:'#fff',11);rr(ctx,x,42,216,6,r.color,4);txt(ctx,r.name,x+16,70,active?'#fff':r.color,12.5,true);txt(ctx,r.identity,x+16,94,active?'#fff':c.text,10.5,true);txt(ctx,r.job,x+16,116,active?'#fff':c.muted,9.8);});

    txt(ctx,'训练信号',28,157,c.muted,9.5,true);rr(ctx,96,142,112,34,c.green,8);ctxt(ctx,'Generator 产出 xG',152,164,'#fff',10,true);line(ctx,208,159,237,159,c.green,2);rr(ctx,241,137,126,27,c.blue,7);ctxt(ctx,'Real Score  sreal',304,155,'#fff',9,true);rr(ctx,241,169,126,27,c.purple,7);ctxt(ctx,'Fake Score  sfake',304,187,'#fff',9,true);line(ctx,367,151,402,166,c.blue,2);line(ctx,367,183,402,168,c.purple,2);rr(ctx,406,151,144,35,c.orange,8);ctxt(ctx,'sreal − sfake',478,173,'#fff',11,true);line(ctx,550,168,576,168,c.orange,2);rr(ctx,580,151,152,35,'#eef8f3',8);ctxt(ctx,'更新 Generator 学生',656,173,c.green,10,true);

    rr(ctx,28,215,248,105,'#fff',11);txt(ctx,'为什么低秩参数很少？',46,240,c.purple,11.5,true);txt(ctx,'完整更新：ΔW ∈ Rᵈˣᵈ',46,263,c.muted,10);txt(ctx,'LoRA：ΔW = B A',46,284,c.text,12,true);txt(ctx,'A ∈ Rʳˣᵈ，B ∈ Rᵈˣʳ，且 r ≪ d',46,306,c.green,9.5,true);
    rr(ctx,298,215,434,105,'#f7f9fc',11);rr(ctx,362,245,306,54,c.blue,12);ctxt(ctx,'Shared DiT Backbone · 基础权重 W 只保存一份',515,278,'#fff',12.5,true);
    const adapterColor=role===2?c.border:roles[role].color;rr(ctx,409,226,212,31,adapterColor,8);ctxt(ctx,role===2?'Real Score：不挂 LoRA':`${roles[role].weights}：挂载低秩增量`,515,247,role===2?c.muted:'#fff',10.5,true);line(ctx,515,257,515,266,role===2?c.border:c.green,3);txt(ctx,'角色切换只替换 ΔW',316,311,c.orange,10.5,true);txt(ctx,'主干前向计算仍然存在',570,311,c.muted,9.5,true);
  },[],760,332);
  const choose=(n:number)=>{roleRef.current=n;setRole(n);setAuto(false);};
  const roleNotes=['Generator 是最终保留下来的 8-NFE 学生；训练时挂载 ΔWᴳ，接收 score 差产生的更新。','Fake Score 不是教师，也不会部署；它是训练期辅助网络，用 ΔWᶠ 跟踪学生当前生成分布。','Real Score 对应冻结的目标/教师方向；使用原始基础权重 W，不挂载角色 LoRA。'];
  return <div><Canvas canvasRef={ref} label="Generator、Fake Score、Real Score 三个 DiT 角色与共享 LoRA 主干" width={760} height={332}/><div className="ctrl"><button className="btn secondary" onClick={()=>setAuto(v=>!v)}>{auto?'暂停自动演示':'继续自动演示'}</button><input aria-label="控制 LoRA 动态挂载阶段" type="range" min="0" max="2" value={role} onChange={e=>choose(Number(e.target.value))}/><span className="val">{role+1} / 3 · {roles[role].name}</span></div><div className="feedback good">{roleNotes[role]}</div><div className="lc-pipeline-note"><b>LoRA 节省的是可训练参数与模型驻留显存。</b>完整权重更新需要 d² 级参数；低秩分解只学习约 2dr 个参数，r 远小于 d。论文因此保留一份共享 DiT 权重 W，并按角色挂载 ΔWᴳ 或 ΔWᶠ；主干前向计算没有凭空消失。</div></div>;
};

export const SpeakerRouting:React.FC<WidgetProps>=()=>{
  const [stage,setStage]=useState(0);const [auto,setAuto]=useState(true);const stageRef=useRef(0);const titles=['人物跟踪与区域标注','ASD 标出目标说话人','注意力歧义导致背景串音','背景区域绑定 Silent'];
  useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>setStage(v=>{const next=(v+1)%4;stageRef.current=next;return next;}),2300);return()=>window.clearInterval(timer);},[auto]);
  const ref=useCanvas((ctx,time)=>{
    const stage=stageRef.current;const pulse=4+Math.abs(Math.sin(time/120))*7;txt(ctx,`${stage+1}. ${titles[stage]}`,28,27,stage===2?c.red:stage===3?c.green:c.blue,16,true);
    rr(ctx,28,42,704,35,'#fff',9);txt(ctx,'静音训练数据',46,64,c.purple,11,true);txt(ctx,'Qwen3-Omni ✓  +  Qwen3-VL ✓  →  两者都判断未说话才保留',162,64,c.text,11,true);
    const people=[{x:145,name:'目标 A',color:c.blue},{x:380,name:'目标 B',color:c.blue},{x:615,name:'背景人物',color:c.purple}];const tracks=[{x:62,name:'Audio A',color:c.green},{x:297,name:'Audio B',color:c.green},{x:532,name:'Silent',color:c.purple}];
    if(stage>=1){line(ctx,145,187,145,267,c.green,4);line(ctx,380,187,380,267,c.green,4);}if(stage===2){line(ctx,145,240,615,240,c.red,4,[7,5]);line(ctx,615,240,615,187,c.red,4,[7,5]);}if(stage===3)line(ctx,615,187,615,267,c.purple,5);
    tracks.forEach(track=>{rr(ctx,track.x,267,166,35,track.color,9);ctxt(ctx,track.name,track.x+83,290,'#fff',12,true);});
    people.forEach((person,i)=>{ctx.fillStyle=person.color;ctx.beginPath();ctx.arc(person.x,133,29,0,Math.PI*2);ctx.fill();const bgMoving=i===2&&stage===2;const mouth=i<2&&stage>=1?pulse:bgMoving?pulse:2;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(person.x,142,9,mouth,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=stage===0?c.orange:stage===3&&i===2?c.purple:c.border;ctx.lineWidth=3;ctx.strokeRect(person.x-47,96,94,91);rr(ctx,person.x-62,190,124,40,c.bg,7);ctxt(ctx,stage===0?`Track ${i<2?String.fromCharCode(65+i):'BG'}`:person.name,person.x,207,person.color,12,true);if(stage>=1&&i<2)ctxt(ctx,'ASD: speaking',person.x,224,c.green,10,true);});
    if(stage===2){rr(ctx,492,78,222,21,'#fff0f2',7);ctxt(ctx,'目标音频错误覆盖背景区域',603,93,c.red,10,true);}if(stage===3){rr(ctx,492,78,222,21,'#f0f8f4',7);ctxt(ctx,'背景类别 → 专用静音条件',603,93,c.purple,10,true);}txt(ctx,stage===3?'背景嘴部静止，仍可保留视线、呼吸和姿态微动':'区域与音轨的绑定会逐步建立',28,323,stage===3?c.green:c.muted,12,true);
  },[]);
  const macroRef=useCanvas((ctx,time)=>{const stage=stageRef.current;const active=stage===3?4:stage;const nodes=[['人物区域','Boxes / 类别'],['空间关联','L-RoPE + Ref Attn'],['音频条件','A / B / Silent'],['基础训练目标','Flow Matching MSE'],['推理结果','背景不随语音张嘴']] as const;
    txt(ctx,'宏观视角：Silent Condition 如何从训练条件变成推理行为',26,23,c.text,14.5,true);
    nodes.forEach((n,i)=>{const x=24+i*146;const on=i===active;const fail=stage===2&&i===2;rr(ctx,x,45,126,50,on?(fail?c.red:i===4?c.green:c.orange):'#fff',8);ctxt(ctx,n[0],x+63,65,on?'#fff':i===2?c.purple:c.blue,10,true);ctxt(ctx,n[1],x+63,83,on?'#fff':c.muted,7.8);if(i<4)line(ctx,x+126,70,x+143,70,i<active?c.green:c.border,2);});
    rr(ctx,24,113,220,72,'#f7f9fc',9);txt(ctx,'训练样本中的条件配对',41,135,c.blue,10.5,true);txt(ctx,'目标 A ↔ Speech A',41,155,c.green,9.5);txt(ctx,'目标 B ↔ Speech B',41,172,c.green,9.5);txt(ctx,'背景区域 ↔ Silent Track',132,155,c.purple,9.5,true);
    rr(ctx,263,113,224,72,stage===2?'#fff0f2':'#faf8ff',9);txt(ctx,'Audio Cross-Attention',280,135,stage===2?c.red:c.purple,10.5,true);txt(ctx,stage===2?'缺少背景条件 → 目标音频可泄漏':'区域 query 只读取对应 audio tokens',280,157,stage===2?c.red:c.text,9.2);txt(ctx,'Reference attention 建立人物区域对应',280,175,c.muted,8.8);
    rr(ctx,506,113,230,72,'#eef8f3',9);txt(ctx,'同一个 Base Flow-Matching Loss',523,135,c.green,10.2,true);txt(ctx,'L = ‖vpred(xₜ,c,t) − vₜ‖²',523,157,c.text,10,true);txt(ctx,'c 中包含区域对应的 Speech / Silent',523,175,c.muted,8.8);
    const mouth=stage===2?5+Math.abs(Math.sin(time/150))*7:2;ctx.fillStyle=stage===2?c.red:c.purple;ctx.beginPath();ctx.arc(380,207,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(380,211,5,mouth/3,0,0,Math.PI*2);ctx.stroke();ctxt(ctx,stage===2?'串音：背景被 Speech 驱动':'学到：Silent 不触发语音嘴部运动',520,212,stage===2?c.red:c.green,9.5,true);
  },[],760,220);
  const choose=(n:number)=>{stageRef.current=n;setStage(n);setAuto(false);};
  return <div><Canvas canvasRef={ref} label="多人跟踪、ASD、注意力绑定与 Silent Condition 自动动画"/><div className="ctrl"><button className="btn secondary" onClick={()=>setAuto(v=>!v)}>{auto?'暂停自动演示':'继续自动演示'}</button><input aria-label="控制 Silent Condition 绑定阶段" type="range" min="0" max="3" value={stage} onChange={e=>choose(Number(e.target.value))}/><span className="val">{stage+1} / 4 · {titles[stage]}</span></div><div className="feedback good">推理时，L-RoPE 与参考注意力把两个目标区域分别连接 Audio A、Audio B；额外的背景框类别避免区域混淆，Silent 音轨再为所有非目标人物提供明确条件。</div><div className="lc-subfigure-head"><span>TRAINING VIEW</span><b>训练时怎样学会“背景人物听到静音就不要跟着说话”？</b></div><Canvas canvasRef={macroRef} label="多人区域音频绑定、Flow Matching 损失与 Silent Condition 推理效果" width={760} height={220} compact/><div className="lc-pipeline-note"><b>论文没有额外定义一项 Silent loss。</b>Silent 是条件设计：背景区域在训练数据中显式绑定静音音轨，条件 c 连同视频潜变量进入原有 Flow Matching MSE；模型由这些配对学到静音条件不应触发语音驱动的嘴部运动。</div><div className="lc-evidence-grid"><span>ByteTrack：人物轨迹</span><span>ASD：说话区间</span><span>L-RoPE：区域—音轨</span><span>Silent：背景条件</span></div><PaperEvidence src="./images/fig7_silent_condition.png" alt="论文 Figure 7：多人视频在未使用和使用 Silent Condition 时的连续时间片对照" figure="Figure 7 · 第 12 页" title="真实多人序列：背景人物有没有被目标语音误驱动？">上方动画解释区域与音轨如何绑定；这组论文原图直接展示五个连续时间片。每帧上方的波形标出当时的发声状态。对比 <b>w/o Silent</b> 与 <b>w/ Silent</b> 两行，可以观察显式静音条件是否让非目标人物保持合适的闭口状态，并让开口动作跟随正确说话人。</PaperEvidence></div>;
};

const filterSteps=[
  {title:'来源设计',desc:'不同来源提供互补能力：嘴部细节、稳定音画监督、复杂动作、手物交互、节奏表演和非写实泛化。'},
  {title:'离线标注',desc:'完整视频或预切片只分析一次，生成可复用的人物、音频、同步、画质、镜头、运动和字幕元数据。'},
  {title:'在线窗口',desc:'训练实际读取的是局部时间窗口；采样后再次排查转场、黑白帧、曝光、边框、跳帧和异常运动。'},
  {title:'专项管线',desc:'多人、静音和情绪任务各自使用更严格的检测器与一致性规则，构造干净的专用监督。'},
];
const sourceCards=[['特写','嘴部清晰、脸占比高','口型细节与身份'],['访谈','主体稳定、语音清楚','可靠音画对应'],['表演','姿态与镜头变化丰富','动作和场景泛化'],['交互','持物、指向、操作','手部与物体关系'],['音乐','节奏、歌唱、强表情','韵律和表现力'],['动画','非写实外观与角色','跨风格泛化']];
export const DataCuration:React.FC<WidgetProps>=()=>{
  const [step,setStep]=useState(0);
  const ref=useCanvas((ctx,time)=>{txt(ctx,'数据质量决定监督质量',28,26,c.text,17,true);filterSteps.forEach((item,i)=>{const x=28+i*180;const active=i<=step;rr(ctx,x,43,155,38,active?(i===step?c.orange:c.blue):'#fff',9);txt(ctx,`${i+1}. ${item.title}`,x+19,68,active?'#fff':c.text,13,true);if(i<3)line(ctx,x+155,62,x+178,62,active?c.green:c.border,3);});
    if(step===0){sourceCards.forEach((s,i)=>{const col=i%3,row=Math.floor(i/3),x=28+col*244,y=105+row*82;rr(ctx,x,y,216,68,'#fff',10);txt(ctx,s[0],x+15,y+23,[c.blue,c.green,c.orange,c.purple,c.red,c.green][i],13,true);txt(ctx,s[1],x+66,y+23,c.muted,11);txt(ctx,`→ ${s[2]}`,x+15,y+51,c.text,12,true);});txt(ctx,'来源按“能为训练补什么能力”组织，直接混合容易带入分布噪声',28,307,c.orange,12,true);
    }else if(step===1){const tags=[['人物结构','人数 · 人脸 · 身体构图'],['音频状态','语音 · 人声分离'],['音画同步','偏移量 · 置信度'],['视觉质量','压缩 · 字幕 · 边框'],['镜头运动','景别 · 速度 · 运镜'],['语义字幕','全局 · 局部时间段']];tags.forEach((s,i)=>{const col=i%3,row=Math.floor(i/3),x=28+col*244,y=111+row*76;rr(ctx,x,y,216,61,'#fff',10);txt(ctx,s[0],x+15,y+23,c.blue,12,true);txt(ctx,s[1],x+15,y+46,c.muted,11);});rr(ctx,204,269,352,38,c.green,9);txt(ctx,'输出：可检索、可组合、可复用的结构化元数据',230,294,'#fff',12,true);
    }else if(step===2){txt(ctx,'完整视频通过离线检查后，采样窗口仍可能落在坏片段上；干净窗口则直接通过',40,111,c.muted,12);const bad=[3,10],segW=53;for(let i=0;i<12;i++){const x=50+i*segW;rr(ctx,x,150,44,58,bad.includes(i)?c.red:c.light,7);txt(ctx,bad.includes(i)?['转场','跳帧'][bad.indexOf(i)]:String(i+1),x+8,184,bad.includes(i)?'#fff':c.text,10,true);}const start=Math.floor((time/1100)%9);const hasBad=bad.some(i=>i>=start&&i<start+4);ctx.strokeStyle=hasBad?c.red:c.green;ctx.lineWidth=5;ctx.strokeRect(46+start*segW,142,4*segW,74);txt(ctx,`当前训练窗口：片段 ${start+1}–${start+4}`,50,244,hasBad?c.red:c.green,13,true);rr(ctx,450,232,270,43,hasBad?c.red:c.green,9);ctxt(ctx,hasBad?'拦截：包含异常帧，重新采样':'通过：窗口内没有异常帧',585,259,'#fff',12.5,true);txt(ctx,'在线检查项：时长 · 帧率 · 分辨率 · 曝光 · 边框 · 跳变 · 运动强度',50,306,c.text,11,true);
    }else{const pipes=[['多人数据','ByteTrack → ASD','保留无重叠说话段'],['静音数据','Qwen3-Omni → Qwen3-VL','双模型一致才保留'],['情绪数据','Qwen3-Omni → EmotiEffLib','过滤弱峰值与噪声']];pipes.forEach((s,i)=>{const x=28+i*244;rr(ctx,x,112,216,143,'#fff',11);txt(ctx,s[0],x+16,140,[c.blue,c.purple,c.orange][i],13,true);rr(ctx,x+16,158,184,35,[c.blue,c.purple,c.orange][i],8);txt(ctx,s[1],x+29,181,'#fff',11,true);line(ctx,x+108,193,x+108,215,c.green,3);txt(ctx,s[2],x+20,238,c.text,11,true);});txt(ctx,'通用数据池提供基础能力，专项管线补足多人归因、静音微动和情绪表现',78,305,c.green,12,true);}
  },[step]);
  return <div><Canvas canvasRef={ref} label="两阶段数据清洗流程"/><div className="ctrl"><button className="btn secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>上一步</button><span className="val">{step+1} / 4 · {filterSteps[step].title}</span><button className="btn" onClick={()=>setStep(Math.min(3,step+1))} disabled={step===3}>下一步</button></div><div className={`feedback ${step===3?'good':''}`}>{filterSteps[step].desc}</div></div>;
};

const metrics=[
  {name:'单人人类相似度',base:3.389,fast:3.336,max:4,unit:'',higher:true},
  {name:'协调性问题率',base:44.2,fast:45.0,max:60,unit:'%',higher:false},
  {name:'多人人类相似度',base:2.676,fast:2.730,max:4,unit:'',higher:true},
  {name:'合理性问题率',base:51.5,fast:32.4,max:60,unit:'%',higher:false},
  {name:'稳定性问题率',base:12.3,fast:4.3,max:20,unit:'%',higher:false},
  {name:'一致性问题率',base:6.2,fast:5.9,max:10,unit:'%',higher:false},
];
export const ResultConsole:React.FC<WidgetProps>=()=>{
  const [metric,setMetric]=useState(0);const m=metrics[metric];const fastWins=m.higher?m.fast>m.base:m.fast<m.base;
  const ref=useCanvas(ctx=>{txt(ctx,m.name,30,29,c.text,18,true);rr(ctx,600,10,132,28,m.higher?'#eef4fb':'#fff6e8',14);txt(ctx,m.higher?'越高越好 ↑':'越低越好 ↓',622,29,m.higher?c.blue:c.orange,12,true);const cards=[{name:'BASE',nfe:'150 NFE',value:m.base,color:fastWins?c.blue:c.green,x:28},{name:'FAST',nfe:'8 NFE',value:m.fast,color:fastWins?c.green:c.orange,x:402}];cards.forEach(card=>{rr(ctx,card.x,54,330,216,'#fff',14);rr(ctx,card.x,54,330,9,card.color,7);txt(ctx,card.name,card.x+22,90,card.color,15,true);txt(ctx,card.nfe,card.x+232,90,c.muted,12,true);txt(ctx,`${card.value}${m.unit}`,card.x+22,137,card.color,32,true);line(ctx,card.x+22,170,card.x+308,170,c.border,12);line(ctx,card.x+22,170,card.x+22+286*card.value/m.max,170,card.color,12);ctx.fillStyle=card.color;ctx.beginPath();ctx.arc(card.x+22+286*card.value/m.max,170,9,0,Math.PI*2);ctx.fill();txt(ctx,card.name==='BASE'?'Base 质量版本':'Fast 部署版本',card.x+22,211,c.text,13,true);txt(ctx,card.name==='BASE'?(fastWins?'当前指标略低':'当前指标更优'):(fastWins?'当前指标更优':'当前指标略低'),card.x+22,239,card.color,12,true);});const delta=Math.abs(m.fast-m.base);rr(ctx,247,284,266,32,fastWins?'#e8f6ee':'#eef4fb',16);ctxt(ctx,`${fastWins?'Fast':'Base'} 领先 ${delta.toFixed(m.unit?1:3)}${m.unit}`,380,305,fastWins?c.green:c.blue,12,true);txt(ctx,'Table 2',30,311,c.muted,11,true);},[metric]);
  const summaries=[
    '单人相似度小幅下降 0.053，Fast 基本保住了主观观感。',
    '协调性问题率中 Base 低 0.8 个百分点，这一项体现了蒸馏的轻微取舍。',
    '多人相似度提高 0.054，Fast 在这一项略高于 Base。',
    '合理性问题率下降 19.1 个百分点，是 Fast 最明显的改善之一。',
    '稳定性问题率从 12.3% 降至 4.3%，短步生成更稳定。',
    '一致性问题率下降 0.3 个百分点，两种版本接近。',
  ];
  return <div><Canvas canvasRef={ref} label="Base 与 Fast 论文结果卡片对比"/><div className="lc-metric-groups"><div className="base"><b>Base 略优 · 先讲表现力</b><div>{[0,1].map(i=><button key={metrics[i].name} className={`chip ${metric===i?'selected':''}`} onClick={()=>setMetric(i)}>{metrics[i].name}</button>)}</div></div><div className="fast"><b>Fast 更优 · 再讲部署性</b><div>{[2,3,4,5].map(i=><button key={metrics[i].name} className={`chip ${metric===i?'selected':''}`} onClick={()=>setMetric(i)}>{metrics[i].name}</button>)}</div></div></div><div className={`feedback ${fastWins?'good':'lc-base-win'}`}>{summaries[metric]} 表中数值来自论文 Table 2，评测包含 508 组图像—音频输入。</div><div className="lc-model-summary"><div className="lc-model-card base"><b>Base · 150 NFE</b><span>动作多样性、微表情、口型细节和镜头动态更丰富，适合追求表现力的场景。</span></div><div className="lc-model-card fast"><b>Fast · 8 NFE</b><span>稳定性更高，手部、身体和面部畸变更少；前向评估次数显著减少，更适合规模化部署。</span></div></div><div className="lc-speed-result"><div className="heading"><span>INFERENCE COST</span><b>论文给出的速度证据：一次采样需要多少次网络前向？</b></div><div className="base"><span>Base</span><strong>50 步 × 3 次</strong><b>150 NFE</b><i style={{width:'100%'}} /></div><div className="fast"><span>Fast</span><strong>8 步 × 1 次</strong><b>8 NFE</b><i style={{width:'5.33%'}} /></div><div className="ratio"><strong>18.75×</strong><span>前向次数之比</span><b>减少 94.7%</b></div><p>论文未报告秒级耗时、FPS、吞吐量或测试 GPU；18.75× 表示 NFE 比值，不能直接等同于真实墙钟速度提升。</p></div><div className="lc-evidence-grid"><span>770 名众包评测者</span><span>13,240 条判断</span><span>10 名领域专家</span><span>口型以 0.5× 复核</span></div></div>;
};

type CrossModel = {
  name:string;
  access:'open'|'closed';
  single:number;
  multi?:number;
  subject:number;
  jumpcut:number;
  lip:number;
  expression:number;
};
const crossModels:CrossModel[]=[
  {name:'LongCat 1.5',access:'open',single:3.336,multi:2.730,subject:23.1,jumpcut:.8,lip:31.6,expression:7.0},
  {name:'LongCat 1.0',access:'open',single:3.567,multi:2.768,subject:45.8,jumpcut:7.0,lip:37.0,expression:6.7},
  {name:'InfiniteTalk',access:'open',single:3.334,multi:2.339,subject:40.1,jumpcut:13.9,lip:32.7,expression:5.5},
  {name:'HeyGen',access:'closed',single:3.208,subject:26.5,jumpcut:1.1,lip:33.3,expression:3.7},
  {name:'OmniHuman 1.5',access:'closed',single:3.052,subject:55.1,jumpcut:3.6,lip:40.7,expression:1.2},
  {name:'Hedra',access:'closed',single:2.908,subject:28.1,jumpcut:5.0,lip:61.8,expression:5.0},
  {name:'Kling Avatar 2.0',access:'closed',single:2.953,subject:47.7,jumpcut:3.8,lip:38.1,expression:9.0},
  {name:'OmniAvatar',access:'open',single:2.933,subject:46.0,jumpcut:6.4,lip:58.4,expression:3.5},
];
const crossMetrics=[
  {key:'single',label:'单人拟人度',direction:'越高越好',figure:'Figure 8',higher:true,digits:3},
  {key:'multi',label:'多人拟人度',direction:'越高越好',figure:'Figure 8',higher:true,digits:3},
  {key:'subject',label:'主体畸变率',direction:'越低越好',figure:'Figure 10',higher:false,digits:1},
  {key:'jumpcut',label:'画面跳帧率',direction:'越低越好',figure:'Figure 12',higher:false,digits:1},
  {key:'lip',label:'口型问题率',direction:'越低越好',figure:'Figure 13',higher:false,digits:1},
  {key:'expression',label:'表情不自然率',direction:'越低越好',figure:'Figure 16',higher:false,digits:1},
] as const;
const crossSummaries=[
  '单人拟人度由 LongCat 1.0 以 3.567 分领先；LongCat 1.5 为 3.336，与 InfiniteTalk 的 3.334 基本持平。',
  '论文只对具备多人能力的三个模型报告这一项：LongCat 1.0 为 2.768，LongCat 1.5 为 2.730，InfiniteTalk 为 2.339。',
  'LongCat 1.5 的主体畸变率最低，为 23.1%；HeyGen 以 26.5% 排在第二。',
  'LongCat 1.5 的画面跳帧率为 0.8%，在八个被测系统中最低；HeyGen 为 1.1%。',
  'LongCat 1.5 的口型问题率为 31.6%，略低于 InfiniteTalk 的 32.7% 和 HeyGen 的 33.3%。',
  '面部表情自然度是 LongCat 1.5 的相对短板：OmniHuman 1.5 的问题率最低，仅 1.2%；LongCat 1.5 为 7.0%。',
];
const commercialAB=[
  {name:'HeyGen',ours:48.7,tie:11.1,other:40.1},
  {name:'Kling Avatar 2.0',ours:60.5,tie:10.7,other:28.8},
  {name:'OmniHuman 1.5',ours:55.3,tie:11.5,other:33.1},
];

export const CrossModelBench:React.FC<WidgetProps>=()=>{
  const [metric,setMetric]=useState(0);const spec=crossMetrics[metric];
  const ref=useCanvas(ctx=>{
    const values=crossModels.map(m=>m[spec.key] as number|undefined);const reported=values.filter((v):v is number=>v!==undefined);const max=Math.max(...reported)*1.08;
    const rows=crossModels.map((model,i)=>({model,value:values[i]})).sort((a,b)=>{if(a.value===undefined)return 1;if(b.value===undefined)return-1;return spec.higher?b.value-a.value:a.value-b.value;});
    txt(ctx,`${spec.label} · ${spec.direction}`,26,25,c.text,16,true);rr(ctx,585,8,148,27,'#fff',13);ctxt(ctx,`${spec.figure} · 论文原值`,659,26,c.muted,10,true);
    rows.forEach((row,i)=>{const y=45+i*35;const ours=row.model.name==='LongCat 1.5';const open=row.model.access==='open';const color=ours?c.green:open?c.blue:'#8b95a5';
      if(ours){rr(ctx,20,y-6,718,31,'#eef8f3',8);rr(ctx,20,y-6,4,31,c.green,2);}
      ctxt(ctx,row.value===undefined?'—':String(i+1),35,y+13,row.value===undefined?c.muted:ours?c.green:c.text,10,true);
      txt(ctx,row.model.name,51,y+13,ours?c.green:c.text,row.model.name.length>16?9.5:10.5,true);
      rr(ctx,157,y-2,37,19,open?'#eaf1f8':'#f2eef9',8);ctxt(ctx,open?'开源':'闭源',175.5,y+11,open?c.blue:c.purple,8.2,true);
      if(row.value===undefined){rr(ctx,211,y-1,474,18,'#f3f5f8',8);ctxt(ctx,'论文未报告该模型的多人结果',448,y+12,c.muted,8.8);txt(ctx,'—',704,y+13,c.muted,10,true);return;}
      rr(ctx,211,y,474,12,'#edf1f5',6);rr(ctx,211,y,Math.max(8,474*row.value/max),12,color,6);txt(ctx,`${row.value.toFixed(spec.digits)}${spec.higher?'':'%'}`,696,y+11,color,9.5,true);
    });
    rr(ctx,26,332,707,28,'#fff',10);txt(ctx,'排序随指标方向自动变化',42,351,c.muted,9.5);txt(ctx,'绿色：本文 Fast · 蓝色：公开代码/权重 · 灰紫：商业或未公开权重',260,351,c.text,9.5,true);
  },[metric],760,372);
  const abRef=useCanvas(ctx=>{
    txt(ctx,'匿名 A/B：相同输入下，评测者更偏好哪一个？',25,23,c.text,14.5,true);txt(ctx,'仅单人样本 · Figure 1b',575,23,c.muted,9.5,true);
    commercialAB.forEach((r,i)=>{const y=48+i*39;txt(ctx,`vs. ${r.name}`,25,y+13,c.text,r.name.length>14?9.5:10.5,true);const x=157,w=568;rr(ctx,x,y,w,23,'#eef1f4',7);rr(ctx,x,y,w*r.ours/100,23,c.green,7);rr(ctx,x+w*r.ours/100,y,w*r.tie/100,23,'#d8dee7',0);txt(ctx,`${r.ours}%`,x+10,y+16,'#fff',9.5,true);ctxt(ctx,`${r.tie}%`,x+w*(r.ours+r.tie/2)/100,y+16,c.muted,8.2,true);ctxt(ctx,`${r.other}%`,x+w*(r.ours+r.tie+r.other/2)/100,y+16,c.text,9,true);});
    rr(ctx,157,166,12,12,c.green,4);txt(ctx,'LongCat 1.5 获胜',176,176,c.green,9.5,true);rr(ctx,302,166,12,12,'#d8dee7',4);txt(ctx,'平局',321,176,c.muted,9.5,true);rr(ctx,382,166,12,12,'#aab2bf',4);txt(ctx,'对手获胜',401,176,c.text,9.5,true);
  },[],760,190);
  return <div><Canvas canvasRef={ref} label="LongCat 1.5 与开源及闭源数字人模型的论文指标排行榜" width={760} height={372}/><ChipRow labels={crossMetrics.map(x=>x.label)} value={metric} onChange={setMetric}/><div className={`feedback ${metric===5?'lc-base-win':'good'}`}>{crossSummaries[metric]} 排名只适用于论文自建 benchmark 与对应评测协议。</div><div className="lc-version-context"><div className="head"><span>READ THIS FIRST</span><b>为什么 1.5 没有全面超过 1.0？</b><p>横向评测里的“LongCat 1.5”是经过 DMD2 蒸馏的 <strong>Fast · 8 NFE</strong>，并非 150 NFE 的 Base。论文明确把它定义为表现力与部署成本之间的取舍。</p></div><div className="wins"><b>1.5 更好 · 结构与同步</b><span>背景畸变 · 主体畸变 · 跳帧 · 口型同步 · 脸身同步</span></div><div className="trade"><b>1.0 略好 · 灵动与部分时序观感</b><span>单人/多人拟人度 · 色调累积 · 身体自然度 · 表情自然度</span></div></div><div className="lc-subfigure-head"><span>COMMERCIAL A/B</span><b>面对三套商业系统，LongCat 1.5 的整体偏好是否占优？</b></div><Canvas canvasRef={abRef} label="LongCat 1.5 与 HeyGen、Kling Avatar 2.0、OmniHuman 1.5 的匿名偏好测试" width={760} height={190} compact/><div className="lc-availability"><div className="open"><b>公开代码与权重</b><span>LongCat 1.5 · LongCat 1.0 · InfiniteTalk · OmniAvatar</span></div><div className="closed"><b>商业或未公开权重</b><span>HeyGen · OmniHuman 1.5 · Hedra · Kling Avatar 2.0</span></div></div><div className="lc-pipeline-note"><b>两种证据不能混读。</b>上方排行榜来自绝对评分或专家问题率；A/B 图让评测者在同一输入的两个匿名结果之间直接选择。开放状态按论文发布期的官方代码与权重可用性归类，所有性能数字均来自本文 Figures 1、8、10、12、13、16。</div></div>;
};
