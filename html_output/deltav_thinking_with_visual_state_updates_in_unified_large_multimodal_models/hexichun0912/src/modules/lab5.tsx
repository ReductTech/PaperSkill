import React, { useState, useRef } from 'react';
import { Scene, colors, clearScene, drawBoard, drawLine, drawPencil } from './drawing';

const controls: React.CSSProperties = {display:'flex',flexWrap:'wrap',gap:8,alignItems:'center',margin:'12px 0'};
const button = (active=false): React.CSSProperties => ({minHeight:44,padding:'8px 16px',border:`1px solid ${active?colors.blue:colors.border}`,borderRadius:9,background:active?colors.blue:'#fff',color:active?'#fff':colors.text,cursor:'pointer',font:'inherit'});
const readout: React.CSSProperties={display:'flex',flexWrap:'wrap',gap:'10px 28px',padding:'12px 0',color:colors.text};
function Feedback({children,tone=colors.blue}:{children:React.ReactNode,tone?:string}){return <div className="feedback" role="status" aria-live="polite" style={{borderLeft:`4px solid ${tone}`,padding:'12px 16px',background:`${tone}0d`,lineHeight:1.7}}>{children}</div>}
function dot(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill()}
function box(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,fill='#fff'){c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=color;c.lineWidth=2;c.strokeRect(x,y,w,h)}

export function Lab1(){
  const [step,setStep]=useState(0);
  const full=6*step+step*(step+1)/2;
  return <div onKeyDown={e=>e.stopPropagation()}>
    <div style={readout}><strong>左：每步完整记录</strong><strong>右：保留底图，追加更新</strong></div>
    <Scene ariaLabel={`第${step}步，两侧路线相同；累计完整记录${full}笔，更新记录${step}笔。`} draw={(c,w,h)=>{
      clearScene(c,w,h);drawBoard(c,42,24,442,190,step,colors.blue);drawBoard(c,596,24,442,190,step,colors.green);
      if(step){for(let i=0;i<6+step;i++)drawLine(c,[[65+i*38,244],[87+i*38,230]],colors.red,5);drawLine(c,[[620,244],[659,230]],colors.green,5);}
      drawLine(c,[[540,30],[540,252]],colors.border,1);
    }}/>
    <div style={controls}><button style={button()} onClick={()=>setStep(s=>Math.min(4,s+1))} disabled={step===4}>下一步</button><button style={button()} onClick={()=>setStep(0)}>重置</button><span>步骤 {step} / 4</span></div>
    <div style={readout}><span>累计完整记录：<strong style={{color:colors.red}}>{full} 笔</strong></span><span>累计更新记录：<strong style={{color:colors.green}}>{step} 笔</strong></span><span>均不含最初底图；非模型 token 数</span></div>
    <Feedback tone={step===4?colors.green:step?colors.orange:colors.blue}>{step===0?'尚未更新：两边共用同一张底图。':step===4?'四步后路线相同，但记录方式不同；这说明冗余来源，不是模型速度测量。':'完整记录会重复底图；更新记录只增加这一段路线。图下短线表示本步记录。'}</Feedback>
  </div>
}

export function Lab2(){
 const [selected,setSelected]=useState(0);
 const labels=['图像特征','可学习查询','离散 token'];
 const details=['SigLIP2 提取连续视觉特征；这保留视觉内容，还不是语言模型生成的离散索引。','可学习查询通过可变形交叉注意力读取图像特征；查询像取景工具，形成紧凑表示。','量化把连续表示映射到码本索引；一个索引不等于一个像素块。'];
 return <div onKeyDown={e=>e.stopPropagation()}>
  <Scene ariaLabel={`当前选择${labels[selected]}，可通过下方按钮选择三个表示阶段。`} onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width,y=(e.clientY-r.top)*280/r.height;const hit=[660,800,940].findIndex(cx=>Math.abs(cx-x)<55&&Math.abs(y-80)<40);if(hit>=0)setSelected(hit)}} draw={(c,w,h)=>{
    clearScene(c,w,h);drawBoard(c,42,40,385,204,3,colors.blue);
    drawLine(c,[[446,138],[510,138],[510,80],[995,80]],colors.border,3);
    drawLine(c,[[446,138],[510,138],[510,80],[660+140*selected,80]],colors.green,4);
    [660,800,940].forEach((x,i)=>{box(c,x-49,44,98,73,i===selected?colors.orange:colors.border,i<=selected?'#e4efe3':'#fff');if(i===0){for(let j=0;j<9;j++)box(c,x-31+(j%3)*22,53+Math.floor(j/3)*18,17,13,colors.light,j%2?colors.light:colors.blue)}else if(i===1){for(let j=0;j<9;j++)dot(c,x-24+(j%3)*24,58+Math.floor(j/3)*21,6,colors.purple)}else{c.fillStyle=colors.blue;c.font='15px monospace';[12,7,83,41,6,19,8,35,72].forEach((v,j)=>c.fillText(String(v),x-35+(j%3)*25,66+Math.floor(j/3)*19))}});
    const bx=620,by=155;box(c,bx,by,350,88,colors.border);
    for(let j=0;j<9;j++){const x=640+j*36;if(selected===0){c.fillStyle=j%3===0?colors.blue:colors.light;c.fillRect(x,175,23,47)}else if(selected===1)dot(c,x+12,197,11,colors.purple);else{c.fillStyle=colors.blue;c.font='16px monospace';c.fillText(String([12,7,83,41,6,19,8,35,72][j]),x,204)}}
  }}/>
  <div style={controls}>{labels.map((label,i)=><button key={label} style={button(selected===i)} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{label}</button>)}</div>
  <Feedback tone={selected===2?colors.green:colors.blue}>{details[selected]} 图中的 9 个槽位仅为教学示意，不是模型生产配置。</Feedback>
 </div>
}

