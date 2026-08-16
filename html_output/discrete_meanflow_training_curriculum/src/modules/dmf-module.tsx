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
 else if(id==='6.1'){const d=s.a,wv=d/(1+d),wu=1/(1+d),x=530-390*d;line(c,80,85,530,85,C.line,6);line(c,x,85,530,85,C.orange,8);dot(c,x,85,9,C.orange);dot(c,530,85,9,C.blue);text(c,'t−Δ',x-18,65,C.orange);text(c,'t',526,65,C.blue);bar(c,'vₜΔ 权重',wv,1,75,145,190,C.blue,wv.toFixed(2));bar(c,'sg(u_earlier)(t−r) 权重',wu,1,350,145,190,C.purple,wu.toFixed(2));text(c,'FM',55,225,C.blue);arrow(c,90,220,167,220,C.line,2);text(c,'粗 DMF',177,225,C.orange);arrow(c,239,220,300,220,C.line,2);text(c,'细 DMF',310,225,C.orange);arrow(c,370,220,447,220,C.line,2);text(c,'MF/JVP',457,225,C.green);metric(c,'Δ/(t−r)',d.toFixed(2),95,255,C.orange);metric(c,'自一致性占比',`${(wu*100).toFixed(0)}%`,270,255,C.purple);metric(c,'难度解释',d>.6?'较依赖 vₜ 锚点':d>.2?'过渡区间':'更接近连续极限',435,255,d<.2?C.red:C.ink)}
 else if(id==='7.1'){const t=s.a,data=1-t,noise=t,ratio=noise/data;panel(c,30,42,560,88,'线性路径中的两种系数',C.blue);text(c,'数据系数 1−t',54,84,C.green,12,700);text(c,'噪声系数 t',426,84,C.purple,12,700);c.fillStyle=C.line;c.fillRect(54,98,512,18);c.fillStyle=C.green;c.fillRect(54,98,512*data,18);c.fillStyle=C.purple;c.fillRect(54+512*data,98,512*noise,18);text(c,`${(data*100).toFixed(0)}%`,64,112,'#fff',10,750);text(c,`${(noise*100).toFixed(0)}%`,526,112,'#fff',10,750);panel(c,30,151,560,87,'VE 坐标就是“噪声系数 ÷ 数据系数”',C.purple);text(c,'Φ(t)  =',66,207,C.ink,22,750);text(c,`${noise.toFixed(2)}  ÷  ${data.toFixed(2)}  =  ${ratio.toFixed(2)}`,181,207,ratio>8?C.red:C.purple,23,800);metric(c,'当前 t',t.toFixed(2),65,251,C.blue);metric(c,'数据占比',data.toFixed(2),215,251,C.green);metric(c,'噪声占比',noise.toFixed(2),365,251,C.purple);metric(c,'噪声/数据',ratio.toFixed(2),495,251,ratio>8?C.red:C.orange)}
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

const curriculumSlides = [
  {
    label:'初始化与预算', eyebrow:'训练开始前', title:'从预训练 Flow Model 热启动，并把总预算平均分给 K 个阶段',
    mathml:'<math display="block"><mrow><msub><mi>u</mi><mi>θ</mi></msub><mo>←</mo><msub><mi>v</mi><mi>φ</mi></msub><mo>,</mo><mspace width="1.2em"/><mtext>每阶段预算</mtext><mo>=</mo><mfrac><mtext>总微调预算</mtext><mi>K</mi></mfrac></mrow></math>',
    note:'预训练速度网络已经会做 Flow Matching；课程不是从随机网络同时学习所有难题。',
  },
  {
    label:'阶段 0 · FM', eyebrow:'i = 0', title:'第一阶段直接拟合瞬时速度，建立可靠锚点',
    mathml:'<math display="block"><mrow><msubsup><mi>u</mi><mtext>target</mtext><mn>0</mn></msubsup><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>,</mo><mspace width="1.2em"/><msub><mi>Δ</mi><mn>0</mn></msub><mo>=</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></math>',
    note:'当区间回退覆盖整个 [r,t]，结合边界 u(zᵣ,r,r)=vᵣ，课程起点退化为 Flow Matching；本阶段无需 JVP。',
  },
  {
    label:'中间 · DMF', eyebrow:'1 ≤ i ≤ K−2', title:'逐阶段缩小 Δ，用较早预测构造 stop-gradient 目标',
    mathml:'<math display="block"><mrow><msubsup><mi>u</mi><mtext>target</mtext><mi>i</mi></msubsup><mo>=</mo><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><msub><mi>Δ</mi><mi>i</mi></msub><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>sg</mi><mo>[</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><msub><mi>Δ</mi><mi>i</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>−</mo><msub><mi>Δ</mi><mi>i</mi></msub><mo>)</mo><mo>]</mo></mrow><mrow><msub><mi>Δ</mi><mi>i</mi></msub><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac></mrow></math>',
    note:'这些阶段使用普通 Δᵢ 或 VE 调度 Δᵢ†，均不计算 JVP；这是训练计算节省的主要来源。',
  },
  {
    label:'最终 · MF', eyebrow:'i = K−1', title:'最后切回连续 MeanFlow，重新启用 JVP',
    mathml:'<math display="block"><mrow><msubsup><mi>u</mi><mtext>target</mtext><mrow><mi>K</mi><mo>−</mo><mn>1</mn></mrow></msubsup><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><mi>sg</mi><mo>[</mo><mfrac><mrow><mi>d</mi><msub><mi>u</mi><mi>θ</mi></msub></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>]</mo></mrow></math>',
    note:'因此准确结论是“中间阶段避免 JVP”，而不是“DMF 全程没有 JVP”。',
  },
] as const;

