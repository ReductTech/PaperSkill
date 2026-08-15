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
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=3,dash:number[]=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
function ChipRow({labels,value,onChange}:{labels:string[];value:number;onChange:(n:number)=>void}){return <div className="ctrl lc-chip-row" role="group">{labels.map((x,i)=><button key={x} className={`chip ${i===value?'selected':''}`} onClick={()=>onChange(i)} aria-pressed={i===value}>{x}</button>)}</div>;}
function Canvas({canvasRef,label}:{canvasRef:React.Ref<HTMLCanvasElement>;label:string}){return <div className="lc-canvas-shell"><canvas ref={canvasRef} width={W} height={H} aria-label={label}/></div>;}

export const FailureLab:React.FC<WidgetProps>=()=>{
  const [scene,setScene]=useState(0);
  const requirements=[
    ['短片生成','已经可用','已经可用'],
    ['复杂发音','容易僵硬','需要稳定'],
    ['手脸结构','偶发崩坏','需要可靠'],
    ['推理成本','成本较高','需要可部署'],
    ['多人归因','可能串音','需要准确'],
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
  {problem:'嘴型不准',solution:'Whisper-large',detail:'多层声学表示 + 时间对齐',color:c.blue},
  {problem:'局部崩坏',solution:'Per-frame GRPO',detail:'时间分区奖励 + 手部样本优先',color:c.green},
  {problem:'推理太贵',solution:'DMD2',detail:'150 NFE → 8 NFE',color:c.orange},
  {problem:'多人串音',solution:'Silent Condition',detail:'背景人物显式绑定静音轨',color:c.purple},
  {problem:'长时漂移',solution:'Data Curation',detail:'离线标注 + 在线片段验证',color:c.green},
];
export const SolutionMap:React.FC<WidgetProps>=()=>{
  const [selected,setSelected]=useState(0);
  const ref=useCanvas(ctx=>{fixes.forEach((f,i)=>{const y=42+i*53;const active=i===selected;rr(ctx,28,y,205,38,active?c.red:'#fff',9);rr(ctx,522,y,205,38,active?f.color:'#fff',9);txt(ctx,f.problem,52,y+25,active?'#fff':c.text,14,true);txt(ctx,f.solution,546,y+25,active?'#fff':f.color,14,true);line(ctx,244,y+19,510,y+19,active?f.color:c.border,active?5:2);if(active){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(510,y+19);ctx.lineTo(497,y+12);ctx.lineTo(497,y+26);ctx.fill();}});txt(ctx,fixes[selected].detail,270,315,fixes[selected].color,15,true);},[selected]);
  return <div><Canvas canvasRef={ref} label="五类商用故障与解决方案映射"/><ChipRow labels={fixes.map(x=>x.problem)} value={selected} onChange={setSelected}/><div className="feedback good"><b>{fixes[selected].solution}</b>：{fixes[selected].detail}</div></div>;
};

export const PhonemeCompare:React.FC<WidgetProps>=()=>{
  const [playing,setPlaying]=useState(false);const startRef=useRef(0);
  const ref=useCanvas((ctx,time)=>{if(playing&&startRef.current===0)startRef.current=time;const p=playing?Math.min(1,(time-startRef.current)/3200):0;const labels=['/p/ 闭唇','/i/ 展开','/a/ 张口'];
    txt(ctx,'同一音素序列，同一播放时间',28,28,c.text,17,true);labels.forEach((x,i)=>{const xx=150+i*250;line(ctx,xx,42,xx,196,c.orange,2,[5,5]);txt(ctx,x,xx-33,53,c.muted,12,true);});
    const cursor=90+p*590;line(ctx,cursor,42,cursor,196,c.blue,3);
    const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    const whisper=(x:number)=>.06+.48*smooth(.20,.48,x)+.46*smooth(.53,.86,x);
    const wav=(x:number)=>{const delayed=Math.max(0,x-.12);return delayed<.38?.06:delayed<.74?.58:1;};
    const panels=[{x:34,title:'Wav2Vec2',color:c.red,value:wav(p),curve:wav,note:'迟滞后突然换挡'},{x:397,title:'Whisper-large',color:c.green,value:whisper(p),curve:whisper,note:'音素之间连续过渡'}];
    panels.forEach(panel=>{rr(ctx,panel.x,64,330,128,'#fff',12);txt(ctx,panel.title,panel.x+18,88,panel.color,15,true);const cx=panel.x+72;ctx.fillStyle=panel.color;ctx.beginPath();ctx.arc(cx,137,28,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(cx,147,13,2+panel.value*12,0,0,Math.PI*2);ctx.stroke();line(ctx,panel.x+126,165,panel.x+300,165,c.border,2);ctx.strokeStyle=panel.color;ctx.lineWidth=4;ctx.lineJoin=panel.title==='Wav2Vec2'?'miter':'round';ctx.beginPath();for(let i=0;i<=42;i++){const q=i/42;const xx=panel.x+126+q*174;const yy=165-panel.curve(q)*50;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();const markerX=panel.x+126+p*174;ctx.fillStyle=panel.color;ctx.beginPath();ctx.arc(markerX,165-panel.curve(p)*50,5,0,Math.PI*2);ctx.fill();txt(ctx,panel.note,panel.x+126,187,panel.color,11,true);});
    rr(ctx,34,216,330,84,'#fff',12);txt(ctx,'Raw waveform → Conv feature encoder',52,242,c.text,13,true);txt(ctx,'Transformer context · 94M 参数',52,269,c.muted,13);txt(ctx,'论文：v1.0 嘴型更僵硬',52,291,c.red,13,true);
    rr(ctx,397,216,330,84,'#fff',12);txt(ctx,'Log-Mel → 32-layer encoder',415,242,c.text,13,true);txt(ctx,'1.5B 参数 · 68 万小时多语言语音',415,269,c.muted,13);txt(ctx,'更丰富的音素与上下文表示',415,291,c.green,13,true);
  },[playing]);
  const start=()=>{startRef.current=0;setPlaying(true);setTimeout(()=>setPlaying(false),3200);};
  return <div><Canvas canvasRef={ref} label="Wav2Vec2 与 Whisper 嘴型轨迹和结构比较"/><div className="ctrl"><button className="btn" onClick={start}>同步播放这段发音</button><span className="val">/p/ → /i/ → /a/</span></div><div className="feedback good">Whisper-large 的规模、多语言预训练和多层上下文表示更适合捕捉连续音素变化。论文未报告定量嘴型轨迹，图中动画用于解释其定性观察。</div></div>;
};

const alignSteps=[['33 层特征','Embedding + 32 Transformer layers'],['池化为 5 组','4×8 层均值 + 1 个单层'],['50 Hz → 25 FPS','线性插值匹配视频帧率'],['匹配 VAE 潜变量','Audio Projector 聚合邻域并压缩时间'],['注入 DiT','在 Text Cross-Attn 后加入 Audio Cross-Attn']];
export const AudioAlignment:React.FC<WidgetProps>=()=>{
  const [playing,setPlaying]=useState(true);const [progress,setProgress]=useState(0);const progressRef=useRef(0);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setProgress(v=>{const next=(v+.0125)%1;progressRef.current=next;return next;}),80);return()=>window.clearInterval(timer);},[playing]);
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
  const [mode,setMode]=useState(0);const [frame,setFrame]=useState(4);const rewards=[.82,.78,.74,.18,.76,.43,.81,.79];
  const ref=useCanvas(ctx=>{txt(ctx,mode?'逐帧奖励：问题位置被保留':'视频级奖励：八帧被压成一个总分',30,31,mode?c.green:c.red,17,true);rewards.forEach((r,i)=>{const x=34+i*89;const bad=r<.5;rr(ctx,x,62,70,92,bad?c.red:c.light,10);txt(ctx,String(i+1),x+29,91,bad?'#fff':c.text,14,true);if(i===3){txt(ctx,'手崩',x+18,127,'#fff',13,true);}if(i===5){txt(ctx,'跳帧',x+17,127,'#fff',13,true);}const h=mode?r*90:.66*90;rr(ctx,x,270-h,70,h,mode?(bad?c.red:c.green):c.red,8);if(i===frame){ctx.strokeStyle=c.orange;ctx.lineWidth=5;ctx.strokeRect(x-5,57,80,229);}});txt(ctx,mode?`第 ${frame+1} 帧奖励 = ${rewards[frame].toFixed(2)}`:'所有帧共享总分 = 0.66',30,315,c.orange,14,true);},[mode,frame]);
  return <div><Canvas canvasRef={ref} label="视频级奖励和逐帧奖励比较"/><ChipRow labels={['视频级总分','逐帧奖励']} value={mode} onChange={setMode}/><div className="ctrl"><label>奖励探针 <span className="val">第 {frame+1} 帧</span></label><input type="range" min="0" max="7" value={frame} onChange={e=>setFrame(Number(e.target.value))}/></div><div className={`feedback ${mode?(rewards[frame]<.5?'bad':'good'):'bad'}`}>{mode?(rewards[frame]<.5?'局部低分被准确保留，优化可以针对这一时间分区。':'当前帧结构正常，不应被坏帧的惩罚平均污染。'):'整段总分只能反映整体质量，无法定位第 4 帧的融手或第 6 帧的局部跳变。'}</div></div>;
};

