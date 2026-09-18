import { useLessonPlayback } from './useLessonPlayback';
import { PlaybackBar } from './lesson-labs';
import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export type StudioConfig = {
  title:string; scene:string; control:'slider'|'toggle'|'steps'|'button';
  options:string[]; feedback:string[]; formula?:string; facts?:string[];
  table?:Array<[string,string,string,string]>; cards?:string[]; successIndex?:number;
};
const C={bg:'#f5f8f0',paper:'#fff',light:'#dce8d2',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea'};
type G=CanvasRenderingContext2D;
let flowPhase=0;
const text=(g:G,s:string,x:number,y:number,size=20,color=C.ink,align:CanvasTextAlign='center',weight=600)=>{g.font=weight+' '+size+'px "Segoe UI","Microsoft YaHei",sans-serif';g.fillStyle=color;g.textAlign=align;g.textBaseline='alphabetic';g.fillText(s,x,y)};
const box=(g:G,x:number,y:number,w:number,h:number,label:string,color=C.blue,fill=C.paper)=>{
  g.save();g.shadowColor='rgba(33,50,74,.08)';g.shadowBlur=8;g.shadowOffsetY=3;g.fillStyle=fill;g.strokeStyle=color;g.lineWidth=2.5;g.beginPath();g.roundRect(x,y,w,h,12);g.fill();g.shadowColor='transparent';g.stroke();
  g.fillStyle=color;g.globalAlpha=.82;g.beginPath();g.roundRect(x+10,y+10,6,Math.max(12,h-20),3);g.fill();g.globalAlpha=1;
  const fs=Math.max(15,Math.min(21,w/(Math.max(4,label.length)*.78)));text(g,label,x+w/2+5,y+h/2+fs*.34,fs,color===C.line?C.muted:color);g.restore()
};
const arrow=(g:G,x1:number,y1:number,x2:number,y2:number,color=C.muted)=>{g.save();g.strokeStyle=color;g.fillStyle=color;g.lineWidth=2.5;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();const a=Math.atan2(y2-y1,x2-x1);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-12*Math.cos(a-.42),y2-12*Math.sin(a-.42));g.lineTo(x2-12*Math.cos(a+.42),y2-12*Math.sin(a+.42));g.closePath();g.fill();if(flowPhase>0&&flowPhase<1){g.beginPath();g.arc(x1+(x2-x1)*((flowPhase*4)%1),y1+(y2-y1)*((flowPhase*4)%1),4,0,Math.PI*2);g.fill()}g.restore()};
const pill=(g:G,s:string,x:number,y:number,color=C.blue)=>{g.save();g.fillStyle=color;g.shadowColor='rgba(33,50,74,.12)';g.shadowBlur=6;g.beginPath();g.roundRect(x-55,y-19,110,38,19);g.fill();g.shadowColor='transparent';text(g,s,x,y+6,17,'#fff');g.restore()};
const begin=(g:G,w:number,h:number,title:string)=>{g.globalAlpha=1;g.clearRect(0,0,w,h);g.fillStyle=C.bg;g.fillRect(0,0,w,h);g.fillStyle='#fffdf9';g.strokeStyle=C.line;g.lineWidth=1.5;g.beginPath();g.roundRect(14,12,w-28,h-24,16);g.fill();g.stroke();text(g,title,34,38,18,C.muted,'left',500);g.strokeStyle='#e8edf3';g.beginPath();g.moveTo(34,49);g.lineTo(w-34,49);g.stroke()};
const brain=(g:G,x:number,y:number,w:number,h:number,stroke=C.blue,fill='#eef3f8')=>{g.save();g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=2.5;g.beginPath();g.moveTo(x+w*.08,y+h*.58);g.bezierCurveTo(x-w*.02,y+h*.28,x+w*.18,y+h*.02,x+w*.4,y+h*.1);g.bezierCurveTo(x+w*.57,y-h*.02,x+w*.86,y+h*.08,x+w*.9,y+h*.32);g.bezierCurveTo(x+w*1.02,y+h*.48,x+w*.86,y+h*.77,x+w*.66,y+h*.73);g.bezierCurveTo(x+w*.5,y+h*.92,x+w*.18,y+h*.84,x+w*.08,y+h*.58);g.closePath();g.fill();g.stroke();g.strokeStyle=stroke;g.globalAlpha=.25;g.lineWidth=1.5;for(let k=0;k<4;k++){g.beginPath();g.arc(x+w*(.28+k*.14),y+h*(.42+(k%2)*.12),w*.11,0,Math.PI*1.45);g.stroke()}g.restore()};