function TrainingCurriculumWalkthrough({step}:{step:number}) {
  const slide=curriculumSlides[step]??curriculumSlides[0];
  return <section className="jvp-walkthrough curriculum-walkthrough" aria-live="polite">
    <div className="training-loop-strip"><span>采样 z₀、ε、r、t</span><b>→</b><span>构造 zₜ、vₜ</span><b>→</b><span>按阶段生成目标</span><b>→</b><span>损失与参数更新</span></div>
    <ol className="jvp-stage-list" aria-label="K 阶段完整训练课程">
      {curriculumSlides.map((item,index)=><li key={item.label} className={index===step?'selected':index<step?'done':''}><span>{index+1}</span>{item.label}</li>)}
    </ol>
    <div className="jvp-slide"><div className="jvp-eyebrow">{slide.eyebrow}</div><h5>{slide.title}</h5><div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:slide.mathml}}/><p>{slide.note}</p></div>
  </section>;
}

function VeDeltaCalculator({r,t,q}:{r:number;t:number;q:number}){
  const phi=(x:number)=>x/(1-x),inv=(x:number)=>x/(1+x);
  const sr=phi(r),st=phi(t),dLinear=(t-r)/q,tLinear=t-dLinear;
  const sPrime=st-(st-sr)/q,tVe=inv(sPrime),dVe=t-tVe;
  const ratio=dVe/dLinear;
  const linearMath=`<math display="block"><mrow><mi>Δ</mi><mo>=</mo><mfrac><mrow><mn>${t.toFixed(2)}</mn><mo>−</mo><mn>${r.toFixed(2)}</mn></mrow><mn>${q.toFixed(2)}</mn></mfrac><mo>=</mo><mn>${dLinear.toFixed(4)}</mn><mo>,</mo><mspace width="1em"/><msup><mi>t</mi><mo>′</mo></msup><mo>=</mo><mn>${tLinear.toFixed(4)}</mn></mrow></math>`;
  const veMath=`<math display="block"><mtable columnalign="left"><mtr><mtd><mi>Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mn>${st.toFixed(4)}</mn><mo>,</mo><mspace width=".8em"/><mi>Φ</mi><mo>(</mo><mi>r</mi><mo>)</mo><mo>=</mo><mn>${sr.toFixed(4)}</mn></mtd></mtr><mtr><mtd><msup><mi>s</mi><mo>′</mo></msup><mo>=</mo><mn>${st.toFixed(4)}</mn><mo>−</mo><mfrac><mrow><mn>${st.toFixed(4)}</mn><mo>−</mo><mn>${sr.toFixed(4)}</mn></mrow><mn>${q.toFixed(2)}</mn></mfrac><mo>=</mo><mn>${sPrime.toFixed(4)}</mn></mtd></mtr><mtr><mtd><msup><mi>t</mi><mo>′</mo></msup><mo>=</mo><msup><mi>Φ</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup><mo>(</mo><msup><mi>s</mi><mo>′</mo></msup><mo>)</mo><mo>=</mo><mn>${tVe.toFixed(4)}</mn><mo>,</mo><mspace width=".8em"/><msup><mi>Δ</mi><mo>†</mo></msup><mo>=</mo><mn>${dVe.toFixed(4)}</mn></mtd></mtr></mtable></math>`;
  return <section className="ve-calculator" aria-live="polite">
    <div className="ve-input-summary"><span>r = {r.toFixed(2)}</span><span>t = {t.toFixed(2)}</span><span>q = {q.toFixed(2)}</span><b>{t>=.7?'高噪声起点':'中低噪声起点'}</b></div>
    <div className="ve-track" aria-label="两种调度在原始时间轴上的回退位置"><i/><mark className="r" style={{left:`${r*100}%`}}>r</mark><mark className="linear" style={{left:`${tLinear*100}%`}}>普通 t′</mark><mark className="ve" style={{left:`${tVe*100}%`}}>VE t′</mark><mark className="t" style={{left:`${t*100}%`}}>t</mark></div>
    <div className="ve-calc-grid">
      <article><div className="ve-card-head"><b>普通 DMF</b><strong>Δ = {dLinear.toFixed(4)}</strong></div><div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:linearMath}}/><p>直接在原始 t 轴回退区间长度的 1/q。</p></article>
      <article className="ve-card"><div className="ve-card-head"><b>DMF† · VE 坐标</b><strong>Δ† = {dVe.toFixed(4)}</strong></div><div className="jvp-math" role="math" dangerouslySetInnerHTML={{__html:veMath}}/><p>先在噪声/数据比值坐标中缩短，再映回原始 t 轴。</p></article>
    </div>
    <div className={`ve-comparison ${ratio<1?'finer':''}`}><b>跨度比较</b><span>VE 跨度是普通跨度的 {(ratio*100).toFixed(1)}%</span><strong>{ratio<.8?'在当前高噪声区域，VE 回退明显更细。':'两种坐标下的回退跨度较接近。'}</strong></div>
    <p className="ve-q-note">这里的 q 表示当前这一次缩短的分母；若课程写成 q₀ⁱ，请把当前阶段的 q₀ⁱ 代入本计算器。</p>
  </section>
}

