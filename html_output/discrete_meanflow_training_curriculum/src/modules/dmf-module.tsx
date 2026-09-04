import React, { useCallback, useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W=620,H=300;
const C={bg:'#f7f9fc',panel:'#fff',line:'#d5ddea',ink:'#24334a',muted:'#66758b',blue:'#285a9f',green:'#23875b',orange:'#d97706',purple:'#7651b5',red:'#c43f52',gold:'#b98913'};
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const text=(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,size=13,weight=600)=>{c.fillStyle=color;c.font=`${weight} ${size}px "PingFang SC","Segoe UI",sans-serif`;c.fillText(s,x,y)};
const line=(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color=C.line,w=2,dash:number[]=[])=>(c.save(),c.strokeStyle=color,c.lineWidth=w,c.setLineDash(dash),c.beginPath(),c.moveTo(x1,y1),c.lineTo(x2,y2),c.stroke(),c.restore());
const dot=(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,fill=true)=>(c.beginPath(),c.arc(x,y,r,0,Math.PI*2),fill?(c.fillStyle=color,c.fill()):(c.strokeStyle=color,c.lineWidth=2,c.stroke()));
const arrow=(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,w=3)=>{line(c,x1,y1,x2,y2,color,w);const a=Math.atan2(y2-y1,x2-x1);c.fillStyle=color;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-10*Math.cos(a-.55),y2-10*Math.sin(a-.55));c.lineTo(x2-10*Math.cos(a+.55),y2-10*Math.sin(a+.55));c.closePath();c.fill()};
const panel=(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,title:string,color=C.line)=>{c.fillStyle=C.panel;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.stroke();text(c,title,x+12,y+22,color===C.line?C.ink:color,12,700)};
const metric=(c:CanvasRenderingContext2D,label:string,value:string,x:number,y:number,color=C.ink)=>{text(c,label,x,y,C.muted,11);text(c,value,x,y+21,color,16,750)};
const bar=(c:CanvasRenderingContext2D,label:string,value:number,max:number,x:number,y:number,w:number,color:string,shown?:string)=>{text(c,label,x,y-7,C.ink,11);c.fillStyle=C.line;c.fillRect(x,y,w,11);c.fillStyle=color;c.fillRect(x,y,w*clamp(value/max),11);text(c,shown??String(value),x+w+8,y+10,color,12,700)};
const curvePoint=(t:number)=>({x:70+480*t,y:235-155*t+42*Math.sin(t*Math.PI*1.4)});
function path(c:CanvasRenderingContext2D,color=C.line,w=4){c.strokeStyle=color;c.lineWidth=w;c.beginPath();for(let i=0;i<=80;i++){const p=curvePoint(i/80);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)}c.stroke()}
function base(c:CanvasRenderingContext2D,title:string){c.clearRect(0,0,W,H);c.fillStyle=C.bg;c.fillRect(0,0,W,H);text(c,title,20,25,C.ink,13,750)}
type S={a:number;b:number;q:number;step:number;mode:string;progress:number;playing:boolean};