export const HandPresence:React.FC<WidgetProps>=()=>{
  const [hands,setHands]=useState(0);
  const ref=useCanvas(ctx=>{txt(ctx,'条件首帧',34,34,c.text,17,true);rr(ctx,34,58,310,224,'#fff',14);ctx.fillStyle=c.blue;ctx.beginPath();ctx.arc(190,115,35,0,Math.PI*2);ctx.fill();line(ctx,190,150,190,235,c.text,8);if(hands){line(ctx,190,178,125,215,c.orange,10);line(ctx,190,178,255,215,c.orange,10);['手部可见','奖励有效'].forEach((x,i)=>txt(ctx,x,410,118+i*48,i?c.green:c.orange,16,true));}else{line(ctx,190,178,152,219,c.text,9);line(ctx,190,178,228,219,c.text,9);txt(ctx,'手部不在画面',410,118,c.red,16,true);txt(ctx,'无法直接监督手质量',410,166,c.muted,15,true);}rr(ctx,400,215,290,45,hands?c.green:c.red,10);txt(ctx,hands?'优先纳入手部偏好训练':'不把无手画面当作手部监督',422,244,'#fff',14,true);},[hands]);
  return <div><Canvas canvasRef={ref} label="首帧手部存在检查"/><ChipRow labels={['首帧无手','首帧有手']} value={hands} onChange={setHands}/><div className={`feedback ${hands?'good':'bad'}`}>{hands?'MediaPipe 检测到可见手部，提高这类样本在偏好优化中的比例。':'手部质量只有在条件首帧包含可见手时才有明确监督意义。'}</div></div>;
};