const cifarResults={
  scratch:{label:'MF scratch',fid:3.85,epochs:'4000',init:'随机初始化',color:'var(--blue)'},
  fine:{label:'MF fine-tune',fid:3.93,epochs:'2000 + 2000',init:'预训练 FM',color:'var(--purple)'},
  dmf:{label:'DMF',fid:3.58,epochs:'2000 + 2000',init:'预训练 FM',color:'var(--orange)'},
  dagger:{label:'DMF†',fid:3.36,epochs:'2000 + 2000',init:'预训练 FM',color:'var(--green)'},
} as const;
function CifarResultsPanel({mode}:{mode:string}){
  const key=(mode in cifarResults?mode:'scratch') as keyof typeof cifarResults,cur=cifarResults[key];
  return <section className="experiment-panel cifar-panel" aria-live="polite">
    <div className="experiment-question"><b>实验问题</b><span>在一步采样、相同 CIFAR-10 评估口径下，课程训练能否改善最终 FID，并降低训练计算？</span></div>
    <div className="protocol-strip"><span><small>当前方法</small><b>{cur.label}</b></span><span><small>初始化</small><b>{cur.init}</b></span><span><small>总训练预算</small><b>{cur.epochs} epoch</b></span><span><small>采样</small><b>1 步</b></span><span><small>FID ↓</small><b style={{color:cur.color}}>{cur.fid.toFixed(2)}</b></span></div>
    <div className="cifar-result-layout">
      <div className="result-bars" aria-label="CIFAR-10 一步 FID 对比">{Object.entries(cifarResults).map(([k,v])=><div key={k} className={k===key?'selected':''}><span>{v.label}</span><i><em style={{width:`${v.fid/4.1*100}%`,background:v.color}}/></i><b style={{color:v.color}}>{v.fid.toFixed(2)}</b></div>)}</div>
      <div className="efficiency-stack"><article><small>单批训练时间</small><b>0.38 → 0.32 秒/批</b><span>MF → DMF，越低越快</span></article><article><small>端到端训练计算</small><b>85.33 → 66.6 H100 GPU-hours</b><span>MF scratch → DMF curriculum</span></article></div>
    </div>
    <p className="experiment-boundary">FID 条形图比较四种一步生成方法；右侧效率数字对应论文报告的 MF 与 DMF 训练成本，不能逐项归因于当前选中的每一种方法。</p>
  </section>
}

