import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 330;
const c = { bg:'#f5f8f0', panel:'#fff', light:'#b8c9a7', dark:'#76906a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea' };
type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function useCanvas(draw: Draw, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H); let raf = 0; let running = false;
    const frame = (time:number) => { ctx.clearRect(0,0,W,H); ctx.fillStyle=c.bg; ctx.fillRect(0,0,W,H); draw(ctx,time); if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready'); if(running)raf=requestAnimationFrame(frame); };
    const start=()=>{if(!running){running=true;raf=requestAnimationFrame(frame);}}; const stop=()=>{running=false;cancelAnimationFrame(raf);};
    const disconnect=observeCanvas(canvas,start,stop); return()=>{stop();disconnect();};
  }, deps);
  return ref;
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,r=10){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function txt(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color=c.text,size=14,bold=false){ctx.fillStyle=color;ctx.font=`${bold?700:500} ${size}px system-ui,sans-serif`;ctx.fillText(s,x,y);}
function ctxt(ctx:CanvasRenderingContext2D,s:string,cx:number,y:number,color=c.text,size=14,bold=false){ctx.fillStyle=color;ctx.font=`${bold?700:500} ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(s,cx,y);ctx.textAlign='start';}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=3,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
function ChipRow({labels,value,onChange}:{labels:string[];value:number;onChange:(n:number)=>void}){return <div className="ctrl lc-chip-row" role="group">{labels.map((x,i)=><button key={x} className={`chip ${i===value?'selected':''}`} onClick={()=>onChange(i)} aria-pressed={i===value}>{x}</button>)}</div>;}
function Canvas({canvasRef,label}:{canvasRef:React.Ref<HTMLCanvasElement>;label:string}){return <div className="lc-canvas-shell"><canvas ref={canvasRef} width={W} height={H} aria-label={label}/></div>;}

export const FailureLab:React.FC<WidgetProps>=()=>{
  const [scene,setScene]=useState(0);
  const requirements=[
    ['短片生成','已经可用','已经可用'],
    ['复杂发音','ASR / 音素识别不准','需要准确识别'],
    ['手脸结构','偶发崩坏','需要可靠'],
    ['推理成本','成本较高','需要可部署'],
    ['多人串音','音轨归因错误','需要准确绑定'],
    ['长时一致性','容易漂移','需要持续稳定'],
  ];
  const ref=useCanvas(ctx=>{
    txt(ctx,scene===0?'研究演示：核心生成能力已经成立':'商业部署：五项额外要求必须长期满足',28,34,scene===0?c.blue:c.orange,18,true);
    requirements.forEach((r,i)=>{
      const y=64+i*40; const available=scene===0?i===0:true; const text=scene===0?r[1]:r[2];
      rr(ctx,28,y,205,30,'#fff',8); txt(ctx,r[0],44,y+21,c.text,14,true);
      rr(ctx,250,y,472,30,available?(scene===0?c.blue:c.green):(scene===0?c.red:c.orange),8);
      txt(ctx,text,270,y+21,'#fff',13,true);
    });
    txt(ctx,scene===0?'研究 Demo 证明“能生成”':'产品要求覆盖同步、结构、成本、多人和长时',28,318,scene===0?c.blue:c.green,14,true);
  },[scene]);
  return <div><Canvas canvasRef={ref} label="研究演示与商业部署要求对比"/><ChipRow labels={['研究演示','商业部署']} value={scene} onChange={setScene}/><div className={`feedback ${scene?'good':''}`}>{scene===0?'现有研究已经能从图片和音频生成数字人短片，复杂条件下的可靠性仍有限。':'LongCat 1.5 围绕五项产品要求组织数据、模型和后训练，并以开源方式发布。'}</div></div>;
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
  const ref=useCanvas(ctx=>{txt(ctx,'问题',42,26,c.muted,12,true);txt(ctx,'原来',233,26,c.muted,12,true);txt(ctx,'LongCat 1.5',518,26,c.muted,12,true);fixes.forEach((f,i)=>{const y=38+i*52;const active=i===selected;rr(ctx,28,y,160,36,active?c.red:'#fff',9);rr(ctx,214,y,218,36,active?'#fff':'#fff',9);rr(ctx,492,y,240,36,active?f.color:'#fff',9);txt(ctx,f.problem,48,y+23,active?'#fff':c.text,13,true);txt(ctx,f.from,230,y+23,active?c.red:c.muted,12,true);txt(ctx,f.to,510,y+23,active?'#fff':f.color,12,true);line(ctx,442,y+18,480,y+18,active?f.color:c.border,active?5:2);ctx.fillStyle=active?f.color:c.border;ctx.beginPath();ctx.moveTo(480,y+18);ctx.lineTo(469,y+11);ctx.lineTo(469,y+25);ctx.fill();});rr(ctx,118,300,524,24,'#fff',8);txt(ctx,fixes[selected].detail,210,317,fixes[selected].color,13,true);},[selected]);
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
  return <div><Canvas canvasRef={ref} label="Wav2Vec2 与 Whisper 嘴型轨迹和结构比较"/><div className="ctrl"><button className="btn" onClick={start}>同步播放这段发音</button><span className="val">/p/ → /i/ → /a/</span></div><div className="feedback good">Whisper-large 的规模、多语言预训练和多层上下文表示更适合捕捉连续音素变化。论文未报告定量嘴型轨迹，图中动画用于解释其定性观察。</div></div>;
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
    }else{const nodes=[['Text Cross-Attn',70,c.blue],['Audio Cross-Attn',294,c.green],['FFN',548,c.blue]] as const;nodes.forEach((n,i)=>{rr(ctx,n[1],191,i===1?174:134,58,n[2],10);txt(ctx,n[0],n[1]+16,225,'#fff',12,true);if(i<2){line(ctx,n[1]+(i===1?174:134),220,nodes[i+1][1]-12,220,c.orange,4);}});const tokenX=70+Math.min(1,local)*478;ctx.fillStyle=c.orange;ctx.beginPath();ctx.arc(tokenX,174,8,0,Math.PI*2);ctx.fill();txt(ctx,'Audio ∈ ℝ^(T×5×1280) · 按潜变量时间步注入',197,276,c.green,13,true);}
  },[]);
  const change=(n:number)=>{const v=n/100;setPlaying(false);setProgress(v);progressRef.current=v;};const step=Math.min(4,Math.floor(progress*5));
  return <div><Canvas canvasRef={ref} label="Whisper 33 层特征分组、时间对齐与 DiT 注入动画"/><div className="ctrl"><button className="btn" onClick={()=>setPlaying(v=>!v)}>{playing?'暂停动画':'继续播放'}</button><input aria-label="拖动查看音频对齐过程" type="range" min="0" max="99" value={Math.round(progress*100)} onChange={e=>change(Number(e.target.value))}/><span className="val">{step+1} / 5</span></div><div className={`feedback ${step===4?'good':''}`}>{alignSteps[step][1]}。拖动时间轴可停在任一阶段查看细节。</div></div>;
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
  const [hands,setHands]=useState(0);
  const ref=useCanvas(ctx=>{txt(ctx,'首帧手部检查如何接入偏好优化',28,27,c.text,17,true);const nodes=[['I2V / 续写样本',28,150,c.blue],['MediaPipe 检测',215,150,hands?c.green:c.red],['手部样本比例',402,150,hands?c.orange:c.muted],['Per-frame GRPO',589,143,hands?c.green:c.blue]] as const;nodes.forEach((n,i,a)=>{rr(ctx,n[1],44,n[2],42,n[3],9);txt(ctx,n[0],n[1]+14,70,'#fff',12,true);if(i<a.length-1)line(ctx,n[1]+n[2],65,a[i+1][1]-10,65,hands?c.green:c.border,3);});
    rr(ctx,28,112,300,186,'#fff',13);txt(ctx,'条件首帧',48,139,c.blue,13,true);ctx.fillStyle=c.blue;ctx.beginPath();ctx.arc(177,177,31,0,Math.PI*2);ctx.fill();line(ctx,177,208,177,261,c.text,7);line(ctx,177,225,128,260,hands?c.orange:c.text,9);line(ctx,177,225,226,260,hands?c.orange:c.text,9);if(hands){ctx.strokeStyle=c.orange;ctx.lineWidth=4;ctx.strokeRect(111,246,33,29);ctx.strokeRect(210,246,33,29);}txt(ctx,hands?'检测结果：双手可见':'检测结果：未发现可见手部',50,288,hands?c.green:c.red,13,true);
    rr(ctx,360,112,372,84,hands?'#f0faf4':'#f8f9fb',12);txt(ctx,hands?'提高这类样本在偏好优化中的比例':'保持普通采样，不建立手部专项监督',382,142,hands?c.green:c.muted,14,true);txt(ctx,hands?'逐帧奖励可针对手部变形提供信号':'无手首帧无法提供有效的条件手部监督',382,171,hands?c.text:c.muted,12);
    rr(ctx,360,214,372,84,'#fff',12);txt(ctx,'面部质量走哪条路径？',382,242,c.purple,13,true);txt(ctx,'多奖励 GRPO + 数据清洗 + 蒸馏共同改善',382,270,c.text,12,true);txt(ctx,'论文未设置对应的首帧面部检查',382,290,c.muted,11);
  },[hands]);
  return <div><Canvas canvasRef={ref} label="首帧手部检测接入 Per-frame GRPO 的训练管线"/><ChipRow labels={['首帧无手','首帧有手']} value={hands} onChange={setHands}/><div className={`feedback ${hands?'good':'bad'}`}>{hands?'MediaPipe 检测到可见手部后，训练会提高这类样本的占比，让手部奖励拥有更多有效监督机会。':'该样本仍可参与整体偏好优化，但不会被当作手部专项监督样本。'}</div></div>;
};

export const NfeRace:React.FC<WidgetProps>=()=>{
  const [run,setRun]=useState(0);const started=useRef(0);
  const ref=useCanvas((ctx,time)=>{if(run&&started.current===0)started.current=time;const elapsed=run?(time-started.current)/1000:0;const base=Math.min(1,elapsed/4.5);const fast=Math.min(1,elapsed/.9);txt(ctx,'同一噪声起点 · 相同终点尺度',30,31,c.text,17,true);
    [['Base',base,150,c.blue],['Fast',fast,8,c.green]].forEach((r,i)=>{const y=90+i*105;txt(ctx,`${r[0]} · ${r[2]} NFE`,32,y-16,r[3] as string,15,true);rr(ctx,32,y,670,28,c.border,14);rr(ctx,32,y,670*(r[1] as number),28,r[3] as string,14);ctx.fillStyle=r[3] as string;ctx.beginPath();ctx.arc(32+670*(r[1] as number),y+14,18,0,Math.PI*2);ctx.fill();});txt(ctx,'NFE 数量 ≠ 端到端耗时',514,310,c.orange,13,true);},[run]);
  const start=()=>{started.current=0;setRun(v=>v+1);};
  return <div><Canvas canvasRef={ref} label="Base 与 Fast 前向评估次数对比"/><div className="ctrl"><button className="btn" onClick={start}>从同一噪声开始</button><span className="val">150 vs 8 NFE</span></div><div className="feedback good">Fast 将前向评估次数减少约 18.75 倍；论文未给出足以换算为相同墙钟加速倍数的完整测速。</div></div>;
};

const roles=[['Generator LoRA','W + ΔWᴳ','生成 8-NFE 样本'],['Fake Score LoRA','W + ΔWᶠ','估计生成分布的 score'],['Real Score','仅使用 W','教师分布提供 real-score guidance']];
export const LoraMemory:React.FC<WidgetProps>=()=>{
  const [role,setRole]=useState(0);const [auto,setAuto]=useState(true);const roleRef=useRef(0);
  useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>setRole(v=>{const next=(v+1)%3;roleRef.current=next;return next;}),2400);return()=>window.clearInterval(timer);},[auto]);
  const ref=useCanvas(ctx=>{const role=roleRef.current;txt(ctx,'为什么需要 LoRA：DMD2 原本要同时维护三个同构模型',28,24,c.text,16,true);rr(ctx,28,39,330,55,'#fff',10);txt(ctx,'常规方案',46,62,c.red,12,true);txt(ctx,'Generator DiT + Fake DiT + Real DiT',46,83,c.text,12,true);rr(ctx,380,39,352,55,'#f0faf4',10);txt(ctx,'本文方案',398,62,c.green,12,true);txt(ctx,'1× 共享 DiT + 2× 低秩参数增量',398,83,c.text,12,true);
    rr(ctx,252,126,256,92,c.blue,15);ctxt(ctx,'Shared DiT · 基础权重 W',380,160,'#fff',15,true);ctxt(ctx,roles[role][2],380,194,'#fff',12,true);
    const adapterColor=role===2?c.border:c.purple;rr(ctx,304,103,152,34,adapterColor,9);ctxt(ctx,role===2?'卸下 LoRA':roles[role][0],380,126,role===2?c.muted:'#fff',12,true);line(ctx,380,137,380,151,role===2?c.border:c.green,5);txt(ctx,roles[role][1],532,150,role===2?c.blue:c.purple,13,true);txt(ctx,'LoRA 只学习低秩增量 ΔW = BA',532,174,c.muted,11);txt(ctx,'无需复制整套 DiT 权重',532,196,c.green,11,true);
    roles.forEach((r,i)=>{const x=28+i*244;const active=i===role;if(i<2)line(ctx,x+216+5,281,x+238-5,281,active?c.green:c.border,3);rr(ctx,x,258,216,46,active?(i===2?c.blue:c.purple):'#fff',10);ctxt(ctx,`${i+1}. ${r[0]}`,x+108,278,active?'#fff':c.text,12,true);ctxt(ctx,active?'正在挂载 / 使用':'等待切换',x+108,296,active?'#fff':c.muted,10);});ctxt(ctx,'动态挂载 = 保留同一 W，只替换当前需要的 ΔW',380,325,c.orange,12,true);},[]);
  const choose=(n:number)=>{roleRef.current=n;setRole(n);setAuto(false);};
  return <div><Canvas canvasRef={ref} label="DMD2 共享 DiT、LoRA 低秩增量与动态挂载过程"/><div className="ctrl"><button className="btn secondary" onClick={()=>setAuto(v=>!v)}>{auto?'暂停自动演示':'继续自动演示'}</button><input aria-label="控制 LoRA 动态挂载阶段" type="range" min="0" max="2" value={role} onChange={e=>choose(Number(e.target.value))}/><span className="val">{role+1} / 3 · {roles[role][0]}</span></div><div className="feedback good">LoRA 把角色差异存成小型低秩增量 ΔW。当前阶段：{roles[role][2]}。拖动进度条可直接检查挂载 Generator、切换 Fake Score 和卸下适配器三个状态。</div></div>;
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
  const choose=(n:number)=>{stageRef.current=n;setStage(n);setAuto(false);};
  return <div><Canvas canvasRef={ref} label="多人跟踪、ASD、注意力绑定与 Silent Condition 自动动画"/><div className="ctrl"><button className="btn secondary" onClick={()=>setAuto(v=>!v)}>{auto?'暂停自动演示':'继续自动演示'}</button><input aria-label="控制 Silent Condition 绑定阶段" type="range" min="0" max="3" value={stage} onChange={e=>choose(Number(e.target.value))}/><span className="val">{stage+1} / 4 · {titles[stage]}</span></div><div className="feedback good">推理时，L-RoPE 与参考注意力把两个目标区域分别连接 Audio A、Audio B；额外的背景框类别避免区域混淆，Silent 音轨再为所有非目标人物提供明确条件。</div><div className="lc-evidence-grid"><span>ByteTrack：人物轨迹</span><span>ASD：说话区间</span><span>L-RoPE：区域—音轨</span><span>Silent：背景条件</span></div></div>;
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
    }else if(step===2){txt(ctx,'完整视频通过离线检查后，采样窗口仍可能落在坏片段上',40,111,c.muted,12);const bad=[3,7,10],segW=53;for(let i=0;i<12;i++){const x=50+i*segW;rr(ctx,x,150,44,58,bad.includes(i)?c.red:c.light,7);txt(ctx,bad.includes(i)?['转场','闪白','跳帧'][bad.indexOf(i)]:String(i+1),x+8,184,bad.includes(i)?'#fff':c.text,10,true);}const start=Math.floor((time/900)%9);const hasBad=bad.some(i=>i>=start&&i<start+4);ctx.strokeStyle=hasBad?c.red:c.green;ctx.lineWidth=5;ctx.strokeRect(46+start*segW,142,4*segW,74);txt(ctx,`当前训练窗口：片段 ${start+1}–${start+4}`,50,244,hasBad?c.red:c.green,13,true);rr(ctx,450,232,270,43,hasBad?c.red:c.green,9);txt(ctx,hasBad?'拦截：重新采样':'通过：送入训练',526,259,'#fff',13,true);txt(ctx,'在线检查项：时长 · 帧率 · 分辨率 · 曝光 · 边框 · 跳变 · 运动强度',50,306,c.text,11,true);
    }else{const pipes=[['多人数据','ByteTrack → ASD','保留无重叠说话段'],['静音数据','Qwen3-Omni → Qwen3-VL','双模型一致才保留'],['情绪数据','Qwen3-Omni → EmotiEffLib','过滤弱峰值与噪声']];pipes.forEach((s,i)=>{const x=28+i*244;rr(ctx,x,112,216,143,'#fff',11);txt(ctx,s[0],x+16,140,[c.blue,c.purple,c.orange][i],13,true);rr(ctx,x+16,158,184,35,[c.blue,c.purple,c.orange][i],8);txt(ctx,s[1],x+29,181,'#fff',11,true);line(ctx,x+108,193,x+108,215,c.green,3);txt(ctx,s[2],x+20,238,c.text,11,true);});txt(ctx,'通用数据池提供基础能力，专项管线补足多人归因、静音微动和情绪表现',78,305,c.green,12,true);}
  },[step]);
  return <div><Canvas canvasRef={ref} label="两阶段数据清洗流程"/><div className="ctrl"><button className="btn secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>上一步</button><span className="val">{step+1} / 4 · {filterSteps[step].title}</span><button className="btn" onClick={()=>setStep(Math.min(3,step+1))} disabled={step===3}>下一步</button></div><div className={`feedback ${step===3?'good':''}`}>{filterSteps[step].desc}</div></div>;
};

const metrics=[
  {name:'单人人类相似度',base:3.389,fast:3.336,max:4,unit:'',higher:true},
  {name:'多人人类相似度',base:2.676,fast:2.730,max:4,unit:'',higher:true},
  {name:'合理性问题率',base:51.5,fast:32.4,max:60,unit:'%',higher:false},
  {name:'协调性问题率',base:44.2,fast:45.0,max:60,unit:'%',higher:false},
  {name:'稳定性问题率',base:12.3,fast:4.3,max:20,unit:'%',higher:false},
  {name:'一致性问题率',base:6.2,fast:5.9,max:10,unit:'%',higher:false},
];
export const ResultConsole:React.FC<WidgetProps>=()=>{
  const [metric,setMetric]=useState(4);const m=metrics[metric];const fastWins=m.higher?m.fast>m.base:m.fast<m.base;
  const ref=useCanvas(ctx=>{txt(ctx,m.name,30,29,c.text,18,true);rr(ctx,600,10,132,28,m.higher?'#eef4fb':'#fff6e8',14);txt(ctx,m.higher?'越高越好 ↑':'越低越好 ↓',622,29,m.higher?c.blue:c.orange,12,true);const cards=[{name:'BASE',nfe:'150 NFE',value:m.base,color:c.blue,x:28},{name:'FAST',nfe:'8 NFE',value:m.fast,color:fastWins?c.green:c.orange,x:402}];cards.forEach(card=>{rr(ctx,card.x,54,330,216,'#fff',14);rr(ctx,card.x,54,330,9,card.color,7);txt(ctx,card.name,card.x+22,90,card.color,15,true);txt(ctx,card.nfe,card.x+232,90,c.muted,12,true);txt(ctx,`${card.value}${m.unit}`,card.x+22,137,card.color,32,true);line(ctx,card.x+22,170,card.x+308,170,c.border,12);line(ctx,card.x+22,170,card.x+22+286*card.value/m.max,170,card.color,12);ctx.fillStyle=card.color;ctx.beginPath();ctx.arc(card.x+22+286*card.value/m.max,170,9,0,Math.PI*2);ctx.fill();txt(ctx,card.name==='BASE'?'教师质量基准':'蒸馏部署版本',card.x+22,211,c.text,13,true);txt(ctx,card.name==='BASE'?'表现力与细节更充分':fastWins?'当前指标更优':'当前指标存在取舍',card.x+22,239,card.name==='BASE'?c.blue:card.color,12);});const delta=Math.abs(m.fast-m.base);rr(ctx,247,284,266,32,fastWins?'#e8f6ee':'#fff3e1',16);txt(ctx,`Fast ${fastWins?'改善':'变化'} ${delta.toFixed(metric<2?3:1)}${m.unit}`,327,305,fastWins?c.green:c.orange,12,true);txt(ctx,'Table 2',30,311,c.muted,11,true);},[metric]);
  const summaries=[
    '单人相似度小幅下降 0.053，Fast 基本保住了主观观感。',
    '多人相似度提高 0.054，Fast 在这一项略高于 Base。',
    '合理性问题率下降 19.1 个百分点，是 Fast 最明显的改善之一。',
    '协调性问题率上升 0.8 个百分点，这一项体现了蒸馏带来的质量取舍。',
    '稳定性问题率从 12.3% 降至 4.3%，短步生成更稳定。',
    '一致性问题率下降 0.3 个百分点，两种版本接近。',
  ];
  return <div><Canvas canvasRef={ref} label="Base 与 Fast 论文结果卡片对比"/><ChipRow labels={metrics.map(x=>x.name)} value={metric} onChange={setMetric}/><div className={`feedback ${fastWins?'good':'bad'}`}>{summaries[metric]} 表中数值来自论文 Table 2，评测包含 508 组图像—音频输入。</div><div className="lc-model-summary"><div className="lc-model-card base"><b>Base · 150 NFE</b><span>动作多样性、微表情、口型细节和镜头动态更丰富，适合追求表现力的场景。</span></div><div className="lc-model-card fast"><b>Fast · 8 NFE</b><span>稳定性更高，手部、身体和面部畸变更少；前向评估次数减少约 18.75 倍，更适合规模化部署。</span></div></div><div className="lc-evidence-grid"><span>770 名众包评测者</span><span>13,240 条判断</span><span>10 名领域专家</span><span>口型以 0.5× 复核</span></div></div>;
};