function draw(c:CanvasRenderingContext2D,id:string,s:S){base(c,`交互状态 · ${id}`);
 if(id==='1.1'){const t=s.a,p0={x:80,y:190},p1={x:535,y:70},x=p0.x+(p1.x-p0.x)*t,y=p0.y+(p1.y-p0.y)*t;line(c,p0.x,p0.y,p1.x,p1.y,C.line,6);line(c,p0.x,p0.y,x,y,C.blue,7);line(c,x,y,p1.x,p1.y,C.purple,7);dot(c,p0.x,p0.y,9,C.green);dot(c,p1.x,p1.y,9,C.purple);dot(c,x,y,12,C.orange);text(c,'数据 z₀',42,222,C.green);text(c,'噪声 ε',526,52,C.purple);text(c,`zₜ  t=${t.toFixed(2)}`,x-32,y-18,C.orange);arrow(c,x,y,x+78,y-21,C.blue,4);text(c,'vₜ=ε−z₀（固定配对不变）',327,224,C.blue);bar(c,'数据比例 1−t',1-t,1,70,263,190,C.green,(1-t).toFixed(2));bar(c,'噪声比例 t',t,1,354,263,190,C.purple,t.toFixed(2))}
 else if(id==='2.1'){path(c);const n=8,k=Math.min(n,s.step),p=curvePoint(k/n);for(let i=0;i<=n;i++){const q=curvePoint(i/n);dot(c,q.x,q.y,4,i<=k?C.blue:C.line)}for(let i=0;i<k;i++){const a=curvePoint(i/n),b=curvePoint((i+1)/n);line(c,a.x,a.y,b.x,b.y,C.blue,4)}dot(c,p.x,p.y,10,C.orange);const ahead=curvePoint(Math.max(0,(k-1)/n));arrow(c,p.x,p.y,p.x+(p.x-ahead.x)*.8,p.y+(p.y-ahead.y)*.8,C.red,3);metric(c,'当前 t',(1-k/n).toFixed(2),55,258,C.orange);metric(c,'局部速度',`(${(1.2-k*.06).toFixed(2)}, ${(-.45+k*.08).toFixed(2)})`,185,258,C.blue);metric(c,'累计 NFE',String(k),375,258,C.purple);metric(c,'玩具剩余误差',`${((n-k)/n*100).toFixed(0)}%`,490,258,k===n?C.green:C.red)}
 else if(id==='2.2'){const p=s.progress;panel(c,18,43,282,205,'一次使用起点速度大跳',C.red);panel(c,320,43,282,205,'多步重新查询速度',C.green);const L=(t:number)=>({x:50+210*t,y:204-112*t+34*Math.sin(t*Math.PI)});for(const ox of [0,302]){c.save();c.translate(ox,0);c.strokeStyle=C.line;c.lineWidth=4;c.beginPath();for(let i=0;i<=40;i++){const q=L(i/40);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)}c.stroke();c.restore()}const start=L(0),goal=L(1),lp={x:start.x+(goal.x-start.x)*p,y:start.y+(goal.y-start.y-34)*p},rp=L(p);line(c,start.x,start.y,lp.x,lp.y,C.red,4);line(c,start.x+302,start.y,rp.x+302,rp.y,C.green,4);dot(c,lp.x,lp.y,9,C.red);dot(c,rp.x+302,rp.y,9,C.green);dot(c,goal.x,goal.y,8,C.green,false);dot(c,goal.x+302,goal.y,8,C.green,false);metric(c,'NFE','1',70,260,C.red);metric(c,'玩具残差',`${(34*p).toFixed(1)}`,176,260,C.red);metric(c,'NFE',String(Math.max(1,Math.ceil(p*8))),370,260,C.green);metric(c,'玩具残差',`${((1-p)*8).toFixed(1)}`,487,260,C.green)}
 else if(id==='3.1'){path(c);const r=Math.min(s.a,s.b-.05),t=Math.max(s.b,r+.05),pr=curvePoint(r),pt=curvePoint(t),e=.012,pPrev=curvePoint(Math.max(0,t-e));dot(c,pr.x,pr.y,10,C.green);dot(c,pt.x,pt.y,10,C.orange);line(c,pr.x,pr.y,pt.x,pt.y,C.green,5);const dx=pt.x-pPrev.x,dy=pt.y-pPrev.y;arrow(c,pt.x,pt.y,pt.x+dx*7,pt.y+dy*7,C.blue,4);text(c,'zᵣ',pr.x-12,pr.y+27,C.green);text(c,'zₜ',pt.x-12,pt.y-18,C.orange);text(c,'区间弦 = 平均速度 u',205,263,C.green);text(c,'当前切线 = 瞬时速度 vₜ',205,286,C.blue);metric(c,'r',r.toFixed(2),35,34,C.green);metric(c,'t',t.toFixed(2),113,34,C.orange);metric(c,'t−r',(t-r).toFixed(2),191,34,C.purple);metric(c,'弦长',Math.hypot(pt.x-pr.x,pt.y-pr.y).toFixed(1),290,34,C.green)}
 else if(id==='3.2'){const p=s.progress;panel(c,18,43,282,205,'Flow：局部速度多步积分',C.blue);panel(c,320,43,282,205,'MeanFlow：平均速度一步',C.green);const a={x:55,y:205},g={x:270,y:80};c.save();c.translate(0,0);pathMini(c,25);c.restore();c.save();c.translate(302,0);pathMini(c,25);c.restore();const q=miniCurve(p),one={x:a.x+(g.x-a.x)*p,y:a.y+(g.y-a.y)*p};dot(c,q.x,q.y,9,C.blue);line(c,a.x+302,a.y,one.x+302,one.y,C.green,5);dot(c,one.x+302,one.y,9,C.green);metric(c,'NFE',String(Math.max(1,Math.ceil(p*8))),65,258,C.blue);metric(c,'玩具残差',`${((1-p)*7).toFixed(1)}`,180,258,C.blue);metric(c,'NFE','1',375,258,C.green);metric(c,'玩具残差',`${((1-p)*3).toFixed(1)}`,490,258,C.green)}
 else if(id==='4.1'){const on=(n:number)=>s.step>=n?[C.blue,C.purple,C.orange,C.green][n]:C.line;panel(c,22,65,106,65,'vₜ',on(0));text(c,'+',145,105,s.step>=2?C.ink:C.line,24);panel(c,178,65,90,65,'(r−t)',on(2));text(c,'×',284,105,s.step>=2?C.ink:C.line,22);panel(c,318,65,118,65,'Jθ',on(1));text(c,'=',456,105,s.step>=3?C.ink:C.line,22);panel(c,488,65,110,65,'sg[目标]',on(3));panel(c,113,160,394,62,'JVP[uθ; (vₜ,0,1)]',on(1));text(c,'primals = (zₜ, r, t)',145,193,s.step>=1?C.purple:C.muted);text(c,'tangents = (vₜ, 0, 1)',320,193,s.step>=1?C.purple:C.muted);text(c,['① 基础项：当前瞬时速度 vₜ','② 沿 (vₜ,0,1) 方向计算 JVP','③ (r−t) × Jθ，再与 vₜ 相加','④ u_target = sg[vₜ + (r−t) × Jθ]'][s.step],118,263,on(s.step),14,750)}
 else if(id==='4.2'){const j=s.mode==='jvp';panel(c,42,48,536,185,j?'连续 MF 训练：前向 + 切向传播 + 目标构造':'普通网络前向',j?C.purple:C.blue);const nodes=j?['输入 (zₜ,r,t)','uθ 前向','切向量 (vₜ,0,1)','JVP Jθ','恒等式目标','损失']:['输入 (zₜ,r,t)','uθ 前向','输出 uθ'];nodes.forEach((n,i)=>{const x=65+i*(480/(nodes.length-1||1));dot(c,x,132,11,j&&i>=2?C.purple:C.blue);text(c,n,x-38,i%2?174:97,j&&i>=2?C.purple:C.blue,10);if(i<nodes.length-1)arrow(c,x+12,132,x+480/(nodes.length-1)-12,132,j&&i>=1?C.purple:C.blue,3)});metric(c,'可见节点',String(nodes.length),120,250,j?C.purple:C.blue);metric(c,'路径性质',j?'含切向传播':'单次前向',260,250,j?C.purple:C.blue);metric(c,'耗时结论',j?'仅定性更复杂':'基准路径',430,250,C.ink)}
 else if(id==='5.1'){const titles=['① Euler 回退','② 前后两次预测','③ 构造有限差商','④ 代回、移项、stop-gradient'];for(let i=0;i<4;i++){panel(c,18+i*150,54,135,60,titles[i],s.step>=i?[C.blue,C.orange,C.purple,C.green][i]:C.line);if(i<3)arrow(c,153+i*150,84,166+i*150,84,s.step>i?C.ink:C.line,2)}const body=['z_back = zₜ − vₜΔ\n这是沿轨迹的一阶 Euler 回退','u_now = uθ(zₜ,r,t)\nu_earlier = uθ(z_back,r,t−Δ)','DΔu = (u_now − u_earlier) / Δ\n用差商近似 du/dt','u_target = [vₜΔ + (t−r)sg(u_earlier)]\n                    / (Δ+t−r)'][s.step];body.split('\n').forEach((q,i)=>text(c,q,85,170+i*30,s.step===3?C.green:C.ink,15,i===0?750:600));metric(c,'当前步骤',`${s.step+1}/4`,85,250,C.orange);metric(c,'JVP',s.step<3?'未计算':'中间阶段无需',245,250,C.purple);metric(c,'梯度目标',s.step===3?'仅当前 uθ 分支':'尚未完成',410,250,s.step===3?C.green:C.muted)}
 else if(id==='6.1'){const d=clamp(s.a,.02,1),wv=d/(1+d),wu=1/(1+d),xr=105,xt=535,xBack=xt-(xt-xr)*d;line(c,xr,75,xt,75,C.line,6);line(c,xBack,75,xt,75,C.orange,8);dot(c,xr,75,7,C.green);dot(c,xBack,75,10,C.orange);dot(c,xt,75,9,C.blue);text(c,'r',xr-4,53,C.green);text(c,'t−Δ',xBack-18,53,C.orange);text(c,'t',xt-4,53,C.blue);arrow(c,xt-12,97,xBack+12,97,C.orange,3);text(c,`相对间隔 d=Δ/(t−r)=${d.toFixed(2)}`,201,122,C.orange,13,750);bar(c,'固定锚点 vₜ 的权重',wv,1,58,151,175,C.blue,wv.toFixed(2));bar(c,'较早自预测的权重',wu,1,345,151,175,C.purple,wu.toFixed(2));panel(c,35,195,260,78,'大 Δ 端：靠近 FM',d>.67?C.blue:C.line);text(c,'d=1 时较早分支落到 r：',52,231,C.ink,11,650);text(c,'u(zᵣ,r,r)=vᵣ=vₜ，目标化成 vₜ',52,253,C.blue,11,700);panel(c,325,195,260,78,'小 Δ 端：靠近 MF',d<.33?C.purple:C.line);text(c,'d→0 时固定锚点权重→0，',342,231,C.ink,11,650);text(c,'相邻差商→du/dt，自一致性更难训',342,253,d<.33?C.red:C.purple,11,700)}
 else if(id==='7.1'){
  const t=s.a,dt=.1,t2=t+dt,ph=(x:number)=>x/(1-x),p1=ph(t),p2=ph(t2),dp=p2-p1,x0=62,tw=510,phiMax=9;
  panel(c,24,39,572,96,'原始时间轴 t：窗口长度始终相同',C.blue);
  text(c,`当前区间 [${t.toFixed(2)}, ${t2.toFixed(2)}]`,386,75,C.blue,10,700);
  line(c,x0,89,x0+tw,89,C.line,5);
  for(const v of [0,.2,.4,.6,.8,1]){const x=x0+tw*v;line(c,x,83,x,96,C.muted,1);text(c,v.toFixed(1),x-9,112,C.muted,9,500)}
  const xa=x0+tw*t,xb=x0+tw*t2;
  line(c,xa,89,xb,89,C.blue,10);dot(c,xa,89,7,C.blue);dot(c,xb,89,7,C.blue);
  panel(c,24,146,572,96,'VE 噪声比轴 Φ(t)=t/(1−t)',C.purple);
  text(c,`映射区间 [${p1.toFixed(2)}, ${p2.toFixed(2)}]`,386,182,p2>5?C.red:C.purple,10,700);
  line(c,x0,196,x0+tw,196,C.line,5);
  for(const v of [0,1,2,4,6,9]){const x=x0+tw*v/phiMax;line(c,x,190,x,203,C.muted,1);text(c,String(v),x-4,219,C.muted,9,500)}
  const pa=x0+tw*Math.min(phiMax,p1)/phiMax,pb=x0+tw*Math.min(phiMax,p2)/phiMax;
  line(c,pa,196,pb,196,p2>5?C.red:C.purple,10);dot(c,pa,196,7,C.purple);dot(c,pb,196,7,p2>5?C.red:C.purple);
  metric(c,'固定 Δt',dt.toFixed(2),45,255,C.blue);metric(c,'起点噪声/数据',p1.toFixed(2),173,255,C.purple);metric(c,'终点噪声/数据',p2.toFixed(2),335,255,p2>5?C.red:C.purple);metric(c,'对应 ΔΦ',dp.toFixed(2),500,255,dp>2?C.red:C.orange)
 }
 else if(id==='7.2'){const ve=s.mode==='ve',r=.2,t=.8,q=2,i=2,lin=(t-r)/q**i,ph=(x:number)=>x/(1-x),inv=(x:number)=>x/(1+x),tp=inv(ph(t)-(ph(t)-ph(r))/q**i),d=ve?t-tp:lin,back=t-d;line(c,80,94,540,94,C.line,6);dot(c,80+460*r,94,9,C.green);dot(c,80+460*t,94,9,C.blue);dot(c,80+460*back,94,10,ve?C.purple:C.orange);text(c,'r=.20',80+460*r-20,72,C.green);text(c,'t=.80',80+460*t-18,72,C.blue);text(c,ve?'VE 映回 t′':'线性 t′',80+460*back-31,123,ve?C.purple:C.orange);panel(c,65,153,490,73,ve?'DMF† · VE 坐标缩短':'普通 DMF · 线性时间缩短',ve?C.purple:C.orange);metric(c,'q, i','2, 2',92,181,C.ink);metric(c,'t′',back.toFixed(4),210,181,ve?C.purple:C.orange);metric(c,ve?'Δᵢ†':'Δᵢ',d.toFixed(4),335,181,ve?C.purple:C.orange);metric(c,'CIFAR FID↓',ve?'3.36':'3.58',445,181,ve?C.green:C.orange);text(c,'经验结果：DMF† 更好；这不是 VE 理论最优性的证明。',124,270,C.red,12,700)}
}
function miniCurve(t:number){return{x:55+215*t,y:205-125*t+33*Math.sin(t*Math.PI)}}
function pathMini(c:CanvasRenderingContext2D,ox=0){c.strokeStyle=C.line;c.lineWidth=4;c.beginPath();for(let i=0;i<=40;i++){const p=miniCurve(i/40);i?c.lineTo(p.x+ox,p.y):c.moveTo(p.x+ox,p.y)}c.stroke()}
const jvpSlides = [
  {
    label: 'MeanFlow 恒等式',
    eyebrow: '第一步：先看论文究竟要求什么',
    title: '平均速度等于瞬时速度，加上沿轨迹的变化修正',
    mathml: '<math display="block"><mrow><mi>u</mi><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><mfrac><mi>d</mi><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mi>u</mi><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo></mrow></math>',
    note: '其中真正难直接计算的是紫色的全导数 du/dt：它要求知道网络输出沿生成轨迹如何变化。',
  },
  {
    label: '展开全导数',
    eyebrow: '第二步：用链式法则展开 du/dt',
    title: '状态 zₜ 在移动，时间 t 也在前进；r 保持不变',
    mathml: '<math display="block"><mrow><mfrac><mi>d</mi><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mi>u</mi><mo>=</mo><mfrac><mrow><mi>∂</mi><mi>u</mi></mrow><mrow><mi>∂</mi><msub><mi>z</mi><mi>t</mi></msub></mrow></mfrac><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mo>+</mo><mfrac><mrow><mi>∂</mi><mi>u</mi></mrow><mrow><mi>∂</mi><mi>t</mi></mrow></mfrac></mrow></math>',
    note: '因为 dzₜ/dt=vₜ(zₜ)、dr/dt=0、dt/dt=1，所以这正是 u 对输入方向 (vₜ, 0, 1) 的方向导数。',
  },
  {
    label: 'PyTorch / JVP',
    eyebrow: '第三步：把方向导数交给自动微分',
    title: 'torch.func.jvp 一次得到 uθ 和沿 (vₜ,0,1) 的方向导数',
    code: 'u_value, J_theta = torch.func.jvp(\n  fn,\n  primals=(z_t, r, t),\n  tangents=(v_t, 0, 1),\n)',
    mathml: '<math display="block"><mrow><msub><mi>J</mi><mi>θ</mi></msub><mo>=</mo><mtext>JVP</mtext><mo>[</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>;</mo><mo>(</mo><msub><mi>v</mi><mi>t</mi></msub><mo>,</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>)</mo><mo>]</mo><mo>=</mo><mfrac><mrow><mi>d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac></mrow></math>',
    note: 'JVP 没有显式构造完整 Jacobian；它只计算恒等式需要的这个方向导数。',
  },
  {
    label: '计算代价',
    eyebrow: '第四步：为什么论文还要避免它',
    title: 'JVP 比普通网络前向多了一条贯穿模型的切向传播路径',
    cost: true,
    mathml: '<math display="block"><mrow><msub><mi>u</mi><mtext>target</mtext></msub><mo>=</mo><mi>sg</mi><mo>[</mo><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><msub><mi>J</mi><mi>θ</mi></msub><mo>]</mo></mrow></math>',
    note: '因此连续 MeanFlow 每批训练都要承担 JVP 的额外模型计算。DMF 的中间阶段正是改用有限差分来暂时避开这项成本。',
  },
] as const;

