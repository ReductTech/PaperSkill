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
function buttons(names:string[],s:number,change:(n:number)=>void){return <div className="ctrl">{names.map((v,i)=><button key={v} type="button" aria-pressed={s===i} className={'chip'+(s===i?' active':'')} onClick={()=>change(i)}>{v}</button>)}</div>}
export function FspFront1(){
 const [s,setS]=useState(0);const names=['小目标','遮挡','边界模糊'];
 const r=drawing(c=>{fabric(c,64,34,423,210);c.fillStyle='#eff2ed';c.fillRect(587,34,423,210);
 [277,800].forEach((x,i)=>{c.save();c.translate(x,140);const k=s===0?.4:1;c.scale(k,k);
 c.beginPath();c.moveTo(-95,5);c.bezierCurveTo(-45,-61,39,-66,96,-16);c.bezierCurveTo(53,42,-26,67,-95,5);c.closePath();c.fillStyle=i?ink:s===2?'#dcceb2':'#b7a98e';c.fill();
 if(!i){c.save();c.clip();c.strokeStyle='#c3b69b';for(let j=-140;j<100;j+=14){c.beginPath();c.moveTo(j,-65);c.lineTo(j+116,65);c.stroke();}c.restore();}
 if(s===1){if(i){c.fillStyle='#eff2ed';c.fillRect(15,-58,34,120);}else fabric(c,15,-58,34,120);}c.restore();});
 c.font='18px sans-serif';c.fillStyle=ink;c.fillText('布纹输入',65,269);c.fillText('可见掩膜',590,269);});
 return <><canvas ref={r} role="img" aria-label={'左侧同纹布块与右侧理想可见区域：'+names[s]}/>{buttons(names,s,setS)}{tip(['小目标占据的像素少；右侧掩膜虽完整，在左侧输入中却只留下很少线索。','遮挡使可见区域分开。图中只给出可见目标的示意掩膜，并未猜测遮挡物下的内容。','前景色和底布色接近，轮廓不再清楚。知道中心位置，仍不能决定边缘像素的归属。'][s])}</>;
}
