import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawHiker, drawCamp, drawTrail, drawLine, drawDot, drawText } from './cm-kit';
export function Methods(){
  const [method,setMethod]=useState<'CD'|'CT'>('CD');
  const cd=method==='CD';
  return <div>
    <SceneCanvas ariaLabel={cd?'教师路标给出相邻轨迹点，两端预测对齐':'隐藏教师路标，从同一个数据点沿同一噪声方向构造两个输入'} draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,520,280);drawText(ctx,cd?'教师参照':'共享噪声',45,32);drawText(ctx,'两端对齐',575,32);
      drawTrail(ctx,[[105,215],[190,180],[250,194],[330,110],[445,85]],C.light,4);drawCamp(ctx,105,215,.8);drawHiker(ctx,330,110,C.blue,0,.85);
      if(cd){drawLine(ctx,250,166,250,104,C.support,4);ctx.fillStyle=C.support;ctx.beginPath();ctx.moveTo(250,104);ctx.lineTo(300,104);ctx.lineTo(314,117);ctx.lineTo(300,130);ctx.lineTo(250,130);ctx.closePath();ctx.fill();drawLine(ctx,330,110,290,153,C.purple,3);}else{drawLine(ctx,105,215,330,110,C.orange,3);drawDot(ctx,250,147,7,C.orange);}
      if(cd){ctx.strokeStyle=C.light;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(635,195);ctx.bezierCurveTo(680,150,735,170,810,75);ctx.stroke();drawDot(ctx,810,75,9,C.blue);drawLine(ctx,810,75,751,120,C.purple,4);drawDot(ctx,751,120,8,C.orange);}
      else{drawDot(ctx,625,220,8,C.green);drawLine(ctx,625,220,810,75,C.orange,4);drawDot(ctx,810,75,9,C.blue);drawDot(ctx,730,138,8,C.orange);ctx.setLineDash([5,6]);drawLine(ctx,625,220,865,32,C.purple,2);ctx.setLineDash([]);}
      const near=cd?[751,120]:[730,138];drawLine(ctx,810,75,980,148,C.green,3);drawLine(ctx,near[0],near[1],980,148,C.green,3);drawDot(ctx,980,148,13,C.green);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(980,148,21,0,Math.PI*2);ctx.stroke();
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}>{(['CD','CT'] as const).map(m=><button key={m} className={`chip${method===m?' selected':''}`} aria-pressed={method===m} onClick={()=>setMethod(m)}>{m==='CD'?'一致性蒸馏 CD':'独立训练 CT'}</button>)}</div>
    <div>配对输入：{cd?'u = x + tₙ₊₁z；v = u + (tₙ − tₙ₊₁) Φ(u,tₙ₊₁;φ)':'u = x + tₙ₊₁z；v = x + tₙz（共享同一个 x 和 z）'}</div>
    <div>预训练扩散教师 φ：{cd?'需要，用求解器 Φ 近似轨迹邻点':'不需要，直接使用真实数据加噪'}。在线网络 θ 与 EMA 目标网络 θ⁻ 在两种训练中都存在。</div>
    <div className="feedback" role="status" style={{color:C.blue}}>{cd?'CD：教师通过一步 ODE 估计相邻点，学生对齐两端输出。':'CT：同一 x 与同一 z 构造两个噪声水平的输入，不需要教师；有限步下不能把这两点说成严格同一条 PF ODE 轨迹。'}</div>
    <details style={{marginTop:14}}>
      <summary>训练对从哪里来？教师和目标网络有何不同？</summary>
      <p>CD 中，φ 是已经训练好的扩散 score 模型；Φ 是利用它的一步 ODE 求解器。若采用 Euler，Φ(u,t;φ)=−t s_φ(u,t)。目标网络 θ⁻ 则是学生 θ 的 EMA 副本，与扩散教师 φ 是两回事；θ⁻ 分支停止梯度。</p>
      <p>CT 利用条件期望关系：∇log p_t(x_t)=−E[(x_t−x)/t² | x_t]。单对数据给出的 −(x_t−x)/t² 是条件无偏估计，并非逐样本等于真实 score；代入 Euler 后得到共享 x、z 的两端输入。</p>
      <p>定理2要求真实 score、Euler 求解器、光滑性和有界性等条件，给出 L_CD=L_CT+o(Δt)。这是细网格极限下的损失关系，不是有限步训练对完全相同，也不保证任意训练都成功。原文：§4—5，式(6)—(10)、定理2，第4—6页。</p>
    </details>
  </div>;
}
