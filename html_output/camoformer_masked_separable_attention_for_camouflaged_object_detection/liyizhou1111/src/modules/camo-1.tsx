import { useState } from 'react';
import { C, PaintCanvas, drawPaper } from './camo-kit';

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x - size, y + size * .28);
  ctx.bezierCurveTo(x - size * .8, y - size, x + size * .8, y - size * .9, x + size, y - size * .28);
  ctx.bezierCurveTo(x + size * .7, y + size, x - size * .7, y + size * .85, x - size, y + size * .28);
  ctx.closePath();
}
function veins(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x-size, y+size*.28); ctx.lineTo(x+size,y-size*.28); ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    const dx = i * size / 3;
    ctx.beginPath(); ctx.moveTo(x+dx,y-dx*.28);ctx.lineTo(x+dx+size*.12,y-size*.55);ctx.stroke();
  }
}
function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number) {
  ctx.fillStyle=C.text;ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText(s,x,y);
}

export function CamoProblem() {
  const [similarity,setSimilarity]=useState(70);
  const status=similarity<35?C.green:similarity>85?C.red:C.blue;
  const feedback=similarity<35?'相似度较低，局部颜色能提供明显线索。':similarity>85?'几乎相同的纹理会掩盖目标，需要结合前景、背景与全局证据。':'相似度升高，单看局部颜色越来越难判定边界。';
  return <>
    <PaintCanvas draw={(ctx,w,h)=>{
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);
      drawPaper(ctx,30,25,510,230);drawPaper(ctx,620,25,430,230);
      ctx.fillStyle=C.light;ctx.fillRect(55,52,460,180);
      for(let i=0;i<34;i++){
        const x=70+(i*73)%420,y=65+(i*43)%150;
        ctx.strokeStyle=C.dark;ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(x-12,y+5);ctx.lineTo(x+12,y-5);ctx.stroke();
      }
      ctx.globalAlpha=1;
      const t=similarity/100;
      const a=[48,109,66],b=[184,201,167];
      leaf(ctx,285,145,105);ctx.fillStyle=`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;ctx.fill();
      ctx.globalAlpha=1-t*.9;veins(ctx,285,145,105,C.dark);ctx.globalAlpha=1;
      leaf(ctx,835,145,105);ctx.fillStyle=C.light;ctx.fill();ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.stroke();
      ctx.save();leaf(ctx,835,145,105);ctx.clip();
      ctx.fillStyle=C.red;ctx.globalAlpha=.35;
      ctx.fillRect(730,70,similarity*.85,160);ctx.fillRect(880,75,similarity*.35,70);ctx.restore();
      label(ctx,'相似纹理',285,245);label(ctx,'遗漏示意',835,245);
    }}/>
    <div className="ctrl"><label htmlFor="camo-similarity">背景相似度 {similarity}</label><input id="camo-similarity" type="range" min="0" max="100" step="1" value={similarity} onChange={e=>setSimilarity(Number(e.target.value))}/></div>
    <div className="feedback" style={{borderLeftColor:status}} aria-live="polite">{feedback}</div>
  </>;
}

const levels=['E1','E2','E3','E4','E5'];
const sizes=[96,48,24,12,24];
const explanations=[
  'E1 为96×96，保留较密的空间线索。',
  'E2 为48×48，是构造 E5 的三个输入之一。',
  'E3 为24×24，提供中层语义。',
  'E4 为12×12，提供较粗的高层语义。',
  'E2、E3、E4 对齐到24×24后聚合为 E5；它不是第五个骨干阶段。',
];
export function CamoFeatures(){
  const [level,setLevel]=useState(0);
  return <>
    <PaintCanvas draw={(ctx,w,h)=>{
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);drawPaper(ctx,30,25,410,230);
      leaf(ctx,235,135,100);ctx.fillStyle=C.light;ctx.fill();veins(ctx,235,135,100,C.dark);
      const spacing=[12,20,32,48,32][level];
      ctx.save();ctx.beginPath();ctx.rect(115,50,240,175);ctx.clip();
      for(let x=115;x<=355;x+=spacing){ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,225);ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.stroke();}
      for(let y=50;y<=225;y+=spacing){ctx.beginPath();ctx.moveTo(115,y);ctx.lineTo(355,y);ctx.stroke();}
      ctx.restore();ctx.strokeStyle=C.blue;ctx.lineWidth=4;ctx.strokeRect(115,50,240,175);
      const nodeX=[500,610,720,830,965];
      for(let i=0;i<4;i++){
        ctx.strokeStyle=level===4&&i>0?C.green:C.border;ctx.lineWidth=level===4&&i>0?4:2;
        if(i>0){ctx.beginPath();ctx.moveTo(nodeX[i],130);ctx.lineTo(965,195);ctx.stroke();}
        const d=[90,74,58,42][i];ctx.fillStyle=i===level?C.blue:C.light;ctx.fillRect(nodeX[i]-d/2,92-d/2,d,d);
        if(i===level){ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.strokeRect(nodeX[i]-d/2-4,92-d/2-4,d+8,d+8);}
        ctx.fillStyle=C.text;ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(String(sizes[i]),nodeX[i],165);
      }
      ctx.fillStyle=level===4?C.green:C.light;ctx.fillRect(936,167,58,58);
      if(level===4){ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.strokeRect(932,163,66,66);}
      label(ctx,'层级示意',650,245);label(ctx,`${sizes[level]}×${sizes[level]}`,240,250);
    }}/>
    <div className="ctrl">{levels.map((name,i)=><button key={name} className={`chip ${level===i?'selected':''}`} aria-pressed={level===i} onClick={()=>setLevel(i)}>{name}</button>)}</div>
    <div style={{padding:'8px 0',fontWeight:600}}>输入 384×384 → {levels[level]} 空间尺寸 {sizes[level]}×{sizes[level]} → 1×1 卷积统一为 128 通道</div>
    <div className="feedback" style={{borderLeftColor:level===4?C.green:C.blue}} aria-live="polite">{explanations[level]}</div>
  </>;
}

const choices=['普通 TA','前景 F-TA','背景 B-TA','完整 MSA'];
const branchFeedback=[
  '普通 TA 根据全图构建通道关系，未显式区分前景和背景。',
  'F-TA 用预测前景加权 Q、K，V 仍覆盖完整特征。',
  'B-TA 用互补背景加权 Q、K，补充背景证据。',
  '完整 MSA 合并三组输出，让区域线索和全局关系互补。',
];
function support(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,kind:number){
  drawPaper(ctx,x-size*1.25,y-size*.95,size*2.5,size*1.9);
  leaf(ctx,x,y,size*.8);ctx.fillStyle=C.light;ctx.fill();veins(ctx,x,y,size*.8,C.dark);
  ctx.save();ctx.globalAlpha=.26;
  if(kind===1){leaf(ctx,x,y,size*.8);ctx.fillStyle=C.blue;ctx.fill();}
  else if(kind===2){ctx.beginPath();ctx.rect(x-size*1.15,y-size*.85,size*2.3,size*1.7);leafHole(ctx,x,y,size*.8);ctx.fillStyle=C.blue;ctx.fill('evenodd');}
  else {ctx.fillStyle=C.blue;ctx.fillRect(x-size*1.15,y-size*.85,size*2.3,size*1.7);}
  ctx.restore();ctx.strokeStyle=kind===0?C.blue:C.green;ctx.lineWidth=3;
  if(kind===1){leaf(ctx,x,y,size*.8);ctx.stroke();}else ctx.strokeRect(x-size*1.15,y-size*.85,size*2.3,size*1.7);
}
function leafHole(ctx:CanvasRenderingContext2D,x:number,y:number,size:number){
  ctx.moveTo(x-size,y+size*.28);ctx.bezierCurveTo(x-size*.8,y-size,x+size*.8,y-size*.9,x+size,y-size*.28);ctx.bezierCurveTo(x+size*.7,y+size,x-size*.7,y+size*.85,x-size,y+size*.28);ctx.closePath();
}
export function CamoBranches(){
  const [mode,setMode]=useState(0);
  return <>
    <PaintCanvas draw={(ctx,w,h)=>{
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);
      support(ctx,260,130,110,0);
      ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(540,25);ctx.lineTo(540,255);ctx.stroke();
      if(mode===3){[1,2,0].forEach((kind,i)=>support(ctx,640+i*150,130,55,kind));}
      else support(ctx,810,130,110,mode);
      label(ctx,'普通全图取证',260,255);label(ctx,mode===3?'三组互补':choices[mode],810,255);
    }}/>
    <div className="ctrl">{choices.map((name,i)=><button key={name} className={`chip ${mode===i?'selected':''}`} aria-pressed={mode===i} onClick={()=>setMode(i)}>{name}</button>)}</div>
    <div style={{padding:'8px 0',fontWeight:600}}>{mode===3?'右侧从左到右为前景、背景、全局三组取证范围。':'蓝色覆盖表示构建关系时关注的区域。'} V 始终保留完整特征。</div>
    <div className="feedback" style={{borderLeftColor:mode===3?C.green:C.blue}} aria-live="polite">{branchFeedback[mode]}</div>
  </>;
}
