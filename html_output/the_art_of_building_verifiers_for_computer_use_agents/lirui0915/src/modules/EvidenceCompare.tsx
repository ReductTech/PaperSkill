import {useEffect,useState} from 'react';
import {CanvasView,Controls,Feedback,Metric,palette as p,page,line,label,loupe} from './proofKit';
export function EvidenceCompare(){
 const [progress,setProgress]=useState(0),[running,setRunning]=useState(false);
 useEffect(()=>{if(!running)return;let frame=0;const start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{const t=reduced?1:Math.min(1,(now-start)/1500);setProgress(t);if(t<1)frame=requestAnimationFrame(tick);else setRunning(false);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[running]);
 const checked=progress===1;
 return <div><CanvasView label="左右校样同步核验：代理声称6.2%，截图实际2.8%" draw={(c,w,h)=>{page(c,45,25,w/2-65,h-50);page(c,w/2+20,25,w/2-65,h-50);[75,w/2+50].forEach(x=>{for(let j=0;j<4;j++)line(c,x,70+j*43,x+330,70+j*43,p.border,2);});label(c,'代理自述',90,58,p.ink,22);label(c,'截图证据',w/2+70,58,p.ink,22);label(c,'6.2%',125,155,p.red,48);label(c,checked?'2.8%':'—',w/2+100,155,checked?p.green:p.blue,48);c.save();c.globalAlpha=1-progress;c.fillStyle=p.light;c.fillRect(w/2+70,86,290,105);c.restore();if(progress>0){c.strokeStyle=p.red;c.lineWidth=3;c.beginPath();c.ellipse(195,140,105,46,0,0,Math.PI*2);c.stroke();c.strokeStyle=p.green;c.beginPath();c.ellipse(w/2+175,140,105,46,0,0,Math.PI*2);c.stroke();}loupe(c,120+progress*245,180,30,p.blue);loupe(c,w/2+100+progress*245,180,30,checked?p.green:p.blue);}}/>
 <Controls><button style={{minHeight:44}} disabled={running||checked} onClick={()=>setRunning(true)}>核对证据</button><button style={{minHeight:44}} disabled={progress===0&&!running} onClick={()=>{setRunning(false);setProgress(0);}}>恢复自述</button><Metric label="核对进度" value={`${Math.round(progress*100)}%`}/></Controls>
 <Feedback tone={checked?'bad':'neutral'}>{checked?'✕ 截图是2.8% CIDEr，代理却声称6.2%。显式矛盾不能作为完成证明。':running?'正在同步核对：两侧使用同一个检查进度。':'代理说“提升6.2%”，这还不是完成证明。按下按钮查看截图证据。'}</Feedback></div>;
}
