import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawLine, drawDot, drawText } from './cm-kit';
const online=[0,1,.2,1.2,.6];
const target=online.reduce<number[]>((a,v,i)=>{a.push(i===0?0:.8*a[i-1]+.2*v);return a;},[]);
export function Ema() {
  const [k,setK]=useState(0);
  return <div><SceneCanvas ariaLabel={`EMA第${k}次更新，在线参数${online[k]}，目标参数${target[k].toFixed(4)}`} draw={ctx=>{
    clearScene(ctx);
    const cx=260,cy=145,r=83;
    ctx.strokeStyle=C.border;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.stroke();
    const tip=(v:number,rad:number):[number,number]=>[cx+Math.sin(v*1.9-.8)*rad,cy-Math.cos(v*1.9-.8)*rad];
    const a=tip(online[k],70),b=tip(target[k],92);
    drawLine(ctx,cx,cy,a[0],a[1],C.blue,5);drawDot(ctx,a[0],a[1],7,C.blue);drawDot(ctx,b[0],b[1],10,C.green);drawDot(ctx,cx,cy,7,C.support);
    drawText(ctx,'平滑参照',60,35,C.muted,16);drawText(ctx,'更新历史',590,35,C.text,16);
    drawLine(ctx,610,230,1020,230,C.border,2);drawLine(ctx,610,55,610,230,C.border,2);
    const x=(i:number)=>620+i*95,y=(v:number)=>225-v*125;
    [0,.6,1.2].forEach(v=>drawText(ctx,String(v),596,y(v)+5,C.muted,13,'right'));
    for(let i=0;i<=k;i++){if(i){drawLine(ctx,x(i-1),y(online[i-1]),x(i),y(online[i]),C.blue,3);drawLine(ctx,x(i-1),y(target[i-1]),x(i),y(target[i]),C.green,4);}drawDot(ctx,x(i),y(online[i]),6,C.blue);drawDot(ctx,x(i),y(target[i]),7,C.green);drawText(ctx,String(i),x(i),251,C.muted,14,'center');}
  }}/><div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><button className="chip" onClick={()=>setK(v=>v+1)} disabled={k===4}>更新一次</button><button className="chip" onClick={()=>setK(0)}>重置</button></div>
    <p>第 {k} 次更新　<span style={{color:C.blue}}>在线 θ={online[k].toFixed(4)}</span>　<span style={{color:C.green}}>目标 θ⁻={target[k].toFixed(4)}</span>　μ=0.8</p>
    <p className="feedback" role="status" style={{color:k===4?C.green:C.blue}}>{k===0?'初始时在线与目标参数相同。':k===4?'EMA降低参照的跳动，但 μ 不是越大越好；CT还有离散步数与EMA的联动调度。':'在线参数改变后，目标只移动20%的差距；目标分支停止梯度。'}</p>
    <details style={{marginTop:14}}><summary>训练网格 N、采样次数 NFE 与参数初始化</summary>
      <p>训练将 [ε,T] 分成 N−1 个区间，ε=t₁&lt;…&lt;t_N=T；每次均匀抽取一个相邻区间。N 是训练网格点数，NFE 是生成一次样本时的网络评估次数，二者不相等。</p>
      <p>本文 CT 逐渐增大 N，并联动调整 μ。作者解释：较小 N 相对于 CD 的偏差更大、方差更小，有利于初期快速收敛；较大 N 偏差更小、方差更大，适合训练后期。此处 μ=0.8 的标量实验仅展示平滑，不复现论文完整调度。</p>
      <p>实验中 CD 从预训练 EDM 权重初始化，CT 随机初始化；优化器使用 RAdam，无学习率衰减、warm-up 或 weight decay。这里演示的 EMA 目标网络与实验评估时对在线模型权重另做的 EMA 应区分。原文：§4—5、第4—6页；附录C、第26页。</p>
    </details>
  </div>;
}
