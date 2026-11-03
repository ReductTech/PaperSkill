import {useState,useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
const navy='#294b66', gold='#b76a3d', jade='#478477', pale='#eff4ec', faint='#ced9cf';
type Ctx=CanvasRenderingContext2D;
function stroke(c:Ctx,points:number[][],color:string,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function node(c:Ctx,x:number,y:number,on:boolean,r=12){c.fillStyle=on?gold:faint;c.strokeStyle=on?navy:'#97ab9c';c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();c.stroke();}
function diagram(c:Ctx,s:string,x:number,y:number){c.fillStyle=navy;c.font='bold 18px sans-serif';c.fillText(s,x,y);}
function Canvas({render,alt}:{render:(c:Ctx)=>void;alt:string}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,1080,260);el.style.width='100%';el.style.height='auto';return observeCanvas(el,()=>{c.save();c.fillStyle=pale;c.fillRect(0,0,1080,260);c.lineCap='round';render(c);c.restore();el.classList.add('is-ready');},()=>{});},[render]);return <canvas ref={ref} width={1080} height={260} role="img" aria-label={alt}/>;}
function Choices({opts,n,set}:{opts:string[];n:number;set:(k:number)=>void}){return <div className="ctrl">{opts.map((o,i)=><button type="button" key={o} aria-pressed={i===n} className={'chip'+(i===n?' active':'')} onClick={()=>set(i)}>{o}</button>)}</div>}
export function Fsp5b(){const [n,set]=useState(4);const opts=['U 形','密集整合','反馈细化','高低层分开','逐级收缩'];return <div><Canvas alt={'图 2 的'+opts[n]+'概念拓扑示意'} render={c=>{
 const dots:number[][]=[],edges:number[][]=[];if(n===0){dots.push([180,51],[320,109],[470,184],[660,109],[820,51]);edges.push([0,1],[1,2],[2,3],[3,4],[1,3],[0,4]);}
 else if(n===1){dots.push([210,60],[210,135],[210,211],[515,95],[515,177],[820,136]);edges.push([0,3],[1,3],[2,3],[0,4],[1,4],[2,4],[3,5],[4,5]);}
 else if(n===2){dots.push([185,153],[410,153],[615,153],[830,153]);edges.push([0,1],[1,2],[2,3]);stroke(c,[[830,137],[830,70],[410,70],[410,126]],gold,4);stroke(c,[[401,115],[410,127],[419,115]],gold,3);}
 else if(n===3){dots.push([175,56],[175,112],[175,165],[175,221],[523,83],[523,194],[825,138]);edges.push([0,4],[1,4],[2,5],[3,5],[4,6],[5,6]);}
 else {dots.push([170,53],[170,105],[170,162],[170,214],[480,79],[480,188],[820,134]);edges.push([0,4],[1,4],[2,5],[3,5],[4,6],[5,6],[4,5]);}
 edges.forEach(([a,b])=>stroke(c,[dots[a],dots[b]],jade,3));dots.forEach(([x,y],i)=>node(c,x,y,i===dots.length-1,12));diagram(c,opts[n],38,32);}}/><Choices opts={opts} n={n} set={set}/><div className="feedback" aria-live="polite">{['U 形：沿解码路径恢复空间细节，并用跳接接入编码特征。','密集整合：多层特征通过较密集的连接汇合。','反馈细化：后续结果回流，供前面的表示再次细化。','分开解码：低层细节与高层语义经不同支路处理，再合并。','FSD：先聚合邻近特征，再把结果传给同层后继和下一层。这里只比较连线原则，不比较分数。'][n]}</div></div>}