export const NfeRace:React.FC<WidgetProps>=()=>{
  const [run,setRun]=useState(0);const started=useRef(0);
  const ref=useCanvas((ctx,time)=>{if(run&&started.current===0)started.current=time;const elapsed=run?(time-started.current)/1000:0;const base=Math.min(1,elapsed/4.5);const fast=Math.min(1,elapsed/.9);txt(ctx,'同一噪声起点 · 相同终点尺度',30,31,c.text,17,true);
    [['Base',base,150,c.blue],['Fast',fast,8,c.green]].forEach((r,i)=>{const y=90+i*105;txt(ctx,`${r[0]} · ${r[2]} NFE`,32,y-16,r[3] as string,15,true);rr(ctx,32,y,670,28,c.border,14);rr(ctx,32,y,670*(r[1] as number),28,r[3] as string,14);ctx.fillStyle=r[3] as string;ctx.beginPath();ctx.arc(32+670*(r[1] as number),y+14,18,0,Math.PI*2);ctx.fill();});txt(ctx,'NFE 数量 ≠ 端到端耗时',514,310,c.orange,13,true);},[run]);
  const start=()=>{started.current=0;setRun(v=>v+1);};
  return <div><Canvas canvasRef={ref} label="Base 与 Fast 前向评估次数对比"/><div className="ctrl"><button className="btn" onClick={start}>从同一噪声开始</button><span className="val">150 vs 8 NFE</span></div><div className="feedback good">Fast 将前向评估次数减少约 18.75 倍；论文未给出足以换算为相同墙钟加速倍数的完整测速。</div></div>;
};

