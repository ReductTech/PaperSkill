import React,{useState,useRef} from 'react';
import {Stage,C,box,line,label,book,photo,arrow,Chips,Notice,Stat,Lab,Legend} from './maple-kit';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const control:React.CSSProperties={border:'1px solid '+C.border,borderRadius:12,background:'#fff',color:C.blue,padding:'8px 14px',minHeight:44};
export function MapleCoupling(){
 const [mode,setMode]=useState(0),[p,setP]=useState<[number,number]>([.4,.65]);
 const q=mode===1?[p[0],.5*p[0]+.5*p[1],p[1]]:[.4,.4,.4];
 const smooth=useRef({p:[.4,.65],q:[.4,.4,.4],key:'0/.4/.65',at:-10});
 const move=(dx:number,dy:number)=>setP(old=>[clamp(old[0]+dx),clamp(old[1]+dy)]);
 const draw=(c:CanvasRenderingContext2D,w:number,h:number,t:number)=>{
  const shown=smooth.current,key=mode+'/'+p.join('/');
  if(shown.key!==key){shown.key=key;shown.at=t;}
  const progress=t===0?1:Math.min(1,Math.max(0,(t-shown.at)/.72));
  shown.p=shown.p.map((v,i)=>t===0?p[i]:v+(p[i]-v)*.24);
  shown.q=shown.q.map((v,i)=>t===0?q[i]:v+(q[i]-v)*.18);
  c.save();c.scale(w/1080,h/320);
  const card=(x:number,y:number,cw:number,ch:number)=>{c.save();c.shadowColor='#9e456a10';c.shadowBlur=20;c.shadowOffsetY=6;box(c,x,y,cw,ch,'#ffffff',C.border,18);c.restore();};
  card(22,22,278,276);card(335,38,284,246);card(769,38,288,246);
  label(c,'拖动文字提示',45,51,18,C.ink);label(c,'Pᵢ',361,68,25,C.green);label(c,'P̃ᵢ',795,68,25,mode===1?C.purple:C.green);
  label(c,'文字提示',402,69,16,C.muted);label(c,'视觉提示',842,69,16,C.muted);
  box(c,61,87,211,183,'#fff9fb',C.border,10);
  for(let i=1;i<4;i++){line(c,61+i*52.75,87,61+i*52.75,270,'#f0e6ec',1);line(c,61,87+i*45.75,272,87+i*45.75,'#f0e6ec',1);}
  label(c,'p₁',278,281,15,C.muted);label(c,'p₂',45,89,15,C.muted);
  const px=61+shown.p[0]*211,py=270-shown.p[1]*183;
  line(c,px,270,px,py,C.green,1,[3,4]);line(c,61,py,px,py,C.green,1,[3,4]);
  c.beginPath();c.arc(px,py,18,0,Math.PI*2);c.fillStyle='#4f8c7c18';c.fill();
  c.beginPath();c.arc(px,py,9,0,Math.PI*2);c.fillStyle=C.green;c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.stroke();
  box(c,359,92,236,43,'#fff6f9',undefined,9);label(c,'类别名称保持不变',477,114,15,C.muted,'center');
  photo(c,983,52,54,66,0);
  for(let i=0;i<2;i++){label(c,String(i+1),368,177+i*49,13,C.muted);box(c,385,164+i*49,208,25,'#edf5f1',undefined,6);box(c,385,164+i*49,7+201*shown.p[i],25,C.green,undefined,6);}
  for(let i=0;i<3;i++){label(c,String(i+1),795,146+i*44,13,C.muted);box(c,813,135+i*44,220,22,'#f5eff9',undefined,6);box(c,813,135+i*44,7+213*shown.q[i],22,mode===1?C.purple:C.green,undefined,6);}
  if(mode===1){
   const paths=[[[625,176],[650,176],[665,160]],[[625,225],[650,225],[665,181]],[[723,169],[744,169],[762,146]],[[723,169],[744,169],[762,190]],[[723,169],[744,205],[762,234]]];
   paths.forEach(points=>{c.beginPath();c.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(a=>c.lineTo(a[0],a[1]));c.strokeStyle=C.purple;c.lineWidth=2;c.lineJoin='round';c.stroke();});
   box(c,663,139,62,62,'#f7f0fc',C.purple,16);label(c,'Fᵢ',694,171,27,C.purple,'center');
   label(c,'联动',694,236,15,C.purple,'center');
   if(progress<1){const track=[[625,176],[650,176],[665,160],[694,169],[744,169],[762,190]];const lengths=track.slice(1).map((v,i)=>Math.hypot(v[0]-track[i][0],v[1]-track[i][1]));let left=lengths.reduce((sum,n)=>sum+n,0)*progress;let x=625,y=176;for(let i=0;i<lengths.length;i++){const f=Math.min(1,left/lengths[i]);x=track[i][0]+(track[i+1][0]-track[i][0])*f;y=track[i][1]+(track[i+1][1]-track[i][1])*f;left-=lengths[i];if(left<=0)break;}if(x<663||x>725){c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fillStyle=C.purple;c.fill();}} 
  }else{
   line(c,633,185,674,185,C.border,2,[4,5]);line(c,714,185,755,185,C.border,2,[4,5]);
   c.beginPath();c.arc(694,185,16,0,Math.PI*2);c.strokeStyle=C.border;c.lineWidth=2;c.stroke();
   line(c,684,195,704,175,C.muted,2);label(c,'独立参数',694,236,15,C.muted,'center');
  }
  c.restore();
 };
 return <Lab>
  <div className="maple-tag">结构交互 · 二维到三维的教学模型</div>
  <p>先拖动左侧绿点，再切换连接方式：只有建立 Fᵢ 映射后，右侧三条视觉提示才会跟随文字提示。</p>
  <Chips label="两支怎样连接" items={['独立双支提示','MaPLe 耦合提示']} value={mode} onChange={setMode}/>
  <div className="maple-stage" tabIndex={0} role="group" aria-label="文字提示控制区，使用方向键调整两个分量" style={{borderRadius:14}} onKeyDown={e=>{const d:Record<string,[number,number]>={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};if(d[e.key]&&e.target===e.currentTarget){e.preventDefault();move(...d[e.key]);}}}>
   <Stage height={320} label="左侧可拖动文字提示点，右侧卡片显示文字提示与视觉提示的连接；图片本身不变" draw={draw} onPoint={(x,y)=>{const px=x*1080,py=y*320;if(px>=51&&px<=282&&py>=77&&py<=280)setP([clamp((px-61)/211),clamp((270-py)/183)]);}}/>
  </div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:12}} role="group" aria-label="拖动的按钮替代">
   <button type="button" style={control} onClick={()=>move(-.05,0)} aria-label="减小第一个分量">←</button><button type="button" style={control} onClick={()=>move(.05,0)} aria-label="增大第一个分量">→</button><button type="button" style={control} onClick={()=>move(0,.05)} aria-label="增大第二个分量">↑</button><button type="button" style={control} onClick={()=>move(0,-.05)} aria-label="减小第二个分量">↓</button><button type="button" style={control} onClick={()=>setP([.4,.65])}>重置提示</button><span style={{fontSize:12,color:C.muted}}>也可 Tab 聚焦图框后按方向键</span>
  </div>
  <Legend items={[{label:'绿色：可学习提示',color:C.green},{label:'紫色：耦合映射及派生提示',color:C.purple},{label:'玫瑰色：输入信息',color:C.blue}]}/>
  <div className="maple-grid"><Stat label="文字示意向量 p" value={'('+p.map(n=>n.toFixed(2)).join(', ')+')'}/><Stat label="视觉示意向量 q" value={'('+q.map(n=>n.toFixed(2)).join(', ')+')'}/><Stat label="真实 MaPLe 维度" value="512 → 768" note="每层 b 个提示；不是最终特征投影"/></div>
  {mode===1&&<div className="maple-action-caption"><span className="action-index">F</span><div><strong>三条视觉提示怎样得到？</strong><p>q₁ = p₁ = {p[0].toFixed(2)}；q₂ = (p₁ + p₂) ÷ 2 = {q[1].toFixed(2)}；q₃ = p₂ = {p[1].toFixed(2)}。这是用于理解依赖的玩具映射。</p></div></div>}
  <Notice tone={mode===1?'purple':'green'}>{mode===1?'已联动：Pᵢ 改变会经过 Fᵢ 传到视觉提示。类名与图片保持不变。':'尚未联动：本次只改 Pᵢ，所以独立视觉提示保持原值。它仍可训练，两支仍共享分类损失。'}</Notice>
  <details><summary>把玩具映射与论文公式分开看</summary><p>本图 q = (p₁, 0.5p₁ + 0.5p₂, p₂)，只演示函数依赖，不是 CLIP 真实特征或训练结果。论文使用逐层可学习的仿射映射 P̃ᵢ = Fᵢ(Pᵢ)，把 b × 512 映射为 b × 768。图中的标注条表示视觉 token 旁的额外提示，不修改图片像素，也不是由类别名称生成。</p></details>
  <p className="maple-source">机制依据：论文 §3.2.3；投影方向对照见附录 B 表 9。此模块不预测准确率。</p>
 </Lab>;
}