function JvpIdentityWalkthrough({step}:{step:number}) {
  const slide=jvpSlides[step] ?? jvpSlides[0];
  return <section className="jvp-walkthrough" aria-live="polite">
    <ol className="jvp-stage-list" aria-label="从 MeanFlow 恒等式到 JVP 的四步解释">
      {jvpSlides.map((item,index)=><li key={item.label} className={index===step?'selected':index<step?'done':''}><span>{index+1}</span>{item.label}</li>)}
    </ol>
    <div className="jvp-slide">
      <div className="jvp-eyebrow">{slide.eyebrow}</div>
      <h5>{slide.title}</h5>
      {'code' in slide ? <pre className="jvp-code"><code>{slide.code}</code></pre> : null}
      {'cost' in slide ? <div className="jvp-cost-compare"><div><b>普通前向</b><span>输入 → uθ</span><i className="short"/></div><div className="expensive"><b>连续 MF + JVP</b><span>输入 → uθ ＋ 切向传播 → Jθ</span><i className="long"/></div></div> : null}
      <div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:slide.mathml}} />
      <p>{slide.note}</p>
    </div>
  </section>;
}

const dmfDerivationSlides = [
  {
    label: 'Euler 回退',
    eyebrow: '第一步：沿速度方向后退 Δ',
    title: '用一阶 Euler 更新近似较早时刻的状态',
    mathml: '<math display="block"><mrow><msub><mi>z</mi><mrow><mi>t</mi><mo>−</mo><mi>Δ</mi></mrow></msub><mo>≈</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mi>Δ</mi></mrow></math>',
    note: '这是沿概率流轨迹的一阶 Euler 回退，不是让另一个旧模型生成新样本。',
  },
  {
    label: '前后预测',
    eyebrow: '第二步：在两个相邻位置调用同一个网络',
    title: '得到当前位置预测 u_now 与较早位置预测 u_earlier',
    mathml: '<math display="block"><mtable rowspacing="0.8em" columnalign="left"><mtr><mtd><msub><mi>u</mi><mtext>now</mtext></msub><mo>=</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo></mtd></mtr><mtr><mtd><msub><mi>u</mi><mtext>earlier</mtext></msub><mo>=</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><mi>Δ</mi><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>−</mo><mi>Δ</mi><mo>)</mo></mtd></mtr></mtable></math>',
    note: '两次预测共享同一组参数 θ；差别只在于输入状态与时间向后移动了 Δ。',
  },
  {
    label: '有限差商',
    eyebrow: '第三步：用两个预测近似沿轨迹全导数',
    title: '前后输出之差除以 Δ，得到一阶有限差分',
    mathml: '<math display="block"><mrow><mfrac><mrow><mi>d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>≈</mo><mfrac><mrow><msub><mi>u</mi><mtext>now</mtext></msub><mo>−</mo><msub><mi>u</mi><mtext>earlier</mtext></msub></mrow><mi>Δ</mi></mfrac></mrow></math>',
    note: '有限 Δ 时这是近似；当 Δ→0 时，差商趋近连续 MeanFlow 恒等式中的 du/dt。',
  },
  {
    label: '移项得目标',
    eyebrow: '第四步：代回恒等式，并把当前预测移到等式左侧',
    title: '整理后得到可以直接监督 u_now 的 DMF 加权目标',
    mathml: '<math display="block"><mtable rowspacing="0.85em" columnalign="left"><mtr><mtd><mo>(</mo><mi>Δ</mi><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><msub><mi>u</mi><mtext>now</mtext></msub><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mi>Δ</mi><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><msub><mi>u</mi><mtext>earlier</mtext></msub></mtd></mtr><mtr><mtd><msub><mi>u</mi><mtext>target</mtext></msub><mo>=</mo><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><mi>Δ</mi><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>sg</mi><mo>[</mo><msub><mi>u</mi><mtext>earlier</mtext></msub><mo>]</mo></mrow><mrow><mi>Δ</mi><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac></mtd></mtr></mtable></math>',
    note: '较早位置的预测使用 stop-gradient，只作为监督答案；梯度只更新当前位置的 u_now 分支。',
  },
] as const;

