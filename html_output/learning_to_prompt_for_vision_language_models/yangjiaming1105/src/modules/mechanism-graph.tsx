import { MotionRegion } from './learning-visuals';
import './learning-visuals.css';
type Item={id:string;name:string;short:string;fixed:boolean;x:number;y:number};
export function MechanismGraph({nodes,selected,direction,detached,onSelect}:{nodes:Item[];selected:string;direction:string;detached:boolean;onSelect:(id:string)=>void}){
 const positions:Record<string,[number,number]>={context:[105,170],class:[105,315],text:[425,265],image:[425,70],similarity:[750,170],loss:[960,170]};
 const paths:[string,string][]=[['context','text'],['class','text'],['text','similarity'],['image','similarity'],['similarity','loss']];
 const path=(a:string,b:string)=>{const [x,y]=positions[a],[xx,yy]=positions[b];return `M${x+88} ${y}C${x+145} ${y} ${xx-145} ${yy} ${xx-88} ${yy}`};
 const active=(a:string,b:string)=>direction==='forward'||(b==='loss'||(!detached&&((a==='text'&&b==='similarity')||a==='context')));
 const lock=<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="4" y="10" width="16" height="12" rx="3"/><path d="M12 14v4"/></svg>;
 const button=(id:string,mobile=false)=>{const n=nodes.find(x=>x.id===id)!;const[x,y]=positions[id];return <button key={id} type="button" className={mobile?'lv-mobile-node':'lv-network-node'} style={mobile?undefined:{left:`${x/1080*100}%`,top:`${y/430*100}%`}} aria-pressed={selected===id} onClick={()=>onSelect(id)}>{n.fixed?lock:null}{n.short}<span>{id==='class'?'名称保持不变':n.fixed?'权重固定':id==='context'?'唯一可学习参数':id==='loss'?'训练标签：猫':'比较两路特征'}</span></button>};
 return <><MotionRegion className="lv-network"><div data-direction={direction} className="lv-network-layer"><svg className="lv-network-lines" viewBox="0 0 1080 430" preserveAspectRatio="none" aria-hidden="true">{paths.map(([a,b])=><path key={a+b} d={path(a,b)} fill="none" stroke="#d2dfdf" strokeWidth="4"/>)}{paths.filter(([a,b])=>active(a,b)).map(([a,b])=><path key={a+b+direction+String(detached)} d={path(a,b)} className="lv-flow-line" style={{stroke:direction==='forward'?'#285b86':'#ed8754',animationDirection:direction==='backward'?'reverse':'normal'}}/>)}</svg>{nodes.map(n=>button(n.id))}{detached&&direction==='backward'&&<div className="lv-network-stop" role="img" aria-label="梯度在文本输出处断开">×</div>}</div></MotionRegion>
 <div className="lv-mobile-network" data-direction={direction}>
  <div className="lv-mobile-branch"><strong>图像支路</strong><span>当前图片</span><b aria-hidden="true">↓</b>{button('image',true)}</div>
  <div className="lv-mobile-branch"><strong>文本支路</strong><div className="lv-mobile-inputs">{button('context',true)}<span>＋</span>{button('class',true)}</div><b aria-hidden="true">{direction==='backward'?'↑':'↓'}</b>{button('text',true)}</div>
  <p className={detached&&direction==='backward'?'lv-path-broken':'lv-path-caption'}>{detached&&direction==='backward'?'× 文本梯度在这里断开':direction==='backward'?'↑ 学习信号经过文本编码器回到 V':'↓ 图像特征与文本特征一起参与比较'}</p>
  {button('similarity',true)}<b aria-hidden="true">{direction==='backward'?'↑':'↓'}</b>{button('loss',true)}
 </div></>;
}
