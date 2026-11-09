import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawTrail, drawHiker, drawCamp, drawDot, drawLine, drawText } from './cm-kit';
const palette=['#d6e1ef','#a7bdd5','#718ba4','#d7c9a8','#9ca57c','#5b775a'];
const unknown=(r:number,c:number)=>r>=2&&r<=5&&c>=2&&c<=5;
const original=(r:number,c:number)=>(r+Math.floor(c/2))%6;
const candidate=(r:number,c:number)=>(original(r,c)+1+(r+c)%3)%6;
export function Editing(){
  const [project,setProject]=useState(false);
  const changed=project?0:48;
  return <div><SceneCanvas ariaLabel={project?'替换已知区域后，48个已知像素全部保留':'整图候选改变了48个已知像素'} draw={ctx=>{
    clearScene(ctx);drawSetting(ctx,520,280);drawTrail(ctx,[[75,220],[180,185],[280,205],[420,95]],C.dark,3);drawCamp(ctx,75,220,.8);
    drawDot(ctx,280,205,10,C.green);drawDot(ctx,project?280:335,project?205:155,13,project?C.green:C.red);if(!project)drawLine(ctx,280,205,335,155,C.red,3);drawHiker(ctx,project?280:335,project?205:155,C.blue,0,.9);
    drawText(ctx,'已知锚点',55,35,C.muted,16);drawText(ctx,'掩码补全',600,35,C.text,16);
    const size=25,top=57;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const u=unknown(r,c),x=780+c*size,y=top+r*size;
      ctx.fillStyle=palette[original(r,c)];ctx.fillRect(548+c*size,y,23,23);
      if(u){ctx.fillStyle=C.bg;ctx.fillRect(548+c*size,y,23,23);ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(549+c*size,y+1,21,21);}
      ctx.fillStyle=palette[project&&!u?original(r,c):candidate(r,c)];ctx.fillRect(x,y,23,23);
      if(!u){ctx.strokeStyle=project?C.green:C.red;ctx.lineWidth=1.5;ctx.strokeRect(x+1,y+1,21,21);}
    }
    ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.strokeRect(830,top+50,98,98);
  }}/><div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><button className={`chip${!project?' selected':''}`} aria-pressed={!project} onClick={()=>setProject(false)}>整图重画</button><button className={`chip${project?' selected':''}`} aria-pressed={project} onClick={()=>setProject(true)}>保留已知区域</button></div>
    <p>已知区域改动：<strong style={{color:project?C.green:C.red}}>{changed} / 48 像素</strong>　未知区域：16 像素（橙色边框）。左小图为观测，右小图为同一候选的处理结果。</p>
    <p>补全特例 A=I；Ω=1 表示未知，Ω=0 表示已知。替换：y⊙(1−Ω)+x⊙Ω。</p>
    <p className="feedback" role="status" style={{color:project?C.green:C.red}}>{project?'施加替换：已知区域恢复为参考图像，未知部分仍由同一模型候选提供。':'无约束：生成候选改动了已知区域，无法保证观测一致。'} 论文编辑示例来自 LSUN Bedroom 上的 CD 模型，不能据此证明任意领域泛化。</p>
  </div>;
}