function drawStudio(g:G,w:number,h:number,i:number,n:number,scene:string,progress=1){
  const titles:Record<string,string>={'modal-align':'跨模态特征如何进入同一时间轴','time-compare':'局部 FIR 与长程 Transformer','subject-route':'已见与未见被试的两条路线','rank':'低秩响应矩阵分解','ica-map':'ICA 成分与阈值掩膜','modal-map':'模态选择性叠加图'};
  flowPhase=progress;begin(g,w,h,titles[scene]||'TRIBE v2 计算流程');const active=n<=1?0:i/(n-1);
  if(scene==='fragment-risk'||scene==='unified'){
    const ys=[72,132,192];['视觉研究','听觉研究','语言研究'].forEach((s,k)=>box(g,42,ys[k],130,38,s,[C.orange,C.green,C.purple][k]));
    if(scene==='fragment-risk'){for(let k=0;k<3;k++){arrow(g,172,ys[k]+19,300,ys[k]+19);box(g,300,ys[k],170,38,'独立模型 '+(k+1),i<n-1?C.red:C.green)}text(g,'重复训练 · 难以共享',640,144,23,i<n-1?C.red:C.green)}
    else{for(let k=0;k<3;k++)arrow(g,172,ys[k]+19,330,132);box(g,330,99,220,66,'TRIBE v2 共享主干',C.green,'#eef8f1');arrow(g,550,132,680,132);box(g,680,99,210,66,'被试 / 任务适配头',C.blue);arrow(g,890,132,1010,132);pill(g,'脑响应',1020,132,C.purple)}
  }else if(scene==='modal-align'){
    const rows:[string,string,string][]=[['文本','2048 d',C.red],['音频','1024 d',C.green],['视频','1280 d',C.blue]];
    rows.forEach((r,k)=>{const y=65+k*62;box(g,42,y,120,40,r[0],r[2]);arrow(g,162,y+20,250,y+20);box(g,250,y,120,40,r[1],r[2]);for(let q=0;q<4;q++){g.fillStyle=r[2];g.globalAlpha=.22+.18*((q+i)%3);g.fillRect(400+q*38,y+8,28,24)}g.globalAlpha=1;arrow(g,552,y+20,655,140)});
    box(g,655,104,155,72,'层平均',C.blue);arrow(g,810,140,865,140);box(g,865,104,120,72,'Linear 384',C.green);arrow(g,985,140,1035,140);pill(g,'2 Hz',1038,140,C.blue);
  }else if(scene==='time-compare'){
    text(g,'Deep FIR',155,68,20,C.orange);text(g,'Transformer',155,177,20,C.green);
    for(let k=0;k<18;k++){const x=280+k*37;g.fillStyle=k<9?C.orange:C.light;g.fillRect(x,48,27,35);g.fillStyle=C.green;g.globalAlpha=k<=Math.round(active*17)?.8:.18;g.fillRect(x,158,27,35);g.globalAlpha=1}
    g.strokeStyle=C.green;g.lineWidth=3;g.beginPath();g.arc(590,177,300,Math.PI,0);g.stroke();text(g,'9 TR 局部窗口',915,72,16,C.orange);text(g,'跨长时间上下文建模',915,182,16,C.green);
  }else if(scene==='time-risk'){
    const off=(i-5)*34;['刺激特征','BOLD'].forEach((s,k)=>{const y=86+k*86;text(g,s,110,y+8,17,k?C.purple:C.green);g.strokeStyle=C.line;g.lineWidth=12;g.beginPath();g.moveTo(205,y);g.lineTo(935,y);g.stroke();for(let q=0;q<9;q++){g.fillStyle=k?C.purple:C.green;g.globalAlpha=.25+.06*q;g.fillRect(230+q*74+(k?off:0),y-15,48,30)}g.globalAlpha=1});
    g.strokeStyle=i===5?C.green:C.red;g.setLineDash([8,7]);g.strokeRect(520,55,150,145);g.setLineDash([]);text(g,i===5?'固定 5 秒偏移：对齐':'偏移不当：错配',595,236,18,i===5?C.green:C.red);
  }else if(scene==='modal'){
    ['文本','音频','视频'].forEach((s,k)=>{const y=61+k*64;box(g,90,y,165,44,s,[C.red,C.green,C.blue][k]);if(i>0&&k===i-1){g.strokeStyle=C.red;g.lineWidth=7;g.beginPath();g.moveTo(115,y+9);g.lineTo(230,y+35);g.moveTo(230,y+9);g.lineTo(115,y+35);g.stroke();text(g,'置零',320,y+28,15,C.red)}arrow(g,255,y+22,650,140)});
    box(g,650,94,220,92,'同一 TRIBE v2',C.blue);arrow(g,870,140,990,140);pill(g,'Δ表现',1018,140,C.orange);
  }else if(scene==='subject-route'){
    box(g,55,104,190,65,'共享 Transformer',C.green);arrow(g,245,136,410,78);arrow(g,245,136,410,200);box(g,410,48,220,60,'已见被试 W_subject',i===0?C.blue:C.line);box(g,410,170,220,60,'未见被试共享线性层',i>0?C.purple:C.line);arrow(g,630,78,780,78);arrow(g,630,200,780,200);box(g,780,48,220,60,'个体化预测',C.blue);box(g,780,170,220,60,'零样本预测',C.purple);
  }else if(scene==='rank'){
    const rank=[16,32,64,128][i]||128,cols=Math.max(1,i+1),matrix=(x:number,y:number,r:number,c:number,color:string)=>{for(let a=0;a<r;a++)for(let b=0;b<c;b++){g.fillStyle=color;g.globalAlpha=.18+.12*((a+b+cols)%4);g.fillRect(x+b*19,y+a*19,14,14)}g.globalAlpha=1};
    matrix(115,73,8,4,C.blue);text(g,'Y',90,150,28,C.blue);text(g,'≈',215,150,30,C.muted);matrix(270,73,8,cols,C.green);text(g,'U',290,250,18,C.green);matrix(470,112,cols,cols,C.orange);text(g,'Σ',488,250,18,C.orange);matrix(650,112,cols,9,C.purple);text(g,'Vᵀ',730,250,18,C.purple);text(g,'rank = '+rank,965,145,25,C.orange);
  }else if(scene==='train-risk'){
    const stages=['MSE','学习率与早停','刺激隔离','去趋势'],last=Math.round(active*3);stages.forEach((s,k)=>{const x=75+k*250;box(g,x,104,190,58,s,k<=last?C.green:C.line,k<=last?'#eef8f1':C.paper);if(k<3)arrow(g,x+190,133,x+244,133,k<last?C.green:C.line)});text(g,i===n-1?'可复现验证链完整':'继续补齐训练与验证约束',540,222,18,i===n-1?C.green:C.orange);
  }else if(scene==='architecture-modal'){
    const stages=['多层特征','Linear+LN','Emb+Drop','Transformer','2→1 Hz','Seen/Unseen','目标头'];stages.forEach((s,k)=>{const x=20+k*150;box(g,x,105,122,60,s,k===i?C.orange:k<i?C.green:C.line,k===i?'#fff3e9':C.paper);if(k<6)arrow(g,x+122,135,x+147,135,k<i?C.green:C.muted)});
  }else if(scene==='ica-map'){
    for(let k=0;k<5;k++){const x=42+k*158,selected=k===i%5;brain(g,x,92,132,88,selected?C.purple:C.line,selected?'#f2ecff':'#f7f8fa');text(g,'成分 '+String.fromCharCode(65+k),x+66,210,17,selected?C.purple:C.muted);g.fillStyle=selected?C.purple:C.light;for(let q=0;q<3;q++){g.globalAlpha=selected?.78:.25;g.beginPath();g.arc(x+40+q*25,126+(q%2)*20,7+q*2,0,Math.PI*2);g.fill()}g.globalAlpha=1}
    box(g,860,91,174,70,'Top 10% 顶点',C.purple,'#faf7ff');text(g,'只突出高权重区域',947,194,17,C.muted);
  }else if(scene==='modal-map'){
    const colors=[C.red,C.green,C.blue];brain(g,115,75,590,155,C.muted,'#f7f8fa');
    if(i===2){for(const p of [[570,135,42],[625,172,30],[260,105,24]] as const){g.fillStyle=C.orange;g.globalAlpha=.62;g.beginPath();g.arc(p[0],p[1],p[2],0,Math.PI*2);g.fill()}g.globalAlpha=1;text(g,'TPOJ',585,132,18,C.orange);text(g,'局部增益热点（最高约 50%）',410,250,18,C.orange)}
    else{for(let k=0;k<3;k++){g.fillStyle=colors[k];g.globalAlpha=i===0?.30:i===1?(k===2?.58:.13):.46;g.beginPath();g.ellipse(270+k*125,132+(k%2)*38,155,62,-.24+k*.23,0,Math.PI*2);g.fill()}g.globalAlpha=1;text(g,i===0?'分别比较文本、音频、视频均值':i===1?'逐 parcel 选择最佳单模态（视频总体最高）':'RGB 重叠颜色表示模态共同占优',410,250,18,i===1?C.blue:C.muted)}
    ['文本 R','音频 G','视频 B'].forEach((s,k)=>pill(g,s,865,83+k*60,colors[k]));
  }else if(scene==='race'){
    const vals=[.2146,.2096,.2094,.2085,.2055],names=['Ours','Schad','Eren','Villanueva','Unpublished'],lo=.2,hi=.216;vals.forEach((v,k)=>{text(g,names[k],125,66+k*39,14,C.muted);g.fillStyle=i===1?C.green:C.light;g.fillRect(220,48+k*39,610*(v-lo)/(hi-lo),22);text(g,v.toFixed(4),850,65+k*39,14,i===1?C.green:C.muted,'left')});
  }else{
    const stages=['刺激','基础模型','TRIBE v2','预测','脑图'];stages.forEach((s,k)=>{const x=45+k*202;box(g,x,105,154,58,s,k<=i?C.green:C.line);if(k<4)arrow(g,x+154,134,x+198,134)});
  }
  g.globalAlpha=Math.max(.55,progress);
}