function DmfDerivationWalkthrough({step}:{step:number}) {
  const slide=dmfDerivationSlides[step] ?? dmfDerivationSlides[0];
  return <section className="jvp-walkthrough dmf-derivation" aria-live="polite">
    <ol className="jvp-stage-list" aria-label="DMF 加权目标四步推导">
      {dmfDerivationSlides.map((item,index)=><li key={item.label} className={index===step?'selected':index<step?'done':''}><span>{index+1}</span>{item.label}</li>)}
    </ol>
    <div className="jvp-slide">
      <div className="jvp-eyebrow">{slide.eyebrow}</div>
      <h5>{slide.title}</h5>
      <div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:slide.mathml}} />
      <p>{slide.note}</p>
    </div>
  </section>;
}

function DeltaLimitWalkthrough({d}:{d:number}) {
  const bounded=clamp(d,.02,1),wV=bounded/(1+bounded),wEarlier=1/(1+bounded),atMax=bounded>.995,atSmall=bounded<.15;
  const mathml=atMax
    ? '<math display="block"><mtable rowspacing=".65em" columnalign="left"><mtr><mtd><mi>Δ</mi><mo>=</mo><mi>t</mi><mo>−</mo><mi>r</mi></mtd></mtr><mtr><mtd><msub><mi>u</mi><mtext>target</mtext></msub><mo>=</mo><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>u</mi><mo>(</mo><msub><mi>z</mi><mi>r</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>r</mi><mo>)</mo></mrow><mrow><mn>2</mn><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo></mrow></mfrac></mtd></mtr><mtr><mtd><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>[</mo><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mi>u</mi><mo>(</mo><msub><mi>z</mi><mi>r</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>r</mi><mo>)</mo><mo>]</mo></mtd></mtr><mtr><mtd><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><msub><mi>v</mi><mi>r</mi></msub><mo>)</mo><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>=</mo><msub><mi>v</mi><mi>r</mi></msub></mtd></mtr></mtable></math>'
    : `<math display="block"><mtable rowspacing=".65em" columnalign="left"><mtr><mtd><mi>d</mi><mo>=</mo><mfrac><mi>Δ</mi><mrow><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac><mo>=</mo><mn>${bounded.toFixed(2)}</mn></mtd></mtr><mtr><mtd><msub><mi>u</mi><mtext>target</mtext></msub><mo>=</mo><mn>${wV.toFixed(2)}</mn><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mn>${wEarlier.toFixed(2)}</mn><mi>sg</mi><mo>[</mo><msub><mi>u</mi><mtext>earlier</mtext></msub><mo>]</mo></mtd></mtr>${atSmall?'<mtr><mtd><mi>Δ</mi><mo>→</mo><mn>0</mn><mo>:</mo><mspace width=".6em"/><mfrac><mrow><msub><mi>u</mi><mtext>now</mtext></msub><mo>−</mo><msub><mi>u</mi><mtext>earlier</mtext></msub></mrow><mi>Δ</mi></mfrac><mo>→</mo><mfrac><mrow><mi>d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac></mtd></mtr>':''}</mtable></math>`;
  return <section className="jvp-walkthrough delta-limit-walkthrough" aria-live="polite">
    <div className="jvp-slide">
      <div className="jvp-eyebrow">{atMax?'最大间隔：逐行代入':'有限间隔：观察目标权重'}</div>
      <h5>{atMax?'为什么 Δ=t−r 时，DMF 目标就是 FM 目标':atSmall?'为什么 Δ 很小时更接近连续 MeanFlow':'从 FM 到 MF 的过渡目标'}</h5>
      <div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:mathml}}/>
      <p>{atMax?'第一步用边界条件 u(zᵣ,r,r)=vᵣ；第二步用论文的线性条件路径，其配对瞬时速度沿 t 不变，因此 vₜ=vᵣ。最终监督量就是瞬时速度，与 Flow Matching 完全相同。':atSmall?'固定瞬时速度锚点几乎消失，目标主要依赖相邻位置的模型预测；同时有限差商逼近 du/dt，所以更接近连续 MF，也更难稳定训练。':`当前瞬时速度权重为 ${wV.toFixed(2)}，较早自预测权重为 ${wEarlier.toFixed(2)}；缩小 Δ 会逐步把训练责任从可靠的 FM 锚点转向模型自一致性。`}</p>
    </div>
  </section>;
}

