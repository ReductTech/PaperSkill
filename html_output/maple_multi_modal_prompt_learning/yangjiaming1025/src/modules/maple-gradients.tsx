import React,{useState,useRef} from 'react';
import {Stage,C,box,line,label,arrow,Chips,Notice,Stat,Lab,Legend} from './maple-kit';
import {Sequence,ActionCaption} from './maple-sequence';
const fmt=(n:number)=>Math.abs(n)<.00005?'0.0000':n.toFixed(4);
type Point=[number,number];
function path(c:CanvasRenderingContext2D,points:Point[],color:string,width=2,progress=1){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let left=lengths.reduce((a,b)=>a+b,0)*progress;let end=points[0];
 c.save();c.beginPath();c.moveTo(...points[0]);for(let i=0;i<lengths.length;i++){const p=points[i],n=points[i+1],f=Math.min(1,left/lengths[i]);end=[p[0]+(n[0]-p[0])*f,p[1]+(n[1]-p[1])*f];c.lineTo(...end);left-=lengths[i];if(left<=0)break;}c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.lineWidth=width;c.stroke();c.restore();return end;
}
function card(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,text:string,active=false){c.save();c.shadowColor='#9e456a0d';c.shadowBlur=15;c.shadowOffsetY=4;box(c,x,y,w,h,active?'#fff0f6':'#fff',active?color:C.border,14);c.restore();label(c,text,x+w/2,y+h/2,21,color,'center');}
function lock(c:CanvasRenderingContext2D,x:number,y:number){box(c,x,y,17,13,'#fff',C.muted,3);line(c,x+4,y,x+4,y-5,C.muted,1.4);line(c,x+4,y-5,x+13,y-5,C.muted,1.4);line(c,x+13,y-5,x+13,y,C.muted,1.4);}
export function MapleGradients(){
 const [p,setP]=useState(.3),[phase,setPhase]=useState(0),[route,setRoute]=useState(0),[round,setRound]=useState(1),[replay,setReplay]=useState(0);
 const motion=useRef({key:'0/1',at:-10}),routes=useRef({key:'0/0',at:-10});
 const h=2*(.5+p),loss=.5*h*h,gradient=2*h,nextP=p-.05*gradient;
 const next=()=>{if(phase<3)setPhase(n=>n+1);else {setP(nextP);setPhase(0);setRound(n=>n+1);}};
 const drawToy=(c:CanvasRenderingContext2D,w:number,hg:number,t:number)=>{
  const key=phase+'/'+round;if(motion.current.key!==key)motion.current={key,at:t};const a=t===0?1:Math.min(1,Math.max(0,(t-motion.current.at)/1.15));
  c.save();c.scale(w/1080,hg/220);
  const top:Point[]=[[103,61],[260,110]],bottom:Point[]=[[103,159],[260,110]],forward:Point[]=[[260,110],[445,110],[685,110],[941,110]];
  [top,bottom,forward].forEach(points=>path(c,points,C.border,2));
  if(phase===0){path(c,top,C.blue,2);path(c,[[103,159],[260,110],[445,110],[685,110]],C.blue,3,a);}
  if(phase===1)path(c,[[685,110],[941,110]],C.orange,3,a);
  if(phase===2)path(c,[[941,110],[685,110],[445,110],[260,110],[103,159]],C.purple,3.5,a);
  card(c,32,35,142,51,C.blue,'u = 0.50');card(c,32,134,142,51,C.green,(phase===3?'新 p = ':'p = ')+(phase===3?p+(nextP-p)*(1-Math.pow(1-a,3)):p).toFixed(2),phase===3);
  c.beginPath();c.arc(260,110,29,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.strokeStyle=C.border;c.lineWidth=1.5;c.stroke();label(c,'+',260,110,32,C.blue,'center');
  card(c,357,72,176,76,phase===2?C.purple:C.muted,'× 2',phase===2);lock(c,436,164);label(c,'不更新',445,195,14,C.muted,'center');
  card(c,617,72,136,76,C.blue,fmt(h),phase===0);card(c,851,72,180,76,C.orange,phase>=1?fmt(loss):'？',phase===1);
  label(c,'固定系数',445,43,13,C.muted,'center');label(c,phase===3?'本轮输出 h':'输出 h',685,43,13,C.muted,'center');label(c,phase===3?'本轮误差 L':'误差 L',941,43,13,C.muted,'center');
  if(phase===2){label(c,'← 梯度沿原计算路径返回',755,180,16,C.purple,'center');}
  if(phase===3){line(c,42,194,163,194,C.green,3);label(c,'只改 p',259,159,16,C.green,'center');}
  c.restore();
 };
 const drawRoutes=(c:CanvasRenderingContext2D,w:number,hg:number,t:number)=>{
  const key=route+'/'+replay;if(routes.current.key!==key)routes.current={key,at:t};const a=t===0?1:Math.min(1,Math.max(0,(t-routes.current.at)/1.3));
  c.save();c.scale(w/1080,hg/230);
  const textual:Point[]=[[940,110],[747,55],[475,55],[126,110]],visual:Point[]=[[940,110],[755,176],[540,176],[320,176],[126,110]];
  path(c,textual,C.border,2);path(c,visual,C.border,2);path(c,textual,C.blue,3,a);if(route===0)path(c,visual,C.purple,3,a);
  card(c,63,77,126,66,C.green,'Pᵢ',a===1);
  card(c,380,25,190,60,C.blue,'文字分支');lock(c,557,27);
  card(c,278,152,84,48,C.purple,'Fᵢ',route===0);card(c,445,147,190,58,C.blue,'视觉分支');lock(c,621,149);
  card(c,860,77,160,66,C.orange,'分类损失');
  if(a===1){arrow(c,216,89,195,99,C.blue,2.5);if(route===0)arrow(c,217,141,195,127,C.purple,2.5);}
  label(c,'可训练',126,169,15,C.green,'center');label(c,'也更新',320,217,14,C.purple,'center');
  c.restore();
 };
 return <Lab>
  <div className="maple-tag">梯度如何穿过冻结的计算</div>
  <p>冻结的是参数更新，不是计算过程。先算一次小例子，再把同一个道理放回 MaPLe。</p>
  <div style={{fontSize:15,fontWeight:700,color:C.ink,marginTop:20}}>A · 实算一次：固定乘法，修改提示</div>
  <Sequence caption="一轮更新 · 数值与路径同步变化" steps={['前向计算','计算误差','沿路径反传','只更新提示']} value={phase} onChange={setPhase}/>
  <Stage height={220} label="标量玩具：输入和提示相加，经过冻结乘法，再得到输出和误差；反传沿原路径回到提示" draw={drawToy}/><ActionCaption label={'0'+(phase+1)} action={['输入与提示相加，再乘固定系数','把输出与目标 0 比较','穿过固定乘法，求提示的梯度','沿减小误差的方向更新 p'][phase]} result={['h = 2 × (0.5 + '+fmt(p)+') = '+fmt(h),'L = 0.5 × h² = '+fmt(loss)+'。这是教学用平方误差。','∂L/∂p = h × 2 = '+fmt(gradient)+'。系数 2 不更新，但仍参与求导。','p_new = '+fmt(p)+' − 0.05 × '+fmt(gradient)+' = '+fmt(nextP)+'；固定系数仍为 2。'][phase]}/>
  <div className="maple-actions"><button type="button" className="maple-action-button maple-primary-action" onClick={next}>{phase===3?'用新 p 再算一轮 →':'下一步 →'}</button><button type="button" className="maple-action-button" onClick={()=>{setP(.3);setPhase(0);setRound(1);}}>重置</button><span style={{fontSize:13,color:C.muted}}>第 {round} 轮 · u = 0.5 · 目标 0 · 步长 0.05</span></div>
  <div className="maple-grid"><Stat label="本轮起点 p" value={fmt(p)}/><Stat label="固定乘法系数" value="2（冻结）"/><Stat label="h = 2(u + p)" value={fmt(h)}/><Stat label="L = 0.5h²" value={phase>=1?fmt(loss):'下一步查看'}/></div>
  {phase>=2&&<div className="maple-grid"><Stat label="∂L/∂p = 2h" value={fmt(gradient)} note="系数不更新，仍参与链式法则"/><Stat label={phase===3?'更新后的 p':'将得到的新 p'} value={fmt(nextP)} note="p_new = p − 0.05 × ∂L/∂p"/></div>}
  <Notice tone="orange">这是标量教学玩具。平方误差不是 MaPLe 的损失，数值也不是真实 CLIP 特征。</Notice>
  <div style={{fontSize:15,fontWeight:700,color:C.ink,marginTop:28}}>B · 放回 MaPLe：两条梯度路径汇到 Pᵢ</div>
  <Chips label="观察路径" items={['两条路径一起看','只高亮文字路径']} value={route} onChange={setRoute}/>
  <Stage height={230} label="MaPLe梯度由共同分类损失沿文字分支回到P；视觉分支经可学习F返回同一个P，两支权重冻结" draw={drawRoutes}/>
  <div style={{marginTop:12}}><button type="button" className="maple-action-button" onClick={()=>setReplay(n=>n+1)}>重播梯度路径 ←</button></div>
  <Legend items={[{label:'玫瑰色：文字路径',color:C.blue},{label:'紫色：视觉路径经 Fᵢ 返回',color:C.purple},{label:'锁：权重不更新，梯度仍通过',color:C.muted}]}/>
  <Notice tone="purple">{route===0?'两条路径都会影响 Pᵢ，Fᵢ 本身也更新。两项梯度可能增强或抵消，并不保证同向。':'这里仅收起视觉路径的高亮，方便阅读；模型结构与训练方式没有改变。'}</Notice>
  <details><summary>真实训练的损失、冻结范围与实现边界</summary><p>图像与类别文字输出归一化后计算相似度，乘以 CLIP 的缩放系数，得到类别 logits。训练使用分类交叉熵，只更新 Pᵢ 与 Fᵢ；预训练权重 W 保持不变。</p><p>不能把整个编码器放进 no_grad 或 detach：提示还需要经过编码器的求导路径。独立双支提示也共享分类损失，但两支梯度分别到达两组独立提示；MaPLe 通过 Fᵢ 关联它们。本图不报告虚构的真实梯度数值。</p></details>
  <p className="maple-source">机制依据：论文 §3.2.3；分类交叉熵与参数冻结经官方实现核对。</p>
 </Lab>;
}