export const ConfigurableStudio:React.FC<WidgetProps & {config:StudioConfig}>=({chapterId,moduleId,config})=>{
  const player=useLessonPlayback(config.options.length,Math.max(6,config.options.length*1.8));const index=player.step,started=player.progress>0;const canvasRef=useRef<HTMLCanvasElement>(null);const renderRef=useRef<()=>void>(()=>{});const state=useRef({index:0,progress:1});
  useEffect(()=>{state.current={index,progress:player.progress};renderRef.current()},[index,player.progress]);
  useEffect(()=>{const cv=canvasRef.current;if(!cv)return;let g:G;try{g=setupCanvas(cv,1080,280)}catch{return}const render=()=>{drawStudio(g,1080,280,state.current.index,config.options.length,config.scene,state.current.progress);cv.classList.add('is-ready')};renderRef.current=render;const disconnect=observeCanvas(cv,render,()=>{});render();return()=>{disconnect();renderRef.current=()=>{}}},[config]);
  const choose=(x:number)=>player.seek(clamp(x,0,config.options.length-1)/Math.max(1,config.options.length-1));const fb=config.feedback[index]||config.feedback[0],success=config.successIndex??config.options.length-1;
  return <div ref={player.root}><div className="visual-source-tag teaching">教学示意 · TRIBE v2 专属交互图</div><canvas ref={canvasRef} id={'cv-'+chapterId+'-'+moduleId} width={1080} height={280} aria-label={config.title+'：'+config.options[index]+'。'+fb}/><div className="ctrl"><label>{config.title} <span className="val">{config.options[index]}</span></label>{config.control==='slider'||config.control==='steps'?<input type="range" min={0} max={config.options.length-1} value={index} onChange={e=>choose(Number(e.target.value))} aria-valuetext={config.options[index]}/>:config.control==='toggle'?<div className="segmented" role="group" aria-label={config.title}>{config.options.map((o,k)=><button key={o} type="button" aria-pressed={k===index} onClick={()=>choose(k)}>{o}</button>)}</div>:<button className="tiny" disabled={started} onClick={()=>choose(config.options.length-1)}>{started?'比较完成':'比较五项成绩'}</button>}</div>{config.control==='steps'&&<div className="stage-buttons">{config.options.map((o,k)=><button type="button" key={o} aria-current={k===index?'step':undefined} onClick={()=>choose(k)}>{o}</button>)}</div>}<div className={'feedback '+(index===success?'good':config.scene.includes('risk')&&started?'bad':'')} aria-live="polite">{fb}</div>{config.formula&&<div className="formula">{config.formula}</div>}{config.facts&&<div className="metric-grid">{config.facts.map((f,k)=><div className="metric-card" key={k}>{f}</div>)}</div>}{config.table&&<table className="result-table"><caption>Algonauts 2025 同表成绩（mean score 越高越好）</caption><thead><tr><th>名次</th><th>条目</th><th>Mean score</th><th>条件</th></tr></thead><tbody>{config.table.map((r,k)=><tr key={k}>{r.map((c,j)=>j===0?<th scope="row" key={j}>{c}</th>:<td key={j}>{c}</td>)}</tr>)}</tbody></table>}{config.cards&&<div className="result-cards">{config.cards.map((c,k)=><div className="result-card" key={k}>{c}</div>)}</div>}<PlaybackBar player={player}/><p className="sr-summary">当前状态：{config.options[index]}。{fb}</p></div>
};