const trainingStages = [
  {
    label:'阶段 0 · FM', range:'i = 0', title:'先直接拟合瞬时速度，建立容易且可靠的监督锚点', jvp:'不使用 JVP', difficulty:'容易',
    mathml:'<math display="block"><mrow><msubsup><mi>u</mi><mtext>target</mtext><mn>0</mn></msubsup><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>,</mo><mspace width="1.2em"/><msub><mi>Δ</mi><mn>0</mn></msub><mo>=</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></math>',
    note:'这就是 Flow Matching 的瞬时速度监督。上一组件已经逐行证明：把最大间隔 Δ=t−r 代入 DMF 目标，也会得到同一个 vₜ。',
  },
  {
    label:'中间 · DMF', range:'1 ≤ i ≤ K−2', title:'逐阶段缩小 Δᵢ，用较早预测构造有限差分目标', jvp:'不使用 JVP', difficulty:'逐渐变难',
    mathml:'<math display="block"><mtable rowspacing=".7em" columnalign="left"><mtr><mtd><msub><mi>Δ</mi><mi>i</mi></msub><mo>=</mo><mfrac><mrow><mi>t</mi><mo>−</mo><mi>r</mi></mrow><msup><mi>q</mi><mi>i</mi></msup></mtd></mtr><mtr><mtd><msubsup><mi>u</mi><mtext>target</mtext><mi>i</mi></msubsup><mo>=</mo><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><msub><mi>Δ</mi><mi>i</mi></msub><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>sg</mi><mo>[</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><msub><mi>Δ</mi><mi>i</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>−</mo><msub><mi>Δ</mi><mi>i</mi></msub><mo>)</mo><mo>]</mo></mrow><mrow><msub><mi>Δ</mi><mi>i</mi></msub><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac></mtd></mtr></mtable></math>',
    note:'每升一个阶段就缩小一次 Δᵢ：瞬时速度锚点逐渐减弱，自预测一致性逐渐增强。这里用前后预测的有限差分替代 JVP。第七章再把普通 Δᵢ 调度改成 VE 调度。',
  },
  {
    label:'最终 · MF', range:'i = K−1', title:'最后切回连续 MeanFlow 恒等式，重新启用 JVP', jvp:'重新启用 JVP', difficulty:'最难',
    mathml:'<math display="block"><mrow><msubsup><mi>u</mi><mtext>target</mtext><mrow><mi>K</mi><mo>−</mo><mn>1</mn></mrow></msubsup><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><mi>sg</mi><mo>[</mo><mfrac><mrow><mi>d</mi><msub><mi>u</mi><mi>θ</mi></msub></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>]</mo></mrow></math>',
    note:'这一阶段不再用有限差分，而是直接计算连续全导数 duθ/dt，所以训练重新需要 JVP。准确结论是“中间阶段避免 JVP”，不是“整个课程没有 JVP”。',
  },
] as const;

function ThreeStageTrainingFunction({stage}:{stage:number}) {
  const current=trainingStages[stage]??trainingStages[0];
  return <section className="jvp-walkthrough curriculum-walkthrough" aria-live="polite">
    <ol className="jvp-stage-list" aria-label="论文式 (5) 的三阶段训练函数">
      {trainingStages.map((item,index)=><li key={item.label} className={index===stage?'selected':index<stage?'done':''}><span>{index+1}</span>{item.label}</li>)}
    </ol>
    <div className="jvp-slide">
      <div className="jvp-eyebrow">{current.range}</div>
      <h5>{current.title}</h5>
      <div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:current.mathml}}/>
      <div className="protocol-strip"><span><small>当前阶段</small><b>{current.label}</b></span><span><small>训练难度</small><b>{current.difficulty}</b></span><span><small>导数实现</small><b>{current.jvp}</b></span></div>
      <p>{current.note}</p>
    </div>
  </section>;
}

const noiseRegions={
  low:{label:'低噪声区',r:.1,t:.3},
  mid:{label:'中噪声区',r:.4,t:.6},
  high:{label:'高噪声区',r:.7,t:.9},
} as const;

function VeRegionComparator({mode}:{mode:string}){
  const key=(mode in noiseRegions?mode:'low') as keyof typeof noiseRegions,region=noiseRegions[key],{r,t}=region;
  const phi=(x:number)=>x/(1-x),inv=(x:number)=>x/(1+x),denom=2;
  const sr=phi(r),st=phi(t),sPrime=st-(st-sr)/denom,dLinear=(t-r)/denom,tLinear=t-dLinear,tVe=inv(sPrime),dVe=t-tVe,ratio=dVe/dLinear;
  const linearMath=`<math display="block"><mrow><msub><mi>Δ</mi><mi>i</mi></msub><mo>=</mo><mfrac><mrow><mn>${t.toFixed(2)}</mn><mo>−</mo><mn>${r.toFixed(2)}</mn></mrow><mn>2</mn></mfrac><mo>=</mo><mn>${dLinear.toFixed(4)}</mn></mrow></math>`;
  const veMath=`<math display="block"><mtable columnalign="left" rowspacing=".55em"><mtr><mtd><msup><mi>s</mi><mo>′</mo></msup><mo>=</mo><mi>Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>−</mo><mfrac><mrow><mi>Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>−</mo><mi>Φ</mi><mo>(</mo><mi>r</mi><mo>)</mo></mrow><mn>2</mn></mfrac><mo>=</mo><mn>${sPrime.toFixed(4)}</mn></mtd></mtr><mtr><mtd><msup><mi>t</mi><mo>′</mo></msup><mo>=</mo><msup><mi>Φ</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup><mo>(</mo><msup><mi>s</mi><mo>′</mo></msup><mo>)</mo><mo>=</mo><mn>${tVe.toFixed(4)}</mn><mo>,</mo><mspace width=".8em"/><msubsup><mi>Δ</mi><mi>i</mi><mo>†</mo></msubsup><mo>=</mo><mn>${dVe.toFixed(4)}</mn></mtd></mtr></mtable></math>`;
  return <section className="ve-calculator region-comparator" aria-live="polite">
    <div className="ve-input-summary"><b>{region.label}</b><span>r = {r.toFixed(2)}</span><span>t = {t.toFixed(2)}</span><span>t−r = 0.20</span><span>qⁱ = 2</span></div>
    <div className="region-tracks" aria-label={`${region.label}中普通调度与 VE 调度的回退位置`}>
      <TrackRow label="普通 · 原始 t 轴" r={r} back={tLinear} t={t} backLabel={`t′=${tLinear.toFixed(2)}`} tone="linear"/>
      <TrackRow label="VE 映回 · 原始 t 轴" r={r} back={tVe} t={t} backLabel={`t′=${tVe.toFixed(2)}`} tone="ve"/>
      <div className="local-ve-track"><b>VE 区间局部视图</b><div><i/><mark style={{left:'0%'}}>Φ(r)={sr.toFixed(2)}</mark><mark className="middle" style={{left:'50%'}}>s′={sPrime.toFixed(2)}</mark><mark style={{left:'100%'}}>Φ(t)={st.toFixed(2)}</mark></div><span>在 VE 坐标中始终回退整个区间的一半</span></div>
    </div>
    <div className="ve-calc-grid">
      <article><div className="ve-card-head"><b>普通 DMF</b><strong>Δᵢ = {dLinear.toFixed(4)}</strong></div><div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:linearMath}}/><p>三个区域的原始长度都为 0.2，所以普通调度始终回退 0.1。</p></article>
      <article className="ve-card"><div className="ve-card-head"><b>DMF† · VE 调度</b><strong>Δᵢ† = {dVe.toFixed(4)}</strong></div><div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:veMath}}/><p>先在噪声/数据比坐标回退一半，再用 Φ⁻¹ 映回原始时间。</p></article>
    </div>
    <div className={`ve-comparison ${ratio<.8?'finer':''}`}><b>跨度比例</b><span>Δᵢ† / Δᵢ = {(ratio*100).toFixed(1)}%</span><strong>{key==='high'?'同样缩短 VE 区间的一半，映回后只回退 0.05，比普通 0.10 更细。':key==='mid'?'进入中噪声区后，VE 映回跨度已经缩小到 0.08。':'低噪声区中，两种跨度仍较接近。'}</strong></div>
  </section>
}