export function Lab3(){
 const [offset,setOffset]=useState(120); const drag=useRef<{x:number,offset:number}|null>(null);
 const aligned=Math.abs(offset)<8; const clamp=(v:number)=>Math.round(Math.max(-160,Math.min(160,v)));
 const xy=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*1080/r.width,y:(e.clientY-r.top)*280/r.height}};
 return <div onKeyDown={e=>e.stopPropagation()}>
  <Scene ariaLabel={`拖动橙色圆形把手对齐更新，当前相对位移${offset}。亦可使用下面的按钮。`} onPointerDown={e=>{const p=xy(e);if(Math.hypot(p.x-(690+offset),p.y-54)<30){drag.current={x:p.x,offset};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault()}}} onPointerMove={e=>{if(drag.current)setOffset(clamp(drag.current.offset+xy(e).x-drag.current.x))}} onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} draw={(c,w,h)=>{
   clearScene(c,w,h);drawBoard(c,360,35,360,210,0,colors.blue);
   drawLine(c,[[405,197],[465,153],[532,153]],colors.blue,6);
   c.save();c.globalAlpha=.55;box(c,360+offset,35,360,210,aligned?colors.green:colors.orange,aligned?'#e4f5e9':'#fff9ee');c.restore();
   drawLine(c,[[532+offset,153],[579+offset,108],[661+offset,108]],aligned?colors.green:colors.orange,6);
   dot(c,532,153,6,colors.blue);dot(c,532+offset,153,7,aligned?colors.green:colors.orange);
   dot(c,690+offset,54,22,colors.orange);drawLine(c,[[679+offset,54],[701+offset,54]],'#fff',3);drawLine(c,[[679+offset,54],[684+offset,49]],'#fff',3);drawLine(c,[[701+offset,54],[696+offset,59]],'#fff',3);
  }}/>
  <div style={controls}><button style={button()} onClick={()=>setOffset(v=>clamp(v-20))} disabled={offset===-160}>左移 20</button><button style={button()} onClick={()=>setOffset(v=>clamp(v+20))} disabled={offset===160}>右移 20</button><button style={button(aligned)} onClick={()=>setOffset(0)}>对齐</button><button style={button()} onClick={()=>{drag.current=null;setOffset(120)}}>重置</button></div>
  <div style={readout}><span>对齐距离：<strong>{Math.abs(offset)}</strong>（画布示意单位）</span><span>蓝色：历史路线 · 橙色把手：可拖动</span></div>
  <Feedback tone={aligned?colors.green:colors.orange}>{aligned?'对齐后得到新的完整状态；真实模型以因果注意力和解码器利用历史。这里的平移仅是依赖关系的类比。':Math.abs(offset)>=100?'更新脱离历史，无法独立说明路线在原图中的位置。拖动橙色把手，或按“对齐”。':'正在对齐：底图提供更新所依赖的上下文。这里不把对齐距离当作重建质量分数。'}</Feedback>
 </div>
}

export function Lab4(){
 const [alpha,setAlpha]=useState(.7),[capacity,setCapacity]=useState(true);
 const k=capacity?[144,64,16]:[1,1,1];const raw=[alpha*alpha*k[0],alpha*k[1],k[2]];const total=raw.reduce((a,b)=>a+b,0);const norm=raw.map(x=>x/total);const tsim=norm.reduce((a,b,i)=>a+b*[.3,.6,.9][i],0);
 return <div onKeyDown={e=>e.stopPropagation()}>
  <Scene ariaLabel={`历史权重从旧到新为${norm.map(v=>(v*100).toFixed(1)+'%').join('、')}，TSIM为${tsim.toFixed(3)}`} draw={(c,w,h)=>{
   clearScene(c,w,h);norm.forEach((v,i)=>{c.save();c.globalAlpha=.3+.7*v;drawBoard(c,32+i*180,66,157,146,i+1,colors.blue);c.restore();c.strokeStyle=colors.blue;c.lineWidth=1+5*v;c.strokeRect(32+i*180,66,157,146);box(c,642,61+i*62,370,29,colors.border,'#e9eeea');c.fillStyle=colors.blue;c.fillRect(642,61+i*62,370*v,29)});
  }}/>
  <div style={controls}><label htmlFor="early-alpha">时间衰减 α = <strong>{alpha.toFixed(2)}</strong></label><input id="early-alpha" type="range" min="0" max="1" step="0.05" value={alpha} onChange={e=>setAlpha(Number(e.target.value))} style={{minHeight:44,width:240,maxWidth:'100%',accentColor:colors.blue}}/><button style={button(!capacity)} aria-pressed={!capacity} onClick={()=>setCapacity(v=>!v)}>教学对照：{capacity?'不计容量':'恢复容量权重'}</button></div>
  <div style={readout}><strong>TSIM = {tsim.toFixed(3)}</strong>{norm.map((v,i)=><span key={i}>{['最早','中间','最近'][i]}：{(v*100).toFixed(1)}%</span>)}</div>
  <div style={{color:colors.muted,marginBottom:12}}>示例相似度 s = [0.3, 0.6, 0.9]；历史容量 K = [144, 64, 16]。纸页和右侧横条均按从旧到新排列。</div>
  <Feedback tone={!capacity?colors.orange:alpha===0||alpha===1?colors.green:colors.blue}>{!capacity?`教学对照：已移除 K 权重，TSIM=${tsim.toFixed(3)}。这不是论文默认规则；α=1 时此对照才变为等权。`:alpha===0?'α=0 时只参考最近状态，TSIM=0.900。':alpha===1?'α=1 只取消时间衰减；Kⱼ 容量权重仍然存在，并非所有历史等权。':`当前 TSIM=${tsim.toFixed(3)}。中间 α 值在近期信息与较早历史之间折中，同时保留容量权重。`}</Feedback>
 </div>
}