export const AnalogyStudio:React.FC<WidgetProps & {action:string}>=({chapterId,moduleId,action})=>{
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const cv=ref.current;if(!cv)return;let g:G;try{g=setupCanvas(cv,560,140)}catch{return}let raf=0,running=false,start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw=(now:number)=>{const p=reduced?1:((now-start)%3000)/3000;begin(g,560,140,'');if(action.includes('对齐')){for(let k=0;k<3;k++){g.fillStyle=[C.purple,C.orange,C.green][k];g.globalAlpha=.3;g.fillRect(38,24+k*34,420,18);g.globalAlpha=1}g.strokeStyle=C.blue;g.lineWidth=4;g.beginPath();g.moveTo(55+p*390,16);g.lineTo(55+p*390,122);g.stroke()}else if(action.includes('上下文')){g.fillStyle=C.orange;g.fillRect(40,35,145,55);g.fillStyle=C.light;g.fillRect(205,35,315,55);g.strokeStyle=C.green;g.lineWidth=4;g.strokeRect(40,25,480,75);text(g,'局部窗口',112,116,14,C.orange);text(g,'长上下文',365,116,14,C.green)}else if(action.includes('五秒')){g.strokeStyle=C.green;g.lineWidth=5;g.beginPath();g.moveTo(55,102);g.lineTo(250,38);g.lineTo(505,102);g.stroke();pill(g,'5 秒',280,70,C.blue)}else if(action.includes('路线')){box(g,35,48,145,50,'共享表示',C.green);arrow(g,180,73,305,38);arrow(g,180,73,305,108);box(g,305,14,200,48,'已见被试',C.blue);box(g,305,84,200,48,'未见被试',C.purple)}else if(action.includes('分离')){for(let k=0;k<3;k++)box(g,35+k*175,44,140,58,['视觉工程','听觉工程','语言工程'][k],C.red)}else{for(let k=0;k<3;k++){box(g,20,15+k*42,110,32,['文本','音频','视频'][k],[C.purple,C.orange,C.green][k]);arrow(g,130,31+k*42,270,70)}box(g,270,40,165,60,action.includes('Transformer')?'Transformer':'共享剪辑台',C.green);if(action.includes('Transformer')){arrow(g,435,70,468,70);brain(g,470,42,66,48,C.purple,'#f5efff');text(g,'全脑 fMRI',503,122,15,C.purple)}else{arrow(g,435,70,520,70)}}
      cv.classList.add('is-ready');if(running&&!reduced)raf=requestAnimationFrame(draw)};
    const play=()=>{if(running||reduced)return;running=true;raf=requestAnimationFrame(draw)},stop=()=>{running=false;cancelAnimationFrame(raf)},disconnect=observeCanvas(cv,play,stop);draw(performance.now());return()=>{stop();disconnect()}
  },[action]);
  return <canvas ref={ref} id={'cv-'+chapterId+'-'+moduleId} width={560} height={140} aria-label={'剪辑台类比动画：'+action}/>
};
export const StudioBase:React.FC<WidgetProps>=p=><AnalogyStudio {...p} action="共享剪辑台"/>;