function TrackRow({label,r,back,t,backLabel,tone}:{label:string;r:number;back:number;t:number;backLabel:string;tone:'linear'|'ve'}){
  return <div className={`region-track ${tone}`}><b>{label}</b><div><i/><mark className="r" style={{left:`${r*100}%`}}>r={r.toFixed(1)}</mark><mark className="back" style={{left:`${back*100}%`}}>{backLabel}</mark><mark className="t" style={{left:`${t*100}%`}}>t={t.toFixed(1)}</mark></div></div>
}

function ExperimentTable({caption,children,className=''}:{caption:string;children:React.ReactNode;className?:string}){
  return <div className="experiment-table-scroll" tabIndex={0} aria-label={`${caption}，窄屏可横向滚动`}><table className={`experiment-table ${className}`}><caption>{caption}</caption>{children}</table></div>;
}

function EvidenceReading({supports,limits}:{supports:string;limits:string}){
  return <div className="evidence-reading"><article><b>数据支持什么</b><p>{supports}</p></article><article className="limit"><b>不能推出什么</b><p>{limits}</p></article></div>;
}

const cifarRows=[
  {group:'从头训练',method:'iCT',init:'随机初始化',budget:'8k',fid:'2.83',tone:'external'},
  {group:'从头训练',method:'MF（论文复现）',init:'随机初始化',budget:'4k',fid:'3.85',tone:'baseline'},
  {group:'从头训练',method:'MF（Geng et al.）',init:'随机初始化',budget:'16k',fid:'2.90',tone:'external'},
  {group:'DM / FM 初始化',method:'sCT',init:'预训练 DM',budget:'4k + 4k',fid:'2.85',tone:'external'},
  {group:'DM / FM 初始化',method:'ECT',init:'预训练 DM',budget:'4k + 1k',fid:'3.60',tone:'external'},
  {group:'DM / FM 初始化',method:'MF（论文复现）',init:'预训练 FM',budget:'2k + 2k',fid:'3.93',tone:'baseline'},
  {group:'DM / FM 初始化',method:'DMF Curriculum',init:'预训练 FM',budget:'2k + 2k',fid:'3.58',tone:'dmf'},
  {group:'DM / FM 初始化',method:'DMF† Curriculum',init:'预训练 FM',budget:'2k + 2k',fid:'3.36',tone:'dmf best'},
] as const;

function CifarResultsTable(){
  return <section className="experiment-panel">
    <div className="experiment-question"><b>论文问题</b><span>在一步采样下，DMF 课程与论文自己的 MF 对照及既有方法相比处在什么位置？</span></div>
    <div className="table-legend" aria-label="表格分组图例"><span className="external">外部方法</span><span className="baseline">论文 MF 对照</span><span className="dmf">DMF 系列</span></div>
    <ExperimentTable caption="Table 1 · CIFAR-10 comprehensive 1-step FID comparison">
      <thead><tr><th scope="col">类别</th><th scope="col">方法</th><th scope="col">初始化</th><th scope="col">预算（epoch）</th><th scope="col" className="numeric">FID ↓</th></tr></thead>
      <tbody>{cifarRows.map((row,index)=><tr key={`${row.method}-${index}`} className={row.tone}><td>{row.group}</td><th scope="row">{row.method}</th><td>{row.init}</td><td>{row.budget}</td><td className="numeric"><b>{row.fid}</b></td></tr>)}</tbody>
    </ExperimentTable>
    <p className="table-source">† 表示使用 VE-transformed scheduler 的 DMF Curriculum。预算沿用论文的“预训练 + 微调”记法。</p>
    <EvidenceReading supports="在论文自己的 4k 总预算对照中，DMF† 3.36 低于 MF scratch 3.85 和 MF fine-tune 3.93。" limits="不能把 DMF† 写成整张表最优：iCT 2.83、sCT 2.85 和原论文 MF 2.90 都更低，且训练预算与初始化不同。"/>
  </section>;
}

function EfficiencyTables(){
  return <section className="experiment-panel efficiency-panel">
    <div className="efficiency-table-grid">
      <ExperimentTable caption="Table 2 · Per-batch training cost（batch 1024，4×H100）">
        <thead><tr><th scope="col">数据集</th><th scope="col">方法</th><th scope="col" className="numeric">秒 / batch ↓</th></tr></thead>
        <tbody><tr><th scope="row" rowSpan={2}>CIFAR-10</th><td>MF</td><td className="numeric">0.38</td></tr><tr className="dmf"><td>DMF</td><td className="numeric"><b>0.32</b></td></tr><tr><th scope="row" rowSpan={2}>ImageNet 256×256</th><td>MF</td><td className="numeric">3.08</td></tr><tr className="dmf"><td>DMF</td><td className="numeric"><b>1.71</b></td></tr></tbody>
      </ExperimentTable>
      <ExperimentTable caption="Table 3 · CIFAR-10 end-to-end training cost">
        <thead><tr><th scope="col">方法</th><th scope="col">训练构成（epoch）</th><th scope="col" className="numeric">总 epoch</th><th scope="col" className="numeric">H100 GPU-hours ↓</th><th scope="col" className="numeric">FID ↓</th></tr></thead>
        <tbody><tr><th scope="row">MF</th><td>从头训练 4000</td><td className="numeric">4000</td><td className="numeric">85.33</td><td className="numeric">3.85</td></tr><tr className="dmf"><th scope="row">DMF Curriculum</th><td>FM 预训练 2000 + DMF 微调 2000</td><td className="numeric">4000</td><td className="numeric"><b>66.6</b></td><td className="numeric"><b>3.36</b></td></tr></tbody>
      </ExperimentTable>
    </div>
    <div className="derived-metrics"><article><small>CIFAR 每批</small><b>减少 15.8%</b><span>0.38 → 0.32，约 1.19×</span></article><article><small>ImageNet 每批</small><b>减少 44.5%</b><span>3.08 → 1.71，约 1.80×</span></article><article><small>CIFAR 端到端</small><b>减少 22.0%</b><span>85.33 → 66.6，约 1.28×</span></article></div>
    <EvidenceReading supports="在论文报告的硬件和 batch 设置下，DMF 每批更快；Table 3 的两种方案都使用 4000 epoch 数据预算，其中 DMF 为 2000 epoch FM 预训练加 2000 epoch DMF 微调，并同时降低 GPU-hours、改善 FID。" limits="论文没有给出 ImageNet 端到端 GPU-hours，不能由每批时间替代或外推；每批耗时也不能逐项归因给 Table 1 的每种方法。"/>
  </section>;
}