const roles=[['Generator LoRA','快速生成 8-NFE 样本'],['Fake Score LoRA','估计生成分布的 score'],['Base DiT','提供 real-score guidance']];
export const LoraMemory:React.FC<WidgetProps>=()=>{
  const ref=useCanvas((ctx,time)=>{const role=Math.floor((time/1700)%3);txt(ctx,'一套共享 DiT 主干，按训练阶段切换角色',215,38,c.text,18,true);rr(ctx,258,75,244,154,c.blue,18);txt(ctx,'Shared DiT Backbone',296,127,'#fff',17,true);txt(ctx,roles[role][1],279,166,'#fff',13,true);txt(ctx,'动态挂载',333,198,c.green,13,true);roles.forEach((r,i)=>{const x=28+i*250;const active=i===role;rr(ctx,x,264,214,45,active?(i===2?c.blue:c.purple):'#fff',10);txt(ctx,r[0],x+20,292,active?'#fff':c.text,14,true);line(ctx,x+107,264,380,229,active?c.green:c.border,active?6:2);});},[]);
  return <div><Canvas canvasRef={ref} label="共享 DiT 与两组 LoRA 自动切换动画"/><div className="feedback good">Generator LoRA 与 Fake Score LoRA 轮流挂载到同一 DiT；基础 DiT 提供 Real Score。这样可以缓解三套完整模型同时驻留显存的压力。</div></div>;
};

export const SpeakerRouting:React.FC<WidgetProps>=()=>{
  const [person,setPerson]=useState(2);const [track,setTrack]=useState(0);const people=['目标 A','目标 B','背景人物'];const tracks=['Audio A','Audio B','Silent'];const correct=(person===0&&track===0)||(person===1&&track===1)||(person===2&&track===2);
  const ref=useCanvas((ctx,time)=>{
    const pulse=4+Math.abs(Math.sin(time/120))*7;
    txt(ctx,'自动对比：同一段多人视频',28,28,c.text,17,true);
    [{x:28,title:'仅用共享音频',color:c.red,silent:false},{x:394,title:'加入 Silent Condition',color:c.green,silent:true}].forEach(panel=>{
      rr(ctx,panel.x,48,338,142,'#fff',12);txt(ctx,panel.title,panel.x+18,76,panel.color,14,true);
      [panel.x+91,panel.x+245].forEach((x,i)=>{ctx.fillStyle=i?c.purple:c.blue;ctx.beginPath();ctx.arc(x,117,27,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,125,9,i&&panel.silent?2:pulse,0,0,Math.PI*2);ctx.stroke();txt(ctx,i?'背景人物':'目标说话者',x-34,166,c.text,12,true);});
      txt(ctx,panel.silent?'背景嘴部保持自然静止':'背景也被声音驱动',panel.x+90,184,panel.color,12,true);
    });
    txt(ctx,'下方选择一组路由，检查绑定结果',28,220,c.muted,13,true);
    people.forEach((p,i)=>{const x=80+i*245;rr(ctx,x,239,150,34,i===person?c.orange:'#fff',9);txt(ctx,p,x+34,262,i===person?'#fff':c.text,13,true);});
    tracks.forEach((tr,i)=>{const x=80+i*245;txt(ctx,tr,x+44,316,i===track?(i===2?c.purple:c.blue):c.muted,13,true);});
    line(ctx,155+person*245,273,155+track*245,298,correct?c.green:c.red,5);
  },[person,track]);
  return <div><Canvas canvasRef={ref} label="Silent Condition 自动对比与音轨路由检查"/><div className="lc-routing-controls"><ChipRow labels={people} value={person} onChange={setPerson}/><ChipRow labels={tracks} value={track} onChange={setTrack}/></div><div className={`feedback ${correct?'good':'bad'}`}>{correct?(person===2?'背景人物收到显式静音条件，口型不会跟随主讲人的声音。':'目标说话者收到自己的音频条件，口型由对应语音驱动。'):'当前绑定会让人物响应错误的声音；把背景人物切换到 Silent 即可观察正确路由。'}</div></div>;
};

