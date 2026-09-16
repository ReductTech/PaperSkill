import {useState,type ReactNode} from 'react';
import {Scene} from './omni-kit';
import {useDiagramWheel,type Timeline} from './reading-wheel';
const ink='#27446e',muted='#617992',blue='#376ca6',green='#258162',violet='#8761ae';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const text=(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=ink,size=18)=>{c.fillStyle=color;c.font=`500 ${size}px system-ui`;c.fillText(s,x,y);};
function trace(c:CanvasRenderingContext2D,points:number[][],progress:number,time:number,color=blue){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));const total=lengths.reduce((a,b)=>a+b,0),p=clamp(progress);
 const at=(ratio:number)=>{let distance=ratio*total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=distance/lengths[i];return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];}distance-=lengths[i];}return points[points.length-1];};
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#d2deec';c.lineWidth=1.5;c.stroke();
 c.beginPath();c.moveTo(points[0][0],points[0][1]);let used=0;for(let i=0;i<lengths.length;i++){used+=lengths[i];const end=at(Math.min(p,used/total));c.lineTo(end[0],end[1]);if(used>=p*total)break;}c.strokeStyle=color;c.lineWidth=2.2;c.stroke();
 if(p<=0)return;for(let i=0;i<5;i++){const u=(time/4800+i/5)%1;if(u>p)continue;const [x,y]=at(u);c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fillStyle=color;c.fill();}const tip=at(p);c.beginPath();c.arc(tip[0],tip[1],4,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function cloud(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,time:number,color:string,count=65){for(let i=0;i<count;i++){const u=((i*37)%101)/101,v=((i*61)%97)/97;c.fillStyle=color;c.globalAlpha=.35+(i%5)*.12;c.beginPath();c.arc(x+(u-.5)*w+Math.sin(time/2200+i)*2,y+(v-.5)*h+Math.cos(time/2400+i)*2,i%7===0?1.6:.9,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
const topics=[['Thinker','生成可阅读的文本，同时从中间层取出一份状态给 Talker。默认 Thinker 有 8 层。'],['桥接状态','默认取第 3 号层之后的向量。它不是最后输出的文字，也不是可读的隐藏推理；后续四层继续计算。'],['Talker','利用 Thinker 条件与自己的音频历史，预测八个码本流。默认有 4 层。'],['Mimi','只有一帧所需的八层码完整，才把这一帧交给 Mimi 解码；后面的帧可以继续生成。']];
export function MechanismField({kind,timeline,frame=0,strategy='streaming',children}:{kind:'architecture'|'frame';timeline:Timeline;frame?:number;strategy?:string;children?:ReactNode}){
 const [motion,setMotion]=useState(true),[focus,setFocus]=useState(1);const max=kind==='frame'?12:3,p=timeline.progress,step=Math.floor(p+1e-8);const wheelRef=useDiagramWheel(timeline,max);
 const count=Math.max(0,Math.min(8,step-frame)),released=count===8&&(strategy==='streaming'||step===12);
 return <div ref={wheelRef} data-wheel-diagram data-progress={p.toFixed(5)} style={{margin:'16px 0',background:'#f0f6fc',border:'1px solid #ccdbec',borderRadius:14,overflow:'hidden',color:ink}}>
 <div style={{display:'flex',justifyContent:'space-between',gap:16,padding:'12px 18px',fontSize:13}}><strong>{kind==='architecture'?'信息路径 · 一份上下文，两条出口':'八码汇合 · 连续查看每一层的到达'}</strong><button onClick={()=>setMotion(v=>!v)}>{motion?'暂停粒子':'恢复粒子'}</button></div>
 <Scene height={350} animate={motion} draggable ariaLabel={kind==='architecture'?`Thinker–Talker 连续机制图，进度 ${(p/max*100).toFixed(1)}%`:`第 ${frame+1} 帧汇合图，生成步 ${step}，已收集 ${count} 层码`} onPoint={x=>timeline.seek(clamp((x-60)/960)*max,true)} draw={(c,w,h,time)=>{
 const t=motion?time:0;c.fillStyle='#f0f6fc';c.fillRect(0,0,w,h);c.strokeStyle='#dde7f2';c.lineWidth=.5;for(let x=25;x<w;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=20;y<h;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 if(kind==='architecture'){
  trace(c,[[140,160],[275,160]],1,t);trace(c,[[410,145],[535,85],[785,85]],p,t,blue);trace(c,[[405,175],[485,240],[585,240]],p,t,violet);trace(c,[[698,240],[795,240]],p-1,t,green);
  cloud(c,105,160,70,58,t,blue,40);text(c,'输入提示',65,207);text(c,'嵌入序列',62,232,muted,13);
  for(let i=0;i<8;i++){c.fillStyle=i===3?violet:'#b7c9dd';c.fillRect(282+i*15,105,8,104);}cloud(c,338,156,100,96,t,blue,100);text(c,'Thinker',290,76,ink,24);text(c,'8 层 · 继续生成文字',260,234,muted,15);
  text(c,'文字输出',815,62,blue,17);const sentence='今天阳光很好。';text(c,p>0?sentence.slice(0,Math.ceil(clamp(p)*sentence.length)):'等待展开',790,112,ink,20);text(c,'中间隐状态',450,195,violet,15);
  for(let i=0;i<4;i++){c.strokeStyle=green;c.strokeRect(593+i*23,198,15,75);c.fillStyle='#76b39b';c.fillRect(593+i*23,273-75*clamp(p-1-i*.12),15,75*clamp(p-1-i*.12));}text(c,'Talker',598,172,ink,22);text(c,'4 层 · 条件 + 音频历史',550,322,muted,14);trace(c,[[615,280],[595,299],[675,299],[673,280]],p-1,t,green);
  const wave=clamp(p-2);c.globalAlpha=1-wave;for(let q=0;q<8;q++){c.fillStyle=p>=2?green:'#c4d9e5';c.fillRect(805+(q%4)*40,205+Math.floor(q/4)*36,26,23);text(c,String(q),813+(q%4)*40,222+Math.floor(q/4)*36,p>=2?'#fff':muted,12);}c.globalAlpha=1;
  for(let i=0;i<36;i++){const a=(9+Math.sin(i*.7)**2*27)*wave;c.strokeStyle=green;c.lineWidth=3;c.beginPath();c.moveTo(801+i*5,240-a);c.lineTo(801+i*5,240+a);c.stroke();}text(c,wave>0?'Mimi → 波形示意':'八个码本流',796,314,green,15);
  const rects=[[266,47,165,207],[435,176,150,82],[576,143,134,165],[782,189,214,139]];const r=rects[focus];c.strokeStyle='#d99850';c.setLineDash([5,5]);c.strokeRect(r[0],r[1],r[2],r[3]);c.setLineDash([]);
 }else{
  const cx=330,cy=170,R=110;for(let q=0;q<8;q++){const angle=-Math.PI/2+q*Math.PI/4,x=cx+Math.cos(angle)*R,y=cy+Math.sin(angle)*R,arrival=clamp(p-frame-q);c.strokeStyle='#b8cadd';c.lineWidth=1;c.beginPath();c.arc(cx,cy,R,angle-.28,angle+.28);c.stroke();c.strokeStyle=green;c.lineWidth=3;c.beginPath();c.arc(cx,cy,R,angle-.28,angle-.28+.56*arrival);c.stroke();trace(c,[[x,y],[cx,cy]],arrival,t+q*450,green);cloud(c,x+(cx-x)*arrival,y+(cy-y)*arrival,28*(1-arrival),28*(1-arrival),t,arrival>0?green:'#b5c6d8',12);text(c,`q${q}`,x-10,y-22,arrival===1?green:muted,13);}
  c.fillStyle='#e1edf9';c.beginPath();c.arc(cx,cy,41,0,Math.PI*2);c.fill();text(c,`${count}/8`,cx-25,cy+9,count===8?green:ink,25);text(c,`第 ${frame+1} 帧`,282,329,ink,17);text(c,`已完成生成步 ${step}`,35,35,ink,18);text(c,'细线随进度汇合，计数按整步更新',35,58,muted,13);
  trace(c,[[470,170],[650,170]],released?1:0,t,green);c.strokeStyle=count===8?green:'#b9cde0';c.strokeRect(670,110,280,120);text(c,'Mimi 解码入口',702,88,ink,20);if(released){for(let i=0;i<43;i++){const a=7+(1+Math.sin(i*.8))*18;c.fillStyle=green;c.fillRect(696+i*5.3,170-a,2.5,a*2);}text(c,`覆盖 ${frame*80}–${(frame+1)*80} ms 音频`,673,275,green,17);}else{text(c,count===8?'完整帧已就绪':'等待八层完整',724,166,ink,21);text(c,count===8?'当前等待策略暂不释放':`还差 ${8-count} 层`,720,201,muted,15);}text(c,'位置与汇合轨迹为组合示意',675,314,muted,13);
 }
 }}/>
 <div style={{padding:'10px 18px',borderTop:'1px solid #ccdbec'}}><label style={{display:'flex',gap:12}}><span>滚轮 / 拖动 · {(p/max*100).toFixed(1)}%</span><input data-progress-control aria-label={kind==='architecture'?'图案讲解进度':'生成时间游标'} type="range" min={0} max={max} step="any" style={{flex:1}} value={p} onChange={e=>timeline.seek(Number(e.target.value),true)}/></label><small>图面与进度条均可滚动；首尾继续滚动返回正文。连续运动表示讲解进度，步数与完整帧仍为整数。</small></div>
 {kind==='architecture'&&<div style={{padding:'0 18px 14px'}}><div className="ctrl">{topics.map(([name],i)=><button key={name} aria-pressed={focus===i} onClick={()=>setFocus(i)}>{name}</button>)}</div><p style={{minHeight:48,margin:0}}>{topics[focus][1]}</p></div>}
 {children}
 </div>;
}
export const MechanismFieldWidget=()=>null;