const imageNetRows=[
  {key:'baseline',method:'SiT-XL/2 (Baseline)',epochs:'1400 (Pretrain)',budget:'100.0%',steps:'50',fid:11.52,status:'基线'},
  {key:'6',method:'DMF†',epochs:'1400 + 6',budget:'+0.42%',steps:'1',fid:21.18,status:'稳定'},
  {key:'12',method:'DMF†',epochs:'1400 + 12',budget:'+0.85%',steps:'1',fid:18.03,status:'稳定'},
  {key:'24',method:'DMF†',epochs:'1400 + 24',budget:'+1.71%',steps:'1',fid:16.95,status:'稳定'},
  {key:'48',method:'DMF†',epochs:'1400 + 48',budget:'+3.42%',steps:'1',fid:14.53,status:'最佳稳定一步'},
  {key:'96',method:'DMF†',epochs:'1400 + 96',budget:'+3.42%*',steps:'1',fid:294.13,status:'发散'},
] as const;

const imageNetPlotHeights:Record<string,number>={6:52,12:39,24:34,48:24,96:80};

function ImageNetResultsTable({selected,onSelect}:{selected:string;onSelect:(value:string)=>void}){
  const active=imageNetRows.find(row=>row.key===selected)??imageNetRows[0];
  return <section className="experiment-panel imagenet-results" aria-live="polite">
    <div className="protocol-strip"><span><small>数据</small><b>ImageNet 256×256</b></span><span><small>表示</small><b>SD-VAE latent</b></span><span><small>骨干</small><b>SiT-XL/2</b></span><span><small>采样协议</small><b>无 CFG</b></span><span><small>指标</small><b>FID ↓</b></span></div>
    <div className="imagenet-result-layout">
      <ExperimentTable caption="Table 4 · ImageNet curriculum budget w.r.t. FID">
        <thead><tr><th scope="col">方法</th><th scope="col">训练 epoch</th><th scope="col">相对预算</th><th scope="col" className="numeric">步数</th><th scope="col" className="numeric">FID ↓</th><th scope="col">状态</th></tr></thead>
        <tbody>{imageNetRows.map(row=><tr key={row.key} className={`${row.key===selected?'selected':''} ${row.key==='96'?'unstable':''}`}><th scope="row"><button type="button" aria-pressed={row.key===selected} onClick={()=>onSelect(row.key)}>{row.method}</button></th><td>{row.epochs}</td><td>{row.budget}</td><td className="numeric">{row.steps}</td><td className="numeric"><b>{row.fid.toFixed(2)}</b></td><td>{row.status}</td></tr>)}</tbody>
      </ExperimentTable>
      <div className="budget-plot" aria-label="50 步基线位于底部；6 到 48 epoch 的一步 FID 逐渐下降但始终高于基线；96 epoch 突然发散"><div className="baseline-line"><span>50 步基线 · FID 11.52</span></div>{imageNetRows.slice(1).map(row=><button key={row.key} type="button" className={`${row.key===selected?'selected':''} ${row.key==='96'?'unstable':''}`} aria-pressed={row.key===selected} onClick={()=>onSelect(row.key)}><span>+{row.key} ep</span><i style={{height:`${imageNetPlotHeights[row.key]}%`}}/><b>{row.fid.toFixed(2)}</b>{row.key==='96'?<em>+96 ep · 断轴发散</em>:null}</button>)}</div>
    </div>
    <div className={`budget-reading ${active.key==='96'?'bad':''}`}><b>{active.key==='baseline'?'固定的质量参照':active.key==='96'?'稳定性上限':'当前一步设置'}</b><p>{active.key==='baseline'?'SiT-XL/2 使用 50 步得到 FID 11.52；后续所有一步结果都必须与它同时保留。':active.key==='96'?'96 epoch 在第 5 个课程阶段发散，FID 达到 294.13；更长训练不是自动更好。':`额外 ${active.key} epoch 得到一步 FID ${active.fid.toFixed(2)}。它减少采样步数，但质量仍未超过 50 步基线 11.52。`}</p></div>
    <p className="experiment-boundary">* Table 4 把 +48 与 +96 epoch 的相对预算都写为 +3.42%。页面保留论文原值并标为疑点，不自行改成推测值。</p>
  </section>;
}

const feedback=(id:string,s:S)=>{switch(id){case'1.1':return`t=${s.a.toFixed(2)}：数据占 ${(1-s.a).toFixed(2)}，噪声占 ${s.a.toFixed(2)}；固定配对的 ε−z₀ 箭头没有随 t 改变。`;case'2.1':return s.step===8?'已用 8 次局部查询到达玩具终点；这说明步进机制，不是论文模型误差。':`已执行 ${s.step} 次反向 Euler 更新；当前位置改变后，下一次局部速度也会改变。`;case'2.2':return s.playing?'同步运行中：两侧共享起点和轨迹。':'一次切线大跳留下弯曲残差；多步侧用更多 NFE 追随轨迹。';case'3.1':return`当前区间 [${Math.min(s.a,s.b-.05).toFixed(2)}, ${Math.max(s.b,s.a+.05).toFixed(2)}]：绿色弦由两个端点真实决定，蓝色切线只属于 t 端点。`;case'3.2':return s.playing?'同步比较中：Flow 沿曲线查询，MeanFlow 沿端点弦更新。':'MeanFlow 的一步残差取决于平均速度预测质量，不保证真实模型一定为零。';case'4.1':return['先读恒等式：连续 MeanFlow 的难点集中在沿轨迹全导数 du/dt。','链式法则表明 du/dt 同时包含状态变化项和显式时间变化项。','PyTorch 用 torch.func.jvp 沿 (vₜ,0,1) 方向直接计算这个全导数。','JVP 增加贯穿网络的切向传播计算；DMF 中间阶段用有限差分暂时避开它。'][s.step];case'4.2':return s.mode==='jvp'?'JVP 模式增加切向传播和目标构造；这里只比较路径结构，不虚构独立耗时。':'普通前向只显示输入、网络和输出三节点基准路径。';case'5.1':return['zₜ−vₜΔ 是一阶 Euler 回退，不是生成新样本。','同一个 uθ 在当前与较早位置各预测一次。','两个预测的差商近似沿轨迹全导数。','移项后，较早预测进入 stop-gradient 加权目标。'][s.step];case'6.1':{const d=Math.max(.02,Math.min(1,s.a)),wv=d/(1+d),wu=1/(1+d);return d>.995?'Δ=t−r：DMF 目标 = ½[vₜ+u(zᵣ,r,r)] = ½(vₜ+vᵣ) = vₜ=vᵣ，因此训练监督严格退化为 Flow Matching。':d<.2?`d=${d.toFixed(2)}：固定 vₜ 锚点权重仅 ${wv.toFixed(2)}，较早自预测权重 ${wu.toFixed(2)}；差商逼近 du/dt，目标趋向连续 MF。`:`d=${d.toFixed(2)}：固定锚点权重 ${wv.toFixed(2)}，较早自预测权重 ${wu.toFixed(2)}；这是 FM 与连续 MF 之间的过渡目标。`;}case'7.1':return`当前 t=${s.a.toFixed(2)}：数据系数 1−t=${(1-s.a).toFixed(2)}，噪声系数 t=${s.a.toFixed(2)}，Φ(t)=噪声/数据=${(s.a/(1-s.a)).toFixed(2)}${s.a>.85?'；接近 1 时比例快速增大。':'。'}`;case'7.2':{const ph=(x:number)=>x/(1-x),iv=(x:number)=>x/(1+x),dl=(s.b-s.a)/s.q,tv=iv(ph(s.b)-(ph(s.b)-ph(s.a))/s.q),dv=s.b-tv;return`普通 Δ=${dl.toFixed(4)}，VE Δ†=${dv.toFixed(4)}；VE 跨度是普通跨度的 ${(dv/dl*100).toFixed(1)}%。`;}case'8.1':return'Table 1 的八种方法始终完整显示；请把 FID 与初始化、预算一起比较。';case'8.2':return'Table 3 明确比较相同的 4000 epoch 总数据预算：MF 从头训练 4000，DMF 为 FM 预训练 2000 加 DMF 微调 2000。';case'9.1':{const row=imageNetRows.find(item=>item.key===s.mode)??imageNetRows[0];return row.key==='96'?'96 epoch 在第 5 个课程阶段发散，FID 294.13；红柱使用断轴显示突然增高。':`${row.steps} 步 ${row.method} 的 FID 为 ${row.fid.toFixed(2)}；它仍在底部的 50 步基线 11.52 之上。`;}default:return''}}

