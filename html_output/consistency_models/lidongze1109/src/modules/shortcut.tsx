import { useEffect, useRef, useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawHiker, drawCamp, drawTrail, drawLine, drawText } from './cm-kit';

function path(p:number,offset:number):[number,number]{return [offset+105+340*p,205-105*p+32*Math.sin(p*Math.PI*3)];}
export function Shortcut(){
  const [progress,setProgress]=useState(0),[running,setRunning]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!running)return;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(media.matches){setProgress(1);setRunning(false);return;}
    let frame=0,last=0,elapsed=0,visible=false,done=false;
    const tick=(now:number)=>{if(done||!visible||document.hidden)return;if(last)elapsed+=Math.min(now-last,80);last=now;const p=Math.min(elapsed/3600,1);setProgress(p);if(p<1)frame=requestAnimationFrame(tick);else{done=true;setRunning(false);}};
    const resume=()=>{cancelAnimationFrame(frame);last=0;if(visible&&!document.hidden&&!done)frame=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});
    if(root.current)observer.observe(root.current);document.addEventListener('visibilitychange',resume);
    return()=>{done=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',resume);};
  },[running]);
  const local=progress===0?0:Math.min(12,Math.ceil(progress*12));
  return <div ref={root}>
    <SceneCanvas ariaLabel="同一起点左侧逐步积分，右侧直接预测营地，两边同步开始" draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,1080,280);drawLine(ctx,540,35,540,245,C.border,2);
      [0,540].forEach(offset=>{drawTrail(ctx,Array.from({length:49},(_,i)=>path(i/48,offset)),C.light,3);drawCamp(ctx,offset+105,205,.8);});
      drawText(ctx,'局部方向',50,35,C.red);drawText(ctx,'终点预测',590,35,C.green);
      const p=1-progress,a=path(p,0);drawTrail(ctx,Array.from({length:49},(_,i)=>path(p+(1-p)*i/48,0)),C.red,4);drawHiker(ctx,a[0],a[1],C.red,0,.85);
      const start=path(1,540),end=path(0,540),direct=Math.min(1,progress*12);
      ctx.setLineDash([8,7]);drawLine(ctx,start[0],start[1],end[0],end[1],C.green,3);ctx.setLineDash([]);
      drawHiker(ctx,start[0]+(end[0]-start[0])*direct,start[1]+(end[1]-start[1])*direct,C.green,0,.85);
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><button className="chip" disabled={running} onClick={()=>{setProgress(0);setRunning(true);}}>比较两种方式</button><button className="chip" onClick={()=>{setRunning(false);setProgress(0);}}>重置</button></div>
    <div>示意调用数：局部方向 {local} 次 · 终点预测 {progress>0?1:0} 次。12 与 1 仅为教学示例，动画时长不表示实测加速。</div>
    <div className="feedback" role="status" style={{color:progress===1?C.green:C.blue}}>{progress===0?'两边从相同位置出发；先比较它们要预测什么。':progress===1?'一步指一次一致性网络评估，并不保证质量等于多步扩散。':'左边估计局部方向，右边直接估计终点。'}</div>
  </div>;
}