const filterSteps=[
  {title:'来源设计',input:'原始视频来源',check:'特写、访谈、表演、交互、音乐、动画',output:'覆盖目标能力',desc:'先设计数据来源，避免训练集只擅长一种镜头或人物动作。'},
  {title:'离线标注',input:'完整视频与预切片',check:'人物、音频、同步、画质、镜头、字幕',output:'可检索的元数据',desc:'离线阶段为素材建立元数据，后续训练可以按人物数量、画质和音画状态取样。'},
  {title:'在线窗口',input:'本次采样窗口',check:'黑白帧、边框、跳变、异常运动',output:'当前片段可用',desc:'真正送入训练的是一个时间窗口，因此还要在采样时检查这几秒是否连续、完整。'},
  {title:'专项管线',input:'多人、静音、情绪片段',check:'说话人检测、双模型静音确认、情绪过滤',output:'任务专用样本',desc:'特殊任务使用专门规则，保证多人归因、静音条件和情绪标签可靠。'},
];
export const DataCuration:React.FC<WidgetProps>=()=>{
  const [step,setStep]=useState(0);
  const ref=useCanvas(ctx=>{const s=filterSteps[step];txt(ctx,'数据管线分工：先组织素材，再验证训练窗口',28,32,c.text,17,true);filterSteps.forEach((item,i)=>{const x=28+i*180;const active=i<=step;rr(ctx,x,55,155,42,active?(i===step?c.orange:c.blue):'#fff',10);txt(ctx,`${i+1}. ${item.title}`,x+19,82,active?'#fff':c.text,14,true);if(i<3)line(ctx,x+155,76,x+178,76,active?c.green:c.border,4);});
    const cards=[['输入',s.input,c.blue],['检查',s.check,c.orange],['得到',s.output,c.green]] as const;cards.forEach((card,i)=>{const x=28+i*245;rr(ctx,x,132,215,112,'#fff',12);txt(ctx,card[0],x+18,158,card[2],13,true);const parts=card[1].split('、');parts.slice(0,3).forEach((part,j)=>txt(ctx,(j===2&&parts.length>3)?`${part}等`:part,x+18,184+j*20,c.text,12,true));if(i<2){line(ctx,x+215,188,x+238,188,c.green,4);ctx.fillStyle=c.green;ctx.beginPath();ctx.moveTo(x+238,188);ctx.lineTo(x+228,181);ctx.lineTo(x+228,195);ctx.fill();}});txt(ctx,s.desc,28,293,c.text,13,true);txt(ctx,step<2?'离线准备':'训练取样时执行',632,318,step<2?c.blue:c.green,12,true);},[step]);
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
  const ref=useCanvas(ctx=>{txt(ctx,m.name,30,34,c.text,18,true);txt(ctx,m.higher?'越高越好 ↑':'越低越好 ↓',620,34,m.higher?c.blue:c.orange,14,true);[['Base',m.base,c.blue],['Fast',m.fast,fastWins?c.green:c.orange]].forEach((r,i)=>{const y=92+i*103;txt(ctx,r[0] as string,35,y+25,r[2] as string,15,true);rr(ctx,112,y,570,42,c.border,12);rr(ctx,112,y,570*(r[1] as number)/m.max,42,r[2] as string,12);txt(ctx,`${r[1]}${m.unit}`,128,y+27,'#fff',15,true);});txt(ctx,'Table 2 · 8-NFE Fast vs 150-NFE Base',30,312,c.muted,13,true);},[metric]);
  const summaries=[
    '单人相似度小幅下降 0.053，Fast 基本保住了主观观感。',
    '多人相似度提高 0.054，Fast 在这一项略高于 Base。',
    '合理性问题率下降 19.1 个百分点，是 Fast 最明显的改善之一。',
    '协调性问题率上升 0.8 个百分点，这一项体现了蒸馏带来的质量取舍。',
    '稳定性问题率从 12.3% 降至 4.3%，短步生成更稳定。',
    '一致性问题率下降 0.3 个百分点，两种版本接近。',
  ];
  return <div><Canvas canvasRef={ref} label="Base 与 Fast 论文结果对比"/><ChipRow labels={metrics.map(x=>x.name)} value={metric} onChange={setMetric}/><div className={`feedback ${fastWins?'good':'bad'}`}>{summaries[metric]} 表中数值来自论文 Table 2，评测包含 508 组图像—音频输入。</div><div className="lc-evidence-grid"><span>770 名众包评测者</span><span>13,240 条判断</span><span>10 名领域专家</span><span>口型以 0.5× 复核</span></div></div>;
};
