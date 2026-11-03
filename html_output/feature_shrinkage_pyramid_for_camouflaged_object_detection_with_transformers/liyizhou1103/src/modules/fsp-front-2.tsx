import {useEffect,useRef,useState} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
const paper='#faf5e8', cloth='#e4d6b8', ink='#304b50', teal='#397970', red='#ba583d', line='#b8a98d';
function drawing(draw:(c:CanvasRenderingContext2D)=>void){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,1080,280);el.style.width='100%';el.style.height='auto';
 const render=()=>{c.save();c.fillStyle=paper;c.fillRect(0,0,1080,280);c.lineWidth=2;c.lineCap='round';c.lineJoin='round';draw(c);c.restore();el.classList.add('is-ready');};render();return observeCanvas(el,render,()=>{});},[draw]);return ref;
}
function fabric(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
 c.save();c.fillStyle=cloth;c.fillRect(x,y,w,h);c.beginPath();c.rect(x,y,w,h);c.clip();
 for(let i=-h;i<w+h;i+=13){c.strokeStyle='#cfbfa0';c.beginPath();c.moveTo(x+i,y);c.lineTo(x+i+h,y+h);c.stroke();c.strokeStyle='#ece3cd';c.beginPath();c.moveTo(x+i,y+h);c.lineTo(x+i+h,y);c.stroke();}c.restore();
}
function tip(s:string){return <div role="status" style={{padding:'10px 14px',background:'#eef4ef',borderLeft:'3px solid '+teal,color:ink}}>{s}</div>}
export function FspFront2(){
 const [s,setS]=useState(276);const row=Math.floor(s/24),col=s%24;
 const start=Math.max(0,Math.min(571,s-2));const r=drawing(c=>{fabric(c,120,20,240,240);
 c.lineWidth=.8;c.strokeStyle=line;for(let i=0;i<=24;i++){c.beginPath();c.moveTo(120+i*10,20);c.lineTo(120+i*10,260);c.moveTo(120,20+i*10);c.lineTo(360,20+i*10);c.stroke();}
 c.fillStyle=red;c.fillRect(120+col*10,20+row*10,10,10);
 for(let j=0;j<5;j++){const x=480+j*96,sel=start+j===s;fabric(c,x,101,73,73);c.strokeStyle=sel?red:line;c.lineWidth=sel?4:2;c.strokeRect(x,101,73,73);
 c.font='18px sans-serif';c.fillStyle=sel?red:ink;c.fillText(String(start+j),x+15,207);}
 c.strokeStyle=teal;c.beginPath();c.moveTo(376,139);c.lineTo(455,139);c.lineTo(445,132);c.moveTo(455,139);c.lineTo(445,146);c.stroke();});
 return <><canvas ref={r} role="img" aria-label={'24乘24布块网格；选中第'+(row+1)+'行、第'+(col+1)+'列'} onClick={e=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)*1080/b.width,y=(e.clientY-b.top)*280/b.height;if(x>=120&&x<360&&y>=20&&y<260)setS(24*Math.floor((y-20)/10)+Math.floor((x-120)/10));}}/><label className="ctrl">图像 token 编号：{s}<input aria-label="图像 token 编号" type="range" min={0} max={575} value={s} onChange={e=>setS(Number(e.target.value))}/></label>{tip('第 '+(row+1)+' 行、第 '+(col+1)+' 列 → 序号 '+row+' × 24 + '+col+' = '+s+'。这块 16×16 图像内容被投影为一个 token，并叠加对应的位置嵌入。')}</>;
}