export function Lab5(){
 const [large,setLarge]=useState(false),[tau,setTau]=useState(.002);
 const a=large?50:18,curve=(x:number)=>.95-.35*Math.exp(-x/a),slope=(x:number)=>.35/a*Math.exp(-x/a);
 const star=Math.max(0,a*Math.log(.35/(a*tau))),candidates=[9,16,25,36,49,64,81,100,121,144];const chosen=candidates.reduce((best,x)=>Math.abs(x-star)<Math.abs(best-star)?x:best,9);
 return <div onKeyDown={e=>e.stopPropagation()}>
  <div style={controls}><button style={button(!large)} aria-pressed={!large} onClick={()=>setLarge(false)}>变化小</button><button style={button(large)} aria-pressed={large} onClick={()=>setLarge(true)}>变化大</button><label htmlFor="early-tau">斜率阈值 τ = {tau.toFixed(4)}</label><input id="early-tau" type="range" min="0.0002" max="0.008" step="0.0002" value={tau} onChange={e=>setTau(Number(e.target.value))} style={{minHeight:44,width:220,maxWidth:'100%',accentColor:colors.orange}}/></div>
  <Scene ariaLabel={`教学重建曲线，横轴预算0至144，纵轴SSIM 0.55至1，所选预算${chosen}，连续阈值位置${star.toFixed(1)}`} draw={(c,w,h)=>{
   clearScene(c,w,h);drawBoard(c,32,55,260,180,Math.max(1,Math.ceil(chosen/36)),colors.green);drawPencil(c,265,208,-.6,colors.orange);
   const px=(x:number)=>390+x/144*620,py=(y:number)=>240-(y-.55)/.45*210;
   [0,.25,.5,.75,1].forEach(q=>drawLine(c,[[390,30+q*210],[1010,30+q*210]],colors.border,1));
   drawLine(c,[[390,30],[390,240],[1010,240]],colors.muted,2);
   const points:[number,number][]=[];for(let x=0;x<=144;x++)points.push([px(x),py(curve(x))]);drawLine(c,points,colors.blue,4);
   drawLine(c,[[px(chosen),240],[px(chosen),py(curve(chosen))]],colors.green,3);dot(c,px(chosen),py(curve(chosen)),7,colors.green);
   const t=Math.min(144,star),dx=16;const p1=Math.max(0,t-dx),p2=Math.min(144,t+dx);drawLine(c,[[px(p1),py(curve(t)+slope(t)*(p1-t))],[px(p2),py(curve(t)+slope(t)*(p2-t))]],colors.orange,4);dot(c,px(t),py(curve(t)),4,colors.orange);
  }}/>
  <div style={{color:colors.muted,margin:'8px 0'}}>教学模拟曲线：C(x)=0.95−0.35 exp(−x/{a})。横轴预算 0–144；纵轴 SSIM 0.55–1。蓝线：重建曲线；橙线：阈值位置切线；绿线：最近候选预算。左侧笔画只是预算类比。</div>
  <div style={readout}><strong>预算 K = {chosen}</strong><span>C(K) = {curve(chosen).toFixed(4)}</span><span>C′(K) = {slope(chosen).toFixed(5)} / token</span><span>连续位置 x* = {star.toFixed(1)}</span></div>
  <Feedback tone={star>144?colors.orange:colors.green}>{star>144?'连续阈值位置超出 144，已饱和到候选上限；曲线在上限内尚未满足阈值，不能声称已跨过阈值。':`已找到教学曲线的斜率阈值位置，并选取最近的离散预算 ${chosen}。阈值增大通常会减少预算；取最近候选后，其斜率不一定仍小于阈值。`} 这些数值不是论文实测，也不保证全局最小 token 数。</Feedback>
 </div>
}
