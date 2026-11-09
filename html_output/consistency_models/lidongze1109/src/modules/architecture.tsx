import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawLine, drawDot, drawText } from './cm-kit';
const names=['输入与时间','网络分支','输入跳连','相加输出'];
const details=['输入是 d 维状态 x 与标量时间 t。','Fθ 输出 d 维张量，经 c_out 缩放，才能与跳连相加。','跳连携带输入，经 c_skip 缩放；ε 处系数为1。','输出与 x 同维；在 ε 处网络分支权重为0，输出严格等于输入。'];
export function Architecture(){
  const [selected,setSelected]=useState(0),[boundary,setBoundary]=useState(false);
  const choose=(x:number,y:number)=>setSelected(x<210?0:x>780?3:y<140?2:1);
  const skip=boundary?1:.25/((1-.002)**2+.25),out=boundary?0:.5*(1-.002)/Math.sqrt(.25+1);
  return <div><SceneCanvas tabIndex={0} ariaLabel="一致性模型分支结构。左右键切换四个区域，回车切换边界时间。" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();choose((e.clientX-r.left)*1080/r.width,(e.clientY-r.top)*280/r.height);}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();setSelected(v=>(v+(e.key==='ArrowRight'?1:3))%4);}if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();setBoundary(v=>!v);}}} draw={ctx=>{
    clearScene(ctx);
    const network=boundary?C.border:C.blue;
    const seg=(x1:number,y1:number,x2:number,y2:number,col:string,active:boolean)=>{if(active)drawLine(ctx,x1,y1,x2,y2,C.orange,10);drawLine(ctx,x1,y1,x2,y2,col,active?4:3);};
    seg(140,140,250,140,C.blue,selected===0);seg(250,140,250,75,C.green,selected===2);seg(250,75,825,75,C.green,selected===2);seg(825,75,825,140,C.green,selected===2);
    seg(250,140,250,205,network,selected===1);seg(250,205,825,205,network,selected===1);seg(825,205,825,140,network,selected===1);seg(825,140,980,140,C.green,selected===3);
    const nodes:[[number,number],number][]=[[[140,140],0],[[480,205],1],[[480,75],2],[[945,140],3]];
    nodes.forEach(([p,i])=>{ctx.fillStyle=i===selected?C.orange:C.bg;ctx.strokeStyle=i===1?network:C.dark;ctx.lineWidth=i===selected?4:2;ctx.beginPath();ctx.roundRect(p[0]-52,p[1]-27,104,54,12);ctx.fill();ctx.stroke();drawText(ctx,String(i+1),p[0],p[1]+6,i===1&&boundary?C.muted:C.text,19,'center');});
    drawDot(ctx,825,140,20,C.green);drawLine(ctx,815,140,835,140,C.bg,3);drawLine(ctx,825,130,825,150,C.bg,3);
    drawText(ctx,'跳连',670,58,C.green,16);drawText(ctx,'网络',670,248,boundary?C.muted:C.blue,16);
    drawText(ctx,skip.toFixed(3),680,96,C.text,16);drawText(ctx,out.toFixed(3),680,195,boundary?C.muted:C.text,16);
  }}/><div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}>{names.map((n,i)=><button key={n} className={`chip${selected===i?' selected':''}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{i+1} · {n}</button>)}<button className={`chip${boundary?' selected':''}`} aria-pressed={boundary} onClick={()=>setBoundary(true)}>t=ε</button><button className={`chip${!boundary?' selected':''}`} aria-pressed={!boundary} onClick={()=>setBoundary(false)}>t&gt;ε</button></div>
    <p>当前：{names[selected]}　t={boundary?'ε=0.002':'1'}　c_skip={skip.toFixed(3)}　c_out={out.toFixed(3)}　输出维度：d</p>
    <p className="feedback" role="status" style={{color:boundary?C.green:C.blue}}>{details[selected]}{boundary?' 当前网络分支权重为0。':''}</p>
  </div>;
}