const imageNetBudgets={
  6:{fid:21.18,budget:'+0.42%',status:'稳定',stage:'低预算课程起点'},
  12:{fid:18.03,budget:'+0.85%',status:'稳定',stage:'继续课程微调'},
  24:{fid:16.95,budget:'+1.71%',status:'稳定',stage:'继续课程微调'},
  48:{fid:14.53,budget:'+3.42%',status:'稳定最佳',stage:'报告中最佳稳定设置'},
  96:{fid:294.13,budget:'论文表仍写 +3.42%*',status:'发散',stage:'第 5 个课程阶段失稳'},
} as const;
function ImageNetBudgetPanel({epochs}:{epochs:number}){
  const key=(epochs in imageNetBudgets?epochs:6) as keyof typeof imageNetBudgets,cur=imageNetBudgets[key],bad=key===96;
  return <section className={`experiment-panel imagenet-panel ${bad?'unstable':''}`} aria-live="polite">
    <div className="experiment-question"><b>实验问题</b><span>能否用很少的额外微调，把预训练 1400 epoch、50 步采样的 SiT-XL/2 改造成一步 DMF†？额外预算继续增加是否始终更好？</span></div>
    <div className="conversion-flow"><article><small>固定起点</small><b>SiT-XL/2</b><span>预训练 1400 epoch<br/>50 步 FID 11.52</span></article><i>+</i><article className="selected-budget"><small>选择的额外微调</small><b>+{key} epoch</b><span>{cur.stage}<br/>{cur.budget}</span></article><i>→</i><article className={bad?'bad-output':''}><small>得到的一步模型</small><b>FID {cur.fid.toFixed(2)}</b><span>DMF† · 无 CFG<br/>{cur.status}</span></article></div>
    <div className="budget-table" role="table" aria-label="ImageNet 额外微调预算与一步 FID"><div className="budget-row header" role="row"><span>额外微调</span><span>一步 FID ↓</span><span>训练状态</span></div>{Object.entries(imageNetBudgets).map(([ep,v])=><div key={ep} className={`budget-row ${Number(ep)===key?'selected':''} ${ep==='96'?'bad':''}`} role="row"><span>+{ep} epoch</span><span>{v.fid.toFixed(2)}</span><span>{v.status}</span></div>)}</div>
    <div className={`budget-reading ${bad?'bad':''}`}><b>{bad?'为什么 96 epoch 不是“训练得更充分”？':'这组数字应该怎样读？'}</b><p>{bad?'96 epoch 运行进入差分间隔过细的第 5 个课程阶段后发散，FID 跃升到 294.13；它说明存在稳定性上限。':`论文中 6→48 epoch 的一步 FID 随额外微调增加而改善；当前选择 +${key} epoch，对应 FID ${cur.fid.toFixed(2)}。固定参照的 50 步 SiT FID 11.52 仍更低；这里换来的是 1 步采样，不是质量胜出。`}</p></div>
    <p className="experiment-boundary">按钮表示五种“总额外微调预算”的实验设置，不是让同一模型在页面中继续累加训练。* 论文表把 96 epoch 的相对预算也写成 +3.42%，与 48 epoch 重复，因此页面保留原表并标记疑点。</p>
  </section>
}