function veWindowFeedback(t:number){const phi=(x:number)=>x/(1-x),t2=t+.1,p1=phi(t),p2=phi(t2),dp=p2-p1;return`窗口 [${t.toFixed(2)}, ${t2.toFixed(2)}] 的原始长度始终是 0.10，但噪声/数据比从 ${p1.toFixed(2)} 变到 ${p2.toFixed(2)}，对应 ΔΦ=${dp.toFixed(2)}。原始时间等距不保证 VE 噪声比等距。`}
function veRegionFeedback(mode:string){const key=(mode in noiseRegions?mode:'low') as keyof typeof noiseRegions,{r,t,label}=noiseRegions[key],phi=(x:number)=>x/(1-x),inv=(x:number)=>x/(1+x),dLinear=(t-r)/2,tVe=inv(phi(t)-(phi(t)-phi(r))/2),dVe=t-tVe;return`${label} [${r.toFixed(1)}, ${t.toFixed(1)}]：普通 Δ=${dLinear.toFixed(4)}，VE Δ†=${dVe.toFixed(4)}，VE 跨度是普通跨度的 ${(dVe/dLinear*100).toFixed(1)}%。`}

export const DmfModule:React.FC<WidgetProps>=({moduleId,chapterId})=>{const ref=useRef<HTMLCanvasElement>(null);const[a,setA]=useState(moduleId==='1.1'?.45:moduleId==='3.1'?.25:moduleId==='6.1'?1:moduleId==='7.1'?.1:.55);const[b,setB]=useState(.82);const[q]=useState(2);const[step,setStep]=useState(0);const[mode,setMode]=useState(moduleId==='4.2'?'forward':moduleId==='7.2'?'low':moduleId==='9.1'?'baseline':'default');const[progress,setProgress]=useState(0);const[playing,setPlaying]=useState(false);const raf=useRef<number|null>(null);const s={a,b,q,step,mode,progress,playing};
 const play=useCallback(()=>{if(raf.current)cancelAnimationFrame(raf.current);setProgress(0);setPlaying(true);const st=performance.now();const tick=(now:number)=>{const p=Math.min(1,(now-st)/2300);setProgress(p);if(p<1)raf.current=requestAnimationFrame(tick);else{raf.current=null;setPlaying(false)}};raf.current=requestAnimationFrame(tick)},[]);
 useEffect(()=>()=>{if(raf.current)cancelAnimationFrame(raf.current)},[]);useEffect(()=>{const canvas=ref.current;if(!canvas)return;let c:CanvasRenderingContext2D;try{c=setupCanvas(canvas,W,H)}catch{return}draw(c,moduleId,s);canvas.classList.add('is-ready')},[moduleId,a,b,q,step,mode,progress,playing]);
 const chip=(items:[string,string][],selected=mode,on=(v:string)=>setMode(v))=><div className="chip-row" role="group">{items.map(([v,l])=><button key={v} className={`chip ${selected===v?'selected':''}`} aria-pressed={selected===v} onClick={()=>on(v)}>{l}</button>)}</div>;
 const next=(max:number,labels?:string[])=><div className="step-ctrl"><button className="tiny ghost" disabled={step<=0} onClick={()=>setStep(Math.max(0,step-1))}>上一步</button><span className="step-label">{labels?.[step]??`第 ${step+1}/${max+1} 步`}</span><button className="tiny" disabled={step>=max} onClick={()=>setStep(Math.min(max,step+1))}>下一步</button></div>;
 let controls:React.ReactNode=null;
 if(moduleId==='1.1')controls=<Range label="时间 t" value={a} min={0} max={1} step={.01} on={setA}/>;
 else if(moduleId==='2.1')controls=<div className="step-ctrl"><button className="tiny ghost" disabled={step===0} onClick={()=>setStep(0)}>回到噪声</button><span className="step-label">NFE <b>{step}</b>/8</span><button className="tiny" disabled={step===8} onClick={()=>setStep(step+1)}>走一步</button></div>;
 else if(['2.2','3.2'].includes(moduleId))controls=<div className="step-ctrl"><button className={`tiny ${playing?'selected':''}`} aria-pressed={playing} onClick={play}>{playing?'同步运行中…':'开始 / 再次比较'}</button></div>;
 else if(moduleId==='3.1')controls=<div className="dual-range"><Range label="端点 r" value={a} min={0} max={.72} step={.01} on={setA}/><Range label="端点 t" value={b} min={.28} max={1} step={.01} on={setB}/></div>;
 else if(['4.1','5.1'].includes(moduleId))controls=next(3);
 else if(moduleId==='6.1')controls=<Range label="相对间隔 Δ/(t−r)" value={a} min={.02} max={1} step={.01} on={setA}/>;
 else if(moduleId==='6.2')controls=chip([['0','阶段 0 · FM'],['1','中间 · DMF'],['2','最终 · MF']],String(step),v=>setStep(Number(v)));
 else if(moduleId==='4.2')controls=chip([['forward','普通前向'],['jvp','连续 MF / JVP']]);
 else if(moduleId==='7.1')controls=<Range label="等长窗口起点 t" value={a} min={.05} max={.8} step={.01} on={setA}/>;
 else if(moduleId==='7.2')controls=chip([['low','低噪声 [0.1, 0.3]'],['mid','中噪声 [0.4, 0.6]'],['high','高噪声 [0.7, 0.9]']]);
 const expected=moduleId.startsWith(chapterId.replace('chap-','')+'.');
 const technicalWalkthrough=moduleId==='4.1'?<JvpIdentityWalkthrough step={step}/>:moduleId==='5.1'?<DmfDerivationWalkthrough step={step}/>:moduleId==='6.1'?<DeltaLimitWalkthrough d={a}/>:moduleId==='6.2'?<ThreeStageTrainingFunction stage={step}/>:moduleId==='7.2'?<VeRegionComparator mode={mode}/>:moduleId==='8.1'?<CifarResultsTable/>:moduleId==='8.2'?<EfficiencyTables/>:moduleId==='9.1'?<ImageNetResultsTable selected={mode} onSelect={setMode}/>:null;
 const currentFeedback=moduleId==='6.2'?trainingStages[Math.min(2,step)].note:moduleId==='7.1'?veWindowFeedback(a):moduleId==='7.2'?veRegionFeedback(mode):feedback(moduleId,s);
 return <div className="dmf-widget">{technicalWalkthrough??<canvas ref={ref} aria-hidden="true"/>}{controls}<div className={`feedback ${moduleId==='9.1'&&mode==='96'?'bad':''}`} aria-live="polite">{expected?currentFeedback:'组件编号与章节不一致。'}</div></div>};

function Range({label,value,min,max,step,on}:{label:string;value:number;min:number;max:number;step:number;on:(v:number)=>void}){return <div className="ctrl"><label>{label} <span className="val">{value.toFixed(2)}</span></label><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>on(Number(e.target.value))}/></div>}
export default DmfModule;
