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
export function FspFront3(){
 const [s,setS]=useState(0);const scores=[[0,0],[Math.log(3),0],[0,Math.log(3)]][s],ex=scores.map(Math.exp),wt=ex.map(v=>v/(ex[0]+ex[1])),products=[2*wt[0],6*wt[1]],mean=(products[0]+products[1])/2;
 const r=drawing(c=>{fabric(c,65,48,284,170);[0,1].forEach(i=>{const x=115+i*125;
 c.strokeStyle=i?teal:red;c.lineWidth=3+8*wt[i];c.setLineDash([7,6]);c.beginPath();c.moveTo(x,82);c.lineTo(x+42,184);c.stroke();});c.setLineDash([]);
 c.strokeStyle=line;c.beginPath();c.moveTo(402,221);c.lineTo(1003,221);c.stroke();[products[0],products[1],mean].forEach((n,i)=>{const x=454+165*i;c.fillStyle=[red,teal,ink][i];c.fillRect(x,221-n*33,62,n*33);c.fillStyle=ink;c.font='18px sans-serif';c.fillText(n.toFixed(2),x+8,248);});});
 return <><canvas ref={r} role="img" aria-label={'左图线迹粗细代表权重；右图为两个加权项及其均值 '+mean.toFixed(2)}/>{buttons(['均衡','强调第一项','强调第二项'],s,setS)}<div className="ctrl"><span>投影分数：{['(0, 0)','(ln 3, 0)','(0, ln 3)'][s]}</span><span>权重：({wt.map(v=>v.toFixed(2)).join('，')})</span><span>键特征：(2，6)</span></div>{tip('逐元素乘积为 '+products[0].toFixed(2)+' 和 '+products[1].toFixed(2)+'；按示例池化窗口求平均，T′q = '+mean.toFixed(2)+'。输出变化来自联合特征的权重，而非键特征改变。')}</>;
}