const feedback=(id:string,s:S)=>{switch(id){case'1.1':return`t=${s.a.toFixed(2)}：数据占 ${(1-s.a).toFixed(2)}，噪声占 ${s.a.toFixed(2)}；固定配对的 ε−z₀ 箭头没有随 t 改变。`;case'2.1':return s.step===8?'已用 8 次局部查询到达玩具终点；这说明步进机制，不是论文模型误差。':`已执行 ${s.step} 次反向 Euler 更新；当前位置改变后，下一次局部速度也会改变。`;case'2.2':return s.playing?'同步运行中：两侧共享起点和轨迹。':'一次切线大跳留下弯曲残差；多步侧用更多 NFE 追随轨迹。';case'3.1':return`当前区间 [${Math.min(s.a,s.b-.05).toFixed(2)}, ${Math.max(s.b,s.a+.05).toFixed(2)}]：绿色弦由两个端点真实决定，蓝色切线只属于 t 端点。`;case'3.2':return s.playing?'同步比较中：Flow 沿曲线查询，MeanFlow 沿端点弦更新。':'MeanFlow 的一步残差取决于平均速度预测质量，不保证真实模型一定为零。';case'4.1':return['先读恒等式：连续 MeanFlow 的难点集中在沿轨迹全导数 du/dt。','链式法则表明 du/dt 同时包含状态变化项和显式时间变化项。','PyTorch 用 torch.func.jvp 沿 (vₜ,0,1) 方向直接计算这个全导数。','JVP 增加贯穿网络的切向传播计算；DMF 中间阶段用有限差分暂时避开它。'][s.step];case'4.2':return s.mode==='jvp'?'JVP 模式增加切向传播和目标构造；这里只比较路径结构，不虚构独立耗时。':'普通前向只显示输入、网络和输出三节点基准路径。';case'5.1':return['zₜ−vₜΔ 是一阶 Euler 回退，不是生成新样本。','同一个 uθ 在当前与较早位置各预测一次。','两个预测的差商近似沿轨迹全导数。','移项后，较早预测进入 stop-gradient 加权目标。'][s.step];case'6.1':return['训练前：从预训练 Flow Model 初始化 uθ，并把总微调预算平均分给 K 个阶段。','阶段 0：目标就是 vₜ，先巩固 Flow Matching 锚点，不使用 JVP。','中间阶段：逐步缩小 Δ，用 stop-gradient 的较早预测构造目标，不使用 JVP。','最终阶段：切回连续 MeanFlow 恒等式，重新启用 JVP。'][s.step];case'7.1':return`当前 t=${s.a.toFixed(2)}：数据系数 1−t=${(1-s.a).toFixed(2)}，噪声系数 t=${s.a.toFixed(2)}，Φ(t)=噪声/数据=${(s.a/(1-s.a)).toFixed(2)}${s.a>.85?'；接近 1 时比例快速增大。':'。'}`;case'7.2':{const ph=(x:number)=>x/(1-x),iv=(x:number)=>x/(1+x),dl=(s.b-s.a)/s.q,tv=iv(ph(s.b)-(ph(s.b)-ph(s.a))/s.q),dv=s.b-tv;return`普通 Δ=${dl.toFixed(4)}，VE Δ†=${dv.toFixed(4)}；VE 跨度是普通跨度的 ${(dv/dl*100).toFixed(1)}%。`;}case'8.1':return`当前选中 ${cifarResults[(s.mode in cifarResults?s.mode:'scratch') as keyof typeof cifarResults].label}；FID 图、协议与选择状态同步更新，效率卡保持独立布局。`;case'8.2':return s.step===96?'96 epoch 不是更优结果：运行在第 5 个课程阶段发散，FID 升至 294.13。':`选择的是总额外微调预算 +${s.step} epoch；页面同时保留 50 步 SiT FID 11.52，提醒一步结果换取的是采样步数。`;default:return''}}

export const DmfModule:React.FC<WidgetProps>=({moduleId,chapterId})=>{const ref=useRef<HTMLCanvasElement>(null);const[a,setA]=useState(moduleId==='1.1'?.45:moduleId==='3.1'?.25:moduleId==='7.2'?.2:moduleId==='7.1'?.65:.55);const[b,setB]=useState(moduleId==='7.2'?.8:.82);const[q,setQ]=useState(2);const[step,setStep]=useState(moduleId==='8.2'?6:0);const[mode,setMode]=useState(moduleId==='4.2'?'forward':moduleId==='8.1'?'scratch':'default');const[progress,setProgress]=useState(0);const[playing,setPlaying]=useState(false);const raf=useRef<number|null>(null);const s={a,b,q,step,mode,progress,playing};
 const play=useCallback(()=>{if(raf.current)cancelAnimationFrame(raf.current);setProgress(0);setPlaying(true);const st=performance.now();const tick=(now:number)=>{const p=Math.min(1,(now-st)/2300);setProgress(p);if(p<1)raf.current=requestAnimationFrame(tick);else{raf.current=null;setPlaying(false)}};raf.current=requestAnimationFrame(tick)},[]);
 useEffect(()=>()=>{if(raf.current)cancelAnimationFrame(raf.current)},[]);useEffect(()=>{const canvas=ref.current;if(!canvas)return;let c:CanvasRenderingContext2D;try{c=setupCanvas(canvas,W,H)}catch{return}draw(c,moduleId,s);canvas.classList.add('is-ready')},[moduleId,a,b,q,step,mode,progress,playing]);
 const chip=(items:[string,string][],selected=mode,on=(v:string)=>setMode(v))=><div className="chip-row" role="group">{items.map(([v,l])=><button key={v} className={`chip ${selected===v?'selected':''}`} aria-pressed={selected===v} onClick={()=>on(v)}>{l}</button>)}</div>;
 const next=(max:number,labels?:string[])=><div className="step-ctrl"><button className="tiny ghost" disabled={step<=0} onClick={()=>setStep(Math.max(0,step-1))}>上一步</button><span className="step-label">{labels?.[step]??`第 ${step+1}/${max+1} 步`}</span><button className="tiny" disabled={step>=max} onClick={()=>setStep(Math.min(max,step+1))}>下一步</button></div>;
 let controls:React.ReactNode=null;
 if(moduleId==='1.1')controls=<Range label="时间 t" value={a} min={0} max={1} step={.01} on={setA}/>;
 else if(moduleId==='2.1')controls=<div className="step-ctrl"><button className="tiny ghost" disabled={step===0} onClick={()=>setStep(0)}>回到噪声</button><span className="step-label">NFE <b>{step}</b>/8</span><button className="tiny" disabled={step===8} onClick={()=>setStep(step+1)}>走一步</button></div>;
 else if(['2.2','3.2'].includes(moduleId))controls=<div className="step-ctrl"><button className={`tiny ${playing?'selected':''}`} aria-pressed={playing} onClick={play}>{playing?'同步运行中…':'开始 / 再次比较'}</button></div>;
 else if(moduleId==='3.1')controls=<div className="dual-range"><Range label="端点 r" value={a} min={0} max={.72} step={.01} on={setA}/><Range label="端点 t" value={b} min={.28} max={1} step={.01} on={setB}/></div>;
 else if(['4.1','5.1','6.1'].includes(moduleId))controls=next(3);
 else if(moduleId==='4.2')controls=chip([['forward','普通前向'],['jvp','连续 MF / JVP']]);
 else if(moduleId==='7.1')controls=<Range label="同一个时间 t" value={a} min={.05} max={.96} step={.01} on={setA}/>;
 else if(moduleId==='7.2')controls=<div className="ve-calc-controls"><Range label="区间终点 r" value={a} min={.02} max={Math.max(.07,b-.05)} step={.01} on={setA}/><Range label="高噪声起点 t" value={b} min={Math.min(.91,a+.05)} max={.96} step={.01} on={setB}/><Range label="缩小分母 q" value={q} min={1.5} max={8} step={.5} on={setQ}/></div>;
 else if(moduleId==='8.1')controls=chip([['scratch','MF scratch'],['fine','MF fine-tune'],['dmf','DMF'],['dagger','DMF†']]);
 else if(moduleId==='8.2')controls=chip([[6,'+6 ep'],[12,'+12 ep'],[24,'+24 ep'],[48,'+48 ep'],[96,'+96 ep']].map(([v,l])=>[String(v),String(l)]),String(step),v=>setStep(Number(v)));
 const expected=moduleId.startsWith(chapterId.replace('chap-','')+'.');const technicalWalkthrough=moduleId==='4.1'?<JvpIdentityWalkthrough step={step}/>:moduleId==='5.1'?<DmfDerivationWalkthrough step={step}/>:moduleId==='6.1'?<TrainingCurriculumWalkthrough step={step}/>:moduleId==='7.2'?<VeDeltaCalculator r={a} t={b} q={q}/>:moduleId==='8.1'?<CifarResultsPanel mode={mode}/>:moduleId==='8.2'?<ImageNetBudgetPanel epochs={step}/>:null;return <div className="dmf-widget">{technicalWalkthrough??<canvas ref={ref} aria-hidden="true"/>}{controls}<div className={`feedback ${moduleId==='8.2'&&step===96?'bad':moduleId==='8.1'&&mode==='dagger'?'good':''}`} aria-live="polite">{expected?feedback(moduleId,s):'组件编号与章节不一致。'}</div></div>};

function Range({label,value,min,max,step,on}:{label:string;value:number;min:number;max:number;step:number;on:(v:number)=>void}){return <div className="ctrl"><label>{label} <span className="val">{value.toFixed(2)}</span></label><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>on(Number(e.target.value))}/></div>}
export default DmfModule;
